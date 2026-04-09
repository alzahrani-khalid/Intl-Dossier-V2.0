---
phase: 21-digest-scheduler-wiring
plan: 01
subsystem: backend-startup
tags: [bullmq, digest, scheduler, notifications, startup-wiring]
dependency_graph:
  requires: []
  provides: [digest-scheduler-startup]
  affects: [backend-startup-sequence]
tech_stack:
  added: []
  patterns: [bullmq-repeatable-jobs, redis-availability-guard]
key_files:
  created: []
  modified:
    - backend/src/index.ts
decisions: []
metrics:
  duration: ~3min
  completed: 2026-04-09T08:45:22Z
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 21 Plan 01: Wire Digest Scheduler into Backend Startup Summary

Wired registerDigestScheduler() into backend startup so BullMQ repeatable jobs for daily/weekly email digests are registered when Redis is available.

## Changes Made

### Task 1: Wire registerDigestScheduler() into backend startup

**Commit:** b1fa130c

Two additions to `backend/src/index.ts`:

1. **Import** (line 17): `import { registerDigestScheduler } from './queues/digest-scheduler'`
2. **Await call** (line 143): `await registerDigestScheduler()` inside the `if (redisAvailable)` block, immediately after `await registerDeadlineChecker()`

This follows the identical pattern used by `registerDeadlineChecker()` -- import the async function, call it inside the Redis availability guard during server startup.

## Verification

- TypeScript compilation: 0 errors (`tsc --noEmit` exit 0)
- `grep -n 'registerDigestScheduler' backend/src/index.ts` confirms both import (line 17) and call (line 143)
- Export verified in `backend/src/queues/digest-scheduler.ts` at line 293: `export async function registerDigestScheduler(): Promise<void>`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] `backend/src/index.ts` modified with import + await call
- [x] Commit b1fa130c exists
- [x] TypeScript compiles with 0 errors
