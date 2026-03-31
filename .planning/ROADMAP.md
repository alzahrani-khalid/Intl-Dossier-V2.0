# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- 🚧 **v3.0 Connected Workflow** — Phases 8-13 (in progress)

## Phases

<details>
<summary>✅ v2.0 Production Quality (Phases 1-7) — SHIPPED 2026-03-28</summary>

- [x] Phase 1: Dead Code & Toolchain (3/3 plans) — ESLint 9, Prettier, Knip, pre-commit hooks
- [x] Phase 2: Naming & File Structure (3/3 plans) — consistent naming enforced via ESLint
- [x] Phase 3: Security Hardening (3/3 plans) — auth, RBAC, CSP, Zod, RLS
- [x] Phase 4: RTL/LTR Consistency (6/6 plans) — useDirection, LtrIsolate, logical properties
- [x] Phase 5: Responsive Design (5/5 plans) — mobile-first, touch targets, card views
- [x] Phase 6: Architecture Consolidation (5/5 plans) — domain repos, apiClient, service dedup
- [x] Phase 7: Performance Optimization (4/4 plans) — bundle budget, query tiers, memoization

Full details: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

### 🚧 v3.0 Connected Workflow (In Progress)

**Milestone Goal:** Transform disconnected pages into a connected hub-and-spoke architecture reflecting how diplomatic staff actually work — multiple entry points, engagement lifecycle, and operational overview.

**Phase Numbering:** Continues from v2.0 (Phase 7 was last). Decimal phases (e.g., 8.1) reserved for urgent insertions.

- [ ] **Phase 8: Navigation & Route Consolidation** - Clean route tree, hub-based sidebar, eliminate duplicates and demo pages
- [ ] **Phase 9: Lifecycle Engine** - DB schema for engagement lifecycle stages, transition API, forum sessions
- [x] **Phase 10: Operations Hub** - Redesigned dashboard with attention zones, timeline, and role-adaptive defaults (completed 2026-03-31)
- [x] **Phase 11: Engagement Workspace** - Tabbed workspace shell with lifecycle bar, scoped views, and URL-driven tabs (completed 2026-03-31)
- [x] **Phase 12: Enriched Dossier Pages** - Shared detail shell, RelationshipSidebar, tier-specific enrichments, Elected Officials domain (completed 2026-03-31)
- [ ] **Phase 13: Feature Absorption** - Absorb standalone pages into contextual locations, Cmd+K quick switcher

## Phase Details

### Phase 8: Navigation & Route Consolidation

**Goal**: Users navigate through a clean, hub-based sidebar with no duplicate routes or demo clutter
**Depends on**: Nothing (first phase of v3.0; builds on v2.0 foundation)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06
**Success Criteria** (what must be TRUE):

1. User sees sidebar organized into 3 groups (Operations, Dossiers, Administration) on desktop
2. User on mobile sees bottom tab bar with 4 items (Dashboard, Dossiers, Tasks, More) instead of sidebar
3. All 8 dossier types are accessible under `/dossiers/{type}/` with consistent URL structure
4. No duplicate or orphan routes exist — navigating old paths redirects to canonical routes
5. Demo pages are invisible in production (only accessible with `VITE_DEV_MODE` flag)

**Plans:** 4 plans

Plans:

- [x] 08-01-PLAN.md — Sidebar restructure: 3-group nav config + AppSidebar refactor (NAV-01, NAV-02)
- [x] 08-02-PLAN.md — Route cleanup: demo page gating + duplicate route redirects (NAV-03, NAV-04)
- [x] 08-03-PLAN.md — Mobile bottom tab bar with scroll-aware auto-hide (NAV-05)
- [x] 08-04-PLAN.md — Enhanced Cmd+K command palette with recents + grouped search (NAV-06)

**UI hint**: yes

### Phase 9: Lifecycle Engine

**Goal**: Engagements have a lifecycle stage system that tracks progression from intake through closure, with flexible transitions and audit logging
**Depends on**: Phase 8 (clean route structure needed before adding lifecycle-dependent routes)
**Requirements**: LIFE-01, LIFE-02, LIFE-03, LIFE-04, LIFE-05, LIFE-06
**Success Criteria** (what must be TRUE):

1. Every engagement has a `lifecycle_stage` field showing one of 6 stages (intake, preparation, briefing, execution, follow_up, closed)
2. User can transition an engagement between stages in any direction (skip forward, move backward) with the system suggesting but never blocking
3. Promoting an intake request creates a new engagement starting at the "intake" lifecycle stage with pre-populated fields
4. Work items can reference a lifecycle stage, enabling stage-grouped display
5. Forum sessions support independent lifecycle tracking per recurring session

