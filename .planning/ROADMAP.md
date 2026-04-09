# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- 🚧 **v4.0 Live Operations** — Phases 14-23 (in progress)

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
- [x] **Phase 15: Notification Backend & In-App** - Dispatcher, triggers, bell icon, notification center, preferences (completed 2026-04-06)
- [x] **Phase 16: Email & Push Channels** - Resend email alerts, digest emails, browser push with soft-ask (completed 2026-04-06)
- [x] **Phase 17: Seed Data & First Run** - Realistic diplomatic scenario data and first-run experience (completed 2026-04-06, UAT recovery applied)
- [x] **Phase 18: E2E Test Suite** - Playwright tests for all critical flows with CI integration (completed 2026-04-07, live run gated on Phase 17 seed accounts)
- [ ] **Phase 19: Tech Debt Cleanup** - v3.0 router params fix and roadmap auto-update
- [ ] **Phase 21: Digest Scheduler Wiring Fix** - Wire registerDigestScheduler() call at backend startup
- [ ] **Phase 22: E2E Test Fixes** - Fix notification spec endpoint and ops-hub testid mismatches
- [ ] **Phase 23: Missing Verifications** - Create VERIFICATION.md for phases 17 and 19

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
   **Plans**: 3 plans
   **UI hint**: yes

Plans:

- [x] 15-01-PLAN.md — BullMQ queue infrastructure, notification service extension, preference checking
- [x] 15-02-PLAN.md — Wire three notification triggers (assignment, deadline, lifecycle)
- [x] 15-03-PLAN.md — Frontend toast wiring, i18n strings, end-to-end verification

### Phase 16: Email & Push Channels

**Goal**: Users receive notifications outside the application via email alerts, email digests, and browser push notifications
**Depends on**: Phase 15
**Requirements**: NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-09
**Success Criteria** (what must be TRUE):

1. User receives email for critical notifications (overdue deadlines, new assignments) via Resend with bilingual templates
2. User receives a daily or weekly email digest summarizing their pending attention items
3. User receives browser push notifications for urgent items when the app is not in focus (Chrome/Firefox)
4. Push notification opt-in uses a soft-ask pattern (contextual prompt after relevant action, not a cold browser permission dialog)
   **Plans**: 4 plans
   **UI hint**: yes

Plans:

- [ ] 16-01-PLAN.md — Email channel wiring: bilingual alert templates + processor email dispatch
- [ ] 16-02-PLAN.md — Digest scheduling: BullMQ repeatable jobs + bilingual digest templates
- [ ] 16-03-PLAN.md — Web Push backend: push_subscriptions table, push service, API, service worker, processor integration
- [ ] 16-04-PLAN.md — Soft-ask opt-in UX: PushOptInBanner component, i18n, NotificationPanel integration

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

### Phase 20: Live Operations Bring-Up

**Goal**: Complete every human verification checkpoint for v4.0 and provision the staging actors required to run them, so v4.0 can be audited `passed` and archived.
**Depends on**: Phase 14, Phase 17, Phase 18
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06, NOTIF-07, NOTIF-08, NOTIF-09, SEED-01, SEED-02, SEED-03, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-10, TEST-11
**Scope**: Verification + bring-up only. No new product code. This phase closes the 24 `human_needed` checkpoints recorded across 14-VERIFICATION, 15-VERIFICATION, 16-VERIFICATION, 18-VERIFICATION and the 17-UAT blockers.
**Success Criteria** (what must be TRUE):

