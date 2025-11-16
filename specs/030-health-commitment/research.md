# Research: Relationship Health & Commitment Intelligence

**Feature**: 030-health-commitment
**Date**: 2025-11-15
**Phase**: 0 - Research & Best Practices

## Overview

This document consolidates research findings for implementing relationship health scoring and commitment tracking aggregations in the GASTAT International Dossier System. All decisions align with the project constitution and existing architectural patterns.

---

## Research Areas

### 1. PostgreSQL Materialized Views for Aggregations

**Decision**: Use PostgreSQL materialized views for pre-computing engagement and commitment aggregations.

**Rationale**:
- **Performance**: Materialized views cache expensive aggregation queries, enabling ≤500ms response times for dossier stats (constitutional requirement: <2s page load)
- **Automatic Refresh**: PostgreSQL supports `REFRESH MATERIALIZED VIEW CONCURRENTLY` to update views without blocking reads
- **Native Support**: No external dependencies required (constitutional compliance: use PostgreSQL features)
- **Proven Pattern**: Widely used in data warehousing for dashboard aggregations and analytics

**Alternatives Considered**:
1. **Real-time aggregations on every request**
   - Rejected: Cannot meet ≤500ms SLA with JOIN-heavy queries across engagements + commitments + documents for 500 dossiers
   - Rejected: High database load (500 concurrent users × frequent stat queries)

2. **Redis-cached aggregations**
   - Rejected: Requires cache invalidation logic (complex for multi-entity updates)
   - Rejected: Cache warming strategy needed on cold starts
   - **Hybrid Approach Adopted**: Use Redis for hot-path caching of health scores (60-minute TTL), but materialized views as source of truth

3. **Application-level aggregation service**
   - Rejected: Duplicates PostgreSQL aggregation capabilities
   - Rejected: Adds deployment complexity (violates constitutional simplicity)

**Implementation Pattern**:
```sql
-- Materialized view refreshed every 15 minutes via pg_cron
CREATE MATERIALIZED VIEW dossier_engagement_stats AS
SELECT
  dossier_id,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '365 days') AS total_engagements_365d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days') AS recent_engagements_90d,
  MAX(created_at) AS latest_engagement_date,
  -- Normalized engagement frequency score (0-100 scale, 50 engagements/year = 100)
  LEAST(100, (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '365 days') * 2)) AS engagement_frequency_score
FROM engagements
GROUP BY dossier_id;

-- Concurrent refresh prevents read locks
REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_engagement_stats;
```

**Best Practices**:
- Use `CONCURRENTLY` option to avoid locking reads during refresh
- Create unique index on `dossier_id` to enable concurrent refresh: `CREATE UNIQUE INDEX ON dossier_engagement_stats (dossier_id);`
- Schedule refresh via `pg_cron` extension (every 15 minutes) or Supabase scheduled functions
- Monitor refresh duration with `pg_stat_statements` to ensure completion within 15-minute window

**Performance Validation**:
- Baseline: 500 dossiers × 50 engagements/year = 25,000 engagement records
- Expected refresh time: <10 seconds (well within 15-minute window)
- Query time: ~1ms (materialized view is pre-aggregated table)

---

### 2. Supabase Edge Functions vs. Database Functions for Health Calculation

**Decision**: Implement health score calculation in Supabase Edge Functions (TypeScript/Deno), NOT in PostgreSQL functions.

**Rationale**:
- **Type Safety**: TypeScript strict mode ensures formula implementation matches spec 009 exactly
- **Testability**: Vitest/Jest unit tests for formula logic (constitutional requirement: 80% coverage)
- **Maintainability**: JavaScript/TypeScript developers can modify formula without learning PL/pgSQL
- **Observability**: Structured logging in Edge Functions (constitutional requirement: structured JSON logs)
- **Constitutional Alignment**: Node.js + TypeScript is mandatory stack (Article II), PL/pgSQL is not

