# Feature Specification: Create and Delete Tasks from the Panel

**Feature Branch**: `002-create-delete-tasks`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Create and delete task support for the To-Do List App panel, matching the mockup's (+) toolbar icon and trash icon in Task Details. This closes a gap from 001-task-panel-redesign: today the panel can only view/edit existing demo tasks, so the extension never actually exercises REQ-TODO-001 (create) or REQ-TODO-004 (delete) even though todoDigitalThread's satisfy links in spec/03-architecture.sysml claim the whole system — including the extension — fulfills them. Persistence follows the same pattern as status/priority edits: round-trip through data/02-task-list-specification.sysml via a writer, then re-extract."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a new task from the panel (Priority: P1)

A developer clicks the (+) icon in the panel toolbar, types a title, and the new task appears in the list immediately — added to the same backlog the two demo tasks belong to, with status `open` and default priority.

**Why this priority**: This is the requirement the whole redesign was implicitly claiming was satisfied (`REQ-TODO-001`) but wasn't actually exercised by the extension. Without it, the "running application" story in the mockup's own title is incomplete.

**Independent Test**: Click (+), type a title, confirm the task appears in the list with a fresh id, `open` status, and the change is durable across a panel refresh — testable without delete existing.

**Acceptance Scenarios**:

1. **Given** the panel is open with 2 existing tasks, **When** the developer clicks (+), types "Write follow-up post", and confirms, **Then** a new task with that title appears in the list with status `open` and a fresh task id (e.g. `TASK-003`), and `data/02-task-list-specification.sysml` gains a new `occurrence` block plus a reference to it in the `backlog` list's `tasks` array.
2. **Given** the create input is open, **When** the developer submits an empty title, **Then** no task is created and the input shows a validation message rather than silently doing nothing or crashing.
3. **Given** the create input is open, **When** the developer presses Escape (or clicks away), **Then** the input closes without creating a task.
4. **Given** a task was just created, **When** the developer reopens/refreshes the panel, **Then** the new task is still present (durability, same as status/priority edits in 001).

---

### User Story 2 - Delete a task from the panel (Priority: P2)

With a task selected, the developer clicks the trash icon in the Task Details section header; the task is removed from the list and from the underlying model.

**Why this priority**: Completes the second half of the gap (`REQ-TODO-004`). Placed after creation since deleting is lower-frequency and, unlike creation, needs an existing task to act on — creation is the more fundamental capability to prove first.

**Independent Test**: Select a task, delete it, confirm it's gone from the list and from `data/02-task-list-specification.sysml` (both its `occurrence` block and its reference in `backlog`'s `tasks` array), and confirm the Task Details section clears.

**Acceptance Scenarios**:

1. **Given** a task is selected and its details are shown, **When** the developer clicks the trash icon and confirms, **Then** the task disappears from the list, its `occurrence` block and its entry in `backlog`'s `tasks` array are both removed from `data/02-task-list-specification.sysml`, and the Task Details section returns to its "no task selected" state.
2. **Given** a task is selected, **When** the developer clicks the trash icon, **Then** a confirmation step happens first (deletion is destructive and irreversible via the panel) — no silent, un-confirmed delete.
3. **Given** the last remaining task in the list is deleted, **When** the deletion completes, **Then** the list shows its existing "no matching tasks" / empty state, not an error.
4. **Given** a task was just deleted, **When** the developer refreshes the panel, **Then** it stays deleted (durability).

### Edge Cases

- What happens when two tasks end up with colliding generated ids (e.g. a stale `generated/todo-model.generated.json` under-reports the highest existing `TASK-NNN`)? New id generation must be based on the actual `data/02-task-list-specification.sysml` file content at write time, not the possibly-stale in-memory model, to avoid an id collision that would silently overwrite an existing task's block.
- What happens if the extractor fails after a create/delete write (same failure class as 001's edit round-trip)? Same handling as 001: surface the error (webview + output channel + notification), leave the `.sysml` edit in place rather than trying to auto-revert it.
- What happens when creating a task while the create input still has unsaved text and the developer clicks refresh? Refresh should not discard in-progress unsaved input silently — either block it or preserve the draft.
- What happens when the task being deleted is currently referenced by `backlog`'s `tasks` array in a position other than last (e.g. deleting `task001` when the array is `(task001, task002, task003)`)? The array must be rewritten to `(task002, task003)`, not just have the deleted entry blanked out or leave a dangling reference.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The panel MUST provide a way to create a new task (the mockup's (+) toolbar icon) that prompts for at minimum a title.
- **FR-002**: A newly created task MUST get a fresh, non-colliding task id, `open` status, and a sensible default priority, and MUST be appended to the same `TodoList` (`backlog`) the existing demo tasks belong to.
- **FR-003**: Creating a task with an empty/whitespace-only title MUST be rejected with a visible validation message, not silently ignored or allowed through.
- **FR-004**: The panel MUST provide a way to delete the currently selected task (the mockup's trash icon in Task Details), gated by an explicit confirmation step.
- **FR-005**: Deleting a task MUST remove both its `occurrence` block and its reference in its containing list's `tasks` array from `data/02-task-list-specification.sysml` — no dangling references.
- **FR-006**: Both create and delete MUST follow the same persistence pattern as status/priority edits (001): a targeted, minimal-diff text write to `data/02-task-list-specification.sysml`, followed by re-running the extractor, followed by reloading the model into the panel.
- **FR-007**: After a delete that removes the currently-selected task, the Task Details section MUST return to its empty/no-selection state rather than showing stale data.
- **FR-008**: The extension MUST continue to only read `generated/todo-model.generated.json` for display data (never parse `.sysml` for reading) — id-collision avoidance for new tasks (edge case above) is the one exception where the writer reads `data/02-task-list-specification.sysml` directly, consistent with how it already writes to that file.

### Key Entities *(include if feature involves data)*

- **Task**: unchanged shape from 001 — id, title, description, status, priority, createdAt, updatedAt. This feature adds and removes whole `Task` occurrences, rather than only patching fields.
- **TodoList**: unchanged shape — its `tasks` array now grows/shrinks, not just its members' fields changing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `REQ-TODO-001` and `REQ-TODO-004` are exercised end-to-end through the extension panel itself (create a task, see it appear; delete it, see it disappear), not only through `app/todoApp.js`'s standalone tests.
- **SC-002**: A created task survives a panel refresh and a fresh `node parser/extract.js` run with the same id it was given at creation.
- **SC-003**: A deleted task's id never reappears in `generated/todo-model.generated.json` after the delete completes, and `data/02-task-list-specification.sysml` has no dangling reference to it.
- **SC-004**: 0 id collisions across 10 sequential creates in a row (each gets a distinct, correctly incrementing id).

## Assumptions

- New task ids continue the existing `TASK-NNN` sequential numbering (not UUIDs), consistent with the demo's existing 2 tasks (`TASK-001`, `TASK-002`) and this repo's overall "human-readable stable ids" convention (`REQ-TODO-NNN`, `UC-NN`, etc.).
- New tasks default to `priority: medium` (the mockup doesn't specify a default; `medium` is the least presumptuous middle choice) and are always appended to `backlog` — this demo has exactly one `TodoList`, so there's no list-picker needed.
- Editing a task's title/description (beyond the create-time title) remains out of scope for this feature, same as it was for 001 — only status/priority are editable post-creation, per 001's existing scope.
- Confirmation for delete (FR-004) is a simple inline confirm step inside the webview (e.g. "Delete? Yes/Cancel"), not a native OS dialog — keeps the interaction inside the same webview surface as everything else in this panel.
