# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- 🚧 **v4.0 Live Operations** — Phases 14-19 (in progress)

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

<details>
<summary>✅ v3.0 Connected Workflow (Phases 8-13) — SHIPPED 2026-04-06</summary>

- [x] Phase 8: Navigation & Route Consolidation (4/4 plans) — hub sidebar, route dedup, mobile tabs, Cmd+K
- [x] Phase 9: Lifecycle Engine (5/5 plans) — 6-stage lifecycle, transitions, forum sessions
- [x] Phase 10: Operations Hub (4/4 plans) — role-adaptive dashboard, 5 zones, Realtime
- [x] Phase 11: Engagement Workspace (5/5 plans) — tabbed workspace, lifecycle stepper, kanban, calendar
- [x] Phase 12: Enriched Dossier Pages (5/5 plans) — DossierShell, RelationshipSidebar, Elected Officials
- [x] Phase 13: Feature Absorption (5/5 plans) — analytics, AI, graph, polling, export absorbed; Cmd+K search

Full details: [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

### 🚧 v4.0 Live Operations (In Progress)

**Milestone Goal:** Make the system operational for daily use with notifications, reliable deployment, automated E2E testing, and realistic seed data.

- [x] **Phase 14: Production Deployment** - HTTPS, CI/CD pipeline, monitoring, backups, and rollback (completed 2026-04-06)
- [ ] **Phase 15: Notification Backend & In-App** - Dispatcher, triggers, bell icon, notification center, preferences
- [ ] **Phase 16: Email & Push Channels** - Resend email alerts, digest emails, browser push with soft-ask
- [ ] **Phase 17: Seed Data & First Run** - Realistic diplomatic scenario data and first-run experience
- [ ] **Phase 18: E2E Test Suite** - Playwright tests for all critical flows with CI integration
- [ ] **Phase 19: Tech Debt Cleanup** - v3.0 router params fix and roadmap auto-update

## Phase Details

### Phase 14: Production Deployment
**Goal**: Application runs reliably in production with HTTPS, automated deployments, monitoring, and recovery capabilities
**Depends on**: Phase 13
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**Success Criteria** (what must be TRUE):
  1. User accesses the application over HTTPS with a valid TLS certificate that auto-renews
  2. Pushing to main triggers automated lint, typecheck, build, and deploy to the DigitalOcean droplet
  3. An external monitor alerts when the application goes down (healthcheck endpoint responds)
  4. Database backups can be restored following a documented procedure
  5. A failed deployment can be rolled back to the previous Docker image with zero downtime
**Plans**: 3 plans

Plans:
- [x] 14-01-PLAN.md — Fix nginx HTTPS config bugs and certbot cert path mounting
- [x] 14-02-PLAN.md — Rewrite CI/CD deploy pipeline with rollback mechanism
- [x] 14-03-PLAN.md — External monitoring, Redis backup, and restore documentation

### Phase 15: Notification Backend & In-App
**Goal**: Users receive timely in-app notifications for assignments, deadlines, and lifecycle events, with full control over their preferences
**Depends on**: Phase 14
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-06, NOTIF-07, NOTIF-08
**Success Criteria** (what must be TRUE):
  1. User sees a bell icon with unread count in the header; clicking it opens the notification center panel
  2. User receives in-app notifications when assigned a task, when a deadline is approaching/overdue, and when an engagement changes lifecycle stage
  3. User can configure which notification categories they receive (assignments, deadlines, transitions) per channel
  4. User can mark individual notifications as read or bulk mark-all-read
  5. Notification delivery is decoupled from the triggering action (async via BullMQ, no transaction coupling)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD
- [ ] 15-03: TBD

### Phase 16: Email & Push Channels
**Goal**: Users receive notifications outside the application via email alerts, email digests, and browser push notifications
**Depends on**: Phase 15
**Requirements**: NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-09
**Success Criteria** (what must be TRUE):
  1. User receives email for critical notifications (overdue deadlines, new assignments) via Resend with bilingual templates
  2. User receives a daily or weekly email digest summarizing their pending attention items
  3. User receives browser push notifications for urgent items when the app is not in focus (Chrome/Firefox)
  4. Push notification opt-in uses a soft-ask pattern (contextual prompt after relevant action, not a cold browser permission dialog)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD
- [ ] 16-03: TBD

### Phase 17: Seed Data & First Run
**Goal**: New deployments start with realistic diplomatic data and a guided first-run experience
**Depends on**: Phase 15
**Requirements**: SEED-01, SEED-02, SEED-03
**Success Criteria** (what must be TRUE):
  1. Running the seed script creates 5-10 countries, organizations, forums, and engagements at various lifecycle stages with realistic names and relationships
  2. Seed data includes cross-tier dossier relationships (strategic, operational, informational) and work items in different states (pending, in_progress, completed)
  3. On first login to an empty database, the user is offered to populate seed data with a single action
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD

### Phase 18: E2E Test Suite
**Goal**: Critical user flows are covered by automated Playwright tests that run in CI and catch regressions
**Depends on**: Phase 16, Phase 17
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-11
**Success Criteria** (what must be TRUE):
  1. Playwright tests cover login, engagement lifecycle, dossier navigation, Cmd+K, notifications, work items, calendar, export, AI briefing, and Operations Hub
  2. All E2E tests pass against a seeded database with realistic data
  3. E2E tests run in the CI pipeline on every push, with screenshots and traces saved on failure
  4. A failing E2E test produces actionable artifacts (screenshot of failure state, Playwright trace file)
**Plans**: TBD

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD
- [ ] 18-03: TBD

### Phase 19: Tech Debt Cleanup
**Goal**: Remaining v3.0 technical debt is resolved for a clean operational baseline
**Depends on**: Phase 14
**Requirements**: DEBT-01, DEBT-02
**Success Criteria** (what must be TRUE):
  1. OPS-03 and OPS-07 dashboard items navigate using TanStack Router params instead of string-based navigation
  2. ROADMAP.md progress table updates automatically during plan execution without manual editing
**Plans**: TBD

Plans:
- [ ] 19-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 14 → 15 → 16 → 17 → 18 → 19
Decimal phases (if inserted) execute between their surrounding integers.
Phase 17 and 19 can run in parallel after their dependencies are met.

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
| 9. Lifecycle Engine                 | v3.0      | 5/5            | Complete    | 2026-03-29 |
| 10. Operations Hub                  | v3.0      | 4/4            | Complete    | 2026-03-31 |
| 11. Engagement Workspace            | v3.0      | 5/5            | Complete    | 2026-03-31 |
| 12. Enriched Dossier Pages          | v3.0      | 5/5            | Complete    | 2026-03-31 |
| 13. Feature Absorption              | v3.0      | 5/5            | Complete    | 2026-04-02 |
| 14. Production Deployment           | v4.0      | 3/3 | Complete    | 2026-04-06 |
| 15. Notification Backend & In-App   | v4.0      | 0/TBD          | Not started | -          |
| 16. Email & Push Channels           | v4.0      | 0/TBD          | Not started | -          |
| 17. Seed Data & First Run           | v4.0      | 0/TBD          | Not started | -          |
| 18. E2E Test Suite                  | v4.0      | 0/TBD          | Not started | -          |
| 19. Tech Debt Cleanup               | v4.0      | 0/TBD          | Not started | -          |
