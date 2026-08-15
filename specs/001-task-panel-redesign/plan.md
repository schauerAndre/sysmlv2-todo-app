# Implementation Plan: To-Do List App Panel Redesign

**Branch**: `001-task-panel-redesign` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-task-panel-redesign/spec.md`

## Summary

Replace the extension's Explorer-nested `TreeView` + separate detail `WebviewPanel` with one custom `WebviewViewProvider` in its own Activity Bar container, matching the target mockup: a filterable/searchable task list with status tabs and count badges, plus an inline Task Details section (editable Status/Priority, traced Related Requirement/Use Case, Created/Updated). Edits round-trip through `data/02-task-list-specification.sysml` (a targeted text patch, not a full SysML writer) and `parser/extract.js`, keeping the SysML model as the single source of truth. A new `inProgress` `TaskStatus` enum value is added to `data/01-data-model.sysml` to support the mockup's third status tab.

## Technical Context

**Language/Version**: TypeScript 5.4 (compiled to CommonJS via `tsc`), running on the Node.js runtime embedded in the VS Code extension host.

**Primary Dependencies**: `vscode` extension API (`WebviewViewProvider`, `postMessage`), no new npm dependencies — the panel's HTML/CSS/JS is generated inline (matches the existing project's "no dependencies, plain Node.js" ethos in `parser/README.md`).

**Storage**: Files only — `generated/todo-model.generated.json` (read), `data/02-task-list-specification.sysml` (read + targeted-patch write for edits). No database.

**Testing**: `node:test` (already used by `tests/todo-app.test.js`), extended with unit tests for `sysmlTaskWriter.patchTask`. Webview UI itself validated manually via `quickstart.md` (see research.md Decision 5 for why automated extension-UI testing is out of scope).

**Target Platform**: VS Code desktop extension host (Windows/macOS/Linux), `engines.vscode: ^1.85.0` (unchanged from current `package.json`).

**Project Type**: Single project — existing `vscode-extension/` folder within this repo, no new top-level project.

**Performance Goals**: Filter/tab updates under 200ms (SC-002) — trivial at this data scale (a handful of tasks), no special optimization needed; filtering happens in the webview's JS over an already-loaded in-memory array.

**Constraints**: Extension MUST NOT parse `.sysml` files directly (FR-011) — it only ever reads `generated/todo-model.generated.json` and, for edits, text-patches `data/02-task-list-specification.sysml` without parsing SysML syntax (regex-located, not AST-based, same approach `parser/extract.js` already uses).

**Scale/Scope**: Demo scale — 2 example tasks, 1 list, single workspace. Not designed for large task counts (no virtualization needed).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` has not been ratified yet — it is still the unfilled template (no `/speckit-constitution` run for this project). There are no project-specific principles to gate against. **Recommendation**: run `/speckit-constitution` before further features if you want governance rules enforced going forward; not a blocker for this feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-panel-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── webview-messages.md
│   └── sysml-task-writer.md
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
vscode-extension/
├── package.json          # MODIFY: viewsContainers.activitybar + views (webview type), drop explorer-nested view
├── src/
│   ├── extension.ts       # MODIFY: register WebviewViewProvider instead of TreeDataProvider + command-opened panel
│   ├── modelLoader.ts      # MODIFY: add traceability helpers usable per-refresh (mostly already present)
│   ├── taskPanelProvider.ts    # NEW: WebviewViewProvider — owns HTML/CSS/JS generation, postMessage handling
│   ├── sysmlTaskWriter.ts      # NEW: patchTask() text-patch serializer (see contracts/sysml-task-writer.md)
│   ├── todoTreeProvider.ts     # REMOVE: superseded by taskPanelProvider.ts
│   └── taskDetailsPanel.ts     # REMOVE: superseded by taskPanelProvider.ts (details now inline, not a separate panel)
└── out/                   # unchanged (tsc output dir)

data/
└── 01-data-model.sysml    # MODIFY: TaskStatus enum gains `inProgress`

tests/
└── (new) sysml-task-writer.test.js   # NEW: node:test coverage for patchTask()
```

**Structure Decision**: Single project, all changes inside the existing `vscode-extension/` folder plus one `data/` model edit. No new top-level directories. `todoTreeProvider.ts` and `taskDetailsPanel.ts` are removed rather than kept alongside the new provider — the mockup shows one merged panel, not tree-plus-webview, so keeping both would leave dead code and two views actively fighting for the same job.

## Complexity Tracking

*No constitution gates are in force for this project (see Constitution Check above), so no violations to justify.*
