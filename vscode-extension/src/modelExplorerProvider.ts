import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { loadTodoModel } from "./modelLoader";
import { buildTree, resolveSourceLocation, GroupNode, LeafNode, TraceChildNode, ElementKind } from "./modelExplorerLogic";

type EmptyNode = { type: "empty" };
type TreeNode = GroupNode | LeafNode | TraceChildNode | EmptyNode;

export class ModelExplorerProvider implements vscode.TreeDataProvider<TreeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private groups: GroupNode[] = [];
  private hasModel = false;

  constructor(private readonly workspaceRoot: string) {
    this.load();
  }

  refresh(): void {
    this.load();
    this._onDidChangeTreeData.fire();
  }

  private load(): void {
    const generatedPath = path.join(this.workspaceRoot, "generated", "todo-model.generated.json");
    this.hasModel = fs.existsSync(generatedPath);
    this.groups = this.hasModel ? buildTree(loadTodoModel(this.workspaceRoot)) : [];
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    if (element.type === "empty") {
      return new vscode.TreeItem(
        "No model found — run node parser/extract.js, then refresh.",
        vscode.TreeItemCollapsibleState.None
      );
    }
    if (element.type === "group") {
      return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
    }
    if (element.type === "trace") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
      item.command = navigateCommand(element.navKind, element.navId);
      item.iconPath = new vscode.ThemeIcon("references");
      return item;
    }
    // leaf (useCase | requirement | testCase)
    const hasChildren = !!element.children && element.children.length > 0;
    const item = new vscode.TreeItem(
      element.label,
      hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );
    if (element.tooltip) {
      item.tooltip = element.tooltip;
    }
    item.command = navigateCommand(element.kind, element.id);
    item.iconPath = new vscode.ThemeIcon(iconForKind(element.kind));
    return item;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      return this.hasModel ? this.groups : [{ type: "empty" }];
    }
    if (element.type === "group") {
      return element.children;
    }
    if (element.type === "leaf") {
      return element.children ?? [];
    }
    return [];
  }

  async navigate(kind: ElementKind, id: string): Promise<void> {
    try {
      const location = resolveSourceLocation(kind, id, (relPath) =>
        fs.readFileSync(path.join(this.workspaceRoot, relPath), "utf8")
      );
      const fileUri = vscode.Uri.file(path.join(this.workspaceRoot, location.file));
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(doc);
      const position = new vscode.Position(location.line, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Model Explorer: could not navigate to ${id} — ${message}`);
    }
  }
}

function navigateCommand(kind: ElementKind, id: string): vscode.Command {
  return { command: "modelExplorer.navigate", title: "Open", arguments: [kind, id] };
}

function iconForKind(kind: ElementKind): string {
  switch (kind) {
    case "useCase":
      return "person";
    case "requirement":
      return "checklist";
    case "testCase":
      return "beaker";
  }
}
