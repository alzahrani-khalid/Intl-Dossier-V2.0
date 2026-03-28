---
phase: 06-architecture-consolidation
plan: 03
subsystem: frontend-architecture
tags: [repository-pattern, tanstack-query, domain-driven, api-client, hooks]

requires:
  - phase: 06-01
    provides: shared apiClient, dossiers domain pattern reference

provides:
  - work-items domain with repository + 4 hook files
  - relationships domain with repository + 2 hook files
  - documents domain with repository + 2 hook files
  - persons domain with repository + 1 hook file (14 exported hooks)
  - topics domain with repository + 1 hook file
  - 10 backward-compat re-export files in src/hooks/

affects: [06-04, 06-05]

tech-stack:
  added: []
  patterns:
    - 'Domain repository pattern for 5 additional domains'
    - 'Specialized fetch patterns preserved where apiClient insufficient (SLA .data unwrap, Supabase joined queries, graph traversal auth)'

key-files:
  created:
    - frontend/src/domains/work-items/repositories/work-items.repository.ts
    - frontend/src/domains/work-items/index.ts
    - frontend/src/domains/relationships/repositories/relationships.repository.ts
    - frontend/src/domains/relationships/index.ts
    - frontend/src/domains/documents/repositories/documents.repository.ts
    - frontend/src/domains/documents/index.ts
    - frontend/src/domains/persons/repositories/persons.repository.ts
    - frontend/src/domains/persons/index.ts
    - frontend/src/domains/topics/repositories/topics.repository.ts
    - frontend/src/domains/topics/index.ts
  modified:
    - frontend/src/hooks/useWorkItemDossierLinks.ts
    - frontend/src/hooks/useWorkflowAutomation.ts
    - frontend/src/hooks/useSLAMonitoring.ts
    - frontend/src/hooks/useUpdateSuggestionAction.ts
    - frontend/src/hooks/useRelationships.ts
    - frontend/src/hooks/useCreateRelationship.ts
    - frontend/src/hooks/useDocuments.ts
    - frontend/src/hooks/useExportData.ts
    - frontend/src/hooks/usePersons.ts
    - frontend/src/hooks/useTopics.ts

key-decisions:
  - 'SLA monitoring hooks keep custom fetch helpers (not apiClient) because they unwrap .data from response and have specialized auth checks'
  - 'Work item dossier links hook uses Supabase client directly for joined FK queries not suited for REST'
  - 'Graph traversal hook retains custom fetch with RelationshipAPIError for typed error codes'
  - 'Relationships repository delegates to existing relationship-api service (already well-structured)'

patterns-established:
  - 'Domain barrel exports all hooks, repo namespace, and types via single index.ts'
  - 'Re-export files in src/hooks/ marked @deprecated pointing to @/domains/*'

requirements-completed: [ARCH-02, ARCH-04]

duration: 8min
completed: 2026-03-26
---

# Phase 06 Plan 03: Minor Domains Migration Summary

**5 domains (work-items, relationships, documents, persons, topics) with 10 hook files migrated to repository pattern using shared apiClient**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T09:05:57Z
- **Completed:** 2026-03-26T09:13:57Z
- **Tasks:** 2
- **Files modified:** 35

## Accomplishments

- Migrated 5 complete domain directories with repos, hooks, types, and barrel exports
- Workflow automation and suggestion action hooks now route through repository with apiClient (eliminated duplicate auth headers)
- All 10 re-export files in src/hooks/ provide backward compatibility while pointing to canonical @/domains/\* paths
- TypeScript compilation clean (only pre-existing unused-var warnings in unrelated files)

## Task Commits

1. **Task 1: Migrate work-items (4) and relationships (2) domains** - `8f70af93` (feat)
2. **Task 2: Migrate documents (2), persons (1), and topics (1) domains** - `2ff65baa` (feat)

## Files Created/Modified

### Created (30 files across 5 domains)

- `frontend/src/domains/work-items/` - Repository with workflow rules, executions, SLA, suggestions; 4 hook files; types; barrel
- `frontend/src/domains/relationships/` - Repository delegating to relationship-api service + create endpoint; 2 hook files; types; barrel
- `frontend/src/domains/documents/` - Repository for documents-get and data-export; 2 hook files; types; barrel
- `frontend/src/domains/persons/` - Repository for full person CRUD, roles, affiliations, relationships, network; 1 hook file (14 exports); types; barrel
- `frontend/src/domains/topics/` - Repository for subtopics; 1 hook file; types; barrel

### Modified (10 re-export files)

- `frontend/src/hooks/useWorkItemDossierLinks.ts` - Re-exports from @/domains/work-items
- `frontend/src/hooks/useWorkflowAutomation.ts` - Re-exports from @/domains/work-items
- `frontend/src/hooks/useSLAMonitoring.ts` - Re-exports from @/domains/work-items
- `frontend/src/hooks/useUpdateSuggestionAction.ts` - Re-exports from @/domains/work-items
- `frontend/src/hooks/useRelationships.ts` - Re-exports from @/domains/relationships
- `frontend/src/hooks/useCreateRelationship.ts` - Re-exports from @/domains/relationships
- `frontend/src/hooks/useDocuments.ts` - Re-exports from @/domains/documents
- `frontend/src/hooks/useExportData.ts` - Re-exports from @/domains/documents
- `frontend/src/hooks/usePersons.ts` - Re-exports from @/domains/persons
- `frontend/src/hooks/useTopics.ts` - Re-exports from @/domains/topics

## Decisions Made

1. **SLA hooks retain custom fetch** - The SLA Edge Function returns `{ data: T }` wrapper requiring `.data` unwrap, which apiClient's `handleResponse<T>` doesn't support. Kept specialized fetch helpers.
2. **Work item dossier links uses Supabase directly** - The hook queries `work_item_dossiers` with a joined FK select on `dossiers` table, which is a Supabase PostgREST pattern not expressible via REST API.
3. **Relationships repo delegates to existing service** - `@/services/relationship-api` already follows clean function exports with proper error handling, so the repository re-exports rather than duplicating.
4. **Graph traversal keeps custom fetch** - Uses `RelationshipAPIError` class with error codes, which requires custom error parsing not available in apiClient.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all hooks are fully wired to their API endpoints.

## Next Phase Readiness

- 5 domains complete, ready for Plan 04 (engagements migration) and Plan 05 (cleanup)
- All backward-compat re-exports ensure zero breakage for existing consumers

---

_Phase: 06-architecture-consolidation_
_Completed: 2026-03-26_
