# Phase 16: Email & Push Channels - Context

**Gathered:** 2026-04-06 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive notifications outside the application via email alerts, email digests, and browser push notifications. Covers three delivery channels: critical email alerts via Resend, scheduled digest emails (daily/weekly), and Web Push notifications for urgent items (Chrome/Firefox). Includes soft-ask opt-in UX for push permissions. In-app notifications are Phase 15 — this phase adds external channels only.

</domain>

<decisions>
## Implementation Decisions

### Email Sending Infrastructure

- **D-01:** Extend the BullMQ notification processor (`notification.processor.ts`) to insert into the existing `email_queue` table when `email_enabled` is true in `notification_category_preferences`. The Supabase Edge Function (`email-send`) handles actual Resend delivery — do not add `resend` as a backend npm dependency.
- **D-02:** Use the existing `ResendProvider` class in the Edge Function which already has retry logic, template variable substitution, and bilingual unsubscribe footer injection. Email templates must be bilingual (Arabic/English) matching the user's language preference.

### Digest Scheduling

- **D-03:** Schedule daily and weekly digest generation as BullMQ repeatable jobs, following the established pattern from `deadline-scheduler.ts` (`registerDeadlineChecker()`).
- **D-04:** Use the existing `get_user_digest_content()` Postgres function to aggregate watchlist, deadlines, assignments, commitments, and notifications per user. Render results into bilingual HTML email templates.
- **D-05:** Respect user preferences from `EmailDigestSettings.tsx` — schedule (daily/weekly), delivery time, and content inclusion toggles are already configurable in the frontend.

### Browser Push Notifications

- **D-06:** Use the Web Push API (VAPID protocol) with the `web-push` npm package on the Express backend. Do not use Firebase Cloud Messaging — this is a web-only application.
- **D-07:** Create a new `push_subscriptions` table for Web Push subscription storage (`endpoint`, `keys.p256dh`, `keys.auth`, `user_id`, `user_agent`). Do not reuse the FCM-designed `push_device_tokens` table — the schema shapes are incompatible.
- **D-08:** Create a service worker (`sw.js`) in `frontend/public/` to handle push event reception and notification display.
- **D-09:** Extend the BullMQ notification processor to send Web Push notifications when `push_enabled` is true in `notification_category_preferences` and the user has an active push subscription.

### Soft-Ask Opt-In Pattern

- **D-10:** Implement a contextual inline banner shown after the user receives their first actionable notification (e.g., task assignment or overdue deadline) — never on cold page load.
- **D-11:** Store soft-ask dismissal state in the `user_preferences` Supabase table (not localStorage) to persist across devices and sessions.
- **D-12:** The settings page (`NotificationsSettingsSection.tsx`) already has a `notifications_push` toggle — this serves as the explicit settings-page opt-in path alongside the contextual soft-ask.

### Claude's Discretion

- Email template HTML/CSS design and layout
- Exact digest aggregation query tuning and content formatting
- Service worker caching strategy
- Push notification icon and badge design
- Soft-ask banner animation and dismissal timing
- Error handling for expired/invalid push subscriptions

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Email infrastructure

- `supabase/functions/email-send/index.ts` — ResendProvider class, email queue processing, retry logic, template substitution
- `supabase/migrations/20260110700001_email_integration.sql` — email_queue table, email_template_type enum (includes digest_daily, digest_weekly)

### Digest content

- `supabase/migrations/20260115200001_email_digest_content_preferences.sql` — get_user_digest_content() function, digest preferences schema
- `frontend/src/components/email/EmailDigestSettings.tsx` — User-facing digest configuration UI

### Notification processing

- `backend/src/queues/notification.processor.ts` — BullMQ processor (extend for email + push channels)
- `backend/src/queues/notification.queue.ts` — Queue definitions
- `backend/src/queues/deadline-scheduler.ts` — Repeatable job pattern to follow for digest scheduling
- `backend/src/services/notification.service.ts` — Core notification service

### Push notification schema (reference, not reuse)

- `supabase/migrations/20260111200001_push_notifications_fcm_apns.sql` — Existing FCM/APNS schema (do NOT reuse for Web Push — create new table)
- `supabase/migrations/20260111100001_notification_center.sql` — notification_category_preferences with push_enabled booleans

### Frontend notification components

- `frontend/src/components/notifications/NotificationPreferences.tsx` — Category preference toggles
- `frontend/src/components/settings/sections/NotificationsSettingsSection.tsx` — Push toggle in settings
- `frontend/src/hooks/useNotificationCenter.ts` — Notification center hook (trigger context for soft-ask)
- `frontend/src/hooks/useEmailNotifications.ts` — Email notification hook

### i18n

- `frontend/src/i18n/ar/notification-center.json` — Arabic notification translations
- `frontend/src/i18n/ar/email-digest.json` — Arabic digest translations
- `frontend/src/i18n/ar/email.json` — Arabic email translations

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `ResendProvider` class in Edge Function — fully working email sender with retries and bilingual support
- `email_queue` table and processing pipeline — ready for insertion from BullMQ
- `get_user_digest_content()` Postgres function — aggregates all digest data per user
- `EmailDigestSettings.tsx` — complete digest preference UI (schedule, time, content toggles)
- `NotificationPreferences.tsx` — per-category channel toggles (in-app, email, push)
- `notification_category_preferences` table — already has `email_enabled` and `push_enabled` columns
- `deadline-scheduler.ts` — proven repeatable BullMQ job pattern to follow

### Established Patterns

- BullMQ for async job processing (notifications, deadline checks)
- ioredis v5.10.1 connection shared across BullMQ queues
- Supabase Edge Functions for external service integrations (email sending)
- Bilingual templates with user language preference detection
- Settings sections pattern for notification preferences

### Integration Points

- `notification.processor.ts` — main extension point for email and push channel dispatch
- `notification.queue.ts` — may need new job types for digest and push
- `email_queue` table — insertion point for email delivery
- New `push_subscriptions` table — new migration needed
- Service worker registration in `frontend/src/main.tsx` or app initialization
- Soft-ask banner component — new component in notification system

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- SMS notification channel (ADV-05) — future requirement
- Safari Web Push support (ADV-06) — future requirement
- Mobile push via FCM/APNS — only relevant if React Native mobile app is built

</deferred>

---

_Phase: 16-email-push-channels_
_Context gathered: 2026-04-06_
