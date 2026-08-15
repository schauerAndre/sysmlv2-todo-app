# Data Model: Model Explorer Tree View

No changes to `generated/todo-model.generated.json`'s shape or to `parser/extract.js`. This feature is a pure new consumer of the existing `useCases`/`requirements`/`testCases`/`traceability` arrays.

## Tree structure (in-memory only, not persisted)

```
Model Explorer
├── Use Cases (11)
│   ├── UC-01 CreateTask
│   ├── UC-02 ViewTasks
│   └── ...
├── Requirements (11)
│   ├── REQ-TODO-001 CreateTaskRequirement
│   │   ├── Derived from: UC-01 CreateTask
│   │   └── Verified by: TEST-001 CreateTaskTest
│   └── ...
└── Test Cases (8)
    ├── TEST-001 CreateTaskTest
    └── ...
```

## Tree item kinds

| Kind | Label | Tooltip | Click behavior |
|---|---|---|---|
| GroupItem | `"Use Cases (N)"` / `"Requirements (N)"` / `"Test Cases (N)"` | none | expand/collapse only |
| UseCaseItem | `"<id> <name>"` | `description` | navigate to `spec/01-use-cases.sysml` |
| RequirementItem | `"<id> <name>"` | `text` | navigate to `spec/02-requirements.sysml`; expandable (trace children) |
| TestCaseItem | `"<id> <name>"` | `description` | navigate to `spec/05-test-cases.sysml` |
| TraceLinkItem (child of RequirementItem) | `"Derived from: <id> <name>"` / `"Verified by: <id> <name>"` | none | navigate to the linked element's own location |

## SourceLocation resolution (computed, not stored)

```
resolveSourceLocation(kind, id):
  file = FILE_BY_KIND[kind]   // spec/01-use-cases.sysml | spec/02-requirements.sysml | spec/05-test-cases.sysml
  text = readFileSync(file)
  lineIndex = text.split("\n").findIndex(line => line.includes("// @id: " + id))
  if lineIndex === -1: throw NotFoundError(id, file)
  return { file, line: lineIndex }
```

Errors from this function (id not found in its expected file — stale reference, per spec.md edge case) surface as a `vscode.window.showErrorMessage`, not a silent failure or wrong-location open.
