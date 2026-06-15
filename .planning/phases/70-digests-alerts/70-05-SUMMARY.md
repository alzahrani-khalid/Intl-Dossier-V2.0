---
phase: 70-digests-alerts
plan: 05
subsystem: backend-digests-alerts
tags: [bullmq, digests, alerts, express, rls]

requires:
  - phase: 70-digests-alerts
    plan: 04
    provides: channel adapters and alert delivery worker
provides:
  - DB-backed digest subscription service
  - clearance-aware intelligence digest scheduler
  - DB-backed alert-rule service
  - digest and alert Express routers
  - green backend intelligence tests for subscriptions, cron, alerts, and RPC routes
affects: [backend, intelligence-digests, intelligence-alerts, notifications]

key-files:
  created:
    - backend/src/services/intelligence-digest.service.ts
    - backend/src/queues/intelligence-digest.scheduler.ts
    - backend/src/services/monitoring-alerts.service.ts
    - backend/src/api/intelligence-alerts.ts
    - backend/src/api/intelligence-digest.ts
    - .planning/phases/70-digests-alerts/70-05-SUMMARY.md
  modified:
    - backend/src/services/alerts.service.ts
    - backend/src/queues/notification.queue.ts
    - backend/src/api/contract/monitoring.ts
    - backend/tests/intelligence/subscriptions.test.ts
    - backend/tests/intelligence/digest-cron.integration.test.ts
    - backend/tests/intelligence/alert-rules.test.ts
    - backend/tests/intelligence/generate-digest.integration.test.ts

requirements-completed:
  - DIGEST-01
  - DIGEST-02
  - DIGEST-04
  - ALERT-01
  - ALERT-02

duration: 35 min
completed: 2026-06-15
---

# Phase 70 Plan 05: Digest Pipeline and Alert API Summary

**Built the backend digest generation pipeline, the DB-backed alert-rule service, and focused Express routers for digest subscriptions/RPCs and alert rule CRUD.**

## Performance

- **Started:** 2026-06-15T09:29:00Z
- **Completed:** 2026-06-15T10:04:13Z
- **Tasks:** 2 completed
- **Files modified:** 13

## Accomplishments

- Added `intelligence-digest.service.ts` with:
  - digest subscription list/upsert/soft-unsubscribe helpers
  - `generateDigestForSubscriber(...)` calling `generate_digest_content` with explicit `p_clearance_level`
  - `publishDigestRow(...)` with duplicate `23505` handling logged at info level
  - adapter-based digest dispatch through in-app, SMTP, and webhook channels
- Added `intelligence-digest.scheduler.ts` with:
  - daily, weekly, and monthly BullMQ scheduler registration
  - `processIntelligenceDigestJob(...)` for notification queue routing
  - per-subscriber clearance lookup through `profiles.user_id`
  - deprovisioned subscriber skip behavior
  - monthly day-of-month handling capped to 1-28
- Replaced `alerts.service.ts` with DB-backed `intelligence_alert_rules` CRUD functions.
- Preserved the old monitoring contract API by moving its in-memory stub to `monitoring-alerts.service.ts`.
- Added `intelligence-alerts.ts` route module for owner-scoped alert rule CRUD.
- Added `intelligence-digest.ts` route module for subscription CRUD and caller-JWT `generate_digest` / `publish_digest` RPC flows.
- Filled all four remaining Plan 70-05 Wave 0 stubs with RED/GREEN tests.

## Task Commits

1. **Task 1 RED:** `c2008951` — failing digest pipeline tests.
2. **Task 1 GREEN:** `9e109d1b` — digest service, scheduler, and queue routing.
3. **Task 2 RED:** `9b295bc0` — failing alert-rule/API tests.
4. **Task 2 GREEN:** `77cfdb7a` — alert-rule service and digest/alert routers.

## Verification

- `pnpm --filter intake-backend test -- --run tests/intelligence/subscriptions.test.ts tests/intelligence/digest-cron.integration.test.ts`
  - `20 passed | 2 skipped`
  - `233 passed | 2 todo`
- `pnpm --filter intake-backend test -- --run tests/intelligence/alert-rules.test.ts tests/intelligence/generate-digest.integration.test.ts`
  - `22 passed`
  - `237 passed`
- `pnpm --filter intake-backend test -- --run tests/intelligence/`
  - `22 passed`
  - `237 passed`
- `pnpm --filter intake-backend type-check`
  - exit `0`
- `grep -c "new Map" backend/src/services/alerts.service.ts`
  - `0`
- `grep -c "email_queue" backend/src/queues/intelligence-digest.scheduler.ts`
  - `0`
- `grep -c "filtered\|clearance.*reason\|filtering_reason" backend/src/queues/intelligence-digest.scheduler.ts backend/src/services/intelligence-digest.service.ts`
  - `0` matches in both files
- `grep -c "profiles.user_id\|eq('user_id'" backend/src/queues/intelligence-digest.scheduler.ts`
  - `2`
- Commit hooks ran eslint/prettier and `pnpm build` on the GREEN commits; builds passed with the existing project warnings.

## Deviations from Plan

- The live dossier type domain has seven values, not eight: `country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, `person`. `elected_official` remains rejected at the API boundary.
- The digest scheduler does not write `email_queue` or `intelligence_email_queue`; it dispatches through the Plan 04 channel adapters. This matches the Plan 04 delivery contract and the Plan 05 grep guard.
- The new digest and alert routers are implemented but not mounted into `api/index.ts`; Plan 70-07 owns backend route wiring and live UAT.
- The old monitoring alert stub was moved to `monitoring-alerts.service.ts` so `api/contract/monitoring.ts` keeps its legacy contract while `alerts.service.ts` becomes DB-backed.

## Self-Check: PASSED
