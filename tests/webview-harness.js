"use strict";
/**
 * Playwright validation harness for the To-Do List App webview.
 *
 * This does NOT run inside VS Code -- it renders the exact production
 * markup produced by vscode-extension/src/taskPanelProvider.ts's
 * `buildWebviewHtml()` (same PANEL_CSS/PANEL_JS the real extension embeds)
 * in a real Chromium page, with a small in-page mock of
 * `acquireVsCodeApi()` standing in for the extension host side of the
 * postMessage contract (specs/001-task-panel-redesign/contracts/webview-messages.md,
 * specs/002-create-delete-tasks/contracts/webview-messages.md). It exists
 * because this repo has no way to drive a real interactive VS Code window,
 * and "the code compiles and unit tests pass" was previously the only
 * signal for whether the webview's own untyped JS actually worked.
 *
 * Also injects a minimal --vscode-* CSS variable palette (VS Code Dark+
 * approximations) so screenshots are visually representative, not unstyled.
 *
 * Run with: node tests/webview-harness.js
 * Requires: cd vscode-extension && npm install && npm run compile (first,
 * so out/taskPanelProvider.js exists)
 * Screenshots written to: tests/screenshots/*.png
 */
const path = require("path");
const fs = require("fs");
const assert = require("node:assert/strict");
const { chromium } = require(path.join(__dirname, "..", "vscode-extension", "node_modules", "playwright"));
const { buildWebviewHtml } = require("../vscode-extension/out/webviewMarkup");

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
const CODICON_CSS_URI =
  "file://" +
  path.join(__dirname, "..", "vscode-extension", "node_modules", "@vscode", "codicons", "dist", "codicon.css").replace(/\\/g, "/");

function panelHtml() {
  return buildWebviewHtml("*", "test", CODICON_CSS_URI).replace("</head>", `<style>${DARK_PLUS_VARS}</style></head>`);
}

const DARK_PLUS_VARS = `
  :root {
    color-scheme: dark;
    --vscode-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --vscode-foreground: #cccccc;
    --vscode-editor-background: #1e1e1e;
    --vscode-input-background: #3c3c3c;
    --vscode-input-foreground: #cccccc;
    --vscode-input-border: #3c3c3c;
    --vscode-icon-foreground: #c5c5c5;
    --vscode-badge-background: #4d4d4d;
    --vscode-badge-foreground: #ffffff;
    --vscode-focusBorder: #007fd4;
    --vscode-widget-border: #303031;
    --vscode-list-activeSelectionBackground: #04395e;
    --vscode-errorForeground: #f48771;
    --vscode-dropdown-background: #3c3c3c;
    --vscode-dropdown-foreground: #f0f0f0;
    --vscode-dropdown-border: #3c3c3c;
    --vscode-list-hoverBackground: #2a2d2e;
    --vscode-toolbar-hoverBackground: #5a5d5e80;
  }
  body { background: var(--vscode-editor-background); margin: 0; }
`;

function initialTasks() {
  return [
    {
      id: "TASK-001",
      title: "Write LinkedIn article",
      description: "Create the first blog post for the SysML v2 To-Do series.",
      status: "open",
      priority: "high",
      createdAt: "2026-05-16T09:15:00.000Z",
      updatedAt: "2026-05-16T09:45:00.000Z",
      listId: "LIST-001",
    },
    {
      id: "TASK-002",
      title: "Build the demo extractor",
      description: "Implement the purpose-built SysML v2 to JSON extractor for this example.",
      status: "inProgress",
      priority: "medium",
      createdAt: "2026-05-16T09:15:00.000Z",
      updatedAt: "2026-05-16T09:45:00.000Z",
      listId: "LIST-001",
    },
  ];
}

