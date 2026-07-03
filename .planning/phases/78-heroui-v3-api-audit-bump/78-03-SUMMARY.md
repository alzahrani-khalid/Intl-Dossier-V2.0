---
phase: 78-heroui-v3-api-audit-bump
plan: 03
subsystem: ui
tags: [heroui, audit, protocol-rerun, regression-sweep, verification, evidence]

# Dependency graph
requires:
  - phase: 78-01
    provides: '@heroui/react + @heroui/styles bumped to 3.2.1 in lockstep (node_modules on 3.2.1)'
  - phase: 78-02
    provides: 'HeroUIFormCheckbox/HeroUIFormSwitch migrated to v3.2 *.Content; committed heroui-forms behavioral oracle'
provides:
  - 'Evidence-paired protocol re-run artifact (78-PROTOCOL-RERUN.md) diffing all 4 Phase 75 commands against 3.2.1'
  - 'HEROUI-02 confirmation closed on 3.2.1 with a re-derivable trail Phase 80 can diff against'
  - 'Behavioral oracle bound: pnpm --dir frontend test run heroui-forms exit 0 recorded as HEROUI-02 real oracle'
affects: [80]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Protocol re-run diff: byte-match every Phase 75 command output modulo pre-predicted deltas; the ONLY expected delta is command-4 Checkbox.Content/Switch.Content from 78-02'
    - "Import-specific grep (from '@heroui/react') is authoritative for import-site count (8); the loose @heroui text grep is noise"
    - 'The 4 protocol commands are blind to the toggles composition change (tsc exits 0 either way) — the heroui-forms vitest oracle is the only DOM/behavior check that binds it'

key-files:
  created:
    - .planning/phases/78-heroui-v3-api-audit-bump/78-PROTOCOL-RERUN.md
  modified: []

key-decisions:
  - 'Recorded the command-1 grep enumeration-order swap (ConcurrentDrawers.test.tsx / AppShell.tsx positions 6↔7) as a filesystem-walk artifact, not a content delta — proven by an empty sorted-set diff (SETS IDENTICAL).'
  - 'Captured command 4 UNtrimmed (Phase 75 recorded a trimmed subset) and labeled the extra closing-tag / card.tsx comment lines as presentation, isolating the single load-bearing *.Content delta.'

patterns-established:
  - 'A read-only verification plan closes a requirement with a committed evidence artifact (command + raw output + date + exit code + interpretation + per-command diff verdict), zero source-code changes.'

requirements-completed: [HEROUI-02]

# Metrics
duration: 6 min
completed: 2026-07-03
---

# Phase 78 Plan 03: Protocol Re-run (HEROUI-02 confirmation on 3.2.1) Summary

**Re-ran the four Phase 75 protocol commands VERBATIM against the 3.2.1 tree, diffed each raw output against `75-AUDIT-heroui-confirmation.md`, and wrote the evidence-paired re-run artifact — every command matches its Phase 75 record modulo the single pre-predicted `*.Content` delta from plan 78-02; straggler count 0; behavioral oracle exit 0.**

## Performance

- **Duration:** ~6 min
- **Tasks:** 2 (both read-only verification)
- **Files modified:** 1 created (`78-PROTOCOL-RERUN.md`), 0 source files

## Accomplishments

