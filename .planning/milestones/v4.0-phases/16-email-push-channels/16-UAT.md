---
status: testing
phase: 16-email-push-channels
source:
  - 16-01-SUMMARY.md
  - 16-02-SUMMARY.md
  - 16-03-SUMMARY.md
  - 16-04-SUMMARY.md
started: 2026-04-07T00:00:00Z
updated: 2026-04-07T00:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
Kill any running backend/frontend. Clear caches/lock files. Start the app from scratch.
Backend boots without errors, BullMQ workers register (notification + digest), migrations are
in sync, and a primary call (e.g. GET /api/health or loading the dashboard) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test

expected: Fresh server boot succeeds; workers register; health/dashboard returns live data.
result: [pending]

### 2. Email Dispatch on Alert Notification

expected: Triggering an alert-class notification for a user with email_enabled=true inserts a row into email_queue with bilingual HTML body matching the user's language preference. No exception is thrown if email lookup fails.
result: [pending]

### 3. Bilingual Email Template Rendering (EN/AR)

expected: Rendered alert email shows correct dir attribute (ltr/rtl), Arabic CTA + unsubscribe text for ar users, English for en users, with HTML-escaped title/message.
result: [pending]

### 4. Daily / Weekly Digest Delivery

expected: Digest scheduler runs hourly; for a user whose daily_digest_time matches current UTC hour (after timezone conversion), a digest email is enqueued in email_queue with bilingual HTML and empty-state copy when no items exist.
result: [pending]

### 5. Push Opt-In Banner UX

expected: First-time user sees PushOptInBanner inside the NotificationPanel with bilingual copy, enable + dismiss buttons. Dismiss persists via push_prompt_dismissed_at and the banner does not return.
result: [pending]

### 6. Push Subscription + Service Worker Delivery

expected: Clicking Enable triggers browser permission request, registers sw.js, POSTs subscription to /api/push-subscriptions, then a backend-triggered notification arrives as a system push notification, click navigates to the deep link.
result: [pending]

### 7. Push Failure Cleanup

expected: A push subscription that fails 3 times is auto-removed from push_subscriptions; no orphan rows remain; user can resubscribe cleanly.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
