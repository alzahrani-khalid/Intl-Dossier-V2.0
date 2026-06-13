---
phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
plan: 04
subsystem: frontend-dossier-detail
tags: [deletion, dead-code, dossier, PERENG-03]
wave: 2
depends_on: [67-01, 67-02]
requires:
  - 'Wave 1 (67-01/67-02) landed so whole-repo gates run against a stable tree'
provides:
  - 'Legacy *DossierDetail root chain removed (6 details + 6 page wrappers + EngagementDetailPage + DossierDetailLayout)'
  - 'components/dossier/index.ts barrel without the DossierDetailLayout export'
  - 'sections/* and transitive leaves now provably orphaned for the 67-05 sweep'
affects:
  - 'frontend/src/components/dossier/'
  - 'frontend/src/pages/dossiers/'
  - 'frontend/src/pages/engagements/'
tech_stack:
  added: []
  patterns:
    - '65-03 deletion discipline: execution-time re-grep STOP gate before each destructive commit, one commit per closed sub-graph'
key_files:
  created: []
  modified:
    - frontend/src/components/dossier/index.ts
  deleted:
    - frontend/src/components/dossier/CountryDossierDetail.tsx
    - frontend/src/components/dossier/ForumDossierDetail.tsx
    - frontend/src/components/dossier/OrganizationDossierDetail.tsx
    - frontend/src/components/dossier/PersonDossierDetail.tsx
    - frontend/src/components/dossier/TopicDossierDetail.tsx
    - frontend/src/components/dossier/WorkingGroupDossierDetail.tsx
    - frontend/src/pages/dossiers/CountryDossierPage.tsx
    - frontend/src/pages/dossiers/ForumDossierPage.tsx
    - frontend/src/pages/dossiers/OrganizationDossierPage.tsx
    - frontend/src/pages/dossiers/PersonDossierPage.tsx
    - frontend/src/pages/dossiers/TopicDossierPage.tsx
    - frontend/src/pages/dossiers/WorkingGroupDossierPage.tsx
    - frontend/src/pages/engagements/EngagementDetailPage.tsx
    - frontend/src/components/dossier/DossierDetailLayout.tsx
decisions:
  - 'Reverted generator-only routeTree.gen.ts reformatting churn before each commit — it was prettier line-wrapping emitted by the TanStack Router build plugin, contained zero deletion-set references, and was out of this deletion plan scope'
metrics:
  duration: ~25m
  completed: '2026-06-13'
  tasks: 2
  commits: 2
  files_deleted: 14
  files_modified: 1
  lines_removed: 3272
---

# Phase 67 Plan 04: Legacy \*DossierDetail Root-Chain Deletion Summary

Deleted the fully-closed legacy detail plane — 6 `*DossierDetail` components, their 6 `pages/dossiers/*DossierPage` wrappers, the 812-line `EngagementDetailPage`, and `DossierDetailLayout` + its barrel export — gated on execution-time importer re-greps with type-check + build green per commit and the full unit suite green at wave close (PERENG-03).

## What Was Done

Two destructive commits, each preceded by its own re-grep STOP gate (65-03 discipline). The RESEARCH census (zero external importers, zero `routeTree.gen.ts` references, zero test references) was re-verified live at execution time before any `git rm`.

### Task 1 — 13-file root chain (`bdf13843`)

- **Gate (passed):** grepped all 13 bare module names across `frontend/src`. Every hit was inside the deletion set itself — each `*DossierDetail` only defined in its own file + imported by its own `*DossierPage` wrapper (in the set); each `*DossierPage` only self-referenced (interface + function def), zero external importers; `EngagementDetailPage` only self-referenced (default export), zero importers. `routeTree.gen.ts`: zero matches. No path-based imports anywhere. Known `TypeCardErrorStates.test.tsx` false positive produced no hits (it matches overview-card names, not these components).
- `git rm` the 13 files in one commit (closed sub-graph). The live `pages/dossiers/overview-cards/` directory (20 files) was confirmed intact — only the 6 wrapper files were removed, never the directory.
- **Verify:** `pnpm type-check` exit 0, `pnpm build` exit 0 (chunk-size note is a pre-existing advisory). Post-commit re-grep: `ROOT_CHAIN_CLEAN` (zero surviving references).
- 13 files changed, 2881 deletions.

