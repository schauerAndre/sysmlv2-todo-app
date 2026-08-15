# sysmlv2-todo-digital-thread

A small, complete Digital Thread demonstrator built with SysML v2 — used as the running example for the LinkedIn blog series in `../BlogSeries-4-Posts.md`.

```text
spec/*.sysml + data/*.sysml → parser/extract.js → generated/todo-model.generated.json → vscode-extension/
                                                 ↘
                                05-test-cases.sysml @implementedBy → tests/todo-app.test.js → app/todoApp.js
```

Verified against the official grammar and shipped standard library in `C:\projects\sysml\SysML-v2-Release` (BNF + `sysml.library`), not just "looks plausible."

## Why this exists

Not to build another to-do app. To show that SysML v2 can specify a software-intensive system end-to-end — use cases, requirements, data model, task/list specification, logical architecture, traceability, test cases, physical architecture — using SysML v2's own relationship constructs (`satisfy`, `verify`, `dependency`, `allocate`), not comment conventions standing in for them, all the way down to real, passing software tests, and that the model can drive a real, running artifact instead of staying documentation.

## Structure

- `spec/` — the tool specification, 6 files:
  - `01-use-cases.sysml`, `02-requirements.sysml` — the content.
  - `03-architecture.sysml` — **logical** architecture (functional roles, technology-agnostic). Also where `satisfy requirement ... by todoDigitalThread;` lives: the *system* satisfies the requirements, not any individual example task in `data/02-task-list-specification.sysml` — a task is content the app manages, not the thing that fulfills a requirement.
  - `04-traceability.sysml` — UC → REQ links via `dependency ... from ... to ...;` (the one link type with no dedicated SysML v2 keyword in this release).
  - `06-physical-architecture.sysml` — **physical** architecture, refining the logical one via real `allocate ... to ...;` statements onto concrete processes/files/tech (Node.js process, TypeScript extension host, JSON file on disk).
  - REQ → TEST uses real `verify requirement verifiedRequirement : ...;` inside each verification case's objective in `05-test-cases.sysml` (definition-level, unbound), re-bound to a concrete subject via `verify ... :>> verifiedRequirement;` usages in `03-architecture.sysml`; each verification case also carries `// @implementedBy: tests/todo-app.test.js#<TestName>` pointing at a real, runnable test.
- `data/` — the data model and instance data, 2 files:
  - `01-data-model.sysml` — the `TodoDataModel` package: `Task`/`TodoList` occurrence defs (`TaskStatus` now has three values — `open`, `inProgress`, `completed`), plus the `CriticalPathTaskMetadata`/`SprintBacklogListMetadata` `SemanticMetadata` subtypes tagging Task/TodoList usages with project-management concepts (same pattern the standard library itself uses in `Domain Libraries/Requirement Derivation/RequirementDerivation.sysml`) — kept in the same file since both describe the shape of the data, separate from the tool specification.
  - `02-task-list-specification.sysml` — concrete `Task`/`TodoList` occurrences (example backlog content) built on `01-data-model.sysml`.
- `app/todoApp.js` — minimal reference implementation of `todoDigitalThread` (ARCH-APP): the thing the model says satisfies REQ-TODO-001..005. Plain Node.js, no dependencies.
- `tests/todo-app.test.js` — real software tests, one per SysML verification case, same names (`CreateTaskTest`, `ViewTasksTest`, ...), Given/When/Then comments copied from each case's `doc`. Uses Node's built-in test runner.
- `tests/sysml-task-writer.test.js` — unit tests for `vscode-extension/src/sysmlTaskWriter.ts`'s `patchTask()`/`addTask()`/`deleteTask()`/`nextTaskId()`, the text-patch functions the extension panel uses to write status/priority edits, new tasks, and deletions back into `data/02-task-list-specification.sysml` without a full SysML writer. Requires `npm run compile` inside `vscode-extension/` first (tests run against the compiled `out/sysmlTaskWriter.js`).
- `tests/webview-harness.js` — a Playwright-driven check of the actual production webview markup (`vscode-extension/src/webviewMarkup.ts`, compiled to `out/webviewMarkup.js`, has no `vscode` import specifically so this can `require()` it outside the extension host). Renders it in a real Chromium page with a small in-page mock of the extension-host side of the postMessage contract, then drives filtering/selecting/editing/creating/deleting through real DOM interaction — this repo has no way to drive an actual interactive VS Code window, so this is the closest thing to a real UI test the panel gets. Also writes reference screenshots to `tests/screenshots/`. Run with `node tests/webview-harness.js` (needs `cd vscode-extension && npm install && npm run compile` first, and Chromium via `npx playwright install chromium` once).
- `parser/` — `extract.js`, a purpose-built demo extractor (see `parser/README.md`). Reads `@id`/`@implementedBy` comments (for stable IDs and test references) plus the real `satisfy`/`verify`/`dependency`/`metadata ... about ...` constructs above. Not a general SysML v2 parser.
- `generated/todo-model.generated.json` — actual output of running the extractor against `spec/` and `data/`: 11 use cases, 11 requirements, 2 tasks, 1 list, 13 test cases (each with `implementedBy`), 35 trace links (`derive`/`satisfy`/`verify`), 2 metadata tags. Regenerate with `cd parser && node extract.js`.
- `vscode-extension/` — a VS Code extension with two views:
  - "To-Do List App", a custom Activity Bar panel (`taskPanelProvider.ts`, a `WebviewViewProvider`): a filterable/searchable task list with status tabs (All/Open/In Progress/Done) and count badges, an inline (+) create-task input, plus an inline Task Details section showing Title, Description, editable Status/Priority dropdowns, Related Requirement(s)/Use Case(s) (resolved from the generated model's `traceability` data — see `specs/001-task-panel-redesign/research.md` Decision 4 for why that's a list, not a single hardcoded pair), Created/Updated timestamps, and a delete action gated by an inline Yes/Cancel confirm. Every create/edit/delete round-trips through `sysmlTaskWriter.ts`, which text-patches `data/02-task-list-specification.sysml` and re-runs `parser/extract.js` via the extension host's own Node runtime (not a `node` binary resolved from `PATH`) — the SysML model stays the source of truth, changes are never written straight to the generated JSON. Icons use the real `@vscode/codicons` font (bundled as a small `dependencies` entry, loaded via `webview.asWebviewUri`/`localResourceRoots`), not unicode approximations.
  - "Model Explorer", a native `TreeView` in the Explorer sidebar (`modelExplorerProvider.ts` wrapping the vscode-free `modelExplorerLogic.ts`): browses Use Cases/Requirements/Test Cases grouped from the generated model, with each Requirement expandable into its "Derived from"/"Verified by" trace links (from the same `traceability` data, never a hardcoded mapping). Clicking any element opens its `.sysml` source at the matching `// @id:` line, found by a plain text search at click time, not a stored/extracted position — see `specs/003-model-explorer/research.md`.
  - Not published; scaffold only — install the packaged `.vsix` or run via `F5` in VS Code with this folder open once `npm install && npm run compile` has been run inside `vscode-extension/`.

## Status

This is the "public demo path" from the blog plan: no commercial tooling required, runs with plain Node.js. The "professional path" (Sensmetry Syside Automator for validated model extraction) is not implemented here — it's referenced as a future extension in the blog series, not a current claim.

## Regenerating the JSON after editing the model

```bash
cd parser && node extract.js
```

## Running the software tests

```bash
node --test
```

(Auto-discovers every `*.test.js` under `tests/`. Compile the extension first — `cd vscode-extension && npm run compile` — so `sysml-task-writer.test.js` can resolve its compiled module.)
