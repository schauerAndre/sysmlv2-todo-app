# Implementation Plan: Create and Delete Tasks from the Panel

**Branch**: `002-create-delete-tasks` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-create-delete-tasks/spec.md`

## Summary

Add create (`+` toolbar icon, inline title input) and delete (trash icon in Task Details, inline Yes/Cancel confirm) to the panel built in 001. Both extend the existing `sysmlTaskWriter.ts` text-patch approach: `addTask`/`deleteTask`/`nextTaskId` join `patchTask`, all operating on `data/02-task-list-specification.sysml`. No new SysML use cases/requirements — this closes an implementation gap for the already-modeled `REQ-TODO-001`/`REQ-TODO-004`, not new modeled behavior.

## Technical Context

**Language/Version**: TypeScript 5.4, same as 001. No new dependencies.

**Primary Dependencies**: none new.

**Storage**: Files only, same as 001 — reads/writes `data/02-task-list-specification.sysml`, reads `generated/todo-model.generated.json`.

**Testing**: `node:test`, extending `tests/sysml-task-writer.test.js` with 6 new cases (research.md Decision 5). No new automated UI tests — manual `quickstart.md`.

**Target Platform**: unchanged from 001.

**Project Type**: Single project, same `vscode-extension/` folder.

**Performance Goals**: unchanged — trivial at demo scale.

**Constraints**: `nextTaskId`/collision-avoidance MUST read `data/02-task-list-specification.sysml` fresh from disk, never trust the in-memory/webview task list (research.md Decision 2). Extension still MUST NOT parse `.sysml` for *display* data (FR-008) — only the writer touches the file directly, same boundary as 001.

**Scale/Scope**: demo scale, unchanged.

## Constitution Check

Same as 001: `.specify/memory/constitution.md` is still the unfilled template — no gates to check.

## Project Structure

### Documentation (this feature)

```text
specs/002-create-delete-tasks/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── webview-messages.md       # additions to 001's contract
│   └── sysml-task-writer.md      # addTask/deleteTask/nextTaskId
└── quickstart.md
```

### Source Code (repository root)

```text
vscode-extension/
├── src/
│   ├── sysmlTaskWriter.ts     # MODIFY: add addTask(), deleteTask(), nextTaskId()
│   └── taskPanelProvider.ts   # MODIFY: (+) icon + inline create input, trash icon + inline confirm,
│                               #         createTask/deleteTask message handlers
└── (no other files touched)

tests/
└── sysml-task-writer.test.js  # MODIFY: add the 6 cases from contracts/sysml-task-writer.md
```

**Structure Decision**: No new files, no new architecture — this feature is entirely additive within the two files 001 already introduced. Matches research.md Decision 3 (no new module for add/delete).

## Complexity Tracking

No constitution gates in force; no violations to justify.
