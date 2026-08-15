/**
 * The actual file-write + extractor-invocation pipeline behind editTask/
 * createTask/deleteTask, deliberately free of any "vscode" import. Every
 * piece of it (fs, child_process, sysmlTaskWriter) is plain Node, so this
 * module can be integration-tested with real files and a real
 * `parser/extract.js` invocation in tests/task-operations.test.js -- closing
 * a real gap: until now, only the pure text-transform functions in
 * sysmlTaskWriter.ts had test coverage; the read-patch-write-extract
 * pipeline in taskPanelProvider.ts itself had never actually been exercised
 * end-to-end, only mocked (tests/webview-harness.js mocks the whole host
 * side, so it never touches this code at all).
 */
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import { patchTask, addTask, deleteTask as removeTaskFromFile, nextTaskId, TaskField } from "./sysmlTaskWriter";

export interface OperationResult {
  ok: boolean;
  error?: string;
  validation?: boolean;
}

export function dataFilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, "data", "02-task-list-specification.sysml");
}

export function generatedJsonPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, "generated", "todo-model.generated.json");
}

/**
 * Runs parser/extract.js via the extension host's own Node runtime
 * (process.execPath + ELECTRON_RUN_AS_NODE) instead of shelling out to a
 * `node` binary resolved from PATH. The extension host's environment does
 * not reliably inherit an interactive shell's PATH (a common cause of
 * "works in a terminal, silently fails from the extension" on Windows), so
 * this avoids depending on `node` being resolvable at all. Outside a real
 * Electron host (e.g. under `node --test`), process.execPath is just the
 * `node` binary running the test itself, and ELECTRON_RUN_AS_NODE is
 * harmlessly ignored -- so this same function is exercised for real by the
 * integration tests, not a stand-in.
 */
export function runExtractor(workspaceRoot: string): Promise<OperationResult> {
  return new Promise((resolve) => {
    const parserDir = path.join(workspaceRoot, "parser");
    const extractScript = path.join(parserDir, "extract.js");
    cp.execFile(
      process.execPath,
      [extractScript],
      { cwd: parserDir, env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } },
      (error, _stdout, stderr) => {
        if (error) {
          resolve({ ok: false, error: (stderr && stderr.trim()) || error.message });
        } else {
          resolve({ ok: true });
        }
      }
    );
  });
}

export async function editTaskOperation(
  workspaceRoot: string,
  taskId: string,
  field: TaskField,
  value: string
): Promise<OperationResult> {
  const file = dataFilePath(workspaceRoot);
  try {
    const current = fs.readFileSync(file, "utf8");
    const withField = patchTask(current, taskId, field, value);
    const patched = patchTask(withField, taskId, "updatedAt", new Date().toISOString());
    fs.writeFileSync(file, patched, "utf8");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return runExtractor(workspaceRoot);
}

export async function createTaskOperation(workspaceRoot: string, title: string): Promise<OperationResult> {
  if (!title.trim()) {
    return { ok: false, validation: true, error: "Task title must not be empty" };
  }
  const file = dataFilePath(workspaceRoot);
  try {
    const current = fs.readFileSync(file, "utf8");
    const id = nextTaskId(current);
    const now = new Date().toISOString();
    const withNewTask = addTask(current, { id, title, description: "", createdAt: now, updatedAt: now });
    fs.writeFileSync(file, withNewTask, "utf8");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return runExtractor(workspaceRoot);
}

export async function deleteTaskOperation(workspaceRoot: string, taskId: string): Promise<OperationResult> {
  const file = dataFilePath(workspaceRoot);
  try {
    const current = fs.readFileSync(file, "utf8");
    const withoutTask = removeTaskFromFile(current, taskId);
    fs.writeFileSync(file, withoutTask, "utf8");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return runExtractor(workspaceRoot);
}
