# Technology Stack

**Project:** Intl-Dossier v4.0 Live Operations
**Researched:** 2026-04-06
**Scope:** Stack ADDITIONS only -- existing stack validated in v2.0/v3.0 and not re-researched

## TL;DR

Four new backend dependencies (`web-push`, `resend`, `@react-email/components`, `bullmq`), two new dev dependencies (`@playwright/test`, `@faker-js/faker`), and one infrastructure decision (Caddy vs existing nginx+certbot). Much of the notification UI, DB schema, CI/CD, and E2E scaffolding already exists -- the primary work is wiring new delivery channels (email, push) into existing infrastructure.

## CRITICAL: What Already Exists (Codebase Analysis)

Before listing new additions, these components were discovered in the codebase and must NOT be rebuilt:

| Component | Location | Status |
|-----------|----------|--------|
| `notifications` table | Supabase migration `20260111100001` | Schema exists with categories, priorities, expiry |
| `push_device_tokens` table | Same migration | Schema exists with platform, provider, failure tracking |
| `notification_category_preferences` table | Same migration | Schema exists with per-channel toggles |
| `useNotificationCenter` hook | `frontend/src/hooks/useNotificationCenter.ts` | Full CRUD: list, counts, mark-read, delete, preferences, device registration |
| `useNotificationRealtime` hook | Same file | Supabase Realtime subscription on INSERT/UPDATE |
| `NotificationList`, `NotificationItem`, `NotificationBadge`, `NotificationPanel`, `NotificationPreferences` | `frontend/src/components/notifications/` | UI components exist with RTL support |
| `notification.service.ts` | `backend/src/services/notification.service.ts` | Basic `sendInAppNotification` + health score drop |
| Docker Compose prod | `deploy/docker-compose.prod.yml` | nginx + frontend + backend + redis + anythingllm + certbot |
| nginx prod config | `deploy/nginx/nginx.prod.conf` | HTTPS, WebSocket proxy, rate limiting, security headers |
| CI workflow | `.github/workflows/ci.yml` | Lint, unit tests, E2E job, RTL tests, a11y tests, bundle size, Lighthouse, Docker build, security scan |
| Deploy workflow | `.github/workflows/deploy.yml` | Docker push + SSH deploy to droplet |
| Playwright configs | Root + `frontend/playwright.config.ts` | Both exist with basic config |
| E2E test stubs | `e2e/tests/auth.spec.ts`, `auth-flow.spec.ts`, `create-view-dossier.spec.ts` | Partial specs exist |
| Supabase Edge Functions | `supabase/functions/push-notification*/`, `notifications-center`, `notifications-digest` | Push notification stubs from mobile era, digest stubs |
| Realtime service | `frontend/src/services/realtime.ts` | Zustand-based subscription manager with reconnection |
| Email migrations | `email_integration.sql`, `email_digest_content_preferences.sql` | Schema foundations exist |
| Overdue detection | `detect-overdue-commitments.job.ts` | Already detects overdue items |

**Implication:** The v4.0 work is primarily about WIRING and HARDENING, not greenfield building. New dependencies are needed only for external delivery channels (email via Resend, push via web-push) and async job processing (BullMQ). The in-app notification path is largely built.

## New Dependencies

### Notification System (Backend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `web-push` | ^3.6 | Browser push notifications via VAPID/Web Push API | De-facto standard for Web Push in Node.js. Zero vendor lock-in, uses W3C Push API directly. No Firebase/OneSignal needed since we control the server. ~12KB, no native deps. Existing `push_device_tokens` table already has `platform = 'web'` and `provider = 'web_push'` columns ready. |
| `resend` | ^6.10 | Transactional email delivery (alerts, digests) | Best DX for Node.js email. Simple API, 99.9% deliverability, built by react-email team. Free tier (100 emails/day) sufficient for initial deployment. REST API, no SMTP config. |
| `@react-email/components` | ^0.0.31 | Email template components in React/TSX | Build email templates with same mental model as frontend. Co-maintained with Resend. Renders to static HTML for email delivery. Bilingual templates use same i18n patterns as frontend. |
| `bullmq` | ^5.73 | Job queue for email digests, scheduled notifications, push dispatch | Production-grade Redis-based queue. Already have Redis 7.x in the stack for caching. Handles delayed jobs (digest batching), retries, dead letter queues, rate limiting. De-facto standard for Node.js job queues in 2026. Alternative to pg_cron for digest scheduling with better retry/monitoring. |

**Confidence:** HIGH -- all versions verified on npm (published within last week of 2026-04-06).

**BullMQ vs pg_cron decision:** The existing Edge Function stubs suggest a pg_cron approach for digests. BullMQ is recommended instead because: (1) retry logic is built-in, (2) job monitoring via BullMQ dashboard, (3) same Redis already in Docker Compose, (4) decouples job scheduling from Supabase. However, if the team prefers keeping everything in Supabase, pg_cron + Edge Functions is a viable alternative that avoids adding BullMQ.

