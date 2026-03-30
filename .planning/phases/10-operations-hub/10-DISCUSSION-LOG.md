# Phase 10: Operations Hub - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 10-operations-hub
**Areas discussed:** Zone Layout & Hierarchy, Role-Adaptive Behavior, Attention Needed Scope, Dashboard Transition

---

## Zone Layout & Hierarchy

### Desktop Zone Arrangement

| Option           | Description                                                                              | Selected |
| ---------------- | ---------------------------------------------------------------------------------------- | -------- |
| Priority grid    | Attention full-width top, 2-col middle (Timeline + Engagements), Stats + Activity bottom | ✓        |
| Two-column split | Left: Attention + Timeline stacked. Right: Engagements + Stats + Activity stacked        |          |
| Tabbed zones     | Each zone as a tab with Quick Stats as persistent header                                 |          |

**User's choice:** Priority grid
**Notes:** Urgency flows top-to-bottom — most urgent at top, context/stats at bottom.

### Mobile Layout

| Option             | Description                                                                           | Selected |
| ------------------ | ------------------------------------------------------------------------------------- | -------- |
| Stacked cards      | All zones stack vertically in priority order, collapsible. Attention always expanded. | ✓        |
| Swipeable tabs     | Quick Stats sticky header, zones as horizontal swipeable tabs with dot indicators     |          |
| Summary + drill-in | Only Quick Stats + Attention badge on initial load. Tap to drill into zone details.   |          |

**User's choice:** Stacked cards
**Notes:** Attention always expanded by default, others collapsed.

### Empty State for Attention Zone

| Option                     | Description                                                                    | Selected |
| -------------------------- | ------------------------------------------------------------------------------ | -------- |
| Green success state        | Compact green banner: "✓ All clear — nothing needs attention". Zones shift up. | ✓        |
| Hidden when empty          | Zone disappears entirely. Other zones fill space.                              |          |
| Always visible placeholder | Zone stays with "No items need attention right now" text.                      |          |

**User's choice:** Green success state
**Notes:** Positive reinforcement for being on top of things.

### Quick Stats Presentation

| Option            | Description                                                                                  | Selected |
| ----------------- | -------------------------------------------------------------------------------------------- | -------- |
| Metric cards row  | 4 compact cards: Active Engagements, Open Tasks, SLA At Risk, Upcoming This Week. Clickable. | ✓        |
| Inline stat strip | Single horizontal strip with stats separated by dividers. Compact ticker style.              |          |
| You decide        | Claude picks based on existing patterns.                                                     |          |

**User's choice:** Metric cards row
**Notes:** Cards are clickable to filter/navigate to relevant views.

### Action Bar Placement

| Option                 | Description                                                                   | Selected |
| ---------------------- | ----------------------------------------------------------------------------- | -------- |
| Page header row        | Sticky header: greeting/date left, [+Eng][+Req][⌘K] right. Scrolls on mobile. | ✓        |
| Floating action button | FAB in corner with expandable menu. Desktop shows full button row.            |          |
| Inside Attention zone  | Buttons in Attention zone header. Less visible when collapsed.                |          |

**User's choice:** Page header row
**Notes:** Includes greeting with user name and date.

### Active Engagements Display

| Option               | Description                                                                                   | Selected |
| -------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Grouped list         | Collapsible sections per lifecycle stage. Count badge + top 3-5 engagements per section.      | ✓        |
| Mini pipeline        | Horizontal kanban columns per stage. Cards in each column. Matches CRM pipeline from Phase 9. |          |
| Stage count bar only | Compact segmented control with counts. Click stage for popover with details.                  |          |

**User's choice:** Grouped list
**Notes:** More compact than pipeline, works well in the half-width column.

### Timeline Zone Format

| Option             | Description                                                                                                   | Selected |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | -------- |
| Day-grouped list   | Sections: Today, Tomorrow, This Week, Next Week. Event cards with time/title/engagement. Max 3-5 per section. | ✓        |
| Vertical timeline  | Continuous timeline with date markers and event nodes. Reuses timeline.tsx.                                   |          |
| Calendar mini-view | 7-day mini calendar with event dots. Click day to expand.                                                     |          |

