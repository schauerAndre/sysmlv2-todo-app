# Research: Model Explorer Tree View

## Decision 1: Native `vscode.TreeDataProvider`, not a webview

**Decision**: `ModelExplorerProvider implements vscode.TreeDataProvider<ModelTreeItem>`, registered via `vscode.window.registerTreeDataProvider` in a new Explorer-nested view (`contributes.views.explorer`), the same contribution point the pre-001 `todoTreeProvider.ts` used.

**Rationale**: Confirmed after deep-comparing both halves of the mockup against what's buildable: the left panel is Sensmetry Syside's own product chrome (a real commercial extension, out of scope per this repo's README), not a pattern to clone with a webview. `TreeDataProvider` is also simply the correct native tool for hierarchical, mostly-read navigation — icons, expand/collapse, click-to-reveal are all built in, unlike the To-Do List panel which needed custom badges/filtering a `TreeView` can't render.

**Alternatives considered**: A webview tree (styled `<ul>`/`<li>` with custom icons) — rejected: no functional benefit over native `TreeView` for this use case, and loses free features (keyboard nav, native theming, `reveal()`).

## Decision 2: Navigation is a plain text search for `// @id: <id>`, not a stored line number

**Decision**: `NavigateToModelSourceRequirement`'s implementation opens the known source file (`spec/01-use-cases.sysml`, `spec/02-requirements.sysml`, or `spec/05-test-cases.sysml`, chosen by element kind) and searches its text for the literal string `// @id: <id>` to find the line, rather than the extractor emitting a `{ file, line }` field into the generated JSON.

**Rationale**: Keeps `generated/todo-model.generated.json`'s shape unchanged (no extractor modification needed) and keeps the extractor's job as "extract semantic content," not "extract source positions," which would create a second thing to keep in sync (line numbers shift on every unrelated edit). A live text search at click time is always correct relative to the file's current state; a stored line number could go stale the moment someone edits the file above it.

**Alternatives considered**: Extending `extract.js` to emit source locations — rejected: adds extractor complexity for a need fully met by a two-line `indexOf`/`split("\n")` at click time.

## Decision 3: Which file each element kind lives in is a fixed lookup table, not detected

**Decision**: A small map — `useCase -> "spec/01-use-cases.sysml"`, `requirement -> "spec/02-requirements.sysml"`, `testCase -> "spec/05-test-cases.sysml"` — lives in the tree provider. Not derived from the generated JSON (which doesn't carry file paths) and not searched for across all of `spec/`.

**Rationale**: This repo's file layout (one file per element kind) is itself a stable, intentional convention documented in the top-level README's Structure section — hardcoding the same three-entry map the README already documents is simpler and more honest than building a generic "search every `.sysml` file for this id" scanner for a demo with exactly 3 relevant files.

**Alternatives considered**: Scan all `spec/*.sysml` files for the id — rejected: unnecessary generality, and slower for no benefit at this file count.

## Decision 4: Traceability children are computed from `generated/todo-model.generated.json`'s `traceability` array, mirroring the To-Do panel's existing pattern

**Decision**: When a `RequirementTreeItem` is expanded, `getChildren()` filters the already-loaded model's `traceability` array for `type === "derive" && to === reqId` (-> "Derived from" child) and `type === "verify" && from === reqId` (-> "Verified by" children), resolving the linked element's name from the corresponding array (`useCases`/`testCases`).

**Rationale**: Exactly the same data source and filtering pattern `buildTraceability()` in `taskPanelProvider.ts` already uses for the To-Do panel's Related Requirement/Use Case chips — no new data shape, no new extraction logic, just a second consumer of the same array. Reinforces FR-008's "never a hardcoded mapping" the same way 001's equivalent decision did.

## Decision 5: Testing — logic-level tests for id-lookup/navigation-target resolution, no new Playwright coverage

**Decision**: `modelExplorerProvider.ts`'s pure logic (grouping elements, resolving a `SourceLocation` for a given id, filtering traceability children) gets `node:test` coverage in a new `tests/model-explorer.test.js`. No Playwright harness for this feature — `TreeDataProvider` is native VS Code UI with no webview DOM to drive; Playwright has nothing to attach to here (unlike the To-Do panel's webview, which is exactly the kind of thing Playwright CAN meaningfully test).

**Rationale**: Playwright validates *rendered/interactive DOM behavior* — it has no equivalent capability against VS Code's native `TreeView` widgets without the much heavier `@vscode/test-electron` machinery, which 001/002's research already ruled out as disproportionate to this demo's scope.
