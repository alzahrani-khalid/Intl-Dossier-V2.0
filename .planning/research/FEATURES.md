# Feature Landscape

**Domain:** Notifications, production deployment, E2E testing for diplomatic dossier app
**Researched:** 2026-04-06
**Downstream consumer:** Roadmap for v4.0 "Live Operations" milestone

## Table Stakes

Features users expect for a system going into daily operational use. Missing any = product cannot be trusted for real work.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| 1 | **In-app notification bell + dropdown** | Users need to see new assignments/deadlines without refreshing. Every operational tool has this. | Medium | Badge count + dropdown list. Supabase Realtime subscription on `notifications` table for live updates (same pattern as dashboard attention zones). |
| 2 | **Notification center page** | Users need to review/manage all past notifications, mark as read, filter by type. | Medium | Filterable list with read/unread toggle, mark-all-read, bulk actions. Lazy-loaded route. Existing Edge Function `notifications-center` provides backend. |
| 3 | **Assignment notifications** | "You were assigned a work item" is the #1 expected trigger in any task management system. | Low | Trigger on work_item `assignee_id` change. Insert into notifications table. Existing `notification.service.ts` already has `sendInAppNotification()`. |
| 4 | **Deadline approaching alerts** | Diplomatic deadlines are critical. Users need advance warning (24h, 48h). | Medium | Existing `detect-overdue-commitments.job.ts` already detects overdue items. Add notification insert as side-effect. Support 24h-before and at-deadline windows. |
| 5 | **Stage transition alerts** | Engagement lifecycle changes affect multiple team members who need to know. | Low | Trigger on `lifecycle_transitions` table insert (already tracked in v3.0). Notify all engagement participants. |
| 6 | **Attention zone notifications** | Dashboard attention items should also notify offline users. Bridge between existing attention zone and notification system. | Low | When attention zone items are generated, also create notification records. Low effort, high coherence. |
| 7 | **Email alerts for urgent items** | Users not always logged in. Urgent priority items need email delivery. | Medium | Resend API (developer-friendly, React Email templates for bilingual support). Existing migration `email_integration.sql` and Edge Function `notifications-digest` provide schema foundation. |
| 8 | **User notification preferences** | Users must control what notifies them and through which channel. Without this, users either get overwhelmed or miss critical items. | Medium | Existing migration `email_digest_content_preferences.sql` covers schema. Build preferences UI with per-type toggles (assignment, deadline, stage change) x per-channel (in-app, email, push). |
| 9 | **HTTPS in production** | Non-negotiable for any production system handling diplomatic data. Required for browser push (service workers need HTTPS). | Low | Existing `docker-compose.prod.yml` has Nginx + Certbot containers already defined but not HTTPS-active. Consider replacing with Caddy for zero-config auto-HTTPS via Let's Encrypt. |
| 10 | **Database backups** | Data loss is unacceptable for diplomatic records. | Low | Supabase Pro plan daily backups + Redis RDB snapshot backup to DigitalOcean Spaces. Cron job for backup verification. |
| 11 | **Health check endpoint (structured)** | Monitoring needs a reliable endpoint to verify system is operational. | Low | Existing `/health` endpoints on frontend and backend. Enhance with structured JSON response: DB connectivity, Redis status, uptime, version. |
| 12 | **E2E tests for auth flow** | Login is the gateway. If it breaks, everything breaks. Must be tested. | Low | Existing `e2e/tests/auth.spec.ts` and `auth-flow.spec.ts`. Validate they run against real Supabase Auth. Use `storageState` for authenticated test reuse. |
| 13 | **E2E tests for dossier CRUD** | Core functionality must have regression protection before daily use. | Medium | Existing `frontend/tests/e2e/create-view-dossier.spec.ts`. Prioritize: create country dossier, create engagement, create work item, view detail page. |
| 14 | **Seed data for all 8 dossier types** | Empty system on first login is confusing. Users need to see populated examples. | Medium | SQL seed file with realistic diplomatic data: 3-5 countries, 2-3 organizations, 1-2 forums, 3-5 engagements at different lifecycle stages, 2-3 topics, 1 working group, 5-10 persons, 2-3 elected officials. |
| 15 | **Idempotent seed script** | Developers must be able to re-run without duplicates or errors. | Low | `INSERT ... ON CONFLICT DO NOTHING` pattern. Single `pnpm db:seed` command. |

