---
phase: 15-notification-backend-in-app
plan: 01
subsystem: notification-queue
tags: [bullmq, redis, queue, notifications, backend]
dependency_graph:
  requires: [Redis, Supabase RPC create_categorized_notification]
  provides: [notificationQueue, notificationWorker, enqueueNotification, NotificationJobData]
  affects: [backend/src/index.ts, backend/src/services/notification.service.ts]
tech_stack:
  added: [bullmq@5.73.0]
  patterns: [BullMQ queue/worker, dedicated Redis connection, preference-gated dispatch]
key_files:
  created:
    - backend/src/queues/queue-connection.ts
    - backend/src/queues/notification.queue.ts
    - backend/src/queues/notification.processor.ts
    - backend/tests/notification-queue.test.ts
  modified:
    - backend/package.json
    - pnpm-lock.yaml
    - backend/src/services/notification.service.ts
    - backend/src/index.ts
decisions:
  - 'Dedicated Redis connection for BullMQ (maxRetriesPerRequest: null) separate from cache client (maxRetriesPerRequest: 3)'
  - 'Worker runs in-process within Express server, not as separate process'
  - 'Existing sendInAppNotification preserved unchanged; enqueueNotification is the preferred async path'
metrics:
  duration: 4min
  completed: 2026-04-06T17:13:31Z
  tasks_completed: 2
  tasks_total: 2
  files_changed: 8
---

# Phase 15 Plan 01: BullMQ Notification Queue Infrastructure Summary

BullMQ queue with dedicated Redis connection for async notification dispatch, preference-gated via user category settings before Supabase RPC insert.

## What Was Built

### Task 1: BullMQ Queue, Worker, and Processor (TDD)

- **queue-connection.ts**: Dedicated Redis connection with `maxRetriesPerRequest: null` (D-03 compliant -- does not reuse cache client)
- **notification.queue.ts**: Queue with exponential backoff (3 attempts, 1s base delay), concurrency 5, auto-cleanup (1000 complete, 5000 failed)
- **notification.processor.ts**: Checks `notification_category_preferences.in_app_enabled` before calling `create_categorized_notification` RPC; throws on error for retry
- **notification-queue.test.ts**: 4 unit tests all passing (enqueue shape, preference-allowed, preference-blocked, RPC error handling)

### Task 2: Service Extension and Worker Lifecycle

- **notification.service.ts**: Added `enqueueNotification(data, jobName?)` as preferred async dispatch path; existing `sendInAppNotification` preserved
- **index.ts**: Worker lifecycle logging (ready/failed events), initialization after Redis connect, graceful shutdown (worker.close + queue.close) on SIGTERM/SIGINT

## Commits

| Task | Commit   | Description                                                    |
| ---- | -------- | -------------------------------------------------------------- |
| 1    | a6d87d71 | BullMQ queue, worker, processor, and 4 unit tests              |
| 2    | 96c13c53 | enqueueNotification service, worker startup, graceful shutdown |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `bullmq` in backend/package.json dependencies: PASS
- `maxRetriesPerRequest: null` in queue-connection.ts: PASS
- `notificationQueue` and `notificationWorker` exported from notification.queue.ts: PASS
- `NotificationJobData` interface exported: PASS
- `processNotificationJob` with preference check and RPC call: PASS
- `enqueueNotification` exported from notification.service.ts: PASS
- `notificationWorker` imported and initialized in index.ts: PASS
- All 4 unit tests green: PASS

## Self-Check: PASSED

All 6 created/modified files verified on disk. Both commit hashes (a6d87d71, 96c13c53) found in git log.
