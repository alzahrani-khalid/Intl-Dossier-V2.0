# Phase 16: Email & Push Channels - Research

**Researched:** 2026-04-06
**Domain:** Email delivery (Resend), email digests (BullMQ scheduling), Web Push notifications (VAPID)
**Confidence:** HIGH

## Summary

Phase 16 extends the existing Phase 15 in-app notification system with three external delivery channels: critical email alerts, scheduled digest emails, and browser push notifications. The project already has substantial infrastructure in place -- an `email_queue` table, a `ResendProvider` in the Supabase Edge Function, `notification_category_preferences` with `email_enabled`/`push_enabled` columns, a `get_user_digest_content()` Postgres function, `notification_digests` table, and a BullMQ processor pattern. The primary work is wiring these existing pieces together and adding the new Web Push channel.

The email path requires extending `notification.processor.ts` to insert rows into `email_queue` when `email_enabled` is true, then the existing Edge Function handles Resend delivery. Digest scheduling follows the proven `registerDeadlineChecker()` repeatable job pattern. Web Push is the only net-new infrastructure: a `push_subscriptions` table (VAPID-shaped, not FCM), a `web-push` npm package integration, a service worker in `frontend/public/`, and a soft-ask opt-in banner component.

**Primary recommendation:** Implement in four waves: (1) email channel wiring in processor + templates, (2) digest scheduling + rendering, (3) Web Push backend + service worker + subscription management, (4) soft-ask opt-in UX + settings integration.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Extend BullMQ notification processor to insert into `email_queue` when `email_enabled` is true. Edge Function handles Resend delivery -- do not add `resend` as backend npm dependency.
- **D-02:** Use existing `ResendProvider` class in Edge Function with retry logic, template substitution, and bilingual unsubscribe footer injection.
- **D-03:** Schedule digests as BullMQ repeatable jobs following `deadline-scheduler.ts` pattern.
- **D-04:** Use existing `get_user_digest_content()` Postgres function. Render into bilingual HTML templates.
- **D-05:** Respect user preferences from `EmailDigestSettings.tsx` (schedule, delivery time, content toggles).
- **D-06:** Use Web Push API (VAPID) with `web-push` npm package. No Firebase Cloud Messaging.
- **D-07:** Create new `push_subscriptions` table for Web Push. Do NOT reuse `push_device_tokens`.
- **D-08:** Create service worker (`sw.js`) in `frontend/public/`.
- **D-09:** Extend BullMQ processor for Web Push when `push_enabled` is true and user has active subscription.
- **D-10:** Contextual inline banner after first actionable notification -- never on cold page load.
- **D-11:** Store soft-ask dismissal in `user_preferences` Supabase table (not localStorage).
- **D-12:** Settings page `NotificationsSettingsSection.tsx` has existing `notifications_push` toggle for explicit opt-in.

### Claude's Discretion

- Email template HTML/CSS design and layout
- Digest aggregation query tuning and content formatting
- Service worker caching strategy
- Push notification icon and badge design
- Soft-ask banner animation and dismissal timing
- Error handling for expired/invalid push subscriptions

### Deferred Ideas (OUT OF SCOPE)

