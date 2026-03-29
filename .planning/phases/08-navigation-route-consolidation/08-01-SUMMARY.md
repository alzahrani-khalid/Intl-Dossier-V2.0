---
phase: 08-navigation-route-consolidation
plan: 01
subsystem: ui
tags: [sidebar, navigation, layout, lucide-react, collapsible, rtl]

requires:
  - phase: 07-performance-optimization
    provides: domain repository architecture, responsive hooks, useDirection

provides:
  - 3-group NavigationGroup config (Operations, Dossiers, Administration)
  - Group-aware NavMain renderer with collapsible and secondary item support
  - Compact NavUser header component with dropdown menu
  - Refactored AppSidebar using hub-based 3-group layout

affects: [08-02 mobile-tab-bar, 08-03 route-cleanup, 08-04 command-palette]

tech-stack:
  added: []
  patterns: [NavigationGroup type with collapsible/defaultOpen/secondary flags, SidebarMenuSub for secondary items]

key-files:
  created: []
  modified:
    - frontend/src/components/layout/navigation-config.ts
    - frontend/src/components/layout/nav-main.tsx
    - frontend/src/components/layout/AppSidebar.tsx
    - frontend/src/components/layout/nav-user.tsx

key-decisions:
  - "Mapped useWorkQueueCounts intake/waiting to tasks/approvals counts until hook extended"
  - "Kept backward-compat createNavigationSections wrapper for transition safety"
  - "Used SidebarMenuSub for secondary items instead of custom muted styling"

patterns-established:
  - "NavigationGroup with collapsible flag: groups declare their own collapse behavior"
  - "Secondary items pattern: items with secondary=true render as SidebarMenuSub below separator"
  - "NavUser in SidebarHeader: user avatar lives in header, not footer"

requirements-completed: [NAV-01, NAV-02]

duration: 8min
completed: 2026-03-29
---

# Phase 08 Plan 01: 3-Group Sidebar Summary

**Hub-based 3-group sidebar (Operations, Dossiers, Administration) with collapsible groups, badge counts, secondary items, and user avatar in header**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-29T03:27:59Z
- **Completed:** 2026-03-29T03:36:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced 6-category flat navigation with clean 3-group mental model (Operations, Dossiers, Administration)
- Operations group has 7 primary items + 4 secondary items with muted sub-item styling
- Dossiers group links all 7 dossier types under /dossiers/{type}/ plus engagements cross-link (D-03)
- Administration group is collapsible, admin-only, with badge count on Approvals
- User avatar moved from sidebar footer to header area (D-05)
- Removed SidebarSearch and QuickNavigationMenu from sidebar (replaced by Cmd+K in Plan 04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure navigation-config.ts from 6 categories to 3 groups** - `1a70ed28` (feat)
2. **Task 2: Refactor NavMain, AppSidebar, and NavUser for 3-group layout** - `ec261eb1` (feat)

## Files Created/Modified
- `frontend/src/components/layout/navigation-config.ts` - New 3-group config with NavigationGroup type, createNavigationGroups function, backward-compat wrapper
- `frontend/src/components/layout/nav-main.tsx` - Group-aware renderer with collapsible support and SidebarMenuSub for secondary items
- `frontend/src/components/layout/AppSidebar.tsx` - Refactored to use createNavigationGroups, user avatar in header, removed search/quick-nav
- `frontend/src/components/layout/nav-user.tsx` - Compact header-friendly component with dropdown menu

## Decisions Made
- Mapped `useWorkQueueCounts` existing `intake`/`waiting` fields to `tasks`/`approvals` params (hook returns placeholder data; engagements set to 0 until hook is extended)
- Kept `createNavigationSections` as backward-compat wrapper to prevent any hidden import breakage during transition
- Used `SidebarMenuSub` + `SidebarMenuSubButton` for secondary items (native sidebar component, consistent with existing patterns)
- Active state detection uses `startsWith` for dossier paths to highlight parent when on detail pages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all navigation items link to existing routes. Badge counts use existing `useWorkQueueCounts` hook (placeholder returning 0s, pre-existing).

## Next Phase Readiness
- Navigation config is consumed by Plans 02 (mobile tab bar) and 04 (command palette)
- `NavigationGroup` type and `createNavigationGroups` are the new canonical exports
- `createNavigationSections` wrapper available for any legacy consumers discovered during Plan 03 route cleanup
- SidebarSearch and QuickNavigationMenu files still exist but are no longer imported (can be cleaned up in Plan 03)

## Self-Check: PASSED

- All 4 modified files verified on disk
- Commit `1a70ed28` (Task 1) verified in git log
- Commit `ec261eb1` (Task 2) verified in git log
- Frontend TypeScript compilation: no errors
- Frontend build: success (21s)

---
*Phase: 08-navigation-route-consolidation*
*Completed: 2026-03-29*
