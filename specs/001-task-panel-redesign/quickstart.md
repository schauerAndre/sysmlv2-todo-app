# Quickstart: Validating the To-Do List App Panel

## Prerequisites

```bash
cd vscode-extension
npm install
npm run compile
npx @vscode/vsce package
```

Install the resulting `.vsix` (Extensions view -> `...` -> Install from VSIX), and open the `sysmlv2-todo-digital-thread/` folder itself as the VS Code workspace (not a parent folder — `generated/todo-model.generated.json` must resolve relative to the workspace root).

## Scenario 1 — Browse and filter (User Story 1)

1. Run `cd parser && node extract.js` to ensure `generated/todo-model.generated.json` is current.
2. Open VS Code. Click the "To-Do List App" icon in the Activity Bar.
3. **Expect**: All/Open/In Progress/Done tabs with correct counts (2 tasks total, both `open` in the demo data — counts should read All 2, Open 2, In Progress 0, Done 0).
4. Type `linkedin` in the filter box. **Expect**: only "Write LinkedIn article" remains, tab counts update to reflect the filtered set.
5. Clear the filter. Edit `data/02-task-list-specification.sysml` by hand to change `task002`'s status, run `node parser/extract.js` again, click the panel's refresh icon. **Expect**: the row updates without restarting VS Code.

## Scenario 2 — Task details + traceability (User Story 2)

1. Click "Write LinkedIn article" in the list.
2. **Expect**: Task Details section shows Title, Description, Status, Priority, Created, Updated for that task.
3. **Expect**: Related Requirement / Related Use Case show the system-satisfied requirements (`REQ-TODO-001..008`) and their derived use cases (`UC-01..08`) as a list — not a single hardcoded pair (see research.md Decision 4).
4. Delete `generated/todo-model.generated.json`, reload the panel. **Expect**: an explicit "run the extractor" empty state, no crash, no blank panel.
5. Restore it with `node parser/extract.js` and refresh.

## Scenario 3 — Edit status/priority (User Story 3)

1. Select a task. Change its Status dropdown to "In Progress".
2. **Expect**: the row's badge and the tab counts update; `data/02-task-list-specification.sysml`'s corresponding `:>> status = ...;` line now reads `TaskStatus::inProgress`, and every other line in that file is byte-for-byte unchanged from before the edit.
3. Change the same task's Priority dropdown. **Expect**: same pattern — one line changed, rest of file untouched.
4. Close and reopen the panel (or reload VS Code). **Expect**: both edits are still there (durability, SC-004).
5. Run `node --test` from the repo root (auto-discovers every `*.test.js` in `tests/`, including the writer unit tests). **Expect**: all pass — confirming the edit didn't corrupt the file for the app-level tests either.