## Differentiators

Features that elevate from "works" to "reliable daily operations tool."

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| 1 | **Browser push notifications** | Alerts even when browser tab is closed. Critical for time-sensitive diplomatic deadlines. | High | Service worker + web-push VAPID. Requires HTTPS. Existing migrations (`push_notifications_fcm_apns.sql`) and Edge Functions (`push-notification`, `push-device-register`) provide backend foundation. |
| 2 | **Email digest (daily/weekly)** | Reduces email noise while keeping users informed of accumulated activity. | Medium | Existing Edge Function `notifications-digest` and migration `email_digest_content_preferences.sql`. Aggregate unread notifications into single Resend email with React Email template. Schedule via pg_cron. |
| 3 | **Smart notification routing** | Route urgent SLA items to push+email, routine updates to in-app only, based on priority and tracking_type. Prevents notification fatigue. | Medium | Decision matrix: `urgent` -> all channels; `high` -> in-app + email; `medium/low` -> in-app only. Override by user preferences. Implement as routing function in `notification.service.ts`. |
| 4 | **Notification grouping by dossier** | Diplomatic context matters more than chronological order. 5 notifications about one engagement should group together. | Medium | Group in frontend by `metadata.dossierId` or `metadata.engagementId`. Expandable groups with count badge. Reduces visual noise significantly. |
| 5 | **CI/CD pipeline** | Automated deploy on push to main. Eliminates manual SSH deploys, reduces human error. | Medium | GitHub Actions: lint -> typecheck -> test -> build Docker -> push to GitHub Container Registry -> SSH deploy. Existing `.github/workflows/ci.yml` provides starting point. |
| 6 | **E2E tests for engagement lifecycle** | Most complex user flow. Catching lifecycle regressions before production is high value. | High | Playwright: create engagement, advance through 6 stages, verify transitions logged, kanban updates. |
| 7 | **E2E tests for work item kanban** | Kanban is used daily. Drag-and-drop regressions are hard to catch without E2E. | High | Playwright: create task, drag between columns, verify status update persists. |
| 8 | **Realistic bilingual seed data** | Seed data in both Arabic and English demonstrates RTL/LTR correctness from first login. | Medium | All seed entities have both `name_en` and `name_ar` populated with real diplomatic terms. Include relationships between dossiers via `work_item_dossiers` junction table. |
| 9 | **Seed data with timeline history** | Sample data with historical events makes system feel lived-in, not freshly created. | Medium | Backdate `created_at` on seed records. Include engagement transitions, work item status changes over simulated 3-month period. |
| 10 | **Application monitoring** | Know when system is down before users report it. | Medium | Sentry already integrated. Add UptimeRobot or BetterStack (free tier) for HTTP uptime checks against `/api/health`. |
| 11 | **Page Object Model for E2E** | Maintainable test suite as app grows; selectors centralized, not scattered. | Low | Create `e2e/pages/` with `LoginPage`, `DossierPage`, `DashboardPage`, `EngagementPage`. All tests use page objects. |
| 12 | **v3.0 tech debt cleanup** | OPS-03/07 and stale metadata from v3.0 audit. Cleaning before daily use prevents confusion. | Low | Address items flagged in `.planning/milestones/v3.0-MILESTONE-AUDIT.md`. |

## Anti-Features