### Task 2 — DossierDetailLayout + barrel line (`5adf9121`)

- **Gate (passed):** grepped `DossierDetailLayout` across `frontend/src` after Task 1 — hits were ONLY its own file (self-references) and the single barrel export line at `components/dossier/index.ts:40` (actual line 40, not 41 as the plan note estimated; verified by grep, not assumed). No other importer.
- `git rm DossierDetailLayout.tsx`; surgical `Edit` on the barrel removed the `export { DossierDetailLayout } from './DossierDetailLayout'` line plus its now-orphaned `// Detail Layout` section comment (cleaning my own orphan; touched nothing else in the barrel).
- **Verify:** `pnpm type-check` exit 0, `pnpm build` exit 0, full unit suite `pnpm exec vitest run` exit 0 — **182 test files passed / 4 skipped; 1417 tests passed / 25 todo; 0 failures**. Post-commit re-grep: `ALL_15_MODULES_CLEAN`.
- 2 files changed, 391 deletions.

## Per-Commit Gate Evidence

| Commit     | Gate (pre-delete)                           | type-check | build  | unit suite         | Post-delete re-grep  |
| ---------- | ------------------------------------------- | ---------- | ------ | ------------------ | -------------------- |
| `bdf13843` | 13 names: all in-set; routeTree clean       | exit 0     | exit 0 | n/a (wave close)   | ROOT_CHAIN_CLEAN     |
| `5adf9121` | DossierDetailLayout: own file + barrel only | exit 0     | exit 0 | exit 0 (1417 pass) | ALL_15_MODULES_CLEAN |

Baseline `pnpm type-check` on the pre-deletion tree was also confirmed exit 0, so post-deletion green builds are attributable to clean deletions, not a pre-broken tree.

## STOP Events

None. Every gate confirmed the RESEARCH census was still accurate — no unexpected importer appeared, so no STOP rule was triggered.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reverted generator-only routeTree.gen.ts reformatting churn**

- **Found during:** Tasks 1 and 2 (after each `pnpm build` and again after each pre-commit build hook)
- **Issue:** The TanStack Router build plugin rewrites `frontend/src/routeTree.gen.ts` with prettier-style line-wrapping of identical route definitions on every build. This is a generated build artifact unrelated to this deletion.
- **Fix:** Confirmed the diff contained zero deletion-set names (`grep -iE 'DossierDetail|DossierPage|EngagementDetailPage|DossierDetailLayout'` empty), then `git checkout -- frontend/src/routeTree.gen.ts` to keep the commits surgical (deletions only). Final working tree left clean for the orchestrator.
- **Files modified:** none committed (reverted)
- **Commit:** n/a (kept out of both commits intentionally)

## Known Stubs

None — this is a pure dead-code deletion; no UI data sources, props, or placeholders were introduced.

## Orphans Created (for 67-05, not deleted here)

Deleting this root chain orphans (per 67-PATTERNS) the following, which the 67-05 wave-3 sweep removes with fresh grep gates:

- `components/dossier/sections/*` — `InteractionHistory`\* (salvage candidate for PERENG-02), `PositionsHeld`, `OrganizationAffiliations`, `CommitteeAssignments`, `ContactPreferencesSection`, `ElectedOfficialProfile`, `ProfessionalProfile`, `StaffDirectory`, `TermHistory`, `InstitutionalProfile`, `OrgHierarchy`, `DecisionLogs`, `DeliverablesTracker`, `MeetingSchedule`, `MemberOrganizations` (plus the 4 already-orphaned 65-03 leftovers).
- These were intentionally NOT touched in this plan — they only become provably orphaned once this root chain lands.

## Verification

- 67-VALIDATION PERENG-03 grep-gate row partially realized (root-chain + DossierDetailLayout module names → zero surviving references); completed phase-wide in 67-05.
- Per-commit type-check + build exit codes verified manually (pre-commit build does not block on failure, per project memory).
- Wave-close full vitest suite: green.

## Self-Check: PASSED

- Modified file exists: `frontend/src/components/dossier/index.ts` — FOUND (barrel still present, DossierDetailLayout export gone, type-check green).
- All 14 deleted files confirmed absent from disk.
- Commit `bdf13843` — FOUND in git log.
- Commit `5adf9121` — FOUND in git log.
- Working tree clean (no leftover generated churn).
