# Phase 15: Notification Backend & In-App - Research

**Researched:** 2026-04-06
**Domain:** Async notification dispatch (BullMQ), in-app notification integration, Supabase Realtime
**Confidence:** HIGH

## Summary

Phase 15 is primarily an **integration and wiring phase**, not a greenfield build. The notification UI (bell icon, panel, category tabs, mark-as-read, Realtime subscription) and the database schema (notifications table, category enums, preferences, RPC functions) already exist and are comprehensive. The main work is: (1) adding BullMQ as the async dispatch layer, (2) wiring notification triggers into three backend code paths (task assignment, deadline checking, lifecycle transitions), and (3) verifying the existing frontend works end-to-end with real dispatched notifications.

A critical architectural finding is that engagement lifecycle transitions happen in a **Supabase Edge Function** (`supabase/functions/engagement-dossiers/index.ts`), not in the Express backend. This means lifecycle stage change notifications must be triggered either by adding dispatch logic inside the Edge Function (calling the Express API or directly inserting), or by using a Postgres trigger on `engagement_dossiers.lifecycle_stage` updates. The recommended approach is a **database trigger** that inserts a notification row on lifecycle_stage changes, since the Edge Function runs in Deno and cannot access BullMQ directly.

**Primary recommendation:** Add BullMQ with a dedicated Redis connection (separate from the cache client due to `maxRetriesPerRequest` incompatibility), wire three notification triggers, use a Postgres trigger for lifecycle notifications, and verify existing frontend components work with real data.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The existing notification schema is sufficient -- no new migration needed. The `notifications` table already has all required columns.
- **D-02:** The bell icon, notification panel, badge, category tabs, mark-as-read, and Supabase Realtime subscription already exist. Focus on integration testing and verification, not ground-up build.
- **D-03:** Add BullMQ as a new dependency for async notification dispatch. Reuse the existing ioredis connection (v5.10.1 -- fully compatible with BullMQ v5).
- **D-04:** Run the BullMQ worker in-process initially (same Express server). Extract to separate Docker container later if load demands.
- **D-05:** Wire notification triggers inside backend service methods, co-located with business logic. Dispatch to BullMQ queue after successful DB writes -- never inside the DB transaction.
- **D-06:** Three trigger categories: (1) task assignment, (2) deadline approaching/overdue via scheduled job, (3) engagement lifecycle stage change.
- **D-07:** The existing `notification.service.ts` and `sendInAppNotification` function should be extended (not replaced) to support queue-based dispatch.

### Claude's Discretion

- Exact BullMQ queue naming conventions and job options (retries, backoff)
- Deadline check interval (e.g., every 15 minutes vs hourly)
- Toast notification styling for new arrivals (Sonner already in use)
- Notification grouping or batching strategy for bulk operations

### Deferred Ideas (OUT OF SCOPE)

- None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                            | Research Support                                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NOTIF-01 | User sees bell icon with unread count in header; clicking opens notification center panel                              | Bell icon + NotificationPanel.tsx already exist with full UI. Verification-only task.                                                                                                 |
| NOTIF-02 | User receives in-app notifications for task assignments, deadline approaching/overdue, and lifecycle stage transitions | Requires BullMQ queue setup + 3 trigger integrations (task service, scheduled job, DB trigger for lifecycle)                                                                          |
| NOTIF-06 | User can configure notification preferences per channel and per category                                               | `notification_category_preferences` table and `NotificationsSettingsSection.tsx` + `useCategoryPreferences` hook already exist. Need to wire preference checking into dispatch logic. |
| NOTIF-07 | User can mark notifications as read individually or bulk mark-all-read                                                 | `mark_category_as_read` RPC + `useMarkAsRead` hook already exist. Verification-only.                                                                                                  |
| NOTIF-08 | Notification delivery is decoupled from database transactions (async via BullMQ)                                       | Core new work: BullMQ queue + worker + dedicated Redis connection                                                                                                                     |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose                                   | Why Standard                                                                                              |
| ------- | ------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| bullmq  | ^5.73.0 | Job queue for async notification dispatch | Industry standard for Node.js queues; native TypeScript; uses ioredis internally [VERIFIED: npm registry] |
| ioredis | ^5.10.1 | Redis client (already installed)          | Required by BullMQ; already in use for caching [VERIFIED: backend/package.json]                           |