**Plans:** 5 plans

Plans:

- [ ] 09-PLAN-01.md — Schema + types + i18n: DB migrations, frontend types, locale files, test stubs (LIFE-01, LIFE-02, LIFE-03, LIFE-04, LIFE-05, LIFE-06)
- [ ] 09-PLAN-02.md — Backend API + hooks: Edge Function lifecycle/promotion endpoints, repository functions, TanStack Query hooks (LIFE-02, LIFE-03, LIFE-04, LIFE-06)
- [ ] 09-PLAN-03.md — Stepper + Timeline UI: LifecycleStepperBar and LifecycleTimeline components (LIFE-01, LIFE-02, LIFE-03, LIFE-06)
- [ ] 09-PLAN-04.md — Promotion + Forum UI: IntakePromotionDialog, ForumSessionCreator, ConvertedTicketBanner (LIFE-04, LIFE-05, LIFE-06)
- [ ] 09-PLAN-05.md — Integration wiring: Wire all components into host pages + human verification (LIFE-01, LIFE-02, LIFE-03, LIFE-04, LIFE-05, LIFE-06)

**UI hint**: yes

### Phase 10: Operations Hub

**Goal**: Users land on a role-adaptive dashboard that surfaces what needs attention now, upcoming events, and active engagement status at a glance
**Depends on**: Phase 9 (requires `lifecycle_stage` for engagement grouping)
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07
**Success Criteria** (what must be TRUE):

1. User sees Attention Needed zone with overdue items (red) and due-soon items (yellow) across all engagements
2. User sees Timeline zone with chronological upcoming events grouped by today, tomorrow, and this week
3. User sees Active Engagements grouped by lifecycle stage with counts per stage
4. Dashboard defaults adapt to user role (leadership sees strategic overview, officers see workload, analysts see research queue) with a dropdown to switch views
5. User can click any dashboard item to navigate directly to the relevant entity or workspace

**Plans:** 4/4 plans complete

Plans:

- [x] 10-01-PLAN.md — Data foundation: Supabase RPC migrations, TypeScript types, domain repository, TanStack Query hooks, role preference, i18n (OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-07)
- [x] 10-02-PLAN.md — Zone components: AttentionZone, TimelineZone, EngagementsZone, QuickStatsBar, ActivityFeed (OPS-01, OPS-02, OPS-03, OPS-04)
- [x] 10-03-PLAN.md — Page assembly: ActionBar, RoleSwitcher, ZoneCollapsible, OperationsHub page, route wiring (OPS-05, OPS-06, OPS-07)
- [x] 10-04-PLAN.md — Realtime subscriptions, old dashboard cleanup, human verification (OPS-01, OPS-06)

**UI hint**: yes

### Phase 11: Engagement Workspace

**Goal**: Users work within a persistent, tabbed engagement workspace with lifecycle awareness, scoped views, and deep-linkable tabs
**Depends on**: Phase 9 (lifecycle stages), Phase 10 (Operations Hub links into workspaces)
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09, WORK-10
**Success Criteria** (what must be TRUE):

1. User sees WorkspaceShell with persistent tab navigation (Overview, Context, Tasks, Calendar, Docs, Audit) when viewing any engagement
2. LifecycleBar at the top of the workspace shows all 6 stages with the current stage highlighted; clicking completed stages shows their summary
3. Each tab (Tasks, Calendar, Docs, Audit) shows content scoped to this engagement only, not global data
4. Workspace tabs are URL-driven via nested routes — sharing a URL like `/engagements/123/tasks` opens directly to the Tasks tab
5. All workspace tabs are lazy-loaded via route-based code splitting (no tab renders until visited)

**Plans:** 5/5 plans complete

Plans:

- [x] 11-01-PLAN.md — WorkspaceShell + TabNav + TabSkeleton + i18n + route restructure (WORK-01, WORK-10)
- [x] 11-02-PLAN.md — LifecycleBar popover enhancement + transition interaction (WORK-02, WORK-03)
- [x] 11-03-PLAN.md — Overview tab + Context tab content (WORK-04, WORK-05)
- [x] 11-04-PLAN.md — Tasks tab (kanban) + Calendar tab + Docs tab content (WORK-06, WORK-07, WORK-08)
- [x] 11-05-PLAN.md — Audit tab + dossier redirect + human verification (WORK-09, WORK-10)

**UI hint**: yes

