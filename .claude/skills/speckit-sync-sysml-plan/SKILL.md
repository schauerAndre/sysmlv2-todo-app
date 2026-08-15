---
name: "speckit-sync-sysml-plan"
description: "Sync new architectural elements and requirement satisfaction from the active spec-kit plan.md into spec/03-architecture.sysml (logical) and spec/06-physical-architecture.sysml (physical dataflow/allocation)."
argument-hint: "none — reads the most recently touched specs/*/plan.md"
compatibility: "Requires this repo's spec-kit + spec/*.sysml layout"
metadata:
  author: "project"
  hook-of: "speckit-plan"
user-invocable: true
disable-model-invocation: false
---

## Purpose

`/speckit-plan` produces `plan.md` (plus `data-model.md`/`contracts/`/`quickstart.md`), describing how a feature from `spec.md` will actually be built. `spec/03-architecture.sysml` is this repo's real SysML v2 logical architecture, and it is where `satisfy requirement ... by todoDigitalThread;` links live — the system, not any individual part, satisfies each requirement. `spec/06-physical-architecture.sysml` refines that into the concrete realization (processes, files, ports, `allocate ... to ...;`) — a plan can easily add new logical satisfaction without ever touching physical reality, so this skill checks both files, not just the logical one (this gap was found the hard way on feature 001: a plan.md that added a real new dataflow edge — the extension host writing back to `.sysml` source and re-invoking the extractor — updated only `03-architecture.sysml`, leaving `06-physical-architecture.sysml` stale until someone asked "why wasn't physical architecture updated?").

## Outline

1. **Locate the feature plan**: run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from the repo root and read `IMPL_PLAN` (and `FEATURE_SPEC`) from its output. If that fails, fall back to the most recently modified `specs/*/plan.md`. Read `plan.md`, and `data-model.md` if present.

2. **Read current SysML state**:
   - Read `spec/03-architecture.sysml` in full — note existing `part def` blocks (`@id: ARCH-*`), the `todoDigitalThread` part, existing `satisfy requirement ...` lines, and existing `verification ...` usage blocks.
   - Read `spec/02-requirements.sysml` to know which `REQ-TODO-*` requirements exist, in particular the ones added by the matching `speckit-sync-sysml-spec` run for this same feature (compare against `spec/01-use-cases.sysml`/`spec/04-traceability.sysml` timestamps or content if needed to identify which REQs are new for this feature).

3. **Determine satisfaction**: for each requirement introduced by this feature (i.e. not already covered by an existing `satisfy requirement ...` line in `03-architecture.sysml`), decide whether `plan.md` describes it as satisfied by the existing `todoDigitalThread` system, or by a genuinely new architectural part:
   - **Default / common case**: this repo has one running system (`todoDigitalThread` : `TodoApp`). If plan.md doesn't describe a new standalone component, add:
     ```
     satisfy requirement satisfies<Name> : <Name>Requirement by todoDigitalThread;
     ```
     grouped with the existing `satisfy requirement` block.
   - **New component case**: if plan.md clearly introduces a new architectural role (e.g. a new service/process, not just a new file within an existing role), add a new `part def` with the next `ARCH-*` id before the `todoDigitalThread` block, following the existing style (see `ARCH-MODEL`, `ARCH-PARSER`, `ARCH-EXTENSION`), and wire it into `todoDigitalThread`'s body (`part <name> : <NewPartDef>;` plus any `connect` statements plan.md implies). Only do this when the plan genuinely warrants it — do not invent architecture that isn't in plan.md.

4. **Determine physical impact** — read `spec/06-physical-architecture.sysml` in full (existing `part def` blocks with `@id: PHYS-*`, their `port`s, the `physicalRealization` part's `connect`/`allocate` statements), then check plan.md/data-model.md/contracts/ for any of these signals that mean physical reality changed even though the logical architecture (step 3) didn't need a new part:
   - A new **file gets written to**, not just read (e.g. an edit/persistence flow) — look for a contract describing a write path back into `spec/*.sysml` or `data/*.sysml`, or into any other file. This needs a new `port` on the writing `part def` and the written-to `part def`, plus a `connect` in `physicalRealization` — see the edit-round-trip connection added for feature 001 as the template.
   - A process gets **invoked in a new way** (e.g. spawned as a child process by another part, not just run manually) — note this as a doc comment on the relevant `part def` (its physical identity doesn't change, just how/when it's triggered) rather than fabricating a new part for the same process.
   - A **new physical process/language/runtime** is genuinely introduced (rare — most features live inside an existing `PHYS-*` part) — add a new `part def` with the next `PHYS-*` id, following the existing style, wire it into `physicalRealization`.
   - If none of the above apply (the plan is pure logic/UI inside an existing process, touching only files already flowing through the existing pipeline), physical architecture needs no change — say so explicitly rather than padding the file.

5. **Validate**: run `cd parser && node extract.js` from the repo root and confirm it completes without errors. Fix and re-run if it doesn't.

6. **Report**: list every `satisfy requirement` line added, every new logical `part def`/`part` added (if any), every physical change made (new ports/connections/part defs, or explicitly "no physical change needed" with the reasoning), and any requirement from this feature that plan.md doesn't clearly satisfy yet (leave those unaddressed and call them out explicitly rather than guessing). Note that `spec/05-test-cases.sysml` and the matching `verification` usages in `03-architecture.sysml` are not touched here — `/speckit-tasks` has its own sync hook for those.

## Key rules

- Never edit or renumber an existing `@id` block — only append new ones.
- Prefer satisfying via the existing `todoDigitalThread` system over inventing new architecture; this repo is intentionally a single small app.
- Keep formatting (indentation, comment style) consistent with the immediately preceding block in the same file.
- If plan.md doesn't clearly satisfy a given requirement yet (e.g. it's deferred to a later feature), skip it and say so — do not add a `satisfy` line you can't justify from plan.md's actual content.
- Do not skip the physical-architecture check as a formality — a plan can add real new dataflow (writes, child-process invocations, new files) while leaving the logical satisfy links looking complete. Both files need an explicit answer, not just the logical one.

## Done When

- [ ] plan.md located and read
- [ ] Every requirement this feature introduces either gets a `satisfy` line, gets new logical architecture, or is explicitly reported as unaddressed
- [ ] Physical architecture explicitly addressed: either updated (new ports/connections/parts) or explicitly confirmed unchanged, with reasoning either way
- [ ] `node extract.js` runs clean after the edits
- [ ] Summary reported to the user
