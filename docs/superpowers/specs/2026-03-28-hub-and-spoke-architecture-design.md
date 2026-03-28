# Intl-Dossier v3.0: Hub-and-Spoke Architecture Design

**Date:** 2026-03-28
**Status:** Approved
**Milestone:** v3.0 "Connected Workflow"

## Problem Statement

The Intl-Dossier app has the right data and features but presents them as disconnected pages rather than a connected diplomatic workflow. Staff can't easily see the engagement lifecycle, can't work in context, and can't get an operational overview. The app doesn't reflect how international relations department staff actually work.

### Key Pain Points

1. The dossier experience is too generic — all 8 types look the same despite different use cases
2. Features are scattered across disconnected pages — hard to navigate
3. The flow between dossiers, engagements, work items, and briefings doesn't feel connected
4. The engagement lifecycle (preparation, execution, follow-up) is invisible in the UI
5. Multiple entry points (proactive, reactive, directive-driven) aren't supported naturally

## Domain Model

### How Diplomatic Work Actually Flows

- **Multiple entry points:** Work begins proactively (we initiate), reactively (we're invited), or directive-driven (leadership says "prepare for X" via intake)
- **Engagement lifecycle:** Each engagement follows Intake -> Preparation -> Briefing -> Execution -> Follow-up -> Closed, with a formal pipeline and role handoffs
- **Continuous monitoring:** Staff juggle multiple dossiers and engagements simultaneously; there's no single linear path
- **Fluid roles:** At least 3 perspectives (leadership, officers, analysts) but people move between roles fluidly

### Dossier Hierarchy (4 Tiers)

| Tier           | Types                      | Role                                                                              |
| -------------- | -------------------------- | --------------------------------------------------------------------------------- |
| **Anchors**    | Countries, Organizations   | The "who" — persistent entities with ongoing relationships                        |
| **Activities** | Engagements, Forums        | The "what's happening" — time-bound diplomatic events                             |
| **Threads**    | Topics, Working Groups     | The "about what" — cross-cutting themes that weave through anchors and activities |
| **Contacts**   | Persons, Elected Officials | The "who specifically" — individuals involved across all of the above             |

### Core Features (8)

Kanban/Work Items, Calendar, Analytics/Dashboard, Audit/Compliance, Document Management, Search, Intake, Dossier CRUD

### Nice-to-Have Features (3)

AI Briefings, Network Graph, Availability Polling — available but not prominent; absorbed into workspace actions rather than standalone pages.

## Architecture: Hub-and-Spoke

Three hubs, each serving a different mindset:

1. **Operations Hub** (dashboard) — "what needs my attention" across all active work
2. **Dossier Hub** — organized by the 4-tier hierarchy with enriched detail pages
3. **Engagement Workspace** — a unified view for one engagement with lifecycle timeline

### Navigation & Information Architecture

#### Sidebar Structure

```
OPERATIONS
  Dashboard               <- Operations Hub (home screen)
  My Tasks                <- Cross-engagement kanban
  Calendar                <- Cross-engagement calendar
  Intake Queue            <- Directive-driven entry point

DOSSIERS
  Countries               <- Anchors
  Organizations
  Engagements             <- Activities
  Forums
  Topics                  <- Threads
  Working Groups
  Persons                 <- Contacts
  Elected Officials

ADMINISTRATION
  Audit Logs
  Compliance
  Settings

[Cmd+K Quick Switcher]    <- Always available
```

Key changes:

- **Operations group** at top — daily-use tools (dashboard, tasks, calendar, intake)
- **Dossiers group** ordered by 4-tier hierarchy (anchors first, contacts last)
- **Administration** separated — not daily-use
- **Demo pages removed** from production (behind dev flag)
- **Duplicate routes eliminated** — single route per entity
- **Quick Switcher (Cmd+K)** prominently shown

#### Route Structure

```
/dashboard                          <- Operations Hub
/tasks                              <- My Tasks (kanban, all user's work)
/calendar                           <- Calendar (all events)
/intake                             <- Intake queue

/dossiers/countries                 <- Country list
/dossiers/countries/:id             <- Country detail (enriched)
/dossiers/organizations             <- Org list
/dossiers/organizations/:id         <- Org detail (enriched)
/dossiers/engagements               <- Engagement list
/dossiers/engagements/:id           <- Engagement Workspace
/dossiers/engagements/:id/tasks     <- Workspace tab: kanban
/dossiers/engagements/:id/calendar  <- Workspace tab: events
/dossiers/engagements/:id/docs      <- Workspace tab: documents
/dossiers/engagements/:id/audit     <- Workspace tab: audit trail
/dossiers/forums                    <- Forum list
/dossiers/forums/:id                <- Forum Workspace
/dossiers/topics                    <- Topic list
/dossiers/topics/:id                <- Topic detail (enriched)
/dossiers/working-groups            <- Working Group list
/dossiers/working-groups/:id        <- Working Group detail
/dossiers/persons                   <- Person list
/dossiers/persons/:id               <- Person detail
/dossiers/elected-officials         <- Elected Official list
/dossiers/elected-officials/:id     <- Elected Official detail

/admin/audit-logs                   <- Global audit
/admin/compliance                   <- Data retention, legal holds
/admin/settings                     <- System config
```

#### Mobile Navigation

Bottom tab bar with 4 items:

- **Dashboard** (Operations Hub)
- **Dossiers** (opens type picker)
- **Tasks** (My Tasks kanban)
- **More** (calendar, intake, admin, search)

## Operations Hub (Dashboard)

The dashboard transforms from a metrics display into an operational nerve center.

### Layout (3 Zones)

**Zone 1 — Action Bar (top):**

- [+ New Engagement] [+ New Request] [Cmd+K Search]
- Primary actions always visible

**Zone 2 — Left Column:**

- **Attention Needed:** Overdue items (red), due-soon items (yellow) — tasks, SLA breaches, commitments
- **Active Engagements:** Grouped by lifecycle stage (preparation, in-progress, follow-up) with counts

**Zone 3 — Right Column:**

- **Timeline:** Today's events, tomorrow, this week — chronological view of upcoming calendar items
- **Recent Activity:** Activity feed across all dossiers
- **Quick Stats:** Active engagements count, open tasks, SLA at risk

### Role-Adaptive Behavior

Default filters based on user role from `profiles.role` column (not hard-gated — any user can switch view via a dropdown):

| Role       | Attention Needed                                    | Active Engagements               | Default View       |
| ---------- | --------------------------------------------------- | -------------------------------- | ------------------ |
| Leadership | Escalations, SLA breaches, pending approvals        | All by strategic priority        | Strategic overview |
| Officers   | My assigned tasks, my engagements due soon          | Only my engagements by lifecycle | My workload        |
| Analysts   | Research requests, briefing deadlines, intake queue | Engagements I support            | My research queue  |

### Interactions

- Click overdue item -> navigates to entity (task, engagement, intake)
- Click engagement -> opens Engagement Workspace
- Click calendar event -> opens engagement workspace at relevant date
- "+ New Engagement" -> create flow with smart defaults
- "+ New Request" -> intake form

## Dossier Hub — Enriched Detail Pages

### Shared Structure (All 8 Types)

Every dossier detail page has:

- **Header Bar:** Icon/flag, name, tier badge, status, last updated, [Edit] [More]
- **Tab Bar:** Overview, Engagements, Docs, Tasks, Timeline, Audit
- **Relationship Sidebar (collapsible):** Linked dossiers grouped by tier, quick-add, relationship type labels

### Type-Specific Enrichments

#### Anchors (Countries, Organizations)

**Countries:**

- Overview: key metadata, relationship health score, active engagement count, recent commitments status
- Bilateral relationship summary
- Key contacts at a glance
- Engagements tab: all engagements involving this country, grouped by lifecycle stage

**Organizations:**

- Overview: key metadata, relationship health, active engagements
- Membership structure
- Key representatives
- MoUs/agreements tracker
- Engagements tab: all engagements with this organization

#### Activities (Engagements, Forums)

These open as **Workspaces** (see Engagement Workspace section below), not the standard dossier layout.

- Engagements: full lifecycle treatment with 6-stage bar
- Forums: recurring-event variant with sessions list, per-session mini-workspaces

#### Threads (Topics, Working Groups)

**Topics:**

- Overview: description, scope, related policy positions
- Cross-cutting view: which anchors and activities connect to this thread
- Position tracker: our stance, counterpart stances, evolution over time

**Working Groups:**

- Overview: description, mandate, status
- Member list with roles
- Meeting schedule
- Deliverables tracker

#### Contacts (Persons, Elected Officials)

**Persons:**

- Overview: bio, role, organization affiliation, relationship to us
- Engagement history: every engagement this person was involved in, chronologically

**Elected Officials:**

- Overview: bio, role, term/office metadata
- Committee memberships
- Engagement history
- (New dossier type — currently missing, needs implementation)

### Relationship Sidebar

Collapsible right panel on every dossier detail page:

- Linked dossiers grouped by tier (anchors, activities, threads, contacts)
- Quick-add to link a new dossier
- Click any linked dossier to navigate
- Relationship type labels (primary, advisory, counterpart, etc.)

Replaces the need for a separate relationships page — connections always visible in context.

## Engagement Workspace

The heart of the redesign — where the lifecycle becomes tangible.

### Lifecycle Bar

Always visible at the top of the workspace:

```
 Intake -> Preparation -> Briefing -> Execution -> Follow-up -> Closed
```

- Current stage highlighted with filled indicator
- Click completed stage to see its summary
- Click current stage to see what's pending
- Stage transitions driven by task completion — system suggests advancing when stage tasks are done
- Not rigid — staff can skip stages or move backward (guide, not gate)
- Metadata: deadline, assignee, priority, linked intake request

### Workspace Tabs

**Overview:**

- Engagement summary (type, date, location, objective)
- Participants (linked persons/elected officials)
- Key decisions made so far
- "What's next" action card — most important pending item

**Context:**

- Linked dossiers organized by tier (anchors, activities, threads, contacts)
- Compact dossier cards with relationship health, last interaction
- [+ Link Dossier] to add connections

**Tasks:**

- Kanban board filtered to this engagement only
- Columns grouped by lifecycle stage (preparation tasks, briefing tasks, execution tasks, follow-up tasks)
- SLA indicators on tasks with deadlines
- [+ Add Task] pre-linked to this engagement
- Commitments from after-action records automatically appear as follow-up tasks

**Calendar:**

- Events related to this engagement only
- Meeting schedule, prep sessions, deadlines
- Conflict detection with other engagements
- [+ Add Event] pre-linked to this engagement

**Docs:**

- Documents linked to this engagement
- Organized by stage (prep materials, briefing packs, meeting minutes, after-action reports)
- Upload and PDF generation in-place
- Version comparison for evolving documents
- "Generate Briefing" action button (AI briefings absorbed here)

**Audit:**

- Activity timeline for this engagement
- Who changed what, when
- Stage transitions logged automatically

### Forums as Recurring Workspaces

Same workspace pattern plus:

- Sessions list — a forum has multiple sessions (annual assembly, quarterly meeting)
- Each session is a mini-workspace with the same lifecycle
- Forum-level overview shows cross-session trends and standing positions

### Entry Point Matrix

| Entry Point                        | Path to Workspace                             |
| ---------------------------------- | --------------------------------------------- |
| Dashboard -> overdue task          | Workspace -> Tasks tab, task highlighted      |
| Dashboard -> engagement card       | Workspace -> Overview tab                     |
| Country dossier -> engagement list | Workspace -> Context tab (country pre-linked) |
| Intake queue -> approved request   | Workspace -> Overview, lifecycle at "Intake"  |
| Calendar -> event click            | Workspace -> Calendar tab, event highlighted  |
| Search -> engagement result        | Workspace -> Overview tab                     |
| My Tasks -> task click             | Workspace -> Tasks tab, task highlighted      |

## Feature Integration

### Feature Placement Matrix

| Feature              | Home Location                               | Appears In Context                               |
| -------------------- | ------------------------------------------- | ------------------------------------------------ |
| Kanban/Work Items    | `/tasks` (all my work)                      | Workspace -> Tasks tab (filtered)                |
| Calendar             | `/calendar` (all events)                    | Workspace -> Calendar tab (filtered)             |
| Intake               | `/intake` (queue)                           | Dashboard -> Attention Needed; lifecycle trigger |
| Search               | `Cmd+K` quick switcher                      | Always available globally                        |
| Document Mgmt        | Per-dossier Docs tab                        | Workspace -> Docs tab                            |
| Audit/Compliance     | `/admin/audit-logs` (global)                | Every dossier/workspace -> Audit tab (filtered)  |
| Analytics            | Dashboard widgets + dossier overview cards  | Dissolved into context                           |
| AI Briefings         | Workspace -> Docs tab "Generate" button     | Action, not a page                               |
| Network Graph        | Relationship Sidebar expandable view        | Visualization mode, not a page                   |
| Availability Polling | Workspace -> Calendar tab "Schedule" action | Action, not a page                               |

### Pages Eliminated or Absorbed

| Current Page                                           | Becomes                                    |
| ------------------------------------------------------ | ------------------------------------------ |
| `/analytics.tsx`                                       | Dashboard widgets + dossier overview cards |
| `/briefings.tsx`, `/briefs.tsx`, `/briefing-books.tsx` | "Generate" action in workspace Docs tab    |
| `/intelligence.tsx`                                    | Merged into AI briefing action             |
| `/network/*`                                           | Expandable view in Relationship Sidebar    |
| `/availability-polling.tsx`                            | Action inside Calendar tab                 |
| `/activity.tsx`                                        | Dashboard -> Recent Activity zone          |
| `/advanced-search.tsx`                                 | Enhanced Cmd+K quick switcher              |
| `/export-import.tsx`                                   | Action buttons in list views               |
| `/duplicate-detection-demo.tsx`                        | Removed (demo)                             |
| 10+ `*-demo.tsx` pages                                 | Removed from production                    |

### Pages That Stay Standalone

`/dashboard`, `/tasks`, `/calendar`, `/intake`, `/admin/audit-logs`, `/admin/compliance`, `/admin/settings`, all `/dossiers/{type}` list and detail views.

## Cleanup & Consolidation

### Route Cleanup

- Remove 10+ demo pages from production navigation (move behind `VITE_DEV_MODE` flag)
- Eliminate ~15 duplicate/orphan routes
- Remove absorbed standalone feature pages

### Elected Official — Missing 8th Type

- List page at `/dossiers/elected-officials`
- Detail page with Contact-tier enrichments (term/office, committees)
- Domain: `domains/elected-officials/` with repository, hooks, types
- Database: verify table exists with RLS policies

### New Shared Components

| Component             | Purpose                        | Used By                                      |
| --------------------- | ------------------------------ | -------------------------------------------- |
| `LifecycleBar`        | 6-stage progress indicator     | Engagement Workspace, Forum Workspace        |
| `DossierCard`         | Compact dossier preview card   | Relationship Sidebar, Context tab, Dashboard |
| `RelationshipSidebar` | Linked dossiers panel          | All dossier detail pages                     |
| `WorkspaceShell`      | Tab layout for workspaces      | Engagements, Forums                          |
| `AttentionCard`       | Overdue/due-soon item card     | Dashboard -> Attention Needed                |
| `StageKanban`         | Lifecycle-aware kanban columns | Workspace -> Tasks tab                       |

### Existing Components to Refactor

- `NavigationShell` -> updated sidebar (hub-based groups)
- `AdvancedDataTable` -> stays, consistent filter/sort patterns across list views
- `AdaptiveDialog` -> stays, used for create/edit flows

### Domain Architecture Changes

**New domain:** `elected-officials` (repository, hooks, types)

**Modified domains:**

- `engagements` — lifecycle_stage field + stage transition logic
- `work-items` — engagement scope filtering, lifecycle-stage grouping
- `calendar` — engagement scope filtering

**Unchanged domains:** dossiers, relationships, search, audit, documents, tags, positions, import

### Database Changes (Minimal)

- `engagements` table: add `lifecycle_stage` enum (`intake`, `preparation`, `briefing`, `execution`, `follow_up`, `closed`)
- `work_items` table: add optional `lifecycle_stage` reference for stage-grouped kanban
- Verify `elected_officials` table exists with proper RLS

## Implementation Phasing

### Phase 1: Navigation & Route Consolidation

- New sidebar structure (hub-based groups)
- Eliminate duplicate routes
- Remove demo pages from production
- Route consolidation under `/dossiers/{type}/`

### Phase 2: Operations Hub (Dashboard Redesign)

- Attention Needed zone (overdue, due soon)
- Timeline zone (upcoming calendar events)
- Active Engagements by lifecycle stage
- Recent Activity + Quick Stats
- Role-adaptive default filters

### Phase 3: Engagement Workspace

- WorkspaceShell component with tabs
- LifecycleBar component with 6 stages
- Overview tab with "what's next" action card
- Context tab (linked dossiers by tier)
- Tasks tab (scoped kanban)
- Calendar tab (scoped events)
- Docs tab (with briefing generation action)
- Audit tab (scoped timeline)

### Phase 4: Dossier Hub — Enriched Detail Pages

- Shared structure (header, tabs, relationship sidebar)
- Anchor enrichments (countries: bilateral, orgs: membership/MoUs)
- Thread enrichments (topics: position tracker, working groups: deliverables)
- Contact enrichments (persons: history, elected officials: new type)
- RelationshipSidebar component

### Phase 5: Feature Absorption

- Analytics -> dashboard widgets + dossier overview cards
- AI Briefings -> workspace Docs tab action
- Network Graph -> relationship sidebar expandable view
- Availability Polling -> calendar tab action
- Search -> enhanced Cmd+K quick switcher
- Remove absorbed standalone pages

### Phase 6: Lifecycle Engine

- `lifecycle_stage` database column on engagements
- Stage transition logic (task-completion driven suggestions)
- Lifecycle-grouped kanban columns
- Forum recurring session support
- Intake -> Engagement promotion flow

## Out of Scope

- New features beyond what exists today
- Mobile native app
- Real-time chat
- Video content
- Major database schema redesign

## Success Criteria

1. A staff member opens the app and immediately sees what needs their attention
2. Clicking into any engagement shows the full lifecycle — where we are, what's done, what's next
3. Every core feature is reachable within 1-2 clicks from the context where it's needed
4. The same workflow works whether it started from a directive, a dossier review, or a calendar event
5. No orphan pages — every route serves a clear purpose in the hub-and-spoke architecture

---

_Spec created: 2026-03-28_
_Approach: Hub-and-Spoke Architecture (Option C)_
_Milestone target: v3.0 "Connected Workflow"_