async function installMockExtensionHost(page) {
  await page.addInitScript((tasksSeed) => {
    let tasks = JSON.parse(JSON.stringify(tasksSeed));
    let nextNum = tasks.length + 1;
    const lists = [{ id: "LIST-001", name: "Backlog" }];
    const metadataTags = [
      { tag: "criticalPath", targetId: "TASK-002" },
      { tag: "sprintBacklog", targetId: "LIST-001" },
    ];
    window.__posted = [];
    function respond(msg) {
      window.dispatchEvent(new MessageEvent("message", { data: msg }));
    }
    window.acquireVsCodeApi = () => ({
      postMessage(msg) {
        window.__posted.push(msg);
        if (msg.type === "ready" || msg.type === "refresh") {
          respond({ type: "model", tasks, lists, metadataTags });
        } else if (msg.type === "editTask") {
          const t = tasks.find((x) => x.id === msg.taskId);
          if (t) {
            t[msg.field] = msg.value;
            t.updatedAt = "2026-08-13T00:00:00.000Z";
          }
          respond({ type: "model", tasks, lists, metadataTags });
        } else if (msg.type === "createTask") {
          if (!msg.title || !msg.title.trim()) {
            respond({ type: "error", context: "create-validation", message: "Task title must not be empty" });
          } else {
            const id = "TASK-00" + nextNum++;
            tasks.push({
              id,
              title: msg.title,
              description: "",
              status: "open",
              priority: "medium",
              createdAt: "2026-08-13T00:00:00.000Z",
              updatedAt: "2026-08-13T00:00:00.000Z",
              listId: "LIST-001",
            });
            respond({ type: "model", tasks, lists, metadataTags });
          }
        } else if (msg.type === "deleteTask") {
          tasks = tasks.filter((x) => x.id !== msg.taskId);
          respond({ type: "model", tasks, lists, metadataTags });
        }
      },
      setState() {},
      getState() {
        return undefined;
      },
    });
  }, initialTasks());
}

const HARNESS_HTML_PATH = path.join(SCREENSHOT_DIR, "..", ".harness.html");

