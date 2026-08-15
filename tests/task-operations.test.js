"use strict";
/**
 * Real end-to-end integration tests for vscode-extension/src/taskOperations.ts
 * (compiled to out/taskOperations.js) -- the actual read/patch/write/
 * re-extract pipeline behind the panel's edit/create/delete flows.
 *
 * Unlike tests/sysml-task-writer.test.js (pure text-transform functions) and
 * tests/webview-harness.js (mocks the entire host side, never touches this
 * code), this test copies the real spec/data/parser files into a temp
 * directory and runs the REAL parser/extract.js as a child process against
 * them -- the same pipeline the extension actually runs, not a stand-in.
 *
 * Run with: node --test tests/
 * Requires: cd vscode-extension && npm run compile first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  editTaskOperation,
  createTaskOperation,
  deleteTaskOperation,
  dataFilePath,
  generatedJsonPath,
} = require("../vscode-extension/out/taskOperations");

const REPO_ROOT = path.join(__dirname, "..");

function makeTempWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sysml-todo-taskops-"));
  for (const folder of ["spec", "data", "parser"]) {
    fs.cpSync(path.join(REPO_ROOT, folder), path.join(dir, folder), { recursive: true });
  }
  return dir;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

test("editTaskOperation writes the change and produces a valid generated JSON", async () => {
  const ws = makeTempWorkspace();
  try {
    const result = await editTaskOperation(ws, "TASK-001", "status", "completed");
    assert.equal(result.ok, true, result.error);

    const dataText = fs.readFileSync(dataFilePath(ws), "utf8");
    assert.match(dataText, /#task occurrence task001 \{[\s\S]*?:>> status = TaskStatus::completed;/);

    const generated = JSON.parse(fs.readFileSync(generatedJsonPath(ws), "utf8"));
    const task = generated.tasks.find((t) => t.id === "TASK-001");
    assert.equal(task.status, "completed");
  } finally {
    cleanup(ws);
  }
});

test("editTaskOperation reports a real error for an unknown task, and does not touch the file", async () => {
  const ws = makeTempWorkspace();
  try {
    const before = fs.readFileSync(dataFilePath(ws), "utf8");
    const result = await editTaskOperation(ws, "TASK-999", "status", "completed");
    assert.equal(result.ok, false);
    assert.match(result.error, /TASK-999/);
    const after = fs.readFileSync(dataFilePath(ws), "utf8");
    assert.equal(after, before, "file must be untouched when patchTask throws before any write");
  } finally {
    cleanup(ws);
  }
});

test("createTaskOperation adds a real task end-to-end and it appears in the generated JSON", async () => {
  const ws = makeTempWorkspace();
  try {
    const result = await createTaskOperation(ws, "Write follow-up post");
    assert.equal(result.ok, true, result.error);

    const generated = JSON.parse(fs.readFileSync(generatedJsonPath(ws), "utf8"));
    assert.equal(generated.tasks.length, 3);
    const created = generated.tasks.find((t) => t.title === "Write follow-up post");
    assert.ok(created, "created task should be present in generated JSON");
    assert.equal(created.status, "open");
    assert.equal(created.listId, "LIST-001");
  } finally {
    cleanup(ws);
  }
});

test("createTaskOperation rejects an empty title without touching the file or running the extractor", async () => {
  const ws = makeTempWorkspace();
  try {
    const before = fs.readFileSync(dataFilePath(ws), "utf8");
    const result = await createTaskOperation(ws, "   ");
    assert.equal(result.ok, false);
    assert.equal(result.validation, true);
    const after = fs.readFileSync(dataFilePath(ws), "utf8");
    assert.equal(after, before);
  } finally {
    cleanup(ws);
  }
});

test("deleteTaskOperation removes a real task end-to-end and it disappears from the generated JSON", async () => {
  const ws = makeTempWorkspace();
  try {
    const result = await deleteTaskOperation(ws, "TASK-002");
    assert.equal(result.ok, true, result.error);

    const generated = JSON.parse(fs.readFileSync(generatedJsonPath(ws), "utf8"));
    assert.equal(generated.tasks.length, 1);
    assert.ok(!generated.tasks.find((t) => t.id === "TASK-002"));
  } finally {
    cleanup(ws);
  }
});

test("full sequence: create, then edit the newly created task, then delete it -- all real, all end-to-end", async () => {
  const ws = makeTempWorkspace();
  try {
    const created = await createTaskOperation(ws, "Sequenced task");
    assert.equal(created.ok, true, created.error);

    let generated = JSON.parse(fs.readFileSync(generatedJsonPath(ws), "utf8"));
    const newTask = generated.tasks.find((t) => t.title === "Sequenced task");
    assert.ok(newTask);

    const edited = await editTaskOperation(ws, newTask.id, "priority", "high");
    assert.equal(edited.ok, true, edited.error);
    generated = JSON.parse(fs.readFileSync(generatedJsonPath(ws), "utf8"));
    assert.equal(generated.tasks.find((t) => t.id === newTask.id).priority, "high");

    const deleted = await deleteTaskOperation(ws, newTask.id);
    assert.equal(deleted.ok, true, deleted.error);
    generated = JSON.parse(fs.readFileSync(generatedJsonPath(ws), "utf8"));
    assert.equal(generated.tasks.length, 2);
    assert.ok(!generated.tasks.find((t) => t.id === newTask.id));
  } finally {
    cleanup(ws);
  }
});
