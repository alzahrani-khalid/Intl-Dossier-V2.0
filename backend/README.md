# GASTAT International Dossier System - Backend

**Tech Stack**: Node.js 18+ LTS + TypeScript 5.8+ + Express.js + Supabase Edge Functions + Redis + node-cron

## Overview

Backend service for the GASTAT International Dossier System, providing API endpoints, scheduled jobs, and background processing for relationship health scoring and commitment tracking.

---

## Quick Start

### Prerequisites

- Node.js 18+ LTS
- pnpm 10.x+
- Redis 7.x+ (for distributed job locking)
- Supabase CLI (for Edge Functions deployment)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
# Server runs at http://localhost:3000
```

### Environment Variables

Create `.env`:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Scheduled Job Configuration
ENABLE_SCHEDULED_JOBS=true
HEALTH_REFRESH_INTERVAL_MINUTES=15
OVERDUE_CHECK_HOUR=2  # 2:00 AM AST

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
PROMETHEUS_PORT=9090
```

---

## Project Structure

```
backend/
├── src/
│   ├── jobs/                    # Scheduled background jobs
│   │   ├── refresh-health-scores.job.ts      # Health score refresh (US3)
│   │   └── detect-overdue-commitments.job.ts # Overdue detection (US3)
│   ├── services/                # Business logic services
│   │   └── notification.service.ts # Notification management (US4)
│   ├── utils/                   # Utility functions
│   │   ├── health-formula.util.ts # Health score formula (US1)
│   │   └── audit-logger.ts      # Audit logging
│   ├── types/                   # TypeScript type definitions
│   │   └── ai-extraction.types.ts
│   ├── index.ts                 # Main application entry point
│   └── app.ts                   # Express app configuration
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── package.json
└── tsconfig.json
```

---

## Key Features

### 030-health-commitment: Relationship Health & Commitment Intelligence

#### Scheduled Jobs (User Story 3)

The backend runs two critical scheduled jobs for maintaining health scores and detecting overdue commitments:

##### 1. Refresh Health Scores Job

**File**: `src/jobs/refresh-health-scores.job.ts`

**Schedule**: Every 15 minutes (`*/15 * * * *`)

**Purpose**:
1. Refresh materialized views (`dossier_engagement_stats`, `dossier_commitment_stats`)
2. Recalculate stale health scores (calculated > 60 minutes ago)
3. Maintain 95%+ freshness rate for health scores

**Implementation**:
```typescript
import cron from 'node-cron';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

const redis = new Redis(process.env.REDIS_URL);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const lockKey = 'job:refresh-health-scores';
  const lock = await redis.set(lockKey, '1', 'EX', 900, 'NX'); // 15-minute lock

  if (!lock) {
    console.log('[HEALTH-REFRESH] Job already running, skipping');
    return;
  }

  try {
    console.log('[HEALTH-REFRESH] Starting materialized view refresh');

    // Refresh materialized views
    await supabase.rpc('refresh_engagement_stats');
    await supabase.rpc('refresh_commitment_stats');

    console.log('[HEALTH-REFRESH] Materialized views refreshed');

    // Recalculate stale health scores (>60 minutes old)
    const { data: staleDossiers } = await supabase
      .from('health_scores')
      .select('dossier_id')
      .lt('calculated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    for (const dossier of staleDossiers) {
      await fetch(`${process.env.SUPABASE_URL}/functions/v1/calculate-health-score`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ dossierId: dossier.dossier_id })
      });
    }

    console.log(`[HEALTH-REFRESH] Recalculated ${staleDossiers.length} stale health scores`);
  } catch (error) {
    console.error('[HEALTH-REFRESH] Job failed:', error);
    // TODO: Alert operations team (Sentry, Prometheus)
  } finally {
    await redis.del(lockKey);
  }
});
```

