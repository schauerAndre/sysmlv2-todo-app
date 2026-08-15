# Quickstart: Validating Create/Delete

## Prerequisites

```bash
cd vscode-extension && npm install && npm run compile && npx @vscode/vsce package
```

Install the `.vsix`, open `sysmlv2-todo-digital-thread/` as the workspace.

## Scenario 1 — Create (User Story 1)

1. Open the To-Do List App panel. Click the (+) icon.
2. Type "Write follow-up post", submit. **Expect**: new row appears immediately, status `OPEN`, a fresh id (e.g. `TASK-003`).
3. Check `data/02-task-list-specification.sysml`: a new `occurrence task003 : Task { ... }` block exists, and `backlog`'s `tasks = (...)` now includes `task003`.
4. Click (+), submit with an empty title. **Expect**: validation message, no task created.
5. Click (+), type something, press Escape. **Expect**: input closes, no task created.
6. Refresh the panel. **Expect**: the created task from step 2 is still there.

## Scenario 2 — Delete (User Story 2)

1. Select the task created above. Click the trash icon in Task Details.
2. **Expect**: an inline "Delete this task? Yes / Cancel" prompt, not an immediate delete.
3. Click Cancel. **Expect**: task still present, details unchanged.
4. Click the trash icon again, then Yes. **Expect**: task disappears from the list, Task Details returns to "no task selected."
5. Check `data/02-task-list-specification.sysml`: the deleted task's `occurrence` block is gone, and its var name is gone from `backlog`'s `tasks = (...)` tuple (no dangling comma artifacts).
6. Refresh. **Expect**: still deleted.
7. Delete every remaining task one at a time. **Expect**: the list ends on its existing "no matching tasks" empty state, not an error.

## Regression check

```bash
node --test
```

**Expect**: all tests pass, including the new `addTask`/`deleteTask`/`nextTaskId` cases in `tests/sysml-task-writer.test.js`.
