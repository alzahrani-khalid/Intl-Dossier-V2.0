# Data Model: Relationship Health & Commitment Intelligence

**Feature**: 030-health-commitment
**Date**: 2025-11-15
**Phase**: 1 - Data Model Design

## Overview

This document defines the data model for relationship health scoring and commitment tracking aggregations. All entities align with existing dossier schema and extend it with new tables for caching aggregations and storing calculated health scores.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING ENTITIES                         │
│  (from existing dossier schema - NOT modified)               │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   dossiers   │◄────────│  engagements │         │  documents   │
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ name         │         │ dossier_id   │────────►│ dossier_id   │
│ type         │         │ created_at   │         │ created_at   │
│ region       │         │ description  │         │ type         │
│ ...          │         │ ...          │         │ ...          │
└──────────────┘         └──────────────┘         └──────────────┘
      ▲
      │
      │
┌──────────────┐
│ commitments  │
│              │
│ id (PK)      │
│ dossier_id   │──────────────────────────────────────────┘
│ description  │
│ status       │  Possible values: pending, in_progress,
│ due_date     │                    completed, cancelled, overdue
│ owner_id     │
│ priority     │
│ created_at   │
│ ...          │
└──────────────┘


┌─────────────────────────────────────────────────────────────┐
│                      NEW ENTITIES                            │
│  (created by this feature)                                   │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────┐       ┌────────────────────────┐
│ dossier_engagement_    │       │ dossier_commitment_    │
│        _stats          │       │        _stats          │
│ (MATERIALIZED VIEW)    │       │ (MATERIALIZED VIEW)    │
│                        │       │                        │
│ dossier_id (PK)        │       │ dossier_id (PK)        │
│ total_engagements_365d │       │ total_commitments      │
│ recent_engagements_90d │       │ active_commitments     │
│ latest_engagement_date │       │ overdue_commitments    │
│ engagement_frequency_  │       │ fulfilled_commitments  │
│   _score (0-100)       │       │ upcoming_commitments   │
└────────────────────────┘       │ fulfillment_rate       │
                                 └────────────────────────┘
         │                                    │
         │                                    │
         └────────────┬───────────────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  health_scores   │
           │                  │
           │ id (PK)          │
           │ dossier_id (FK)  │───────► dossiers.id
           │ overall_score    │  0-100
           │ engagement_      │  0-100 (component)
           │   _frequency     │
           │ commitment_      │  0-100 (component)
           │   _fulfillment   │
           │ recency_score    │  10/40/70/100 (component)
           │ calculated_at    │  Timestamp
           │ created_at       │
           │ updated_at       │
           └──────────────────┘
```

---

## New Entities

### 1. `dossier_engagement_stats` (Materialized View)

**Purpose**: Pre-compute engagement aggregations per dossier to enable fast stats queries.

**Refresh Strategy**: Refreshed every 15 minutes via scheduled job (node-cron) calling `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

**Schema**:
```sql
CREATE MATERIALIZED VIEW dossier_engagement_stats AS
SELECT
  e.dossier_id,
  -- Total engagements in last 365 days
  COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '365 days') AS total_engagements_365d,
  -- Recent engagements in last 90 days
  COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '90 days') AS recent_engagements_90d,
  -- Latest engagement date for recency calculation
  MAX(e.created_at) AS latest_engagement_date,
  -- Normalized engagement frequency score (0-100 scale)
  -- Formula: 50 engagements/year = 100 points, linear scaling
  LEAST(100, (COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '365 days')::numeric * 2)::integer) AS engagement_frequency_score
FROM engagements e
GROUP BY e.dossier_id;

-- Unique index required for CONCURRENTLY option
CREATE UNIQUE INDEX idx_dossier_engagement_stats_dossier_id
ON dossier_engagement_stats(dossier_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `dossier_id` | UUID | PRIMARY KEY, NOT NULL | References dossiers.id (implicit in GROUP BY) |
| `total_engagements_365d` | INTEGER | NOT NULL, >= 0 | Count of engagements in last 365 days |
| `recent_engagements_90d` | INTEGER | NOT NULL, >= 0 | Count of engagements in last 90 days (for stats display) |
| `latest_engagement_date` | TIMESTAMPTZ | NULL allowed | Most recent engagement timestamp (NULL if no engagements) |
| `engagement_frequency_score` | INTEGER | NOT NULL, CHECK (0-100) | Normalized score: 0-100 scale (50 engagements/year = 100) |

**Indexes**:
- UNIQUE INDEX on `dossier_id` (required for concurrent refresh)

**Validation Rules**:
- `total_engagements_365d` >= `recent_engagements_90d` (90 days is subset of 365 days)
- `engagement_frequency_score` must be in range [0, 100]

**State Transitions**: N/A (materialized view, no state)

**Performance Notes**:
- Expected refresh time: ~10 seconds for 500 dossiers with 25,000 engagement records
- Query time: ~1ms (pre-aggregated data)

---

### 2. `dossier_commitment_stats` (Materialized View)

**Purpose**: Pre-compute commitment aggregations per dossier to enable fast stats queries and health score calculation.

**Refresh Strategy**: Refreshed every 15 minutes via scheduled job (node-cron) calling `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

