---
phase: 16-email-push-channels
plan: 01
subsystem: backend-notifications
tags: [email, notifications, bilingual, templates, bullmq]
dependency_graph:
  requires: [notification.processor.ts, notification.queue.ts, email_queue table]
  provides: [email-template.service.ts, extended notification.processor.ts]
  affects: [email_queue table rows, notification delivery pipeline]
tech_stack:
  added: []
  patterns: [bilingual-email-templates, fire-and-forget-dispatch, html-entity-escaping]
key_files:
  created:
    - backend/src/services/email-template.service.ts
    - backend/tests/email-notifications.test.ts
  modified:
    - backend/src/queues/notification.processor.ts
decisions:
  - Moved test file to backend/tests/ (vitest include pattern is tests/**/*.test.ts, not src/__tests__)
  - Email dispatch is fire-and-forget with try/catch -- errors logged but never thrown
  - getUserEmailAndLanguage uses auth.admin.getUserById for email retrieval (T-16-02 minimal field access)
  - Default email_enabled to true when no preference row exists (PGRST116)
metrics:
  duration: 3min
  completed: 2026-04-06
  tasks: 2
  files: 3
---

# Phase 16 Plan 01: Email Channel Wiring Summary

Bilingual email template service + notification processor email dispatch via email_queue table insertion

## What Was Built

### Task 1: Bilingual Email Template Service (TDD)

Created `backend/src/services/email-template.service.ts` with two exports:

- `renderAlertEmailTemplate(language, data)` -- renders table-based HTML emails with inline CSS for EN/AR
  - Arabic: `dir="rtl"` on html/body/td, `lang="ar"`, Arabic CTA and unsubscribe text
  - English: `dir="ltr"`, `lang="en"`, English CTA and unsubscribe text
  - Colors: bg #f4f4f5, content #ffffff, CTA #166534, footer #71717a
  - 600px max-width, unsubscribe footer links to `/settings?section=notifications`
  - HTML entity escaping on title/message to prevent injection (T-16-01)
- `mapNotificationTypeToTemplate(type)` -- maps all alert types to `notification_alert` enum value

21 tests passing covering EN/AR templates, injection prevention, and type mapping.

### Task 2: Notification Processor Email Dispatch

Extended `processNotificationJob()` in `notification.processor.ts`:

1. After in-app notification creation, checks `notification_category_preferences.email_enabled`
2. If enabled (default true), fetches user email + language preference
3. Renders bilingual email via template service
4. Inserts into `email_queue` table with priority mapping (urgent=1, high=2, default=3)
5. Entire email block wrapped in try/catch -- failures logged, never thrown

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test directory mismatch**

- **Found during:** Task 1 RED phase
- **Issue:** Plan specified `backend/src/__tests__/` but vitest config includes `tests/**/*.test.ts`
- **Fix:** Placed test in `backend/tests/email-notifications.test.ts` with `@/` import alias
- **Files modified:** backend/tests/email-notifications.test.ts

## Threat Mitigations Applied

| Threat ID | Mitigation                                                                             |
| --------- | -------------------------------------------------------------------------------------- |
| T-16-01   | HTML entity escaping via `escapeHtml()` on title and message before template insertion |
| T-16-02   | `getUserEmailAndLanguage` queries only email and language fields, no email logging     |
| T-16-03   | Accepted -- BullMQ concurrency=5 and email_queue rate controls handle DoS              |

## Commits

| Task      | Commit   | Description                                       |
| --------- | -------- | ------------------------------------------------- |
| 1 (RED)   | 9ac933b6 | Failing tests for email template service          |
| 1 (GREEN) | 63ba08f1 | Implement bilingual email template service        |
| 2         | b3b56b64 | Extend notification processor with email dispatch |

## Self-Check: PASSED
