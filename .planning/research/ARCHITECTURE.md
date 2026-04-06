# Architecture Patterns

**Domain:** Notifications, Production Deployment, and E2E Testing for Diplomatic Dossier System
**Researched:** 2026-04-06
**Confidence:** HIGH (based on direct codebase analysis of existing patterns and infrastructure)

## Recommended Architecture

### High-Level Integration Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXISTING SYSTEM                              │
│                                                                     │
│  Frontend (React 19 + TanStack)     Backend (Express)               │
│  ┌──────────────────────┐           ┌──────────────────────┐        │
│  │ useNotificationCenter│           │ notification.service  │        │
│  │ NotificationList     │           │ (basic insert only)   │        │
│  │ NotificationPanel    │           └──────────┬───────────┘        │
│  │ NotificationBadge    │                      │                    │
│  │ NotificationPrefs    │                      │                    │
│  └──────────┬───────────┘                      │                    │
│             │                                  │                    │
│  ┌──────────▼───────────┐           ┌──────────▼───────────┐        │
│  │ Supabase Realtime    │◄──────────│ Supabase PostgreSQL   │        │
│  │ (notifications tbl)  │           │ notifications table   │        │
│  │ (already subscribed) │           │ push_device_tokens    │        │
│  └──────────────────────┘           │ notif_category_prefs  │        │
│                                     └──────────────────────┘        │
│                                                                     │
│  Deploy: Docker Compose on DigitalOcean (nginx + certbot ready)     │
│  CI/CD: GitHub Actions (ci.yml + deploy.yml exist but incomplete)   │
│  Tests: Playwright config exists, E2E jobs in CI, minimal specs     │
└─────────────────────────────────────────────────────────────────────┘
```

### What Already Exists (Do NOT Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| `notifications` table | Supabase migration `20260111100001` | Schema exists with categories, priorities, expiry |
| `push_device_tokens` table | Same migration | Schema exists with platform, provider, failure tracking |
| `notification_category_preferences` | Same migration | Schema exists with per-channel toggles |
| `useNotificationCenter` hook | `frontend/src/hooks/useNotificationCenter.ts` | Full CRUD: list, counts, mark-read, delete, preferences, device registration |
| `useNotificationRealtime` hook | Same file | Supabase Realtime subscription on INSERT/UPDATE |
| `NotificationList` component | `frontend/src/components/notifications/NotificationList.tsx` | Paginated list with date grouping, RTL support |
| `NotificationItem` component | Same directory | Individual notification rendering |
| `NotificationBadge` component | Same directory | Unread count badge |
| `NotificationPanel` component | Same directory | Slide-out panel |
| `NotificationPreferences` component | Same directory | Per-category channel toggles |
| `NotificationsSettingsSection` | `frontend/src/components/settings/sections/` | Settings page integration |
| `notification.service.ts` | `backend/src/services/notification.service.ts` | Basic `sendInAppNotification` + health score drop |
| Docker Compose | `deploy/docker-compose.prod.yml` | nginx + frontend + backend + redis + anythingllm + certbot |
| nginx prod config | `deploy/nginx/nginx.prod.conf` | HTTPS, WebSocket proxy, rate limiting, security headers |
| CI workflow | `.github/workflows/ci.yml` | Lint, unit tests, E2E job, RTL tests, a11y tests, bundle size, Lighthouse, Docker build, security scan |
| Deploy workflow | `.github/workflows/deploy.yml` | Docker push + SSH deploy to droplet |
| Playwright configs | Root + `frontend/playwright.config.ts` | Both exist |
| Supabase Edge Functions | `supabase/functions/push-notification*/` | Push notification stubs from mobile era |
| Realtime service | `frontend/src/services/realtime.ts` | Zustand-based subscription manager with reconnection |

### What Needs to Be Built

```
NEW COMPONENTS (integrate with existing, don't replace)

1. NOTIFICATION TRIGGERS (Backend)
   ┌─────────────────────────────────────────┐
   │  backend/src/services/                   │
   │  notification-dispatcher.service.ts      │ ← NEW: Central dispatch
   │                                          │    Routes to: in-app, email, push
   │  notification-email.service.ts           │ ← NEW: Resend adapter
   │  notification-push.service.ts            │ ← NEW: Web Push (VAPID) adapter
   │  notification-triggers.service.ts        │ ← NEW: Event → notification mapping
   └─────────────────────────────────────────┘

2. DATABASE ADDITIONS (Supabase)
   ┌─────────────────────────────────────────┐
   │  New migration:                          │
   │  - Add missing columns to notifications  │ ← Verify schema completeness
   │  - Email digest preferences/schedule     │ ← digest_frequency, last_digest_at
   │  - Notification templates table          │ ← Optional: bilingual templates
   └─────────────────────────────────────────┘

3. FRONTEND ADDITIONS
   ┌─────────────────────────────────────────┐
   │  frontend/public/sw.js                   │ ← NEW: Service worker for Web Push
   │  frontend/src/lib/push-registration.ts   │ ← NEW: VAPID key registration
   │  frontend/src/components/notifications/  │
   │    NotificationToast.tsx                  │ ← NEW: Toast on new notification
   └─────────────────────────────────────────┘

4. PRODUCTION DEPLOYMENT
   ┌─────────────────────────────────────────┐
   │  deploy/                                 │
   │    setup-ssl.sh                          │ ← NEW: Certbot initial setup script
   │    backup.sh                             │ ← NEW: Redis + volume backup
   │    docker-compose.prod.yml               │ ← MODIFY: Add env for email/push
   │  .github/workflows/                      │
   │    deploy.yml                            │ ← MODIFY: Fix SSH deploy, rollback
   │    ci.yml                                │ ← MODIFY: Add E2E with Supabase
   └─────────────────────────────────────────┘

5. E2E TESTS (Playwright)
   ┌─────────────────────────────────────────┐
   │  tests/e2e/                              │
   │    auth.spec.ts                          │ ← NEW: Login/logout/session
   │    dossier-crud.spec.ts                  │ ← NEW: Create/edit/delete dossier
   │    work-items.spec.ts                    │ ← NEW: Kanban workflow
   │    engagement-lifecycle.spec.ts          │ ← NEW: Stage transitions
   │    notifications.spec.ts                 │ ← NEW: Bell, panel, mark-read
   │    navigation.spec.ts                    │ ← NEW: Sidebar, Cmd+K, routing
   │  tests/fixtures/                         │
   │    auth.fixture.ts                       │ ← NEW: Authenticated page fixture
   │    seed.fixture.ts                       │ ← NEW: Test data seeding
   └─────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **NotificationDispatcher** (new) | Routes notification to correct channels based on user preferences | notification.service (in-app), email service, push service, Supabase (preferences lookup) |
| **NotificationTriggers** (new) | Maps domain events to notification payloads | Express route handlers (called after mutations), NotificationDispatcher |
| **EmailAdapter** (new) | Sends transactional + digest emails | Resend API |
| **WebPushAdapter** (new) | Sends browser push via VAPID | Web Push protocol, push_device_tokens table |
| **ServiceWorker** (new) | Receives push events, shows browser notifications | Browser Push API, frontend notification handlers |
| **NotificationToast** (new) | Shows in-app toast when Realtime delivers new notification | useNotificationRealtime (existing), Sonner toast library |
| **E2E Test Suite** (new) | Validates critical user flows | Playwright, Supabase test instance, frontend dev server |

## Data Flow

### Notification Flow: Event to All Channels

```
1. Domain Event Occurs
   (e.g., work item assigned, engagement stage changed)
   │
   ▼
2. Express Route Handler / Service calls NotificationTriggers
   triggers.onWorkItemAssigned(workItemId, assigneeId)
   │
   ▼
3. NotificationTriggers builds payload
   { type: 'assignment', title, message, category: 'assignments',
     action_url: '/work-items/{id}', priority: 'high' }
   │
   ▼
4. NotificationDispatcher checks user preferences
   SELECT * FROM notification_category_preferences
   WHERE user_id = $1 AND category = 'assignments'
   │
   ├─── in_app_enabled? ──► notification.service.sendInAppNotification()
   │                         (INSERT into notifications table)
   │                         │
   │                         ▼ Supabase Realtime fires
   │                         │
   │                         ▼ useNotificationRealtime receives INSERT
   │                         │
   │                         ▼ NotificationToast shows + badge count updates
   │
   ├─── email_enabled? ──► EmailAdapter.send(user.email, template, data)
   │                        (Resend API)
   │
   └─── push_enabled? ──► WebPushAdapter.sendToDevices(userId, payload)
                           (SELECT tokens FROM push_device_tokens
                            WHERE user_id = $1 AND is_active = true
                            AND platform = 'web')
                           │
                           ▼ Service Worker receives push event
                           │
                           ▼ Browser shows system notification
```

### Email Digest Flow

```
1. Cron job runs (backend/src/jobs/ or Supabase pg_cron)
   Every 24h for daily digest, every 7d for weekly
   │
   ▼
2. Query undigested notifications per user
   SELECT * FROM notifications
   WHERE digest_included = false AND email_sent = false
   AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY user_id
   │
   ▼
3. For each user with digest preference:
   EmailAdapter.sendDigest(user.email, notifications[], user.language)
   │
   ▼
4. Mark notifications as digest_included = true
```

### Deployment Flow (Target State)

```
1. Developer pushes to main
   │
   ▼
2. GitHub Actions CI runs
   ├── Lint + TypeCheck (parallel)
   ├── Unit Tests (parallel)
   ├── E2E Tests with Supabase (parallel)
   └── Bundle Size Check
   │
   ▼ (all pass)
3. Docker Build + Push to GHCR
   │
   ▼
4. SSH to DigitalOcean droplet (138.197.195.242)
   ├── docker compose pull
   ├── docker compose up -d --remove-orphans
   └── Health check: curl https://domain/health
   │
   ▼ (health check fails?)
5. Rollback: docker compose up -d --force-recreate (previous images cached)
```

## Patterns to Follow

### Pattern 1: Notification Dispatcher (Strategy Pattern)

**What:** Central dispatcher that routes notifications to channels based on user preferences.
**When:** Every domain event that should notify a user.
**Why:** The existing `notification.service.ts` only does in-app inserts. Extend with dispatcher, do not replace.

```typescript
// backend/src/services/notification-dispatcher.service.ts
interface NotificationPayload {
  userId: string
  type: string
  category: NotificationCategory
  title: string
  titleAr?: string
  message: string
  messageAr?: string
  priority: NotificationPriority
  actionUrl?: string
  sourceType?: string
  sourceId?: string
  data?: Record<string, unknown>
}

interface NotificationChannel {
  send(payload: NotificationPayload, user: UserProfile): Promise<void>
}

class NotificationDispatcher {
  private channels: Map<string, NotificationChannel> = new Map()

  register(name: string, channel: NotificationChannel): void {
    this.channels.set(name, channel)
  }

  async dispatch(payload: NotificationPayload): Promise<void> {
    const preferences = await this.getUserPreferences(
      payload.userId,
      payload.category,
    )
    const user = await this.getUser(payload.userId)

    const dispatches: Promise<void>[] = []

    if (preferences.in_app_enabled !== false) {
      // In-app defaults to enabled
      dispatches.push(this.channels.get('in_app')!.send(payload, user))
    }
    if (preferences.email_enabled) {
      dispatches.push(this.channels.get('email')!.send(payload, user))
    }
    if (preferences.push_enabled) {
      dispatches.push(this.channels.get('push')!.send(payload, user))
    }

    // Fire-and-forget with error isolation per channel
    await Promise.allSettled(dispatches)
  }
}
```

### Pattern 2: Trigger Registration (Observer Pattern)

**What:** Register notification triggers at service call sites, not in route handlers.
**When:** After mutations that should notify users.
**Why:** Keeps route handlers clean, centralizes notification logic.

```typescript
// backend/src/services/notification-triggers.service.ts
export class NotificationTriggers {
  constructor(private dispatcher: NotificationDispatcher) {}

  async onWorkItemAssigned(
    workItem: WorkItem,
    assigneeId: string,
    assignedBy: string,
  ): Promise<void> {
    await this.dispatcher.dispatch({
      userId: assigneeId,
      type: 'work_item_assigned',
      category: 'assignments',
      title: `New assignment: ${workItem.title}`,
      message: `You have been assigned a ${workItem.source} work item`,
      priority: workItem.priority === 'urgent' ? 'urgent' : 'normal',
      actionUrl: `/work-items/${workItem.id}`,
      sourceType: 'work_item',
      sourceId: workItem.id,
    })
  }

  async onDeadlineApproaching(
    workItem: WorkItem,
    hoursRemaining: number,
  ): Promise<void> { /* ... */ }

  async onEngagementStageChanged(
    engagement: Engagement,
    newStage: string,
    changedBy: string,
  ): Promise<void> { /* ... */ }

  async onAttentionItemCreated(
    item: AttentionItem,
    targetUserId: string,
  ): Promise<void> { /* ... */ }
}
```

### Pattern 3: E2E Test Fixtures with Authenticated State

**What:** Reusable Playwright fixtures that handle auth + seed data.
**When:** Every E2E test that needs a logged-in user.
**Why:** Avoid repeating login flow in every test; use storage state.

```typescript
// tests/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

// Global setup: login once, save state
// tests/global-setup.ts
async function globalSetup(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(process.env.BASE_URL + '/login')
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!)
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
  await page.context().storageState({ path: 'tests/.auth/user.json' })
  await browser.close()
}
```

### Pattern 4: Email via Resend

**What:** Use Resend for transactional email.
**Why over alternatives:**
- Nodemailer + SMTP: Requires SMTP server, deliverability issues
- SendGrid: Overcomplicated for this scale
- AWS SES: Requires separate AWS account
- Resend: Simple API, 100 emails/day free, good DX, React Email for templates

### Pattern 5: Web Push via VAPID (No Firebase)

**What:** Use `web-push` npm package with VAPID keys for browser push.
**Why:** No Firebase dependency, works with all modern browsers, free, open standard.
**Existing support:** `push_device_tokens` table already has `platform = 'web'` and `provider = 'web_push'` options.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Notification in Route Handlers
**What:** Calling notification dispatch directly in Express route handlers.
**Why bad:** Mixes HTTP concerns with notification logic; hard to test; easy to forget.
**Instead:** Call `NotificationTriggers` methods from service layer after successful mutation.

### Anti-Pattern 2: Synchronous Notification Dispatch
**What:** Awaiting all notification channels before responding to the HTTP request.
**Why bad:** Email/push failures slow down or break the API response.
**Instead:** Use `Promise.allSettled()` with fire-and-forget for email/push. In-app insert can be awaited since it is a fast DB write.

### Anti-Pattern 3: Rebuilding Existing Notification UI
**What:** Creating new notification components from scratch.
**Why bad:** `useNotificationCenter`, `NotificationList`, `NotificationPanel`, `NotificationBadge`, and `NotificationPreferences` already exist and work with Supabase Realtime. The hook already supports categories, pagination, mark-as-read, preferences, and device registration.
**Instead:** Add `NotificationToast` for real-time alerts. Audit and fix existing components. Wire the bell icon into the sidebar/header.

### Anti-Pattern 4: Database Triggers for Complex Routing Logic
**What:** Using PostgreSQL triggers for notification channel routing.
**Why bad:** Hard to debug, hard to test, mixes data layer with business logic.
**Instead:** Keep all routing logic in the backend NotificationDispatcher. Database should only store notifications.

### Anti-Pattern 5: Monolithic E2E Tests
**What:** Single long test that does login, create, edit, delete, navigate all in one flow.
**Why bad:** Flaky, hard to debug, one failure blocks everything.
**Instead:** Independent test files per feature with shared auth fixtures.

## Scalability Considerations

| Concern | Current (1-10 users) | At 100 users | At 1000 users |
|---------|---------------------|--------------|---------------|
| Notification volume | Direct DB insert + Realtime | Same pattern works | Add Redis queue (BullMQ) for async dispatch |
| Email sending | Resend free tier (100/day) | Resend paid ($20/mo) | Resend or migrate to SES |
| Push delivery | web-push direct send | Same | Batch sends with retry queue |
| E2E test speed | Serial, ~2 min | Same | Parallelize with Playwright sharding |
| Database connections | Supabase pooler | Same | Review connection pooling config |
| Deployment | Single DigitalOcean droplet | Same with bigger droplet | Docker Swarm or managed k8s |

## Suggested Build Order (Dependencies)

```
Phase A: Notification Backend Infrastructure
  ├── NotificationDispatcher service (routes to channels)
  ├── NotificationTriggers service (event-to-payload mapping)
  ├── Extend existing notification.service.ts (add category, priority, action_url)
  └── Verify/fix existing DB schema (ensure notifications table matches hook types)
  
Phase B: Notification Channels (depends on A)
  ├── Email channel via Resend
  ├── Web Push channel via VAPID + web-push
  ├── Service worker (frontend/public/sw.js)
  └── Push permission + registration flow in frontend
  
Phase C: Frontend Notification Wiring (depends on A, partially B)
  ├── NotificationToast component (uses existing useNotificationRealtime)
  ├── Wire NotificationTriggers calls into backend route handlers
  ├── Audit/fix existing notification UI components
  └── Notification preferences UI for new email/push channels
  
Phase D: Production Deployment Hardening (independent)
  ├── SSL setup script for certbot
  ├── Fix deploy.yml (SSH deploy, health check, rollback)
  ├── Monitoring (uptime checks, error alerting)
  └── Backup scripts (Redis volumes)
  
Phase E: E2E Testing (depends on working app, ideally after D)
  ├── Auth fixture + global setup
  ├── Seed data fixture
  ├── Critical flow specs (auth, dossier CRUD, work items, engagement lifecycle)
  ├── Notification E2E tests
  └── CI integration (update ci.yml E2E job with proper env)
  
Phase F: Seed Data + First-Run (depends on final schema)
  ├── Comprehensive realistic seed data
  └── First-run onboarding hints
```

**Phase ordering rationale:**
1. Backend notification infrastructure must exist before channels can be added
2. Email and push channels are independent of each other but both depend on dispatcher
3. Frontend wiring connects backend triggers to existing UI components
4. Deployment hardening is independent and can run in parallel with notification work
5. E2E tests validate everything built in prior phases
6. Seed data comes last because it needs the final schema stabilized

## Sources

- Existing codebase analysis (HIGH confidence): `useNotificationCenter.ts`, `notification.service.ts`, migration `20260111100001`, `realtime.ts`, Docker/nginx/CI configs
- Supabase Realtime patterns already in use: `useAttentionRealtime.ts`, `useUnifiedWorkRealtime.ts`, `useDossierPresence.ts`
- GitHub Actions CI/CD: `.github/workflows/ci.yml` (comprehensive), `.github/workflows/deploy.yml` (basic SSH deploy)
- Playwright: configs at root and frontend level, existing RTL+a11y test jobs in CI
