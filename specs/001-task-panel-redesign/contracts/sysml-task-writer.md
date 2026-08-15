# Contract: sysmlTaskWriter

A pure(ish) function module, unit-testable without VS Code.

## `patchTask(fileText: string, taskId: string, field: "status" | "priority" | "updatedAt", value: string): string`

**Input**: the full current text of `data/02-task-list-specification.sysml`, a task id (e.g. `"TASK-002"`), the field to change, and its new value (a `TaskStatus`/`TaskPriority` enum literal name, e.g. `"inProgress"`, `"high"`).

**Behavior**:
1. Find `// @id: <taskId>` followed by `occurrence <varName> : Task { ... }` (same regex shape `parser/extract.js`'s `extractParts` already uses to read this file — reuse that pattern, don't reinvent it).
2. Within that block, find the `:>> <field> = ...;` line. `status`/`priority` are enum-qualified (`TaskStatus::open`, `TaskPriority::high`) and get re-serialized as `<EnumTypeName>::<value>`; `updatedAt` is a quoted string and gets re-serialized as `"<value>"`. Replace only the value on that one line. If no such line exists in the block (shouldn't happen for a well-formed task, but don't assume), throw a descriptive error instead of silently no-op'ing.
3. Return the full file text with only that one line changed — every other byte (including unrelated whitespace, comments, other tasks, the `backlog` occurrence) identical to the input.

**Errors** (throw, caller decides how to surface):
- `Task ${taskId} not found` — no matching `@id` block
- `Field ${field} not found on task ${taskId}` — block found but no matching `:>>` line

**Non-goals**: this function does not write the file to disk and does not run the extractor — that's the caller's (`taskPanelProvider.ts`'s) job, so the transform itself stays trivially testable with plain strings in/out.

## Test cases (for `node:test`, mirrors the style of `tests/todo-app.test.js`)

1. Given the real current contents of `data/02-task-list-specification.sysml`, patching `TASK-001` status to `inProgress` changes only that one line.
2. Patching `TASK-002` priority to `low` changes only that one line, leaving `TASK-001` and `backlog` untouched.
3. Patching an unknown task id throws `Task TASK-999 not found`.
4. Round-trip idempotency: patching a field to its current value returns text identical to the input.
