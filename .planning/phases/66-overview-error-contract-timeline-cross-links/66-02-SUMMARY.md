---
phase: 66-overview-error-contract-timeline-cross-links
plan: 02
subsystem: ui
tags: [navigation, tanstack-router, open-redirect-guard, quick-switcher, command-palette, search]

# Dependency graph
requires:
  - phase: 66 (this phase)
    provides: 66-UI-SPEC A-8 dead-link dispositions (suppression-as-absence)
provides:
  - resolveTimelineNavUrl mounted-route + R-05/WR-01 guard (lib/timeline-navigation.ts)
  - getWorkItemUrl retargeted to mounted routes (never /mous/$id or /documents/$id)
  - CommandPalette suppression of null-destination work items and stale recent-item urls
  - DossierSearchPage mou results navigate to /mous list
affects: [66-07 (timeline/activity consumers import resolveTimelineNavUrl), timeline cross-links]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Static allowlist mounted-route guard (regex prefixes) over router.matchRoute'
    - 'Suppression-as-absence: null url → affordance not rendered (never disabled/dead-end)'
    - 'Re-validate persisted localStorage urls through the guard at render/use time'

key-files:
  created:
    - frontend/src/lib/timeline-navigation.ts
    - frontend/src/lib/__tests__/timeline-navigation.test.ts
    - frontend/src/domains/dossiers/hooks/__tests__/useQuickSwitcherSearch.test.ts
  modified:
    - frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts
    - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
    - frontend/src/pages/DossierSearchPage.tsx

key-decisions:
  - 'Mounted-route guard = static regex allowlist folding in R-05/WR-01 safety, not router.matchRoute (RESEARCH A1)'
  - 'getWorkItemUrl widened to string | null; null = suppress the affordance (A-8 suppression-as-absence)'
  - 'relatedWork memo filters null-url items (absence) rather than rendering disabled rows'
  - 'Stale localStorage recent-item urls re-validated through resolveTimelineNavUrl before navigation'

patterns-established:
  - 'resolveTimelineNavUrl is the single mounted-route gate for server/DB/localStorage-sourced nav urls'
  - 'Dead-link emitters retarget to a mounted list/tab or suppress — never emit an unmounted detail route'

requirements-completed: [OVRERR-02]

# Metrics
duration: 6min
completed: 2026-06-13
---

# Phase 66 Plan 02: Mounted-route guard + live dead-link retarget Summary

