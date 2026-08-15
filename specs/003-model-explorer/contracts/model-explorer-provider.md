# Contract: modelExplorerProvider

Pure(ish) logic, unit-testable without VS Code (VS Code-specific glue — `vscode.TreeItem`, `vscode.window.showTextDocument` — stays a thin wrapper around these).

## `buildTree(model: TodoModel): GroupNode[]`

Returns the three top-level groups (`Use Cases`, `Requirements`, `Test Cases`) with their child nodes, each requirement node pre-computing its trace-link children per `data-model.md`. Pure function of the model — no I/O.

## `resolveSourceLocation(kind: "useCase" | "requirement" | "testCase", id: string, readFile: (path: string) => string): { file: string; line: number }`

Per `data-model.md`'s SourceLocation resolution. `readFile` is injected (not `fs.readFileSync` called directly) so this is testable with in-memory fixture strings, not real files.

**Errors**: throws `Id ${id} not found in ${file}` if no matching `// @id:` line exists.

## Test cases (tests/model-explorer.test.js)

1. `buildTree` on a fixture model with 2 use cases, 2 requirements (one with both a derive and a verify link, one with neither), 1 test case produces the correct 3 groups with correct counts and correct trace-link children only on the requirement that has them.
2. `resolveSourceLocation` finds the correct line for an id present in a fixture file string.
3. `resolveSourceLocation` throws a descriptive error for an id not present in the fixture.
4. `buildTree` on an empty model (no use cases/requirements/test cases) returns 3 groups with count 0 each, not an error.
