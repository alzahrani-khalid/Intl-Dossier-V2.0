---
phase: 06-architecture-consolidation
plan: 04
subsystem: api
tags: [repository-pattern, tanstack-query, domain-driven, api-client, hooks-migration]

requires:
  - phase: 06-01
    provides: shared apiClient (apiGet/apiPost/apiPut/apiDelete/apiPatch) and canonical domain pattern
provides:
  - 9 complete cross-cutting domain directories with repository + hooks + types + barrel exports
  - 33+ hooks migrated from raw fetch() to domain repositories
  - backward-compatible re-exports at old frontend/src/hooks/ paths
affects: [06-05, all-future-frontend-work]

tech-stack:
  added: []
  patterns: [domain-repository-pattern-for-cross-cutting-concerns, sse-streaming-repo-pattern]

key-files:
  created:
    - frontend/src/domains/ai/repositories/ai.repository.ts
    - frontend/src/domains/search/repositories/search.repository.ts
    - frontend/src/domains/intake/repositories/intake.repository.ts
    - frontend/src/domains/audit/repositories/audit.repository.ts
    - frontend/src/domains/analytics/repositories/analytics.repository.ts
    - frontend/src/domains/briefings/repositories/briefings.repository.ts
    - frontend/src/domains/tags/repositories/tags.repository.ts
    - frontend/src/domains/import/repositories/import.repository.ts
    - frontend/src/domains/misc/repositories/misc.repository.ts
  modified:
    - frontend/src/hooks/useAIChat.ts
    - frontend/src/hooks/useAdvancedSearch.ts
    - frontend/src/hooks/useIntakeApi.ts
    - frontend/src/hooks/useRetentionPolicies.ts
    - frontend/src/hooks/useWebhooks.ts
    - frontend/src/hooks/useComments.ts

key-decisions:
  - 'AI domain repos use raw fetch for SSE streaming endpoints, returning Response objects for hooks to process; simple GET uses apiGet with baseUrl express'
  - 'All 33 original hook files replaced with thin re-export shims pointing to @/domains/* for backward compatibility'
  - "Misc domain serves as catch-all for cross-cutting hooks that don't fit other domain boundaries (comments, stakeholders, reports, scenarios, onboarding, etc.)"

patterns-established:
  - 'SSE streaming repo pattern: repo returns raw Response, hook handles stream reading'
  - 'Cross-cutting domain barrel: index.ts re-exports hooks, repo namespace, and types'

requirements-completed: [ARCH-02, ARCH-04]

duration: 18min
completed: 2026-03-26
---

# Phase 06 Plan 04: Cross-Cutting Domain Migration Summary

**33+ hooks across 9 domains (AI, search, intake, audit, analytics, briefings, tags, import, misc) migrated to repository pattern with zero raw fetch() in hooks**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-26T09:06:01Z
- **Completed:** 2026-03-26T09:24:00Z
- **Tasks:** 2
- **Files modified:** 93

## Accomplishments

- Created 9 complete domain directories (ai, search, intake, audit, analytics, briefings, tags, import, misc) each with repository, hooks, types, and barrel exports
- Migrated 33+ hooks from raw fetch() to domain repositories using shared apiClient
- AI domain correctly targets Express backend (baseUrl: 'express') for chat, field assist, and brief generation
- All old import paths preserved via backward-compatible re-export shims

## Task Commits

1. **Task 1: Migrate AI, search, intake, audit, analytics domains** - `d5707d6f` (feat)
2. **Task 2: Migrate briefings, tags, import, misc domains** - `289f34cf` (feat)

## Files Created/Modified

**9 Repository files:**

- `frontend/src/domains/ai/repositories/ai.repository.ts` - AI API ops with Express backend targeting
- `frontend/src/domains/search/repositories/search.repository.ts` - Search API ops (advanced, enhanced, templates)
- `frontend/src/domains/intake/repositories/intake.repository.ts` - Intake ticket and queue API ops
- `frontend/src/domains/audit/repositories/audit.repository.ts` - Audit logs, compliance, retention ops
- `frontend/src/domains/analytics/repositories/analytics.repository.ts` - Dashboard and benchmarks
- `frontend/src/domains/briefings/repositories/briefings.repository.ts` - Briefing packs and calendar sync
- `frontend/src/domains/tags/repositories/tags.repository.ts` - Tag hierarchy, templates, suggestions
- `frontend/src/domains/import/repositories/import.repository.ts` - Import, webhooks, availability polling
- `frontend/src/domains/misc/repositories/misc.repository.ts` - Comments, stakeholders, reports, scenarios, etc.

**33+ Domain hook files** across 9 directories
**33 Re-export shims** at `frontend/src/hooks/`
**9 Barrel exports** at `frontend/src/domains/*/index.ts`
**9 Type files** at `frontend/src/domains/*/types/index.ts`

## Decisions Made

- AI domain repos use raw fetch for SSE streaming endpoints (returning Response objects) since apiPost cannot handle streaming; simple GET endpoints use apiGet with `baseUrl: 'express'`
- All 33 original hook files replaced with thin re-export shims for backward compatibility
- Misc domain acts as catch-all for hooks without clear domain affinity (comments, stakeholders, reports, scenarios, onboarding, progressive disclosure, pull-to-refresh)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all hooks are fully wired to their repository functions.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ARCH-02 fully satisfied: all 33+ cross-cutting hooks migrated
- Combined with Plans 01-03: ALL raw fetch() hooks in the codebase eliminated
- Ready for Plan 05 (final consolidation and cleanup)

---

_Phase: 06-architecture-consolidation_
_Completed: 2026-03-26_
