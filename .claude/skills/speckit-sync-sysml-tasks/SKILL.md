---
name: "speckit-sync-sysml-tasks"
description: "Sync new verification/test cases from the active spec-kit tasks.md into spec/05-test-cases.sysml and the matching verification usages in spec/03-architecture.sysml."
argument-hint: "none — reads the most recently touched specs/*/tasks.md"
compatibility: "Requires this repo's spec-kit + spec/*.sysml layout"
metadata:
  author: "project"
  hook-of: "speckit-tasks"
user-invocable: true
disable-model-invocation: false
---

## Purpose

`/speckit-tasks` breaks a feature into concrete, executable tasks, including test tasks. `spec/05-test-cases.sysml` is where this repo's real SysML v2 verification definitions live, and `spec/03-architecture.sysml` is where they get bound to the running system via concrete `verification ...` usages (mirroring how `satisfy` is bound there). This skill keeps both in sync with tasks.md after every `/speckit-tasks` run.

## Outline

1. **Locate the feature tasks**: run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from the repo root and read `FEATURE_DIR`/`TASKS` from its output. If that fails, fall back to the most recently modified `specs/*/tasks.md`. Read `tasks.md`.

2. **Read current SysML state**:
   - Read `spec/05-test-cases.sysml` in full — note the highest `TEST-NNN` id and existing `verification def` blocks.
   - Read `spec/03-architecture.sysml` in full — note the existing `verification <name> : <TestDef> { ... }` usage blocks and which `satisfies<Name>` requirement usages exist to bind against.
   - Read `spec/02-requirements.sysml` to know the `REQ-TODO-*` requirements this feature introduced (via the matching `speckit-sync-sysml-spec`/`speckit-sync-sysml-plan` runs for this feature).

3. **Identify requirements needing a test case**: for each requirement introduced by this feature that already has a `satisfy requirement satisfies<Name> : <Name>Requirement by todoDigitalThread;` line in `03-architecture.sysml` (added by the plan sync hook) but does NOT yet have a corresponding `verification def <Name>Test` in `05-test-cases.sysml`, and where tasks.md contains a test task for that requirement's behavior:

4. **Append new verification defs** to `spec/05-test-cases.sysml`, following the exact pattern already in the file:
   ```
   // @id: TEST-<next>
   verification def <Name>Test {
       subject app : TodoApp;
       objective {
           verify requirement verifiedRequirement : <Name>Requirement;
       }
       doc
       /*
        * Given <precondition from the test task in tasks.md>,
        * when <action>,
        * then <expected outcome>.
        */
       // @implementedBy: tests/todo-app.test.js#<Name>Test
   }
   ```
   Insert before the closing `}` of `package TodoTestCases`. Increment `<next>` as a zero-padded 3-digit number. Base the Given/When/Then on the actual test task description in tasks.md — do not invent scenarios it doesn't describe. The `@implementedBy` path is a forward reference to the test `/speckit-implement` is expected to create; if tasks.md specifies a different test file/framework, use that path instead of `tests/todo-app.test.js`.

5. **Append matching verification usages** to `spec/03-architecture.sysml`, in the same style as the existing `verification verifies... : ...Test { ... }` blocks, immediately after the existing verification usages:
   ```
   verification verifies<Name> : <Name>Test {
       subject app :> todoDigitalThread;
       objective { verify satisfies<Name> :>> verifiedRequirement; }
   }
   ```
   `satisfies<Name>` must already exist (added by `speckit-sync-sysml-plan`) — if it doesn't, skip this requirement and report it as blocked on the plan sync instead of guessing a subject.

6. **Validate**: run `cd parser && node extract.js` from the repo root and confirm it completes without errors. Fix and re-run if it doesn't.

7. **Report**: list every `TEST-*` id added (with the `@implementedBy` path used), every matching `verification` usage added to `03-architecture.sysml`, and any requirement that couldn't get a test case yet (no matching `satisfies<Name>` usage, or tasks.md has no test task for it) — call those out explicitly.

## Key rules

- Never edit or renumber an existing `@id` block — only append new ones.
- A `verification` usage in `03-architecture.sysml` requires an existing `satisfies<Name>` requirement usage to bind against — never fabricate one; report the gap instead.
- Keep formatting (indentation, comment style, Given/When/Then phrasing) consistent with the immediately preceding block in the same file.
- The real software test referenced by `@implementedBy` does not need to exist yet at this point — `/speckit-implement` is expected to create it — but the path/name you write here should match what tasks.md actually specifies, so the reference is correct once implementation lands.

## Done When

- [ ] tasks.md located and read
- [ ] Every requirement introduced by this feature that has both a plan-sync `satisfy` line and a test task in tasks.md gets a `TEST-*` def and matching architecture verification usage
- [ ] Gaps (missing `satisfy` line, or no test task) are reported, not guessed around
- [ ] `node extract.js` runs clean after the edits
- [ ] Summary reported to the user
