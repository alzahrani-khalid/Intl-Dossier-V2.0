# Phase 21: Digest Scheduler Wiring Fix - Research

**Researched:** 2026-04-09
**Domain:** Backend startup wiring / BullMQ repeatable jobs
**Confidence:** HIGH

## Summary

Phase 21 is a surgical one-line fix. The function `registerDigestScheduler()` already exists in `backend/src/queues/digest-scheduler.ts` (line 293) and is fully implemented -- it registers two BullMQ repeatable jobs on the `notificationQueue`. The worker in `notification.queue.ts` already dispatches `process-daily-digests` and `process-weekly-digests` job names to `processDigestJob()`. The only missing piece is that `registerDigestScheduler()` is never called during backend startup in `backend/src/index.ts`.

The existing pattern is clear: `registerDeadlineChecker()` is already called at line 139 inside the `if (redisAvailable)` block. The digest scheduler call should be placed immediately after it, following the identical pattern.

**Primary recommendation:** Add `import { registerDigestScheduler } from './queues/digest-scheduler'` and call `await registerDigestScheduler()` right after `await registerDeadlineChecker()` in `backend/src/index.ts`.

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                 | Research Support                                                                                                                                 |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| NOTIF-04 | User receives daily/weekly email digest summarizing pending attention items | `registerDigestScheduler()` exists but is never called at startup -- wiring it enables the repeatable BullMQ jobs that trigger digest processing |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Backend: Express + TypeScript, Node.js 18+ LTS, BullMQ for async dispatch [VERIFIED: codebase]
- Code style: no semicolons, single quotes, explicit return types, no explicit any [VERIFIED: CLAUDE.md]
- Supabase managed PostgreSQL -- migrations via Supabase MCP [VERIFIED: CLAUDE.md]
- GSD workflow enforcement for all changes [VERIFIED: CLAUDE.md]

## Standard Stack

No new libraries needed. This phase uses only what already exists:

| Library | Version  | Purpose                     | Already Installed |
| ------- | -------- | --------------------------- | ----------------- |
| bullmq  | existing | Repeatable job scheduling   | Yes               |
| ioredis | existing | Redis connection for BullMQ | Yes               |

## Architecture Patterns

### Existing Scheduler Registration Pattern

The codebase already has an identical pattern for `registerDeadlineChecker()` [VERIFIED: backend/src/index.ts lines 126-139]:

```typescript
// In backend/src/index.ts, inside `if (redisAvailable)` block:
import { registerDeadlineChecker } from './queues/deadline-scheduler'

// ... after warmCriticalCaches() and notification worker setup ...
await registerDeadlineChecker()
```

The digest scheduler follows the exact same shape [VERIFIED: backend/src/queues/digest-scheduler.ts lines 293-305]:

```typescript
export async function registerDigestScheduler(): Promise<void> {
  await notificationQueue.add('process-daily-digests', {} as never, {
    repeat: { every: 60 * 60 * 1000 }, // hourly
    jobId: 'daily-digest-processor',
  })
  await notificationQueue.add('process-weekly-digests', {} as never, {
    repeat: { every: 24 * 60 * 60 * 1000 }, // daily
    jobId: 'weekly-digest-processor',
  })
  logInfo('Digest schedulers registered')
}
```

### Worker Routing Already Configured

The notification worker in `notification.queue.ts` (lines 38-40) already routes digest job names [VERIFIED: codebase]:

```typescript
if (job.name === 'process-daily-digests' || job.name === 'process-weekly-digests') {
  await processDigestJob(job.name)
  return
}
```

### What Needs to Change

**File: `backend/src/index.ts`**

1. Add import: `import { registerDigestScheduler } from './queues/digest-scheduler'`
2. Add call: `await registerDigestScheduler()` after `await registerDeadlineChecker()` (line 139)

That is the entire scope.

## Don't Hand-Roll

| Problem                    | Don't Build             | Use Instead                     | Why                                        |
| -------------------------- | ----------------------- | ------------------------------- | ------------------------------------------ |
| Repeatable job scheduling  | Custom cron/setInterval | BullMQ repeatable jobs          | Already implemented in digest-scheduler.ts |
| Digest content aggregation | Custom SQL              | `get_user_digest_content()` RPC | Already exists as Supabase RPC function    |

