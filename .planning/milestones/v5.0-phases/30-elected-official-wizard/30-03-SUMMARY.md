---
phase: 30-elected-official-wizard
plan: '03'
subsystem: frontend/routing + wizard
tags: [v5.0, routing, wizard-wiring, review-step, tanstack-router]
requirements: [ELOF-01, ELOF-04]

dependency_graph:
  requires:
    - '30-01: electedOfficialWizardConfig + schema fields'
    - '30-02: OfficeTermStep (stub replaced by full impl on merge)'
  provides:
    - '/_protected/dossiers/elected-officials/create route'
    - 'PersonReviewStep conditional Office & Term section'
    - 'Elected officials list Create button → typed create route'
  affects:
    - 'frontend/src/routeTree.gen.ts'
    - 'frontend/src/routes/_protected/dossiers/elected-officials/index.tsx'
    - 'frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx'

tech_stack:
  added: []
  patterns:
    - 'TanStack Router file route (createFileRoute) — same pattern as persons/create'
    - 'Conditional ReviewSection block keyed on person_subtype'
    - 'OfficeTermStep stub (plan 30-02 replaces with full component)'

key_files:
  created:
    - frontend/src/routes/_protected/dossiers/elected-officials/create.tsx
    - frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx # stub only
  modified:
    - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx
    - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
    - frontend/src/routeTree.gen.ts

decisions:
  - 'OfficeTermStep stub created (Rule 3: blocking typecheck in parallel worktree); plan 30-02 replaces on merge'
  - 'routeTree.gen.ts manually updated in 9 locations (import, const, 3 type maps, /_protected/ map, preLoaderRoute, interface, const value) — Vite plugin regenerates on next dev start'
  - 'country_id and organization_id rendered as raw IDs in review (resolution to names is a post-creation enhancement)'

metrics:
  duration: '~35 minutes'
  completed: '2026-04-17'
  tasks_completed: 3
  files_created: 2
  files_modified: 3
---

# Phase 30 Plan 03: Wizard Wiring Summary

One-liner: Elected official create route wired end-to-end — list Create button → 4-step wizard → PersonReviewStep shows Office & Term card for elected_official subtype.

## Tasks Completed

| #   | Task                                                        | Commit   | Files                                                   |
| --- | ----------------------------------------------------------- | -------- | ------------------------------------------------------- |
| 1   | Create /dossiers/elected-officials/create route + routeTree | 9e6a866b | create.tsx, routeTree.gen.ts, OfficeTermStep.tsx (stub) |
| 2   | Update list page Create button link                         | 0c773f75 | elected-officials/index.tsx                             |
| 3   | Extend PersonReviewStep with Office & Term section          | 568edd4c | PersonReviewStep.tsx                                    |

## Key Changes

**create.tsx** — New TanStack Router file route at `/_protected/dossiers/elected-officials/create`. Mirrors persons/create.tsx exactly but uses `electedOfficialWizardConfig` (4 steps) and inserts `OfficeTermStep` as step 3.

**index.tsx** — Single line change: `to="/dossiers/create"` → `to="/dossiers/elected-officials/create"`. All other list page behavior unchanged.

**PersonReviewStep.tsx** — 41 lines added (+0 removed). Conditional block after Person Details section renders a third `ReviewSection` with 10 fields only when `values.person_subtype === 'elected_official'`. Edit button calls `onEditStep(2)` (OfficeTermStep index). Standard persons see 2 sections as before; 164 total LOC.

**routeTree.gen.ts** — Manually updated in 9 locations to register the new create route in all TanStack Router type maps. The Vite plugin will regenerate this file correctly on next `pnpm dev`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] OfficeTermStep stub created for typecheck**

- **Found during:** Task 1
- **Issue:** Plan 30-02 runs in parallel in a separate worktree and had not yet committed OfficeTermStep.tsx. The create.tsx import caused TS2307 error, blocking typecheck.
- **Fix:** Created minimal stub at `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` that exports the correct function signature. Plan 30-02's full implementation will overwrite this stub on merge.
- **Files modified:** `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx`
- **Commit:** 9e6a866b

**2. [Rule 3 - Blocking] routeTree.gen.ts manually updated**

- **Found during:** Task 1
- **Issue:** TanStack Router's Vite plugin regenerates routeTree.gen.ts automatically during `pnpm dev`, but the file is static in the worktree (no dev server running). TypeScript could not resolve the `createFileRoute('/_protected/dossiers/elected-officials/create')` path without the route tree entry.
- **Fix:** Manually added the new route to all 9 required locations in routeTree.gen.ts following the exact pattern of other create routes (countries/create, persons/create, etc.).
- **Files modified:** `frontend/src/routeTree.gen.ts`
- **Commit:** 9e6a866b

## Known Stubs

| Stub                                                         | File                                                              | Reason                                                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| OfficeTermStep renders `<div data-step="office-term" />`     | `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` | Plan 30-02 parallel worktree provides full implementation; this stub exists only for typecheck |
| country_id / organization_id displayed as raw UUID in review | `PersonReviewStep.tsx` lines ~136, ~140                           | Name resolution requires async lookup; deferred to post-creation detail page edit              |

## Standard Person Wizard — Unaffected

Verification: `grep -q "personWizardConfig" frontend/src/routes/_protected/dossiers/persons/create.tsx` → exit 0

The persons/create.tsx route still uses `personWizardConfig` (3 steps). PersonReviewStep's new conditional block short-circuits to null when `values.person_subtype !== 'elected_official'`, preserving the existing 2-section review layout for standard persons.

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns introduced. All changes are pure frontend routing and UI composition.

## Self-Check

- [x] `frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` exists
- [x] `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` exists (stub)
- [x] `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` updated
- [x] `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` updated (164 LOC)
- [x] Commits: 9e6a866b, 0c773f75, 568edd4c
- [x] No modifications to STATE.md or ROADMAP.md
- [x] typecheck: no errors in plan 30-03 files
