# Feature Specification: To-Do List App Panel Redesign

**Feature Branch**: `001-task-panel-redesign`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Redesign the VS Code extension's UI to match the target mockup: replace the plain Explorer TreeView with a dedicated custom 'To-Do List App' panel and a rich task-details webview. Includes a filterable/searchable task list with status tabs (All/Open/In Progress/Done) and count badges, color-coded status and priority badges per row, and a Task Details section showing Title, Description, editable Status/Priority, Related Requirement, Related Use Case, Created/Updated timestamps, and edit/delete affordances. Data source stays generated/todo-model.generated.json, extracted from spec/*.sysml + data/*.sysml; Related Requirement/Use Case must come from the existing satisfy/verify/dependency traceability, not be hardcoded."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and filter tasks in a dedicated panel (Priority: P1)

A developer working in this repo opens VS Code and wants to see the digital thread's to-do list without digging through the Explorer tree. They open a dedicated "To-Do List App" panel (its own Activity Bar entry, not nested under Explorer), see all tasks at a glance, and narrow the list by status (All / Open / In Progress / Done) or by typing a filter term.

**Why this priority**: This is the entry point to every other capability in this feature — without a working list, there's nothing to select a task from. It's also the part closest to what already exists (the current TreeView), so it's the lowest-risk slice to ship first.

**Independent Test**: Can be fully tested by installing the extension, opening a workspace with a `generated/todo-model.generated.json`, opening the panel, and confirming the correct tasks and counts appear per status tab and per filter query — delivers value on its own even before task-details or editing exist.

**Acceptance Scenarios**:

1. **Given** a workspace with `generated/todo-model.generated.json` containing 5 tasks (4 open, 1 done), **When** the developer opens the To-Do List App panel, **Then** the "All" tab shows 5, "Open" shows 4, "Done" shows 1, and each row shows title, one-line description, status badge, and priority flag.
2. **Given** the panel is open, **When** the developer types a substring of a task's title into the filter box, **Then** only matching rows remain visible and the tab counts update to reflect the filtered set.
3. **Given** the panel is open and the `.sysml` model has been edited and re-extracted, **When** the developer clicks the refresh icon, **Then** the list reflects the newly generated JSON without reopening VS Code.
4. **Given** `generated/todo-model.generated.json` does not exist yet, **When** the developer opens the panel, **Then** it shows an empty state explaining that `node parser/extract.js` needs to be run, rather than an error or a blank screen.

---

### User Story 2 - View a task's full detail and its SysML traceability (Priority: P2)

Having found a task in the list, the developer clicks it to see everything about it in one place — including which requirement and use case it traces back to in the SysML model, so the connection between the model and the running app is visible, not just asserted in documentation.

**Why this priority**: This is the feature's actual thesis (the "digital thread" made visible in the UI) and the main reason this redesign is happening, but it depends on User Story 1 existing first.

**Independent Test**: Select a task with a known related requirement/use case and confirm the details panel shows the correct REQ id + text and UC id + name, sourced from the model's `traceability` array, not from a hardcoded mapping.

**Acceptance Scenarios**:

1. **Given** a task is selected, **When** the Task Details section renders, **Then** it shows Title, Description, Status, Priority, Created, and Updated for that exact task.
2. **Given** the selected task belongs to a list whose requirement is satisfied by the system (per `satisfy`/`verify` links in the model), **When** the details render, **Then** Related Requirement shows the requirement's id and doc text, and Related Use Case shows the use case's id and name, both resolved via the model's traceability data.
3. **Given** a selected task has no resolvable related requirement or use case (e.g. traceability data is incomplete), **When** the details render, **Then** those fields show an explicit "None" / "Not linked" state rather than being blank or throwing an error.
4. **Given** no task is selected, **When** the panel is open, **Then** the Task Details section shows an empty/prompt state instead of stale data from a previous selection.

---

### User Story 3 - Edit a task's status and priority from the panel (Priority: P3)

The developer wants to change a task's status (e.g. Open → In Progress) or priority directly from the Task Details section, instead of hand-editing `.sysml` source.

**Why this priority**: Highest value but also highest risk/scope — it turns a read-only viewer into a two-way editor, which has real implications for what "the SysML model is the source of truth" means in this repo. Ships last, after the read-only experience is solid.

**Independent Test**: Change a task's status via the dropdown, confirm the change is reflected immediately in the list (badge, tab counts) and confirm where/how it round-trips (see FR-010 and the resolved clarification below).

**Acceptance Scenarios**:

1. **Given** a task is selected, **When** the developer changes its Status dropdown, **Then** the task's status badge and the relevant tab counts update immediately.
2. **Given** a task is selected, **When** the developer changes its Priority dropdown, **Then** the priority flag/label updates immediately in both the list row and the details section.
3. **Given** an edit has been made, **When** the developer inspects the persisted result (per FR-010), **Then** the change is durable across a VS Code restart / panel refresh, not just an in-memory UI state.

### Edge Cases

