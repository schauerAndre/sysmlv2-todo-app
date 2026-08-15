---
name: "speckit-sync-sysml-spec"
description: "Sync new user scenarios and functional requirements from the active spec-kit feature spec.md into spec/01-use-cases.sysml, spec/02-requirements.sysml, and spec/04-traceability.sysml."
argument-hint: "none — reads the most recently touched specs/*/spec.md"
compatibility: "Requires this repo's spec-kit + spec/*.sysml layout"
metadata:
  author: "project"
  hook-of: "speckit-specify"
user-invocable: true
disable-model-invocation: false
---

## Purpose

This repo's whole premise is that the SysML v2 model in `spec/` is the source of truth that drives the running app (see top-level README). `/speckit-specify` captures new feature scenarios and requirements in `specs/<feature>/spec.md`, a parallel artifact outside the SysML model. Left alone, that creates a blind spot: features get planned and built without ever being represented as real `use case def` / `requirement def` elements. This skill closes that gap by syncing spec.md content into the SysML files after every `/speckit-specify` run.

## Outline

1. **Locate the feature spec**: run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from the repo root and read `FEATURE_SPEC` from its output. If that fails, fall back to the most recently modified `specs/*/spec.md`. Read that file.

2. **Read current SysML state**:
   - Read `spec/01-use-cases.sysml` — note the highest `UC-NN` id and the existing use case names/docs.
   - Read `spec/02-requirements.sysml` — note the highest `REQ-TODO-NNN` id and existing requirement names/docs.
   - Read `spec/04-traceability.sysml` — note the existing `dependency deriveReqNNN ...` lines and the highest `NNN`.

3. **Extract candidates from spec.md**: pull out each distinct user scenario (or acceptance scenario) and each functional requirement bullet.

4. **De-duplicate against existing SysML elements**: for each candidate, check whether an existing use case / requirement already covers the same behavior (compare by meaning, not exact wording — this is a judgment call, not a string match). If a clear match exists, skip it and note the match in the summary; do not create a duplicate.

5. **Append new use cases** to `spec/01-use-cases.sysml`, one block per new scenario, following the exact pattern already in the file:
   ```
   // @id: UC-<next>
   use case def <PascalCaseName> {
       subject app : TodoApp;
       actor user : User;
       objective {
           doc /*
                * <scenario, phrased "The user wants to ...">
              */
       }
   }
   ```
   Insert before the closing `}` of `package TodoUseCases`. Increment `<next>` per new use case, zero-padded to match existing width (e.g. `06`, `07`).

6. **Append new requirements** to `spec/02-requirements.sysml`, one block per new functional requirement, following the exact pattern already in the file:
   ```
   // @id: REQ-TODO-<next>
   requirement def <PascalCaseName>Requirement {
       doc /* <requirement text, phrased "The system/user shall ..."> */
       subject app : TodoApp;
   }
   ```
   Insert before the closing `}` of `package TodoRequirements`. Increment `<next>` as a zero-padded 3-digit number (e.g. `006`).

7. **Append traceability links** to `spec/04-traceability.sysml` for every new UC→REQ pairing created in steps 5–6:
   ```
   dependency deriveReq<NNN> from TodoRequirements::<Name>Requirement to TodoUseCases::<Name>;
   ```
   Match the existing `deriveReqNNN` numbering scheme (continue from the highest existing number, not tied to the REQ id).

8. **Validate**: run `cd parser && node extract.js` from the repo root and confirm it completes without errors. If it errors, fix the syntax you just added (most likely an unescaped quote or mismatched brace) and re-run until clean.

9. **Report**: list every UC/REQ id added (with name and one-line doc text), every id skipped as a duplicate (with the existing id it matches), and confirm the extractor ran cleanly. Explicitly note that `spec/03-architecture.sysml` (satisfy) and `spec/05-test-cases.sysml` (verify) are not touched by this skill — `/speckit-plan` and `/speckit-tasks` have their own sync hooks for those.

## Key rules

- Never edit or renumber an existing `@id` block — only append new ones, after the last existing block in each file.
- Never invent a requirement/use case that isn't actually grounded in spec.md content — this is a sync operation, not a creativity exercise.
- Keep doc-comment formatting (indentation, `/* ... */` style) consistent with the immediately preceding block in the same file.
- If spec.md contains no scenarios/requirements that map cleanly to this app's SysML vocabulary (e.g. the feature is pure tooling/infrastructure with no user-facing behavior), it is valid to add nothing — report that explicitly rather than forcing a fit.

## Done When

- [ ] spec.md located and read
- [ ] Every new scenario/requirement either synced into spec/01, spec/02, spec/04, or explicitly skipped as a duplicate with reasoning
- [ ] `node extract.js` runs clean after the edits
- [ ] Summary reported to the user