**User's choice:** Day-grouped list
**Notes:** Scannable format with "Show all" links for overflow.

### Activity Feed Style

| Option              | Description                                                                                                | Selected |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Action-focused feed | Recent actions: lifecycle transitions, task assignments, intake promotions. Max 10, reverse chronological. | ✓        |
| Notification-style  | Compact notifications with icons per type. Unread badge. Mark as read.                                     |          |
| You decide          | Claude picks based on existing RecentDossierActivity component.                                            |          |

**User's choice:** Action-focused feed
**Notes:** Adapts existing RecentDossierActivity pattern to engagement-centric actions.

---

## Role-Adaptive Behavior

### What Changes Per Role

| Option                       | Description                                                                                                                            | Selected |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Zone ordering + data filter  | Same zones, different order and data scope per role. Leadership: Engagements first. Officer: Attention first. Analyst: Timeline first. | ✓        |
| Content filtering only       | Same layout, role filters WHAT data appears. Simplest implementation.                                                                  |          |
| Completely different layouts | Each role gets distinct dashboard layout. Most flexible, most complex.                                                                 |          |

**User's choice:** Zone ordering + data filter
**Notes:** Leadership sees strategic overview, Officers see personal workload, Analysts see research queue.

### Role Detection & View Switcher

| Option                        | Description                                                                                                      | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| Auto-detect + manual override | Read role from auth store for default. Dropdown to switch views. Persists in localStorage. No permission gating. | ✓        |
| Manual only                   | User picks view on first visit. No auto-detection.                                                               |          |
| Role-locked views             | Users only see their role's view. No switching.                                                                  |          |

**User's choice:** Auto-detect + manual override
**Notes:** Dropdown in page header alongside action buttons.

### Role Value Mapping

| Option                         | Description                                                                                                               | Selected |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| Map existing roles             | admin/manager → Leadership, officer/user → Officer, analyst → Analyst, viewer/undefined → Officer default. No DB changes. | ✓        |
| Add dashboard_preference field | New field on user profile. Decoupled from system role. Requires schema change.                                            |          |
| Three fixed values             | New leadership/officer/analyst role values. Requires DB migration.                                                        |          |

**User's choice:** Map existing roles
**Notes:** No new role values needed — pure frontend mapping logic.

### Officer View Data Scope

| Option                         | Description                                                       | Selected |
| ------------------------------ | ----------------------------------------------------------------- | -------- |
| My items only                  | Filter to current user's assigned items. Personal workload focus. | ✓        |
| Team with my items highlighted | Show everyone's items, highlight mine. More context but noisier.  |          |
| You decide                     | Claude picks based on assignee_id field availability.             |          |

**User's choice:** My items only
**Notes:** "Show team" toggle deferred to future phase.

---

## Attention Needed Scope

### Item Types in Attention Zone

| Option                     | Description                                                                       | Selected |
| -------------------------- | --------------------------------------------------------------------------------- | -------- |
| Overdue work items         | Past deadline. Red indicators. Uses is_overdue field.                             | ✓        |
| Due-soon work items        | Within 48h of deadline. Yellow indicators. Uses days_until_due.                   | ✓        |
| SLA-at-risk intake tickets | SLA-tracked tickets approaching deadline. Organizational consequences.            | ✓        |
| Stalled engagements        | Same lifecycle stage 14+ days. Orange indicators. Uses Phase 9 duration tracking. | ✓        |

**User's choice:** All 4 types selected
**Notes:** Comprehensive attention tracking across all item types.

### Due-Soon Threshold

| Option                | Description                                           | Selected |
| --------------------- | ----------------------------------------------------- | -------- |
| 48 hours              | Items due within 48h. Enough lead time without noise. | ✓        |
| 7 days                | More conservative, catches things earlier.            |          |
| Configurable per user | User sets own threshold. Flexible but complex.        |          |
| You decide            | Claude picks sensible default.                        |          |

**User's choice:** 48 hours
**Notes:** Hardcoded default. Configurable threshold deferred.

