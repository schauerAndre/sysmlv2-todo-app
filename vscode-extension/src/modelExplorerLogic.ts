/**
 * Pure logic for the Model Explorer tree, deliberately free of any "vscode"
 * import (same reason as webviewMarkup.ts: lets tests/model-explorer.test.js
 * require() the compiled output in plain Node, no extension host needed).
 * modelExplorerProvider.ts wraps this in the actual vscode.TreeDataProvider.
 */
import { TodoModel } from "./modelLoader";

export type ElementKind = "useCase" | "requirement" | "testCase";

export interface TraceChildNode {
  type: "trace";
  label: string;
  navKind: ElementKind;
  navId: string;
}

export interface LeafNode {
  type: "leaf";
  kind: ElementKind;
  id: string;
  label: string;
  tooltip: string | null;
  children?: TraceChildNode[];
}

export interface GroupNode {
  type: "group";
  label: string;
  children: LeafNode[];
}

/** See specs/003-model-explorer/contracts/model-explorer-provider.md. */
export function buildTree(model: TodoModel): GroupNode[] {
  const useCaseGroup: GroupNode = {
    type: "group",
    label: `Use Cases (${model.useCases.length})`,
    children: model.useCases.map((u) => ({
      type: "leaf",
      kind: "useCase",
      id: u.id,
      label: `${u.id} ${u.name}`,
      tooltip: u.description,
    })),
  };

  const requirementGroup: GroupNode = {
    type: "group",
    label: `Requirements (${model.requirements.length})`,
    children: model.requirements.map((r) => ({
      type: "leaf",
      kind: "requirement",
      id: r.id,
      label: `${r.id} ${r.name}`,
      tooltip: r.text,
      children: traceChildrenForRequirement(model, r.id),
    })),
  };

  const testCaseGroup: GroupNode = {
    type: "group",
    label: `Test Cases (${model.testCases.length})`,
    children: model.testCases.map((t) => ({
      type: "leaf",
      kind: "testCase",
      id: t.id,
      label: `${t.id} ${t.name}`,
      tooltip: t.description,
    })),
  };

  return [useCaseGroup, requirementGroup, testCaseGroup];
}

function traceChildrenForRequirement(model: TodoModel, reqId: string): TraceChildNode[] {
  const children: TraceChildNode[] = [];
  for (const link of model.traceability) {
    if (link.type === "derive" && link.to === reqId) {
      const uc = model.useCases.find((u) => u.id === link.from);
      if (uc) {
        children.push({ type: "trace", label: `Derived from: ${uc.id} ${uc.name}`, navKind: "useCase", navId: uc.id });
      }
    } else if (link.type === "verify" && link.from === reqId) {
      const test = model.testCases.find((t) => t.id === link.to);
      if (test) {
        children.push({ type: "trace", label: `Verified by: ${test.id} ${test.name}`, navKind: "testCase", navId: test.id });
      }
    }
  }
  return children;
}

export interface SourceLocation {
  file: string;
  line: number;
}

export const FILE_BY_KIND: Record<ElementKind, string> = {
  useCase: "spec/01-use-cases.sysml",
  requirement: "spec/02-requirements.sysml",
  testCase: "spec/05-test-cases.sysml",
};

/** See specs/003-model-explorer/data-model.md's SourceLocation resolution. */
export function resolveSourceLocation(
  kind: ElementKind,
  id: string,
  readFile: (path: string) => string
): SourceLocation {
  const file = FILE_BY_KIND[kind];
  const text = readFile(file);
  const lines = text.split("\n");
  const lineIndex = lines.findIndex((line) => line.includes(`// @id: ${id}`));
  if (lineIndex === -1) {
    throw new Error(`Id ${id} not found in ${file}`);
  }
  return { file, line: lineIndex };
}
