export type TaskField = "status" | "priority" | "updatedAt";

const ENUM_TYPE_BY_FIELD: Partial<Record<TaskField, string>> = {
  status: "TaskStatus",
  priority: "TaskPriority",
};

function taskBlockRegExp(taskId: string): RegExp {
  return new RegExp(
    `(\\/\\/ @id: ${taskId}\\s*\\n\\s*#task occurrence (\\w+)\\s*\\{)([\\s\\S]*?)(\\n\\s*\\};?)`
  );
}

/**
 * Rewrites exactly one `:>> <field> = ...;` line inside the named task's
 * occurrence block in data/02-task-list-specification.sysml's text, leaving
 * every other byte of the file unchanged. See
 * specs/001-task-panel-redesign/contracts/sysml-task-writer.md.
 */
export function patchTask(fileText: string, taskId: string, field: TaskField, value: string): string {
  const blockMatch = taskBlockRegExp(taskId).exec(fileText);
  if (!blockMatch) {
    throw new Error(`Task ${taskId} not found`);
  }

  const [fullBlock, open, , body, close] = blockMatch;
  const enumType = ENUM_TYPE_BY_FIELD[field];
  const newValueLiteral = enumType ? `${enumType}::${value}` : `"${value}"`;

  const fieldLineRe = new RegExp(`(:>>\\s*${field}\\s*=\\s*)(?:\\w+::\\w+|"[^"]*")(;)`);
  if (!fieldLineRe.test(body)) {
    throw new Error(`Field ${field} not found on task ${taskId}`);
  }
  const newBody = body.replace(fieldLineRe, `$1${newValueLiteral}$2`);

  const newBlock = `${open}${newBody}${close}`;
  return fileText.slice(0, blockMatch.index) + newBlock + fileText.slice(blockMatch.index + fullBlock.length);
}

export interface NewTaskInput {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

function escapeSysmlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function varNameForTaskId(taskId: string): string {
  const match = /^TASK-(\d+)$/.exec(taskId);
  if (!match) {
    throw new Error(`Unexpected task id format: ${taskId}`);
  }
  return `task${match[1]}`;
}

/**
 * Returns the next sequential TASK-NNN id based on the highest `// @id:
 * TASK-NNN` marker actually present in fileText -- never based on the
 * (possibly stale) generated JSON or in-memory model. See
 * specs/002-create-delete-tasks/research.md Decision 2.
 */
export function nextTaskId(fileText: string): string {
  const ids = [...fileText.matchAll(/\/\/ @id: TASK-(\d+)/g)].map((m) => parseInt(m[1], 10));
  const next = ids.length ? Math.max(...ids) + 1 : 1;
  return `TASK-${String(next).padStart(3, "0")}`;
}

interface TasksTupleMatch {
  index: number;
  full: string;
  prefix: string;
  suffix: string;
  varNames: string[];
}

/**
 * Finds every `occurrence :>> tasks = (...);` tuple in the file -- one per
 * TodoList. Earlier versions of addTask/deleteTask only ever looked at the
 * *first* match in the whole file via a non-global regex, which is correct
 * for this demo's single list but silently corrupts (or leaves dangling
 * references in) any other list once a second TodoList exists.
 */
function findAllTasksTuples(fileText: string): TasksTupleMatch[] {
  const re = /(occurrence :>> tasks = \()([^)]*)(\);)/g;
  const matches: TasksTupleMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(fileText))) {
    matches.push({
      index: m.index,
      full: m[0],
      prefix: m[1],
      suffix: m[3],
      varNames: m[2]
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    });
  }
  return matches;
}

function replaceTasksTuple(fileText: string, tuple: TasksTupleMatch, newVarNames: string[]): string {
  const replacement = tuple.prefix + newVarNames.join(", ") + tuple.suffix;
  return fileText.slice(0, tuple.index) + replacement + fileText.slice(tuple.index + tuple.full.length);
}

/**
 * Rewrites the *single* tasks tuple in the file. Throws if there's more than
 * one TodoList (ambiguous which one a new task should join, with no
 * list-picker in the UI yet -- see specs/002-create-delete-tasks/research.md)
 * rather than silently picking the first and leaving the others untouched.
 */
