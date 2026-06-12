---
phase: 66-overview-error-contract-timeline-cross-links
plan: 07
subsystem: ui
tags: [navigation, timeline, activity-feed, open-redirect-guard, suppression-as-absence]

# Dependency graph
requires:
  - phase: 66 (plan 02)
    provides: resolveTimelineNavUrl mounted-route + R-05/WR-01 guard (lib/timeline-navigation.ts)
provides:
  - TimelineEventCard View-details gated on resolveTimelineNavUrl (suppression-as-absence)
  - EnhancedVerticalTimelineCard View-details gated on resolveTimelineNavUrl
  - ActivityList row guard extended with mountedness (unmounted detail routes non-interactive)
affects: [66-overview-error-contract-timeline-cross-links validation, timeline cross-links]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Suppression-as-absence: navUrl === null → View-details affordance + handler not rendered (no disabled/dead element)'
    - 'All three navigation_url consumers share one mounted-route gate (resolveTimelineNavUrl)'

key-files:
  created:
    - frontend/src/components/timeline/__tests__/TimelineEventCard.test.tsx
  modified:
    - frontend/src/components/timeline/TimelineEventCard.tsx
    - frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx
    - frontend/src/components/activity-feed/ActivityList.tsx
    - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx

key-decisions:
  - 'Computed navUrl once per card via resolveTimelineNavUrl; gated BOTH handleNavigate and the render on navUrl !== null; navigate the resolved url, never the raw metadata value'
  - 'EnhancedVerticalTimelineCard kept its setIsActive(false) in handleNavigate (modal close on navigate) while swapping the URL source'
  - 'ActivityList swapped the inline R-05 safeNavUrl computation for the shared guard (strict superset); preserved the rationale comment, repointed it to lib/timeline-navigation.ts; existing Test 6/7 fixtures already mounted/rejected so no retargeting was needed — added Test 8 for the new mountedness rejections'

requirements-completed: [OVRERR-02]

# Metrics
duration: 3min
completed: 2026-06-13
---

# Phase 66 Plan 07: Gate navigation_url consumers on the mounted-route guard Summary

**All three `navigation_url` consumers (TimelineEventCard, EnhancedVerticalTimelineCard, ActivityList) now gate on the shared `resolveTimelineNavUrl` guard — the timeline cards suppress the View-details affordance entirely (no disabled button, no dead chevron) for unmounted/unsafe URLs, and ActivityList rows extend their R-05 guard with mountedness so stale `activity_stream` metadata can no longer dead-end on the notFound page.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-13T02:11:56+03:00 (Task 1 RED commit)
- **Completed:** 2026-06-13T02:14:42+03:00 (Task 2 GREEN commit)
- **Tasks:** 2 (Task 1 TDD RED-first, Task 2 GREEN)
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- **Task 1 (RED):** Authored the suppression/render matrix test for both timeline cards (`TimelineEventCard.test.tsx`, the 66-VALIDATION Wave-0 file). Mocked `@tanstack/react-router` `useNavigate`, `@/hooks/useDirection` (LTR), `react-vertical-timeline-component` (to surface `onTimelineElementClick` so the modal actions container is reachable), and `@/hooks/useOutsideClick`. Confirmed RED: the 3 unmounted-detail-route suppression cases (`/calendar/<uuid>`, `/mous/<uuid>` on TimelineEventCard; `/mous/<uuid>` on EnhancedVerticalTimelineCard) failed because the cards trusted any truthy URL.
- **Task 2 (GREEN):** Gated all three consumers on `resolveTimelineNavUrl`:
  - `TimelineEventCard`: compute `navUrl` once; `handleNavigate` navigates `navUrl` only when `!== null`; the render gate became `{navUrl !== null && (…)}`. No styling/layout change — the affordance is absent, not disabled (UI-SPEC §3).
  - `EnhancedVerticalTimelineCard`: identical transformation; kept `setIsActive(false)` in `handleNavigate`.
  - `ActivityList`: replaced the inline `safeNavUrl` computation with the guard call; preserved the R-05/WR-01 rationale comment and repointed it to `lib/timeline-navigation.ts`; everything downstream (interactive flag, onClick/onKeyDown, role/tabIndex omission) is byte-identical.
  - Added `ActivityList` Test 8: unmounted detail routes (`/calendar/<uuid>`, `/mous/<uuid>`) render fully non-interactive.

