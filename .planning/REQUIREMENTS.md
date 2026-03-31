# Requirements: Intl-Dossier v3.0 Connected Workflow

**Defined:** 2026-03-28
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## v3.0 Requirements

Requirements for hub-and-spoke architecture redesign. Each maps to roadmap phases.

### Navigation & Route Consolidation

- [x] **NAV-01**: User sees hub-based sidebar with 3 groups (Operations, Dossiers, Administration) replacing current flat navigation
- [x] **NAV-02**: User can navigate to all 8 dossier types under `/dossiers/{type}/` with consistent URL structure
- [x] **NAV-03**: User does not encounter duplicate or orphan routes — ~15 duplicates eliminated, single route per entity
- [x] **NAV-04**: User does not see demo pages in production — 10+ demo pages moved behind `VITE_DEV_MODE` flag
- [x] **NAV-05**: User on mobile sees bottom tab bar with 4 items (Dashboard, Dossiers, Tasks, More) replacing sidebar
- [x] **NAV-06**: User can access Cmd+K quick switcher from any page to search and navigate globally

### Lifecycle Engine

- [x] **LIFE-01**: Engagements have a `lifecycle_stage` field with 6 stages: intake, preparation, briefing, execution, follow_up, closed
- [x] **LIFE-02**: User can transition an engagement between lifecycle stages — system suggests advancing when stage tasks complete (guide, not gate)
- [x] **LIFE-03**: User can skip stages or move backward — lifecycle is flexible, not rigid
- [x] **LIFE-04**: User can promote an approved intake request into a new engagement at the "intake" lifecycle stage
- [x] **LIFE-05**: Work items can optionally reference a lifecycle stage for stage-grouped kanban display
- [x] **LIFE-06**: Forums support recurring sessions — each session has its own lifecycle and mini-workspace

### Operations Hub (Dashboard)

- [x] **OPS-01**: User sees Attention Needed zone showing overdue items (red) and due-soon items (yellow) across all engagements
- [x] **OPS-02**: User sees Timeline zone with chronological upcoming events (today, tomorrow, this week)
- [x] **OPS-03**: User sees Active Engagements grouped by lifecycle stage with counts
- [x] **OPS-04**: User sees Quick Stats (active engagements, open tasks, SLA at risk) and Recent Activity feed
- [x] **OPS-05**: Dashboard defaults adapt to user role (leadership: strategic overview, officers: my workload, analysts: research queue) with dropdown to switch
- [x] **OPS-06**: User can click any dashboard item to navigate directly to the relevant entity or workspace
- [x] **OPS-07**: User sees action bar with [+ New Engagement], [+ New Request], and [Cmd+K] always visible

### Engagement Workspace

- [x] **WORK-01**: User sees WorkspaceShell with persistent tab navigation (Overview, Context, Tasks, Calendar, Docs, Audit) when viewing an engagement
- [ ] **WORK-02**: User sees LifecycleBar at top of workspace showing all 6 stages with current stage highlighted
- [ ] **WORK-03**: User can click completed lifecycle stages to see their summary; click current stage to see pending items
- [x] **WORK-04**: Overview tab shows engagement summary, participants, key decisions, and "what's next" action card
- [x] **WORK-05**: Context tab shows linked dossiers organized by tier (anchors, activities, threads, contacts) with [+ Link Dossier] action
- [ ] **WORK-06**: Tasks tab shows scoped kanban filtered to this engagement, with columns grouped by lifecycle stage
- [ ] **WORK-07**: Calendar tab shows events for this engagement only, with conflict detection and [+ Add Event] pre-linked
- [ ] **WORK-08**: Docs tab shows documents organized by stage with upload capability and "Generate Briefing" AI action
- [ ] **WORK-09**: Audit tab shows activity timeline scoped to this engagement with stage transitions logged
- [x] **WORK-10**: Workspace tabs are URL-driven (nested routes) enabling deep-linking to specific tabs

### Enriched Dossier Pages

- [x] **DOSS-01**: All 8 dossier types share a consistent detail page structure: header bar, tab bar, and collapsible RelationshipSidebar
- [x] **DOSS-02**: RelationshipSidebar shows linked dossiers grouped by tier with quick-add, relationship type labels, and click-to-navigate
- [ ] **DOSS-03**: Country detail pages show bilateral relationship summary, key contacts at a glance, and engagements grouped by lifecycle stage
- [ ] **DOSS-04**: Organization detail pages show membership structure, key representatives, and MoU/agreements tracker
- [ ] **DOSS-05**: Topic detail pages show cross-cutting view (connected anchors and activities) and position tracker (our stance vs counterpart stances)
- [ ] **DOSS-06**: Working Group detail pages show member list with roles, meeting schedule, and deliverables tracker
- [ ] **DOSS-07**: Person detail pages show engagement history chronologically with organization affiliation
- [x] **DOSS-08**: Elected Officials implemented as full domain — list page, detail page with term/office metadata and committee memberships
- [x] **DOSS-09**: RelationshipSidebar is hidden on mobile, replaced by sheet/drawer pattern
- [x] **DOSS-10**: Dossier detail tabs include Engagements, Docs, Tasks, Timeline, and Audit with consistent behavior across types