Features to explicitly NOT build in v4.0.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| 1 | **SMS notifications** | Cost per message, regulatory complexity (international numbers), low value for office workers with email+browser. | Email + browser push covers all needed channels. |
| 2 | **Mobile native push** | Mobile app was cancelled (PROJECT.md out of scope). Web push covers it. | Browser push notifications via service worker. |
| 3 | **Notification analytics (open/click rates)** | Premature optimization. Focus on delivery reliability first. | Log `read_at` timestamps for future analysis. Monitor Resend webhook data if needed. |
| 4 | **Custom notification sounds** | UI polish, not operational value. Adds complexity for negligible benefit. | Browser default notification sound. |
| 5 | **Slack/Teams integration** | Adds third-party dependency, unclear if users use these tools. | Keep notifications in-app + email + push. Existing Slack/Teams Edge Functions can be revisited later if requested. |
| 6 | **Full observability stack (Grafana/Prometheus)** | Overkill for <100 users. Sentry (existing) + uptime monitor is sufficient. | Sentry errors + UptimeRobot + `/api/health`. |
| 7 | **Blue-green or canary deployments** | Single droplet, small team, <100 users. Rolling restart via Docker Compose is sufficient. | `docker compose up -d --build` with health checks. |
| 8 | **Kubernetes / container orchestration** | Overkill for single-droplet deployment. Docker Compose handles current scale. | Move to K8s only when horizontal scaling is needed. |
| 9 | **100% E2E coverage** | Diminishing returns. 70% unit / 20% integration / 10% E2E is the healthy ratio. | Cover 8-10 critical user flows only. |
| 10 | **Automated cross-browser matrix** | Chromium covers 90%+ of users in a controlled enterprise environment. | Run Playwright on Chromium only. Add Firefox/WebKit only if browser-specific bugs reported. |
| 11 | **Load testing** | <100 users. Performance was optimized in v2.0 Phase 7. Not a bottleneck. | Revisit if user base grows past 500. |
| 12 | **Real-time chat/messaging** | High complexity, not core to dossier management. Already out of scope in PROJECT.md. | Notifications + comments on work items cover collaboration needs. |

## Feature Dependencies

```
HTTPS (Caddy/Nginx) --> Browser Push (service workers require HTTPS)
HTTPS (Caddy/Nginx) --> Secure cookie auth (Supabase Auth best practice)
HTTPS (Caddy/Nginx) --> CI/CD deploy target needs HTTPS

notifications table (Supabase migration) --> In-app bell
notifications table --> Notification center
notifications table --> Email alerts
notifications table --> Push notifications

notification_preferences table --> Per-channel routing logic
notification_preferences --> Preferences settings UI
notification_preferences --> Email digest frequency control

Resend API setup --> Email alerts (immediate)
Resend API setup --> Email digest (scheduled)
React Email templates --> Bilingual email rendering

web-push + VAPID keys + HTTPS --> Browser push
Service Worker registration --> Browser push

Health endpoint --> Uptime monitoring
CI/CD pipeline --> E2E tests running in CI
Seed data --> E2E test fixtures (known data to assert against)

Existing lifecycle_transitions table --> Stage transition notifications
Existing work_items table --> Assignment + deadline notifications
Existing detect-overdue-commitments.job.ts --> Deadline notification triggers
Existing notification.service.ts --> Channel routing extension point
```

## Existing Assets Inventory

The codebase already contains partial implementations that reduce scope significantly:

