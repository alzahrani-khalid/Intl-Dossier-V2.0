# Phase 10: Operations Hub - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current dossier-centric dashboard with a role-adaptive Operations Hub that surfaces what needs attention now, upcoming events, and active engagement status at a glance. The hub uses a priority grid layout with 4 zones: Attention Needed, Timeline, Active Engagements, and Quick Stats + Activity Feed. Role-based view presets (Leadership, Officer, Analyst) change zone ordering and data filtering.

</domain>

<decisions>
## Implementation Decisions

### Zone Layout & Hierarchy (OPS-01, OPS-02, OPS-03, OPS-04)

- **D-01:** Priority grid layout on desktop — Attention Needed spans full width at top (most urgent), then 2-column row: Timeline (left) + Active Engagements (right), then Quick Stats + Activity Feed at bottom. Urgency flows top-to-bottom.
- **D-02:** Mobile (< 640px) uses stacked collapsible cards in priority order: Attention → Timeline → Engagements → Quick Stats → Activity. Attention zone always expanded by default, others collapsed. User taps to expand.
- **D-03:** When no items need attention, the Attention zone shows a compact green success banner: "✓ All clear — nothing needs attention". Other zones shift up to fill the space.
- **D-04:** Quick Stats shown as 4 metric cards in a row: Active Engagements (count), Open Tasks (count), SLA At Risk (count with red badge if > 0), Upcoming This Week (count). Click any card to navigate to the relevant filtered view.
- **D-05:** Timeline zone uses day-grouped list: sections for "Today", "Tomorrow", "This Week", "Next Week". Each shows event cards with time, title, engagement name, and type icon. Max 3-5 per section with "Show all" link.
- **D-06:** Active Engagements zone uses grouped list with collapsible sections per lifecycle stage (intake, preparation, briefing, execution, follow_up, closed). Each section shows count badge and top 3-5 engagements. Click to expand full list.
- **D-07:** Recent Activity feed shows action-focused items: lifecycle transitions, task assignments, intake promotions. Max 10 items, reverse chronological. Adapt existing RecentDossierActivity pattern.

### Action Bar (OPS-07)

- **D-08:** Page header row at the top of the dashboard: page title + greeting/date on the left, action buttons ([+ New Engagement], [+ New Request], [Cmd+K]) and role switcher dropdown on the right. Sticky on desktop, scrolls with page on mobile.

### Role-Adaptive Behavior (OPS-05)

- **D-09:** Zone ordering + data filtering per role. Same zones for all roles, but order and default data scope differ:
  - **Leadership:** Engagements first (expanded, all stages), Quick Stats prominent, then Attention + Timeline + Activity
  - **Officer:** Attention first (expanded), Timeline (my events), Quick Stats, then Engagements + Activity
  - **Analyst:** Timeline first (upcoming research), Activity Feed (expanded), Attention, then Engagements + Stats
- **D-10:** Auto-detect role from auth store (`user_metadata.role`) + manual dropdown override. Role mapping: admin/manager → Leadership, officer/user → Officer, analyst → Analyst, viewer/undefined → Officer (default). Selection persists in localStorage. No permission gating — it's a viewing lens, not access control.
- **D-11:** Officer view filters to current user's assigned items only ("my workload"). Leadership and Analyst views show all items across the organization. A future "Show team" toggle could expand Officer view but is not in Phase 10 scope.

### Attention Needed Scope (OPS-01)

- **D-12:** Four item types appear in the Attention zone:
  1. **Overdue work items** (red) — tasks/commitments/intake past deadline. Uses existing `is_overdue` field.
  2. **Due-soon work items** (yellow) — approaching deadline within 48 hours. Uses `days_until_due` field.
  3. **SLA-at-risk intake tickets** (yellow) — tickets with `tracking_type='sla'` approaching SLA deadline.
  4. **Stalled engagements** (orange) — engagements in same lifecycle stage for 14+ days. Uses Phase 9's `duration_in_stage_seconds`. Excludes 'closed' stage.