- SMS notification channel (ADV-05)
- Safari Web Push support (ADV-06)
- Mobile push via FCM/APNS
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                         | Research Support                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NOTIF-03 | User receives email for critical notifications (overdue deadlines, new assignments) via Resend      | Existing `email_queue` table + `ResendProvider` Edge Function + `notification_category_preferences.email_enabled`. Processor extension inserts into queue.                                  |
| NOTIF-04 | User receives daily/weekly email digest summarizing pending attention items                         | Existing `get_user_digest_content()` function + `notification_digests` table + `email_notification_preferences` digest columns. BullMQ repeatable job pattern from `deadline-scheduler.ts`. |
| NOTIF-05 | User receives browser push notifications for urgent items when app is not in focus (Chrome/Firefox) | `web-push` v3.6.7 + VAPID protocol. New `push_subscriptions` table + service worker + processor extension.                                                                                  |
| NOTIF-09 | Push notification opt-in uses soft-ask pattern (contextual prompt, not cold browser permission)     | New banner component triggered by `useNotificationCenter` hook context. Dismissal state in `user_preferences` table.                                                                        |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- RTL-first with logical Tailwind properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`)
- Mobile-first responsive design (base -> sm -> md -> lg -> xl)
- HeroUI v3 component hierarchy (HeroUI -> Aceternity -> Kibo-UI -> shadcn)
- Bilingual Arabic/English with `useTranslation` and `dir={isRTL ? 'rtl' : 'ltr'}`
- TypeScript strict mode, no `any`, explicit return types, semicolons off, single quotes
- Named exports for functions, default exports for React components
- Supabase migrations via Supabase MCP

## Standard Stack

### Core

| Library         | Version | Purpose                                 | Why Standard                                                      |
| --------------- | ------- | --------------------------------------- | ----------------------------------------------------------------- |
| web-push        | 3.6.7   | VAPID Web Push server-side              | Only maintained Node.js Web Push library [VERIFIED: npm registry] |
| @types/web-push | 3.6.4   | TypeScript types for web-push           | Official type definitions [VERIFIED: npm registry]                |
| bullmq          | 5.73.0  | Job scheduling (digests, push dispatch) | Already in project [VERIFIED: backend/package.json]               |
| ioredis         | ^5.10.1 | Redis connection for BullMQ             | Already in project [VERIFIED: backend/package.json]               |

### Supporting (Already in Project)

| Library                             | Purpose                   | When to Use                                               |
| ----------------------------------- | ------------------------- | --------------------------------------------------------- |
| Supabase Edge Function (email-send) | Resend email delivery     | All outbound emails via `email_queue` table insertion     |
| lucide-react                        | Icons for notification UI | Bell, Mail, Smartphone icons already imported in settings |
| react-hook-form                     | Settings form state       | Already used in NotificationsSettingsSection              |
| i18next                             | Bilingual templates       | All user-facing text                                      |

### Alternatives Considered

| Instead of                       | Could Use                    | Tradeoff                                                           |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| web-push                         | Firebase Cloud Messaging     | FCM adds vendor lock-in and mobile complexity -- D-06 rules it out |
| BullMQ repeatable jobs           | pg_cron                      | pg_cron requires DB extension; BullMQ already proven in codebase   |
| Supabase Edge Function for email | Direct Resend SDK in backend | D-01 explicitly forbids adding resend to backend dependencies      |

**Installation:**

```bash
cd backend && pnpm add web-push @types/web-push
```

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
  queues/
    notification.processor.ts     # Extended: email + push dispatch
    notification.queue.ts         # Extended: digest job types
    deadline-scheduler.ts         # Existing pattern to follow
    digest-scheduler.ts           # NEW: repeatable digest jobs
  services/
    notification.service.ts       # Existing
    push.service.ts               # NEW: Web Push subscription + send
    email-template.service.ts     # NEW: bilingual HTML rendering
frontend/
  public/
    sw.js                         # NEW: service worker for push
  src/
    components/
      notifications/
        PushOptInBanner.tsx        # NEW: soft-ask contextual banner
    hooks/
      usePushSubscription.ts       # NEW: subscription management
    services/
      push-subscription.ts         # NEW: API calls for subscription CRUD
supabase/
  migrations/
    YYYYMMDD_push_subscriptions.sql  # NEW: Web Push table
    YYYYMMDD_user_prefs_push_dismissed.sql  # NEW: add column
```

### Pattern 1: Email Channel Dispatch (extends existing processor)

**What:** When BullMQ processes a notification, check `email_enabled` for the category. If true, insert a row into `email_queue` with bilingual subject/body from templates. The existing Edge Function polls and sends via Resend.
**When to use:** Every notification dispatch.
**Example:**

