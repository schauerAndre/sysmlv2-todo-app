# Research: To-Do List App Panel Redesign

## Decision 1: Single custom webview panel, not TreeView + separate WebviewPanel

**Decision**: Replace the current architecture — an Explorer-nested `TreeDataProvider` (`todoTreeProvider.ts`) plus a separate `WebviewPanel` opened on click (`taskDetailsPanel.ts`) — with one `WebviewViewProvider` registered in its own Activity Bar container. The list, filter/search, status tabs, and Task Details section all render inside that single webview, communicating list→details selection via in-page JS state (no extension round-trip needed for selection itself).

**Rationale**: The mockup shows list and details as one visually integrated panel with custom row styling (color-coded status badges, priority flags) that a native `TreeView` cannot render — VS Code tree items are text+icon only. A single webview can own the whole layout and match the mockup directly.

**Alternatives considered**:
- Keep TreeView for the list, WebviewPanel for details (today's actual design) — rejected: can't produce the mockup's merged look, and requires the extension to manually keep two separate UI surfaces in sync on every model reload.
- Two separate `WebviewView`s (one for list, one for details) docked in the same container — rejected: adds an extra postMessage hop for selection with no real benefit over one webview owning both regions.

## Decision 2: Edits persist via targeted text patch of data/02-task-list-specification.sysml, not a SysML writer or the JSON cache

**Decision**: A small serializer (`sysmlTaskWriter.ts`) locates the specific task's `occurrence <id> : Task { ... }` block in `data/02-task-list-specification.sysml` by its `// @id: TASK-NNN` marker, and replaces only the `:>> status = ...;` / `:>> priority = ...;` lines inside that block, leaving everything else in the file byte-for-byte unchanged. After writing, the extension shells out to `node parser/extract.js` to regenerate `generated/todo-model.generated.json`, then reloads.

**Rationale**: This repo's premise is that the SysML model is the source of truth (see top-level README, `modelLoader.ts`'s own doc comment). Writing only to the JSON cache would make edits vanish the next time the model is re-extracted — silently lying about where the data lives. A full SysML v2 AST writer/pretty-printer doesn't exist in this toolchain (the extractor is explicitly "not a SysML v2 parser," only a regex reader) and building one is disproportionate to a demo. A targeted text patch is the smallest change that keeps the file both human-editable and machine-editable without a full round-trip parser.

**Alternatives considered**:
- Full SysML v2 parse → mutate AST → pretty-print — rejected: no such writer exists here, and building one is a project of its own, far beyond this feature's scope.
- Write directly to `generated/todo-model.generated.json` — rejected: violates FR-011 and the project's stated single-source-of-truth model; the next `extract.js` run would silently discard the edit.
- Maintain a separate SQLite/JSON "overlay" store for edits, merged with extracted data at read time — rejected: introduces a second source of truth and a merge-conflict class of bug that doesn't exist today, for a demo whose entire point is *not* needing that.

## Decision 3: "In Progress" is a genuine new TaskStatus enum value, added in data/01-data-model.sysml

**Decision**: `TaskStatus` gains a third enum literal, `inProgress`, alongside the existing `open`/`completed`. The extractor's existing `enumField()` regex reads any enum literal name generically, so no parser change is needed for the enum addition itself — only a label map in the webview (`inProgress` → "In Progress").

**Rationale**: The mockup's status tabs (All/Open/In Progress/Done) require a real third state; inventing a fake "in progress" purely in the UI while the model only knows two states would make the SysML model *not* reflect what the app actually stores — the opposite of this repo's point.

**Alternatives considered**: Deriving "in progress" from some other signal (e.g. "has been opened but not completed within N days") — rejected: fabricated, not testable, and not something the model or a user could set explicitly.

## Decision 4: Related Requirement / Related Use Case shown per task reflect the model's actual (system-level) traceability, not a fabricated per-task link

**Decision**: This repo's `satisfy` links run REQ → the system (`todoDigitalThread`), not REQ → individual `Task` occurrences — there is no SysML relationship today that ties a specific task instance to a specific requirement. FR-007 explicitly forbids inventing a hardcoded id-to-task mapping to paper over that. So the Task Details section's Related Requirement / Related Use Case fields show the requirements the *system* satisfies (via the existing `requirementsSatisfiedByApp()` helper in `modelLoader.ts`) and their derived use cases (via `relatedUseCasesForRequirement()`), rendered as a small list of chips rather than a single value.

**Rationale**: Honest to what the model actually encodes. Building a fake per-task requirement link would look better cosmetically (closer to the mockup's single-line display) but would be exactly the kind of hardcoded mapping FR-007 rules out.

**Alternatives considered**:
- Hardcode every task to show `REQ-TODO-001`/`UC-01` (the "create task" requirement/use case, since every task instance is definitionally an example of task creation) — rejected: this is precisely the hardcoded mapping FR-007 prohibits, even though it would visually match the mockup's single-value example most closely.
- Add real per-task `satisfy`/`derive` links in the SysML model so each task can point at a specific requirement — deferred: would require deciding *which* requirement each of the two demo tasks individually satisfies, which isn't a property of a to-do item in this domain (a task is content the app manages, not a thing that satisfies a requirement — see `spec/03-architecture.sysml`'s own comment on this). Out of scope for this feature; flagged as a possible follow-up if per-task traceability becomes a real need later.

**Flagged for the user**: this is a visible divergence from the mockup (list of chips vs. one line) — confirm this reading is acceptable before implementation, or provide the per-task linkage rule you'd want instead.

**SUPERSEDED**: per direct user feedback ("the requirements and UCs have nothing to do with the data model, so unnecessary to link and visualize them"), this decision is reversed. The Related Requirement/Related Use Case chips are removed entirely from the Task Details section — confirming, in hindsight, the concern already raised above: the link was always system-level, not really "about" the selected task, and showing it there implied a relationship (task ↔ requirement) that doesn't actually exist in the data model. Replaced with `listId`/`lists` (which `TodoList` the task belongs to) — the real data-model relationship. See `contracts/webview-messages.md`'s superseded note and `modelLoader.ts`'s `TodoTask.listId`.

## Decision 5: Testing scope — unit test the writer, manual quickstart for the webview UI

**Decision**: `sysmlTaskWriter.ts`'s patch logic gets `node:test` unit tests (pure text-in/text-out function, easy to isolate) alongside the existing `tests/todo-app.test.js`. The webview UI itself (rendering, filtering, click-to-select) is validated via the manual steps in `quickstart.md`, not automated.

**Rationale**: Consistent with the project's current testing posture — `tests/todo-app.test.js` covers the app logic, but the extension itself has no test harness today. Standing up VS Code extension UI test infrastructure (`@vscode/test-electron` + a UI driver) is real infrastructure work disproportionate to a demo repo whose stated goal is "public demo path... no commercial tooling required."

**Alternatives considered**: Full `@vscode/test-electron` integration suite — rejected for scope; noted as a legitimate future improvement if this extension grows beyond demo status.