- **D-13:** Items sorted by severity group then deadline within group: Overdue (red) → SLA At Risk → Stalled (orange) → Due Soon (yellow). Most urgent items within each group appear first.
- **D-14:** "Due soon" threshold is 48 hours. Hardcoded default — can be made configurable in a future phase.
- **D-15:** "Stalled" threshold is 14 days in any non-terminal lifecycle stage. Uniform across all stages. Closed stage is excluded (terminal).

### Dashboard Transition (OPS-06)

- **D-16:** Operations Hub completely replaces the current dossier-centric dashboard at `/dashboard`. No tabs, no coexistence. Dossier-level stats will move to individual dossier pages in Phase 12.
- **D-17:** Existing dashboard components (DossierQuickStatsCard, ChartDossierDistribution, ChartWorkItemTrends, RecentDossiersTable) are deleted. Git history preserves them. Phase 12 will build dossier-specific stats fresh.

### Data Layer

- **D-18:** New Supabase RPC functions for dashboard data:
  - `get_attention_items(user_id, threshold_hours)` → overdue + due-soon + SLA risk + stalled items
  - `get_upcoming_events(user_id, days_ahead)` → events grouped by day
  - `get_engagement_stage_counts(user_id?)` → `{stage: count}` + top engagements per stage
  - `get_dashboard_stats(user_id?)` → active engagement count, open task count, SLA at risk count
- **D-19:** Realtime subscriptions for Attention zone only (work_items + lifecycle_transitions tables). Other zones use TanStack Query with staleTime: Timeline/Engagements/Stats at 5min, Activity Feed at 2min. All refetch on window focus.

### Claude's Discretion

- Exact responsive breakpoint behavior for the 2-column → 1-column transition (sm vs md)
- Color palette for severity indicators (exact red/yellow/orange shades)
- Animation/transition for zone collapse/expand on mobile
- Whether stalled engagements show a progress bar or just text ("18 days in Preparation")
- Greeting text format (time-of-day aware: "Good morning" vs "Good afternoon")
- Whether Quick Stats cards use icons, trend arrows, or just numbers
- Exact RPC function signatures and return types (optimize for fewest queries)
- How "Show all" links in Timeline/Engagements zones navigate (inline expand vs full page)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 9 Context (lifecycle dependency)

- `.planning/phases/09-lifecycle-engine/09-CONTEXT.md` — Lifecycle stages (D-01), stepper bar (D-01), duration tracking (D-13/D-15), forum sessions as child engagements (D-09). Phase 10 depends on `lifecycle_stage` field and `lifecycle_transitions` table.

### Phase 8 Context (navigation dependency)

- `.planning/phases/08-navigation-route-consolidation/08-CONTEXT.md` — Sidebar 3-group structure (D-01), Dashboard in Operations group, Cmd+K palette (D-12–D-16), mobile bottom tab bar (D-06–D-09).

### Engagement Domain

