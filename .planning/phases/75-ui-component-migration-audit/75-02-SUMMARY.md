---
phase: 75-ui-component-migration-audit
plan: 02
subsystem: ui
tags: [heroui, heroui-v3, audit, migration, type-check, radix]

# Dependency graph
requires:
  - phase: 75 (RESEARCH)
    provides: verified 8-file HeroUI import inventory, removed-names grep, dist-declaration facts
provides:
  - AUDIT-02 confirmation — HeroUI on v3 compound API, 8 import sites, type-check exit 0
  - AUDIT-03 confirmation — 0 imports of any of 9 v3-removed names (exit 1)
  - Phase 78 re-run protocol (4 evidence commands + expected outputs + version-coupling note)
  - two false-positive traps documented (flat-named Drawer exports; heroui-* lookalikes)
  - Autocomplete-exists-in-3.0.5 nuance so Phase 78 does not chase a stale removal claim
affects: [phase-78-heroui-bump, phase-78-regression-sweep, phase-79-aceternity-rebuild]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Confirmation artifact: command + raw output + date + interpretation + machine-readable line'
    - "Import site = `from '@heroui/react'` match, never a text mention (import-specific grep)"

key-files:
  created:
    - .planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md
  modified: []

key-decisions:
  - "Import-specific grep (from '@heroui/react') is the sole definition of an import site — text match over-counts to 12"
  - 'Type-check run in the main checkout (worktree shares no node_modules); source byte-identical at base 228ce049, so exit 0 is faithful'
  - 'Recorded AUDIT-03 as an import-evidence statement (0 imports of 9 names), not a removal claim — Autocomplete still exports in 3.0.5'

patterns-established:
  - 'Pattern: every audit verdict is re-derivable by re-running its recorded command (verify gates run the greps live)'
  - 'Pattern: false-positive traps documented inline so the downstream sweep does not mis-flag conformant v3 usage'

requirements-completed: [AUDIT-02, AUDIT-03]

# Metrics
duration: 18min
completed: 2026-07-02
---

# Phase 75 Plan 02: HeroUI v3 Confirmation (AUDIT-02 + AUDIT-03) Summary

**Evidence-backed confirmation that the tree is fully on the HeroUI v3 compound API (8 import sites, `tsc --noEmit` exit 0) and imports zero of the 9 v3-removed component names, with a copy-paste Phase 78 re-run protocol and the two false-positive traps (flat-named Drawer exports; `heroui-*` lookalikes) documented.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-02
- **Completed:** 2026-07-02
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments

- **AUDIT-02 confirmed.** Import-specific grep returns exactly the RESEARCH-expected 8 files (`Import-site count: 8`); the `@heroui` text match over-counts to 12 (comment/docstring mentions in `main.tsx`, `StepGuidanceBanner.tsx`, and the two lookalike docstrings) and must not be used. Compound-usage spot-check confirms `Modal.*`, `Checkbox.Control/.Indicator`, `Switch.Control/.Thumb`, and `Card.*` dot-notation. `pnpm --dir frontend type-check` exits 0 — the mechanical proof that every call site conforms to installed 3.0.5 declarations. Residual flat-prop (v2 monolith) call sites: none.
- **AUDIT-03 confirmed.** Removed-names grep (9 names: the 8 requirement names plus Ripple) returns 0 hits, exit 1 (`Removed-name import hits: 0 (exit 1)`). No regressions, no replacement plans required.
- **Two false-positive traps documented** so Phase 78's sweep does not mis-flag: (1) flat-named Drawer exports (`DrawerBackdrop`, etc.) in `TweaksDrawer.tsx` are legitimate v3 API — verified against `dist/components/drawer/index.d.ts` line 66; (2) `heroui-chip.tsx` / `heroui-switch.tsx` / `heroui-tabs.tsx` contain no `@heroui/react` import (CVA/Radix lookalikes).
- **Autocomplete-exists-in-3.0.5 nuance recorded** (dist evidence: `autocomplete/index.d.ts` declares `Autocomplete`) so Phase 78 treats AUDIT-03 as import-evidence, not a removal claim. The official removed list is 7 names, not 8.
- **Stale `heroui-chip.tsx` docstring flagged** as a Phase 78 cleanup candidate ("Real @heroui/react Chip primitive" is false) — flagged only, no code edits in Phase 75.
- **Phase 78 re-run protocol** written: 4 evidence commands with expected outputs, `@heroui/react`/`@heroui/styles` lockstep note, and the `HEROUI_AUTH_TOKEN` gate for the first `@heroui-pro/react` import (installed 1.0.0-beta.6, 0 imports).

