# Requirements: Intl-Dossier v4.0 Live Operations

**Defined:** 2026-04-06
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## v4.0 Requirements

Requirements for making the system operational for daily use. Each maps to roadmap phases.

### Production Deployment

- [ ] **DEPLOY-01**: Application serves over HTTPS with auto-renewing TLS certificates via nginx + certbot
- [ ] **DEPLOY-02**: GitHub Actions CI/CD pipeline runs lint, typecheck, build, and deploys to DigitalOcean on push to main
- [ ] **DEPLOY-03**: Uptime monitoring alerts when application is unreachable (healthcheck endpoint + external monitor)
- [ ] **DEPLOY-04**: Database backups are verified restorable on a scheduled basis with documented recovery procedure
- [ ] **DEPLOY-05**: Deployment supports zero-downtime rollback to previous Docker image

### Notification System

- [ ] **NOTIF-01**: User sees bell icon in header with unread count badge; clicking opens notification center panel
- [ ] **NOTIF-02**: User receives in-app notifications for task assignments, deadline approaching/overdue, and lifecycle stage transitions
- [ ] **NOTIF-03**: User receives email for critical notifications (overdue deadlines, new assignments) via Resend
- [ ] **NOTIF-04**: User receives daily/weekly email digest summarizing pending attention items
- [ ] **NOTIF-05**: User receives browser push notifications for urgent items when app is not in focus (Chrome/Firefox)
- [ ] **NOTIF-06**: User can configure notification preferences per channel (in-app, email, push) and per category (assignments, deadlines, transitions)
- [ ] **NOTIF-07**: User can mark notifications as read individually or bulk mark-all-read
- [ ] **NOTIF-08**: Notification delivery is decoupled from database transactions (webhook + async processing via BullMQ)
- [ ] **NOTIF-09**: Push notification opt-in uses soft-ask pattern (contextual prompt, not cold browser permission)

### E2E Testing

- [ ] **TEST-01**: Playwright E2E test covers login flow (email/password, session persistence, logout)
- [ ] **TEST-02**: Playwright E2E test covers engagement creation and lifecycle transition
- [ ] **TEST-03**: Playwright E2E test covers dossier navigation (list → detail → tabs → RelationshipSidebar)
- [ ] **TEST-04**: Playwright E2E test covers Cmd+K quick switcher (search, navigate, recent items)
- [ ] **TEST-05**: Playwright E2E test covers notification interaction (receive, read, mark-all-read, preferences)
- [ ] **TEST-06**: Playwright E2E test covers work item CRUD (create task, drag kanban, complete)
- [ ] **TEST-07**: Playwright E2E test covers calendar events (create, view, lifecycle dates)
- [ ] **TEST-08**: Playwright E2E test covers export/import from dossier list
- [ ] **TEST-09**: Playwright E2E test covers AI briefing generation from Docs tab
- [ ] **TEST-10**: Playwright E2E test covers Operations Hub dashboard (zones render, role switching, item navigation)
- [ ] **TEST-11**: All E2E tests run in CI pipeline with test artifacts (screenshots, traces) on failure

### Seed Data & First Run

- [ ] **SEED-01**: Seed script creates realistic diplomatic scenario with 5-10 countries, organizations, forums, and engagements at various lifecycle stages
- [ ] **SEED-02**: Seed data includes dossier relationships across tiers (strategic, operational, informational) and work items in different states
- [ ] **SEED-03**: First-run experience detects empty database and offers to populate seed data

### Tech Debt

- [ ] **DEBT-01**: OPS-03 and OPS-07 fixed to use TanStack Router params instead of string navigation
- [ ] **DEBT-02**: ROADMAP progress table auto-updates during plan execution (not manual)

## Future Requirements

Deferred to subsequent milestone. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Real-time collaborative editing within engagement workspaces
- **ADV-02**: Custom dashboard widget arrangement via drag-and-drop
- **ADV-03**: Advanced analytics with trend analysis and predictive insights
- **ADV-04**: Multi-user invitation flow with role assignment
- **ADV-05**: SMS notification channel
- **ADV-06**: Safari Web Push support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                               | Reason                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| SMS notifications                     | Requires Twilio/similar, overkill for single-user operational use                       |
| Kubernetes/container orchestration    | DigitalOcean droplet + Docker Compose sufficient for current scale                      |
| Cross-browser E2E matrix              | Chrome + Firefox sufficient; Safari/Edge add CI cost without proportional value          |
| Real-time chat                        | High complexity, not core to dossier management                                         |
| Full observability stack (Grafana)    | Sentry + uptime monitor sufficient; full APM premature for current user count           |
| OAuth/social login                    | Email/password sufficient; revisit if user base grows                                   |
| Mobile native app                     | Cancelled in v2.0 — web-only going forward                                              |
| Notification grouping/threading       | Nice-to-have but adds UI complexity; defer until notification volume warrants it         |
| Drag-and-drop dashboard customization | Anti-feature per v3.0 research — configuration complexity, rarely used                  |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| DEPLOY-01   | TBD   | Pending |
| DEPLOY-02   | TBD   | Pending |
| DEPLOY-03   | TBD   | Pending |
| DEPLOY-04   | TBD   | Pending |
| DEPLOY-05   | TBD   | Pending |
| NOTIF-01    | TBD   | Pending |
| NOTIF-02    | TBD   | Pending |
| NOTIF-03    | TBD   | Pending |
| NOTIF-04    | TBD   | Pending |
| NOTIF-05    | TBD   | Pending |
| NOTIF-06    | TBD   | Pending |
| NOTIF-07    | TBD   | Pending |
| NOTIF-08    | TBD   | Pending |
| NOTIF-09    | TBD   | Pending |
| TEST-01     | TBD   | Pending |
| TEST-02     | TBD   | Pending |
| TEST-03     | TBD   | Pending |
| TEST-04     | TBD   | Pending |
| TEST-05     | TBD   | Pending |
| TEST-06     | TBD   | Pending |
| TEST-07     | TBD   | Pending |
| TEST-08     | TBD   | Pending |
| TEST-09     | TBD   | Pending |
| TEST-10     | TBD   | Pending |
| TEST-11     | TBD   | Pending |
| SEED-01     | TBD   | Pending |
| SEED-02     | TBD   | Pending |
| SEED-03     | TBD   | Pending |
| DEBT-01     | TBD   | Pending |
| DEBT-02     | TBD   | Pending |

**Coverage:**

- v4.0 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---
_Requirements defined: 2026-04-06_
_Last updated: 2026-04-06 after initial definition_