- `frontend/src/types/engagement.types.ts` — EngagementStatus, EngagementType, EngagementDossier types
- `frontend/src/types/lifecycle.types.ts` — LifecycleStage enum (intake through closed)
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` — Engagement data access

### Work Items

- `frontend/src/types/work-item.types.ts` — WorkItem with `is_overdue`, `days_until_due`, `deadline`, `tracking_type`, `lifecycle_stage` fields
- `frontend/src/types/intake.ts` — IntakeTicket, TicketStatus, RequestType, Urgency

### Current Dashboard (to be replaced)

- `frontend/src/pages/Dashboard/DashboardPage.tsx` — Current dossier-centric dashboard (will be replaced)
- `frontend/src/components/dashboard/index.ts` — Component barrel (components to be deleted)
- `frontend/src/services/dossier-dashboard.service.ts` — Current dashboard service (pattern reference)
- `frontend/src/hooks/useDossierDashboard.ts` — Current dashboard hook (pattern reference)

### Existing UI Components (reusable)

- `frontend/src/components/ui/timeline.tsx` — Timeline UI component
- `frontend/src/components/ui/card.tsx` — Card primitives
- `frontend/src/components/ui/calendar.tsx` — Calendar picker
- `frontend/src/domains/calendar/` — Calendar domain with repository

### Auth & Role System

- `frontend/src/store/authStore.ts` — User role field (`user_metadata.role`)
- `frontend/src/contexts/auth.context.tsx` — Auth context provider

### Navigation

- `frontend/src/components/layout/navigation-config.ts` — Sidebar nav config
- `frontend/src/routes/_protected/dashboard.tsx` — Dashboard route (entry point)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `DashboardPage.tsx` pattern: Tab-based layout with date range picker — structural pattern reusable even though content changes
- `RecentDossierActivity` component: Activity feed rendering pattern — adapt for engagement-focused activity
- `DossierQuickStatsCard`: Metric card pattern — layout/styling reusable for new Quick Stats cards
- `useDossierDashboard` hook: TanStack Query patterns for dashboard data fetching
- `useWorkCreation()` hook: Work palette integration for action bar
- `timeline.tsx` UI component: Base timeline rendering
- `calendar` domain: Event data access and calendar utilities
- `WorkItem.is_overdue` / `days_until_due`: Built-in overdue detection fields
- `LifecycleStage` enum + labels from Phase 9
- `useResponsive()` hook from Phase 5: Breakpoint detection for responsive layout

### Established Patterns

- Supabase RPC functions (e.g., `get_engagement_full`) — pattern for new dashboard RPCs
- TanStack Query with staleTime tiers from Phase 7 performance work
- Repository pattern (domains/{feature}/repositories/) — new dashboard hooks should follow this
- Bilingual labels pattern (ENGAGEMENT_TYPE_LABELS record) — reuse for stage/severity labels
- RTL-aware layouts using `useDirection()` hook and logical properties

### Integration Points

- `/dashboard` route: Replace DashboardPage content, keep route structure
- Sidebar navigation: Dashboard link already configured in Operations group
- Cmd+K palette: Already enhanced in Phase 8 — action bar [Cmd+K] button triggers existing palette
- Auth store: Read `user_metadata.role` for role detection
- Supabase Realtime: Existing subscription patterns for live updates
- `useWorkCreation()`: Wire into action bar [+ New Engagement] / [+ New Request] buttons

</code_context>

<specifics>
## Specific Ideas

- Priority grid layout with urgency flowing top-to-bottom mirrors how diplomats scan their day: "What's on fire?" → "What's coming up?" → "What's my pipeline?" → "What happened?"
- Green success banner for empty Attention zone celebrates being on top of things — positive reinforcement
- Role-based views are a "lens" not access control — leadership can check officer workload, analysts can see strategic overview. localStorage persistence means the user's preference sticks across sessions.
- Stalled engagement detection (14 days in same stage) catches forgotten engagements that slip through the cracks — a common diplomatic workflow problem
- Phase 9's `duration_in_stage_seconds` in `lifecycle_transitions` table provides the data backbone for stalled detection without additional tracking infrastructure

</specifics>

<deferred>
## Deferred Ideas

- **Configurable "due soon" threshold** — Let users set their own threshold (24h/48h/72h/7d) via settings. Currently hardcoded at 48h.
- **Stage-specific stall thresholds** — Different stall periods per lifecycle stage (e.g., intake 7d, execution 21d). Currently uniform 14d.
- **"Show team" toggle for Officer view** — Expand Officer view to show team's items alongside personal workload.
- **Process analytics widgets** — Avg time per lifecycle stage, bottleneck detection, throughput metrics. Mentioned in Phase 9 deferred ideas.
- **Dashboard widgets drag-and-drop** — Let users customize zone arrangement. Complex, belongs in a personalization phase.
- **Notification integration** — Push notifications for attention items. Separate feature scope.

</deferred>

---

_Phase: 10-operations-hub_
_Context gathered: 2026-03-30_
