---
phase: 09-lifecycle-engine
plan: 01
subsystem: database, types, i18n
tags: [postgresql, typescript, i18n, lifecycle, engagement, supabase, rls]

# Dependency graph
requires: []
provides:
  - lifecycle_stage column on engagement_dossiers with 6-value CHECK and intake default
  - lifecycle_transitions audit table with RLS, indexes, and duration trigger
  - forum_session engagement type and parent_forum_id column
  - optional lifecycle_stage on tasks table for work items
  - LifecycleStage type and all shared lifecycle types in lifecycle.types.ts
  - bilingual lifecycle i18n namespace (en/ar)
  - 5 Wave 0 test stub files for Plans 02-05
affects: [09-02, 09-03, 09-04, 09-05, operations-hub, engagement-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lifecycle_transitions audit table with BEFORE INSERT trigger for duration computation"
    - "RLS policies joining through engagement_dossiers -> dossiers for org-based access"
    - "Static i18n import pattern for lifecycle namespace"

key-files:
  created:
    - supabase/migrations/20260329000001_add_lifecycle_stage.sql
    - supabase/migrations/20260329000002_add_forum_session_support.sql
    - supabase/migrations/20260329000003_add_work_item_lifecycle_stage.sql
    - frontend/src/types/lifecycle.types.ts
    - frontend/src/i18n/en/lifecycle.json
    - frontend/src/i18n/ar/lifecycle.json
    - tests/unit/services/LifecycleTransition.test.ts
    - tests/integration/lifecycle-stage.test.ts
    - tests/integration/intake-promotion.test.ts
    - tests/unit/services/WorkItemLifecycleStage.test.ts
    - tests/integration/forum-session-lifecycle.test.ts
  modified:
    - frontend/src/types/engagement.types.ts
    - frontend/src/types/work-item.types.ts
    - frontend/src/i18n/index.ts

key-decisions:
  - "Used DO block with pg_constraint query to dynamically find engagement_type CHECK constraint name for safe migration"
  - "Placed lifecycle i18n files in frontend/src/i18n/ (static import pattern) and mirrored to frontend/public/locales/ for consistency"
  - "RLS policies on lifecycle_transitions join through engagement_dossiers -> dossiers for org-based access, matching engagement_participants pattern"

patterns-established:
  - "Lifecycle stage enum pattern: 6 stages as TEXT with CHECK constraint, not a pg ENUM (easier to extend)"
  - "Duration trigger pattern: BEFORE INSERT computes seconds between current and previous transition"

requirements-completed: [LIFE-01, LIFE-02, LIFE-03, LIFE-04, LIFE-05, LIFE-06]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 09 Plan 01: Schema Foundation Summary

**3 SQL migrations for lifecycle_stage column, transitions audit table, and forum_session type with shared TypeScript types and bilingual i18n labels**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T05:16:52Z
- **Completed:** 2026-03-30T05:24:35Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Created 3 SQL migrations: lifecycle_stage on engagement_dossiers, lifecycle_transitions table with RLS/trigger, forum_session type with parent_forum_id, and optional lifecycle_stage on tasks
- Exported LifecycleStage, LifecycleTransition, IntakePromotionRequest, ForumSessionCreateRequest types from lifecycle.types.ts
- Added forum_session to EngagementType union with bilingual labels
- Registered lifecycle i18n namespace with full copywriting contract coverage
- Created 5 test stub files with it.todo() placeholders for LIFE-01 through LIFE-06

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations** - `e41671f2` (feat)
2. **Task 2: Frontend types, i18n labels, and test stubs** - `bd392181` (feat)

## Files Created/Modified
- `supabase/migrations/20260329000001_add_lifecycle_stage.sql` - lifecycle_stage column + lifecycle_transitions table + RLS + trigger
- `supabase/migrations/20260329000002_add_forum_session_support.sql` - forum_session type + parent_forum_id column
- `supabase/migrations/20260329000003_add_work_item_lifecycle_stage.sql` - optional lifecycle_stage on tasks
- `frontend/src/types/lifecycle.types.ts` - shared lifecycle type contract
- `frontend/src/types/engagement.types.ts` - added forum_session, lifecycle_stage, parent_forum_id
- `frontend/src/types/work-item.types.ts` - added lifecycle_stage to WorkItem and UnifiedWorkItem
- `frontend/src/i18n/en/lifecycle.json` - English lifecycle UI strings
- `frontend/src/i18n/ar/lifecycle.json` - Arabic lifecycle UI strings
- `frontend/src/i18n/index.ts` - registered lifecycle namespace
- `frontend/public/locales/en/lifecycle.json` - English locale mirror
- `frontend/public/locales/ar/lifecycle.json` - Arabic locale mirror
- `tests/unit/services/LifecycleTransition.test.ts` - LIFE-02/03 test stubs
- `tests/integration/lifecycle-stage.test.ts` - LIFE-01 test stubs
- `tests/integration/intake-promotion.test.ts` - LIFE-04 test stubs
- `tests/unit/services/WorkItemLifecycleStage.test.ts` - LIFE-05 test stubs
- `tests/integration/forum-session-lifecycle.test.ts` - LIFE-06 test stubs

## Decisions Made
- Used DO block with pg_constraint query to dynamically find engagement_type CHECK constraint name, avoiding hardcoded constraint names that may differ between environments
- Used TEXT with CHECK constraint instead of PostgreSQL ENUM for lifecycle_stage (easier to extend without migration)
- RLS policies join through engagement_dossiers -> dossiers for org-based access check, consistent with existing engagement_participants pattern
- Placed i18n files in both src/i18n/ (static import) and public/locales/ (plan compliance)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] i18n locale file location corrected**
- **Found during:** Task 2 (i18n labels)
- **Issue:** Plan specified `frontend/public/locales/` but the i18n config uses static imports from `frontend/src/i18n/`
- **Fix:** Created files in `frontend/src/i18n/en/` and `frontend/src/i18n/ar/` (where the config imports from), and mirrored to `frontend/public/locales/` for plan compliance
- **Files modified:** frontend/src/i18n/en/lifecycle.json, frontend/src/i18n/ar/lifecycle.json, frontend/public/locales/en/lifecycle.json, frontend/public/locales/ar/lifecycle.json
- **Verification:** i18n config imports resolve correctly
- **Committed in:** bd392181

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Locale files placed in correct location for the existing i18n architecture. No scope creep.

## Issues Encountered
- Supabase MCP tool not available in worktree session; migrations created as SQL files but not applied to remote DB. Migrations should be applied via `supabase db push` from the main repo or via Supabase MCP in a subsequent step.

## Known Stubs
None - all files contain their intended content. Test files contain it.todo() placeholders by design (Wave 0 stubs for Plans 02-05 to fill).

## User Setup Required
Migrations need to be applied to Supabase. Run from main repo: `supabase db push --linked`

## Next Phase Readiness
- Schema foundation complete: all types, migrations, and i18n labels ready
- Plans 02-05 can build against lifecycle.types.ts contract
- Test stubs ready for implementation in subsequent plans
- Migrations must be applied to Supabase before integration testing

---
*Phase: 09-lifecycle-engine*
*Completed: 2026-03-30*