**Alternatives Considered**:
1. **PostgreSQL PL/pgSQL function**
   - Rejected: Limited type safety (no TypeScript)
   - Rejected: Harder to test (requires database connection)
   - Rejected: Team lacks PL/pgSQL expertise (maintenance risk)

2. **Backend service (Express.js)**
   - Rejected: Adds deployment step (Edge Functions are serverless)
   - Rejected: Requires health endpoint management
   - **Partial Use**: Backend service handles scheduled jobs (refresh-health-scores.job.ts) via Redis queue, but calls Edge Functions for actual calculation

**Implementation Pattern**:
```typescript
// supabase/functions/calculate-health-score/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface HealthScoreRequest {
  dossierId: string;
}

interface HealthScoreResponse {
  dossierId: string;
  overallScore: number;
  components: {
    engagementFrequency: number;
    commitmentFulfillment: number;
    recencyScore: number;
  };
  calculatedAt: string;
  sufficientData: boolean;
}

serve(async (req) => {
  const { dossierId } = await req.json() as HealthScoreRequest;

  // Fetch aggregations from materialized views
  const { data: engagementStats } = await supabase
    .from('dossier_engagement_stats')
    .select('*')
    .eq('dossier_id', dossierId)
    .single();

  const { data: commitmentStats } = await supabase
    .from('dossier_commitment_stats')
    .select('*')
    .eq('dossier_id', dossierId)
    .single();

  // Insufficient data check (spec requirement)
  if (engagementStats.total_engagements_365d < 3 || commitmentStats.total_commitments === 0) {
    return new Response(JSON.stringify({
      dossierId,
      overallScore: null,
      sufficientData: false
    }), { status: 200 });
  }

  // Spec 009 formula implementation
  const engagementFrequency = engagementStats.engagement_frequency_score; // 0-100
  const commitmentFulfillment = commitmentStats.fulfillment_rate; // 0-100
  const recencyScore = calculateRecencyScore(engagementStats.latest_engagement_date);

  const overallScore = Math.round(
    (engagementFrequency * 0.30) +
    (commitmentFulfillment * 0.40) +
    (recencyScore * 0.30)
  );

  // Store in health_scores table (cache)
  await supabase.from('health_scores').upsert({
    dossier_id: dossierId,
    overall_score: overallScore,
    engagement_frequency: engagementFrequency,
    commitment_fulfillment: commitmentFulfillment,
    recency_score: recencyScore,
    calculated_at: new Date().toISOString()
  });

  return new Response(JSON.stringify({
    dossierId,
    overallScore,
    components: { engagementFrequency, commitmentFulfillment, recencyScore },
    calculatedAt: new Date().toISOString(),
    sufficientData: true
  }), { status: 200 });
});

function calculateRecencyScore(latestEngagementDate: string): number {
  const daysSinceLastEngagement = Math.floor(
    (Date.now() - new Date(latestEngagementDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Spec 009 recency thresholds
  if (daysSinceLastEngagement <= 30) return 100;
  if (daysSinceLastEngagement <= 90) return 70;
  if (daysSinceLastEngagement <= 180) return 40;
  return 10;
}
```

**Best Practices**:
- Extract formula to separate utility function (`health-formula.util.ts`) for unit testing
- Validate input with TypeScript types (strict mode prevents undefined/null issues)
- Log calculation details for audit trail (constitutional requirement: audit logging)
- Use `upsert` to handle both new and updated health scores
- Set timeout to 400ms for fallback scenario (spec requirement)

---

### 3. Scheduled Job Architecture: pg_cron vs. Node.js Scheduler

**Decision**: Use **Node.js scheduled jobs (node-cron)** backed by Redis for orchestration, NOT pg_cron.

