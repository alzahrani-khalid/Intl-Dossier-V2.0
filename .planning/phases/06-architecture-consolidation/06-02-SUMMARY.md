---
phase: 06-architecture-consolidation
plan: 02
subsystem: api
tags: [tanstack-query, repository-pattern, domain-driven, typescript, api-client]

requires:
  - phase: 06-01
    provides: Shared apiClient and dossiers domain pattern
provides:
  - Positions domain with repository + 10 migrated hooks
  - Engagements domain with repository + 4 migrated hooks (plus CRUD, participants, agenda, kanban, briefs, recommendations)
  - Calendar domain with repository + 5 migrated hooks (plus conflicts, recurring events, notifications)
  - 19 backward-compat re-export files at original hook paths
affects: [06-03, 06-04, 06-05]

tech-stack:
  added: []
  patterns: [domain-repository-pattern, barrel-exports, backward-compat-re-exports]

key-files:
  created:
    - frontend/src/domains/positions/repositories/positions.repository.ts
    - frontend/src/domains/positions/hooks/ (10 files)
    - frontend/src/domains/positions/types/index.ts
    - frontend/src/domains/positions/index.ts
    - frontend/src/domains/engagements/repositories/engagements.repository.ts
    - frontend/src/domains/engagements/hooks/ (4 files)
    - frontend/src/domains/engagements/types/index.ts
    - frontend/src/domains/engagements/index.ts
    - frontend/src/domains/calendar/repositories/calendar.repository.ts
    - frontend/src/domains/calendar/hooks/ (5 files)
    - frontend/src/domains/calendar/types/index.ts
    - frontend/src/domains/calendar/index.ts
  modified:
    - frontend/src/hooks/usePositions.ts (+ 9 more position hooks)
    - frontend/src/hooks/useEngagements.ts (+ 3 more engagement hooks)
    - frontend/src/hooks/useCalendarEvents.ts (+ 4 more calendar hooks)

key-decisions:
  - "Removed ReturnType<typeof useMutation> annotations - let TypeScript infer mutation types to avoid generic mismatch errors"
  - "Used type aliases (PositionType, ConsistencyCheckType) for types used both in re-exports and local interface definitions"
  - "Kept engagement hook file as single large file (matching original structure) rather than splitting CRUD/participants/agenda"

patterns-established:
  - "Domain hooks omit explicit ReturnType on mutations - inferred types prevent useMutation generic variance errors"
  - "Types used in both re-exports and local interfaces need import aliases to avoid TS2304"

requirements-completed: [ARCH-02, ARCH-04]

duration: 16min
completed: 2026-03-26
---

# Phase 06 Plan 02: Core Domain Migration Summary

**Migrated 19 hooks across positions/engagements/calendar to domain repository pattern with zero raw fetch() and full TypeScript compliance**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-26T09:06:32Z
- **Completed:** 2026-03-26T09:22:32Z
- **Tasks:** 2
- **Files modified:** 56

## Accomplishments
- Positions domain: 10 hooks migrated with repository, types barrel, and backward-compat re-exports
- Engagements domain: 4 hooks migrated covering CRUD, kanban, briefs, and recommendations (plus participants/agenda sub-hooks)
- Calendar domain: 5 hooks migrated covering events, conflicts, recurring events, and notifications
- All 19 original hook files replaced with re-exports from `@/domains/*` paths
- Zero raw `fetch()` calls in any domain hook - all route through apiClient

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate positions domain (10 hooks)** - `ff65b461` (feat)
2. **Task 2: Migrate engagements + calendar domains (9 hooks)** - `26399d24` (feat)

## Files Created/Modified

