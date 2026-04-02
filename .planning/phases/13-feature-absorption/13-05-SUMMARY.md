---
phase: 13-feature-absorption
plan: 05
subsystem: ui
tags: [tanstack-router, redirects, navigation, sidebar, route-cleanup]

requires:
  - phase: 13-01
    provides: Dashboard KPI widgets and dossier overview analytics cards
  - phase: 13-02
    provides: Enhanced Cmd+K quick switcher
  - phase: 13-03
    provides: Network graph in RelationshipSidebar + full-screen modal
  - phase: 13-04
    provides: Briefing, polling, export absorbed into workspace tabs

provides:
  - 7 standalone route files replaced with beforeLoad redirects
  - Sidebar navigation cleaned of 4 absorbed page items
  - Zero broken links from old bookmarked URLs

affects: []

tech-stack:
  added: []
  patterns:
    - "TanStack Router beforeLoad redirect pattern for deprecated routes"

key-files:
  created: []
  modified:
    - frontend/src/routes/_protected/analytics.tsx
    - frontend/src/routes/_protected/briefing-books.tsx
    - frontend/src/routes/_protected/search.tsx
    - frontend/src/routes/_protected/relationships/graph.tsx
    - frontend/src/routes/_protected/availability-polling.tsx
    - frontend/src/routes/_protected/export.tsx
    - frontend/src/routes/_protected/export-import.tsx
    - frontend/src/components/layout/navigation-config.ts
    - frontend/src/routeTree.gen.ts

key-decisions:
  - "Kept page component files intact -- only route files redirect, preserving reusable logic extracted by Plans 01-04"
  - "Used throw redirect() in beforeLoad for immediate server-side redirect before component renders"

patterns-established:
  - "Absorbed route redirect: createFileRoute with beforeLoad throwing redirect to new contextual location"

requirements-completed: [ABSORB-01, ABSORB-02, ABSORB-03, ABSORB-04, ABSORB-05, ABSORB-06]

duration: 4min
completed: 2026-04-02
---

# Phase 13 Plan 05: Route Redirects and Navigation Cleanup Summary

**7 absorbed standalone routes replaced with beforeLoad redirects to contextual locations, sidebar cleaned of 4 absorbed nav items**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T18:41:56Z
- **Completed:** 2026-04-02T18:46:46Z
- **Tasks:** 1 (auto) + 1 (checkpoint: human-verify)
- **Files modified:** 9

## Accomplishments
- Replaced 7 standalone route files with TanStack Router `beforeLoad` redirects (analytics, briefing-books, search, relationships/graph, availability-polling, export, export-import)
- Removed 4 absorbed navigation items from sidebar config (analytics, briefing-books, advanced-search, availability-polling)
- Regenerated TanStack Router route tree -- zero TypeScript errors in changed files
- Dashboard-bound routes redirect to `/dashboard`; dossier-bound routes redirect to `/dossiers`

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace absorbed route files with redirects and clean navigation config** - `7a8331d5` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `frontend/src/routes/_protected/analytics.tsx` - Redirect to /dashboard
- `frontend/src/routes/_protected/briefing-books.tsx` - Redirect to /dashboard
- `frontend/src/routes/_protected/search.tsx` - Redirect to /dashboard
- `frontend/src/routes/_protected/relationships/graph.tsx` - Redirect to /dossiers
- `frontend/src/routes/_protected/availability-polling.tsx` - Redirect to /dashboard
- `frontend/src/routes/_protected/export.tsx` - Redirect to /dossiers
- `frontend/src/routes/_protected/export-import.tsx` - Redirect to /dossiers
- `frontend/src/components/layout/navigation-config.ts` - Removed 4 absorbed nav items (briefing-books, analytics, advanced-search, availability-polling)
- `frontend/src/routeTree.gen.ts` - Auto-regenerated route tree

## Decisions Made
- Kept page component files intact (AnalyticsDashboardPage, BriefingBooksPage, etc.) since they contain reusable logic extracted by Plans 01-04 -- only route files redirect
- Used `throw redirect()` in `beforeLoad` for immediate redirect before component render (no flash of old page)
- Removed unused icon imports (BookOpen, TrendingUp, Search, Clock) from navigation-config.ts to keep imports clean

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all routes redirect to functional locations built in Plans 01-04.

## Issues Encountered

- TypeScript compilation showed pre-existing TS6133/TS6196 (unused variable) warnings in unrelated files (work-item.types.ts, working-group.types.ts, sla-calculator.ts, etc.) -- these are out of scope per deviation rules
- `pnpm exec tsr generate` command not available in worktree; used `npx @tanstack/router-cli generate` instead

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 13 feature absorption complete pending human verification (Task 2 checkpoint)
- All absorbed features accessible from contextual locations (dashboard, dossier detail pages, workspace tabs)
- All old bookmarked URLs redirect seamlessly to new locations

## Self-Check: PASSED

- All 9 modified files exist on disk
- Commit 7a8331d5 verified in git log
- analytics.tsx contains redirect to /dashboard
- relationships/graph.tsx contains redirect to /dossiers
- navigation-config.ts does NOT contain briefing-books, analytics, advanced-search, or availability-polling nav items

---
*Phase: 13-feature-absorption*
*Completed: 2026-04-02*