## Task Commits

Each task committed atomically (TDD: test → feat):

1. **Task 1 RED — suppression matrix** - `90cdab6e` (test)
2. **Task 2 GREEN — gate all three consumers** - `16acd1dd` (feat)

## Files Created/Modified

- `frontend/src/components/timeline/__tests__/TimelineEventCard.test.tsx` (created) — 9-case suppression/render matrix for both timeline cards
- `frontend/src/components/timeline/TimelineEventCard.tsx` — import guard; `navUrl` computed once; handler + render gated on `navUrl !== null`
- `frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx` — same gating; `setIsActive(false)` preserved in `handleNavigate`
- `frontend/src/components/activity-feed/ActivityList.tsx` — inline `safeNavUrl` replaced by `resolveTimelineNavUrl`; comment repointed to the shared lib
- `frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx` — added Test 8 mountedness rejection cases; Test 6/7 unmodified

## Decisions Made

- The existing `ActivityList` Test 6 fixture already uses a mounted path (`/tasks/abc-123`) and the Test 7 dangerous fixtures (`https://`, `//`, `javascript:`, `''`) all still resolve to `null` under the guard, so NO existing-fixture retargeting was required — the plan's "retarget any non-mounted accepted fixture" step was a no-op here. Added Test 8 for the new mountedness rejections rather than mutating Test 7.
- Mocked `react-vertical-timeline-component` in the test so the modal-bound actions container could be reached via `onTimelineElementClick`, avoiding the real library's layout effects.

## Deviations from Plan

None - plan executed exactly as written. The two interfaces-block transformations and the ActivityList guard swap were applied verbatim.

## Issues Encountered

- The worktree shipped without `node_modules`; ran `pnpm install --frozen-lockfile` at the worktree root (lockfile restore only, no new packages) before executing — resolved, exit 0.
- `frontend/src/routeTree.gen.ts` showed as modified (generated file, touched by tooling) but is outside this plan's `files_modified`. Left it unstaged and un-reverted per the worktree rule against `git checkout`/staging generated files I did not author.

## Known Stubs

None. The suppressed (absent) affordances are the designed suppression-as-absence behavior (binding UI-SPEC §3), not unwired stubs.

## Threat Flags

None. The change tightens the existing open-redirect surface (T-66-14 mitigate: every R-05/WR-01 rejection preserved — Test 7 green unmodified — plus mountedness; T-66-15 mitigate: dishonest dead affordances removed, pinned by RED-first render tests). No new endpoints, auth paths, or schema surface.

## Verification

- `pnpm exec vitest run` on the two touched test files + the 66-02 guard matrix: **42/42 pass** (9 timeline suppression/render + 8 ActivityList incl. new Test 8 + 25 guard matrix).
- `pnpm type-check`: **exit 0**.
- Consumer grep: all 3 of TimelineEventCard / EnhancedVerticalTimelineCard / ActivityList import and gate on `resolveTimelineNavUrl` (`wc -l` = 3).
- No raw `to: event.metadata.navigation_url` remains in either timeline card (grep clean).
- Pre-commit `pnpm build` passed on every commit (hooks not bypassed).

## Self-Check: PASSED

- `frontend/src/components/timeline/__tests__/TimelineEventCard.test.tsx` exists on disk.
- All modified source/test files present and committed.
- Both task commits (`90cdab6e`, `16acd1dd`) present in git history.

---

_Phase: 66-overview-error-contract-timeline-cross-links_
_Plan: 07_
_Completed: 2026-06-13_