```typescript
// In notification.processor.ts - after in-app notification creation
// Source: existing codebase pattern
const { data: emailPref } = await supabase
  .from('notification_category_preferences')
  .select('email_enabled')
  .eq('user_id', userId)
  .eq('category', category)
  .single()

if (emailPref?.email_enabled !== false) {
  const { userEmail, language } = await getUserEmailAndLanguage(userId)
  const { subject, bodyHtml, bodyText } = renderEmailTemplate(type, language, {
    title,
    message,
    actionUrl,
  })
  await supabase.from('email_queue').insert({
    to_email: userEmail,
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
    template_type: mapNotificationTypeToTemplate(type),
    template_data: { title, message, actionUrl },
    language,
    user_id: userId,
    priority: mapPriorityToNumber(priority),
  })
}
```

### Pattern 2: Digest Scheduling (follows deadline-scheduler pattern)

**What:** Register BullMQ repeatable jobs that query users with digest enabled, call `get_user_digest_content()`, render bilingual HTML, and insert into `email_queue`.
**When to use:** Daily at user's configured time, weekly on configured day.
**Example:**

```typescript
// Source: deadline-scheduler.ts pattern
export async function registerDigestScheduler(): Promise<void> {
  // Daily digest - runs every hour, checks which users need digest NOW
  await notificationQueue.add('process-daily-digests', {} as never, {
    repeat: { every: 60 * 60 * 1000 }, // hourly
    jobId: 'daily-digest-processor',
  })
  // Weekly digest - runs daily, checks which users need weekly digest today
  await notificationQueue.add('process-weekly-digests', {} as never, {
    repeat: { every: 24 * 60 * 60 * 1000 }, // daily
    jobId: 'weekly-digest-processor',
  })
  logInfo('Digest schedulers registered')
}
```

### Pattern 3: Web Push Subscription Flow

**What:** Frontend requests permission, gets PushSubscription from browser, sends to backend API which stores in `push_subscriptions` table. On notification dispatch, processor sends via `web-push` library.
**When to use:** After soft-ask opt-in or settings toggle.
**Example:**

```typescript
// Backend push.service.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string; icon?: string },
): Promise<void> {
  await webpush.sendNotification(subscription, JSON.stringify(payload))
}
```

### Pattern 4: Service Worker Push Handler

**What:** Minimal service worker that listens for `push` events and displays notifications.
**Example:**

```javascript
// frontend/public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Intl Dossier'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.url || '/' },
    dir: data.dir || 'auto', // RTL support
    lang: data.lang || 'en',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
```

### Anti-Patterns to Avoid

- **Cold permission prompt:** Never call `Notification.requestPermission()` on page load -- always after user interaction (soft-ask banner or settings toggle)
- **Polling Edge Function from backend:** The Edge Function is invoked by Supabase cron or external trigger, not polled from Express
- **Storing VAPID keys in code:** VAPID keys must be environment variables, never committed
- **Blocking on email send:** Email insertion into `email_queue` is fire-and-forget from the processor's perspective

## Don't Hand-Roll

| Problem                       | Don't Build          | Use Instead                                        | Why                                                    |
| ----------------------------- | -------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| VAPID key generation          | Manual crypto        | `web-push.generateVAPIDKeys()`                     | Correct curve and format guaranteed                    |
| Push payload encryption       | Manual encryption    | `web-push.sendNotification()`                      | RFC 8291 encryption is complex                         |
| Email HTML rendering          | String concatenation | Template function with `{{variable}}` substitution | Existing `replaceTemplateVariables()` in Edge Function |
| Retry with backoff            | Custom retry loops   | BullMQ built-in retry + Edge Function backoff      | Both already configured                                |
| Subscription expiry detection | Manual checks        | Handle 410 Gone from `sendNotification()`          | Web Push standard error code                           |

**Key insight:** The project already has email queue infrastructure, digest content aggregation, and notification preference management. This phase is primarily integration work, not greenfield.

