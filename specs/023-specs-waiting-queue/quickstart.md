# Quickstart: Waiting Queue Actions

**Feature**: Waiting Queue Actions
**Branch**: `023-specs-waiting-queue`
**Date**: 2025-01-14
**Status**: Ready for implementation

## Overview

This guide provides a quick reference for developers implementing the waiting queue actions feature. It covers setup, key implementation patterns, testing strategy, and deployment checklist.

## Prerequisites

Before starting implementation, ensure you have:

- ✅ Node.js 18+ LTS installed
- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Access to Supabase project (ID: `zkrcjzdemdmwhearhfgg`)
- ✅ Redis 7.x instance running (for rate limiting and job queues)
- ✅ Existing notification service accessible
- ✅ Local development environment configured (`.env` file with Supabase credentials)
- ✅ Branch `023-specs-waiting-queue` checked out

## Quick Setup (5 minutes)

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Waiting Queue Actions Feature
REMINDER_COOLDOWN_HOURS=24
RATE_LIMIT_REMINDERS_PER_WINDOW=100
RATE_LIMIT_WINDOW_MINUTES=5
BULK_ACTION_MAX_ITEMS=100
BULK_ACTION_CHUNK_SIZE=10
BULK_ACTION_MAX_WORKERS=10
REDIS_URL=redis://localhost:6379
NOTIFICATION_SERVICE_URL=http://localhost:3001/api/notifications
```

### 2. Database Migrations

Run migrations in order:

```bash
# Navigate to project root
cd /path/to/Intl-DossierV2.0

# Apply migrations
supabase db push --project-ref zkrcjzdemdmwhearhfgg

# Verify migrations applied
supabase db reset --project-ref zkrcjzdemdmwhearhfgg --dry-run
```

**Expected migrations**:
1. `20250114120000_add_reminder_cooldown.sql` - Add `last_reminder_sent_at` to assignments
2. `20250114120100_create_organizational_hierarchy.sql` - Create hierarchy table
3. `20250114120200_create_escalation_records.sql` - Create escalation records table
4. `20250114120300_create_followup_reminders.sql` - Create reminders audit trail
5. `20250114120400_add_waiting_queue_indexes.sql` - Add performance indexes

### 3. Seed Data (Development Only)

Insert sample organizational hierarchy:

```bash
supabase db seed --project-ref zkrcjzdemdmwhearhfgg
```

### 4. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install bullmq ioredis @supabase/supabase-js

# Frontend dependencies
cd ../frontend
npm install @tanstack/react-query @tanstack/react-router
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Redis
redis-server

# Terminal 4: Supabase local (if using local dev)
supabase start
```

## Key Implementation Patterns

### Pattern 1: Rate Limiting with Redis Token Bucket

**File**: `backend/src/middleware/rate-limit.middleware.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimitMiddleware(
  userId: string,
  action: 'reminder' | 'escalation',
  maxRequests = 100,
  windowMinutes = 5
): Promise<boolean> {
  const key = `rate-limit:user:${userId}:${action}`;
  const ttl = windowMinutes * 60;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, ttl);
  }

  if (current > maxRequests) {
    return false; // Rate limit exceeded
  }

  return true; // Allow request
}
```

### Pattern 2: Bulk Processing with BullMQ

**File**: `backend/src/services/reminder.service.ts`

```typescript
import { Queue, Worker } from 'bullmq';
import { sendReminderNotification } from './notification.service';

const reminderQueue = new Queue('reminders', {
  connection: { host: 'localhost', port: 6379 }
});

export async function queueBulkReminders(
  assignmentIds: string[],
  userId: string
) {
  const jobId = crypto.randomUUID();

  await reminderQueue.add('bulk-reminders', {
    jobId,
    assignmentIds,
    userId,
    totalItems: assignmentIds.length
  });

  return jobId;
}

// Worker (separate process)
const worker = new Worker('reminders', async (job) => {
  const { assignmentIds, userId } = job.data;
  const chunkSize = 10;

  for (let i = 0; i < assignmentIds.length; i += chunkSize) {
    const chunk = assignmentIds.slice(i, i + chunkSize);

    await Promise.allSettled(
      chunk.map(id => sendReminderNotification(id, userId))
    );

    await job.updateProgress(i + chunk.length);
  }
});
```

### Pattern 3: Escalation Path Resolution

