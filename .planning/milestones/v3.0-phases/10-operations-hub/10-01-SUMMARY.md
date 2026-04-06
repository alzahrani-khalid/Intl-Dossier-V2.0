---
phase: 10-operations-hub
plan: 01
subsystem: database, api, ui
tags: [supabase-rpc, tanstack-query, typescript, i18n, dashboard, lifecycle]

requires:
  - phase: 09-lifecycle-engine
    provides: lifecycle_stage column, lifecycle_transitions table, engagement_dossiers table
provides:
  - 4 Supabase RPC functions for Operations Hub dashboard data
  - TypeScript type definitions for all dashboard zones
  - Domain repository with typed Supabase RPC wrappers
  - 7 TanStack Query hooks with staleTime tiers
  - Role preference system with localStorage persistence
  - Dashboard scope hook for role-based data filtering
  - Bilingual i18n translations (40+ keys) for all UI copy
affects: [10-02-PLAN, 10-03-PLAN, 10-04-PLAN]

tech-stack:
  added: [date-fns (isToday, isTomorrow, isThisWeek)]
  patterns: [operations-hub domain pattern, query key factory, role-adaptive scope filtering]

key-files:
  created:
    - supabase/migrations/20260330000001_operations_hub_rpcs.sql
    - frontend/src/domains/operations-hub/types/operations-hub.types.ts
    - frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts
    - frontend/src/domains/operations-hub/hooks/useAttentionItems.ts
    - frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts
    - frontend/src/domains/operations-hub/hooks/useEngagementStages.ts
    - frontend/src/domains/operations-hub/hooks/useDashboardStats.ts
    - frontend/src/domains/operations-hub/hooks/useActivityFeed.ts
    - frontend/src/domains/operations-hub/hooks/useRolePreference.ts
    - frontend/src/domains/operations-hub/hooks/useDashboardScope.ts
    - frontend/public/locales/en/operations-hub.json
    - frontend/public/locales/ar/operations-hub.json
  modified: []

key-decisions:
  - "Used SECURITY DEFINER on all RPC functions for consistent access control"
  - "Stalled engagements detected via LATERAL join on lifecycle_transitions for most recent transition"
  - "Officer scope filters by dossier_members for engagements (no direct assignee_id on engagements)"
  - "Query key factory centralized in useAttentionItems.ts, shared across all hooks"

patterns-established:
  - "Operations Hub domain: types -> repository -> hooks -> components hierarchy"
  - "Dashboard scope hook as single source of truth for userId filtering across all zones"
  - "staleTime tiers: 30s (attention), 2min (activity), 5min (timeline/stages/stats)"

requirements-completed: [OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-07]

duration: 6min
completed: 2026-03-31
---

# Phase 10 Plan 01: Operations Hub Data Foundation Summary

**4 Supabase RPC functions, 12 TypeScript files, and bilingual i18n providing the complete data layer for the Operations Hub dashboard with role-adaptive scope filtering**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-31T01:06:22Z
- **Completed:** 2026-03-31T01:12:07Z
- **Tasks:** 2
- **Files created:** 12

## Accomplishments
- 4 Supabase RPC functions: get_attention_items (overdue + due-soon + SLA + stalled), get_upcoming_events, get_engagement_stage_counts, get_dashboard_stats
- Complete TypeScript type system covering all 5 dashboard zones with DashboardRole, ZONE_ORDER, and ROLE_MAP constants
- 7 TanStack Query hooks with D-19 staleTime tiers and query key factory pattern
- Role preference hook auto-detects from auth store with localStorage override; dashboard scope hook provides consistent userId filtering per D-11

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase RPC migrations + TypeScript types + i18n translations** - `5fb5a9c4` (feat)
2. **Task 2: Domain repository + TanStack Query hooks + role preference + dashboard scope** - `da79a219` (feat)

## Files Created/Modified
- `supabase/migrations/20260330000001_operations_hub_rpcs.sql` - 4 RPC functions for dashboard data
- `frontend/src/domains/operations-hub/types/operations-hub.types.ts` - All dashboard type definitions
- `frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts` - Supabase RPC wrappers
- `frontend/src/domains/operations-hub/hooks/useAttentionItems.ts` - Attention zone hook + query key factory
- `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` - Timeline zone hook + day grouping
- `frontend/src/domains/operations-hub/hooks/useEngagementStages.ts` - Engagement stages hook
- `frontend/src/domains/operations-hub/hooks/useDashboardStats.ts` - Quick stats hook
- `frontend/src/domains/operations-hub/hooks/useActivityFeed.ts` - Activity feed hook
- `frontend/src/domains/operations-hub/hooks/useRolePreference.ts` - Role detection + localStorage
- `frontend/src/domains/operations-hub/hooks/useDashboardScope.ts` - Role-based userId filtering
- `frontend/public/locales/en/operations-hub.json` - English i18n (40+ keys)
- `frontend/public/locales/ar/operations-hub.json` - Arabic i18n (40+ keys)

## Decisions Made
- Used SECURITY DEFINER on all RPC functions for consistent access control through RLS
- Stalled engagement detection uses LATERAL join on lifecycle_transitions for most recent transition date, checking 14-day threshold per D-15
- Officer scope for engagements filters via dossier_members join (engagements don't have a direct assignee_id)
- Centralized query key factory in useAttentionItems.ts to ensure consistent cache keys across all hooks

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data functions are wired to real Supabase RPC calls and table queries.

## User Setup Required

None - no external service configuration required. RPC functions need to be applied via Supabase migration.

## Next Phase Readiness
- All types, hooks, and repository functions ready for Plan 02 (zone UI components)
- Zone components can import types and hooks directly from the operations-hub domain
- i18n namespace loaded for all UI copy needs

## Self-Check: PASSED

All 12 created files verified on disk. Both task commits (5fb5a9c4, da79a219) found in git log.

---
*Phase: 10-operations-hub*
*Completed: 2026-03-31*