## Common Pitfalls

### Pitfall 1: Service Worker Requires HTTPS

**What goes wrong:** Service workers (and thus Web Push) only work on HTTPS origins (or localhost for dev).
**Why it happens:** Browser security policy -- Push API requires secure context.
**How to avoid:** Phase 14 (DEPLOY-01) must complete HTTPS setup before push can work in production. For local dev, `localhost` is treated as secure.
**Warning signs:** `navigator.serviceWorker` is `undefined` on HTTP pages.

### Pitfall 2: Push Subscription Expiry

**What goes wrong:** Push subscriptions expire silently. Sending to an expired subscription returns 410 Gone.
**Why it happens:** Browser vendors rotate push endpoints for privacy.
**How to avoid:** Catch 410 errors in `sendPushNotification()` and delete the subscription from `push_subscriptions`. Re-prompt user on next visit.
**Warning signs:** Rising 410 error rate in push delivery logs.

### Pitfall 3: Digest Timing Across Timezones

**What goes wrong:** All users get digest at the same UTC time instead of their preferred local time.
**Why it happens:** BullMQ repeatable jobs run at fixed intervals, not per-user times.
**How to avoid:** Run the digest processor hourly. For each run, query users whose `daily_digest_time` falls within the current hour in their timezone (`quiet_hours_timezone` column).
**Warning signs:** Users in non-UTC timezones report receiving digests at wrong times.

### Pitfall 4: Double Notification on Email + In-App

**What goes wrong:** User sees the same notification content twice (in-app + email) with no way to distinguish.
**Why it happens:** Both channels fire from the same processor without coordination.
**How to avoid:** Email templates should add context ("You received this email because...") and link to the in-app notification. Mark email-sent notifications in `data` column.
**Warning signs:** User complaints about redundant notifications.

### Pitfall 5: Soft-Ask Banner Showing Repeatedly

**What goes wrong:** User dismisses the push opt-in banner but sees it again on next page load.
**Why it happens:** Dismissal stored in component state instead of persisted.
**How to avoid:** D-11 specifies storing dismissal in `user_preferences` table. Add a `push_prompt_dismissed_at` column.
**Warning signs:** Users seeing banner after explicitly dismissing it.

### Pitfall 6: RTL in Email Templates

**What goes wrong:** Arabic email content renders left-to-right in email clients.
**Why it happens:** Email clients ignore CSS `direction: rtl` unless it's inline on the container.
**How to avoid:** Arabic templates must use `dir="rtl"` attribute on `<html>`, `<body>`, and content `<td>` elements. Use inline styles, not CSS classes.
**Warning signs:** Arabic text left-aligned in Gmail/Outlook preview.

## Code Examples

### VAPID Key Generation (one-time setup)

```typescript
// Run once to generate keys, store in environment
import webpush from 'web-push'
const vapidKeys = webpush.generateVAPIDKeys()
console.log('Public:', vapidKeys.publicKey)
console.log('Private:', vapidKeys.privateKey)
// Store as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars
```

[VERIFIED: web-push npm docs]

### Frontend Push Subscription

```typescript
// Source: Web Push API standard
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })
  return subscription
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
```

[VERIFIED: MDN Web Push API]

### push_subscriptions Migration