### Sort Order Within Zone

| Option                 | Description                                                                                                 | Selected |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Severity then deadline | Group by: Overdue (red) → SLA Risk → Stalled (orange) → Due Soon (yellow). Most urgent first within groups. | ✓        |
| Pure deadline sort     | Single list by deadline. Color coding for type. Simpler.                                                    |          |
| You decide             | Claude picks.                                                                                               |          |

**User's choice:** Severity then deadline
**Notes:** Clear priority hierarchy with color-coded severity groups.

### Stalled Engagement Threshold

| Option                    | Description                                                  | Selected |
| ------------------------- | ------------------------------------------------------------ | -------- |
| 14 days default           | Uniform 14d across all non-terminal stages. Excludes closed. | ✓        |
| Stage-specific thresholds | Different per stage (intake 7d, execution 21d, etc.).        |          |
| You decide                | Claude picks.                                                |          |

**User's choice:** 14 days default
**Notes:** Uniform across stages. Stage-specific thresholds deferred.

---

## Dashboard Transition

### Transition Strategy

| Option            | Description                                                                                  | Selected |
| ----------------- | -------------------------------------------------------------------------------------------- | -------- |
| Replace entirely  | Operations Hub becomes /dashboard. Dossier widgets removed. Clean break.                     | ✓        |
| Keep as a tab     | Add Operations tab alongside existing Overview tab. Preserves investment.                    |          |
| Gradual migration | Operations as default tab, old dashboard as secondary Analytics tab for Phase 13 absorption. |          |

**User's choice:** Replace entirely
**Notes:** Dossier-level stats move to dossier pages in Phase 12.

### Old Component Handling

| Option                  | Description                                                  | Selected |
| ----------------------- | ------------------------------------------------------------ | -------- |
| Delete with git history | Remove old components. Git preserves them. Clean codebase.   | ✓        |
| Keep as internal module | Move to legacy/ directory. Available for Phase 12 reference. |          |
| You decide              | Claude picks cleanest approach.                              |          |

**User's choice:** Delete with git history
**Notes:** Phase 12 builds dossier stats fresh from dossier-specific queries.

### Data Layer Architecture

| Option                     | Description                                                                                                                  | Selected |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| New Supabase RPC functions | 3-4 RPCs: get_attention_items, get_upcoming_events, get_engagement_stage_counts, get_dashboard_stats. Single query per zone. | ✓        |
| Frontend aggregation       | Use existing hooks, aggregate client-side. More API calls, no backend code.                                                  |          |
| Edge Functions             | New TypeScript Edge Functions per zone. More control, heavier infra.                                                         |          |

**User's choice:** New Supabase RPC functions
**Notes:** Follows existing RPC pattern (get_engagement_full). Most performant.

### Realtime Updates

| Option                      | Description                                                                                                                    | Selected |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Realtime for Attention zone | Subscribe to work_items + lifecycle_transitions for Attention only. Other zones use TanStack Query polling (2-5min staleTime). | ✓        |
| Full Realtime               | All zones subscribe. Always fresh. More WebSocket connections.                                                                 |          |
| No Realtime, polling only   | All zones poll at 1-2min. Simpler. Slight delay.                                                                               |          |
| You decide                  | Claude picks based on existing Realtime patterns.                                                                              |          |

**User's choice:** Realtime for Attention zone
**Notes:** Balanced approach — most time-sensitive zone gets live updates, others poll.

---

## Claude's Discretion

- Exact responsive breakpoint for 2-column → 1-column transition
- Color palette for severity indicators
- Animation for zone collapse/expand on mobile
- Stalled engagement display format (progress bar vs text)
- Greeting text format (time-of-day aware)
- Quick Stats card styling (icons, trend arrows, numbers)
- RPC function signatures and return types
- "Show all" link navigation behavior

## Deferred Ideas

- Configurable "due soon" threshold per user
- Stage-specific stall thresholds
- "Show team" toggle for Officer view
- Process analytics widgets (avg time per stage)
- Dashboard widgets drag-and-drop customization
- Push notification integration for attention items
