"use strict";
/**
 * Minimal reference implementation of the system that
 * 05-architecture.sysml calls `todoDigitalThread` (id ARCH-APP) -- the
 * subject that `satisfy`s REQ-TODO-001..005. This is deliberately small: it
 * exists so the verification cases in 07-test-cases.sysml have something
 * real to verify, not to be a production app.
 */
const fs = require("fs");

class TodoApp {
  constructor() {
    /** @type {Array<{id: string, title: string, status: "open"|"completed"}>} */
    this.tasks = [];
    this._nextId = 1;
  }

  // Satisfies REQ-TODO-001 (verified by TEST-001 / CreateTaskTest).
  createTask(title) {
    const task = { id: `TASK-${this._nextId++}`, title, status: "open" };
    this.tasks.push(task);
    return task;
  }

  // Satisfies REQ-TODO-002 (verified by TEST-002 / ViewTasksTest).
  viewTasks() {
    return this.tasks.slice();
  }

  // Satisfies REQ-TODO-003 (verified by TEST-003 / CompleteTaskTest).
  completeTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error(`No such task: ${id}`);
    }
    task.status = "completed";
    return task;
  }

  // Satisfies REQ-TODO-004 (verified by TEST-004 / DeleteTaskTest).
  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`No such task: ${id}`);
    }
    this.tasks.splice(index, 1);
  }

  // Satisfies REQ-TODO-005 (verified by TEST-005 / PersistTasksTest).
  saveTo(filePath) {
    fs.writeFileSync(filePath, JSON.stringify({ tasks: this.tasks, nextId: this._nextId }, null, 2));
  }

  static loadFrom(filePath) {
    const app = new TodoApp();
    if (!fs.existsSync(filePath)) {
      return app;
    }
    const { tasks, nextId } = JSON.parse(fs.readFileSync(filePath, "utf8"));
    app.tasks = tasks;
    app._nextId = nextId;
    return app;
  }
}

module.exports = { TodoApp };
