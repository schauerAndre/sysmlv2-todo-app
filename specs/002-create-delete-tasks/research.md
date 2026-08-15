# Research: Create and Delete Tasks from the Panel

## Decision 1: No new SysML use cases/requirements needed

**Decision**: This feature adds no new `UC-*`/`REQ-TODO-*` elements to `spec/01-use-cases.sysml`/`spec/02-requirements.sysml`. `UC-01 CreateTask`/`REQ-TODO-001` and `UC-04 DeleteTask`/`REQ-TODO-004` already exist and already describe exactly this behavior ("the user wants to add a new task to a list" / "the user wants to remove a task permanently") — this feature makes the extension actually implement them, it doesn't introduce new behavior to model.

**Rationale**: The spec-sync hook (`speckit-sync-sysml-spec`) checked for de-duplication and correctly found nothing new to add — a good sign the hook's design works, not a gap.

## Decision 2: Task id generation reads data/02-task-list-specification.sysml directly, not the generated JSON

**Decision**: `sysmlTaskWriter.ts` gains a `nextTaskId(fileText)` helper that scans the actual `.sysml` source text for the highest existing `TASK-NNN` id and returns the next one. It does **not** derive this from `generated/todo-model.generated.json` or from the webview's in-memory task list.

**Rationale**: The generated JSON can be stale relative to the source file (e.g. if a previous edit's re-extraction failed partway, per FR's error handling, the `.sysml` edit is kept even when extraction fails) — generating a new id from a stale source risks colliding with a task that already exists in the file but not yet in the JSON. The `.sysml` file is the actual source of truth being written to, so it's the only correct place to check for collisions. This mirrors why `patchTask` (001) always reads `data/02-task-list-specification.sysml` fresh from disk rather than trusting cached state.

## Decision 3: addTask/deleteTask extend sysmlTaskWriter.ts with the same text-patch philosophy as patchTask, not a new module

**Decision**: Two new exported functions, `addTask(fileText, task)` and `deleteTask(fileText, taskId)`, alongside the existing `patchTask`. Both operate on the same block-locating regex approach `patchTask` already uses (reused/generalized, not reinvented per-function).

- `addTask` inserts a new `// @id: TASK-<NNN>\n    occurrence task<NNN> : Task { ... }` block immediately before the `// @id: LIST-001` / `backlog` occurrence (preserving the file's existing convention of declaring all tasks before the list that references them), and rewrites the `occurrence :>> tasks = (...);` line inside `backlog` to append the new task's variable name.
- `deleteTask` removes the named task's whole occurrence block, and rewrites the same `tasks = (...);` line to drop that variable name (handling first/middle/last position in the tuple, per the spec's edge case about mid-list deletion).

**Rationale**: Keeping all three functions in one module keeps the "how we write to `data/02-task-list-specification.sysml`" knowledge in one place, matching 001's existing module boundary — a webview/extension-host concern (`taskPanelProvider.ts`) should never itself contain SysML-text-shape knowledge.

**Alternatives considered**: A generic AST-based rewrite — rejected for the same reason as 001 (no SysML v2 writer in this toolchain, disproportionate to a demo). Separate `sysmlTaskLifecycle.ts` module for add/delete vs. `sysmlTaskWriter.ts` for field patches — rejected: unnecessary split, all three functions manipulate the same file with the same block-location logic.

## Decision 4: Delete confirmation is a two-step inline UI state, not a native dialog

**Decision**: Clicking the trash icon doesn't delete immediately — it turns the icon area into an inline "Delete this task? [Yes] [Cancel]" prompt within the webview. A second click (Yes) triggers the actual `deleteTask` message.

**Rationale**: Keeps the whole interaction inside the webview's own DOM/state (consistent with how create's inline input works) rather than introducing a `vscode.window.showWarningMessage` native modal, which would be a different interaction pattern from everything else in this panel and harder to keep the webview's own filtered/selected state in sync with.

**Alternatives considered**: `vscode.window.showWarningMessage` with Yes/Cancel — rejected only for consistency of interaction pattern, not because it's wrong; noted as a viable simpler alternative if the inline approach proves fiddly to implement.

## Decision 5: Testing scope — extend the existing sysml-task-writer.test.js, no new automated UI tests

**Decision**: `addTask`/`deleteTask` get `node:test` coverage alongside `patchTask` in the same `tests/sysml-task-writer.test.js` file. The create/delete UI flow (button clicks, inline confirm) is validated manually via `quickstart.md`, consistent with 001's Decision 5.

**Rationale**: Same reasoning as 001 — no VS Code extension UI test harness exists in this repo, and standing one up is disproportionate to the demo's scope.
