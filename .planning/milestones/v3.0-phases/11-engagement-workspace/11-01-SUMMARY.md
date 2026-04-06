---
phase: 11-engagement-workspace
plan: 01
subsystem: ui
tags: [react, tanstack-router, i18n, workspace, engagement, lazy-loading, code-splitting]

# Dependency graph
requires:
  - phase: 09-lifecycle-engine
    provides: LifecycleStepperBar component and lifecycle_stage column
  - phase: 08-navigation
    provides: Route structure and navigation patterns
provides:
  - WorkspaceShell layout component with sticky header, LifecycleBar, tab nav
  - WorkspaceTabNav URL-driven tab navigation using TanStack Router Links
  - TabSkeleton loading variants (summary, kanban, list, cards)
  - 6 lazy-loaded tab routes (overview, context, tasks, calendar, docs, audit)
  - Index route redirect from /engagements/:id to /engagements/:id/overview
  - Workspace i18n namespace (en + ar) with tabs, actions, empty states, errors
affects: [11-02, 11-03, 11-04, 11-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [workspace-shell-layout, url-driven-tabs, lazy-tab-routes, tab-skeleton-variants]

key-files:
  created:
    - frontend/src/components/workspace/WorkspaceShell.tsx
    - frontend/src/components/workspace/WorkspaceTabNav.tsx
    - frontend/src/components/workspace/TabSkeleton.tsx
    - frontend/src/i18n/en/workspace.json
    - frontend/src/i18n/ar/workspace.json
    - frontend/src/routes/_protected/engagements/$engagementId/index.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/overview.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/context.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/tasks.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/calendar.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/docs.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/audit.tsx
    - frontend/src/pages/engagements/workspace/OverviewTab.tsx
    - frontend/src/pages/engagements/workspace/ContextTab.tsx
    - frontend/src/pages/engagements/workspace/TasksTab.tsx
    - frontend/src/pages/engagements/workspace/CalendarTab.tsx
    - frontend/src/pages/engagements/workspace/DocsTab.tsx
    - frontend/src/pages/engagements/workspace/AuditTab.tsx
  modified:
    - frontend/src/routes/_protected/engagements/$engagementId.tsx
    - frontend/src/i18n/index.ts

key-decisions:
  - "LifecycleStepperBar transitions array passed empty — wired in Plan 02"
  - "Tab stubs use workspace i18n namespace for consistent placeholder text"
  - "WorkspaceTabNav uses useMatchRoute with fuzzy matching for active tab detection"

patterns-established:
  - "Workspace shell pattern: sticky header + LifecycleBar + conditional tab nav + Outlet"
  - "URL-driven tab nav: TanStack Router Links with useMatchRoute, no local state"
  - "Lazy tab routes: React.lazy + Suspense + TabSkeleton per route file"

requirements-completed: [WORK-01, WORK-10]

# Metrics
duration: 8min
completed: 2026-03-31
---

# Phase 11 Plan 01: Workspace Shell & Route Structure Summary

**WorkspaceShell layout with URL-driven 6-tab navigation, lazy-loaded route tree, and bilingual i18n namespace for the engagement workspace**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-31T05:23:21Z
- **Completed:** 2026-03-31T05:31:00Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- WorkspaceShell renders engagement header (name + type badge + actions), LifecycleStepperBar in LtrIsolate, conditional WorkspaceTabNav, and Outlet content area
- 6 workspace tabs individually addressable via URL with lazy-loading and Suspense fallbacks
- Index route redirects /engagements/:id to /engagements/:id/overview for backward compatibility
- After-action child route preserved within workspace layout with tab nav hidden
- Full workspace i18n namespace (en + ar) covering tabs, actions, empty states, errors, mobile abbreviations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkspaceShell, WorkspaceTabNav, TabSkeleton + i18n namespace** - `385208d7` (feat)
2. **Task 2: Restructure engagement routes -- layout + index redirect + 6 lazy tab routes** - `bf4aa9a0` (feat)

## Files Created/Modified
- `frontend/src/components/workspace/WorkspaceShell.tsx` - Layout shell with header, LifecycleBar, tab nav, Outlet
- `frontend/src/components/workspace/WorkspaceTabNav.tsx` - URL-driven tab navigation with mobile scroll
- `frontend/src/components/workspace/TabSkeleton.tsx` - 4 loading skeleton variants
- `frontend/src/i18n/en/workspace.json` - English workspace translations
- `frontend/src/i18n/ar/workspace.json` - Arabic workspace translations
- `frontend/src/i18n/index.ts` - Registered workspace namespace
- `frontend/src/routes/_protected/engagements/$engagementId.tsx` - Converted to layout route
- `frontend/src/routes/_protected/engagements/$engagementId/index.tsx` - Redirect to overview
- `frontend/src/routes/_protected/engagements/$engagementId/overview.tsx` - Lazy overview tab route
- `frontend/src/routes/_protected/engagements/$engagementId/context.tsx` - Lazy context tab route
- `frontend/src/routes/_protected/engagements/$engagementId/tasks.tsx` - Lazy tasks tab route
- `frontend/src/routes/_protected/engagements/$engagementId/calendar.tsx` - Lazy calendar tab route
- `frontend/src/routes/_protected/engagements/$engagementId/docs.tsx` - Lazy docs tab route
- `frontend/src/routes/_protected/engagements/$engagementId/audit.tsx` - Lazy audit tab route
- `frontend/src/pages/engagements/workspace/OverviewTab.tsx` - Stub tab component
- `frontend/src/pages/engagements/workspace/ContextTab.tsx` - Stub tab component
- `frontend/src/pages/engagements/workspace/TasksTab.tsx` - Stub tab component
- `frontend/src/pages/engagements/workspace/CalendarTab.tsx` - Stub tab component
- `frontend/src/pages/engagements/workspace/DocsTab.tsx` - Stub tab component
- `frontend/src/pages/engagements/workspace/AuditTab.tsx` - Stub tab component

## Decisions Made
- LifecycleStepperBar transitions array passed as empty -- actual transition wiring deferred to Plan 02
- Tab stubs use workspace i18n namespace for consistent placeholder text rather than hardcoded strings
- WorkspaceTabNav uses useMatchRoute with fuzzy matching for robust active tab detection across nested routes

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

All 6 tab page components are intentional stubs that will be replaced with full implementations:
- `frontend/src/pages/engagements/workspace/OverviewTab.tsx` - Plan 03
- `frontend/src/pages/engagements/workspace/ContextTab.tsx` - Plan 04
- `frontend/src/pages/engagements/workspace/TasksTab.tsx` - Plan 04
- `frontend/src/pages/engagements/workspace/CalendarTab.tsx` - Plan 05
- `frontend/src/pages/engagements/workspace/DocsTab.tsx` - Plan 05
- `frontend/src/pages/engagements/workspace/AuditTab.tsx` - Plan 05

These stubs are required for React.lazy resolution and are tracked for replacement in subsequent plans.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Workspace shell and route tree ready for Plan 02 (lifecycle transitions wiring)
- Tab content components ready for Plans 03-05 to replace stubs
- i18n namespace provides all translation keys needed by subsequent plans

---
*Phase: 11-engagement-workspace*
*Completed: 2026-03-31*