1. Staging has a real, active admin user (`auth.users` + `public.users` + `user_roles` all populated) usable for manual UAT sessions
2. Three E2E seed accounts exist on staging — `admin@e2e.test`, `analyst@e2e.test`, `intake@e2e.test` — with known passwords stored as GitHub Actions secrets
3. `populate_diplomatic_seed()` has been invoked once against an empty staging DB under a real admin JWT; resulting scenario matches SEED-01/02/03 (bilingual names, enum coverage, `is_seed_data = true` on every seeded row)
4. FirstRunModal has been manually UAT'd in a live browser: renders, dismisses (localStorage persists), RTL correct in Arabic
5. Production domain DNS points at droplet, certbot has obtained a valid TLS certificate, `verify-deployment.sh` passes with the real domain
6. `DROPLET_HOST` + `DROPLET_SSH_KEY` GitHub Actions secrets are configured; at least one successful live deploy has run through `.github/workflows/deploy.yml`
7. External uptime monitor (UptimeRobot or Betterstack) is watching `/health` and has fired at least one test alert
8. Redis backup cron is installed on the droplet and has produced at least one verified non-empty `.rdb` file under `/opt/intl-dossier/backups/redis/`
9. Supabase restore procedure from `deploy/BACKUP_RESTORE.md` has been rehearsed against staging and verified to produce a data-consistent restore
10. `deploy/rollback.sh` has been exercised live on the droplet (rollback tags exist, health checks pass before + after)
11. Bell icon + unread badge + notification center panel + category tabs render correctly in both EN and AR
12. Task assignment produces a Sonner toast within ~5s of dispatch; notification appears in the Assignments tab
13. Mark-as-read (individual + bulk) updates badge and persists across reloads
14. Backend logs confirm async dispatch via BullMQ worker (`Notification worker ready`, `Notification queue initialized` on startup)
15. NOTIF-06 preference toggle is respected end-to-end (toggle OFF → no toast; toggle ON → toast appears)
16. RTL rendering of notification panel + toast is correct in Arabic
17. Triggering an overdue-deadline notification for `email_enabled=true` user produces a bilingual HTML `email_queue` row
18. A daily-digest-processor job produces a digest `email_queue` row matching the user's locale (`dir=rtl` for Arabic users)
19. PushOptInBanner renders inside NotificationPanel (soft-ask) on first visit; Enable + Dismiss buttons are tappable (44px targets)
20. VAPID push delivery works end-to-end: enabling push + triggering an urgent notification produces a real browser push event with correct bilingual title/body
21. GitHub Actions E2E secrets exist: `E2E_BASE_URL`, `E2E_ADMIN_EMAIL/PASSWORD`, `E2E_ANALYST_EMAIL/PASSWORD`, `E2E_INTAKE_EMAIL/PASSWORD`, `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`
22. Full Playwright suite has run against staging: `pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke` produced a clean green run (or env-gated specs skipped cleanly)
23. A deliberately-failing E2E run has been triggered in CI; screenshot PNG + Playwright trace zip appear under `playwright-failure-N` artifacts; merged HTML report appears under `playwright-report`
24. GitHub branch protection on `main` requires `E2E (shard 1/2)`, `E2E (shard 2/2)`, and `Merge Playwright reports` status checks before merging

**Plans**: TBD

Plans:

- [x] 20-01: TBD (staging auth bring-up — admin user + 3 E2E seed accounts)
- [x] 20-02: TBD (Ph17 data UAT — populate_diplomatic_seed invocation + FirstRunModal browser UAT)
- [x] 20-03: TBD (Ph14 production infra — DNS, certbot, GH secrets, monitor, backups, rollback)
- [x] 20-04: TBD (Ph15/16 notification runtime — 10 browser checkpoints)
- [x] 20-05: TBD (Ph18 E2E pipeline bring-up — secrets, live run, branch protection)

### Phase 21: Digest Scheduler Wiring Fix

**Goal**: Daily/weekly email digest dispatches at runtime by wiring the scheduler startup call
**Depends on**: Phase 16
**Requirements**: NOTIF-04
**Gap Closure**: Closes NOTIF-04 (unsatisfied), integration gap Phase 16→14, flow "Digest email dispatch"
**Success Criteria** (what must be TRUE):

1. `registerDigestScheduler()` is called during backend startup in `backend/src/index.ts`
2. Backend logs show digest BullMQ repeatable jobs registered on startup
   **Plans**: TBD

### Phase 22: E2E Test Fixes