**Rationale**:
- **Flexibility**: Node.js jobs can call Supabase Edge Functions, send notifications, and perform complex orchestration
- **Observability**: Structured logging and error tracking in backend service (constitutional requirement)
- **Idempotency**: Redis-backed job locking prevents duplicate executions (critical for health score refresh)
- **Constitutional Compliance**: Node.js is mandatory backend stack (Article II)

**Alternatives Considered**:
1. **pg_cron extension**
   - Rejected: Limited to SQL queries (cannot call Edge Functions or send notifications)
   - Rejected: No structured logging (cannot meet observability requirements)
   - Rejected: Harder to test (requires database extension setup)

2. **Supabase Edge Functions with Deno.cron**
   - Considered: Edge Functions support scheduled execution
   - Rejected: Beta feature (stability concerns for 99.9% uptime requirement)
   - Rejected: Limited orchestration (cannot coordinate multi-step jobs)

**Implementation Pattern**:
```typescript
// backend/src/jobs/refresh-health-scores.job.ts
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
    console.log('Job already running, skipping');
    return;
  }

  try {
    console.log('[HEALTH-REFRESH] Starting materialized view refresh');

    // Refresh materialized views (engagement + commitment stats)
    await supabase.rpc('refresh_engagement_stats'); // Calls REFRESH MATERIALIZED VIEW
    await supabase.rpc('refresh_commitment_stats');

    console.log('[HEALTH-REFRESH] Materialized views refreshed');

    // Trigger health score recalculation for stale scores (>60 minutes old)
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
    // Alert operations team (constitutional requirement: alert on failures)
    // TODO: Integrate with monitoring platform (e.g., Sentry, Prometheus)
  } finally {
    await redis.del(lockKey);
  }
});
```

**Best Practices**:
- Use Redis SET with `NX` (not exists) flag for distributed locking
- Set lock expiration (900s = 15 minutes) to auto-release on job crash
- Log job start/end with structured JSON (constitutional requirement)
- Monitor job duration with Prometheus/Grafana (constitutional requirement: performance monitoring)
- Alert operations team on consecutive failures (>2 failures = critical alert)

---

### 4. Commitment Overdue Detection: Trigger vs. Scheduled Job

**Decision**: Use **database trigger** for immediate overdue detection + **scheduled job** for daily batch processing.

**Rationale**:
- **Hybrid Approach**: Trigger handles real-time updates when commitments are viewed/modified, scheduled job handles overnight batch processing
- **Performance**: Trigger prevents full table scans on every request, scheduled job ensures all commitments are checked daily
- **Constitutional Compliance**: Meets <2s page load requirement (trigger is instant) and 99.9% uptime (scheduled job provides redundancy)

**Alternatives Considered**:
1. **Trigger-only approach**
   - Rejected: Requires commitment to be accessed before overdue status updated (gaps possible)
   - Rejected: Missed commitments if no one views dossier

2. **Scheduled job-only approach**
   - Rejected: Overdue status may lag by up to 24 hours (violates 2-minute SLA for status changes)

**Implementation Pattern**:
```sql
-- Database trigger for immediate overdue detection (when commitment accessed)
CREATE OR REPLACE FUNCTION check_commitment_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
    NEW.status := 'overdue';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commitment_overdue_check
BEFORE UPDATE ON commitments
FOR EACH ROW
EXECUTE FUNCTION check_commitment_overdue();
```

```typescript
// Scheduled job for daily batch overdue detection (runs at 2:00 AM AST)
cron.schedule('0 2 * * *', async () => {
  const { data: overdueCommitments } = await supabase
    .from('commitments')
    .update({ status: 'overdue' })
    .lt('due_date', new Date().toISOString().split('T')[0])
    .in('status', ['pending', 'in_progress'])
    .select('id, dossier_id, owner_id, description, due_date');

  // Send notifications to owners (constitutional requirement: automated alerts)
  for (const commitment of overdueCommitments) {
    await sendOverdueNotification(commitment);
  }

  console.log(`[OVERDUE-CHECK] Marked ${overdueCommitments.length} commitments as overdue`);
});
```

