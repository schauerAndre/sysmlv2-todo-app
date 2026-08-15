# Quickstart: Validating the Model Explorer

## Prerequisites

```bash
cd vscode-extension && npm install && npm run compile && npx @vscode/vsce package
```

Install the `.vsix`, open `sysmlv2-todo-digital-thread/` as the workspace.

## Scenario 1 — Browse (User Story 1)

1. Open the Explorer sidebar. **Expect**: a "Model Explorer" tree view alongside the file tree, showing "Use Cases (11)", "Requirements (11)", "Test Cases (8)".
2. Expand each group. **Expect**: every element listed by id + name.
3. Hover a requirement. **Expect**: tooltip shows its `doc` text.
4. Click the view's refresh icon after editing/re-extracting the model. **Expect**: tree reflects the new counts without restarting VS Code.
5. Temporarily rename `generated/todo-model.generated.json`, reopen the view. **Expect**: a single explanatory node, not a broken/empty tree. Restore the file afterward.

## Scenario 2 — Navigate (User Story 2)

1. Click `UC-01 CreateTask`. **Expect**: `spec/01-use-cases.sysml` opens, cursor on its `// @id: UC-01` line.
2. Click `REQ-TODO-001`. **Expect**: `spec/02-requirements.sysml` opens at that requirement's line.
3. Click `TEST-001`. **Expect**: `spec/05-test-cases.sysml` opens at that test case's line.

## Scenario 3 — Traceability as tree (User Story 3)

1. Expand `REQ-TODO-001 CreateTaskRequirement`. **Expect**: "Derived from: UC-01 CreateTask" and "Verified by: TEST-001 CreateTaskTest" (and TEST-007, its second verification path from feature 002) appear as children.
2. Click the "Derived from" child. **Expect**: navigates to `UC-01`'s own location in `spec/01-use-cases.sysml`, not the requirement's.

## Regression check

```bash
node --test
```

**Expect**: all tests pass, including the new `model-explorer.test.js` cases.
