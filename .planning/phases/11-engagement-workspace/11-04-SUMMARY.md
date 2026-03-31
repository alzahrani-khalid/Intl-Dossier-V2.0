---
phase: 11-engagement-workspace
plan: 04
subsystem: ui
tags: [react, tanstack-router, dnd-kit, kanban, calendar, briefs, ai-generation, i18n, rtl]

requires:
  - phase: 11-01
    provides: WorkspaceShell layout, tab routes, tab stubs, i18n workspace namespace
  - phase: 11-02
    provides: LifecycleStepperBar with popovers and transition interactions

provides:
  - Inline kanban board (TasksTab) with @dnd-kit/core drag-and-drop and mobile stacked view
  - Calendar view (CalendarTab) with engagement date range and lifecycle date entries
  - Document management view (DocsTab) with AI brief listing and Generate Briefing action

affects: [11-05-audit-tab, 13-feature-absorption]

tech-stack:
  added: []
  patterns:
    - Kibo-UI KanbanProvider compound component pattern for drag-and-drop boards
    - Brief card rendering pattern extracted from EngagementBriefsSection for inline use
    - Engagement date extraction pattern using useEngagement for calendar entries

key-files:
  created: []
  modified:
    - frontend/src/pages/engagements/workspace/TasksTab.tsx
    - frontend/src/pages/engagements/workspace/CalendarTab.tsx
    - frontend/src/pages/engagements/workspace/DocsTab.tsx

key-decisions:
  - 'Used Kibo-UI KanbanProvider instead of raw @dnd-kit/core for TasksTab -- provides compound component pattern with built-in column/card management'
  - 'Extracted brief card pattern from EngagementBriefsSection rather than reusing it -- the existing component is tightly coupled with Dialog, Tabs, and context views'
  - 'CalendarTab uses engagement own dates (start, end, lifecycle) since Events API lacks engagement_id filter'

patterns-established:
  - 'Mobile kanban pattern: collapsible stage sections with Move-to dropdown replacing drag-and-drop on touch'
  - 'Brief card pattern: status badge with color mapping, type badge (AI/Legacy), citations indicator'

requirements-completed: [WORK-06, WORK-07, WORK-08]

duration: 4min
completed: 2026-03-31
---

# Phase 11 Plan 04: Tasks, Calendar & Docs Tabs Summary

**Inline kanban board with drag-and-drop, engagement calendar with lifecycle dates, and document management with AI brief generation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T05:49:32Z
- **Completed:** 2026-03-31T05:53:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- TasksTab: 364-line inline kanban board with Kibo-UI KanbanProvider, desktop drag-and-drop, mobile collapsible sections with Move-to dropdown, stats bar with progress percentage, sort selector
- CalendarTab: 272-line calendar view showing engagement start/end dates, lifecycle stage entries grouped by Today/Upcoming/Past, Add Event placeholder
- DocsTab: 294-line document management tab listing AI briefs via useEngagementBriefs, Generate Briefing button with spinner state via useGenerateEngagementBrief, Upload Document placeholder, brief cards with status/type/citations badges

## Task Commits

Each task was committed atomically:

1. **Task 1: Build TasksTab -- inline kanban board with drag-and-drop** - `163deea3` (feat)
2. **Task 2: Build CalendarTab and DocsTab -- engagement events and document management**
   - CalendarTab: completed in parallel worktree, merged via `34af60b5`
   - DocsTab: `88dde15b` (feat)

## Files Created/Modified

- `frontend/src/pages/engagements/workspace/TasksTab.tsx` - Inline kanban board with 4 workflow stage columns, @dnd-kit/core drag-and-drop on desktop, mobile stacked view with Move-to dropdowns
- `frontend/src/pages/engagements/workspace/CalendarTab.tsx` - Engagement dates and lifecycle events in chronological list grouped by date
- `frontend/src/pages/engagements/workspace/DocsTab.tsx` - AI brief listing with Generate Briefing action, brief cards with status/type badges, Upload Document placeholder

## Decisions Made

- Used Kibo-UI KanbanProvider compound component pattern for TasksTab instead of raw @dnd-kit/core -- provides cleaner column/card management with built-in drag overlay
- Extracted brief card rendering pattern from EngagementBriefsSection rather than reusing it directly -- the existing component is tightly coupled with its own Dialog, Tabs, and context views that don't fit the workspace tab layout
- CalendarTab uses engagement's own dates (start_date, end_date, lifecycle stage entries) since Events API lacks engagement_id filter (confirmed blocker in RESEARCH)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- **TasksTab Create Task button** (`TasksTab.tsx`): Placeholder action -- will link to task creation flow when available
- **CalendarTab Add Event button** (`CalendarTab.tsx`): Placeholder action -- will link to event creation when Events API supports engagement_id filter
- **DocsTab Upload Document button** (`DocsTab.tsx`): Placeholder action -- will link to file upload capability in future plan
- **DocsTab View button on brief cards** (`DocsTab.tsx`): Placeholder action -- will navigate to brief detail view

These stubs are intentional per the plan and do not block the plan's goal of displaying scoped content in each tab. They will be resolved in Phase 13 (Feature Absorption).

## Next Phase Readiness

- All 3 operational tabs (Tasks, Calendar, Docs) are implemented and rendering engagement-scoped content
- Ready for Plan 05 (Audit tab + dossier redirect + human verification)
- Events API extension for engagement_id filtering remains a backend TODO for full calendar functionality

## Self-Check: PASSED

- FOUND: TasksTab.tsx
- FOUND: CalendarTab.tsx
- FOUND: DocsTab.tsx
- FOUND: 11-04-SUMMARY.md
- FOUND: commit 163deea3 (TasksTab)
- FOUND: commit 88dde15b (DocsTab)

---

_Phase: 11-engagement-workspace_
_Completed: 2026-03-31_