**Best Practices**:
- **Redis Distributed Locking**: Prevents duplicate job execution across multiple backend instances
- **Lock Expiration**: 15-minute auto-release on job crash (900 seconds)
- **Structured Logging**: Prefix all logs with `[HEALTH-REFRESH]` for easy filtering
- **Error Handling**: Catch and log errors without crashing the job scheduler

**Monitoring**:
```bash
# Check job logs
tail -f backend.log | grep HEALTH-REFRESH

# Verify job execution frequency
redis-cli GET job:refresh-health-scores
# Returns "1" if job is currently running

# Check health score freshness
# Run SQL query (see quickstart.md)
```

##### 2. Detect Overdue Commitments Job

**File**: `src/jobs/detect-overdue-commitments.job.ts`

**Schedule**: Daily at 2:00 AM AST (`0 2 * * *`)

**Purpose**:
1. Detect commitments past due date with status `pending` or `in_progress`
2. Update status to `overdue`
3. Send notifications to commitment owner + dossier owner
4. Trigger health score recalculation for affected dossiers

**Implementation**:
```typescript
import cron from 'node-cron';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

const redis = new Redis(process.env.REDIS_URL);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Run daily at 2:00 AM AST
cron.schedule('0 2 * * *', async () => {
  const lockKey = 'job:detect-overdue-commitments';
  const lock = await redis.set(lockKey, '1', 'EX', 3600, 'NX'); // 1-hour lock

  if (!lock) {
    console.log('[OVERDUE-CHECK] Job already running, skipping');
    return;
  }

  try {
    console.log('[OVERDUE-CHECK] Starting overdue detection');

    // Call Edge Function for overdue detection
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/detect-overdue-commitments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dryRun: false })
      }
    );

    const result = await response.json();

    console.log(`[OVERDUE-CHECK] Marked ${result.overdueCount} commitments as overdue`);
    console.log(`[OVERDUE-CHECK] Sent ${result.notificationsSent} notifications`);
    console.log(`[OVERDUE-CHECK] Recalculated ${result.healthScoresRecalculated} health scores`);
  } catch (error) {
    console.error('[OVERDUE-CHECK] Job failed:', error);
    // TODO: Alert operations team (Sentry, Prometheus)
  } finally {
    await redis.del(lockKey);
  }
});
```

**Best Practices**:
- **Scheduled During Off-Peak**: 2:00 AM AST to minimize impact on users
- **Batch Notification Limits**: Max 10 notifications per user per day (prevent spam)
- **Cascading Updates**: Overdue status → Notification → Health score recalculation

**Monitoring**:
```bash
# Check job logs
tail -f backend.log | grep OVERDUE-CHECK

# Verify job execution
redis-cli GET job:detect-overdue-commitments
# Returns "1" if job is currently running

# Check overdue commitments
# Run SQL query (see quickstart.md)
```

##### Job Registration

**File**: `src/index.ts` or `src/app.ts`

```typescript
import './jobs/refresh-health-scores.job';
import './jobs/detect-overdue-commitments.job';

if (process.env.ENABLE_SCHEDULED_JOBS === 'true') {
  console.log('[HEALTH-REFRESH] Scheduled job registered: every 15 minutes');
  console.log('[OVERDUE-CHECK] Scheduled job registered: daily at 2:00 AM');
} else {
  console.log('[JOBS] Scheduled jobs disabled (ENABLE_SCHEDULED_JOBS=false)');
}
```

#### Notification Service (User Story 4)

**File**: `src/services/notification.service.ts`

**Purpose**: Centralized notification management for health score drops and overdue commitments.

**Implementation**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Send in-app notification to user
 * @param userId - Recipient user ID
 * @param title - Notification title
 * @param message - Notification message
 * @param metadata - Additional metadata (e.g., dossier_id, commitment_id)
 */
