# Tasks: Model Explorer Tree View

**Input**: Design documents from `specs/003-model-explorer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/model-explorer-provider.md

**Tests**: Included for `modelExplorerProvider`'s pure logic (contracts define explicit cases). No Playwright coverage — native `TreeView` has no webview DOM (research.md Decision 5).

**Organization**: By user story (US1 = Browse, US2 = Navigate, US3 = Traceability-as-tree).

## Phase 1: Setup

- [X] T001 Add a `contributes.views.explorer` entry (id `modelExplorer`, name "Model Explorer") and a `modelExplorer.refresh` command to `vscode-extension/package.json`, alongside the existing `todoDigitalThreadPanel` container/view

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Create `vscode-extension/src/modelExplorerProvider.ts` skeleton: `ModelExplorerProvider implements vscode.TreeDataProvider<ModelTreeItem>`, loading via the existing `loadTodoModel()` from `modelLoader.ts` (no new data source)
- [X] T003 Register the provider in `vscode-extension/src/extension.ts` via `vscode.window.registerTreeDataProvider("modelExplorer", provider)`, alongside the existing webview registration; wire `modelExplorer.refresh` to the provider's refresh method

**Checkpoint**: Explorer sidebar shows an (empty) "Model Explorer" section — ready for user story work

---

## Phase 3: User Story 1 - Browse the model structure in a tree (Priority: P1) 🎯 MVP

**Goal**: Use Cases/Requirements/Test Cases groups with correct counts, tooltips, refresh, empty state.

**Independent Test**: quickstart.md Scenario 1.

### Tests for User Story 1 ⚠️

- [X] T004 [P] [US1] Write `tests/model-explorer.test.js` covering `buildTree` cases 1 and 4 from `contracts/model-explorer-provider.md` (grouping/counts, empty model)

### Implementation for User Story 1

- [X] T005 [US1] Implement `buildTree(model)` in `modelExplorerProvider.ts` per `contracts/model-explorer-provider.md` (depends on T004 existing and failing)
- [X] T006 [US1] Implement `getTreeItem`/`getChildren` on `ModelExplorerProvider` rendering groups and leaves from `buildTree()`'s output, with tooltips from each element's description/text (depends on T005)
- [X] T007 [US1] Implement the empty-state tree item ("Run `node parser/extract.js`...") when `generated/todo-model.generated.json` is missing, mirroring the To-Do panel's existing empty-state handling (depends on T006)
- [X] T008 [US1] Wire the refresh command/icon to reload the model and fire `onDidChangeTreeData` (depends on T003, T006)

**Checkpoint**: User Story 1 independently testable (quickstart.md Scenario 1)

---

## Phase 4: User Story 2 - Navigate from a tree element to its SysML source (Priority: P2)

**Goal**: Clicking a leaf opens its `.sysml` file at the right line.

**Independent Test**: quickstart.md Scenario 2.

### Tests for User Story 2 ⚠️

- [X] T009 [P] [US2] Write `resolveSourceLocation` test cases 2 and 3 from `contracts/model-explorer-provider.md` in `tests/model-explorer.test.js`

### Implementation for User Story 2

- [X] T010 [US2] Implement `resolveSourceLocation(kind, id, readFile)` in `modelExplorerProvider.ts` per `contracts/model-explorer-provider.md` and `data-model.md`'s file-by-kind lookup table (depends on T009 existing and failing)
- [X] T011 [US2] Wire each leaf's `command` (VS Code `TreeItem.command`) to open the resolved file and reveal the resolved line via `vscode.window.showTextDocument` + `TextEditorRevealType`, using real `fs.readFileSync` for `resolveSourceLocation`'s `readFile` parameter (depends on T006, T010)
- [X] T012 [US2] Surface `resolveSourceLocation` failures (stale/missing `@id`) via `vscode.window.showErrorMessage`, not a silent failure or wrong-location open (depends on T011)

**Checkpoint**: User Stories 1 AND 2 both independently functional (quickstart.md Scenarios 1–2)

---

## Phase 5: User Story 3 - See traceability as tree structure (Priority: P3)

**Goal**: Requirement nodes expand to show derive/verify children.

**Independent Test**: quickstart.md Scenario 3.

### Tests for User Story 3 ⚠️

- [X] T013 [P] [US3] Write `buildTree` traceability-children test case (case 1's trace-link portion) in `tests/model-explorer.test.js`, covering a requirement with both link types and one with neither

### Implementation for User Story 3

- [X] T014 [US3] Extend `buildTree()`'s requirement nodes with `derive`/`verify` children computed from `model.traceability`, per `data-model.md` (depends on T013 existing and failing)
- [X] T015 [US3] Render trace-link children in `getChildren()` with "Derived from: ..." / "Verified by: ..." labels, clickable via the same navigation path as T011 (depends on T014, T011)

**Checkpoint**: All three user stories independently functional (quickstart.md Scenarios 1–3)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 [P] Run `cd parser && node extract.js` as a final sanity check
- [X] T017 [P] Update `README.md`'s `vscode-extension/` description to mention the Model Explorer view
- [X] T018 Package: `cd vscode-extension && rm -rf out *.vsix && npm run compile && npx @vscode/vsce package --allow-missing-repository`
- [X] T019 Run `node --test`; confirm all tests pass (existing + new `model-explorer.test.js`)

---

## Dependencies & Execution Order

- **Foundational (T001–T003)** blocks all user stories.
- **US1 (Browse)** has no dependency on US2/US3.
- **US2 (Navigate)** needs US1's `getChildren`/leaf rendering (T006) to attach commands to.
- **US3 (Traceability)** needs US2's navigation wiring (T011) for its own children to be clickable, and extends US1's `buildTree()`.
- **Polish** depends on all three stories.

### Parallel Opportunities

- T004, T009, T013 (test-writing for each story) can be drafted in parallel ahead of their implementation tasks.
- T016 and T017 in Polish, in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2: Foundational
2. Phase 3: User Story 1
3. **STOP and VALIDATE**: quickstart.md Scenario 1 — a browsable (if not yet clickable) tree is already a real improvement over hunting through files manually

## Notes

- No `[Story]` label on Setup/Foundational/Polish tasks.
- No Playwright tasks in this feature — see research.md Decision 5.
