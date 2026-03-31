---
phase: 10-operations-hub
plan: 04
subsystem: ui, realtime
tags: [supabase-realtime, cleanup, dead-code-removal, dashboard, attention-zone]

requires:
  - phase: 10-operations-hub
    plan: 01
    provides: TypeScript types, TanStack Query hooks, query key factory
  - phase: 10-operations-hub
    plan: 03
    provides: OperationsHub page assembly, route wiring
provides:
  - Supabase Realtime subscription for Attention zone (tasks + lifecycle_transitions)
  - Old dashboard dead code removed (17 files, 3743 lines)
  - Clean barrel export for new zone components
affects: []

tech-stack:
  added: []
  patterns: [Supabase Realtime postgres_changes with debounced query invalidation]

key-files:
  created:
    - frontend/src/domains/operations-hub/hooks/useAttentionRealtime.ts
  modified:
    - frontend/src/pages/Dashboard/OperationsHub.tsx
    - frontend/src/pages/Dashboard/components/index.ts
    - frontend/src/routes/_protected/dashboard.project-management.tsx
  deleted:
    - frontend/src/pages/Dashboard/DashboardPage.tsx
    - frontend/src/pages/Dashboard/components/ChartDossierDistribution.tsx
    - frontend/src/pages/Dashboard/components/ChartWorkItemTrends.tsx
    - frontend/src/pages/Dashboard/components/DashboardDateRangePicker.tsx
    - frontend/src/pages/Dashboard/components/DashboardExportButton.tsx
    - frontend/src/pages/Dashboard/components/DashboardMetricCards.tsx
    - frontend/src/pages/Dashboard/components/DossierSuccessMetrics.tsx
    - frontend/src/pages/Dashboard/components/RecentDossiersTable.tsx
    - frontend/src/pages/Dashboard/components/StatCard.tsx
    - frontend/src/pages/Dashboard/components/UpcomingEvents.tsx
    - frontend/src/services/dossier-dashboard.service.ts
    - frontend/src/hooks/useDossierDashboard.ts
    - frontend/src/types/dossier-dashboard.types.ts
    - frontend/src/components/dashboard/DossierQuickStatsCard.tsx
    - frontend/src/components/dashboard/MyDossiersSection.tsx
    - frontend/src/components/dashboard/PendingWorkByDossier.tsx
    - frontend/src/components/dashboard/RecentDossierActivity.tsx
    - frontend/src/components/dashboard/index.ts

key-decisions:
  - "Followed useUnifiedWorkRealtime pattern with 1-second debounce for attention zone"
  - "Redirected legacy project-management dashboard route to Operations Hub instead of deleting (avoids 404s)"

patterns-established:
  - "Attention zone realtime: subscribe to tasks + lifecycle_transitions, debounce invalidation to operationsHubKeys.attention"

requirements-completed: [OPS-01, OPS-06]

duration: 6min
completed: 2026-03-31
---

# Phase 10 Plan 04: Realtime Subscriptions + Old Dashboard Cleanup Summary

**Supabase Realtime subscription for Attention zone on tasks and lifecycle_transitions tables, with 17 old dashboard files deleted (3743 lines of dead code removed)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-31T01:40:23Z
- **Completed:** 2026-03-31T01:46:05Z
- **Tasks:** 1 of 2 (Task 2 is human verification checkpoint)
- **Files created:** 1
- **Files modified:** 3
- **Files deleted:** 18

## Accomplishments

- Created `useAttentionRealtime` hook subscribing to Supabase Realtime `postgres_changes` on `tasks` table (with userId filter for Officer role) and `lifecycle_transitions` table (for stalled engagement detection)
- Wired realtime subscription into OperationsHub page component after useDashboardScope() call
- Deleted 17 old dashboard files: DashboardPage, 10 chart/metric/table components, dossier-dashboard service, hook, and types, plus 5 components/dashboard/ directory files
- Updated barrel export (index.ts) to export only new Phase 10 zone components
- Redirected legacy `/dashboard/project-management` route to Operations Hub (prevents 404 from deleted DashboardPage)
- TypeScript compiles cleanly with no dangling imports from deleted files

## Task Commits

Each task was committed atomically:

1. **Task 1: Attention zone Realtime subscription + old dashboard cleanup** - `59d02131` (feat)
2. **Task 2: Human verification checkpoint** - PENDING (checkpoint:human-verify)

## Files Created/Modified

- `frontend/src/domains/operations-hub/hooks/useAttentionRealtime.ts` - Realtime subscription with 1s debounced invalidation
- `frontend/src/pages/Dashboard/OperationsHub.tsx` - Wired useAttentionRealtime hook
- `frontend/src/pages/Dashboard/components/index.ts` - Updated barrel to new zone components
- `frontend/src/routes/_protected/dashboard.project-management.tsx` - Redirects to /dashboard

## Decisions Made

- Followed useUnifiedWorkRealtime pattern exactly: channel in useRef, debounced invalidation via setTimeout, cleanup with removeChannel
- Used 1-second debounce (vs 300ms in useUnifiedWorkRealtime) since attention items are less latency-sensitive and benefit from batching
- Redirected legacy project-management route to Operations Hub rather than deleting the route file (avoids 404 for bookmarked URLs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed dashboard.project-management.tsx dangling import**
- **Found during:** Task 1 (old dashboard cleanup)
- **Issue:** `dashboard.project-management.tsx` imported `DashboardPage` which was deleted
- **Fix:** Replaced with a `<Navigate to="/dashboard" />` redirect to Operations Hub
- **Files modified:** frontend/src/routes/_protected/dashboard.project-management.tsx
- **Commit:** 59d02131

## Known Stubs

None - the realtime hook is fully wired to Supabase Realtime channels. No placeholder data or hardcoded values.

## User Setup Required

None - Supabase Realtime is already configured for the project. The hook connects automatically when the OperationsHub mounts.

## Checkpoint Status

Task 2 (human verification) is a `checkpoint:human-verify` gate. The automated work is complete. Human verification of the full Operations Hub experience is required before this plan can be marked as fully complete.

## Self-Check: PASSED

All created/modified files verified on disk. Task 1 commit (59d02131) found in git log. No RTL violations detected. No dangling imports from deleted files.

---
*Phase: 10-operations-hub*
*Completed: 2026-03-31 (pending human verification)*
