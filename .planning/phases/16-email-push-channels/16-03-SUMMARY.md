---
phase: 16-email-push-channels
plan: 03
subsystem: push-notifications
tags: [web-push, vapid, service-worker, notifications, realtime]
dependency_graph:
  requires: [notification.processor.ts, notification.queue.ts, auth.users]
  provides: [push.service.ts, push-subscriptions API, sw.js, usePushSubscription hook]
  affects: [notification delivery pipeline, frontend main.tsx]
tech_stack:
  added: [web-push]
  patterns: [vapid-authentication, service-worker-push, subscription-management, ttl-based-delivery]
key_files:
  created:
    - backend/src/services/push.service.ts
    - backend/src/api/push-subscriptions.ts
    - frontend/public/sw.js
    - frontend/src/services/push-subscription.ts
    - frontend/src/hooks/usePushSubscription.ts
    - backend/tests/push-notifications.test.ts
    - supabase/migrations/20260406000001_push_subscriptions.sql
  modified:
    - backend/src/queues/notification.processor.ts
    - backend/src/api/index.ts
    - frontend/src/main.tsx
---

## What was built

Complete Web Push notification channel spanning all layers:

1. **Database**: `push_subscriptions` table with RLS policy (users manage own subscriptions), unique constraint on user+endpoint, failure tracking via `failed_attempts` column
2. **Backend push service** (`push.service.ts`): VAPID-authenticated delivery, automatic subscription cleanup after 3 failed attempts, TTL-based message expiry
3. **API endpoints** (`push-subscriptions.ts`): POST subscribe, POST unsubscribe, GET status — all authenticated via JWT middleware
4. **Service worker** (`sw.js`): Receives push events, displays bilingual notifications with click-to-navigate support
5. **Frontend hook** (`usePushSubscription.ts`): React hook managing browser permission requests, subscription lifecycle, and server sync
6. **Processor integration**: Extended `notification.processor.ts` with push channel dispatch alongside existing in-app and email channels

## Deviations

- **Test directory**: Plan specified `backend/src/__tests__/` but vitest config uses `backend/tests/`. Tests placed in correct location.
- **Unsubscribe endpoint**: Added `POST /unsubscribe` as alternative to `DELETE /` since frontend `apiDelete` lacks body support.

## Self-Check: PASSED

- [x] All 4 tasks executed (3 auto + 1 checkpoint)
- [x] Each auto task committed individually (3 commits)
- [x] Migration applied via Supabase MCP
- [x] VAPID keys generated and configured in backend/.env
- [x] push_subscriptions table exists with RLS
