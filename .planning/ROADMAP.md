# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)

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

<details>
<summary>✅ v4.0 Live Operations (Phases 14-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 14: Production Deployment (3/3 plans) — HTTPS, CI/CD, monitoring, backups, rollback
- [x] Phase 15: Notification Backend & In-App (3/3 plans) — BullMQ, triggers, bell icon, preferences
- [x] Phase 16: Email & Push Channels (4/4 plans) — Resend email, digest, browser push, soft-ask
- [x] Phase 17: Seed Data & First Run (5/5 plans) — 40+ entities, first-run modal, bilingual
- [x] Phase 18: E2E Test Suite (4/4 plans) — Playwright POM, CI sharding, auth hardening, failure artifacts
- [x] Phase 19: Tech Debt Cleanup (2/2 plans) — typed router params, roadmap auto-sync
- [x] Phase 20: Live Operations Bring-Up (1/1 plan) — seed accounts provisioned
- [x] Phase 21: Digest Scheduler Wiring Fix (1/1 plan) — registerDigestScheduler() wired
- [x] Phase 22: E2E Test Fixes (1/1 plan) — notification spec + ops-hub testids fixed
- [x] Phase 23: Missing Verifications (2/2 plans) — SEED/DEBT requirements formally verified

Full details: [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

### 🚧 v4.1 Post-Launch Fixes

**Milestone Goal:** Fix runtime issues discovered during post-v4.0 browser inspection.

- [ ] **Phase 24: Browser Inspection Fixes** - Fix calendar i18n missing keys, settings page 406 errors, and Supabase direct-call DNS failures

#### Phase 24: Browser Inspection Fixes

**Goal**: Fix runtime issues discovered during post-v4.0 deployment browser inspection
**Depends on**: Phase 23
**Requirements**: FIX-01, FIX-02, FIX-03
**Success Criteria** (what must be TRUE):

1. Calendar page shows translated labels (not raw i18n keys) in both English and Arabic
2. Settings page loads without 406 errors on the users Supabase query
3. Dashboard Supabase Edge Function calls (notifications-center, analytics-dashboard) go through the backend proxy instead of direct browser-to-Supabase calls, eliminating ERR_NAME_NOT_RESOLVED errors

**Plans:** 1 plan

Plans:

- [ ] 24-01-PLAN.md — Fix calendar i18n, settings 406, and analytics DNS errors

## Progress

<!-- gsd:progress:start -->

| Phase                             | Milestone | Plans Complete | Status   | Completed  |
| --------------------------------- | --------- | -------------- | -------- | ---------- |
| 14. Production Deployment         | v4.0      | 3/3            | Complete | 2026-04-06 |
| 15. Notification Backend & In-App | v4.0      | 3/3            | Complete | 2026-04-06 |
| 16. Email & Push Channels         | v4.0      | 4/4            | Complete | 2026-04-06 |
| 17. Seed Data & First Run         | v4.0      | 5/5            | Complete | 2026-04-06 |
| 18. E2E Test Suite                | v4.0      | 4/4            | Complete | 2026-04-07 |
| 19. Tech Debt Cleanup             | v4.0      | 2/2            | Complete | 2026-04-08 |
| 20. Live Operations Bring Up      | v4.0      | 1/1            | Complete | 2026-04-09 |
| 21. Digest Scheduler Wiring Fix   | v4.0      | 1/1            | Complete | 2026-04-09 |
| 22. E2E Test Fixes                | v4.0      | 1/1            | Complete | 2026-04-09 |
| 23. Missing Verifications         | v4.0      | 2/2            | Complete | 2026-04-09 |

<!-- gsd:progress:end -->
