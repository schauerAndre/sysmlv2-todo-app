# Contract: Extension Host <-> Webview Messaging (additions to 001's contract)

Extends `specs/001-task-panel-redesign/contracts/webview-messages.md` — same channel, same `model`/`error`/`emptyState` host->webview messages, no changes to those. New webview->host message types only:

## Webview -> Host

### `createTask`

```jsonc
{ "type": "createTask", "title": "Write follow-up post" }
```

Host response: on success, a fresh `model` message (new task included). On validation failure (empty title) or write/extract failure, an `error` message — validation errors get `context: "create-validation"`, write/extract failures get `context: "edit"` (same bucket as 001's edit errors, since it's the same round-trip failure class).

### `deleteTask`

```jsonc
{ "type": "deleteTask", "taskId": "TASK-002" }
```

Only sent after the webview's own inline confirmation step completes — the host does not re-confirm. Host response: on success, a fresh `model` message (task removed, selection cleared if it was the deleted task). On failure, an `error` message with `context: "edit"`.

## Out of scope for this contract

- No `updateTaskTitle`/`updateTaskDescription` message — editing those fields remains out of scope (see spec.md Assumptions).
- No bulk/multi-select delete — one task at a time, matching the mockup's single trash icon tied to the currently selected task.
