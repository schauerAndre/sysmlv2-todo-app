# Contract: sysmlTaskWriter additions (addTask, deleteTask, nextTaskId)

Extends `specs/001-task-panel-redesign/contracts/sysml-task-writer.md` (`patchTask` unchanged).

## `nextTaskId(fileText: string): string`

Scans `fileText` for every `// @id: (TASK-\d+)` marker, returns the next sequential id (e.g. if the highest existing is `TASK-002`, returns `"TASK-003"`). Returns `"TASK-001"` if none exist.

## `addTask(fileText: string, task: { id: string; title: string; description: string; createdAt: string; updatedAt: string }): string`

**Behavior**:
1. Build the new block:
   ```
       // @id: <task.id>
       occurrence <varName> : Task {
           :>> id = "<task.id>";
           :>> title = "<escaped title>";
           :>> description = "<escaped description>";
           :>> status = TaskStatus::open;
           :>> priority = TaskPriority::medium;
           :>> createdAt = "<createdAt>";
           :>> updatedAt = "<updatedAt>";
       }
   ```
   `varName` is derived from `task.id` (`TASK-003` -> `task003`), matching the existing `task001`/`task002` convention.
2. Insert that block immediately before the `// @id: LIST-001` comment (i.e., before the list occurrence, after the last existing task block) — preserving "all tasks declared before the list that references them."
3. Rewrite the `occurrence :>> tasks = (...);` line inside the list block to append `, <varName>` before the closing `)`.
4. Return the modified file text. Every other line stays byte-for-byte identical.

**Errors**: throws if the `// @id: LIST-001` anchor or the `tasks = (...);` line can't be found (malformed file) — never guesses a fallback insertion point.

## `deleteTask(fileText: string, taskId: string): string`

**Behavior**:
1. Locate `// @id: <taskId>` + its `occurrence <varName> : Task { ... }` block (same locator `patchTask` uses) and remove the whole block, including its `// @id:` comment line and surrounding blank-line convention consistent with the rest of the file.
2. Remove `<varName>` from the `occurrence :>> tasks = (...);` tuple wherever it appears (first/middle/last position), collapsing the surrounding commas correctly (no `(, task002)` or `(task002, )` artifacts).
3. Return the modified file text.

**Errors**: throws `Task ${taskId} not found` if no matching block exists (same error shape as `patchTask`).

## Test cases (added to tests/sysml-task-writer.test.js)

1. `addTask` on the real current file produces a new block with the next sequential id, positioned before `backlog`, and `backlog`'s `tasks` tuple includes the new var name appended last.
2. `addTask` twice in a row (simulating two sequential creates against the writer's own output) produces two distinct, non-colliding ids.
3. `deleteTask` for `TASK-002` (last in the tuple) removes its block and leaves `(task001)`.
4. `deleteTask` for `TASK-001` (first in the tuple, with `TASK-002` still present) leaves `(task002)`, not `(, task002)`.
5. `deleteTask` for an unknown id throws `Task TASK-999 not found`.
6. `nextTaskId` on a file with only `TASK-001`/`TASK-002` returns `"TASK-003"`.
