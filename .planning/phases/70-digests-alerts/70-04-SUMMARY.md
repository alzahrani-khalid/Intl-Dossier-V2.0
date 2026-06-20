---
phase: 70-digests-alerts
plan: 04
subsystem: backend-delivery
tags: [bullmq, pg-listen, adapters, alerts, smtp, webhook]

requires:
  - phase: 70-digests-alerts
    plan: 03
    provides: live staging schema and RPC verification
provides:
  - Intelligence channel adapter interface
  - In-app, SMTP, and webhook intelligence adapters
  - pg LISTEN intelligence alert worker with polling fallback
  - notification.queue.ts intelligence job handlers
affects: [backend, intelligence-alerts, notifications]

key-files:
  created:
    - backend/src/adapters/intelligence/ChannelAdapter.ts
    - backend/src/adapters/intelligence/in-app-adapter.ts
    - backend/src/adapters/intelligence/smtp-adapter.ts
    - backend/src/adapters/intelligence/webhook-adapter.ts
    - backend/src/queues/intelligence-alert.worker.ts
    - .planning/phases/70-digests-alerts/70-04-SUMMARY.md
  modified:
    - backend/src/queues/notification.queue.ts
    - backend/tests/intelligence/channel-adapter.test.ts
    - backend/tests/intelligence/webhook-payload-contract.test.ts
    - backend/tests/intelligence/alert-fanout.integration.test.ts

requirements-completed:
  - ALERT-02
  - ALERT-03
  - ALERT-04

duration: 19 min
completed: 2026-06-15
---

# Phase 70 Plan 04: Alert Delivery Engine Summary

**Built the isolated Phase 70 alert delivery layer: channel adapters, pg LISTEN/BullMQ worker, queue routing, and green tests for adapter isolation, webhook payload safety, clearance skips, fan-out, catch-up scan, and coalescing.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-06-15T09:27:45Z
- **Completed:** 2026-06-15T09:46:52Z
- **Tasks:** 2 completed
- **Files modified:** 10

## Accomplishments

- Added `IntelligenceDeliveryPayload` and `ChannelAdapter` interfaces.
- Added `inAppAdapter`, mapping alert/digest payloads into `enqueueNotification(...)`.
- Added `smtpAdapter`, sending directly through `nodemailer` and skipping safely when `SMTP_HOST` is not configured.
- Added `webhookAdapter`, emitting only a Teams-compatible generic label plus deep link.
- Added `startAlertListener()` with raw `pg` `LISTEN intelligence_alert`, startup catch-up scan, reconnect attempt, and 30-second polling fallback if `DATABASE_URL` is missing or LISTEN cannot start.
- Added `processIntelligenceAlertJob()` with:
  - matching alert-rule lookup through `intelligence_event_dossiers`
  - owner clearance read via `profiles.user_id`
  - silent above-clearance skip
  - severity filter support
  - five-minute per-rule coalescing on `last_fired_at`
  - dispatch across in-app, SMTP, and webhook adapters
- Extended `notification.queue.ts` with `intelligence-alert` and Phase 70 digest job-name branches.
- Confirmed `backend/src/queues/notification.processor.ts` is unchanged.

## Task Commits

1. **Task 1-2: Channel adapters and alert worker** - `4d508270` (feat)

## Verification

- `pnpm --filter intake-backend exec vitest --config ./vitest.config.ts --run tests/intelligence/channel-adapter.test.ts tests/intelligence/webhook-payload-contract.test.ts tests/intelligence/alert-fanout.integration.test.ts`
  - `3 passed`
  - `13 passed`
- `pnpm --filter intake-backend exec vitest --config ./vitest.config.ts --run tests/intelligence/`
  - `3 passed | 4 skipped`
  - `13 passed | 4 todo`
- `pnpm --filter intake-backend type-check`
  - exit `0`
- `grep -R "email_queue\|intelligence_email_queue" backend/src/adapters/intelligence/ || true`
  - no matches
- `grep -c "eq('user_id'" backend/src/queues/intelligence-alert.worker.ts`
  - `1`
- Commit hook also ran eslint/prettier and `pnpm build`; build passed with the existing project warnings.

## Deviations from Plan

- The worker uses `supabaseAdmin.auth.admin.getUserById(owner_id)` to resolve the recipient email for SMTP payloads because `profiles` only carries clearance/organization metadata in this schema.
- The direct plan command shape with `pnpm --filter intake-backend test -- --run ...` passes an extra literal `--` through this package script, so verification used `pnpm --filter intake-backend exec vitest --config ./vitest.config.ts --run ...` to run the intended files exactly.

## Self-Check: PASSED
