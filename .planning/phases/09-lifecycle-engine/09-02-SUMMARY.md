---
phase: 09-lifecycle-engine
plan: 02
subsystem: api
tags: [edge-function, tanstack-query, lifecycle, supabase, hooks, repository-pattern]

requires:
  - phase: 09-01
    provides: lifecycle_stage column, lifecycle_transitions table, forum session support, lifecycle types

provides:
  - Lifecycle transition API endpoint (POST /engagement-dossiers/:id/lifecycle)
  - Lifecycle history API endpoint (GET /engagement-dossiers/:id/lifecycle)
  - Intake promotion API endpoint (POST /engagement-dossiers/promote-intake)
  - Forum session creation via existing create endpoint with parent_forum_id
  - Forum session listing via parent_forum_id query parameter
  - 5 repository functions for lifecycle operations
  - 5 TanStack Query hooks for UI consumption

affects: [09-03, 09-04, 09-05]

tech-stack:
  added: []
  patterns:
    - "Sub-resource routing pattern extended for lifecycle in Edge Function"
    - "Repository functions wrap Edge Function calls with typed responses"
    - "TanStack Query hooks with explicit return types and cache invalidation"

key-files:
  created:
    - frontend/src/domains/engagements/hooks/useLifecycle.ts
  modified:
    - supabase/functions/engagement-dossiers/index.ts
    - frontend/src/domains/engagements/repositories/engagements.repository.ts
    - frontend/src/domains/engagements/index.ts

key-decisions:
  - "Forum sessions queried via parent_forum_id filter on listEngagements rather than a separate endpoint"
  - "Intake promotion sets lifecycle_stage to 'intake' and records initial transition with null from_stage"
  - "Any-to-any stage transition allowed per D-02/D-03 decisions -- no directional validation"

patterns-established:
  - "lifecycleKeys query key factory for cache management"
  - "handleLifecycle sub-resource handler pattern matching participants/agenda"

requirements-completed: [LIFE-02, LIFE-03, LIFE-04, LIFE-06]

duration: 6min
completed: 2026-03-30
---

# Phase 9 Plan 2: Lifecycle API & Data Layer Summary

**Edge Function endpoints for lifecycle transitions, intake promotion, and forum sessions, plus 5 repository functions and 5 TanStack Query hooks for UI consumption**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-30T05:31:20Z
- **Completed:** 2026-03-30T05:37:20Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended engagement-dossiers Edge Function with lifecycle sub-resource (GET/POST), intake promotion route, and forum session support (parent_forum_id in create/list)
- Created 5 repository functions (transitionLifecycleStage, getLifecycleHistory, promoteIntakeToEngagement, createForumSession, getForumSessions) following existing apiClient patterns
- Created 5 TanStack Query hooks (useLifecycleTransition, useLifecycleHistory, usePromoteIntake, useCreateForumSession, useForumSessions) with proper cache invalidation and explicit return types

## Task Commits

Each task was committed atomically:

1. **Task 1: Edge Function -- lifecycle, intake promotion, forum session endpoints** - `4f7a035e` (feat)
2. **Task 2: Frontend repository functions and TanStack Query hooks** - `bba010c6` (feat)

## Files Created/Modified
- `supabase/functions/engagement-dossiers/index.ts` - Added handleLifecycle, handlePromoteIntake, LifecycleStage type, forum_session type, parent_forum_id filter
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` - Added 5 lifecycle repository functions
- `frontend/src/domains/engagements/hooks/useLifecycle.ts` - New file with 5 TanStack Query hooks and lifecycleKeys factory
- `frontend/src/domains/engagements/index.ts` - Re-exports lifecycle hooks from domain barrel

## Decisions Made
- Forum sessions are queried via a `parent_forum_id` query parameter on the existing list endpoint rather than creating a separate sub-resource, keeping the API surface minimal
- Intake promotion creates an initial lifecycle transition record with `from_stage: null` to establish the audit trail from creation
- The `createForumSession` repository function delegates to `createEngagement` internally, mapping ForumSessionCreateRequest fields to EngagementCreate format
- Lifecycle history enriched with user names by joining profiles table after fetching transitions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functions are fully wired to API endpoints.

## Next Phase Readiness
- All 5 API endpoints are operational and ready for UI consumption by Plans 03-05
- useLifecycleTransition and useLifecycleHistory are ready for the LifecycleBar component (Plan 03)
- usePromoteIntake is ready for the intake promotion flow (Plan 04)
- useCreateForumSession and useForumSessions are ready for the forum session UI (Plan 05)

---
*Phase: 09-lifecycle-engine*
*Completed: 2026-03-30*