## Task Commits

Each task was committed atomically:

1. **Task 1: AUDIT-02 import inventory, compound spot-check, type-check proof + nuances** - `039116fc` (docs)
2. **Task 2: AUDIT-03 removed-names confirmation, nuance, Phase 78 re-run protocol, findings summary** - `8925fd6e` (docs)

_Docs-only phase — no `test`/`feat` commits; `commit_docs: true`._

## Files Created/Modified

- `.planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md` (created) - AUDIT-02 + AUDIT-03 confirmation evidence with findings summary, import inventory, type-check proof, both nuances, and the Phase 78 re-run protocol.

## Decisions Made

- **Import-specific grep is the definition of an import site.** The RESEARCH text-match fallback over-counts to 12; the artifact records both and directs Phase 78 to the `from '@heroui/react'` regex (which is also drift-proof against the stale chip docstring cleanup).
- **Type-check executed in the main checkout, not the worktree.** Claude Code worktrees share no `frontend/node_modules`, so `tsc --noEmit` cannot resolve `@heroui/react` / `@/*` from the worktree. The main checkout is at the identical base commit `228ce049` with a clean `frontend/src` (docs-only phase), so exit 0 is faithful to the audited tree. Documented as execution transparency in the artifact.
- **AUDIT-03 recorded as import-evidence, not a removal claim.** `Autocomplete` still exists as a 3.0.5 export, so the honest statement is "0 imports of any of the 9 checked names," with the 7-vs-8-name discrepancy and the dist-file path both documented.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' automated verify gates pass; all machine-readable lines (`Import-site count: 8`, `Type-check: exit 0`, `Removed-name import hits: 0 (exit 1)`) are consistent with live re-runs.

## Issues Encountered

- **Worktree has no `node_modules`.** The type-check and dist-file inspections resolve `@heroui/react` via the main repo's pnpm store; the type-check itself was run in the main checkout (identical base commit, clean frontend). Resolved by running the mechanical proof against the byte-identical source and documenting the execution location in the artifact. No impact on the recorded result.

## Known Stubs

None — this is a documentation artifact; no code or data-wiring stubs introduced.

## User Setup Required

None - no external service configuration required. (Note for Phase 78/79: the first `@heroui-pro/react` import will need `HEROUI_AUTH_TOKEN` wired in CI — documented in the artifact, not exercised here.)

## Next Phase Readiness

- **Phase 78 (HeroUI 3.0.5 → 3.2.1 bump + regression sweep)** has a copy-paste re-run protocol, a ten-second findings summary, and both false-positive traps documented. AUDIT-02/03 are closed as confirmations with dated evidence.
- No blockers. No code changes were made; all quality gates untouched.

## Self-Check: PASSED

- Artifact exists: `.planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md` — FOUND
- Commit `039116fc` (Task 1) — FOUND
- Commit `8925fd6e` (Task 2) — FOUND
- Machine-readable lines present and consistent with live re-runs: `Import-site count: 8`, `Type-check: exit 0`, `Removed-name import hits: 0 (exit 1)` — FOUND
- Both task verify gates re-run: PASS / PASS

---

_Phase: 75-ui-component-migration-audit_
_Completed: 2026-07-02_
