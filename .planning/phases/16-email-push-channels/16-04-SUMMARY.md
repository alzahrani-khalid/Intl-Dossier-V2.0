---
phase: 16-email-push-channels
plan: 04
subsystem: push-opt-in-ux
tags: [push-notifications, opt-in, ux, i18n, bilingual, component]
dependency_graph:
  requires: [usePushSubscription hook, NotificationPanel, user_preferences table]
  provides: [PushOptInBanner component, push dismissal tracking, i18n push-notifications namespace]
  affects: [NotificationPanel.tsx, user_preferences table]
tech_stack:
  added: []
  patterns: [soft-ask-opt-in, contextual-banner, dismissal-persistence, bilingual-i18n]
key_files:
  created:
    - frontend/src/components/notifications/PushOptInBanner.tsx
    - frontend/src/i18n/en/push-notifications.json
    - frontend/src/i18n/ar/push-notifications.json
    - frontend/src/__tests__/PushOptInBanner.test.tsx
    - supabase/migrations/20260406000002_user_prefs_push_dismissed.sql
  modified:
    - frontend/src/components/notifications/NotificationPanel.tsx
---

## What was built

Soft-ask opt-in UX for push notifications:

1. **PushOptInBanner component**: Contextual banner that appears inside the notification panel, prompting users to enable push notifications. Includes bell icon, bilingual copy, enable/dismiss buttons, and loading states.
2. **Dismissal persistence**: `push_prompt_dismissed_at` column added to `user_preferences` — once dismissed, the banner won't reappear. Migration applied via Supabase MCP.
3. **Bilingual i18n strings**: Full Arabic and English translations in `push-notifications` namespace covering banner title, description, enable button, dismiss button, success/error toasts.
4. **NotificationPanel integration**: Banner conditionally rendered at the top of the notification panel when push is not yet subscribed and user hasn't dismissed.

## Deviations

- None. Plan followed as specified.

## Self-Check: PASSED

- [x] All 4 tasks executed (2 auto + 2 checkpoint)
- [x] Each auto task committed individually (2 commits)
- [x] Migration applied via Supabase MCP
- [x] i18n strings for both Arabic and English
- [x] PushOptInBanner integrated into NotificationPanel
