---
phase: 25-deferred-audit-fixes
plan: 04
subsystem: ui
tags: [tanstack-router, url-state, pagination, kanban, validateSearch]

requires:
  - phase: 25-02
    provides: query key factories for dossier hooks
provides:
  - URL-driven pagination for all 8 dossier list pages via validateSearch
  - URL-driven kanban filter state with SPA navigation (no full-page reloads)
affects: [dossier-list-pages, kanban-board, url-state-management]

tech-stack:
  added: []
  patterns:
    [
      DossierListSearch interface with validateSearch for typed URL params,
      Route.useSearch/useNavigate for URL state,
    ]

key-files:
  created: []
  modified:
    - frontend/src/routes/_protected/dossiers/countries/index.tsx
    - frontend/src/routes/_protected/dossiers/organizations/index.tsx
    - frontend/src/routes/_protected/dossiers/forums/index.tsx
    - frontend/src/routes/_protected/dossiers/engagements/index.tsx
    - frontend/src/routes/_protected/dossiers/topics/index.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/index.tsx
    - frontend/src/routes/_protected/dossiers/persons/index.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx
    - frontend/src/routes/_protected/kanban.tsx

key-decisions:
  - 'Countries route keeps local useState for search input with debounce effect syncing to URL -- prevents re-render on every keystroke'
  - 'Other dossier routes use direct URL state for search (no debounce) since they do client-side filtering'
  - 'Kanban already had Zod-based validateSearch -- cleaned up window.location.href to use Route.useNavigate()'

patterns-established:
  - 'DossierListSearch interface: { page: number, search?: string } with validateSearch coercion'
  - 'URL pagination pattern: Route.useSearch() + navigate({ search: (prev: T) => ({...prev, page}) })'

requirements-completed: [D-33, D-34]

duration: 9min
completed: 2026-04-12
---

# Phase 25 Plan 04: Dossier List URL State & Kanban Header Summary

**URL-driven pagination for all 8 dossier list pages with validateSearch + kanban SPA navigation cleanup**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-12T19:36:26Z
- **Completed:** 2026-04-12T19:45:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- All 8 dossier list routes now persist page number and search query in URL via ?page=N&search=X
- Invalid URL params safely coerced (page defaults to 1, empty search becomes undefined)
- Kanban route cleaned up: replaced 3 window.location.href calls with Route.useNavigate() for SPA navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add URL pagination state to all 8 dossier list routes** - `57d87baa` (feat)
2. **Task 2: Add URL filter state to kanban route** - `4d5547c9` (feat)

## Files Created/Modified

- `frontend/src/routes/_protected/dossiers/countries/index.tsx` - Added validateSearch, replaced useState pagination with URL state, debounced search syncs to URL
- `frontend/src/routes/_protected/dossiers/organizations/index.tsx` - Added validateSearch, URL-driven page/search params
- `frontend/src/routes/_protected/dossiers/forums/index.tsx` - Added validateSearch, URL-driven page/search params
- `frontend/src/routes/_protected/dossiers/engagements/index.tsx` - Added validateSearch, URL-driven page/search params
- `frontend/src/routes/_protected/dossiers/topics/index.tsx` - Added validateSearch, URL-driven page/search params
- `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` - Added validateSearch, URL-driven page/search params
- `frontend/src/routes/_protected/dossiers/persons/index.tsx` - Added validateSearch, URL-driven page/search params
- `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` - Added validateSearch (delegates to ElectedOfficialListTable component)
- `frontend/src/routes/_protected/kanban.tsx` - Removed unused KanbanSearchParams type, replaced window.location.href with Route.useNavigate()

## Decisions Made

- Countries route keeps local useState for search input with debounce useEffect syncing to URL -- this prevents a re-render and URL update on every keystroke
- Other 6 dossier routes (orgs, forums, engagements, topics, working_groups, persons) use direct URL state for search since they already do client-side useMemo filtering
- Elected-officials route gets validateSearch but delegates all rendering to ElectedOfficialListTable component
- Kanban already had a complete Zod-based validateSearch schema -- only needed cleanup of window.location navigations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed implicit any type on prev parameter in navigate callbacks**

- **Found during:** Task 1 (typecheck verification)
- **Issue:** TypeScript strict mode flagged `(prev) =>` as implicit any in search callbacks
- **Fix:** Added explicit type annotation `(prev: DossierListSearch) =>` to all navigate search callbacks
- **Files modified:** All 8 dossier route files
- **Committed in:** 57d87baa (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type annotation fix was necessary for TypeScript strict mode compliance. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All dossier list pages now support URL-driven pagination -- ready for sharing/bookmarking filtered views
- Kanban uses SPA navigation throughout -- no more full-page reloads on item click or view switch

---

## Self-Check: PASSED

- All 9 modified files exist on disk
- Both task commits verified (57d87baa, 4d5547c9)
- 9 files contain validateSearch (8 dossier routes + kanban)

_Phase: 25-deferred-audit-fixes_
_Completed: 2026-04-12_
