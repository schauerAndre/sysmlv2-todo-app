# Data Model: Create and Delete Tasks from the Panel

No changes to `data/01-data-model.sysml` (`Task`/`TodoList`/`TaskStatus`/`TaskPriority` are all unchanged). This feature changes *cardinality* of `data/02-task-list-specification.sysml`'s content (tasks added/removed), not shape.

## New task defaults (on create)

| Field | Value |
|---|---|
| id | `nextTaskId(fileText)` — next sequential `TASK-NNN` |
| title | user-provided (required, non-empty) |
| description | `""` (empty — no description field in the quick-add UI, per research.md; editable later if 003+ adds title/description editing) |
| status | `TaskStatus::open` |
| priority | `TaskPriority::medium` (research.md Decision, no UI picker at create time for v1) |
| createdAt | `new Date().toISOString()` |
| updatedAt | same value as `createdAt` at creation time |

## Extension-side ephemeral state additions (not modeled in SysML)

| Field | Type | Notes |
|---|---|---|
| createInputOpen | boolean | whether the inline (+) input is visible |
| createDraftTitle | String | in-progress text before submit, per edge case: refresh must not silently discard it |
| deleteConfirmingTaskId | String \| null | which task (if any) is mid-confirmation for delete |

## Round-trip shape (extends 001's, same pattern)

```
create:
  webview -> { type: "createTask", title } -> host
  host: nextTaskId() -> addTask() -> write file -> re-extract -> reload -> post "model"

delete:
  webview -> { type: "deleteTask", taskId } -> host   (sent only after inline confirm)
  host: deleteTask() -> write file -> re-extract -> reload -> post "model"
```