function rewriteTheOnlyTasksTuple(fileText: string, transform: (varNames: string[]) => string[]): string {
  const tuples = findAllTasksTuples(fileText);
  if (tuples.length === 0) {
    throw new Error("Could not find the list's `occurrence :>> tasks = (...);` line");
  }
  if (tuples.length > 1) {
    throw new Error(
      `Found ${tuples.length} TodoLists; addTask doesn't support choosing a target list yet -- add the task manually to the intended list's tasks tuple`
    );
  }
  return replaceTasksTuple(fileText, tuples[0], transform(tuples[0].varNames));
}

/**
 * Rewrites whichever tasks tuple actually contains varName -- unlike
 * rewriteTheOnlyTasksTuple, this is safe with multiple lists since deletion
 * doesn't need to choose a list, only find the one the task already belongs
 * to. If no tuple contains it (a pre-existing dangling reference), leaves
 * all tuples untouched rather than guessing.
 */
function rewriteTasksTupleContaining(fileText: string, varName: string, transform: (varNames: string[]) => string[]): string {
  const tuples = findAllTasksTuples(fileText);
  const owner = tuples.find((t) => t.varNames.includes(varName));
  if (!owner) {
    return fileText;
  }
  return replaceTasksTuple(fileText, owner, transform(owner.varNames));
}

/**
 * Inserts a new task occurrence immediately before the list's `// @id:
 * LIST-...` block (preserving "tasks declared before the list that
 * references them") and appends its variable name to the list's `tasks =
 * (...);` tuple. See specs/002-create-delete-tasks/contracts/sysml-task-writer.md.
 */
export function addTask(fileText: string, task: NewTaskInput): string {
  if (!task.title.trim()) {
    throw new Error("Task title must not be empty");
  }
  const varName = varNameForTaskId(task.id);

  const listAnchorRe = /\/\/ @id: LIST-\d+/;
  const anchorMatch = listAnchorRe.exec(fileText);
  if (!anchorMatch) {
    throw new Error("Could not find a `// @id: LIST-...` anchor to insert the new task before");
  }
  const lineStart = fileText.lastIndexOf("\n", anchorMatch.index) + 1;

  const indent = "    ";
  const newBlock =
    `${indent}// @id: ${task.id}\n` +
    `${indent}#task occurrence ${varName} {\n` +
    `${indent}    :>> id = "${escapeSysmlString(task.id)}";\n` +
    `${indent}    :>> title = "${escapeSysmlString(task.title)}";\n` +
    `${indent}    :>> description = "${escapeSysmlString(task.description)}";\n` +
    `${indent}    :>> status = TaskStatus::open;\n` +
    `${indent}    :>> priority = TaskPriority::medium;\n` +
    `${indent}    :>> createdAt = "${escapeSysmlString(task.createdAt)}";\n` +
    `${indent}    :>> updatedAt = "${escapeSysmlString(task.updatedAt)}";\n` +
    `${indent}}\n\n`;

  const withNewBlock = fileText.slice(0, lineStart) + newBlock + fileText.slice(lineStart);
  return rewriteTheOnlyTasksTuple(withNewBlock, (vars) => [...vars, varName]);
}

/**
 * Removes the named task's whole occurrence block (plus the blank line that
 * preceded it, so spacing between the surrounding blocks stays a single
 * blank line) and drops its variable name from the list's `tasks = (...);`
 * tuple, wherever it appears.
 */
export function deleteTask(fileText: string, taskId: string): string {
  const blockRe = new RegExp(
    `\\n\\s*\\n(\\s*\\/\\/ @id: ${taskId}\\s*\\n\\s*#task occurrence (\\w+)\\s*\\{[\\s\\S]*?\\n\\s*\\};?)`
  );
  const match = blockRe.exec(fileText);
  if (!match) {
    throw new Error(`Task ${taskId} not found`);
  }
  const varName = match[2];
  const withoutBlock = fileText.slice(0, match.index) + fileText.slice(match.index + match[0].length);

  return rewriteTasksTupleContaining(withoutBlock, varName, (vars) => vars.filter((v) => v !== varName));
}