**Goal**: Fix E2E test specs that target nonexistent endpoints or missing data-testids so they pass against the running app
**Depends on**: Phase 18, Phase 21
**Requirements**: TEST-05, TEST-10
**Gap Closure**: Closes TEST-05, TEST-10, integration gaps Phase 18→15 and Phase 18→17/19, flows "Notification bell E2E" and "Operations Hub zone E2E"
**Success Criteria** (what must be TRUE):

1. `/api/notifications/test-trigger` endpoint exists and returns a test notification, or the E2E spec uses a valid trigger path
2. `ops-zone-*` data-testids are present in OperationsHub component source
3. Both `05-notifications.spec.ts` and `10-operations-hub.spec.ts` pass against a seeded database
   **Plans**: TBD

### Phase 23: Missing Verifications

**Goal**: Create formal VERIFICATION.md for phases 17 and 19 to close partial requirement gaps
**Depends on**: Phase 17, Phase 19
**Requirements**: SEED-01, SEED-02, SEED-03, DEBT-01, DEBT-02
**Gap Closure**: Closes SEED-01/02/03 and DEBT-01/02 partial status (code complete, verification missing)
**Success Criteria** (what must be TRUE):

1. Phase 17 has a VERIFICATION.md confirming SEED-01, SEED-02, SEED-03 are satisfied with evidence
2. Phase 19 has a VERIFICATION.md confirming DEBT-01, DEBT-02 are satisfied with evidence
   **Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 14 → 15 → 16 → 17 → 18 → 19 → 20
Decimal phases (if inserted) execute between their surrounding integers.
Phase 17 and 19 can run in parallel after their dependencies are met.
Phase 20 is a pure verification phase — it runs after all other v4.0 phases are code-complete.

<!-- gsd:progress:start -->

| Phase                               | Milestone | Plans Complete | Status   | Completed  |
| ----------------------------------- | --------- | -------------- | -------- | ---------- |
| 1. Dead Code & Toolchain            | v2.0      | 3/3            | Complete | 2026-03-23 |
| 2. Naming & File Structure          | v2.0      | 3/3            | Complete | 2026-03-23 |
| 3. Security Hardening               | v2.0      | 3/3            | Complete | 2026-03-24 |
| 4. RTL/LTR Consistency              | v2.0      | 6/6            | Complete | 2026-03-25 |
| 5. Responsive Design                | v2.0      | 5/5            | Complete | 2026-03-26 |
| 6. Architecture Consolidation       | v2.0      | 5/5            | Complete | 2026-03-27 |
| 7. Performance Optimization         | v2.0      | 4/4            | Complete | 2026-03-28 |
| 8. Navigation & Route Consolidation | v3.0      | 4/4            | Complete | 2026-03-28 |
| 9. Lifecycle Engine                 | v3.0      | 5/5            | Complete | 2026-03-29 |
| 10. Operations Hub                  | v3.0      | 4/4            | Complete | 2026-03-31 |
| 11. Engagement Workspace            | v3.0      | 5/5            | Complete | 2026-03-31 |
| 12. Enriched Dossier Pages          | v3.0      | 5/5            | Complete | 2026-03-31 |
| 13. Feature Absorption              | v3.0      | 5/5            | Complete | 2026-04-02 |
| 14. Production Deployment           | v4.0      | 3/3            | Complete | 2026-04-06 |
| 15. Notification Backend & In-App   | v4.0      | 3/3            | Complete | 2026-04-06 |
| 16. Email & Push Channels           | v4.0      | 4/4            | Complete | 2026-04-06 |
| 17. Seed Data & First Run           | v4.0      | 5/5            | Complete | 2026-04-06 |
| 18. E2E Test Suite                  | v4.0      | 4/4            | Complete | 2026-04-07 |
| 19. Tech Debt Cleanup               | v4.0      | 2/2            | Complete | 2026-04-08 |
| 20. Live Operations Bring Up        | TBD       | 5/5            | Complete | 2026-04-09 |
| 21. Digest Scheduler Wiring Fix     | v4.0      | 0/0            | Pending  |            |
| 22. E2E Test Fixes                  | v4.0      | 0/0            | Pending  |            |
| 23. Missing Verifications           | v4.0      | 0/0            | Pending  |            |

<!-- gsd:progress:end -->
