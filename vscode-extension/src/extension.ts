import * as vscode from "vscode";
import { TaskPanelProvider } from "./taskPanelProvider";
import { ModelExplorerProvider } from "./modelExplorerProvider";

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    return;
  }

  const taskPanelProvider = new TaskPanelProvider(workspaceRoot, context.extensionUri);
  const modelExplorerProvider = new ModelExplorerProvider(workspaceRoot);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TaskPanelProvider.viewType, taskPanelProvider),
    vscode.commands.registerCommand("todoDigitalThread.refresh", () => taskPanelProvider.refresh()),
    vscode.window.registerTreeDataProvider("modelExplorer", modelExplorerProvider),
    vscode.commands.registerCommand("modelExplorer.refresh", () => modelExplorerProvider.refresh()),
    vscode.commands.registerCommand("modelExplorer.navigate", (kind, id) => modelExplorerProvider.navigate(kind, id))
  );
}

export function deactivate(): void {}
