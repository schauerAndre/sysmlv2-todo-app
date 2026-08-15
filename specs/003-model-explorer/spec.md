# Feature Specification: Model Explorer Tree View

**Feature Branch**: `003-model-explorer`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Add a Model Explorer view, matching the left side of the mockup (go.png): a navigable tree of the SysML v2 model's structure — use cases, requirements, domain model (Task/TodoList/enums), and traceability — distinct from the To-Do List App panel (which is about task data, not model structure). Clicking an element should reveal it in the actual .sysml source. Sourced from generated/todo-model.generated.json, same governance as the To-Do List App panel (extension never parses .sysml for display data)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the model structure in a tree (Priority: P1)

A developer wants to see what the SysML v2 model actually contains — its use cases, requirements, and test cases — without opening each `.sysml` file individually and reading `@id` comments by hand.

**Why this priority**: The foundational capability; everything else (traceability nesting, domain model, navigation) builds on having a browsable tree at all.

**Independent Test**: Open the Model Explorer view, confirm it shows three top-level groups (Use Cases, Requirements, Test Cases) each populated with the correct count and each leaf showing its id and name/title, sourced from `generated/todo-model.generated.json`.

**Acceptance Scenarios**:

1. **Given** a workspace with a current `generated/todo-model.generated.json`, **When** the developer opens the Model Explorer view, **Then** it shows "Use Cases (8)", "Requirements (8)", "Test Cases (8)" groups, each expandable to list its elements by id and name.
2. **Given** the tree is expanded, **When** the developer hovers a leaf element, **Then** a tooltip shows its doc text/description (use case description, requirement text, or test case Given/When/Then).
3. **Given** the `.sysml` model has been edited and re-extracted, **When** the developer clicks the view's refresh action, **Then** the tree reflects the newly generated JSON without reopening VS Code.
4. **Given** `generated/todo-model.generated.json` does not exist, **When** the developer opens the view, **Then** it shows a single explanatory node ("Run `node parser/extract.js`...") instead of an empty or broken tree.

---

### User Story 2 - Navigate from a tree element to its SysML source (Priority: P2)

Having found an element in the tree, the developer clicks it to jump straight to its `// @id: ...` declaration in the actual `.sysml` file, instead of hunting for it manually.

**Why this priority**: Turns the tree from a read-only summary into an actually useful navigation aid — the second most valuable thing after having the tree exist at all.

**Independent Test**: Click a requirement leaf, confirm the corresponding `spec/02-requirements.sysml` opens in the editor with the cursor on that requirement's `// @id:` line.

**Acceptance Scenarios**:

1. **Given** a use case leaf is clicked, **When** the editor opens, **Then** it opens `spec/01-use-cases.sysml` with the cursor/selection on that use case's `// @id:` comment line.
2. **Given** a requirement leaf is clicked, **When** the editor opens, **Then** it opens `spec/02-requirements.sysml` at the matching line.
3. **Given** a test case leaf is clicked, **When** the editor opens, **Then** it opens `spec/05-test-cases.sysml` at the matching line.
4. **Given** the target `.sysml` file has been moved/renamed since the JSON was generated (stale reference), **When** the developer clicks the leaf, **Then** a clear error is shown rather than opening a wrong file or throwing an unhandled exception.

---

### User Story 3 - See traceability as tree structure (Priority: P3)

Under each requirement, the developer wants to see which use case it derives from and which test case(s) verify it, nested as children — making the "digital thread" traceability visible as a navigable structure, not just a flat list.

**Why this priority**: This is the feature's real payoff (making traceability tangible), but it depends on the base tree (P1) and benefits from navigation (P2) already working.

**Independent Test**: Expand a requirement node, confirm "Derived from: UC-01 CreateTask" and "Verified by: TEST-001 CreateTaskTest" appear as child nodes, sourced from the model's `traceability` array, and clicking them navigates like any other leaf.

**Acceptance Scenarios**:

