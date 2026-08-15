# Tasks: To-Do List App Panel Redesign

**Input**: Design documents from `specs/001-task-panel-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/webview-messages.md, contracts/sysml-task-writer.md, quickstart.md

**Tests**: Included for `sysmlTaskWriter` only — its contract (contracts/sysml-task-writer.md) defines explicit test cases and it's a pure, easily-isolated function. Webview UI itself is validated manually via quickstart.md (research.md Decision 5), not via automated tests.

**Organization**: Tasks are grouped by user story (US1/US2/US3, matching spec.md's P1/P2/P3) to enable independent implementation and testing of each.

## Phase 1: Setup

- [X] T001 Confirm `vscode-extension/` still builds on the current baseline: `cd vscode-extension && npm install && npm run compile`
- [X] T002 Update `vscode-extension/package.json`: replace the `contributes.views.explorer` entry with a new `contributes.viewsContainers.activitybar` container (id `todoDigitalThreadPanel`, title "To-Do List App", an icon) and a `contributes.views` entry under that container of `"type": "webview"`; update `activationEvents` to `onView:todoDigitalThread`; keep the `todoDigitalThread.refresh` command entry

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — every story needs the webview provider skeleton and, for the status tabs/editing to be meaningful, the new enum value.

- [X] T003 Add `enum inProgress;` to `TaskStatus` in `data/01-data-model.sysml` (between `open` and `completed`, per data-model.md), then run `cd parser && node extract.js` to confirm the model still extracts cleanly
- [X] T004 [P] Remove `vscode-extension/src/todoTreeProvider.ts` (superseded by the new panel)
- [X] T005 [P] Remove `vscode-extension/src/taskDetailsPanel.ts` (superseded — details now render inline in the same webview)
- [X] T006 Create `vscode-extension/src/taskPanelProvider.ts`: a `WebviewViewProvider` class registered under the view id from T002, with `resolveWebviewView()` wiring the `postMessage` plumbing defined in `contracts/webview-messages.md` (message types only — no rendering logic yet)
- [X] T007 Rewrite `vscode-extension/src/extension.ts` to register `taskPanelProvider.ts`'s provider instead of the removed tree/detail providers, and wire the existing `todoDigitalThread.refresh` command to the new provider's reload method

**Checkpoint**: Extension compiles, activates, shows an empty webview panel — ready for user story work

---

## Phase 3: User Story 1 - Browse and filter tasks in a dedicated panel (Priority: P1) 🎯 MVP

**Goal**: A developer can open the panel and see/filter all tasks by status tab or free-text search.

**Independent Test**: quickstart.md Scenario 1 — open panel, confirm counts, filter by text, refresh after a model change, confirm empty state when `generated/todo-model.generated.json` is missing.

### Implementation for User Story 1

- [X] T008 [P] [US1] In `vscode-extension/src/taskPanelProvider.ts`, generate the webview HTML/CSS/JS that renders task rows (title, one-line description, status badge, priority flag) from a `model` message per `contracts/webview-messages.md`
- [X] T009 [US1] Add status tabs (All / Open / In Progress / Done) with live counts to the webview JS from T008 (depends on T008)
- [X] T010 [US1] Add the free-text filter box narrowing visible rows and updating tab counts, in the webview JS from T008 (depends on T008)
- [X] T011 [US1] Wire the refresh toolbar icon: webview sends `{ type: "refresh" }`, host re-reads `generated/todo-model.generated.json` and posts a fresh `model` message (depends on T006, T008)
- [X] T012 [US1] Handle the `emptyState` message in the webview JS: render "run `node parser/extract.js`" guidance when `generated/todo-model.generated.json` doesn't exist (depends on T008)
- [X] T013 [US1] Handle the `error` message in the webview JS: render a visible error state without crashing the panel (depends on T008)

**Checkpoint**: User Story 1 fully functional and independently testable (quickstart.md Scenario 1)

---

## Phase 4: User Story 2 - View a task's full detail and its SysML traceability (Priority: P2)

**Goal**: Selecting a task shows its full details plus the requirements/use cases the system satisfies, sourced from the model's real traceability data.

**Independent Test**: quickstart.md Scenario 2 — select a task, confirm details + traceability chips render correctly, confirm graceful handling when `generated/todo-model.generated.json` is absent.

### Implementation for User Story 2

- [X] T014 [P] [US2] In `vscode-extension/src/taskPanelProvider.ts`, compute the `traceability` payload (`satisfiedRequirements`, `relatedUseCasesByRequirement`) for the `model` message using the existing `requirementsSatisfiedByApp()` / `relatedUseCasesForRequirement()` helpers in `vscode-extension/src/modelLoader.ts`, per `contracts/webview-messages.md`
- [X] T015 [US2] Add click-to-select in the webview list (T008), populating a Task Details section with Title, Description, Status, Priority, Created, Updated (depends on T008)
- [X] T016 [US2] Render Related Requirement / Related Use Case as a chip list in the Task Details section, sourced from `model.traceability` (depends on T014, T015)
- [X] T017 [US2] Handle the "no task selected" state in the Task Details section — an explicit prompt, not stale data from a prior selection (depends on T015)

**Checkpoint**: User Stories 1 AND 2 both independently functional (quickstart.md Scenarios 1–2)

---

## Phase 5: User Story 3 - Edit a task's status and priority from the panel (Priority: P3)

**Goal**: Status/Priority edits in the details section round-trip through `data/02-task-list-specification.sysml` and persist durably.

**Independent Test**: quickstart.md Scenario 3 — edit status/priority, confirm only the targeted line in `data/02-task-list-specification.sysml` changed, confirm durability across a panel reload, confirm existing tests still pass.

### Tests for User Story 3 ⚠️

> Write this test FIRST, confirm it fails before T019 lands

- [X] T018 [P] [US3] Write `tests/sysml-task-writer.test.js` covering the 4 cases from `contracts/sysml-task-writer.md` (patch status, patch priority leaving other tasks untouched, unknown task id throws, idempotent re-patch)

### Implementation for User Story 3

- [X] T019 [US3] Implement `patchTask()` in `vscode-extension/src/sysmlTaskWriter.ts` per `contracts/sysml-task-writer.md`, reusing the same block-locating regex shape as `parser/extract.js`'s `extractParts` (depends on T018 existing and failing)
- [X] T020 [US3] Add Status/Priority dropdowns to the Task Details section in the webview JS (T015), sending `{ type: "editTask", taskId, field, value }` on change (depends on T015)
- [X] T021 [US3] Implement the host-side `editTask` handler in `taskPanelProvider.ts`: call `sysmlTaskWriter.patchTask`, write `data/02-task-list-specification.sysml`, run `node parser/extract.js` as a child process, reload the model, and post a fresh `model` or `error` message (depends on T019, T020)
- [X] T022 [US3] Ensure `updatedAt` is refreshed to the current timestamp as part of every successful edit round-trip (data-model.md requirement) (depends on T021)

**Checkpoint**: All three user stories independently functional (quickstart.md Scenarios 1–3)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T023 [P] Run `cd parser && node extract.js` as a final end-to-end sanity check after all model/code changes land
- [X] T024 [P] Update the top-level `README.md`'s Structure section to describe the new panel (replacing the old TreeView + separate detail panel description) and mention `data/01-data-model.sysml`'s new `inProgress` status
- [X] T025 Package: `cd vscode-extension && npm run compile && npx @vscode/vsce package` — done and packaged clean. Manual walkthrough of `quickstart.md` Scenarios 1–3 in a real VS Code window still needs a human (or an interactive session) — not something a headless tool run can verify.
- [X] T026 Run `node --test` from the repo root; confirm all tests pass (existing app tests + new `sysml-task-writer.test.js`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: depends on Foundational only
- **User Story 2 (Phase 4)**: depends on Foundational; T014–T017 build on T008 from US1 but do not require US1's tabs/filter (T009/T010) to be complete
- **User Story 3 (Phase 5)**: depends on Foundational; T020 builds on T015 from US2 (needs a details section to add dropdowns to) — so in practice US3 lands after US2, even though `sysmlTaskWriter.ts` (T018/T019) has no such dependency and can be built in parallel with US1/US2
- **Polish (Phase 6)**: depends on all three user stories being complete

### Parallel Opportunities

- T004 and T005 (file removals) in parallel
- T018/T019 (`sysmlTaskWriter.ts` + its tests) can be developed in parallel with all of Phase 3 and Phase 4, since it has no dependency on the webview code — only T020/T021 (wiring it into the UI) depend on US2's details section existing
- T023 and T024 in Phase 6 in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: quickstart.md Scenario 1
5. Demo the browsable/filterable panel — already a visible improvement over the current TreeView

### Incremental Delivery

1. Setup + Foundational → panel shell exists
2. Add US1 → browse/filter works (MVP)
3. Add US2 → task details + traceability visible
4. Add US3 → edits round-trip through the SysML model
5. Polish → docs, packaging, full test pass

## Notes

- No `[Story]` label on Setup/Foundational/Polish tasks, per the standard task format.
- `sysmlTaskWriter.ts` (T018/T019) is intentionally decoupled from the webview so it can be built and tested independently of UI work — a genuine parallel opportunity even though it's listed under US3 for story-traceability purposes.
- Every `.sysml` edit task (T003) is followed by an explicit `node extract.js` validation step — never leave the model in an unextractable state between tasks.