| Asset | Location | Status | Reuse Strategy |
|-------|----------|--------|----------------|
| Notification service | `backend/src/services/notification.service.ts` | Basic `sendInAppNotification()` working | Extend with channel routing, trigger hooks |
| Notifications table | `supabase/migrations/20250930110_create_notifications_table.sql` | Applied | Add indexes for user+read queries |
| Notification center Edge Function | `supabase/functions/notifications-center/` | Exists, unvalidated | Validate API, wire to frontend |
| Email digest Edge Function | `supabase/functions/notifications-digest/` | Exists, unvalidated | Validate, connect to Resend |
| Push notification Edge Functions | `supabase/functions/push-notification/`, `push-device-register/` | Exist, unvalidated | Validate, wire Service Worker |
| Email preferences migration | `supabase/migrations/20260115200001_email_digest_content_preferences.sql` | Exists | Verify schema matches current needs |
| Push notification migration | `supabase/migrations/20260111200001_push_notifications_fcm_apns.sql` | Exists | Verify, may need VAPID column additions |
| Escalation email template | `backend/src/templates/notifications/escalation-en.hbs` | Exists | Use as base for email notification templates |
| Overdue detection job | `backend/src/jobs/detect-overdue-commitments.job.ts` | Working | Add notification side-effect |
| Docker Compose prod | `deploy/docker-compose.prod.yml` | Working (HTTP only, Nginx+Certbot defined) | Configure HTTPS or swap to Caddy |
| Playwright configs | `playwright.config.ts`, `frontend/playwright.config.ts` | Both exist | Consolidate into single config |
| ~120+ E2E spec files | `frontend/tests/e2e/`, `e2e/tests/`, `tests/e2e/` | Likely skeleton/generated from earlier phases | Audit which pass, prioritize critical flows |
| CI workflow | `.github/workflows/ci.yml` | Exists | Add Playwright step, deploy step |
| Slack/Teams Edge Functions | `supabase/functions/slack-bot/`, `teams-bot/` | Exist (out of scope for v4.0) | Defer, do not integrate |

## MVP Recommendation

### Phase 1 -- Production Foundation (must ship together):
1. HTTPS via Caddy or Nginx+Certbot (unblocks push, secures production)
2. CI/CD pipeline (GitHub Actions: lint + typecheck + build + deploy)
3. Health check endpoint enhancement + uptime monitoring
4. Database backup strategy verification

### Phase 2 -- Notification Core:
5. Validate/extend `notifications` table + RLS policies
6. Extend `NotificationService` with channel routing
7. In-app bell + dropdown (Supabase Realtime)
8. Notification center page
9. Triggers: assignment, deadline, stage transition, attention zone

### Phase 3 -- Notification Channels + Preferences:
10. Email alerts via Resend (immediate, for urgent items)
11. Browser push via web-push + service worker
12. Notification preferences table + settings UI
13. Email digest (scheduled aggregation)

### Phase 4 -- Quality + Data:
14. Seed data (bilingual, all 8 dossier types, relationships, work items)
15. Playwright E2E tests (auth, dossier CRUD, engagement lifecycle, kanban)
16. Page Object Model architecture for test maintainability
17. v3.0 tech debt cleanup (OPS-03/07, stale metadata)

### Defer:
- Notification analytics -- revisit after 3 months of usage data
- Advanced digest customization -- start with daily frequency, iterate on feedback
- SMS/Slack/Teams -- revisit only if explicitly requested by users
- First-run onboarding -- high complexity, better suited for a UX-focused milestone
- Log aggregation -- Docker logs + Sentry cover immediate needs

## Sources

- [Supabase Push Notifications Docs](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Notification System Design - MagicBell](https://www.magicbell.com/blog/notification-system-design)
- [Scalable Notification DB Design - DEV](https://dev.to/ndohjapan/scalable-notification-system-design-for-50-million-users-database-design-4cl)
- [Resend - Transactional Email](https://resend.com/products/transactional-emails)
- [React Email](https://github.com/resend/react-email)
- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy Docker Proxy](https://github.com/lucaslorentz/caddy-docker-proxy)
- [TanStack Router Testing Docs](https://tanstack.com/router/latest/docs/framework/react/how-to/setup-testing)
- [Playwright Best Practices 2026 - BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)
- [Test Data Strategies for E2E](https://www.playwright-user-event.org/playwright-tips/test-data-strategies-for-e2e-tests)
- [GitOps CI/CD on DigitalOcean Droplet](https://dev.to/lfariaus/from-git-pull-to-gitops-how-i-built-a-production-cicd-pipeline-on-a-12-digitalocean-droplet-34gn)