### Supporting (already installed)

| Library               | Version  | Purpose                 | When to Use                                               |
| --------------------- | -------- | ----------------------- | --------------------------------------------------------- |
| @supabase/supabase-js | existing | DB operations, Realtime | Notification CRUD, real-time updates [VERIFIED: codebase] |
| @tanstack/react-query | v5       | Frontend data fetching  | Notification hooks already built [VERIFIED: codebase]     |
| sonner                | existing | Toast notifications     | New notification arrival toasts [VERIFIED: codebase]      |

### Alternatives Considered

| Instead of | Could Use                   | Tradeoff                                                                                      |
| ---------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| BullMQ     | pg-boss                     | Postgres-native queue, no Redis needed, but slower and less battle-tested for high throughput |
| BullMQ     | Supabase Edge Function cron | No new dependency, but limited scheduling and no retry/backoff                                |

**Installation:**

```bash
cd backend && pnpm add bullmq
```

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
  queues/
    notification.queue.ts     # Queue + Worker definition
    notification.processor.ts # Job processing logic
    queue-connection.ts       # Dedicated Redis connection for BullMQ
    deadline-scheduler.ts     # Repeatable job for deadline checks
  services/
    notification.service.ts   # Extended with enqueueNotification()
    tasks.service.ts          # Add notification dispatch after create/update
```

### Pattern 1: BullMQ Dedicated Connection

**What:** BullMQ requires `maxRetriesPerRequest: null` on the ioredis connection. The existing Redis client (`backend/src/config/redis.ts`) has `maxRetriesPerRequest: 3`, which will cause BullMQ worker blocking commands (BLPOP) to throw errors.
**When to use:** Always -- BullMQ must have its own connection.
**Example:**

```typescript
// Source: https://docs.bullmq.io/guide/connections
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// CRITICAL: BullMQ needs maxRetriesPerRequest: null
// Do NOT reuse the cache redis client (it has maxRetriesPerRequest: 3)
export const queueConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})
```

[VERIFIED: https://docs.bullmq.io/guide/connections]

### Pattern 2: Queue-Based Notification Dispatch

**What:** Extend `notification.service.ts` to enqueue jobs instead of direct DB insert. Worker processes jobs and calls `create_categorized_notification` RPC.
**When to use:** For all notification triggers (assignment, deadline, lifecycle).
**Example:**

```typescript
// Source: BullMQ docs quick start
import { Queue, Worker } from 'bullmq'
import { queueConnection } from './queue-connection'

interface NotificationJobData {
  userId: string
  type: string
  title: string
  message: string
  category: 'assignments' | 'deadlines' | 'workflow'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
  sourceType?: string
  sourceId?: string
  data?: Record<string, unknown>
}

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

