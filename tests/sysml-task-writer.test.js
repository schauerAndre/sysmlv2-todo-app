"use strict";
/**
 * Tests for vscode-extension/src/sysmlTaskWriter.ts (compiled to
 * vscode-extension/out/sysmlTaskWriter.js), per specs/001-task-panel-redesign/
 * contracts/sysml-task-writer.md. Run `npm run compile` inside
 * vscode-extension/ before running these.
 *
 * Run with: node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { patchTask, addTask, deleteTask, nextTaskId } = require("../vscode-extension/out/sysmlTaskWriter");

const DATA_FILE = path.join(__dirname, "..", "data", "02-task-list-specification.sysml");

function readDataFile() {
  return fs.readFileSync(DATA_FILE, "utf8");
}

// @id: TEST-006 -- verifies REQ-TODO-008 (EditTaskFieldsRequirement)
test("patchTask changes only the targeted status line", () => {
  // Given a task's current status value in data/02-task-list-specification.sysml,
  const original = readDataFile();

  // when the panel patches that task's status field,
  const patched = patchTask(original, "TASK-001", "status", "inProgress");

  // then only the targeted line changes and the new value round-trips.
  assert.notEqual(patched, original);
  assert.match(patched, /#task occurrence task001 \{[\s\S]*?:>> status = TaskStatus::inProgress;/);

  const originalLines = original.split("\n");
  const patchedLines = patched.split("\n");
  assert.equal(patchedLines.length, originalLines.length);
  const changedLines = patchedLines.filter((line, i) => line !== originalLines[i]);
  assert.equal(changedLines.length, 1);
});

test("patchTask changes only the targeted priority line, leaving other tasks untouched", () => {
  const original = readDataFile();

  const patched = patchTask(original, "TASK-002", "priority", "low");

  assert.match(patched, /#task occurrence task002 \{[\s\S]*?:>> priority = TaskPriority::low;/);
  // task001's block is untouched.
  const task001Block = /#task occurrence task001 \{[\s\S]*?\n {4}\}/.exec(original)[0];
  assert.ok(patched.includes(task001Block));
});

test("patchTask throws for an unknown task id", () => {
  const original = readDataFile();
  assert.throws(() => patchTask(original, "TASK-999", "status", "completed"), /TASK-999/);
});

test("patchTask is idempotent when re-patching the current value", () => {
  const original = readDataFile();
  const currentStatusMatch = /#task occurrence task001 \{[\s\S]*?:>> status = TaskStatus::(\w+);/.exec(original);
  const currentValue = currentStatusMatch[1];

  const patched = patchTask(original, "TASK-001", "status", currentValue);

  assert.equal(patched, original);
});

// Helper test, not its own SysML verification def -- covered as part of
// TEST-007's addTask flow below.
test("nextTaskId returns the next sequential id after the highest existing TASK-NNN", () => {
  const original = readDataFile();
  assert.equal(nextTaskId(original), "TASK-003");
});

// @id: TEST-007 -- verifies REQ-TODO-001 (CreateTaskRequirement, via the panel writer)
test("addTask inserts a new block before the list and appends it to the tasks tuple", () => {
  const original = readDataFile();
  const newId = nextTaskId(original);

  const withNewTask = addTask(original, {
    id: newId,
    title: "Write follow-up post",
    description: "",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.match(withNewTask, /#task occurrence task003 \{[\s\S]*?:>> title = "Write follow-up post";/);
  // Inserted before the list, not after.
  assert.ok(withNewTask.indexOf("// @id: TASK-003") < withNewTask.indexOf("// @id: LIST-001"));
  // Appended (not prepended/replacing) in the tasks tuple.
  assert.match(withNewTask, /occurrence :>> tasks = \(task001, task002, task003\);/);
});

test("addTask twice in a row produces two distinct, non-colliding ids", () => {
  const original = readDataFile();
  const firstId = nextTaskId(original);
  const afterFirst = addTask(original, {
    id: firstId,
    title: "First",
    description: "",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  });

  const secondId = nextTaskId(afterFirst);
  assert.notEqual(secondId, firstId);
  const afterSecond = addTask(afterFirst, {
    id: secondId,
    title: "Second",
    description: "",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.match(afterSecond, /occurrence :>> tasks = \(task001, task002, task003, task004\);/);
});

test("addTask rejects an empty title", () => {
  const original = readDataFile();
  assert.throws(
    () =>
      addTask(original, {
        id: nextTaskId(original),
        title: "   ",
        description: "",
        createdAt: "2026-08-13T00:00:00.000Z",
        updatedAt: "2026-08-13T00:00:00.000Z",
      }),
    /title must not be empty/
  );
});

// @id: TEST-008 -- verifies REQ-TODO-004 (DeleteTaskRequirement, via the panel writer)
test("deleteTask removes the last task in the tuple cleanly", () => {
  const original = readDataFile();

  const afterDelete = deleteTask(original, "TASK-002");

  assert.ok(!afterDelete.includes("// @id: TASK-002"));
  assert.match(afterDelete, /occurrence :>> tasks = \(task001\);/);
});

test("deleteTask removes the first task in the tuple cleanly, no dangling comma", () => {
  const original = readDataFile();

  const afterDelete = deleteTask(original, "TASK-001");

  assert.ok(!afterDelete.includes("// @id: TASK-001"));
  assert.match(afterDelete, /occurrence :>> tasks = \(task002\);/);
  assert.doesNotMatch(afterDelete, /\(\s*,/);
});

test("deleteTask throws for an unknown task id", () => {
  const original = readDataFile();
  assert.throws(() => deleteTask(original, "TASK-999"), /TASK-999/);
});

// Regression coverage for the multi-list bug: earlier versions of
// addTask/deleteTask only ever looked at the *first* `tasks = (...)` tuple
// in the whole file, silently corrupting/leaving dangling references once a
// second TodoList existed.
function withSecondList(fileText) {
  const secondList = `
    // @id: LIST-002
    #toDoList occurrence icebox {
        :>> id = "LIST-002";
        :>> name = "Icebox";
        occurrence :>> tasks = (task002);
    }
`;
  // Move task002 out of LIST-001's tuple into the new LIST-002's tuple, so
  // the fixture reflects a real (non-overlapping) multi-list state.
  const withoutTask002InListOne = fileText.replace(
    "occurrence :>> tasks = (task001, task002);",
    "occurrence :>> tasks = (task001);"
  );
  return withoutTask002InListOne.replace(
    /\n\} \/\/ package TodoTaskListSpecification\n$/,
    `\n${secondList}} // package TodoTaskListSpecification\n`
  );
}

test("addTask throws a clear error when multiple TodoLists exist, instead of silently picking one", () => {
  const withTwoLists = withSecondList(readDataFile());
  assert.throws(
    () =>
      addTask(withTwoLists, {
        id: "TASK-003",
        title: "Ambiguous",
        description: "",
        createdAt: "2026-08-13T00:00:00.000Z",
        updatedAt: "2026-08-13T00:00:00.000Z",
      }),
    /2 TodoLists/
  );
});

test("deleteTask removes a task from whichever list actually contains it, not just the first list in the file", () => {
  const withTwoLists = withSecondList(readDataFile());
  // TASK-002 is referenced by LIST-002 ("icebox"), not LIST-001 ("backlog").
  const afterDelete = deleteTask(withTwoLists, "TASK-002");

  assert.ok(!afterDelete.includes("// @id: TASK-002"));
  // LIST-001 (backlog) never referenced task002, so its tuple is unchanged.
  assert.match(afterDelete, /occurrence :>> tasks = \(task001\);[\s\S]*\/\/ @id: LIST-002/);
  // LIST-002 (icebox) is the one that actually loses the reference.
  assert.match(afterDelete, /\/\/ @id: LIST-002[\s\S]*occurrence :>> tasks = \(\);/);
});