**resolveTimelineNavUrl mounted-route guard (R-05/WR-01 + allowlist) plus retargeting of the three live dead links — quick-switcher /mous/$id and /documents/$id and DossierSearchPage /mous/$id — to mounted routes or suppression.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-13T01:55:55+03:00 (first commit)
- **Completed:** 2026-06-13T02:01:11+03:00 (last code commit)
- **Tasks:** 2 (both TDD)
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- Shipped `resolveTimelineNavUrl`: a static-allowlist mounted-route guard that preserves every R-05/WR-01 open-redirect rejection AND adds mountedness — unmounted detail routes (`/mous/<id>`, `/documents/<id>`, `/calendar/<id>`) resolve to `null`. Exported for the wave-2 consumer plan (66-07).
- Retargeted `getWorkItemUrl` (widened to `string | null`): `mou` → `/mous` (or the owning org's mounted `/mous` tab), `document` → owning dossier `/docs` tab or `null` when no non-engagement context. Never emits `/mous/$id` or `/documents/$id`.
- CommandPalette: filtered null-destination work items out of the results list (absence, not disabled), skipped navigation/recent-write on null selection, and re-validated stale persisted recent-item urls through the guard so old `/mous/<uuid>` localStorage entries no longer dead-end.
- DossierSearchPage `mou` results now navigate to the mounted `/mous` list.

## Task Commits

Each task was committed atomically (TDD: test → feat):

1. **Task 1 RED: guard matrix** - `6cc01d79` (test)
2. **Task 1 GREEN: resolveTimelineNavUrl** - `28fa3577` (feat)
3. **Task 2 RED: quick-switcher retarget tests** - `91186fba` (test)
4. **Task 2 GREEN: retarget dead links + suppression** - `b311f25f` (feat)

## Files Created/Modified

- `frontend/src/lib/timeline-navigation.ts` - mounted-route + R-05/WR-01 guard (`resolveTimelineNavUrl`)
- `frontend/src/lib/__tests__/timeline-navigation.test.ts` - 25-case rejection/acceptance matrix
- `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts` - `getWorkItemUrl` exported + retargeted; `handleWorkItemSelect` widened to `string | null` (skips recent-write on null)
- `frontend/src/domains/dossiers/hooks/__tests__/useQuickSwitcherSearch.test.ts` - getWorkItemUrl mapping pins (A-8)
- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` - import guard + `getWorkItemUrl`; filter null-url results; skip nav/recent on null; re-validate stale recent-item urls
- `frontend/src/pages/DossierSearchPage.tsx` - `mou` case navigates to `/mous`

## Decisions Made

- Followed the plan's interfaces block verbatim for the guard (regex allowlist) and `getWorkItemUrl`.
- In CommandPalette, imported `getWorkItemUrl` from the deep domain hook path (`@/domains/dossiers/hooks/useQuickSwitcherSearch`) rather than the deprecated `@/hooks` shim or the barrel, because the shim does not re-export it and the plan's `files_modified` does not include the barrel `index.ts` — keeping the change surgical to the 6 plan files.
- Chose to filter null-url items in the `relatedWork` memo (the affordance is structurally absent) rather than rendering a disabled `CommandItem`, matching UI-SPEC §3 suppression-as-absence.

## Deviations from Plan

None - plan executed exactly as written. The `getWorkItemUrl` import path choice (above) is an in-scope implementation detail, not a deviation; no extra files were touched.

## Issues Encountered

- The worktree shipped without `node_modules`; ran `pnpm install --frozen-lockfile` at the worktree root (lockfile restore only, no new packages) before executing — resolved, exit 0.

## Out-of-Scope Observation (NOT fixed — logged for the orchestrator/66-07)

- `DossierSearchPage.tsx:137` also emits a dead `/documents/${item.id}` link (the `document` case), parallel to the quick-switcher document dead link. The plan's A-8 scope for this file names ONLY the `mou` case, and the Task 2 verify gate checks `documents/${item.id}` only in `useQuickSwitcherSearch.ts`. Per surgical-change discipline I retargeted exactly the planned `mou` case and left the DossierSearchPage `document` case untouched. This is a pre-existing dead link the next timeline/cross-link plan (66-07) or a follow-up should address; flagging it here so it is not dropped.

## Known Stubs

None. The `null` returns from `getWorkItemUrl` and the suppressed rows are the designed suppression-as-absence behavior (binding UI-SPEC A-8), not unwired stubs.

## Threat Flags

None. The guard tightens the existing R-05/WR-01 open-redirect surface (threats T-66-03 / T-66-04 mitigated by the matrix test and stale-url re-validation); no new network endpoints, auth paths, or schema surface introduced.

## Verification

- `pnpm exec vitest run` on both new test files: **32/32 pass** (25 guard matrix + 7 quick-switcher mappings).
- `pnpm type-check`: **exit 0**.
- Dead-link grep guards: no `/mous/${item.id}` in `useQuickSwitcherSearch.ts` or `DossierSearchPage.tsx`; no `/documents/${item.id}` in `useQuickSwitcherSearch.ts` (both grep exit 1 = clean).
- Pre-commit `pnpm build` passed on every commit (hooks not bypassed).

## Next Phase Readiness

- `resolveTimelineNavUrl` is shipped, exported, and matrix-tested — 66-07's timeline/activity consumers can import it without exploration.
- Quick-switcher, CommandPalette recents, and dossier search no longer navigate to `/mous/$id` or `/documents/$id`.
- Open item for 66-07/follow-up: the `DossierSearchPage` `document`-case dead link (see Out-of-Scope Observation).

## Self-Check: PASSED

- All 3 created code/test files + SUMMARY.md exist on disk.
- All 4 task commits (`6cc01d79`, `28fa3577`, `91186fba`, `b311f25f`) present in git history.

---

_Phase: 66-overview-error-contract-timeline-cross-links_
_Plan: 02_
_Completed: 2026-06-13_
