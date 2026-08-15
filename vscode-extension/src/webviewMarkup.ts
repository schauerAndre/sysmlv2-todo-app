/**
 * The To-Do List App webview's HTML/CSS/JS. Deliberately has NO import of
 * "vscode" -- that module only resolves inside a real extension host, and
 * keeping this file free of it lets tests/webview-harness.js `require()`
 * the compiled output directly in a plain Node + Playwright process to
 * validate the actual rendered/interactive behavior, not just that the
 * TypeScript compiles. See specs/003-model-explorer/research.md.
 */

export function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

export function buildWebviewHtml(cspSource: string, nonce: string, codiconCssUri: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; font-src ${cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${codiconCssUri}">
<style>${PANEL_CSS}</style>
</head>
<body>
<div id="header"><i class="codicon codicon-check"></i> TO-DO LIST APP</div>
<div id="listSectionHeader">
  <span class="section-label">TODO LIST</span>
  <span class="toolbar-icons">
    <button id="refresh" title="Refresh"><i class="codicon codicon-refresh"></i></button>
    <button id="addTask" title="Add task"><i class="codicon codicon-add"></i></button>
    <button id="filterToggle" title="Focus filter"><i class="codicon codicon-filter"></i></button>
  </span>
</div>
<div id="toolbar">
  <i class="codicon codicon-search" id="searchIcon"></i>
  <input id="filter" type="text" placeholder="Filter tasks..." />
</div>
<div id="createRow"></div>
<div id="tabs"></div>
<div id="list"></div>
<div id="detailsSectionHeader">
  <span class="section-label">TASK DETAILS</span>
  <span class="details-actions" id="detailsActions"></span>
</div>
<div id="details"></div>
<div id="statusbar">
  <span><i class="codicon codicon-circle-outline"></i> To-Do App</span>
  <span id="statusbarRight"></span>
</div>
<script nonce="${nonce}">${PANEL_JS}</script>
</body>
</html>`;
}

const PANEL_CSS = `
  :root {
    --status-open-bg: #2a3f5f; --status-open-fg: #7aa7e0;
    --status-inprogress-bg: #5c4413; --status-inprogress-fg: #f0a742;
    --status-done-bg: #1e5c2f; --status-done-fg: #8fd6a3;
    --priority-high: #f14c4c; --priority-medium: #f0a742; --priority-low: #7fb37f;
  }
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 0 10px 8px; }
  .codicon { font-size: 14px; vertical-align: -2px; }
  #header { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12px;
    letter-spacing: 0.04em; color: #4ec9b0; margin: 10px 0 10px; }
  #header .codicon { color: #4ec9b0; font-size: 13px; }
  #listSectionHeader, #detailsSectionHeader { display: flex; align-items: center; justify-content: space-between;
    margin: 10px 0 6px; }
  .section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; opacity: 0.85; }
  .toolbar-icons { display: flex; gap: 2px; }
  .toolbar-icons button, .details-actions button { background: transparent; border: none;
    color: var(--vscode-icon-foreground); cursor: pointer; padding: 2px 4px; border-radius: 3px; }
  .toolbar-icons button:hover, .details-actions button:hover { background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.08)); }
  #toolbar { position: relative; margin: 4px 0 10px; }
  #searchIcon { position: absolute; left: 7px; top: 50%; transform: translateY(-50%); opacity: 0.6; font-size: 13px; }
  #filter { width: 100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px 4px 26px; }
  #createRow { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
  #createRow input { flex: 1; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px; }
  #createRow button { cursor: pointer; }
  .details-actions { display: flex; align-items: center; gap: 2px; }
  .details-actions button.danger:hover { color: var(--vscode-errorForeground); }
  .confirm-text { font-size: 11px; opacity: 0.85; margin-right: 4px; }
  #tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
  .tab { padding: 2px 9px; border-radius: 10px; font-size: 11px; cursor: pointer;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
  .tab.active { background: var(--vscode-focusBorder); color: #fff; }
  .row { display: flex; align-items: flex-start; gap: 8px; padding: 7px 4px;
    border-bottom: 1px solid var(--vscode-widget-border, #333); cursor: pointer; }
  .row:hover { background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.04)); }
  .row.selected { background: var(--vscode-list-activeSelectionBackground); }
  .row-marker { flex: 0 0 auto; margin-top: 2px; font-size: 15px; }
  .row-marker.status-open { color: var(--vscode-icon-foreground); opacity: 0.6; }
  .row-marker.status-inProgress { color: var(--status-inprogress-fg); }
  .row-marker.status-completed { color: var(--status-done-fg); }
  .row-main { flex: 1 1 auto; min-width: 0; }
  .row-title { font-weight: 600; }
  .row-desc { font-size: 11px; opacity: 0.8; margin-top: 1px; }
  .row-meta { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 8px; white-space: nowrap; }
  .status-open { background: var(--status-open-bg); color: var(--status-open-fg); }
  .status-inProgress { background: var(--status-inprogress-bg); color: var(--status-inprogress-fg); }
  .status-completed { background: var(--status-done-bg); color: var(--status-done-fg); }
  .priority { font-size: 11px; font-weight: 600; white-space: nowrap; }
  .priority .codicon { font-size: 11px; margin-right: 3px; }
  .priority-high { color: var(--priority-high); }
  .priority-medium { color: var(--priority-medium); }
  .priority-low { color: var(--priority-low); }
  .tag-icon { font-size: 12px; margin-left: 5px; vertical-align: -1px; }
  .tag-icon.criticalPath { color: #ff8a4c; }
  .tag-icon.sprintBacklog { color: #7aa7e0; }
  #details { padding-top: 4px; }
  .field-row { display: flex; gap: 8px; margin: 6px 0; font-size: 12px; align-items: center; }
  .field-label { width: 90px; flex: 0 0 auto; opacity: 0.75; }
  .empty-state, .error-state { padding: 16px 4px; opacity: 0.8; font-size: 12px; }
  .error-state { color: var(--vscode-errorForeground); }
  #statusbar { display: flex; justify-content: space-between; align-items: center; font-size: 11px;
    margin: 14px -10px -8px; padding: 4px 10px; background: var(--vscode-focusBorder); color: #fff; opacity: 0.9; }
  #statusbar .codicon { font-size: 12px; margin-right: 4px; }
  select { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground);
    border: 1px solid var(--vscode-dropdown-border, transparent); border-radius: 10px; padding: 2px 6px; font-weight: 600; }
  select.select-status-open { color: var(--status-open-fg); }
  select.select-status-inProgress { color: var(--status-inprogress-fg); }
  select.select-status-completed { color: var(--status-done-fg); }
  select.select-priority-high { color: var(--priority-high); }
  select.select-priority-medium { color: var(--priority-medium); }
  select.select-priority-low { color: var(--priority-low); }
`;

const PANEL_JS = `
  const vscode = acquireVsCodeApi();
  const STATUS_LABEL = { open: "OPEN", inProgress: "IN PROGRESS", completed: "DONE" };
  const STATUS_ICON = { open: "circle-large-outline", inProgress: "record", completed: "pass-filled" };
  const PRIORITY_LABEL = { high: "High", medium: "Medium", low: "Low" };
  const TAB_ORDER = ["all", "open", "inProgress", "completed"];
  const TAB_LABEL = { all: "All", open: "Open", inProgress: "In Progress", completed: "Done" };
  const TAG_ICON = { criticalPath: "flame", sprintBacklog: "target" };
  const TAG_LABEL = { criticalPath: "Critical Path", sprintBacklog: "Sprint Backlog" };

  let state = { tasks: [], lists: [], metadataTags: [],
    activeTab: "all", filterText: "", selectedTaskId: null,
    createInputOpen: false, createDraftTitle: "", createError: null, pendingCreate: false,
    deleteConfirmingTaskId: null, pendingDeleteTaskId: null };

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function tagsFor(id) {
    return state.metadataTags.filter((t) => t.targetId === id).map((t) => t.tag);
  }

  function tagIconsHtml(id, extraClass) {
    return tagsFor(id)
      .map((tag) => '<i class="codicon codicon-' + (TAG_ICON[tag] || "tag") + ' tag-icon ' + tag + (extraClass ? " " + extraClass : "") +
        '" title="' + (TAG_LABEL[tag] || tag) + '"></i>')
      .join("");
  }

  function visibleTasks() {
    return state.tasks.filter((t) => {
      if (state.activeTab !== "all" && t.status !== state.activeTab) return false;
      if (!state.filterText) return true;
      const q = state.filterText.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });
  }

  function countFor(tab) {
    return state.tasks.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      if (!state.filterText) return true;
      const q = state.filterText.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }).length;
  }

  function renderCreateRow() {
    const row = document.getElementById("createRow");
    if (!state.createInputOpen) {
      row.innerHTML = "";
      return;
    }
    row.innerHTML =
      '<input id="createTitle" type="text" placeholder="New task title..." value="' + escapeHtml(state.createDraftTitle) + '" />' +
      '<button id="createSubmit">Add</button>' +
      (state.createError ? '<span class="error-state">' + escapeHtml(state.createError) + '</span>' : '');
    const input = document.getElementById("createTitle");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener("input", (e) => { state.createDraftTitle = e.target.value; });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { submitCreate(); }
      else if (e.key === "Escape") {
        state.createInputOpen = false; state.createDraftTitle = ""; state.createError = null;
        render();
      }
    });
    document.getElementById("createSubmit").addEventListener("click", submitCreate);
  }

  function submitCreate() {
    const title = state.createDraftTitle.trim();
    if (!title) { state.createError = "Title is required."; render(); return; }
    state.createError = null;
    state.pendingCreate = true;
    vscode.postMessage({ type: "createTask", title: title });
  }

  function renderTabs() {
    const tabs = document.getElementById("tabs");
    tabs.innerHTML = TAB_ORDER.map((tab) =>
      '<span class="tab' + (tab === state.activeTab ? ' active' : '') + '" data-tab="' + tab + '">' +
      TAB_LABEL[tab] + " " + countFor(tab) + "</span>"
    ).join("");
    tabs.querySelectorAll(".tab").forEach((el) => {
      el.addEventListener("click", () => { state.activeTab = el.getAttribute("data-tab"); render(); });
    });
  }

  function renderList() {
    const list = document.getElementById("list");
    const rows = visibleTasks();
    if (rows.length === 0) {
      list.innerHTML = '<div class="empty-state">No matching tasks.</div>';
      return;
    }
    list.innerHTML = rows.map((t) =>
      '<div class="row' + (t.id === state.selectedTaskId ? ' selected' : '') + '" data-id="' + t.id + '">' +
        '<i class="codicon codicon-' + STATUS_ICON[t.status] + ' row-marker status-' + t.status + '"></i>' +
        '<div class="row-main">' +
          '<div class="row-title">' + escapeHtml(t.title) + tagIconsHtml(t.id) + '</div>' +
          '<div class="row-desc">' + escapeHtml(t.description) + '</div>' +
        '</div>' +
        '<div class="row-meta">' +
          '<span class="badge status-' + t.status + '">' + STATUS_LABEL[t.status] + '</span>' +
          '<span class="priority priority-' + t.priority + '"><i class="codicon codicon-flag"></i>' + PRIORITY_LABEL[t.priority] + '</span>' +
        '</div>' +
      '</div>'
    ).join("");
    list.querySelectorAll(".row").forEach((el) => {
      el.addEventListener("click", () => { state.selectedTaskId = el.getAttribute("data-id"); render(); });
    });
  }

  function renderDetails() {
    const details = document.getElementById("details");
    const actions = document.getElementById("detailsActions");
    const task = state.tasks.find((t) => t.id === state.selectedTaskId);
    if (!task) {
      details.innerHTML = '<div class="empty-state">Select a task to see its details.</div>';
      actions.innerHTML = "";
      return;
    }
    const confirmingDelete = state.deleteConfirmingTaskId === task.id;
    actions.innerHTML = confirmingDelete
      ? '<span class="confirm-text">Delete this task?</span>' +
        '<button id="deleteYes" class="danger">Yes</button>' +
        '<button id="deleteCancel">Cancel</button>'
      : '<button id="editTrigger" title="Edit status/priority below"><i class="codicon codicon-edit"></i></button>' +
        '<button id="deleteTrigger" class="danger" title="Delete task"><i class="codicon codicon-trash"></i></button>';

    const list = state.lists.find((l) => l.id === task.listId);
    const listLabel = list ? list.id + " " + list.name : "None";
    const listTagsHtml = list ? tagIconsHtml(list.id) : "";

    details.innerHTML =
      '<div class="field-row"><span class="field-label">Title</span><span>' + escapeHtml(task.title) + tagIconsHtml(task.id) + '</span></div>' +
      '<div class="field-row"><span class="field-label">Description</span><span>' + escapeHtml(task.description) + '</span></div>' +
      '<div class="field-row"><span class="field-label">List</span><span>' + escapeHtml(listLabel) + listTagsHtml + '</span></div>' +
      '<div class="field-row"><span class="field-label">Status</span>' +
        '<select id="statusSelect" class="select-status-' + task.status + '">' +
          Object.keys(STATUS_LABEL).map((s) => '<option value="' + s + '"' + (s === task.status ? " selected" : "") + '>' + STATUS_LABEL[s] + '</option>').join("") +
        '</select></div>' +
      '<div class="field-row"><span class="field-label">Priority</span>' +
        '<select id="prioritySelect" class="select-priority-' + task.priority + '">' +
          ["low", "medium", "high"].map((p) => '<option value="' + p + '"' + (p === task.priority ? " selected" : "") + '>' + p + '</option>').join("") +
        '</select></div>' +
      '<div class="field-row"><span class="field-label">Created</span><span>' + escapeHtml(task.createdAt) + '</span></div>' +
      '<div class="field-row"><span class="field-label">Updated</span><span>' + escapeHtml(task.updatedAt) + '</span></div>';

    document.getElementById("statusSelect").addEventListener("change", (e) => {
      vscode.postMessage({ type: "editTask", taskId: task.id, field: "status", value: e.target.value });
    });
    document.getElementById("prioritySelect").addEventListener("change", (e) => {
      vscode.postMessage({ type: "editTask", taskId: task.id, field: "priority", value: e.target.value });
    });

    if (confirmingDelete) {
      document.getElementById("deleteYes").addEventListener("click", () => {
        state.pendingDeleteTaskId = task.id;
        vscode.postMessage({ type: "deleteTask", taskId: task.id });
      });
      document.getElementById("deleteCancel").addEventListener("click", () => {
        state.deleteConfirmingTaskId = null;
        render();
      });
    } else {
      document.getElementById("editTrigger").addEventListener("click", () => {
        document.getElementById("statusSelect").focus();
      });
      document.getElementById("deleteTrigger").addEventListener("click", () => {
        state.deleteConfirmingTaskId = task.id;
        render();
      });
    }
  }

  function render() {
    document.getElementById("statusbarRight").innerHTML =
      state.tasks.length + " tasks <i class=\\"codicon codicon-bell\\"></i>";
    renderCreateRow();
    renderTabs();
    renderList();
    renderDetails();
  }

  function showEmptyState(reason) {
    document.getElementById("tabs").innerHTML = "";
    document.getElementById("list").innerHTML =
      '<div class="empty-state">No model found. Run <code>node parser/extract.js</code> from the repo root, then refresh.</div>';
    document.getElementById("details").innerHTML = "";
    document.getElementById("detailsActions").innerHTML = "";
    document.getElementById("statusbarRight").textContent = "";
  }

  function showError(message) {
    document.getElementById("list").innerHTML = '<div class="error-state">' + escapeHtml(message) + '</div>';
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.type === "model") {
      state.tasks = msg.tasks;
      state.lists = msg.lists;
      state.metadataTags = msg.metadataTags;
      if (!state.tasks.find((t) => t.id === state.selectedTaskId)) state.selectedTaskId = null;
      if (state.pendingCreate) {
        state.pendingCreate = false;
        state.createInputOpen = false;
        state.createDraftTitle = "";
        state.createError = null;
      }
      if (state.pendingDeleteTaskId) {
        state.pendingDeleteTaskId = null;
        state.deleteConfirmingTaskId = null;
      }
      render();
    } else if (msg.type === "emptyState") {
      showEmptyState(msg.reason);
    } else if (msg.type === "error") {
      if (msg.context === "create-validation") {
        state.pendingCreate = false;
        state.createError = msg.message;
        render();
      } else {
        state.pendingCreate = false;
        state.pendingDeleteTaskId = null;
        showError(msg.message);
      }
    }
  });

  document.getElementById("filter").addEventListener("input", (e) => {
    state.filterText = e.target.value;
    render();
  });
  document.getElementById("refresh").addEventListener("click", () => {
    vscode.postMessage({ type: "refresh" });
  });
  document.getElementById("addTask").addEventListener("click", () => {
    state.createInputOpen = true;
    state.createDraftTitle = "";
    state.createError = null;
    render();
  });
  document.getElementById("filterToggle").addEventListener("click", () => {
    document.getElementById("filter").focus();
  });

  vscode.postMessage({ type: "ready" });
`;
