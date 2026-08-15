"use strict";
/**
 * Tests for vscode-extension/src/modelExplorerLogic.ts (compiled to
 * vscode-extension/out/modelExplorerLogic.js), per
 * specs/003-model-explorer/contracts/model-explorer-provider.md.
 * Run `npm run compile` inside vscode-extension/ before running these.
 *
 * Run with: node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildTree, resolveSourceLocation } = require("../vscode-extension/out/modelExplorerLogic");

function fixtureModel() {
  return {
    useCases: [
      { id: "UC-01", name: "CreateTask", description: "The user wants to add a task." },
      { id: "UC-04", name: "DeleteTask", description: "The user wants to remove a task." },
    ],
    requirements: [
      { id: "REQ-TODO-001", name: "CreateTaskRequirement", text: "The user shall be able to create a new task." },
      { id: "REQ-TODO-099", name: "UnlinkedRequirement", text: "Has no derive/verify links in this fixture." },
    ],
    tasks: [],
    lists: [],
    testCases: [{ id: "TEST-001", name: "CreateTaskTest", description: "...", implementedBy: null }],
    traceability: [
      { from: "UC-01", to: "REQ-TODO-001", type: "derive" },
      { from: "REQ-TODO-001", to: "TEST-001", type: "verify" },
    ],
    metadataTags: [],
  };
}

// @id: TEST-009 -- verifies REQ-TODO-009 (BrowseModelTreeRequirement)
test("buildTree groups elements with correct counts and labels", () => {
  const tree = buildTree(fixtureModel());
  assert.equal(tree.length, 3);

  const [useCases, requirements, testCases] = tree;
  assert.equal(useCases.label, "Use Cases (2)");
  assert.equal(useCases.children.length, 2);
  assert.equal(useCases.children[0].label, "UC-01 CreateTask");

  assert.equal(requirements.label, "Requirements (2)");
  assert.equal(testCases.label, "Test Cases (1)");
});

test("buildTree on an empty model returns three empty groups, not an error", () => {
  const emptyModel = {
    useCases: [],
    requirements: [],
    tasks: [],
    lists: [],
    testCases: [],
    traceability: [],
    metadataTags: [],
  };
  const tree = buildTree(emptyModel);
  assert.equal(tree.length, 3);
  for (const group of tree) {
    assert.match(group.label, /\(0\)$/);
    assert.equal(group.children.length, 0);
  }
});

// @id: TEST-011 -- verifies REQ-TODO-011 (ViewTraceabilityAsTreeRequirement)
test("buildTree adds trace-link children only to requirements that have them", () => {
  const tree = buildTree(fixtureModel());
  const [, requirements] = tree;
  const linked = requirements.children.find((r) => r.id === "REQ-TODO-001");
  const unlinked = requirements.children.find((r) => r.id === "REQ-TODO-099");

  assert.equal(linked.children.length, 2);
  assert.match(linked.children[0].label, /^Derived from: UC-01 CreateTask$/);
  assert.match(linked.children[1].label, /^Verified by: TEST-001 CreateTaskTest$/);
  assert.equal(linked.children[0].navKind, "useCase");
  assert.equal(linked.children[0].navId, "UC-01");

  assert.equal(unlinked.children.length, 0);
});

// @id: TEST-010 -- verifies REQ-TODO-010 (NavigateToModelSourceRequirement)
test("resolveSourceLocation finds the correct line for a known id", () => {
  const fixtureText = [
    "package TodoUseCases {",
    "    // @id: UC-01",
    "    use case def CreateTask {",
    "    }",
    "}",
  ].join("\n");
  const readFile = () => fixtureText;

  const location = resolveSourceLocation("useCase", "UC-01", readFile);

  assert.equal(location.file, "spec/01-use-cases.sysml");
  assert.equal(location.line, 1);
});

test("resolveSourceLocation throws a descriptive error for an unknown id", () => {
  const readFile = () => "package TodoUseCases {\n}\n";
  assert.throws(() => resolveSourceLocation("useCase", "UC-99", readFile), /UC-99/);
});