// Worker processes notification jobs
export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job) => {
    const { userId, category } = job.data

    // Check user preferences before sending
    const prefs = await getUserCategoryPreference(userId, category)
    if (prefs && !prefs.in_app_enabled) return // User disabled this category

    // Insert notification via Supabase RPC
    await supabase.rpc('create_categorized_notification', {
      p_user_id: userId,
      p_type: job.data.type,
      p_title: job.data.title,
      p_message: job.data.message,
      p_category: category,
      p_data: job.data.data ?? {},
      p_priority: job.data.priority,
      p_action_url: job.data.actionUrl ?? null,
      p_source_type: job.data.sourceType ?? null,
      p_source_id: job.data.sourceId ?? null,
    })
  },
  { connection: queueConnection, concurrency: 5 },
)
```

[CITED: https://docs.bullmq.io/readme-1]

### Pattern 3: Deadline Check via Repeatable Job

**What:** BullMQ repeatable job that runs periodically to find approaching/overdue deadlines and dispatch notifications.
**When to use:** For NOTIF-02 deadline approaching/overdue requirement.
**Example:**

```typescript
// Add repeatable job on server startup
await notificationQueue.add(
  'check-deadlines',
  {},
  {
    repeat: { every: 15 * 60 * 1000 }, // Every 15 minutes
    jobId: 'deadline-checker', // Prevent duplicates on restart
  },
)
```

[CITED: https://docs.bullmq.io/guide/jobs/repeatable]

### Pattern 4: Lifecycle Notification via Postgres Trigger

**What:** Since engagement lifecycle transitions happen in a Supabase Edge Function (Deno runtime, no access to BullMQ), use a Postgres trigger on `engagement_dossiers.lifecycle_stage` column changes to insert a notification directly.
**When to use:** For lifecycle stage change notifications (D-06 category 3).
**Example:**

```sql
-- Trigger function: notify on lifecycle stage change
CREATE OR REPLACE FUNCTION notify_lifecycle_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
    -- Get the dossier owner to notify
    PERFORM create_categorized_notification(
      (SELECT created_by FROM dossiers WHERE id = NEW.id),
      'lifecycle_transition',
      'Engagement stage changed to ' || NEW.lifecycle_stage,
      'Stage transitioned from ' || COALESCE(OLD.lifecycle_stage, 'none')
        || ' to ' || NEW.lifecycle_stage,
      'workflow',
      '{}'::jsonb,
      'normal',
      '/engagements/' || NEW.id,
      'engagement',
      NEW.id,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_lifecycle_stage_notification
  AFTER UPDATE OF lifecycle_stage ON engagement_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION notify_lifecycle_stage_change();
```

[ASSUMED]

### Anti-Patterns to Avoid

- **Dispatching notifications inside DB transactions:** If the transaction rolls back, the notification is already sent. Always dispatch AFTER successful commit (D-05).
- **Reusing the cache Redis connection for BullMQ:** The existing connection has `maxRetriesPerRequest: 3` which breaks BullMQ's BLPOP. Create a dedicated connection.
- **Polling for new notifications:** The frontend already uses Supabase Realtime subscriptions -- do not add HTTP polling alongside it.
- **Rebuilding existing UI:** NotificationPanel, useNotificationCenter, NotificationBadge, preferences UI all exist. Wire and verify, do not rebuild.

## Don't Hand-Roll

| Problem                   | Don't Build                | Use Instead                                                                        | Why                                                                     |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Job queue                 | Custom Redis pub/sub queue | BullMQ                                                                             | Retries, backoff, repeatable jobs, dead letter queue, dashboard support |
| Scheduled deadline checks | Node.js setInterval/cron   | BullMQ repeatable jobs                                                             | Survives server restart, prevents duplicate execution, configurable     |
| Notification preferences  | Custom preference logic    | Existing `notification_category_preferences` table + `useCategoryPreferences` hook | Already built with per-channel, per-category granularity                |
| Realtime updates          | WebSocket server           | Supabase Realtime (already configured)                                             | Already publishing notifications table changes                          |
| Toast notifications       | Custom toast system        | Sonner (already installed)                                                         | Already integrated via `useToast` hook                                  |

**Key insight:** This phase is 70% wiring existing components together and 30% new code (BullMQ setup + trigger integration). The schema, UI, Realtime, preferences, and RPC functions are all in place.

## Common Pitfalls

### Pitfall 1: maxRetriesPerRequest Incompatibility

**What goes wrong:** BullMQ worker crashes with "Max retries per request limit exceeded" when using a shared Redis connection.
**Why it happens:** BullMQ uses BLPOP (blocking Redis command) which can exceed the retry limit. ioredis throws when `maxRetriesPerRequest` is a number.
**How to avoid:** Create a separate Redis connection with `maxRetriesPerRequest: null` for BullMQ.
**Warning signs:** Worker starts but immediately throws on first job poll.

### Pitfall 2: Lifecycle Notifications Unreachable from Express

**What goes wrong:** Attempting to call BullMQ from the Supabase Edge Function fails because Edge Functions run in Deno and cannot access the Node.js BullMQ queue.
**Why it happens:** The `transitionLifecycleStage` function lives in `supabase/functions/engagement-dossiers/index.ts`, not in Express.
**How to avoid:** Use a Postgres trigger on `engagement_dossiers.lifecycle_stage` updates to insert notifications directly, bypassing BullMQ for this specific trigger.
**Warning signs:** Lifecycle transitions work but no notifications appear.

### Pitfall 3: Duplicate Deadline Notifications

**What goes wrong:** Users receive the same "deadline approaching" notification multiple times because the scheduled job re-scans the same approaching deadlines.
**Why it happens:** No deduplication logic -- the repeatable job finds the same tasks each run.
**How to avoid:** Track which deadlines have been notified using a `deadline_notified_at` column on the task or a Redis set. Only notify once per deadline threshold (e.g., 24h before, 1h before, overdue).
**Warning signs:** Users complain about notification spam for the same deadline.

### Pitfall 4: Notification Service Schema Mismatch

**What goes wrong:** The existing `sendInAppNotification` function inserts into a `metadata` JSONB column, but the enhanced schema uses separate typed columns (`category`, `source_type`, `source_id`, `priority`, `action_url`).
**Why it happens:** The original service was written before the notification_center migration added these columns.
**How to avoid:** Update `sendInAppNotification` to use the `create_categorized_notification` RPC function (which uses all columns), or extend the function signature to accept all new fields.
**Warning signs:** Notifications appear but with wrong category, no action URLs, no source tracking.

### Pitfall 5: Worker Not Started

**What goes wrong:** Notifications enqueue but never process.
**Why it happens:** The worker must be explicitly started during Express server bootstrap. If the import is missing, the worker never instantiates.
**How to avoid:** Import and initialize the worker in the Express server startup sequence (`backend/src/index.ts`), log worker ready state.
**Warning signs:** Queue size grows indefinitely, no notifications delivered.

## Code Examples

### Task Assignment Notification Trigger

```typescript
// In tasks.service.ts createTask(), after successful DB insert:
// Source: codebase pattern from after-action.ts
async createTask(input: CreateTaskInput): Promise<Task> {
  // ... existing task creation logic ...
  const task = data // successful insert result

  // Dispatch assignment notification (AFTER successful DB write)
  if (task.assignee_id && task.assignee_id !== input.created_by) {
    await notificationQueue.add('task-assigned', {
      userId: task.assignee_id,
      type: 'task_assigned',
      title: 'New task assigned',
      message: `You have been assigned: ${task.title}`,
      category: 'assignments',
      priority: task.priority === 'urgent' ? 'high' : 'normal',
      actionUrl: `/tasks/${task.id}`,
      sourceType: 'task',
      sourceId: task.id,
      data: { taskId: task.id, assignedBy: input.created_by },
    })
  }

  return task
}
```

[ASSUMED - based on codebase patterns]

### Deadline Check Processor

```typescript
// In notification.processor.ts
async function processDeadlineCheck(): Promise<void> {
  const supabase = getServiceClient()

  // Find tasks with approaching deadlines (within 24 hours)
  const { data: approaching } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, sla_deadline')
    .eq('is_deleted', false)
    .not('sla_deadline', 'is', null)
    .not('assignee_id', 'is', null)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .lte('sla_deadline', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    .gt('sla_deadline', new Date().toISOString())

  // Find overdue tasks
  const { data: overdue } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, sla_deadline')
    .eq('is_deleted', false)
    .not('sla_deadline', 'is', null)
    .not('assignee_id', 'is', null)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .lte('sla_deadline', new Date().toISOString())

  // Enqueue notifications (with dedup via jobId)
  for (const task of approaching || []) {
    await notificationQueue.add(
      'deadline-approaching',
      {
        userId: task.assignee_id,
        type: 'deadline_approaching',
        title: 'Deadline approaching',
        message: `"${task.title}" is due within 24 hours`,
        category: 'deadlines',
        priority: 'high',
        actionUrl: `/tasks/${task.id}`,
        sourceType: 'task',
        sourceId: task.id,
      },
      {
        jobId: `deadline-24h-${task.id}`, // Prevents duplicate
      },
    )
  }
}
```

[ASSUMED - based on codebase query patterns]

### Worker Startup in Express Server

```typescript
// In backend/src/index.ts, after Redis initialization
import { notificationWorker, notificationQueue } from './queues/notification.queue'

// After initializeRedis() succeeds:
notificationWorker.on('ready', () => {
  logInfo('Notification worker ready')
})
notificationWorker.on('failed', (job, err) => {
  logError(`Notification job ${job?.id} failed`, err)
})

// Register deadline checker repeatable job
await notificationQueue.add(
  'check-deadlines',
  {},
  {
    repeat: { every: 15 * 60 * 1000 },
    jobId: 'deadline-checker',
  },
)
```

[ASSUMED - based on BullMQ docs pattern]

## State of the Art

| Old Approach                       | Current Approach                                        | When Changed       | Impact                                                      |
| ---------------------------------- | ------------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| Direct DB insert for notifications | Queue-based async dispatch (BullMQ)                     | This phase         | Decouples notification from business logic, enables retries |
| `metadata` JSONB blob              | Typed columns (`category`, `source_type`, `action_url`) | Migration 20260111 | Better querying, filtering, and preference matching         |
| No deadline monitoring             | Repeatable job scanning sla_deadline                    | This phase         | Users get proactive alerts                                  |

**Deprecated/outdated:**

- The original `sendInAppNotification` function uses the old `metadata` column pattern. It should be updated to use `create_categorized_notification` RPC.

## Assumptions Log

| #   | Claim                                                                                                                        | Section                    | Risk if Wrong                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| A1  | Postgres trigger on `engagement_dossiers.lifecycle_stage` is the best way to notify on lifecycle changes from Edge Functions | Architecture Pattern 4     | If trigger approach is undesirable, would need to refactor Edge Function to call Express API |
| A2  | 15-minute interval for deadline checks is appropriate                                                                        | Discretion / Code Examples | Too frequent = wasted resources; too infrequent = late notifications                         |
| A3  | `dossiers.created_by` is the correct user to notify for lifecycle changes                                                    | Architecture Pattern 4     | May need to notify all participants instead of just the creator                              |
| A4  | `jobId` deduplication prevents duplicate deadline notifications                                                              | Code Examples              | If jobId collision logic is wrong, could still send duplicates                               |

## Open Questions (RESOLVED)

1. **Who gets lifecycle notifications?**
   - What we know: Engagement dossiers have a `created_by` field in the `dossiers` table.
   - What's unclear: Should ALL engagement participants be notified, or just the creator/owner?
   - Recommendation: Start with creator only, extend to participants in future iteration.
   - **(RESOLVED):** Adopting recommendation — notify `dossiers.created_by` only. Participant notification deferred.

2. **Deadline notification thresholds**
   - What we know: Tasks have `sla_deadline` column.
   - What's unclear: At what intervals should we notify? (48h, 24h, 1h before? On overdue?)
   - Recommendation: Two thresholds -- 24 hours before and on overdue. Use `jobId` dedup.
   - **(RESOLVED):** Adopting recommendation — two thresholds: 24h approaching + overdue. Dedup via `jobId`.

3. **Task reassignment notification**
   - What we know: `updateTask` can change `assignee_id`.
   - What's unclear: Should the old assignee be notified of unassignment?
   - Recommendation: Notify new assignee only (D-06 scope). Old assignee notification is a future enhancement.
   - **(RESOLVED):** Adopting recommendation — notify new assignee only per D-06. Old assignee unassignment notification deferred.

## Environment Availability

| Dependency | Required By                     | Available | Version                  | Fallback |
| ---------- | ------------------------------- | --------- | ------------------------ | -------- |
| Redis      | BullMQ queue + worker           | Yes       | 7.x (production droplet) | --       |
| ioredis    | BullMQ connection               | Yes       | ^5.10.1                  | --       |
| Supabase   | Notification storage + Realtime | Yes       | Managed                  | --       |
| Node.js    | Express server + BullMQ worker  | Yes       | 20.19.0+                 | --       |

**Missing dependencies with no fallback:**

- `bullmq` package not yet installed -- must be added via `pnpm add bullmq`

**Missing dependencies with fallback:**

- None

## Validation Architecture

### Test Framework

| Property           | Value                                              |
| ------------------ | -------------------------------------------------- |
| Framework          | Vitest (backend)                                   |
| Config file        | `backend/vitest.config.ts`                         |
| Quick run command  | `cd backend && pnpm vitest run --reporter=verbose` |
| Full suite command | `cd backend && pnpm test`                          |

### Phase Requirements -> Test Map

| Req ID   | Behavior                                            | Test Type   | Automated Command                                                   | File Exists?      |
| -------- | --------------------------------------------------- | ----------- | ------------------------------------------------------------------- | ----------------- |
| NOTIF-01 | Bell icon renders with unread count                 | manual      | Visual verification in browser                                      | N/A (existing UI) |
| NOTIF-02 | Notification dispatched on task assignment          | unit        | `cd backend && pnpm vitest run tests/notification-queue.test.ts -x` | Wave 0            |
| NOTIF-02 | Deadline check finds approaching/overdue tasks      | unit        | `cd backend && pnpm vitest run tests/deadline-checker.test.ts -x`   | Wave 0            |
| NOTIF-02 | Lifecycle trigger creates notification (DB trigger) | integration | Manual: trigger stage change, verify notification row               | Wave 0            |
| NOTIF-06 | Preference check skips disabled categories          | unit        | `cd backend && pnpm vitest run tests/notification-queue.test.ts -x` | Wave 0            |
| NOTIF-07 | Mark-as-read works individually and bulk            | manual      | Existing UI verification                                            | N/A (existing UI) |
| NOTIF-08 | Queue decouples dispatch from transaction           | unit        | `cd backend && pnpm vitest run tests/notification-queue.test.ts -x` | Wave 0            |

### Sampling Rate

- **Per task commit:** `cd backend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd backend && pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/notification-queue.test.ts` -- covers NOTIF-02, NOTIF-06, NOTIF-08
- [ ] `backend/tests/deadline-checker.test.ts` -- covers NOTIF-02 deadline scenario
- [ ] BullMQ install: `cd backend && pnpm add bullmq`

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                              |
| --------------------- | ------- | ----------------------------------------------------------------------------- |
| V2 Authentication     | No      | Notifications use existing auth context                                       |
| V3 Session Management | No      | No new session logic                                                          |
| V4 Access Control     | Yes     | RLS on notifications table ensures users only see their own notifications     |
| V5 Input Validation   | Yes     | Validate notification job data types before enqueue; Zod schema on API inputs |
| V6 Cryptography       | No      | No new crypto operations                                                      |

### Known Threat Patterns

| Pattern                                                                            | STRIDE            | Standard Mitigation                                                                          |
| ---------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Notification spoofing (user A triggers notification appearing to come from user B) | Spoofing          | All notifications created server-side via service role; no client-side notification creation |
| Notification enumeration (user reads other users' notifications)                   | Info Disclosure   | RLS policy on `notifications` table: `user_id = auth.uid()`                                  |
| Queue poisoning (malformed job data)                                               | Tampering         | Validate job data with TypeScript interfaces; worker rejects invalid payloads                |
| Denial of service via notification spam                                            | Denial of Service | Rate limit notification creation per source; BullMQ concurrency limit                        |

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `notification.service.ts`, `useNotificationCenter.ts`, `NotificationPanel.tsx`, `redis.ts`
- Codebase analysis: `supabase/functions/engagement-dossiers/index.ts` (lifecycle transition logic)
- Codebase analysis: `tasks.service.ts` (assignment trigger points)
- Codebase analysis: `supabase/migrations/20260111100001_notification_center.sql` (schema + RPC functions)
- [BullMQ Connections docs](https://docs.bullmq.io/guide/connections) - maxRetriesPerRequest requirement
- [BullMQ Quick Start](https://docs.bullmq.io/readme-1) - Queue/Worker setup
- npm registry: `bullmq@5.73.0` current version

### Secondary (MEDIUM confidence)

- [BullMQ TypeScript Setup Guide](https://oneuptime.com/blog/post/2026-01-21-bullmq-typescript-setup/view) - TypeScript patterns
- [BullMQ Background Jobs 2026 Guide](https://1xapi.com/blog/bullmq-5-background-job-queues-nodejs-2026-guide) - Repeatable jobs pattern

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - BullMQ verified via npm, ioredis compatibility confirmed, all existing code inspected
- Architecture: HIGH - All trigger points identified, Edge Function limitation discovered and addressed
- Pitfalls: HIGH - maxRetriesPerRequest issue verified via official docs, lifecycle Edge Function gap confirmed by codebase analysis

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable domain, unlikely to change)
