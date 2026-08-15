# Contract: Extension Host <-> Webview Messaging

The webview (`taskPanelProvider.ts`'s HTML/JS) and the extension host (`taskPanelProvider.ts`'s TypeScript side) communicate via VS Code's standard `webview.postMessage` / `acquireVsCodeApi().postMessage` channel. No network, no external API.

## Host -> Webview

### `model` (full refresh)
Sent on initial webview resolve, after manual refresh, and after any successful edit round-trip.

```jsonc
{
  "type": "model",
  "tasks": [
    { "id": "TASK-001", "title": "...", "description": "...", "status": "open", "priority": "high",
      "createdAt": "...", "updatedAt": "...", "listId": "LIST-001" }
  ],
  "lists": [
    { "id": "LIST-001", "name": "Backlog" }
  ]
}
```

> **Superseded**: this message originally also carried a `traceability` field (`satisfiedRequirements`/`relatedUseCasesByRequirement`), rendered as "Related Requirement"/"Related Use Case" chips in the Task Details section (see research.md Decision 4). Removed per direct feedback: requirements/use cases aren't part of the data model (`data/01-data-model.sysml`'s `Task`/`TodoList`), so linking them into a task's details was linking two unrelated things — the `satisfy` links those chips were sourced from are REQ -> system, not REQ -> task, so the "relationship" displayed was never really about the selected task at all. Replaced with `listId`/`lists`, the actual data-model relationship (which `TodoList` a `Task` belongs to).

### `error`
Sent when the model can't be loaded/parsed, or an edit round-trip fails.

```jsonc
{ "type": "error", "context": "load" | "edit", "message": "human-readable string" }
```

### `emptyState`
Sent instead of `model` when `generated/todo-model.generated.json` doesn't exist yet.

```jsonc
{ "type": "emptyState", "reason": "no-generated-json" }
```

## Webview -> Host

### `ready`
Sent once on webview load, requesting the initial `model`/`emptyState` push.

```jsonc
{ "type": "ready" }
```

### `refresh`
User clicked the refresh toolbar icon.

```jsonc
{ "type": "refresh" }
```

### `editTask`
User changed a Status or Priority dropdown in the Task Details section.

```jsonc
{ "type": "editTask", "taskId": "TASK-001", "field": "status" | "priority", "value": "inProgress" }
```

Host response: on success, a fresh `model` message; on failure, an `error` message with `context: "edit"`. The webview must not optimistically apply the edit to its own state before the host confirms — the round-trip (write `.sysml` -> re-extract -> reload) is the only source of truth for whether the edit actually took.

## Out of scope for this contract (per spec Assumptions)

- `createTask` / `deleteTask` message types — not defined, not handled. If the webview ever sends them (it shouldn't, since the (+) and trash affordances are out of scope for this feature), the host should ignore them rather than crash.
