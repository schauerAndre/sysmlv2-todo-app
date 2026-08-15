"use strict";
/**
 * Real software tests derived from the SysML v2 verification cases in
 * ../spec/05-test-cases.sysml. Each `test()` name below matches a
 * `verification def` name 1:1, and the Given/When/Then comments are copied
 * from that verification case's `doc` text -- this file is the "reference"
 * side of each case's `// @implementedBy` comment in the model.
 *
 * Run with: node --test (auto-discovers every *.test.js file in tests/)
 * (Node's built-in test runner -- no dependencies, same "no commercial
 * license required" spirit as parser/extract.js.)
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { TodoApp } = require("../app/todoApp");

// @id: TEST-001 -- verifies REQ-TODO-001 (CreateTaskRequirement)
test("CreateTaskTest", () => {
  // Given an empty task list,
  const app = new TodoApp();
  assert.equal(app.viewTasks().length, 0);

  // when the user creates a task with the title "Buy milk",
  app.createTask("Buy milk");

  // then the list contains exactly one task with that title and status "open".
  const tasks = app.viewTasks();
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, "Buy milk");
  assert.equal(tasks[0].status, "open");
});

// @id: TEST-002 -- verifies REQ-TODO-002 (ViewTasksRequirement)
test("ViewTasksTest", () => {
  // Given a list with one open and one completed task,
  const app = new TodoApp();
  const t1 = app.createTask("Open task");
  const t2 = app.createTask("Completed task");
  app.completeTask(t2.id);

  // when the user views the task list,
  const tasks = app.viewTasks();

  // then both tasks are shown, each with its correct status.
  assert.equal(tasks.length, 2);
  assert.equal(tasks.find((t) => t.id === t1.id).status, "open");
  assert.equal(tasks.find((t) => t.id === t2.id).status, "completed");
});

// @id: TEST-003 -- verifies REQ-TODO-003 (CompleteTaskRequirement)
test("CompleteTaskTest", () => {
  // Given a list with one open task,
  const app = new TodoApp();
  const task = app.createTask("Finish the demo");
  assert.equal(task.status, "open");

  // when the user marks that task as completed,
  app.completeTask(task.id);

  // then the task's status changes to "completed" and no other task is affected.
  const [reloaded] = app.viewTasks();
  assert.equal(reloaded.status, "completed");
});

// @id: TEST-004 -- verifies REQ-TODO-004 (DeleteTaskRequirement)
test("DeleteTaskTest", () => {
  // Given a list with two tasks,
  const app = new TodoApp();
  const keep = app.createTask("Keep me");
  const remove = app.createTask("Remove me");

  // when the user deletes one of them,
  app.deleteTask(remove.id);

  // then the list contains exactly the remaining task.
  const tasks = app.viewTasks();
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, keep.id);
});

// @id: TEST-005 -- verifies REQ-TODO-005 (PersistTasksRequirement)
test("PersistTasksTest", () => {
  const filePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "todo-")), "state.json");

  // Given a list with two tasks,
  const app = new TodoApp();
  app.createTask("Survive a restart");
  const second = app.createTask("Also survive");
  app.completeTask(second.id);
  app.saveTo(filePath);

  // when the application is restarted,
  const restarted = TodoApp.loadFrom(filePath);

  // then both tasks are still present with their prior status and priority unchanged.
  const tasks = restarted.viewTasks();
  assert.equal(tasks.length, 2);
  assert.equal(tasks.find((t) => t.title === "Survive a restart").status, "open");
  assert.equal(tasks.find((t) => t.title === "Also survive").status, "completed");
});
