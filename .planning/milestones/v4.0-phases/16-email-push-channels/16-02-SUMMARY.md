---
phase: 16-email-push-channels
plan: 02
subsystem: notification-digests
tags: [email, digest, bullmq, scheduler, bilingual]
dependency_graph:
  requires: [16-01]
  provides: [digest-scheduler, digest-templates]
  affects: [notification.queue.ts]
tech_stack:
  added: []
  patterns: [bullmq-repeatable-jobs, timezone-aware-scheduling, inline-css-email]
key_files:
  created:
    - backend/src/services/digest-template.service.ts
    - backend/src/queues/digest-scheduler.ts
    - backend/tests/digest-scheduler.test.ts
  modified:
    - backend/src/queues/notification.queue.ts
decisions:
  - Test file placed in backend/tests/ (not backend/src/__tests__/) to match vitest include config
  - HTML entity escaping applied to all user-generated content in templates (T-16-06)
  - Batch size of 50 users per scheduler run for DoS mitigation (T-16-04)
metrics:
  duration: 5min
  completed: 2026-04-06
---

# Phase 16 Plan 02: Digest Scheduler Summary

BullMQ repeatable jobs for daily/weekly digest email generation with bilingual HTML templates and timezone-aware delivery scheduling.

## One-liner

Hourly digest scheduler matches user timezone delivery times, renders bilingual HTML via DigestContent, and inserts into email_queue.

## What Was Built

### Task 1: Bilingual Digest Email Templates (TDD)

Created `digest-template.service.ts` with:

- `renderDailyDigestTemplate(language, date, content)` -- daily briefing emails in EN/AR
- `renderWeeklyDigestTemplate(language, dateRange, content)` -- weekly summary emails in EN/AR
- RTL support with `dir="rtl"` on all Arabic template elements
- XSS protection via HTML entity escaping on user content (T-16-06)
- Empty state: "No pending items this period. You're all caught up!" / Arabic equivalent
- Inline CSS, table-based layout, 600px max-width email template
- CTA linking to /dashboard, unsubscribe footer linking to /settings?section=notifications

17 tests covering both locales, empty states, XSS escaping, RTL attributes.

### Task 2: Digest Scheduler with BullMQ

Created `digest-scheduler.ts` following `deadline-scheduler.ts` pattern:

- `registerDigestScheduler()` -- registers two repeatable jobs:
  - `daily-digest-processor` (hourly, checks timezone match)
  - `weekly-digest-processor` (daily, checks day-of-week match)
- `processDigestJob(jobName)` -- dispatches to daily/weekly processing
- Timezone-aware delivery: converts user's `daily_digest_time` + `quiet_hours_timezone` to UTC hour
- Content fetched via `get_user_digest_content()` RPC (T-16-05: no content logging)
- Batch size limit of 50 users per run (T-16-04)
- Per-user try/catch for fault isolation
- Wired into `notification.queue.ts` worker handler

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test directory mismatch**

- **Found during:** Task 1 (RED phase)
- **Issue:** Plan specified `backend/src/__tests__/` but vitest config only includes `tests/**/*.test.ts`
- **Fix:** Placed test file in `backend/tests/digest-scheduler.test.ts` and updated import paths
- **Files modified:** backend/tests/digest-scheduler.test.ts

**2. [Rule 1 - Bug] HTML entity escaping in test assertion**

- **Found during:** Task 1 (GREEN phase)
- **Issue:** Apostrophe in "You're all caught up!" gets escaped to `&#39;` by escapeHtml
- **Fix:** Updated test assertion to match escaped HTML output
- **Files modified:** backend/tests/digest-scheduler.test.ts

## Commits

| Task      | Commit   | Description                                                         |
| --------- | -------- | ------------------------------------------------------------------- |
| 1 (RED)   | 25b19556 | test(16-02): add failing tests for digest template rendering        |
| 1 (GREEN) | 0947f78f | feat(16-02): implement bilingual digest email templates with tests  |
| 2         | 3b1f8e93 | feat(16-02): implement digest scheduler with BullMQ repeatable jobs |

## Verification

- 17/17 tests pass (`npx vitest run tests/digest-scheduler.test.ts`)
- All acceptance criteria patterns verified in source files
- Digest scheduler registers repeatable jobs with correct intervals
- Templates render bilingual content with RTL support

## Known Stubs

None -- all functions are fully implemented with real data flows.

## Self-Check: PASSED