**Best Practices**:
- Use `BEFORE UPDATE` trigger to modify status before save (prevents invalid state)
- Schedule job during off-peak hours (2:00 AM AST per constitutional maintenance window)
- Batch notifications to avoid overwhelming users (max 10 notifications per user per day)
- Log all status changes for audit trail (constitutional requirement)

---

### 5. TanStack Query Caching Strategy for Dashboard

**Decision**: Use TanStack Query with **stale-while-revalidate** pattern and 5-minute cache TTL for dashboard health charts.

**Rationale**:
- **Performance**: Dashboard loads instantly from cache, background refetch ensures fresh data
- **Constitutional Compliance**: Meets <2s page load requirement (cache hit = <100ms)
- **User Experience**: Users see cached data immediately, updated data appears seamlessly without loading spinners
- **Constitutional Alignment**: TanStack Query is mandatory frontend stack (Article II)

**Alternatives Considered**:
1. **No caching (always fetch fresh)**
   - Rejected: Cannot meet <2s page load for dashboard with 25+ dossier stats
   - Rejected: High database load (500 users × frequent dashboard visits)

2. **Long cache TTL (30+ minutes)**
   - Rejected: Users may see stale data (violates 60-minute staleness tolerance)
   - Rejected: Health score changes invisible until manual refresh

**Implementation Pattern**:
```typescript
// frontend/src/hooks/useDossierStats.ts
import { useQuery } from '@tanstack/react-query';
import { dossierStatsService } from '@/services/dossier-stats.service';

export function useDossierStats(dossierId: string) {
  return useQuery({
    queryKey: ['dossierStats', dossierId],
    queryFn: () => dossierStatsService.getStats(dossierId),
    staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
    gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
  });
}

// Bulk stats query for dashboard
export function useBulkDossierStats(dossierIds: string[]) {
  return useQuery({
    queryKey: ['bulkDossierStats', dossierIds],
    queryFn: () => dossierStatsService.getBulkStats(dossierIds),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: dossierIds.length > 0, // Only fetch if dossiers exist
  });
}
```

**Best Practices**:
- Use `staleTime` to control when data is considered stale (5 minutes balances freshness vs. performance)
- Use `gcTime` (formerly `cacheTime`) to control when unused cache is garbage collected
- Enable `refetchOnWindowFocus` to update data when user returns (catches background changes)
- Use background `refetchInterval` for live dashboards (dashboard stays updated without user action)
- Disable queries with `enabled: false` when dependencies not ready (prevents unnecessary fetches)

---

### 6. Health Score Cache Table Design

**Decision**: Create dedicated `health_scores` table with timestamp tracking for cache management.

**Rationale**:
- **Performance**: Fast lookups via indexed `dossier_id` column (O(log n) vs. O(n) for materialized view refresh)
- **Observability**: Track calculation timestamps for staleness detection (constitutional requirement: data freshness indicators)
- **Flexibility**: Store component breakdown (engagement, commitment, recency) for tooltip displays

**Schema Design**:
```sql
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  engagement_frequency INTEGER NOT NULL CHECK (engagement_frequency >= 0 AND engagement_frequency <= 100),
  commitment_fulfillment INTEGER NOT NULL CHECK (commitment_fulfillment >= 0 AND commitment_fulfillment <= 100),
  recency_score INTEGER NOT NULL CHECK (recency_score IN (10, 40, 70, 100)),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dossier_id)
);

CREATE INDEX idx_health_scores_dossier ON health_scores(dossier_id);
CREATE INDEX idx_health_scores_calculated_at ON health_scores(calculated_at); -- For staleness queries

-- Row-Level Security (constitutional requirement)
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY health_scores_read ON health_scores
FOR SELECT USING (auth.uid() IS NOT NULL); -- All authenticated users can read
```

