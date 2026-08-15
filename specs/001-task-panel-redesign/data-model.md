# Data Model: To-Do List App Panel Redesign

## Entities carried over unchanged (SysML source: data/01-data-model.sysml)

### Task
| Field | Type | Notes |
|---|---|---|
| id | String | e.g. `TASK-001` |
| title | String | |
| description | String | |
| status | TaskStatus | **extended**, see below |
| priority | TaskPriority | `low` \| `medium` \| `high` — unchanged |
| createdAt | String | unchanged |
| updatedAt | String | unchanged; **must be set to the current timestamp on every edit** (FR-010) |

### TodoList
| Field | Type | Notes |
|---|---|---|
| id | String | e.g. `LIST-001` |
| name | String | |
| tasks | Task[0..*] | unchanged |

## Entity extended

### TaskStatus (enum)
Current: `open`, `completed`.
**New**: add `inProgress`.

```
enum def TaskStatus {
    enum open;
    enum inProgress;
    enum completed;
}
```

Implementation note: this is a `data/01-data-model.sysml` edit, executed during `/speckit-implement` (not during planning) since it's source code, not a design artifact. `parser/extract.js`'s `enumField()` reads any enum literal by name already — no extractor change required for the new value itself.

## New entities (extension-side only, not modeled in SysML — ephemeral UI/view state)

### PanelViewState
In-memory only, lives in the webview's JS state, not persisted, not part of the domain model:
| Field | Type | Notes |
|---|---|---|
| selectedTaskId | String \| null | which task's details are shown |
| activeStatusTab | `"all" \| "open" \| "inProgress" \| "done"` | default `"all"` |
| filterText | String | default `""` |

### TaskTraceability (derived, computed at read time — not stored)
Per FR-007 and Research Decision 4, this is **system-level, not task-level**:
| Field | Type | Notes |
|---|---|---|
| satisfiedRequirements | `{ id, name, text }[]` | via `requirementsSatisfiedByApp(model)` (existing helper) |
| relatedUseCases | `{ id, name }[]` | per requirement, via `relatedUseCasesForRequirement(model, reqId)` (existing helper) |

Every task currently shows the same `satisfiedRequirements`/`relatedUseCases` list, because the model's `satisfy` links are REQ → system, not REQ → Task. See research.md Decision 4 for why this isn't faked into a per-task 1:1 mapping.

## Edit round-trip (state transition, not a new entity)

```
[user changes Status/Priority dropdown in webview]
        |
        v
postMessage({ type: "editTask", taskId, field, value }) --> extension host
        |
        v
sysmlTaskWriter.patchTask(dataFilePath, taskId, field, value)
   - locate "// @id: <taskId>" ... "occurrence ... : Task { ... }" block
   - replace the matching ":>> <field> = ...;" line only
   - write file back (all other bytes unchanged)
        |
        v
run `node parser/extract.js` (child process, cwd = repo root)
        |
        v
re-read generated/todo-model.generated.json, postMessage updated model back to webview
        |
        v
webview re-renders the affected row + (if selected) the details section
```

Failure modes to surface to the user (not silently swallow):
- `patchTask` can't find the task's `@id` marker → show an error, do not write anything
- `extract.js` exits non-zero after the patch → show the extractor's stderr, leave the on-disk `.sysml` edit in place (it's now a genuine part of the source that just doesn't currently extract cleanly), and encourage the user to run it manually
