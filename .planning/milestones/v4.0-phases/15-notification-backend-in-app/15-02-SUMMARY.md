---
phase: 15-notification-backend-in-app
plan: 02
subsystem: notification-triggers
tags: [notifications, assignments, deadlines, lifecycle, bullmq, postgres-trigger]
dependency_graph:
  requires: [notificationQueue, enqueueNotification, create_categorized_notification RPC]
  provides: [task assignment notifications, deadline scanner, lifecycle stage trigger]
  affects:
    [
      backend/src/services/tasks.service.ts,
      backend/src/queues/notification.queue.ts,
      backend/src/index.ts,
    ]
tech_stack:
  added: []
  patterns:
    [enqueueNotification after DB write, BullMQ repeatable job, Postgres AFTER UPDATE trigger]
key_files:
  created:
    - backend/src/queues/deadline-scheduler.ts
    - supabase/migrations/20260406_lifecycle_notification_trigger.sql
    - backend/tests/deadline-checker.test.ts
  modified:
    - backend/src/services/tasks.service.ts
    - backend/src/queues/notification.queue.ts
    - backend/src/index.ts
decisions:
  - 'Assignment notifications use enqueueNotification (async queue path), not direct DB insert'
  - 'Deadline checker uses jobId dedup pattern (deadline-24h-{taskId}, deadline-overdue-{taskId}) to prevent duplicate notifications'
  - 'Lifecycle trigger uses SECURITY DEFINER and calls create_categorized_notification RPC directly from Postgres'
  - 'Previous assignee read before update to detect reassignment (single extra query per update with assignee change)'
metrics:
  duration: 6min
  completed: 2026-04-06T17:26:00Z
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
---

# Phase 15 Plan 02: Notification Trigger Categories Summary

Three notification trigger categories wired: task assignment via enqueueNotification after DB writes, deadline scanner as BullMQ repeatable job with jobId dedup, lifecycle stage changes via Postgres AFTER UPDATE trigger on engagement_dossiers.

## What Was Built

### Task 1: Task Assignment Notifications in TasksService

- **tasks.service.ts**: Added `enqueueNotification` import and 3 dispatch points:
  - `TasksService.createTask`: notifies assignee after successful insert (skips self-assignment)
  - `TasksService.updateTask`: reads previous assignee before update, notifies new assignee on reassignment
  - `TaskCreationService.createTaskFromCommitment`: notifies assignee for commitment-created tasks
- All dispatches are AFTER successful DB writes (D-05 compliant), wrapped in try/catch with logError

### Task 2: Deadline Scheduler and Lifecycle Trigger (TDD)

- **deadline-scheduler.ts**: `processDeadlineCheck()` queries approaching (within 24h) and overdue tasks, enqueues with jobId dedup; `registerDeadlineChecker()` sets up repeatable job every 15 minutes
- **notification.queue.ts**: Worker updated to route `check-deadlines` job name to `processDeadlineCheck()` instead of normal notification flow
- **index.ts**: Calls `registerDeadlineChecker()` after Redis initialization
- **lifecycle trigger SQL**: `notify_lifecycle_stage_change()` SECURITY DEFINER function fires on `engagement_dossiers.lifecycle_stage` UPDATE, calls `create_categorized_notification` RPC with workflow category
- **deadline-checker.test.ts**: 4 unit tests all passing (approaching, overdue, skip completed, jobId dedup)

## Commits

| Task      | Commit   | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| 1         | 3394cafd | Wire task assignment notifications into TasksService     |
| 2 (RED)   | 1ffda411 | Add failing tests for deadline checker logic             |
| 2 (GREEN) | 479fbb2a | Deadline scheduler, lifecycle trigger, and passing tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied Plan 01 prerequisite files into worktree**

- **Found during:** Task 1 setup
- **Issue:** Worktree based on older commit missing Plan 01 outputs (queue files, updated notification.service.ts, index.ts)
- **Fix:** Copied queue-connection.ts, notification.queue.ts, notification.processor.ts, updated notification.service.ts, and index.ts from main repo
- **Files copied:** 5 files from Plan 01 output

**2. [Rule 1 - Bug] Fixed vi.mock hoisting error in tests**

- **Found during:** Task 2 RED phase
- **Issue:** Test mock factory referenced outer `mockQueueAdd` variable, but vi.mock is hoisted before variable declarations
- **Fix:** Rewrote test to use inline mock definitions and exported helper functions from mock factory
- **Files modified:** backend/tests/deadline-checker.test.ts

## Verification Results

1. `grep -c "enqueueNotification" backend/src/services/tasks.service.ts` = 4 (1 import + 3 dispatch)
2. 4/4 deadline-checker tests passing
3. Migration file contains trigger function and trigger creation
4. `backend/src/index.ts` calls `registerDeadlineChecker()`

## Threat Mitigations Applied

| Threat ID | Mitigation                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------- |
| T-15-05   | Assignment notification only fires server-side after authenticated task mutation; userId from DB record |
| T-15-06   | Deadline check reads only task id, title, assignee_id, sla_deadline; no sensitive data in payload       |
| T-15-07   | jobId dedup prevents duplicates; repeatable job fixed at 15 min; BullMQ concurrency: 5                  |
| T-15-08   | SECURITY DEFINER function only calls create_categorized_notification for dossier owner                  |