1. **Given** a requirement has a `derive` link pointing to it (from a use case) in the model's `traceability` data, **When** its tree node is expanded, **Then** a "Derived from: <UC id + name>" child appears.
2. **Given** a requirement has one or more `verify` links pointing to it, **When** its tree node is expanded, **Then** each shows as a "Verified by: <TEST id + name>" child.
3. **Given** a requirement has no resolvable trace links (edge case, shouldn't happen in the current model but must not crash if it does), **When** expanded, **Then** it simply has no trace-link children, not an error.
4. **Given** a traceability child node is clicked, **When** the editor opens, **Then** it navigates to that linked element's own `.sysml` location (same navigation as User Story 2), not to the requirement's location.

### Edge Cases

- What happens when `generated/todo-model.generated.json` exists but is malformed (mid-edit, extractor crashed)? Tree shows a clear error node, not a crash.
- What happens when an element's `// @id:` marker can't be found in its expected source file at click time (stale/edited-since-extraction)? Show an error message, don't silently fail or open the file at line 1.
- What happens when the workspace isn't this project (no `spec/`/`data/` folders at all)? Same graceful empty-state pattern as the To-Do List App panel.
- What happens with many elements (tree scale)? Not a concern at this demo's size (a few dozen elements total); no virtualization needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST provide a Model Explorer tree view, distinct from the To-Do List App panel, showing the SysML model's structure grouped as Use Cases, Requirements, and Test Cases.
- **FR-002**: Each group MUST show its element count and expand to list its members by id and name/title.
- **FR-003**: Each leaf MUST show a tooltip with its doc text/description where available.
- **FR-004**: The view MUST provide a refresh action reloading `generated/todo-model.generated.json` without a VS Code restart.
- **FR-005**: When `generated/todo-model.generated.json` is missing, the view MUST show explanatory guidance rather than an empty or broken tree.
- **FR-006**: Clicking a use case, requirement, or test case leaf MUST open its source `.sysml` file with the cursor positioned at that element's `// @id:` line.
- **FR-007**: If the target `.sysml` file or the specific `// @id:` marker can't be located at click time, the extension MUST show a clear error rather than opening the wrong location or crashing.
- **FR-008**: Each requirement node MUST show its derive (from use case) and verify (from test case) trace links as child nodes, sourced from the model's `traceability` array — never a hardcoded mapping.
- **FR-009**: Traceability child nodes MUST be clickable with the same navigate-to-source behavior as their linked element (FR-006/FR-007).
- **FR-010**: The extension MUST continue to source all *display* data from `generated/todo-model.generated.json` only — it MUST NOT parse `.sysml` files to derive tree content. Opening/navigating to a location within an already-identified file (FR-006) is a plain text search for the known `// @id:` string, not SysML parsing, and remains within bounds.

### Key Entities *(include if feature involves data)*

- **UseCaseNode / RequirementNode / TestCaseNode**: tree items wrapping the existing `useCases`/`requirements`/`testCases` arrays already in `generated/todo-model.generated.json` — no new data fields needed from the extractor for User Stories 1–2.
- **TraceLinkNode**: a synthetic tree child (not a top-level entity) representing one `traceability` array entry, rendered under its target requirement.
- **SourceLocation**: id -> `{ file, line }` — computed at click time by searching the known source file's text for `// @id: <id>`, not stored in the JSON.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every use case, requirement, and test case in the current demo dataset (8/8/8) appears in the tree with the correct id and name.
- **SC-002**: Clicking any leaf navigates to the correct line in the correct file 100% of the time for the current demo dataset (no stale/broken navigation).
- **SC-003**: A requirement with both a derive and a verify link shows both as children, in under 2 clicks from opening the view (1 to expand the group, 1 to expand the requirement).
- **SC-004**: Opening the view in a workspace without a generated model produces guidance, with zero unhandled errors in the extension host log.

## Assumptions

- Domain model (Task/TodoList/enum type definitions, as shown in the mockup's "03-domain-model" group) is **out of scope for this feature**. The extractor currently emits only *instances*/*usages* (use cases, requirements, test cases, tasks), not type definitions — adding that would require new extraction logic for `part def`/`occurrence def`/`enum def` bodies, which is a bigger, separate change. Flagged here rather than silently dropped; candidate for its own follow-up feature (004) if wanted.
- The Model Explorer is a **native `TreeView`** (`vscode.TreeDataProvider`), not a webview — matches the mockup's native VS Code Explorer look, and tree browsing/navigation is exactly what `TreeView` is built for (unlike the To-Do List App panel, which needed custom badges/filtering a `TreeView` can't render).
- Placed in the Explorer sidebar (like the original pre-redesign `todoDigitalThread` tree was) rather than a new Activity Bar container — it's a secondary, occasional-use navigation aid, not the primary interaction surface the To-Do List App panel is.
- "Satisfy" links (requirement -> system) are not shown as children in this feature — they're not naturally "traceability leading somewhere to click," since their target is the whole system (`todoDigitalThread`), not a specific navigable `.sysml` element with its own `@id`. Deferred, not silently dropped.