## Common Pitfalls

### Pitfall 1: Calling registerDigestScheduler() Outside Redis Guard

**What goes wrong:** If called without checking `redisAvailable`, BullMQ will throw connection errors when Redis is down.
**How to avoid:** Place the call inside the existing `if (redisAvailable)` block, right after `registerDeadlineChecker()`. [VERIFIED: existing pattern at line 126]

### Pitfall 2: Duplicate Repeatable Jobs on Restart

**What goes wrong:** BullMQ repeatable jobs with the same `jobId` are deduplicated automatically -- adding the same repeatable job multiple times with the same `jobId` is a no-op.
**How to avoid:** Nothing special needed. The `jobId` fields (`daily-digest-processor`, `weekly-digest-processor`) ensure idempotency. [ASSUMED -- standard BullMQ behavior for repeatable jobs with explicit jobId]

### Pitfall 3: Missing Log Verification

**What goes wrong:** The fix is deployed but nobody confirms it works.
**How to avoid:** After wiring, check backend logs for "Digest schedulers registered" message on startup.

## Code Examples

### The Complete Fix (2 changes in index.ts)

```typescript
// 1. Add import (near line 16, after registerDeadlineChecker import)
import { registerDigestScheduler } from './queues/digest-scheduler'

// 2. Add call (after line 139, inside if (redisAvailable) block)
await registerDigestScheduler()
```

### Expected Startup Log Output

```
Notification worker ready
Notification queue initialized
Deadline checker registered          // existing
Digest schedulers registered         // NEW -- confirms fix works
```

## Validation Architecture

### Test Framework

| Property           | Value                                |
| ------------------ | ------------------------------------ |
| Framework          | Vitest                               |
| Config file        | `backend/vitest.config.ts` (assumed) |
| Quick run command  | `pnpm --filter backend test`         |
| Full suite command | `pnpm test`                          |

### Phase Requirements -> Test Map

| Req ID   | Behavior                              | Test Type   | Automated Command                  | File Exists?                                                           |
| -------- | ------------------------------------- | ----------- | ---------------------------------- | ---------------------------------------------------------------------- |
| NOTIF-04 | Digest scheduler registers on startup | integration | Manual log verification on startup | N/A -- startup wiring, not unit-testable without mocking entire BullMQ |

### Sampling Rate

- **Per task commit:** `pnpm --filter backend typecheck` (ensures import resolves)
- **Per wave merge:** Backend startup in dev mode -- check logs for "Digest schedulers registered"
- **Phase gate:** Backend starts without errors, log line present

### Wave 0 Gaps

None -- no new test files needed. This is a 2-line wiring fix verified by startup logs and typecheck.

## Security Domain

No security implications. This change adds a function call to an already-imported module within an already-authenticated backend startup sequence. No new endpoints, no new user input, no new data flows.

## Assumptions Log

| #   | Claim                                                   | Section         | Risk if Wrong                                                                                       |
| --- | ------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| A1  | BullMQ deduplicates repeatable jobs by jobId on restart | Common Pitfalls | Low -- worst case is duplicate jobs, which process idempotently (digest checks user timezone match) |

## Open Questions

None. The fix is fully determined by the existing codebase.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies -- this is a code-only change to an existing file using existing imports).

## Sources

### Primary (HIGH confidence)

- `backend/src/queues/digest-scheduler.ts` -- full implementation of `registerDigestScheduler()` verified at line 293
- `backend/src/index.ts` -- startup sequence verified, `registerDeadlineChecker()` pattern at line 139
- `backend/src/queues/notification.queue.ts` -- worker routing for digest jobs verified at lines 38-40
- `.planning/v4.0-MILESTONE-AUDIT.md` -- gap identified: "registerDigestScheduler() never called at startup"

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new dependencies, all code exists
- Architecture: HIGH - exact pattern already used for deadline checker
- Pitfalls: HIGH - trivial change with clear existing pattern

**Research date:** 2026-04-09
**Valid until:** Indefinite (stable codebase pattern)