### Positions Domain (13 files created)
- `frontend/src/domains/positions/repositories/positions.repository.ts` - All position API operations via apiClient
- `frontend/src/domains/positions/hooks/usePositions.ts` - Infinite scroll list
- `frontend/src/domains/positions/hooks/usePosition.ts` - Single position fetch
- `frontend/src/domains/positions/hooks/useCreatePosition.ts` - Create mutation
- `frontend/src/domains/positions/hooks/useUpdatePosition.ts` - Update with optimistic updates
- `frontend/src/domains/positions/hooks/useSubmitPosition.ts` - Submit for review
- `frontend/src/domains/positions/hooks/usePositionSuggestions.ts` - AI suggestions
- `frontend/src/domains/positions/hooks/usePositionAnalytics.ts` - Analytics + top positions
- `frontend/src/domains/positions/hooks/usePositionDossierLinks.ts` - Dossier link queries
- `frontend/src/domains/positions/hooks/useCreatePositionDossierLink.ts` - Create link mutation
- `frontend/src/domains/positions/hooks/useDeletePositionDossierLink.ts` - Delete link mutation
- `frontend/src/domains/positions/types/index.ts` - Domain types with re-exports
- `frontend/src/domains/positions/index.ts` - Barrel export

### Engagements Domain (7 files created)
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` - CRUD, participants, agenda, kanban, briefs, recommendations
- `frontend/src/domains/engagements/hooks/useEngagements.ts` - Full CRUD + participants + agenda
- `frontend/src/domains/engagements/hooks/useEngagementKanban.ts` - Kanban board with drag-and-drop
- `frontend/src/domains/engagements/hooks/useEngagementBriefs.ts` - Brief management + AI generation
- `frontend/src/domains/engagements/hooks/useEngagementRecommendations.ts` - AI recommendations
- `frontend/src/domains/engagements/types/index.ts` - Domain types
- `frontend/src/domains/engagements/index.ts` - Barrel export

### Calendar Domain (7 files created)
- `frontend/src/domains/calendar/repositories/calendar.repository.ts` - Events, conflicts, recurring, notifications
- `frontend/src/domains/calendar/hooks/useCalendarEvents.ts` - Event queries
- `frontend/src/domains/calendar/hooks/useCreateCalendarEvent.ts` - Create mutation
- `frontend/src/domains/calendar/hooks/useUpdateCalendarEvent.ts` - Update mutation
- `frontend/src/domains/calendar/hooks/useCalendarConflicts.ts` - Conflict detection + resolution
- `frontend/src/domains/calendar/hooks/useRecurringEvents.ts` - Series management + notifications
- `frontend/src/domains/calendar/types/index.ts` - Domain types
- `frontend/src/domains/calendar/index.ts` - Barrel export

### Re-export Files (19 modified)
- 10 position hooks in `frontend/src/hooks/use*Position*.ts`
- 4 engagement hooks in `frontend/src/hooks/useEngagement*.ts`
- 5 calendar hooks in `frontend/src/hooks/useCalendar*.ts` and `useRecurringEvents.ts`

## Decisions Made
- Removed `ReturnType<typeof useMutation>` annotations on all mutation hooks - TypeScript's `useMutation` generics cause variance errors when explicit return types narrow the generic parameters
- Used import aliases (`PositionType`, `ConsistencyCheckType`) for types that are both re-exported and used in local interface definitions within the same file
- Kept the engagement hooks file as a single large file with all CRUD/participants/agenda hooks (matching original structure) rather than splitting into separate files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript generic variance errors on mutation hooks**
- **Found during:** Task 2 (engagements/calendar migration)
- **Issue:** `ReturnType<typeof useMutation>` resolves to `UseMutationResult<unknown, unknown, unknown, unknown>` which doesn't match specific generic types
- **Fix:** Removed explicit return type annotations on all mutation hooks, removed explicit type annotations on `onSuccess`/`onError` callback parameters
- **Files modified:** All domain hook files with mutations
- **Verification:** `tsc --noEmit` shows zero errors in domain files
- **Committed in:** 26399d24

**2. [Rule 1 - Bug] Fixed TS2304 for types used in re-export + interface context**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** `export type { Position } from '...'` makes the name available for consumers but not usable within the same file's interface definitions
- **Fix:** Added import aliases for types used both in re-exports and local interface definitions
- **Files modified:** frontend/src/domains/positions/types/index.ts
- **Verification:** `tsc --noEmit` passes
- **Committed in:** 26399d24

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the TypeScript fixes documented above.

## Known Stubs
None - all hooks are fully wired to repository functions.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 3 more domains ready for migration in Plans 03-05
- Pattern is well-established and TypeScript-clean
- All backward-compat re-exports ensure zero breaking changes

---
*Phase: 06-architecture-consolidation*
*Completed: 2026-03-26*