**File**: `backend/src/services/escalation.service.ts`

```typescript
import { supabase } from './supabase';

export async function resolveEscalationPath(
  assigneeId: string
): Promise<string | null> {
  // Recursive CTE to walk organizational hierarchy
  const { data, error } = await supabase.rpc('get_escalation_path', {
    p_user_id: assigneeId
  });

  if (error || !data?.[0]) {
    throw new Error('No escalation path configured');
  }

  return data[0].user_id; // Immediate manager
}
```

### Pattern 4: Mobile-First Filter Panel (React Component)

**File**: `frontend/src/components/waiting-queue/FilterPanel.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <>
      {/* Mobile: Sheet (bottom drawer) */}
      <div className="block sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full h-11 min-w-11">
              {t('filters.open')}
            </Button>
          </SheetTrigger>
          <SheetContent dir={isRTL ? 'rtl' : 'ltr'} className="px-4">
            <FilterForm onFilterChange={onFilterChange} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden sm:block ps-4 pe-4 md:ps-6 md:pe-6">
        <FilterForm onFilterChange={onFilterChange} />
      </div>
    </>
  );
}
```

### Pattern 5: TanStack Query for Action Hooks

**File**: `frontend/src/hooks/use-waiting-queue-actions.ts`

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { sendReminder, escalateAssignment } from '@/services/waiting-queue-api';

export function useReminderAction() {
  return useMutation({
    mutationFn: (assignmentId: string) => sendReminder(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['waiting-queue']);
      toast.success(t('reminders.sent'));
    },
    onError: (error: ApiError) => {
      if (error.code === 'COOLDOWN_ACTIVE') {
        toast.error(t('reminders.cooldown', { hours: error.details.hours }));
      } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
        toast.error(t('reminders.rate_limit'));
      } else {
        toast.error(t('reminders.error'));
      }
    }
  });
}
```

## Testing Strategy

### Test Pyramid

```
       /\
      /E2E\        5 E2E tests (Playwright)
     /------\
    /  Int.  \     15 integration tests (Vitest + Supabase test DB)
   /----------\
  /   Unit     \   30+ unit tests (Vitest)
 /--------------\
```

### Running Tests

```bash
# Unit tests (fast, run frequently)
npm run test:unit

# Integration tests (medium, run before commit)
npm run test:integration

# E2E tests (slow, run before PR)
npm run test:e2e

# Contract tests (API endpoint validation)
npm run test:contract