export async function sendInAppNotification(
  userId: string,
  title: string,
  message: string,
  metadata: object = {}
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      metadata,
      created_at: new Date().toISOString(),
      read: false
    })
    .select()
    .single();

  if (error) {
    console.error('[NOTIFICATION] Failed to send notification:', error);
    throw error;
  }

  console.log(`[NOTIFICATION] Sent notification to user ${userId}: ${title}`);
  return data;
}

/**
 * Get notifications for user
 * @param userId - User ID
 * @param unreadOnly - Filter to unread notifications only
 */
export async function getNotifications(userId: string, unreadOnly: boolean = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[NOTIFICATION] Failed to fetch notifications:', error);
    throw error;
  }

  return data;
}

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[NOTIFICATION] Failed to mark notification as read:', error);
    throw error;
  }

  console.log(`[NOTIFICATION] Marked notification ${notificationId} as read`);
}
```

**Usage in Jobs**:

```typescript
// Health score drop notification (refresh-health-scores.job.ts)
import { sendInAppNotification } from '../services/notification.service';

// After health score recalculation
if (newScore < 60 && previousScore >= 60) {
  const title = `Relationship health score dropped for ${dossierName}`;
  const message = `Health score is now ${newScore} (was ${previousScore}). Contributing factors: ${factors}.`;

  await sendInAppNotification(dossierOwnerId, title, message, {
    dossier_id: dossierId,
    new_score: newScore,
    previous_score: previousScore,
    factors
  });
}

// Overdue commitment notification (detect-overdue-commitments.job.ts)
import { sendInAppNotification } from '../services/notification.service';

// After marking commitment as overdue
const title = `Commitment overdue: ${commitmentDescription}`;
const message = `${commitmentDescription} is overdue (due ${dueDate}). Dossier: ${dossierName}. Recommended: Update status or extend deadline.`;

await sendInAppNotification(commitmentOwnerId, title, message, {
  commitment_id: commitmentId,
  dossier_id: dossierId,
  due_date: dueDate
});

await sendInAppNotification(dossierOwnerId, title, message, {
  commitment_id: commitmentId,
  dossier_id: dossierId,
  due_date: dueDate
});
```

#### Health Formula Utility (User Story 1)

**File**: `src/utils/health-formula.util.ts`

**Purpose**: Centralized health score calculation logic (spec 009 formula).

**Implementation**:
```typescript
/**
 * Calculate recency score based on days since last engagement
 * @param latestEngagementDate - Most recent engagement timestamp
 * @returns Recency score (10, 40, 70, or 100)
 */
