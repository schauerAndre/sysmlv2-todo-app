# Implementation Plan: Model Explorer Tree View

**Branch**: `003-model-explorer` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-model-explorer/spec.md`

## Summary

Add a native `TreeDataProvider`-based "Model Explorer" view, nested in the Explorer sidebar (the same contribution point the pre-001 tree used), showing Use Cases/Requirements/Test Cases groups sourced from `generated/todo-model.generated.json`. Clicking a leaf opens its `.sysml` source at the matching `// @id:` line, found by a plain text search, not a stored position. Requirement nodes show derive/verify trace links as children, reusing the same `traceability` array the To-Do panel already consumes.

## Technical Context

**Language/Version**: TypeScript 5.4, same as 001/002. No new npm dependencies for the extension itself (Playwright stays a devDependency used only by the To-Do panel's harness, unrelated to this feature).

**Primary Dependencies**: `vscode.TreeDataProvider`, `vscode.window.showTextDocument`/`TextEditorRevealType` for navigation.

**Storage**: Read-only — `generated/todo-model.generated.json` only. No writes (this feature has no editing capability).

**Testing**: `node:test` for the pure logic (`buildTree`, `resolveSourceLocation`) in a new `tests/model-explorer.test.js`. No Playwright coverage (research.md Decision 5 — native `TreeView` has no webview DOM for Playwright to attach to).

**Target Platform**: unchanged.

**Project Type**: Single project, same `vscode-extension/` folder.

**Performance Goals**: unchanged — trivial at demo scale (11 use cases, 11 requirements, 8 test cases).

**Constraints**: MUST NOT parse `.sysml` for tree *content* (FR-010) — only a plain-text line search for an already-known `// @id:` string, at click time, within an already-identified file.

**Scale/Scope**: demo scale, unchanged.

## Constitution Check

Same as 001/002: no ratified constitution, no gates to check.

## Project Structure

### Documentation (this feature)

```text
specs/003-model-explorer/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── model-explorer-provider.md
└── quickstart.md
```

### Source Code (repository root)

```text
vscode-extension/
├── package.json                # MODIFY: add contributes.views.explorer entry + refresh command
├── src/
│   ├── extension.ts             # MODIFY: register the new TreeDataProvider alongside the existing WebviewViewProvider
│   └── modelExplorerProvider.ts # NEW: buildTree(), resolveSourceLocation(), TreeDataProvider implementation
└── (no changes to taskPanelProvider.ts/webviewMarkup.ts/sysmlTaskWriter.ts)

tests/
└── model-explorer.test.js       # NEW: node:test coverage per contracts/model-explorer-provider.md
```

**Structure Decision**: Single new provider file plus `extension.ts`/`package.json` wiring — additive, no changes to the To-Do List panel's own files. The two views (To-Do List App panel, Model Explorer tree) are independent `contributes` entries registered from the same `activate()`.

## Complexity Tracking

No constitution gates in force; no violations to justify.
