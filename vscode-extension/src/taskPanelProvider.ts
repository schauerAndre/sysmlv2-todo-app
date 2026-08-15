import * as vscode from "vscode";
import * as fs from "fs";
import { TodoModel, loadTodoModel } from "./modelLoader";
import { TaskField } from "./sysmlTaskWriter";
import { generatedJsonPath, editTaskOperation, createTaskOperation, deleteTaskOperation } from "./taskOperations";
import { buildWebviewHtml, getNonce } from "./webviewMarkup";

type HostMessage =
  | { type: "ready" }
  | { type: "refresh" }
  | { type: "editTask"; taskId: string; field: TaskField; value: string }
  | { type: "createTask"; title: string }
  | { type: "deleteTask"; taskId: string };

export class TaskPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "todoDigitalThread";

  private view?: vscode.WebviewView;
  private readonly output = vscode.window.createOutputChannel("To-Do List App");

  constructor(private readonly workspaceRoot: string, private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message: HostMessage) => this.handleMessage(message));
  }

  refresh(): void {
    this.postModelOrEmptyState();
  }

  private handleMessage(message: HostMessage): void {
    switch (message.type) {
      case "ready":
      case "refresh":
        this.postModelOrEmptyState();
        return;
      case "editTask":
        this.runOperation(
          "editTask",
          `${message.taskId} ${message.field} -> ${message.value}`,
          editTaskOperation(this.workspaceRoot, message.taskId, message.field, message.value)
        );
        return;
      case "createTask":
        this.runOperation(
          "createTask",
          `"${message.title}"`,
          createTaskOperation(this.workspaceRoot, message.title)
        );
        return;
      case "deleteTask":
        this.runOperation("deleteTask", message.taskId, deleteTaskOperation(this.workspaceRoot, message.taskId));
        return;
    }
  }

  private postModelOrEmptyState(): void {
    if (!this.view) {
      return;
    }
    if (!fs.existsSync(generatedJsonPath(this.workspaceRoot))) {
      this.view.webview.postMessage({ type: "emptyState", reason: "no-generated-json" });
      return;
    }
    let model: TodoModel;
    try {
      model = loadTodoModel(this.workspaceRoot);
    } catch (err) {
      this.view.webview.postMessage({ type: "error", context: "load", message: describeError(err) });
      return;
    }
    this.view.webview.postMessage({
      type: "model",
      tasks: model.tasks,
      lists: model.lists,
      metadataTags: model.metadataTags,
    });
  }

  private async runOperation(
    label: string,
    detail: string,
    operation: Promise<{ ok: boolean; error?: string; validation?: boolean }>
  ): Promise<void> {
    if (!this.view) {
      return;
    }
    this.output.appendLine(`${label}: ${detail}`);
    const result = await operation;
    if (!result.ok) {
      const context = result.validation ? "create-validation" : "edit";
      this.output.appendLine(`${label} FAILED: ${result.error}`);
      this.view.webview.postMessage({ type: "error", context, message: result.error ?? "Unknown error" });
      if (!result.validation) {
        vscode.window.showErrorMessage(
          `To-Do List App: ${label} failed — ${result.error} (see "To-Do List App" output channel)`
        );
      }
      return;
    }
    this.output.appendLine(`${label}: ${detail} committed and re-extracted`);
    this.postModelOrEmptyState();
  }

  private getHtml(webview: vscode.Webview): string {
    const codiconCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "node_modules", "@vscode", "codicons", "dist", "codicon.css")
    );
    return buildWebviewHtml(webview.cspSource, getNonce(), codiconCssUri.toString());
  }
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
