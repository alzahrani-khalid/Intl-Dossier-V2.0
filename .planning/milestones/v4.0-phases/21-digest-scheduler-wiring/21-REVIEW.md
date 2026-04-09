---
phase: 21-digest-scheduler-wiring
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - backend/src/index.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`backend/src/index.ts` is the server entry point wired in phase 21 to call `registerDigestScheduler()`. The file is well-structured overall — Sentry is initialized before Express, graceful shutdown handles both signals, and Redis unavailability is handled gracefully. However, three warnings and two info-level issues were found: the digest scheduler (the phase 21 addition) is silently skipped when Redis is unavailable with no log or alerting, there is a duplicate shutdown block between SIGTERM and SIGINT with no shared helper, and the scheduled-jobs guard does not cover the BullMQ-based schedulers (deadline + digest), creating an inconsistent feature-flag story.

---

## Warnings

### WR-01: `registerDigestScheduler` silently skipped when Redis is unavailable — no observability

**File:** `backend/src/index.ts:144`
**Issue:** Both `registerDeadlineChecker()` and `registerDigestScheduler()` are called only inside the `if (redisAvailable)` branch (lines 139–143). When Redis is down the digest scheduler is never registered, but the only log emitted is the generic Redis-unavailable message on line 145. There is no warning that digest emails will not fire. In a production incident this makes the scheduler's non-registration invisible.
**Fix:**

```typescript
  } else {
    logError('Redis unavailable — deadline checker and digest scheduler NOT registered. Digest emails will not be sent.')
  }
```

### WR-02: `ENABLE_SCHEDULED_JOBS` flag does not govern BullMQ schedulers — inconsistent feature-flag behavior

**File:** `backend/src/index.ts:40-47`
**Issue:** Lines 40–47 check `ENABLE_SCHEDULED_JOBS` to gate `scheduleHealthScoresRefreshJob()` and `scheduleOverdueCommitmentsDetectionJob()`. But `registerDeadlineChecker()` and `registerDigestScheduler()` (lines 140–143) are always registered when Redis is available, ignoring this env flag. An operator who sets `ENABLE_SCHEDULED_JOBS=false` expecting all background scheduling to be disabled will still get BullMQ repeatable jobs for deadlines and digests.
**Fix:** Either bring BullMQ scheduler registration under the same flag, or document clearly in the env-var block that it only governs cron jobs and not BullMQ jobs:

```typescript
// Option A — extend the existing flag
if (ENABLE_SCHEDULED_JOBS) {
  await registerDeadlineChecker()
  await registerDigestScheduler()
}

// Option B — add a distinct flag and log it clearly
const ENABLE_QUEUE_JOBS = process.env.ENABLE_QUEUE_JOBS !== 'false' // default on
```

### WR-03: Duplicate shutdown logic in SIGTERM and SIGINT handlers — risk of divergence

**File:** `backend/src/index.ts:162-178`
**Issue:** The SIGTERM handler (lines 162–169) and the SIGINT handler (lines 171–178) are byte-for-byte identical. If a new resource (e.g., the digest scheduler's BullMQ queue) needs to be closed on shutdown, a developer must update both handlers. Missing one causes a resource leak on whichever signal is used.
**Fix:**

```typescript
async function shutdown(signal: string): Promise<void> {
  logInfo(`${signal} received, shutting down gracefully`)
  await notificationWorker.close()
  await notificationQueue.close()
  cacheMetrics.stop()
  await flushSentry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

---

## Info

### IN-01: `startServer` log message says "starting" after the server is already bound

**File:** `backend/src/index.ts:149`
**Issue:** The `logInfo('Server starting on port ...')` call is inside the `app.listen` callback, which fires after the port is bound and the server is already accepting connections. The message is misleading.
**Fix:**

```typescript
app.listen(PORT, () => {
  logInfo(`Server listening on port ${PORT}`, { ... })
})
```

### IN-02: Magic number `10mb` for JSON/urlencoded body size limit

**File:** `backend/src/index.ts:64-65`
**Issue:** The `10mb` limit is hardcoded in two places with no named constant or env override. Changing the limit in the future requires two edits and the value carries no self-documenting rationale.
**Fix:**

```typescript
const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '10mb'
app.use(express.json({ limit: BODY_SIZE_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }))
```

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