### Phase 12: Enriched Dossier Pages

**Goal**: All 8 dossier types share a consistent detail page structure with RelationshipSidebar and tier-specific enrichments, including Elected Officials as a full domain
**Depends on**: Phase 11 (WorkspaceShell patterns and react-resizable-panels reused here)
**Requirements**: DOSS-01, DOSS-02, DOSS-03, DOSS-04, DOSS-05, DOSS-06, DOSS-07, DOSS-08, DOSS-09, DOSS-10
**Success Criteria** (what must be TRUE):

1. All 8 dossier types render with consistent structure: header bar, tab bar, and collapsible RelationshipSidebar
2. RelationshipSidebar shows linked dossiers grouped by tier with quick-add action and click-to-navigate; hidden on mobile, replaced by sheet/drawer
3. Country and Organization detail pages show tier-specific enrichments (bilateral summary, MoU tracker) beyond the shared shell
4. Elected Officials has a full list page, detail page with term/office metadata and committee memberships
5. Dossier detail tabs (Engagements, Docs, Tasks, Timeline, Audit) behave consistently across all 8 types

**Plans:** 5/5 plans complete

Plans:

- [x] 12-01-PLAN.md — DossierShell + DossierTabNav + RelationshipSidebar + i18n + dossier-routes update (DOSS-01, DOSS-02, DOSS-09, DOSS-10)
- [x] 12-02-PLAN.md — Convert all 7 existing dossier types to nested tab routes with DossierShell layout (DOSS-01, DOSS-10)
- [x] 12-03-PLAN.md — Elected Officials domain: backend API, list page, detail routes, types, hooks, i18n, nav config (DOSS-08)
- [x] 12-04-PLAN.md — Country, Organization, Topic enrichment cards + overview tab pages (DOSS-03, DOSS-04, DOSS-05)
- [x] 12-05-PLAN.md — Working Group, Person, Forum, Elected Official enrichment cards + human verification (DOSS-06, DOSS-07, DOSS-08, DOSS-09, DOSS-10)

**UI hint**: yes

### Phase 13: Feature Absorption

**Goal**: Standalone feature pages are absorbed into their contextual locations within the hub-and-spoke architecture, and a global Cmd+K quick switcher replaces advanced search
**Depends on**: Phase 10 (dashboard destinations), Phase 11 (workspace destinations), Phase 12 (sidebar destinations)
**Requirements**: ABSORB-01, ABSORB-02, ABSORB-03, ABSORB-04, ABSORB-05, ABSORB-06
**Success Criteria** (what must be TRUE):

1. Analytics content appears as dashboard widgets and dossier overview cards — no standalone analytics page exists
2. AI Briefing generation is accessible via "Generate" action in workspace Docs tab — no standalone briefing page exists
3. Cmd+K quick switcher searches across all entity types, recent items, and commands from any page
4. Network graph visualization is accessible via expandable view in RelationshipSidebar — no standalone network page exists
5. Standalone pages for analytics, briefings, network graph, search, polling, and export are removed; their functionality lives in contextual locations
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12 → 13
Decimal phases (if inserted) execute between their surrounding integers.

| Phase                               | Milestone | Plans Complete | Status      | Completed  |
| ----------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Dead Code & Toolchain            | v2.0      | 3/3            | Complete    | 2026-03-23 |
| 2. Naming & File Structure          | v2.0      | 3/3            | Complete    | 2026-03-23 |
| 3. Security Hardening               | v2.0      | 3/3            | Complete    | 2026-03-24 |
| 4. RTL/LTR Consistency              | v2.0      | 6/6            | Complete    | 2026-03-25 |
| 5. Responsive Design                | v2.0      | 5/5            | Complete    | 2026-03-26 |
| 6. Architecture Consolidation       | v2.0      | 5/5            | Complete    | 2026-03-27 |
| 7. Performance Optimization         | v2.0      | 4/4            | Complete    | 2026-03-28 |
| 8. Navigation & Route Consolidation | v3.0      | 4/4            | Complete    | 2026-03-28 |
| 9. Lifecycle Engine                 | v3.0      | 0/5            | Planned     | -          |
| 10. Operations Hub                  | v3.0      | 4/4            | Complete    | 2026-03-31 |
| 11. Engagement Workspace            | v3.0      | 5/5            | Complete    | 2026-03-31 |
| 12. Enriched Dossier Pages          | v3.0      | 5/5 | Complete   | 2026-03-31 |
| 13. Feature Absorption              | v3.0      | 0/TBD          | Not started | -          |