### E2E Testing (Dev Dependencies)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@playwright/test` | ^1.58 | E2E browser testing | Industry standard for E2E in 2026. Faster than Cypress, built-in parallel execution, auto-waiting, multi-browser. Supports `webServer` config to start both Vite + Express. Chrome for Testing builds (not Chromium) since v1.58. Existing Playwright configs at root and frontend level need to be unified. |
| `@faker-js/faker` | ^9.0 | Test data generation for E2E and seed scripts | Generate realistic diplomatic data (names, countries, dates, organizations). Well-maintained community fork, 9.x is current stable. |

**Confidence:** HIGH -- Playwright 1.58 released 2026-01-30, verified via official release notes.

**Note:** Playwright may already be installed as a dev dependency. Check `package.json` before installing. The existing CI workflow (`ci.yml`) already has an E2E job -- the work is making it reliable, not setting it up from scratch.

### Infrastructure

| Technology | Version | Purpose | Decision |
|------------|---------|---------|----------|
| Caddy | 2.9+ (Docker image) | Reverse proxy with automatic HTTPS | **RECOMMENDED** but existing nginx+certbot is already configured. See decision section below. |
| GitHub Actions | N/A | CI/CD pipeline | Already exists (`.github/workflows/ci.yml` + `deploy.yml`). Needs hardening, not creation. |

### Caddy vs Existing nginx+certbot Decision

The codebase already has nginx prod config (`deploy/nginx/nginx.prod.conf`) with HTTPS, WebSocket proxy, rate limiting, and security headers, plus a certbot container in `docker-compose.prod.yml`.

| Factor | Keep nginx+certbot | Switch to Caddy |
|--------|-------------------|-----------------|
| Effort | Low (already configured) | Medium (replace nginx, write Caddyfile, test) |
| Cert management | Manual certbot renewal cron | Automatic (zero config) |
| Config complexity | 100+ line nginx.conf already written | 5-line Caddyfile |
| WebSocket proxy | Already configured for Supabase Realtime | Caddy handles natively |
| Rate limiting | Already configured in nginx | Need Caddy rate-limit plugin |
| Security headers | Already configured | Need to replicate in Caddyfile |

