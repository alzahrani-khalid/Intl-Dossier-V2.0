---
phase: 66-overview-error-contract-timeline-cross-links
plan: 04
subsystem: ui
tags: [error-contract, ovrerr-01, overview-cards, stale-while-error, i18n, tdd, rtl]

# Dependency graph
requires:
  - phase: 66-01
    provides: 'dossier:overview.sectionError key (en+ar) + fail-the-query service that rejects on section failure (isError now flips)'
provides:
  - '8 shared/country/org overview cards render the UI-SPEC §1 section error line (role="alert", text-[var(--danger)]) before the empty branch'
  - 'Stale-while-error semantics on all 8 cards: cached data survives a background-refetch failure unblanked'
  - 'Parameterized forced-error test suite (OverviewCardErrorStates.test.tsx) realizing 66-VALIDATION row 2, shared/country/org half'
affects: [66-05, 66-06, 66-07, dossier-overview, dossier-drawer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'error-before-empty card branch: if (isError && <data-unavailable>) render role="alert" sectionError line, reusing the card chrome verbatim'
    - 'stale-while-error: error line ONLY when no cached data (data===null for useDossierOverview, data===undefined for raw useQuery, activities.length===0 for the timeline hook)'

key-files:
  created:
    - frontend/src/pages/dossiers/overview-cards/__tests__/OverviewCardErrorStates.test.tsx
  modified:
    - frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx
    - frontend/src/pages/dossiers/overview-cards/SharedRecentActivityCard.tsx
    - frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx
    - frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx
    - frontend/src/pages/dossiers/overview-cards/EngagementsByStageCard.tsx
    - frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx
    - frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx
    - frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx
    - frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx

key-decisions:
  - 'Per-hook data-unavailable comparison matched to the hook return shape: data===null (6 useDossierOverview cards), summary===undefined (MoUStatusCard raw useQuery), recentActivities.length===0 (SharedRecentActivityCard — the timeline hook flattens to a []-default array, never exposes data)'
  - 'Error line is the UI-SPEC §1 anatomy verbatim — role="alert", text-sm text-[var(--danger)] text-center py-8, t(overview.sectionError) with defaultValue; no icon, no retry button, no new dir attribute (inherits the card container)'
  - 'Card chrome (container, dir handling, h3 title, and MoUStatusCard header FileSignature icon row) reused exactly in each error branch; empty branches byte-identical (A-4)'

patterns-established:
  - 'Section error card branch: insert after the isLoading branch and BEFORE the empty/allZero check; stale-while-error gates the branch on no-cached-data'

requirements-completed: [OVRERR-01]

# Metrics
duration: ~20min
completed: 2026-06-12
---

# Phase 66 Plan 04: Shared/Country/Org Overview Card Section Error Lines (OVRERR-01) Summary

**Eight shared/country/organization overview cards now render the UI-SPEC §1 danger section-error line (role="alert") before their empty branch, with stale-while-error semantics so a forced section fetch failure can never impersonate a trustworthy zero/empty.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-12T22:57:00Z
- **Completed:** 2026-06-12T23:16:09Z
- **Tasks:** 2
- **Files modified:** 10 (8 cards + 2 test files)

## Accomplishments

- Parameterized RED-first forced-error suite covering all 8 cards (6 useDossierOverview consumers via it.each, SharedRecentActivityCard via its existing test file, MoUStatusCard via an inline-useQuery rejection mock + retry:false QueryClient).
- Per-card section error branch on all 8 cards: `role="alert"` + `text-[var(--danger)]` + `t('overview.sectionError')`, inserted after the skeleton branch and BEFORE the empty branch, reusing each card's own chrome (A-4).
- Stale-while-error wired uniformly — the error line renders ONLY when there is no cached data, so a background refetch failure keeps the last-good view.
- Empty ≠ error preserved: genuinely empty/all-zero data with no error still renders the unchanged empty copy and no alert.

## Task Commits

Each task was committed atomically:

1. **Task 1: Forced-error card tests (RED)** - `c33bdd31` (test)
2. **Task 2: Error branch in all 8 cards (GREEN)** - `2250e09d` (feat)

_Note: this plan is RED→GREEN; the test commit precedes the feature commit._

## Files Created/Modified

- `__tests__/OverviewCardErrorStates.test.tsx` (created) - Parameterized forced-error suite: 6-card it.each (alert present, empty copy absent), SharedSummaryStatsCard stale-while-error + empty≠error pins, SharedRecentActivityCard lazy-import error case, MoUStatusCard QueryClientProvider rejection case.
- `__tests__/SharedRecentActivityCard.test.tsx` (modified) - Made the hoisted mock `isError` mutable, added a `beforeEach` reset, and added the error-branch + stale-while-error cases; existing data-render cases unchanged and still green.
- `SharedSummaryStatsCard.tsx` - `isError` destructure + `isError && data === null` branch before the empty/allZero check.
- `BilateralSummaryCard.tsx` - same branch, inserted before the derived bilateral computations.
- `KeyContactsCard.tsx`, `KeyRepresentativesCard.tsx`, `MembershipStructureCard.tsx`, `EngagementsByStageCard.tsx` - same `data === null` branch.
- `SharedRecentActivityCard.tsx` - `isError` destructure + `isError && recentActivities.length === 0` branch (timeline hook has no `data`; its flattened array is the only no-data signal, which also yields correct stale-while-error behavior).
- `MoUStatusCard.tsx` - `isError` destructure + `isError && summary === undefined` branch; error branch reuses the header flex row (title + FileSignature icon) verbatim.

## Decisions Made

- **Per-hook data-unavailable comparison** matched to each hook's actual return shape (the only subtle point): `data === null` for the 6 `useDossierOverview` cards (hook returns `query.data || null`), `summary === undefined` for `MoUStatusCard` (raw `useQuery`), and `recentActivities.length === 0` for `SharedRecentActivityCard` (the timeline hook flattens pages to a `[]`-default array and never exposes `data`). The array-length form also correctly implements stale-while-error: cached activities present → data renders, no alert.
- **Chrome reused verbatim** in every error branch (A-4): same container/dir, same h3 title key, and for MoUStatusCard the same `flex items-center justify-between` header row with the FileSignature icon. Only the body slot becomes the alert line.
- **No `text-destructive`, no icon, no retry** on cards — UI-SPEC §1 / A-3 / A-4.

## Deviations from Plan

None - plan executed exactly as written. Both tasks completed with the exact UI-SPEC §1 anatomy; all per-card comparisons followed the interfaces table.

### Side-effect note (not a deviation)

`frontend/src/routeTree.gen.ts` was whitespace-reflowed by the TanStack Router Vite plugin during `vitest`/`type-check` (same mechanism documented in 66-01). It is OUTSIDE this plan's `files_modified`, was never touched by any edit, and was left UNSTAGED — neither reverted nor committed (committing the reflow would collide with the sibling worktrees on 66-05/66-06/66-07). The orchestrator's merge/regeneration step owns it.

## Issues Encountered

None. RED confirmed first try (9 error-branch cases failed against the unmodified cards); GREEN reached on the first implementation pass (14/14).

## Known Stubs

None. No hardcoded empties, placeholders, or unwired data sources introduced. The error branches consume the live `isError` flag from each card's existing hook (which 66-01 made reject on section failure).

## Threat Flags

None. No new network endpoints, auth paths, file access, or schema surface — cards render only the localized `overview.sectionError` copy (never `error.message`), satisfying threat T-66-07/T-66-08 with tests pinning the localized copy and the empty-copy absence.

## Verification

| Gate                                                              | Result         |
| ----------------------------------------------------------------- | -------------- |
| `vitest run OverviewCardErrorStates + SharedRecentActivityCard`   | 14 passed (14) |
| RED confirmation (Task 1, before implementation)                  | RED_CONFIRMED  |
| `pnpm type-check` (`tsc --noEmit`)                                | exit 0         |
| `overview.sectionError` present in all 8 cards                    | 8/8            |
| no `text-destructive` introduced (SharedSummaryStats + Bilateral) | NONE           |
| `eslint` (8 cards + 2 tests)                                      | exit 0         |
| 66-VALIDATION row 2 (shared/country/org half) realized            | yes            |

## Next Phase Readiness

- The shared/country/org card half of OVRERR-01 is complete and honest. 66-05 owns the type-tab remainder (11 cards) + `TypeCardErrorStates.test.tsx`; zero overlap with this plan in the shared `__tests__` dir (this plan owns `OverviewCardErrorStates.test.tsx` + `SharedRecentActivityCard.test.tsx` only).
- No blockers. The `routeTree.gen.ts` reflow is the orchestrator's to resolve at merge time.

## Self-Check: PASSED

- FOUND: `frontend/src/pages/dossiers/overview-cards/__tests__/OverviewCardErrorStates.test.tsx`
- FOUND: `frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx`
- FOUND: `frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx`
- FOUND: `.planning/phases/66-overview-error-contract-timeline-cross-links/66-04-SUMMARY.md`
- FOUND commit `c33bdd31` (Task 1 — RED forced-error tests)
- FOUND commit `2250e09d` (Task 2 — GREEN per-card error branches)

---

_Phase: 66-overview-error-contract-timeline-cross-links_
_Completed: 2026-06-12_