**Schema**:
```sql
CREATE MATERIALIZED VIEW dossier_commitment_stats AS
SELECT
  c.dossier_id,
  -- Total commitments (excluding cancelled)
  COUNT(*) FILTER (WHERE c.status != 'cancelled') AS total_commitments,
  -- Active commitments (pending or in_progress)
  COUNT(*) FILTER (WHERE c.status IN ('pending', 'in_progress')) AS active_commitments,
  -- Overdue commitments (past due date and not completed/cancelled)
  COUNT(*) FILTER (WHERE c.due_date < CURRENT_DATE AND c.status NOT IN ('completed', 'cancelled')) AS overdue_commitments,
  -- Fulfilled commitments (completed status)
  COUNT(*) FILTER (WHERE c.status = 'completed') AS fulfilled_commitments,
  -- Upcoming commitments (due within 30 days and not completed/cancelled)
  COUNT(*) FILTER (
    WHERE c.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND c.status NOT IN ('completed', 'cancelled')
  ) AS upcoming_commitments,
  -- Fulfillment rate (0-100 scale)
  -- Formula: (fulfilled / total non-cancelled) * 100
  -- Edge case: If no commitments, default to 100% (spec requirement)
  CASE
    WHEN COUNT(*) FILTER (WHERE c.status != 'cancelled') = 0 THEN 100
    ELSE (
      COUNT(*) FILTER (WHERE c.status = 'completed')::numeric /
      COUNT(*) FILTER (WHERE c.status != 'cancelled')::numeric * 100
    )::integer
  END AS fulfillment_rate
FROM commitments c
GROUP BY c.dossier_id;

-- Unique index required for CONCURRENTLY option
CREATE UNIQUE INDEX idx_dossier_commitment_stats_dossier_id
ON dossier_commitment_stats(dossier_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `dossier_id` | UUID | PRIMARY KEY, NOT NULL | References dossiers.id (implicit in GROUP BY) |
| `total_commitments` | INTEGER | NOT NULL, >= 0 | Count of non-cancelled commitments |
| `active_commitments` | INTEGER | NOT NULL, >= 0 | Count of pending or in_progress commitments |
| `overdue_commitments` | INTEGER | NOT NULL, >= 0 | Count of commitments past due date and not completed/cancelled |
| `fulfilled_commitments` | INTEGER | NOT NULL, >= 0 | Count of completed commitments |
| `upcoming_commitments` | INTEGER | NOT NULL, >= 0 | Count of commitments due within 30 days (not completed/cancelled) |
| `fulfillment_rate` | INTEGER | NOT NULL, CHECK (0-100) | Percentage of completed commitments (100 if no commitments) |

**Indexes**:
- UNIQUE INDEX on `dossier_id` (required for concurrent refresh)

**Validation Rules**:
- `total_commitments` >= `fulfilled_commitments` (fulfilled is subset of total)
- `total_commitments` >= `active_commitments` (active is subset of total)
- `total_commitments` >= `overdue_commitments` (overdue is subset of total)
- `fulfillment_rate` must be in range [0, 100]

**Edge Cases**:
- Dossier with no commitments: `fulfillment_rate` defaults to 100 (spec requirement FR-005)
- Cancelled commitments: Excluded from all counts except `overdue_commitments` where they're excluded from numerator (spec requirement)

**State Transitions**: N/A (materialized view, no state)

**Performance Notes**:
- Expected refresh time: ~5 seconds for 500 dossiers with 5,000 commitment records
- Query time: ~1ms (pre-aggregated data)

---

### 3. `health_scores` (Table)

**Purpose**: Cache calculated health scores to enable fast queries and track staleness.

**Schema**:
```sql
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL UNIQUE REFERENCES dossiers(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  engagement_frequency INTEGER NOT NULL CHECK (engagement_frequency >= 0 AND engagement_frequency <= 100),
  commitment_fulfillment INTEGER NOT NULL CHECK (commitment_fulfillment >= 0 AND commitment_fulfillment <= 100),
  recency_score INTEGER NOT NULL CHECK (recency_score IN (10, 40, 70, 100)),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_scores_dossier_id ON health_scores(dossier_id);
CREATE INDEX idx_health_scores_calculated_at ON health_scores(calculated_at);
CREATE INDEX idx_health_scores_overall_score ON health_scores(overall_score); -- For dashboard filtering

-- Row-Level Security (constitutional requirement)
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY health_scores_read ON health_scores
FOR SELECT USING (auth.uid() IS NOT NULL); -- All authenticated users can read

CREATE POLICY health_scores_write ON health_scores
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role'); -- Only service role can write
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `dossier_id` | UUID | UNIQUE, NOT NULL, FK → dossiers(id) | One health score per dossier |
| `overall_score` | INTEGER | NULL allowed, CHECK (0-100) | Composite health score (NULL if insufficient data) |
| `engagement_frequency` | INTEGER | NOT NULL, CHECK (0-100) | Engagement frequency component (0-100 scale) |
| `commitment_fulfillment` | INTEGER | NOT NULL, CHECK (0-100) | Commitment fulfillment rate component (0-100 scale) |
| `recency_score` | INTEGER | NOT NULL, CHECK (IN 10,40,70,100) | Recency component (spec 009 thresholds) |
| `calculated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When health score was last calculated |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When record was first created |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When record was last updated (trigger managed) |

**Indexes**:
- PRIMARY KEY on `id` (auto-created)
- UNIQUE INDEX on `dossier_id` (ensures one score per dossier)
- INDEX on `calculated_at` (for staleness queries: `WHERE calculated_at < NOW() - INTERVAL '60 minutes'`)
- INDEX on `overall_score` (for dashboard filtering: "show dossiers with health < 60")

**Validation Rules**:
- `overall_score` is NULL if insufficient data (< 3 engagements or 0 commitments)
- `overall_score` = ROUND((engagement_frequency * 0.30) + (commitment_fulfillment * 0.40) + (recency_score * 0.30)) when sufficient data
- `recency_score` must be exactly 10, 40, 70, or 100 (spec 009 thresholds)
- `calculated_at` <= NOW() (cannot be in future)

**State Transitions**:
```
[No record] ──(calculate)──► [New record: overall_score = X, calculated_at = NOW()]
                                      │
                                      │ (recalculate after 60+ minutes)
                                      ▼
                            [Updated record: overall_score = Y, calculated_at = NOW()]
                                      │
                                      │ (dossier deleted)
                                      ▼
                                  [Deleted via CASCADE]
```

**Triggers**:
```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_scores_updated_at
BEFORE UPDATE ON health_scores
FOR EACH ROW
EXECUTE FUNCTION update_health_scores_updated_at();
```

**Performance Notes**:
- Indexed lookups: ~1ms for single dossier query
- Staleness query: ~10ms for 500 dossiers (indexed on `calculated_at`)
- Dashboard filter query: ~15ms for 500 dossiers (indexed on `overall_score`)

---

## Modified Entities

### 1. `commitments` Table (Existing - Minor Modification)

**Modification**: Add database trigger to auto-mark commitments as "overdue" when accessed.

**Schema** (unchanged - only trigger added):
```sql
-- Existing columns (no schema changes)
-- id, dossier_id, description, status, due_date, owner_id, priority, created_at, updated_at

-- NEW TRIGGER: Auto-update status to 'overdue' if past due date
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

**Impact**: Minimal (trigger only fires on UPDATE, not on SELECT or INSERT)

**Migration Strategy**: Add trigger in new migration file, no data migration required.

---

## Database Functions

### 1. `refresh_engagement_stats()` - Refresh Materialized View

**Purpose**: Wrapper function to refresh `dossier_engagement_stats` materialized view with concurrent mode.

**Schema**:
```sql
CREATE OR REPLACE FUNCTION refresh_engagement_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_engagement_stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_engagement_stats() TO authenticated;
```

**Called by**: Scheduled job (backend/src/jobs/refresh-health-scores.job.ts)

**Performance**: ~10 seconds for 500 dossiers (25,000 engagements)

---

### 2. `refresh_commitment_stats()` - Refresh Materialized View

**Purpose**: Wrapper function to refresh `dossier_commitment_stats` materialized view with concurrent mode.

**Schema**:
```sql
CREATE OR REPLACE FUNCTION refresh_commitment_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_commitment_stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_commitment_stats() TO authenticated;
```

**Called by**: Scheduled job (backend/src/jobs/refresh-health-scores.job.ts)

**Performance**: ~5 seconds for 500 dossiers (5,000 commitments)

---

## Data Migration Strategy

### Phase 1: Create New Tables (Safe - No Downtime)

```sql
-- Migration: [timestamp]_create_health_scores_table.sql
CREATE TABLE health_scores (...); -- Full schema above
CREATE INDEX idx_health_scores_dossier_id ON health_scores(dossier_id);
CREATE INDEX idx_health_scores_calculated_at ON health_scores(calculated_at);
CREATE INDEX idx_health_scores_overall_score ON health_scores(overall_score);
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_scores_read ON health_scores FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY health_scores_write ON health_scores FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### Phase 2: Create Materialized Views (Safe - No Downtime)

```sql
-- Migration: [timestamp]_create_engagement_stats_view.sql
CREATE MATERIALIZED VIEW dossier_engagement_stats AS (...); -- Full schema above
CREATE UNIQUE INDEX idx_dossier_engagement_stats_dossier_id ON dossier_engagement_stats(dossier_id);

-- Migration: [timestamp]_create_commitment_stats_view.sql
CREATE MATERIALIZED VIEW dossier_commitment_stats AS (...); -- Full schema above
CREATE UNIQUE INDEX idx_dossier_commitment_stats_dossier_id ON dossier_commitment_stats(dossier_id);
```

### Phase 3: Create Database Functions (Safe - No Downtime)

```sql
-- Migration: [timestamp]_create_refresh_functions.sql
CREATE OR REPLACE FUNCTION refresh_engagement_stats() RETURNS void (...);
CREATE OR REPLACE FUNCTION refresh_commitment_stats() RETURNS void (...);
GRANT EXECUTE ON FUNCTION refresh_engagement_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_commitment_stats() TO authenticated;
```

### Phase 4: Add Commitment Trigger (Safe - Minimal Impact)

```sql
-- Migration: [timestamp]_add_commitment_overdue_trigger.sql
CREATE OR REPLACE FUNCTION check_commitment_overdue() RETURNS TRIGGER (...);
CREATE TRIGGER commitment_overdue_check BEFORE UPDATE ON commitments FOR EACH ROW EXECUTE FUNCTION check_commitment_overdue();
```

### Phase 5: Initial Data Load (One-Time - Off-Peak Hours)

```sql
-- Run via Supabase SQL Editor during maintenance window (2:00 AM AST)
REFRESH MATERIALIZED VIEW dossier_engagement_stats;
REFRESH MATERIALIZED VIEW dossier_commitment_stats;

-- Populate health_scores for all dossiers with sufficient data
-- (Handled by Edge Function via bulk calculation endpoint)
```

---

## Rollback Strategy

### Rollback Order (Reverse of Migration Order)

1. Drop commitment trigger: `DROP TRIGGER commitment_overdue_check ON commitments;`
2. Drop database functions: `DROP FUNCTION refresh_engagement_stats(); DROP FUNCTION refresh_commitment_stats();`
3. Drop materialized views: `DROP MATERIALIZED VIEW dossier_commitment_stats; DROP MATERIALIZED VIEW dossier_engagement_stats;`
4. Drop health_scores table: `DROP TABLE health_scores;` (CASCADE deletes RLS policies and indexes)

**Data Loss**: `health_scores` table data is lost on rollback (acceptable - cache can be regenerated)

**Zero Downtime**: All drops are non-blocking (no FK dependencies from existing tables)

---

## Testing Data Requirements

### Minimum Test Data for E2E Tests

| Entity | Count | Notes |
|--------|-------|-------|
| Dossiers | 10 | Mix of countries, organizations, forums |
| Engagements | 200 | 20 per dossier, distributed across 12 months |
| Commitments | 50 | 5 per dossier, mix of statuses (pending, in_progress, completed, overdue, cancelled) |
| Health Scores | 10 | Pre-calculated for all dossiers (some with insufficient data) |

### Test Scenarios

1. **Sufficient Data**: Dossier with 10 engagements (last 365d), 5 commitments (3 completed, 1 active, 1 overdue)
   - Expected: `overall_score` = calculated value, all components populated

2. **Insufficient Data (< 3 engagements)**: Dossier with 2 engagements, 5 commitments
   - Expected: `overall_score` = NULL, `sufficientData` = false

3. **No Commitments**: Dossier with 10 engagements, 0 commitments
   - Expected: `commitment_fulfillment` = 100 (default), `overall_score` calculated

4. **All Commitments Cancelled**: Dossier with 5 cancelled commitments
   - Expected: Excluded from fulfillment rate calculation

5. **Stale Health Score**: Dossier with `calculated_at` > 60 minutes old
   - Expected: Scheduled job triggers recalculation

---

## Performance Benchmarks

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Materialized View Refresh (engagement_stats) | ~10s | 500 dossiers, 25,000 engagements |
| Materialized View Refresh (commitment_stats) | ~5s | 500 dossiers, 5,000 commitments |
| Health Score Calculation (single dossier) | ~50ms | Edge Function query time |
| Health Score Lookup (cached) | ~1ms | Indexed query on health_scores table |
| Staleness Query (find stale scores) | ~10ms | Indexed query on calculated_at |
| Dashboard Filter Query (health < 60) | ~15ms | Indexed query on overall_score |

---

## Data Retention

| Entity | Retention Policy | Rationale |
|--------|-----------------|-----------|
| `health_scores` | Permanent (cascade deleted with dossier) | Cache regenerated on demand, no historical tracking required |
| `dossier_engagement_stats` | Refreshed every 15 minutes | Materialized view, no retention concept |
| `dossier_commitment_stats` | Refreshed every 15 minutes | Materialized view, no retention concept |

**Historical Health Scores**: Out of scope for this feature (spec requirement). Future enhancement may add `health_score_history` table for trend analysis.

---

## Security & Compliance

### Row-Level Security (RLS)

| Table | Policy | Rule |
|-------|--------|------|
| `health_scores` | `health_scores_read` | All authenticated users can read (`auth.uid() IS NOT NULL`) |
| `health_scores` | `health_scores_write` | Only service role can write (`auth.jwt() ->> 'role' = 'service_role'`) |

**Constitutional Compliance**: Article V: Security & Compliance (5.1: Role-Based Access Control)

### Audit Logging

All health score calculations logged via Edge Function structured logs:
```json
{
  "timestamp": "2025-11-15T14:30:00Z",
  "level": "INFO",
  "message": "Health score calculated",
  "dossierId": "uuid-here",
  "overallScore": 78,
  "components": {
    "engagementFrequency": 80,
    "commitmentFulfillment": 75,
    "recencyScore": 70
  },
  "calculationTimeMs": 45
}
```

**Constitutional Compliance**: Article V: Security & Compliance (5.3: Audit Logging)

---

## Next Steps

1. **Generate API Contracts** - Define OpenAPI specifications for dossier stats and health score endpoints
2. **Generate Quickstart Guide** - Developer setup instructions for local testing
3. **Update Agent Context** - Add new technologies to agent-specific context file
4. **Re-evaluate Constitution Check** - Verify all design decisions align with constitutional requirements