**Recommendation:** Keep existing nginx+certbot for v4.0. The config already exists and works. Switching to Caddy adds migration risk for minimal gain. The certbot bootstrap issue (Pitfall #2 in PITFALLS.md) needs a setup script, not a full proxy replacement.

**Revisit Caddy for v5.0** if nginx maintenance becomes a burden.

## What NOT to Add

| Rejected | Why Not | What to Use Instead |
|----------|---------|---------------------|
| Firebase Cloud Messaging (FCM) | Overkill for web-only push. Adds Google dependency. Existing `push_device_tokens` table already supports `web_push` provider. | `web-push` with VAPID keys |
| Socket.io | Already have Supabase Realtime for live updates. `useNotificationRealtime` hook exists. | Supabase Realtime subscription on `notifications` table |
| Nodemailer | Lower-level than Resend. Requires SMTP server config, deliverability management, bounce handling. | `resend` SDK (REST API) |
| OneSignal / Novu | Third-party notification platforms add vendor dependency. Our needs are scoped (4 trigger types). | Custom notification service extending existing `notification.service.ts` |
| SendGrid | Heavier SDK, complex pricing tiers, worse DX than Resend. | `resend` |
| pg-boss | PostgreSQL-based job queue adds load to primary Supabase DB. | `bullmq` (Redis-based, Redis already in stack) |
| Cypress | Slower than Playwright. Playwright already configured in this project. | `@playwright/test` (existing) |
| Kubernetes | Massive overkill for <100 users on a single droplet. | Docker Compose (existing) |
| Grafana/Prometheus | Full observability stack is overkill. Sentry already installed for errors. | Sentry + UptimeRobot + structured `/api/health` endpoint |
| MSW (Mock Service Worker) | E2E tests should hit real backend + Supabase, not mocks. | Real API calls in Playwright tests |

## Integration Points with Existing Stack

### Notifications + Existing Supabase Realtime

The existing `useNotificationRealtime` hook already subscribes to `notifications` table INSERT/UPDATE. The existing `NotificationBadge` component already displays unread count. The integration path is:

```
Domain event occurs (assignment, deadline, stage transition)
  → notification.service.ts (extend existing) inserts into `notifications` table
  → Supabase Realtime fires (existing subscription in useNotificationRealtime)
  → NotificationBadge updates (existing component)
  → NotificationPanel shows new item (existing component)

For email/push (NEW):
  → NotificationDispatcher (new) checks notification_category_preferences (existing table)
  → If email enabled: BullMQ email queue → Resend API (new)
  → If push enabled: BullMQ push queue → web-push → browser (new)
```

### BullMQ + Existing Redis

Redis 7.x is already in `docker-compose.prod.yml`. BullMQ connects to the same instance with separate key prefixes (`bull:` vs `cache:`). No Redis config changes needed.

Queue design:
- `bull:email-immediate` -- single email alerts (concurrency: 3, rate: 10/sec)
- `bull:email-digest` -- batched daily digest (repeatable job, runs at 08:00)
- `bull:push-notification` -- browser push dispatch (concurrency: 5)
- `bull:notification-cleanup` -- prune notifications older than 30 days (daily)

### Playwright + Existing Config

Existing configs at root (`playwright.config.ts`) and frontend (`frontend/playwright.config.ts`) need to be **unified** into a single root config. Existing test stubs (`auth.spec.ts`, `create-view-dossier.spec.ts`) need to be validated and extended.

### Service Worker + Existing Vite Build

Place `sw.js` in `frontend/public/` -- Vite copies it to build output root. No Vite plugin needed.

VAPID keys generated once via `npx web-push generate-vapid-keys` and stored as environment variables.

## Installation

```bash
# Notification system (backend workspace)
cd backend && pnpm add web-push resend bullmq @react-email/components

# Type definitions for web-push
cd backend && pnpm add -D @types/web-push

# E2E testing (check if already installed first)
# pnpm list @playwright/test 2>/dev/null || pnpm add -Dw @playwright/test
pnpm add -Dw @faker-js/faker

# Install Playwright browsers (chromium only to start)
npx playwright install --with-deps chromium

# VAPID key generation (one-time setup, store in .env)
npx web-push generate-vapid-keys
```

## Bundle Impact Assessment

All new dependencies are **backend-only or dev-only**. Zero impact on frontend 200KB budget.

| Package | Location | Size Impact |
|---------|----------|-------------|
| `web-push` | Backend only | 0 frontend impact |
| `resend` | Backend only | 0 frontend impact |
| `bullmq` | Backend only | 0 frontend impact |
| `@react-email/components` | Backend only (server-rendered) | 0 frontend impact |
| `@playwright/test` | Dev dependency | 0 production impact |
| `@faker-js/faker` | Dev dependency | 0 production impact |

**Frontend additions** for notification UI:
- Most components already exist (`NotificationBell`, `NotificationList`, `NotificationPanel`, etc.)
- New: `NotificationToast` (~2KB), `PushPermissionPrompt` (~3KB), Service Worker `sw.js` (~2KB separate file)
- All well within existing 200KB budget

## Environment Variables (New)

```env
# Resend (email)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Web Push (VAPID)
VAPID_PUBLIC_KEY=BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQM=
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@intl-dossier.example.com

# Domain (for HTTPS -- needed regardless of Caddy or nginx)
DOMAIN=intl-dossier.example.com
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Email | Resend | Nodemailer + SMTP | Manual deliverability, bounce handling, SMTP config |
| Email | Resend | SendGrid | Heavier SDK, complex pricing, worse DX |
| Email templates | @react-email/components | MJML | Different paradigm from React; team knows React/TSX |
| Push | web-push | Firebase FCM | Google dependency for web-only push |
| Push | web-push | OneSignal | Vendor lock-in, overkill for scoped push |
| Queue | BullMQ | pg-boss | Adds load to primary DB; Redis already available |
| Queue | BullMQ | pg_cron + Edge Functions | Viable alternative (existing stubs), but less retry control and no job dashboard |
| Proxy | nginx+certbot (keep) | Caddy | Already configured; switching adds migration risk |
| E2E | Playwright (existing) | Cypress | Slower, paid parallelism; Playwright already in project |
| CI/CD | GitHub Actions (existing) | GitLab CI | Already on GitHub with workflows |
| Monitoring | UptimeRobot + Sentry | Grafana/Prometheus | Overkill for <100 users |

## Sources

- [web-push npm](https://www.npmjs.com/package/web-push) -- v3.6, Web Push library for Node.js (HIGH confidence)
- [web-push GitHub](https://github.com/web-push-libs/web-push) -- VAPID key generation, examples (HIGH confidence)
- [Resend](https://resend.com) -- v6.10, email API for developers (HIGH confidence)
- [Resend Node.js SDK](https://github.com/resend/resend-node) -- Express integration examples (HIGH confidence)
- [React Email](https://react.email/docs/integrations/resend) -- template components with Resend integration (HIGH confidence)
- [BullMQ docs](https://docs.bullmq.io/) -- v5.73, Redis-based job queue (HIGH confidence)
- [BullMQ 5 Guide 2026](https://1xapi.com/blog/bullmq-5-background-job-queues-nodejs-2026-guide) -- production patterns (MEDIUM confidence)
- [Playwright release notes](https://playwright.dev/docs/release-notes) -- v1.58, Chrome for Testing (HIGH confidence)
- [Playwright best practices](https://playwright.dev/docs/best-practices) -- test isolation, fixtures (HIGH confidence)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https) -- alternative to nginx+certbot (HIGH confidence)
- [Supabase push notifications](https://supabase.com/docs/guides/functions/examples/push-notifications) -- database webhook + Edge Function pattern (HIGH confidence)
- [GitHub Actions + DigitalOcean](https://faun.dev/c/stories/thaotruongrakuten/full-cicd-with-docker-github-actions-digitalocean-droplets-container-registry/) -- CI/CD workflow (MEDIUM confidence)
- [Best Email Libraries Node.js 2026](https://www.pkgpulse.com/blog/best-email-libraries-nodejs-2026) -- Resend recommended (MEDIUM confidence)
- Codebase analysis: existing notification components, migrations, CI workflows, Docker configs (HIGH confidence)