export function calculateRecencyScore(latestEngagementDate: string): number {
  const daysSinceLastEngagement = Math.floor(
    (Date.now() - new Date(latestEngagementDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Spec 009 recency thresholds
  if (daysSinceLastEngagement <= 30) return 100;  // ≤30 days
  if (daysSinceLastEngagement <= 90) return 70;   // 30-90 days
  if (daysSinceLastEngagement <= 180) return 40;  // 90-180 days
  return 10;                                       // >180 days
}

/**
 * Calculate overall health score from components
 * @param engagementFrequency - Engagement frequency score (0-100)
 * @param commitmentFulfillment - Commitment fulfillment rate (0-100)
 * @param recencyScore - Recency score (10, 40, 70, or 100)
 * @returns Overall health score (0-100)
 */
export function calculateHealthScore(
  engagementFrequency: number,
  commitmentFulfillment: number,
  recencyScore: number
): number {
  // Spec 009 formula: weighted average
  // Engagement: 30%, Commitment: 40%, Recency: 30%
  return Math.round(
    (engagementFrequency * 0.30) +
    (commitmentFulfillment * 0.40) +
    (recencyScore * 0.30)
  );
}
```

**Usage in Edge Functions** (Supabase Edge Functions use these utilities):
```typescript
import { calculateRecencyScore, calculateHealthScore } from './utils/health-formula.util';

// In calculate-health-score Edge Function
const recencyScore = calculateRecencyScore(engagementStats.latest_engagement_date);
const overallScore = calculateHealthScore(
  engagementStats.engagement_frequency_score,
  commitmentStats.fulfillment_rate,
  recencyScore
);
```

---

## Redis Distributed Locking

### Purpose

Prevent duplicate job execution when multiple backend instances run (horizontal scaling).

### Implementation Pattern

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function acquireLock(lockKey: string, expirationSeconds: number): Promise<boolean> {
  // SET key value EX seconds NX
  // Returns "OK" if lock acquired, null if already exists
  const result = await redis.set(lockKey, '1', 'EX', expirationSeconds, 'NX');
  return result === 'OK';
}

async function releaseLock(lockKey: string): Promise<void> {
  await redis.del(lockKey);
}

// Usage in scheduled job
const lockAcquired = await acquireLock('job:refresh-health-scores', 900);

if (!lockAcquired) {
  console.log('Job already running, skipping');
  return;
}

try {
  // Execute job logic
} finally {
  await releaseLock('job:refresh-health-scores');
}
```

### Best Practices

- **Lock Expiration**: Set to job execution window (15 minutes for health refresh, 1 hour for overdue detection)
- **NX Flag**: "Not exists" - only set key if it doesn't exist (atomic operation)
- **Always Release**: Use `finally` block to ensure lock released on success or failure
- **Monitor Lock Status**: Check lock key in Redis to verify job completion

---

## Supabase Edge Functions

Backend scheduled jobs call Supabase Edge Functions for health calculation and overdue detection:

### Deployed Edge Functions

1. **`dossier-stats`**: Single/bulk dossier stats retrieval (US1, US2)
2. **`calculate-health-score`**: On-demand health score calculation (US1)
3. **`detect-overdue-commitments`**: Overdue commitment detection (US3)
4. **`refresh-commitment-stats`**: Materialized view refresh (US3)
5. **`trigger-health-recalculation`**: Batch health score recalculation (US3)

### Deployment

```bash
# Deploy all Edge Functions to production
supabase functions deploy dossier-stats
supabase functions deploy calculate-health-score
supabase functions deploy detect-overdue-commitments
supabase functions deploy refresh-commitment-stats
supabase functions deploy trigger-health-recalculation

# Verify deployment
supabase functions list
```

### Calling Edge Functions from Backend

```typescript
// Example: Call calculate-health-score Edge Function
const response = await fetch(
  `${process.env.SUPABASE_URL}/functions/v1/calculate-health-score`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dossierId: 'uuid-here',
      forceRecalculation: true
    })
  }
);

const result = await response.json();
console.log('Health score calculated:', result.overallScore);
```

---

## Development Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint fix
pnpm format           # Prettier format
pnpm typecheck        # TypeScript check

# Testing
pnpm test             # Run unit tests
pnpm test:integration # Run integration tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
```

---

## Logging & Monitoring

### Structured Logging

All logs follow structured JSON format for easy parsing:

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  component: 'HEALTH-REFRESH',
  message: 'Materialized views refreshed',
  dossierId: 'uuid-here',
  executionTimeMs: 4823
}));
```

### Log Prefixes

- `[HEALTH-REFRESH]`: Health score refresh job
- `[OVERDUE-CHECK]`: Overdue commitment detection job
- `[NOTIFICATION]`: Notification service
- `[ERROR]`: Error logs

### Monitoring Integration

```typescript
// TODO: Integrate with Sentry for error tracking
import * as Sentry from '@sentry/node';

try {
  // Job logic
} catch (error) {
  console.error('[HEALTH-REFRESH] Job failed:', error);
  Sentry.captureException(error);
}

// TODO: Integrate with Prometheus for metrics
import prometheus from 'prom-client';

const jobDurationHistogram = new prometheus.Histogram({
  name: 'health_refresh_job_duration_seconds',
  help: 'Duration of health refresh job execution',
  buckets: [1, 5, 10, 30, 60, 120, 300, 600, 900]
});
```

---

## Performance Benchmarks

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Materialized View Refresh (engagement_stats) | ~10s | 500 dossiers, 25,000 engagements |
| Materialized View Refresh (commitment_stats) | ~5s | 500 dossiers, 5,000 commitments |
| Health Score Calculation (single dossier) | ~50ms | Edge Function query time |
| Overdue Detection (batch) | ~2s | 50 commitments updated |
| Notification Sending | ~100ms | Per notification |

---

## Troubleshooting

### Issue: Scheduled jobs not running

**Solution**:
1. Check environment variable: `ENABLE_SCHEDULED_JOBS=true`
2. Verify Redis connection: `redis-cli PING` (should return `PONG`)
3. Check job registration logs: `tail -f backend.log | grep "Scheduled job registered"`
4. Manually trigger job for testing (see quickstart.md)

### Issue: Redis lock prevents job execution

**Solution**:
1. Check lock status: `redis-cli GET job:refresh-health-scores`
2. Manually release lock: `redis-cli DEL job:refresh-health-scores`
3. Wait for lock expiration (15 minutes for health refresh, 1 hour for overdue)

### Issue: Edge Function calls fail with 401 Unauthorized

**Solution**:
1. Verify `SUPABASE_SERVICE_KEY` environment variable is correct
2. Use service key (not anon key) for backend-to-Edge Function calls
3. Check Edge Function deployment: `supabase functions list`

### Issue: Materialized view refresh fails

**Solution**:
1. Check database connection: `supabase db query "SELECT 1"`
2. Verify materialized views exist: `SELECT * FROM dossier_engagement_stats LIMIT 1;`
3. Check unique index exists: `\d dossier_engagement_stats` (should show unique index)
4. Manually refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_engagement_stats;`

---

## Environment Configuration

### Production

```env
SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
SUPABASE_SERVICE_KEY=<production_service_key>
REDIS_URL=redis://production-redis:6379
ENABLE_SCHEDULED_JOBS=true
HEALTH_REFRESH_INTERVAL_MINUTES=15
OVERDUE_CHECK_HOUR=2
SENTRY_DSN=<production_sentry_dsn>
PROMETHEUS_PORT=9090
```

### Staging

```env
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_SERVICE_KEY=<staging_service_key>
REDIS_URL=redis://staging-redis:6379
ENABLE_SCHEDULED_JOBS=true
HEALTH_REFRESH_INTERVAL_MINUTES=15
OVERDUE_CHECK_HOUR=2
```

### Local Development

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=<local_service_key>
REDIS_URL=redis://localhost:6379
ENABLE_SCHEDULED_JOBS=false  # Disable jobs for local development (manual trigger)
```

---

## Related Documentation

- **Feature Spec**: `specs/030-health-commitment/spec.md`
- **Implementation Plan**: `specs/030-health-commitment/plan.md`
- **Data Model**: `specs/030-health-commitment/data-model.md`
- **API Contracts**: `specs/030-health-commitment/contracts/`
- **Quickstart Guide**: `specs/030-health-commitment/quickstart.md`
- **Frontend README**: `frontend/README.md`

---

## Contributing

### Code Style

- **TypeScript strict mode**: Enabled
- **ESLint**: Enforced on commit via pre-commit hook
- **Prettier**: Auto-format on save
- **Conventional Commits**: Required for all commits

### Pull Request Checklist

- [ ] All tests passing (`pnpm test && pnpm test:integration`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Scheduled jobs tested locally (manual trigger)
- [ ] Redis lock mechanism verified
- [ ] Edge Functions deployed and tested
- [ ] Functions documented with JSDoc comments
- [ ] Structured logging implemented

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review feature documentation in `specs/030-health-commitment/`
3. Contact team: Slack #intl-dossier-dev channel

---

**Last Updated**: 2025-11-15
**Maintainer**: GASTAT Technical Team