### Feature Absorption

- [ ] **ABSORB-01**: Analytics content absorbed into dashboard widgets and dossier overview cards — standalone analytics page removed
- [ ] **ABSORB-02**: AI Briefings absorbed into workspace Docs tab "Generate" action — standalone briefing pages removed
- [ ] **ABSORB-03**: Search enhanced into Cmd+K quick switcher with entity search, recent items, and command palette — advanced search page removed
- [ ] **ABSORB-04**: Network graph absorbed into RelationshipSidebar expandable visualization view — standalone network pages removed
- [ ] **ABSORB-05**: Availability polling absorbed into Calendar tab "Schedule" action — standalone polling page removed
- [ ] **ABSORB-06**: Export/Import absorbed into action buttons on list views — standalone export page removed

## Future Requirements

Deferred to subsequent milestone. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Real-time collaborative editing within engagement workspaces
- **ADV-02**: Custom dashboard widget arrangement via drag-and-drop
- **ADV-03**: Notification system with in-app and email channels
- **ADV-04**: Advanced analytics with trend analysis and predictive insights

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                               | Reason                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Drag-and-drop dashboard customization | Anti-feature per research — configuration complexity, rarely used after initial novelty |
| Notification system                   | High complexity, tangential to hub-and-spoke redesign — defer to dedicated milestone    |
| Rigid stage-gating                    | Anti-feature — lifecycle must guide, not gate; diplomatic work is non-linear            |
| AI suggestions everywhere             | Anti-feature — AI briefing generation stays as explicit action, not ambient suggestions |
| Mobile native app                     | Cancelled in v2.0 — web-only going forward                                              |
| OAuth/social login                    | Email/password sufficient; revisit if user base grows                                   |
| Real-time chat                        | High complexity, not core to dossier management                                         |
| New features beyond existing          | v3.0 is reorganization and enrichment, not new capabilities                             |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| NAV-01      | Phase 8  | Complete |
| NAV-02      | Phase 8  | Complete |
| NAV-03      | Phase 8  | Complete |
| NAV-04      | Phase 8  | Complete |
| NAV-05      | Phase 8  | Complete |
| NAV-06      | Phase 8  | Complete |
| LIFE-01     | Phase 9  | Complete |
| LIFE-02     | Phase 9  | Complete |
| LIFE-03     | Phase 9  | Complete |
| LIFE-04     | Phase 9  | Complete |
| LIFE-05     | Phase 9  | Complete |
| LIFE-06     | Phase 9  | Complete |
| OPS-01      | Phase 10 | Complete |
| OPS-02      | Phase 10 | Complete |
| OPS-03      | Phase 10 | Complete |
| OPS-04      | Phase 10 | Complete |
| OPS-05      | Phase 10 | Complete |
| OPS-06      | Phase 10 | Complete |
| OPS-07      | Phase 10 | Complete |
| WORK-01     | Phase 11 | Complete |
| WORK-02     | Phase 11 | Pending |
| WORK-03     | Phase 11 | Pending |
| WORK-04     | Phase 11 | Complete |
| WORK-05     | Phase 11 | Complete |
| WORK-06     | Phase 11 | Pending |
| WORK-07     | Phase 11 | Pending |
| WORK-08     | Phase 11 | Pending |
| WORK-09     | Phase 11 | Pending |
| WORK-10     | Phase 11 | Complete |
| DOSS-01     | Phase 12 | Complete |
| DOSS-02     | Phase 12 | Complete |
| DOSS-03     | Phase 12 | Pending |
| DOSS-04     | Phase 12 | Pending |
| DOSS-05     | Phase 12 | Pending |
| DOSS-06     | Phase 12 | Pending |
| DOSS-07     | Phase 12 | Pending |
| DOSS-08     | Phase 12 | Complete |
| DOSS-09     | Phase 12 | Complete |
| DOSS-10     | Phase 12 | Complete |
| ABSORB-01   | Phase 13 | Pending |
| ABSORB-02   | Phase 13 | Pending |
| ABSORB-03   | Phase 13 | Pending |
| ABSORB-04   | Phase 13 | Pending |
| ABSORB-05   | Phase 13 | Pending |
| ABSORB-06   | Phase 13 | Pending |

**Coverage:**

- v3.0 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---

_Requirements defined: 2026-03-28_
_Last updated: 2026-03-28 after roadmap creation_
