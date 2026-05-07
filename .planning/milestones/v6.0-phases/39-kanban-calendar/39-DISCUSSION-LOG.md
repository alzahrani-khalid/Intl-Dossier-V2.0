# Phase 39: kanban-calendar — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `39-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 39-kanban-calendar
**Areas discussed:** Existing surface fate, Group-by toolbar wiring, Click + create targets, Variants + mobile collapse

---

## Existing surface fate

### Q1 — What happens to the existing `/kanban` route and EnhancedKanbanBoard?

| Option                          | Description                                                                                                                                  | Selected |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Replace outright                | Delete EnhancedKanbanBoard + UnifiedKanban\* + ui/kanban.tsx. Build fresh WorkBoard at /kanban from handoff verbatim. Mirrors Phase 38 D-04. | ✓        |
| Reskin visual layer in place    | Keep EnhancedKanbanBoard wiring but rewrite chrome to handoff CSS. Preserves swimlanes/WIP/bulk. Higher visual-deviation risk.               |          |
| Replace + add Power view toggle | Default = handoff verbatim. Hidden /kanban/power keeps EnhancedKanbanBoard for users on swimlanes/WIP/bulk.                                  |          |

**User's choice:** Replace outright (Recommended)
**Notes:** Aligns with Phase 38 OperationsHub deletion pattern; git history is the archive.

### Q2 — Drag-and-drop on the new handoff WorkBoard?

| Option                               | Description                                                                                                                                        | Selected |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Keep DnD only when grouped By status | Wire @dnd-kit + useUnifiedKanbanStatusUpdate for status mode. Disable in other modes. Matches handoff cursor:grab + preserves existing user value. | ✓        |
| Drop DnD entirely                    | Visual reskin only — click opens detail. Regression vs current /kanban.                                                                            |          |
| Keep DnD across all modes            | Drag works across all modes (priority/tracking_type/dossier/owner). More complex.                                                                  |          |

**User's choice:** Keep DnD only when grouped By status (Recommended)
**Notes:** Status mode is the only mode where dragging-between-columns has unambiguous semantic meaning.

### Q3 — How to reskin the `/calendar` route?

| Option                                   | Description                                                                                                                                                     | Selected |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Reskin month view inside UnifiedCalendar | Keep UnifiedCalendar component + linkedItemType/linkedItemId props (Phase 41 will consume). Rewrite only month-grid render. Week/day modes preserved untouched. | ✓        |
| Replace UnifiedCalendar outright         | Build fresh WorkCalendar.tsx for /calendar. Phase 41 dossier drawer would need its own calendar.                                                                |          |
| Drop week/day toggle from this phase     | Reskin month + delete week/day toggle. Smaller surface but a feature regression.                                                                                |          |

**User's choice:** Reskin month view inside UnifiedCalendar (Recommended)
**Notes:** Preserves Phase 41 consumer contract.

### Q4 — Swimlanes / WIP / bulk-multi-select / realtime presence?

| Option                                 | Description                                                                                                 | Selected |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Drop entirely + delete code            | Cut UnifiedKanbanHeader bulk toolbar, swimlane utils, WIP utils, bulk-ops hooks. Capture as deferred ideas. | ✓        |
| Keep code, hide UI                     | Components stay, UI hidden behind future flag. Adds dead code.                                              |          |
| Keep realtime, drop swimlanes/WIP/bulk | Realtime data refresh stays; rest cut.                                                                      |          |

**User's choice:** Drop entirely + delete code (Recommended)
**Notes:** Realtime _data_ refresh layer continues running silently in `useUnifiedKanban`; only the _presence UI_ is dropped.

---

## Group-by toolbar wiring

### Q5 — What feeds the new WorkBoard?