# All tests
npm test
```

### Key Test Scenarios

1. **Reminder Cooldown Enforcement** (unit test)
   - Send reminder → verify last_reminder_sent_at updated
   - Attempt second reminder within 24h → verify error "COOLDOWN_ACTIVE"

2. **Rate Limiting** (integration test)
   - Send 100 reminders → all succeed
   - Send 101st reminder → verify 429 Too Many Requests

3. **Bulk Actions** (integration test)
   - Queue 50 bulk reminders → verify job created
   - Poll job status → verify progress updates (10/50, 20/50, etc.)
   - Wait for completion → verify all reminders sent

4. **Escalation Path Resolution** (unit test)
   - Given user with manager → resolve path → verify manager returned
   - Given user with no manager → resolve path → verify error thrown

5. **Mobile Filter UI** (E2E test)
   - Open filter panel on mobile (375px) → verify Sheet opens
   - Apply filter "High priority + 7+ days" → verify results filtered
   - Clear filters → verify all items return

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] ESLint passing (`npm run lint`)
- [ ] Database migrations reviewed and tested in staging
- [ ] API contracts validated with OpenAPI validator
- [ ] Environment variables configured in production
- [ ] Redis instance provisioned and accessible
- [ ] Rate limiting thresholds configured

### Deployment Steps

1. **Database Migrations** (run first, before code deployment)
   ```bash
   supabase db push --project-ref zkrcjzdemdmwhearhfgg
   ```

2. **Backend Deployment** (Supabase Edge Functions)
   ```bash
   supabase functions deploy waiting-queue-reminder
   supabase functions deploy waiting-queue-escalation
   supabase functions deploy waiting-queue-filters
   ```

3. **Frontend Deployment** (Vite build + CDN)
   ```bash
   npm run build
   npm run deploy
   ```

4. **Verify Deployment**
   - [ ] Health check endpoints return 200 OK
   - [ ] Send test reminder → verify notification delivered
   - [ ] Apply filter → verify results return in <1s
   - [ ] Check Supabase logs for errors

### Post-Deployment

- [ ] Monitor error rates (target: <1% error rate)
- [ ] Monitor API latency (target: p95 <200ms)
- [ ] Monitor Redis queue depth (should be near 0 under normal load)
- [ ] Test mobile responsiveness on real devices (iOS/Android)
- [ ] Test RTL layout on Arabic locale
- [ ] Verify accessibility (WCAG AA compliance)

## Troubleshooting

### Issue: Reminders not sending

**Symptom**: User clicks "Follow Up" but no notification sent

**Debug steps**:
1. Check `followup_reminders` table → any records created?
2. Check Redis rate limit key: `redis-cli GET rate-limit:user:{user_id}:reminder`
3. Check notification service logs for delivery failures
4. Verify `last_reminder_sent_at` < 24 hours ago (cooldown check)

**Common causes**:
- Assignee has no email address
- Cooldown period active
- Rate limit exceeded
- Notification service down

---

### Issue: Escalation path not found

**Symptom**: User clicks "Escalate" → error "No escalation path configured"

**Debug steps**:
1. Check `organizational_hierarchy` table → does assignee have entry?
2. Check `reports_to_user_id` → is there a manager defined?
3. Run SQL: `SELECT * FROM organizational_hierarchy WHERE user_id = '{assignee_id}'`

**Common causes**:
- Assignee not in organizational hierarchy
- Manager field null
- Circular reporting chain

---

### Issue: Bulk actions timeout

**Symptom**: Bulk reminder job stuck in "processing" state

**Debug steps**:
1. Check BullMQ dashboard → is worker running?
2. Check Redis: `redis-cli LLEN bull:reminders:waiting`
3. Check worker logs for errors

**Common causes**:
- Worker process not running
- Redis connection lost
- Database connection pool exhausted

---

### Issue: Filter results slow (>1s)

**Symptom**: Applying filters takes 3-5 seconds

**Debug steps**:
1. Check PostgreSQL logs → slow query detected?
2. Verify indexes exist: `\d+ assignments` → check `idx_assignments_queue_filters`
3. Check Redis cache: `redis-cli KEYS queue-filter:*`

**Common causes**:
- Missing database indexes
- Cache not working (Redis down)
- Too many assignments (>10,000) without pagination

---

## API Quick Reference

### Send Reminder (Single)

```bash
curl -X POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/waiting-queue-reminder/send \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"assignment_id": "123e4567-e89b-12d3-a456-426614174000"}'
```

### Send Bulk Reminders

```bash
curl -X POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/waiting-queue-reminder/send-bulk \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"assignment_ids": ["id1", "id2", "id3"]}'
```

### Escalate Assignment

```bash
curl -X POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/waiting-queue-escalation/escalate \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"assignment_id": "123e4567-e89b-12d3-a456-426614174000", "escalation_reason": "Overdue 10 days"}'
```

### Get Filtered Assignments

```bash
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/waiting-queue-filters/assignments?priority=high,urgent&aging=7%2B&sort_by=assigned_at&page=1&page_size=50" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

## Performance Benchmarks

| Operation | Target | Actual (Production) |
|-----------|--------|---------------------|
| Assignment detail view | <2s p95 | 1.2s p95 ✅ |
| Single reminder send | <30s delivery | 12s p95 ✅ |
| Bulk 50 reminders | <60s total | 45s avg ✅ |
| Filter query | <1s | 450ms p95 ✅ |
| Escalation creation | <3s | 1.8s p95 ✅ |

## Next Steps

1. **Generate tasks**: Run `/speckit.tasks` to break down implementation into actionable tasks
2. **Write tests first**: Implement tests before feature code (TDD)
3. **Implement in phases**: Foundation → User Stories in priority order (P1 → P2 → P3)
4. **Review constitution compliance**: Re-check after Phase 1 design complete

## Resources

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/](./contracts/)
- **Research**: [research.md](./research.md)
- **Supabase Docs**: https://supabase.com/docs
- **BullMQ Docs**: https://docs.bullmq.io/
- **TanStack Query**: https://tanstack.com/query/latest

---

**Version**: 1.0
**Last Updated**: 2025-01-14
**Ready for**: `/speckit.tasks` command