async function loadPanel(page) {
  const html = panelHtml();
  fs.writeFileSync(HARNESS_HTML_PATH, html, "utf8");
  await installMockExtensionHost(page);
  // page.goto (a real navigation) is used instead of page.setContent, since
  // addInitScript is not reliably applied to setContent's CDP-level content
  // injection -- it needs an actual navigation to guarantee the mock
  // acquireVsCodeApi() is defined before the page's own <script> runs.
  await page.goto("file://" + HARNESS_HTML_PATH.replace(/\\/g, "/"));
  // The webview posts { type: "ready" } on load, which the mock answers
  // synchronously -- wait for the first real row to confirm the round trip.
  await page.waitForSelector(".row");
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 720 } });

  let failures = 0;
  const results = [];
  function record(name, fn) {
    results.push({ name, fn });
  }

  record("initial render shows both demo tasks with correct tab counts", async () => {
    await loadPanel(page);
    const rows = await page.locator(".row").count();
    assert.equal(rows, 2, "expected 2 task rows");
    const tabsText = await page.locator("#tabs").innerText();
    assert.match(tabsText, /All 2/);
    assert.match(tabsText, /Open 1/);
    assert.match(tabsText, /In Progress 1/);
    assert.match(tabsText, /Done 0/);
  });

  record("filter narrows the list and updates tab counts", async () => {
    await loadPanel(page);
    await page.fill("#filter", "linkedin");
    const rows = await page.locator(".row").count();
    assert.equal(rows, 1, "expected 1 row after filtering");
    const tabsText = await page.locator("#tabs").innerText();
    assert.match(tabsText, /All 1/);
  });

  record("clicking a row populates Task Details with its containing list", async () => {
    await loadPanel(page);
    await page.locator(".row").first().click();
    const detailsText = await page.locator("#details").innerText();
    assert.match(detailsText, /Write LinkedIn article/);
    assert.match(detailsText, /LIST-001 Backlog/);
  });

  record("metadata tags render as visible icons on the tagged task row and list field", async () => {
    await loadPanel(page);
    // TASK-002 (criticalPath) row shows the tag icon next to its title.
    const task002Row = page.locator(".row", { hasText: "Build the demo extractor" });
    const task002TagClass = await task002Row.locator(".tag-icon").getAttribute("class");
    assert.match(task002TagClass, /criticalPath/);
    // TASK-001 (no tags) shows none.
    const task001Row = page.locator(".row", { hasText: "Write LinkedIn article" });
    assert.equal(await task001Row.locator(".tag-icon").count(), 0);

    // The selected task's List field shows the list's own tag (sprintBacklog on LIST-001).
    await task001Row.click();
    const listTagClass = await page.locator("#details .tag-icon").getAttribute("class");
    assert.match(listTagClass, /sprintBacklog/);
  });

  record("editing status via the dropdown round-trips through postMessage and re-renders", async () => {
    await loadPanel(page);
    await page.locator(".row").first().click();
    await page.selectOption("#statusSelect", "completed");
    await page.waitForFunction(() => window.__posted.some((m) => m.type === "editTask" && m.field === "status"));
    await page.waitForSelector(".status-completed");
    const badge = await page.locator(".row").first().locator(".badge").innerText();
    assert.equal(badge.trim(), "DONE");
  });

  record("create: (+) opens inline input, empty submit shows validation, valid submit adds a row", async () => {
    await loadPanel(page);
    await page.click("#addTask");
    await page.click("#createSubmit");
    const errorText = await page.locator("#createRow .error-state").innerText();
    assert.match(errorText, /Title is required/);

    await page.fill("#createTitle", "Write follow-up post");
    await page.click("#createSubmit");
    await page.waitForFunction(() => document.querySelectorAll(".row").length === 3);
    const titles = await page.locator(".row-title").allInnerTexts();
    assert.ok(titles.includes("Write follow-up post"), "new task should appear in the list");
  });

  record("delete: trash icon requires confirm, cancel keeps the task, confirm removes it", async () => {
    await loadPanel(page);
    await page.locator(".row").first().click();
    await page.click("#deleteTrigger");
    const actionsText = await page.locator("#detailsActions").innerText();
    assert.match(actionsText, /Delete this task\?/);

    await page.click("#deleteCancel");
    const rowsAfterCancel = await page.locator(".row").count();
    assert.equal(rowsAfterCancel, 2, "cancel should not delete");

    await page.locator(".row").first().click();
    await page.click("#deleteTrigger");
    await page.click("#deleteYes");
    await page.waitForFunction(() => document.querySelectorAll(".row").length === 1);
    const detailsText = await page.locator("#details").innerText();
    assert.match(detailsText, /Select a task/);
  });

  record("empty state renders guidance instead of a blank/broken panel", async () => {
    await installMockExtensionHost(page);
    await page.addInitScript(() => {
      const orig = window.acquireVsCodeApi;
      window.acquireVsCodeApi = () => {
        const api = orig();
        return {
          ...api,
          postMessage(msg) {
            if (msg.type === "ready" || msg.type === "refresh") {
              window.dispatchEvent(new MessageEvent("message", { data: { type: "emptyState", reason: "no-generated-json" } }));
            } else {
              api.postMessage(msg);
            }
          },
        };
      };
    });
    const html = panelHtml();
    fs.writeFileSync(HARNESS_HTML_PATH, html, "utf8");
    await page.goto("file://" + HARNESS_HTML_PATH.replace(/\\/g, "/"));
    await page.waitForSelector("#list .empty-state");
    const text = await page.locator("#list").innerText();
    assert.match(text, /node parser\/extract\.js/);
  });

  for (const { name, fn } of results) {
    try {
      await fn();
      console.log(`✔ ${name}`);
    } catch (err) {
      failures++;
      console.error(`✖ ${name}`);
      console.error(`  ${err.message}`);
    }
  }

  // Reference screenshots for visual comparison against the mockup.
  await loadPanel(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "todo-panel-list.png") });
  await page.locator(".row").first().click();
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "todo-panel-details.png") });

  await browser.close();

  console.log(`\n${results.length - failures}/${results.length} passed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