| Option                                   | Description                                                                                                                   | Selected |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| useUnifiedKanban (personal, status mode) | context='personal', sources=['commitment','task'], mode='status'. Matches handoff '48 items · 27 overdue'. Uses shipped hook. | ✓        |
| New thin useWorkBoard adapter            | Phase 38 D-07 precedent (thin adapters). Wraps useUnifiedKanban + computes overdue chip count + handles pill switching.       |          |
| Multi-context: personal + dossier-scoped | Hook accepts optional dossier_id so the same WorkBoard renders inside dossier drawers later. Phase 41 concern.                |          |

**User's choice:** useUnifiedKanban (personal, status mode) (Recommended)

### Q6 — 'By status / By dossier / By owner' filter pills?

| Option                               | Description                                                                                                                  | Selected |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| By status real, others = visual stub | Ship 'By status' wired. Render 'By dossier' / 'By owner' pills as visually-correct but aria-disabled, "Coming soon" tooltip. | ✓        |
| Wire all three for real              | Extend useUnifiedKanban mode union. Implement column derivation client-side. Bigger scope.                                   |          |
| Hide pills that aren't wired         | Render only 'By status'. Diverges from handoff visually.                                                                     |          |

**User's choice:** By status real, others = visual stub (Recommended)

### Q7 — Toolbar search input?

| Option                              | Description                                                                                       | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| Client-side filter on visible items | Filter loaded items via title/title_ar/dossier name. No new endpoint. Phase 13 Cmd+K is separate. | ✓        |
| Server-side search via existing API | Pass q to useUnifiedKanban filter. May not exist server-side.                                     |          |
| Visual stub only                    | Render input but no-op. Diverges from handoff functionality.                                      |          |

**User's choice:** Client-side filter on visible items (Recommended)

### Q8 — Column count + '27 overdue' chip computation?

| Option                                | Description                                                                                                          | Selected |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Derive from useUnifiedKanban response | Column count = items.filter(col).length. Overdue chip = items.filter(is_overdue).length. WorkItem.is_overdue exists. | ✓        |
| Use server aggregate counts           | Hook returns separate columnCounts + overdueCount. Faster on large datasets.                                         |          |
| Hardcode handoff values               | Render '12 / 7 / 5' / '27 overdue' verbatim. Visual-only.                                                            |          |

**User's choice:** Derive from useUnifiedKanban response (Recommended)

---

## Click + create targets

### Q9 — kcard click?

| Option                              | Description                                                                                         | Selected |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| Open existing work-item detail      | Reuse TaskDetailDialog / commitment detail. No new surface. Phase 41 dossier drawer overlays later. | ✓        |
| Stub no-op until Phase 41           | kcard renders, click does nothing. Honest but a regression.                                         |          |
| Open new lightweight WorkItemDrawer | Build new drawer in this phase. Out of handoff scope; Phase 41 owns drawer pattern.                 |          |

**User's choice:** Open existing work-item detail (Recommended)

### Q10 — cal-ev click?

| Option                                        | Description                                                                              | Selected |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Reuse UnifiedCalendar's existing onEventClick | UnifiedCalendar already has the prop. Wire to existing event-detail flow. No regression. | ✓        |
| Navigate to /calendar/$eventId                | Hard navigation. Loses context.                                                          |          |
| Stub no-op                                    | Visual reskin only. Regression.                                                          |          |

**User's choice:** Reuse UnifiedCalendar's existing onEventClick (Recommended)

### Q11 — '+ New event' button?

| Option                                | Description                                             | Selected |
| ------------------------------------- | ------------------------------------------------------- | -------- |
| Link to existing /calendar/new route  | Already wired by today's calendar route. Zero new code. | ✓        |
| Open CalendarEntryForm modal in-place | Existing form as HeroUI Modal. Better UX, modest scope. |          |
| Stub button                           | Visual only.                                            |          |

**User's choice:** Link to existing /calendar/new route (Recommended)

### Q12 — '+ New item' button on WorkBoard?