```sql
-- New table for Web Push subscriptions (VAPID-shaped)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_push_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON public.push_subscriptions(is_active) WHERE is_active = TRUE;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

[ASSUMED: Schema design based on Web Push API subscription shape]

### user_preferences Column Addition for Soft-Ask Dismissal

```sql
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS push_prompt_dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN user_preferences.push_prompt_dismissed_at
IS 'Timestamp when user dismissed the push notification opt-in banner. NULL means not dismissed.';
```

[VERIFIED: existing user_preferences table structure in 001_user_preferences.sql]

## State of the Art

| Old Approach                | Current Approach                   | When Changed          | Impact                                               |
| --------------------------- | ---------------------------------- | --------------------- | ---------------------------------------------------- |
| FCM for web push            | VAPID/Web Push standard            | 2019+                 | No vendor lock-in, direct browser push               |
| Expo Push for web           | Native Web Push API                | 2023+                 | No intermediary service needed                       |
| Server-side email rendering | Edge Function email processing     | Already in project    | Separation of concerns, Resend in Edge Function only |
| Single digest cron          | Per-user timezone-aware scheduling | Current best practice | Users get digests at their preferred local time      |

**Deprecated/outdated:**

- GCM (Google Cloud Messaging): Replaced by FCM, which is itself overkill for web-only apps
- `push_device_tokens` table in this project: FCM/APNS-shaped, incompatible with VAPID subscriptions (D-07)

## Assumptions Log

| #   | Claim                                                                            | Section       | Risk if Wrong                                                  |
| --- | -------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------- |
| A1  | `user_preferences` table can be altered to add `push_prompt_dismissed_at` column | Code Examples | Low -- table exists, adding nullable column is safe            |
| A2  | HTTPS is available in production (Phase 14 prerequisite)                         | Pitfalls      | HIGH -- push notifications will not work without HTTPS         |
| A3  | Resend API key and sending domain DNS records are configured                     | Architecture  | HIGH -- emails will fail to send without proper DNS setup      |
| A4  | `push_subscriptions` schema design matches Web Push API subscription shape       | Code Examples | Low -- standard PushSubscription JSON shape is well-documented |

## Open Questions

1. **VAPID contact email**
   - What we know: `web-push.setVapidDetails()` requires a `mailto:` URI
   - What's unclear: Which email address to use for VAPID subject
   - Recommendation: Use the project admin email or a `push@` alias

2. **Edge Function invocation for email queue processing**
   - What we know: The Edge Function processes the `email_queue` table
   - What's unclear: Is it currently invoked by a Supabase cron job, or does it need to be set up?
   - Recommendation: Verify during implementation; may need a Supabase cron or BullMQ trigger

3. **Resend sending domain setup**
   - What we know: STATE.md notes "Resend sending domain needs SPF/DKIM/DMARC DNS records"
   - What's unclear: Whether DNS records have been configured since that note
   - Recommendation: Verify before testing email delivery

## Environment Availability

| Dependency                          | Required By               | Available              | Version            | Fallback                                     |
| ----------------------------------- | ------------------------- | ---------------------- | ------------------ | -------------------------------------------- |
| Redis                               | BullMQ queues             | Yes (configured)       | via ioredis 5.10.1 | --                                           |
| BullMQ                              | Job scheduling            | Yes                    | 5.73.0             | --                                           |
| web-push                            | Push notifications        | No (not yet installed) | 3.6.7 (npm)        | Install: `pnpm add web-push @types/web-push` |
| Supabase Edge Function (email-send) | Email delivery            | Yes                    | Deployed           | --                                           |
| HTTPS                               | Service Worker / Push API | Unknown (Phase 14)     | --                 | localhost for dev                            |
| Resend API key                      | Email sending             | Unknown (env var)      | --                 | SendGrid fallback in Edge Function           |

**Missing dependencies with no fallback:**

- HTTPS in production is required for Web Push (Phase 14 prerequisite)

**Missing dependencies with fallback:**

- `web-push` npm package: not installed yet, trivial to add
- Resend API key: Edge Function has SendGrid fallback

## Validation Architecture

### Test Framework

| Property           | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Framework          | Vitest (backend: node env, frontend: jsdom env)         |
| Config file        | `backend/vitest.config.ts`, `frontend/vitest.config.ts` |
| Quick run command  | `cd backend && pnpm vitest run --reporter=verbose`      |
| Full suite command | `pnpm test`                                             |

### Phase Requirements -> Test Map

| Req ID   | Behavior                                                           | Test Type   | Automated Command                                                                         | File Exists? |
| -------- | ------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- | ------------ |
| NOTIF-03 | Processor inserts into email_queue when email_enabled              | unit        | `cd backend && pnpm vitest run tests/unit/queues/notification-processor-email.test.ts -x` | Wave 0       |
| NOTIF-04 | Digest scheduler queries users and inserts digest emails           | unit        | `cd backend && pnpm vitest run tests/unit/queues/digest-scheduler.test.ts -x`             | Wave 0       |
| NOTIF-05 | Push service sends via web-push when push_enabled                  | unit        | `cd backend && pnpm vitest run tests/unit/services/push-service.test.ts -x`               | Wave 0       |
| NOTIF-05 | Service worker handles push event and shows notification           | manual-only | Manual: trigger push in dev tools                                                         | N/A          |
| NOTIF-09 | Soft-ask banner renders after first notification, not on cold load | unit        | `cd frontend && pnpm vitest run tests/unit/components/PushOptInBanner.test.tsx -x`        | Wave 0       |
| NOTIF-09 | Dismissal persists in user_preferences                             | integration | `cd backend && pnpm vitest run tests/integration/push-opt-in.test.ts -x`                  | Wave 0       |

### Sampling Rate

- **Per task commit:** `cd backend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/unit/queues/notification-processor-email.test.ts` -- covers NOTIF-03
- [ ] `backend/tests/unit/queues/digest-scheduler.test.ts` -- covers NOTIF-04
- [ ] `backend/tests/unit/services/push-service.test.ts` -- covers NOTIF-05
- [ ] `frontend/tests/unit/components/PushOptInBanner.test.tsx` -- covers NOTIF-09

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                |
| --------------------- | ------- | --------------------------------------------------------------- |
| V2 Authentication     | No      | Push subscriptions tied to authenticated user via RLS           |
| V3 Session Management | No      | --                                                              |
| V4 Access Control     | Yes     | RLS on `push_subscriptions`, `user_preferences`, `email_queue`  |
| V5 Input Validation   | Yes     | Validate push subscription endpoint URL format, email addresses |
| V6 Cryptography       | Yes     | VAPID key management (env vars, never in code)                  |

### Known Threat Patterns for Web Push + Email

| Pattern                             | STRIDE                 | Standard Mitigation                                             |
| ----------------------------------- | ---------------------- | --------------------------------------------------------------- |
| Push subscription endpoint spoofing | Spoofing               | Validate endpoint is a valid HTTPS URL from known push services |
| VAPID private key exposure          | Information Disclosure | Store in env vars only, never log or commit                     |
| Email template injection            | Tampering              | Use `replaceTemplateVariables()` with sanitized inputs          |
| Push notification spam              | Denial of Service      | Rate limit push sends per user, respect quiet hours             |
| Expired subscription enumeration    | Information Disclosure | Delete on 410, don't expose subscription count to client        |

## Sources

### Primary (HIGH confidence)

- Codebase: `notification.processor.ts`, `notification.queue.ts`, `deadline-scheduler.ts` -- existing BullMQ patterns
- Codebase: `supabase/functions/email-send/index.ts` -- ResendProvider, email queue processing
- Codebase: `20260110700001_email_integration.sql` -- email_queue, email_templates, email_notification_preferences schemas
- Codebase: `20260111100001_notification_center.sql` -- notification_category_preferences with email_enabled/push_enabled
- Codebase: `20260115200001_email_digest_content_preferences.sql` -- get_user_digest_content() function, digest prefs
- npm registry: web-push@3.6.7, @types/web-push@3.6.4

### Secondary (MEDIUM confidence)

- MDN Web Push API documentation -- subscription flow, service worker events
- Web Push protocol (RFC 8030, RFC 8291) -- VAPID, payload encryption

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- web-push is the only maintained Node.js Web Push library, all other deps already in project
- Architecture: HIGH -- extending existing proven patterns (BullMQ processor, Edge Function email pipeline)
- Pitfalls: HIGH -- well-documented browser API limitations and email deliverability concerns

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable domain, 30 days)