- Confirmed the Phase 75 HeroUI-conformance audit **holds on 3.2.1**: 8 import sites, 0 removed-name imports (exit 1), type-check exit 0, compound dot-notation present in all three wrappers.
- Recorded the one **expected** delta (command 4's `Checkbox.Content` L201 / `Switch.Content` L253) with a citation to `78-02-SUMMARY.md`, adjudicated as an addition — not a regression.
- Baked all 5 false-positive guards into the diff so nothing was mis-flagged (TweaksDrawer flat-named Drawer exports, `Autocomplete` existence, lookalike `heroui-*` files, `CheckboxRenderProps` deprecation, additive 3.2.x exports).
- Bound the protocol's known blind spot (the toggles composition change tsc cannot see) to its real oracle by running `pnpm --dir frontend test run heroui-forms` → **exit 0, 4/4 passed**.
- Verified lockstep held with zero 3.0.5 remnant (`@heroui/react` and `@heroui/styles` both 3.2.1 in the lockfile).

## Task Commits

1. **Task 1 + Task 2 (single docs artifact):** `97e4a2d6` — `docs(78-03): protocol re-run — Phase 75 records hold on 3.2.1 (HEROUI-02)`. The artifact was written in one pass (raw outputs + diff section + false-positive guards + verdict table), so both tasks landed in one atomic docs commit. Pre-commit hook ran and skipped build (`.planning/`-only change); prettier reformatted the markdown tables (content unchanged).

## Per-command match/delta verdicts

| #   | Command               | Result                                                                   | Verdict vs Phase 75                                                                                       |
| --- | --------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 1   | import-site inventory | 8 files; `Import-site count: 8`; `heroui-forms.test.tsx` absent          | **Match** — sorted-set diff empty (`SETS IDENTICAL`); only enumeration order differs (positions 6↔7 swap) |
| 2   | removed-name imports  | 0 hits, exit 1; `Removed-name import hits: 0 (exit 1)`                   | **Match** — byte-identical                                                                                |
| 3   | type-check            | `tsc --noEmit` exit 0; `Type-check: exit 0`                              | **Match** — same exit, now against 3.2.1 typings                                                          |
| 4   | compound dot-notation | Dot-notation in all three wrappers + `Checkbox.Content`/`Switch.Content` | **Match + 1 EXPECTED delta** (plan 78-02 migration; cited)                                                |

**Straggler count: 0** — no residual flat-prop call site surfaced; no criterion-3 conversion needed; no unexpected delta. Rollback reference (`git revert 10de0c95 && pnpm install`) NOT triggered.

**heroui-forms behavioral oracle:** `pnpm --dir frontend test run heroui-forms` → **exit 0**, `Test Files 1 passed (1) / Tests 4 passed (4)`. Recorded as HEROUI-02's real oracle that binds the protocol's toggles blind spot.

## Verification Evidence

Plan-level `<verification>` re-run at close:

- 4 protocol commands re-run verbatim; outputs match Phase 75 records modulo the explained `.Content` delta — ✅
- `pnpm --dir frontend test run heroui-forms` exit 0 (blind-spot bind) — ✅
- Task 1 verify (`… | grep -qx 8 && pnpm --dir frontend type-check`) → count==8 OK, type-check exit 0 — ✅
- Task 2 verify (`test run heroui-forms && grep "Import-site count: 8" && grep -i "diff vs phase 75"`) → all three pass — ✅
- Artifact ≥ 60 lines (min_lines gate): **268 lines** — ✅

## Decisions Made

- **Enumeration-order swap is not a delta.** Command 1's grep returned the 8 files in a slightly different order than Phase 75 (`ConcurrentDrawers.test.tsx`/`AppShell.tsx` swapped). A sorted-set `diff` proved the set is identical (`SETS IDENTICAL`); recorded as a filesystem-walk artifact, not a content change.
- **Command 4 captured untrimmed.** Phase 75 recorded command 4 "trimmed to the load-bearing lines." This re-run kept the full output and explicitly labeled the extra closing-tag and `card.tsx` comment lines as presentation, isolating the single `*.Content` load-bearing delta so the diff stays honest.

## Deviations from Plan

None - plan executed exactly as written. Read-only verification plan; all outputs matched the locked expectation (8 / 0-exit-1 / exit-0 / compound present) modulo the single pre-predicted `*.Content` delta. No source file touched; no straggler surfaced; no contingency path triggered.

**Total deviations:** 0.
**Impact:** none — HEROUI-02 closed with a re-derivable, evidence-paired trail.

## Issues Encountered

None blocking. No unexplained delta, no type-check failure, no removed-name hit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HEROUI-02 confirmation closed on 3.2.1; Phase 78's regression-sweep evidence trail is complete and diffable.
- Phase 80 (full-route EN/AR re-compare) can diff future protocol re-runs against `78-PROTOCOL-RERUN.md` exactly as this plan diffed against the Phase 75 artifact.
- The toggles blind spot is permanently bound to `heroui-forms.test.tsx`; any future consumer of `heroui-forms.tsx` inherits the migrated `*.Content` pattern plus its committed oracle.

---

_Phase: 78-heroui-v3-api-audit-bump_
_Completed: 2026-07-03_

## Self-Check: PASSED