| Option                                 | Description                                                                         | Selected |
| -------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Open existing TaskCreate flow          | Researcher confirms exact entry point (route or dialog). source defaults to 'task'. | ✓        |
| Build new lightweight quick-add inline | Inline 'quick add' card with title-only input. Lower friction, new surface.         |          |
| Stub button                            | Visual only.                                                                        |          |
| Per-column '+' add button only         | Drop the global toolbar '+ New item' button. Diverges from handoff.                 |          |

**User's choice:** Open existing TaskCreate flow (Recommended)

---

## Variants + mobile collapse

### Q13 — `.travel` and `.pending` variant mapping?

| Option                                                     | Description                                                                             | Selected |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| event_type='travel' → .travel; status='pending' → .pending | Researcher inspects CalendarEvent shape. Falls back to default if neither field exists. | ✓        |
| Tag-based mapping                                          | Map via tags array. Requires backend tag support.                                       |          |
| Backend variant column                                     | Add calendar_event.variant enum + migration. Out of scope.                              |          |

**User's choice:** event_type / status mapping (Recommended)
**Notes:** Researcher confirms exact field names and gracefully falls back to default styling if backend doesn't expose them.

### Q14 — Days outside the current month in 7×5 grid?

| Option                                                  | Description                                                                    | Selected |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| Verbatim handoff: render with .other class, opacity 0.4 | Pad start with prev-month tail, end with next-month head. Clickable but muted. | ✓        |
| Hide other-month cells (blank cells)                    | Empty padding. Diverges visually.                                              |          |
| Render but disable click on other-month days            | Visually correct, click-disabled. Slight UX deviation.                         |          |

**User's choice:** Verbatim handoff: .other class, opacity 0.4 (Recommended)

### Q15 — Mobile (<640px) calendar collapse?

| Option                                   | Description                                                                                                                      | Selected |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Pageable single-week list with prev/next | One week at a time; prev/next buttons cycle through 5 weeks; 'Today' jumps to active week. Reuses Phase 38 .week-list aesthetic. | ✓        |
| Vertical scroll of all 35 day rows       | Single tall list, day per row. Simpler, no pagination.                                                                           |          |
| Collapse to today-only single-day view   | Mobile shows just today's events. Loses month context.                                                                           |          |

**User's choice:** Pageable single-week list with prev/next (Recommended)

### Q16 — Mobile (<640px) horizontal-scroll Kanban?

| Option                                             | Description                                                                                                    | Selected |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Same horizontal scroll                             | Touch-swipe through 300px columns. Handoff is already horizontal-scroll. Verify ScrollContainer + RTL-correct. | ✓        |
| Stack columns vertically with collapsible sections | Each column = accordion section. Bigger UX change.                                                             |          |
| Single-column view + tab switcher                  | Show one column at a time with tabs. Loses overview.                                                           |          |

**User's choice:** Same horizontal scroll (Recommended)

---

## Claude's Discretion

The following were captured in `39-CONTEXT.md` `<decisions>` → "Claude's Discretion" rather than asked, because they're implementation details that researcher/planner can resolve from existing code:

- New WorkBoard folder layout (mirror Phase 37/38 patterns)
- Exact `priority` → chip-color mapping (verify against handoff `.chip-*` classes)
- Exact `kind` → chip-color mapping (`commitment` → `chip-accent`, `task` → `chip-info`)
- Skeleton fidelity (shape-match column outlines + 3 kcard skeletons + 5×7 cal-cell skeletons)
- Owner-avatar initials algorithm
- Deletion safety check on `components/ui/kanban.tsx` (research grep)

## Deferred Ideas

Captured in `39-CONTEXT.md` `<deferred>`:

- Swimlanes (backlog), WIP limits (backlog), Bulk multi-select (backlog), Realtime presence UI (backlog)
- Power-user advanced kanban view (backlog)
- 'By dossier' / 'By owner' filter wiring (future phase extends `KanbanColumnMode` union)
- Week-view + Day-view calendar reskin (Phase 42)
- Week swipe gestures on mobile calendar (Phase 43 polish)
- `calendar_event.variant` enum column (follow-up if richer categories emerge)
