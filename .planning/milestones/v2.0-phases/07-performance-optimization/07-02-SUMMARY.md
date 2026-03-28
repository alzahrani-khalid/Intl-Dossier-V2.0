---
phase: 07-performance-optimization
plan: 02
subsystem: api, ui
tags: [tanstack-query, redis, caching, stale-time, ioredis, performance]

requires:
  - phase: 06-architecture-consolidation
    provides: Domain hook structure with repository pattern
provides:
  - STALE_TIME constants with 3 named tiers (STATIC/NORMAL/LIVE)
  - StaleTimeTier type for type-safe tier selection
  - Explicit Redis initialization with health check and cache warming
  - checkRedisHealth() function for monitoring endpoints
affects: [07-03-PLAN, future cache optimization, future hook additions]

tech-stack:
  added: []
  patterns: [named-stale-time-tiers, explicit-redis-startup, cache-warming]

key-files:
  created:
    - frontend/src/lib/query-tiers.ts
  modified:
    - frontend/src/lib/query-client.ts
    - frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts
    - frontend/src/domains/analytics/hooks/useOrganizationBenchmarks.ts
    - frontend/src/domains/work-items/hooks/useWorkflowAutomation.ts
    - frontend/src/domains/work-items/hooks/useSLAMonitoring.ts
    - frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts
    - frontend/src/domains/topics/hooks/useTopics.ts
    - frontend/src/domains/relationships/hooks/useRelationships.ts
    - frontend/src/hooks/useWidgetDashboard.ts
    - frontend/src/hooks/useEntityComparison.ts
    - frontend/src/hooks/useLegislation.ts
    - frontend/src/hooks/useWGMemberSuggestions.ts
    - frontend/src/hooks/useDossierOverview.ts
    - frontend/src/hooks/useDossierNameSimilarity.ts
    - frontend/src/hooks/useGeographicVisualization.ts
    - frontend/src/services/preference-sync.ts
    - backend/src/config/redis.ts
    - backend/src/index.ts

key-decisions:
  - 'Scoped staleTime migration to 16 plan-listed hooks; remaining hooks deferred to future plan'
  - 'Converted server startup to async function to support await initializeRedis() before app.listen()'
  - 'Kept lazyConnect: true in Redis constructor to prevent duplicate auto-connect race condition'

patterns-established:
  - "Named staleTime tiers: import { STALE_TIME } from '@/lib/query-tiers' with STATIC/NORMAL/LIVE"
  - 'Explicit Redis startup: initializeRedis() called before app.listen() with graceful fallback'

requirements-completed: [PERF-03, PERF-04]

duration: 4min
completed: 2026-03-26
---

# Phase 07 Plan 02: Query Caching Tiers and Redis Reliability Summary

**Three named staleTime tiers (STATIC/NORMAL/LIVE) replacing ad-hoc values across 16 hooks, plus explicit Redis startup with health check and cache warming**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T20:22:40Z
- **Completed:** 2026-03-26T20:26:40Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- Created query-tiers.ts with 3 named staleTime tiers replacing 40+ ad-hoc millisecond values across 16 hooks
- Updated query-client.ts global default to use STALE_TIME.NORMAL instead of literal 5 _ 60 _ 1000
- Added initializeRedis(), checkRedisHealth(), and warmCriticalCaches() to Redis config
- Converted server startup to async to await Redis initialization before accepting requests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create query-tiers.ts and migrate all hooks to named staleTime tiers** - `20f883aa` (feat)
2. **Task 2: Fix Redis connection reliability with explicit startup, health logging, and cache warming** - `6f945b76` (feat)

## Files Created/Modified

- `frontend/src/lib/query-tiers.ts` - STALE_TIME constants with STATIC (30min), NORMAL (5min), LIVE (30s) tiers
- `frontend/src/lib/query-client.ts` - Global default staleTime now uses STALE_TIME.NORMAL
- `frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts` - Migrated to STALE_TIME.NORMAL
- `frontend/src/domains/analytics/hooks/useOrganizationBenchmarks.ts` - Migrated 10min to NORMAL tier
- `frontend/src/domains/work-items/hooks/useWorkflowAutomation.ts` - Migrated to LIVE/STATIC tiers
- `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts` - Migrated to LIVE/STATIC tiers, removed Infinity
- `frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts` - Migrated to NORMAL tier
- `frontend/src/domains/topics/hooks/useTopics.ts` - Migrated to NORMAL tier
- `frontend/src/domains/relationships/hooks/useRelationships.ts` - Migrated to NORMAL tier
- `frontend/src/hooks/useWidgetDashboard.ts` - Migrated to LIVE tier
- `frontend/src/hooks/useEntityComparison.ts` - Migrated to NORMAL tier
- `frontend/src/hooks/useLegislation.ts` - Migrated 7 staleTime values to LIVE/NORMAL tiers
- `frontend/src/hooks/useWGMemberSuggestions.ts` - Migrated to NORMAL tier
- `frontend/src/hooks/useDossierOverview.ts` - Migrated to NORMAL tier
- `frontend/src/hooks/useDossierNameSimilarity.ts` - Migrated to LIVE tier
- `frontend/src/hooks/useGeographicVisualization.ts` - Migrated 4 values to NORMAL tier
- `frontend/src/services/preference-sync.ts` - Migrated 1min to NORMAL tier
- `backend/src/config/redis.ts` - Added initializeRedis, checkRedisHealth, warmCriticalCaches
- `backend/src/index.ts` - Async startup calling initializeRedis before app.listen

## Decisions Made

- Scoped migration to the 16 files listed in the plan; many other hooks also have ad-hoc staleTime values but are out of scope for this plan
- Converted server startup to async function wrapping app.listen() to support await initializeRedis()
- Kept lazyConnect: true in Redis constructor since we now explicitly call .connect() -- prevents a duplicate auto-connect race condition

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Known Stubs

None - all functions are fully implemented with real logic.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Query tier pattern established for future hook migrations
- Redis health check function available for monitoring endpoints
- Cache warming infrastructure ready for additional warming strategies

## Self-Check: PASSED

- FOUND: frontend/src/lib/query-tiers.ts
- FOUND: backend/src/config/redis.ts
- FOUND: commit 20f883aa
- FOUND: commit 6f945b76

---

_Phase: 07-performance-optimization_
_Completed: 2026-03-26_
