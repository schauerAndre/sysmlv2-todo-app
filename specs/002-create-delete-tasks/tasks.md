# Tasks: Create and Delete Tasks from the Panel

**Input**: Design documents from `specs/002-create-delete-tasks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included for `sysmlTaskWriter`'s new functions (contracts/sysml-task-writer.md defines explicit cases), same pattern as 001. UI validated manually via quickstart.md.

**Organization**: By user story (US1 = Create, US2 = Delete), matching spec.md's P1/P2.

## Phase 1: Setup

*(None — no new dependencies, no new files, no package.json changes needed for this feature.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T001 Add `nextTaskId(fileText)` to `vscode-extension/src/sysmlTaskWriter.ts` per `contracts/sysml-task-writer.md` — needed by both US1 (create) and, indirectly, by the writer test setup for US2

**Checkpoint**: Foundation ready — both stories can now proceed

---

## Phase 3: User Story 1 - Create a new task from the panel (Priority: P1) 🎯 MVP

**Goal**: (+) icon → inline title input → new task appears, persists, validates empty title.

**Independent Test**: quickstart.md Scenario 1.

### Tests for User Story 1 ⚠️

> Write these FIRST, confirm they fail before T003/T004 land

- [X] T002 [P] [US1] Add `addTask`/`nextTaskId` test cases (1, 2, 6 from `contracts/sysml-task-writer.md`) to `tests/sysml-task-writer.test.js`

### Implementation for User Story 1

- [X] T003 [US1] Implement `addTask(fileText, task)` in `vscode-extension/src/sysmlTaskWriter.ts` per `contracts/sysml-task-writer.md` (depends on T002 existing and failing)
- [X] T004 [US1] Add the (+) toolbar icon and inline title input to the webview HTML/CSS/JS in `vscode-extension/src/taskPanelProvider.ts`, including client-side empty-title validation and Escape-to-cancel (depends on nothing new — extends existing toolbar markup from 001)
- [X] T005 [US1] Send `{ type: "createTask", title }` on submit; implement the host-side handler: `nextTaskId()` -> `addTask()` -> write file -> `runExtractor()` -> reload model (depends on T001, T003, T004)
- [X] T006 [US1] Surface create failures (validation and write/extract errors) through the same error channel 001 built (`reportEditFailure`-style: webview error state + output channel + notification) (depends on T005)

**Checkpoint**: User Story 1 independently functional (quickstart.md Scenario 1)

---

## Phase 4: User Story 2 - Delete a task from the panel (Priority: P2)

**Goal**: trash icon → inline Yes/Cancel confirm → task removed, persists, details clear.

**Independent Test**: quickstart.md Scenario 2.

### Tests for User Story 2 ⚠️

> Write these FIRST, confirm they fail before T008 lands

- [X] T007 [P] [US2] Add `deleteTask` test cases (3, 4, 5 from `contracts/sysml-task-writer.md`) to `tests/sysml-task-writer.test.js`

### Implementation for User Story 2

- [X] T008 [US2] Implement `deleteTask(fileText, taskId)` in `vscode-extension/src/sysmlTaskWriter.ts` per `contracts/sysml-task-writer.md`, handling first/middle/last tuple position correctly (depends on T007 existing and failing)
- [X] T009 [US2] Add the trash icon to the Task Details section header in the webview JS, with an inline "Delete this task? Yes / Cancel" state replacing the icon on first click (depends on nothing new — extends existing details section from 001)
- [X] T010 [US2] Send `{ type: "deleteTask", taskId }` only after the Yes confirm; implement the host-side handler: `deleteTask()` -> write file -> `runExtractor()` -> reload model, clearing `selectedTaskId` in the webview if it matched the deleted task (depends on T008, T009)
- [X] T011 [US2] Confirm the "no matching tasks" empty state (already built in 001) correctly covers the "deleted the last task" edge case — no new code expected, just a checked-off verification (depends on T010)

**Checkpoint**: Both user stories independently functional (quickstart.md Scenarios 1–2)

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T012 [P] Run `cd parser && node extract.js` as a final sanity check (no `.sysml` model files change in this feature, but confirm nothing regressed)
- [X] T013 [P] Update `README.md`'s `vscode-extension/` description to mention create/delete alongside the existing status/priority editing description
- [X] T014 Package: `cd vscode-extension && rm -rf out *.vsix && npm run compile && npx @vscode/vsce package`
- [X] T015 Run `node --test`; confirm all tests pass (existing + 6 new writer cases)

---

## Dependencies & Execution Order

- **Foundational (T001)** blocks both stories — `nextTaskId` is a small, low-risk shared primitive.
- **US1 (Create)** and **US2 (Delete)** are independently testable per their own quickstart scenarios, but in practice US2 needs at least one task to exist to delete — trivially satisfied by the 2 demo tasks already in `data/02-task-list-specification.sysml`, so no hard ordering dependency between the stories themselves.
- **Polish** depends on both stories complete.

### Parallel Opportunities

- T002 and T007 (test-writing for each story) can happen in parallel — different test cases, same file, so coordinate on file edits but no logical dependency between them.
- T012 and T013 in Polish, in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2: Foundational
2. Phase 3: User Story 1 (Create)
3. **STOP and VALIDATE**: quickstart.md Scenario 1 — already closes the more-cited half of the gap (`REQ-TODO-001`)
4. Demo, then proceed to US2 (Delete)

## Notes

- No `[Story]` label on Setup/Foundational/Polish tasks.
- This feature's tests extend the same `tests/sysml-task-writer.test.js` file 001 created — no new test file.