- What happens when `generated/todo-model.generated.json` exists but is malformed/unparseable (e.g. mid-edit, extractor crashed)? Panel should show a clear error state, not crash the extension host.
- What happens when a task's related list has multiple requirements/use cases in its traceability chain? Details section should show all of them, not silently pick one.
- What happens when the filter text matches zero tasks in the currently selected status tab? List shows an explicit "no matching tasks" state, not an empty blank area indistinguishable from a loading state.
- What happens when the extension activates in a workspace that isn't this project (no `generated/` folder, no `.sysml` files at all)? Panel should degrade gracefully to its "run the extractor" empty state rather than assuming the folder structure exists.
- What happens if two tasks in the underlying data have the same title (filter/search ambiguity)? Both are shown as separate rows; selection is by task id, never by title.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST provide a dedicated panel (own Activity Bar container) titled "To-Do List App", distinct from the Explorer-nested tree it previously used.
- **FR-002**: The panel MUST display, per task: title, one-line description, a status badge, and a priority flag/label, color-coded consistently with the mockup's semantics (status: open/in-progress/done; priority: low/medium/high).
- **FR-003**: The panel MUST provide status filter tabs — All, Open, In Progress, Done — each showing a live count of tasks in that state.
- **FR-004**: The panel MUST provide a free-text filter box that narrows the visible task rows by matching against title/description, updating tab counts to reflect the filtered set.
- **FR-005**: The panel MUST provide a manual refresh action that reloads `generated/todo-model.generated.json` from disk without restarting VS Code.
- **FR-006**: Selecting a task row MUST populate a Task Details section showing Title, Description, Status, Priority, Created, and Updated for that task.
- **FR-007**: The Task Details section MUST show the task's Related Requirement (id + doc text) and Related Use Case (id + name), resolved from the generated model's `traceability` links — never a hardcoded id-to-task mapping.
- **FR-008**: When a task has no resolvable related requirement or use case, the corresponding field MUST show an explicit empty state rather than blank space or a thrown error.
- **FR-009**: When `generated/todo-model.generated.json` is missing, the panel MUST show guidance to run the extractor rather than an error or silent blank panel.
- **FR-010**: Status and Priority MUST be editable from the Task Details section via dropdowns, and edits MUST persist durably (see Assumptions for the resolved persistence approach) rather than being lost on refresh/restart.
- **FR-011**: The extension MUST continue to consume only `generated/todo-model.generated.json` as its data source (produced by `parser/extract.js`) — it MUST NOT parse `.sysml` files directly.

### Key Entities *(include if feature involves data)*

- **Task**: id, title, description, status, priority, createdAt, updatedAt — as already defined in `data/01-data-model.sysml` / emitted by the extractor.
- **TodoList**: id, name, member tasks — the container a task belongs to.
- **Requirement**: id, name, text — traced to a task's containing list/system via `satisfy` links.
- **UseCase**: id, name, description — traced to a Requirement via `dependency` (derive) links.
- **TraceLink**: from, to, type (`derive`/`satisfy`/`verify`) — the existing traceability array the details panel must resolve against, not duplicate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from opening the panel to viewing a specific task's full details (including its traced requirement/use case) in 2 clicks or fewer.
- **SC-002**: Filtering the task list (by tab or by text) updates visible rows and counts with no perceptible delay (under 200ms) for the demo dataset size (≤ a few dozen tasks).
- **SC-003**: 100% of tasks whose containing list has a resolvable `satisfy`/`dependency` chain show a correct Related Requirement and Related Use Case in the details panel (verified against the existing 5-task demo dataset).
- **SC-004**: A status or priority edit made in the panel is still visible after closing and reopening the panel (durability, independent of exact storage mechanism).
- **SC-005**: Opening the panel in a workspace without a generated model produces a clear next-step message, with zero unhandled errors in the extension host log.

## Assumptions

- The panel replaces (not supplements) the current Explorer-nested "To-Do Digital Thread" tree view — this is a redesign, not an additional view.
- "In Progress" is a genuinely new status value, not already present in `data/01-data-model.sysml`'s `TaskStatus` enum (today: `open`, `completed`). Adding it is in scope for this feature and will need a corresponding `spec`/`data` model change, handled by `/speckit-plan`'s architecture sync, not silently invented in the extension code alone.
- **Persistence for edits (FR-010) resolved as**: edits made in the panel are written back to `data/02-task-list-specification.sysml` (the same file that already declares the demo task instances) via a small serializer in the extension, followed by re-running `parser/extract.js` to regenerate `generated/todo-model.generated.json` — keeping the SysML source as the single source of truth rather than introducing a second, parallel data store. This is a deliberate scope decision for v1: edits are round-tripped through the model, not just written to the JSON cache.
- The mockup's "Add" (+) toolbar icon is out of scope for this feature — creating new tasks from the panel is a candidate follow-up feature, not part of this redesign.
- Delete (trash icon in Task Details) is out of scope for this feature for the same reason — flagged here so it isn't silently dropped, but not a functional requirement of this spec.