**Best Practices**:
- Use CHECK constraints to enforce score ranges (prevents invalid data)
- Use UNIQUE constraint on `dossier_id` to ensure one score per dossier
- Create index on `calculated_at` for efficient staleness queries
- Enable RLS for constitutional compliance (data protection)
- Use `ON DELETE CASCADE` to clean up scores when dossier deleted (prevents orphaned data)

---

## Technology Stack Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Database Aggregations** | PostgreSQL Materialized Views | Native support, concurrent refresh, proven pattern for analytics |
| **Health Calculation** | Supabase Edge Functions (TypeScript/Deno) | Type safety, testability, constitutional compliance |
| **Scheduled Jobs** | Node.js (node-cron) + Redis | Flexibility, observability, distributed locking |
| **Overdue Detection** | Database Trigger + Scheduled Job | Real-time + batch coverage, performance balance |
| **Frontend Caching** | TanStack Query (stale-while-revalidate) | Constitutional compliance, performance, UX |
| **Cache Storage** | Dedicated `health_scores` table | Fast lookups, observability, flexibility |

---

## Performance Benchmarks

| Metric | Target | Strategy |
|--------|--------|----------|
| Dossier Stats Query | ≤500ms p95 | Materialized views + indexed cache table |
| Health Score Calculation | ≤400ms timeout | Edge Function with optimized queries |
| Bulk Stats Query (25 dossiers) | ≤1s | Batched Edge Function call + `WHERE IN` query |
| Dashboard Load | <2s | TanStack Query cache (5-minute stale time) |
| Materialized View Refresh | <10s (500 dossiers) | Concurrent refresh + unique index |
| Commitment Overdue Check | <100ms | Database trigger (instant) + nightly batch |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Materialized view refresh failure** | Fallback to on-demand calculation (400ms timeout) + operations alert after 2 consecutive failures |
| **Health score calculation timeout** | Edge Function timeout (400ms) → return null with "Insufficient Data" flag |
| **Scheduled job failure** | Redis distributed locking prevents duplicate runs + retry logic with exponential backoff |
| **Cache staleness** | TanStack Query background refetch + scheduled job recalculates stale scores (>60 minutes old) |
| **Database load spike** | Materialized views reduce query complexity + indexed cache table for fast lookups |
| **Commitment overdue lag** | Hybrid trigger + scheduled job ensures 24-hour maximum lag |

---

## Constitutional Compliance Verification

| Article | Requirement | Compliance |
|---------|-------------|-----------|
| **II: Architectural Standards** | Mandatory tech stack (React, TypeScript, Supabase, PostgreSQL, Redis, Node.js) | ✅ All decisions use constitutional stack |
| **IV: Performance Standards** | <2s page load, <500ms simple queries | ✅ Materialized views + cache achieve targets |
| **V: Security & Compliance** | RLS, encryption, audit logging | ✅ RLS enabled on health_scores, logs capture calculations |
| **VI: Quality Assurance** | 80% code coverage, E2E tests | ✅ Vitest/Jest for formula, Playwright for E2E |
| **X: Development Standards** | TypeScript strict mode, pnpm, conventional commits | ✅ All code follows standards |

---

## Next Steps

1. **Phase 1: Design** - Generate data-model.md, API contracts, quickstart.md
2. **Phase 2: Tasks** - Break down implementation into actionable tasks via `/speckit.tasks`
3. **Implementation** - Execute tasks with TDD approach (tests first, then code)

---

## References

- [PostgreSQL Materialized Views Documentation](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [TanStack Query Caching Guide](https://tanstack.com/query/latest/docs/framework/react/guides/caching)
- [node-cron Documentation](https://github.com/node-cron/node-cron)
- [Redis Distributed Locking Pattern](https://redis.io/docs/manual/patterns/distributed-locks/)
- Spec 009: Dossiers Hub (relationship health formula)
- Spec 010: After-Action Notes (commitment data structure)
