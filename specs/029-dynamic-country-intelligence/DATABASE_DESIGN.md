# Dynamic Country Intelligence System - Database Design

**Feature**: 029-dynamic-country-intelligence
**Date**: 2025-01-30
**Status**: Ready for Implementation

## Overview

This document details the database schema extensions for the Dynamic Country Intelligence System. The design extends the existing `intelligence_reports` table while maintaining full backwards compatibility with existing data and queries.

## Design Principles

1. **Backwards Compatibility**: All new columns are nullable or have defaults to prevent breaking existing code
2. **Performance**: Comprehensive indexing strategy for common query patterns
3. **Type Safety**: Strong typing with CHECK constraints and foreign keys
4. **Audit Trail**: Complete tracking of refresh operations and versioning
5. **Flexibility**: JSONB columns for extensible metadata storage
6. **Security**: RLS policies based on entity clearance levels

## Schema Extensions

### Core Entity Linking

#### New Columns

```sql
entity_id UUID REFERENCES dossiers(id) ON DELETE CASCADE
entity_type TEXT CHECK (entity_type IN ('country', 'organization', 'forum', 'topic', 'working_group'))
```

**Design Decision**: Use polymorphic linking to dossiers table rather than separate foreign keys for each entity type.

**Rationale**:
- Single source of truth for all dossier entities
- Simplifies queries and join operations
- Easier to maintain RLS policies
- Future-proof for new dossier types
- Existing `dossier_id` column preserved for backwards compatibility

**Trade-offs**:
- Cannot use database-level foreign key constraints for entity_type validation
- Application layer must ensure entity_type matches dossier.type
- Slightly more complex queries requiring entity_type filtering

**Constraint Added**:
```sql
CHECK (
  (entity_id IS NULL AND entity_type IS NULL) OR
  (entity_id IS NOT NULL AND entity_type IS NOT NULL)
)
```
Ensures both fields are always set together or both NULL.

### Intelligence Type Classification

#### New Column

```sql
intelligence_type TEXT NOT NULL DEFAULT 'general'
  CHECK (intelligence_type IN ('economic', 'political', 'security', 'bilateral', 'general'))
```

**Design Decision**: Use ENUM-like TEXT column with CHECK constraint rather than separate PostgreSQL ENUM type.

**Rationale**:
- Easier to modify values without ALTER TYPE migrations
- Better compatibility with ORMs and TypeScript code generation
- CHECK constraint provides same validation as ENUM
- Default value 'general' for backwards compatibility
- Aligns with FR-002 requirements

**Intelligence Type Categories**:

| Type | TTL | Description | Use Case |
|------|-----|-------------|----------|
| `economic` | 24h | GDP, inflation, trade balance, economic indicators | Economic analysis sections |
| `political` | 6h | Political events, leadership changes, diplomatic developments | Fast-moving political context |
| `security` | 12h | Threat assessments, travel advisories, risk levels | Security briefings |
| `bilateral` | 48h | Relationship strength, partnership analysis | Diplomatic relations |
| `general` | 24h | Catch-all for other intelligence | Default category |

**Index Strategy**:
```sql
-- Single type lookup
CREATE INDEX idx_intelligence_reports_intelligence_type
  ON intelligence_reports(intelligence_type);

-- Entity + type (most common query)
CREATE INDEX idx_intelligence_reports_entity_type
  ON intelligence_reports(entity_id, intelligence_type)
  WHERE entity_id IS NOT NULL;
```

### Cache Management System

#### New Columns

```sql
cache_expires_at TIMESTAMPTZ              -- TTL expiration timestamp
cache_created_at TIMESTAMPTZ DEFAULT NOW() -- When cache was first created
last_refreshed_at TIMESTAMPTZ DEFAULT NOW() -- Last successful refresh
refresh_status TEXT NOT NULL DEFAULT 'fresh'
  CHECK (refresh_status IN ('fresh', 'stale', 'refreshing', 'error', 'expired'))
```

**Design Decision**: Use timestamp-based TTL with status enum rather than TTL duration column.

**Rationale**:
- Direct timestamp comparison is faster than calculating TTL + created_at
- Simplifies queries: `WHERE cache_expires_at < NOW()`
- Status enum provides clear state machine for refresh lifecycle
- Separate `cache_created_at` and `last_refreshed_at` for analytics

**Refresh Status State Machine**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  INSERT → fresh                                                   │
│     │                                                             │
│     ├─→ Time passes beyond TTL → stale                          │
│     │      │                                                     │
│     │      ├─→ User clicks refresh → refreshing                 │
│     │      │      │                                              │
│     │      │      ├─→ Success → fresh (new cache_expires_at)   │
│     │      │      └─→ Failure → error                           │
│     │      │                                                     │
│     │      └─→ Too old without refresh → expired                │
│     │                                                            │
│     └─→ Manual refresh → refreshing → fresh/error               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**TTL Function**:

```sql
CREATE OR REPLACE FUNCTION get_intelligence_ttl_hours(intel_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE intel_type
    WHEN 'economic' THEN 24
    WHEN 'political' THEN 6
    WHEN 'security' THEN 12
    WHEN 'bilateral' THEN 48
    WHEN 'general' THEN 24
    ELSE 24
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Design Decision**: Hardcode TTL values in function rather than config table.

**Rationale**:
- Simpler implementation (no joins required)
- TTL values rarely change
- Function is IMMUTABLE for query optimization
- Can be overridden per-report if needed
- Easy to update via migration if values change

**Automatic Cache Expiry Trigger**:

```sql
CREATE TRIGGER trigger_set_intelligence_cache_expiry
  BEFORE INSERT OR UPDATE ON intelligence_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_intelligence_cache_expiry();
```

This trigger automatically sets `cache_expires_at` based on intelligence type TTL.

**Index Strategy**:

```sql
-- Find expired cache
CREATE INDEX idx_intelligence_reports_cache_expires
  ON intelligence_reports(cache_expires_at)
  WHERE cache_expires_at IS NOT NULL AND refresh_status != 'expired';

-- Find stale cache needing refresh
CREATE INDEX idx_intelligence_reports_stale
  ON intelligence_reports(entity_id, intelligence_type, cache_expires_at)
  WHERE cache_expires_at < NOW() OR refresh_status IN ('stale', 'error', 'expired');

-- Most common query: entity + type + fresh
CREATE INDEX idx_intelligence_reports_entity_type_fresh
  ON intelligence_reports(entity_id, intelligence_type, refresh_status, last_refreshed_at DESC)
  WHERE entity_id IS NOT NULL AND refresh_status = 'fresh';
```

### Data Source Tracking

#### New Column

```sql
data_sources_metadata JSONB DEFAULT '[]'
```

**Design Decision**: Use JSONB array instead of separate data_sources table.

**Rationale**:
- Flexible schema for different source types
- Efficient GIN indexing for queries
- Easier to query all sources for a report atomically
- Avoids N+1 query problem
- Legacy `data_sources TEXT[]` column preserved for backwards compatibility

**Structure**:

```json
[
  {
    "source": "world_bank_api",
    "endpoint": "/v2/country/SAU/indicator/NY.GDP.MKTP.CD",
    "retrieved_at": "2025-01-30T10:00:00Z",
    "confidence": 95,
    "metadata": {
      "api_version": "v2",
      "rate_limit_remaining": 4500
    }
  },
  {
    "source": "anythingllm",
    "endpoint": "workspace://country-saudi-arabia",
    "retrieved_at": "2025-01-30T10:00:05Z",
    "confidence": 87,
    "metadata": {
      "model": "gpt-4",
      "tokens_used": 1250,
      "sources_cited": ["doc-123", "doc-456"]
    }
  },
  {
    "source": "manual_entry",
    "retrieved_at": "2025-01-30T09:45:00Z",
    "confidence": 100,
    "metadata": {
      "entered_by": "analyst@example.com",
      "verified": true
    }
  }
]
```

**Index**:

```sql
CREATE INDEX idx_intelligence_reports_data_sources_metadata
  ON intelligence_reports USING GIN(data_sources_metadata);
```

**Query Examples**:

```sql
-- Find reports using World Bank API
SELECT * FROM intelligence_reports
WHERE data_sources_metadata @> '[{"source": "world_bank_api"}]';

-- Find reports with high confidence from AnythingLLM
SELECT * FROM intelligence_reports
WHERE data_sources_metadata @> '[{"source": "anythingllm"}]'
  AND (data_sources_metadata->0->>'confidence')::int > 80;
```

### Versioning System

#### New Columns

```sql
version INTEGER NOT NULL DEFAULT 1
parent_version_id UUID REFERENCES intelligence_reports(id) ON DELETE SET NULL
version_notes TEXT
```

**Design Decision**: Use in-table versioning with parent reference rather than separate history table.

**Rationale**:
- Simpler schema (single table)
- Easier to query version history
- Self-referential foreign key enables version chains
- Old versions marked as `archived` in review_status
- Preserves all relationships and metadata

**Versioning Trigger** (disabled by default):

```sql
CREATE TRIGGER trigger_version_intelligence_report
  BEFORE UPDATE ON intelligence_reports
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
  EXECUTE FUNCTION version_intelligence_report();
```

**Design Decision**: Versioning trigger disabled by default.

**Rationale**:
- Cache refreshes update content frequently (don't need full history)
- Enable selectively for manually-edited reports
- Application can control versioning via explicit API
- Reduces storage overhead
- Can be enabled per-environment (production only)

**Version Chain Query**:

```sql
-- Get all versions of a report
WITH RECURSIVE version_chain AS (
  SELECT * FROM intelligence_reports WHERE id = 'current-id'
  UNION ALL
  SELECT ir.* FROM intelligence_reports ir
  JOIN version_chain vc ON ir.id = vc.parent_version_id
)
SELECT * FROM version_chain ORDER BY version DESC;
```

**Index**:

```sql
CREATE INDEX idx_intelligence_reports_version
  ON intelligence_reports(parent_version_id, version DESC)
  WHERE parent_version_id IS NOT NULL;
```

### AnythingLLM Integration

#### New Columns

```sql
anythingllm_workspace_id TEXT
anythingllm_query TEXT
anythingllm_response_metadata JSONB DEFAULT '{}'
```

**Design Decision**: Store AnythingLLM context inline rather than separate service layer.

**Rationale**:
- Audit trail for AI-generated intelligence
- Reproducibility (can re-run same query)
- Transparency (users see what query was used)
- Performance (no additional lookups)
- Debugging support

**Metadata Structure**:

```json
{
  "model": "gpt-4-turbo",
  "prompt_tokens": 850,
  "completion_tokens": 400,
  "total_tokens": 1250,
  "sources_cited": [
    "doc-economic-report-2024-q4.pdf",
    "doc-bilateral-agreement-2023.pdf"
  ],
  "confidence_score": 87,
  "response_time_ms": 3421,
  "temperature": 0.7
}
```

**Index**:

```sql
CREATE INDEX idx_intelligence_reports_workspace
  ON intelligence_reports(anythingllm_workspace_id)
  WHERE anythingllm_workspace_id IS NOT NULL;

CREATE INDEX idx_intelligence_reports_anythingllm_metadata
  ON intelligence_reports USING GIN(anythingllm_response_metadata);
```

**Query Examples**:

```sql
-- Find reports from specific workspace
SELECT * FROM intelligence_reports
WHERE anythingllm_workspace_id = 'workspace-saudi-arabia';

-- Find high-cost queries (>2000 tokens)
SELECT * FROM intelligence_reports
WHERE (anythingllm_response_metadata->>'total_tokens')::int > 2000
ORDER BY (anythingllm_response_metadata->>'total_tokens')::int DESC;
```

### Refresh Operation Tracking

#### New Columns

```sql
refresh_triggered_by UUID REFERENCES users(id) ON DELETE SET NULL
refresh_trigger_type TEXT CHECK (refresh_trigger_type IN ('manual', 'automatic', 'scheduled'))
refresh_duration_ms INTEGER CHECK (refresh_duration_ms >= 0)
refresh_error_message TEXT
```

**Design Decision**: Track refresh operations inline rather than separate audit table.

**Rationale**:
- All refresh metadata co-located with intelligence
- Simpler queries (no joins required)
- Direct access to last refresh status
- Audit trail preserved
- Separate audit_logs table can still log detailed events

**Index**:

```sql
CREATE INDEX idx_intelligence_reports_refresh_tracking
  ON intelligence_reports(refresh_triggered_by, refresh_trigger_type, last_refreshed_at DESC)
  WHERE refresh_triggered_by IS NOT NULL;
```

**Lock Function for Concurrent Refresh Prevention**:

```sql
CREATE OR REPLACE FUNCTION lock_intelligence_for_refresh(
  p_entity_id UUID,
  p_intelligence_type TEXT,
  p_user_id UUID,
  p_trigger_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  locked BOOLEAN;
BEGIN
  UPDATE intelligence_reports
  SET
    refresh_status = 'refreshing',
    refresh_triggered_by = p_user_id,
    refresh_trigger_type = p_trigger_type,
    last_refreshed_at = NOW()
  WHERE entity_id = p_entity_id
    AND intelligence_type = p_intelligence_type
    AND refresh_status != 'refreshing'
    AND archived_at IS NULL
  RETURNING TRUE INTO locked;

  RETURN COALESCE(locked, FALSE);
END;
$$ LANGUAGE plpgsql;
```

**Design Decision**: Use optimistic locking via status column rather than database locks.

**Rationale**:
- Non-blocking (doesn't hold database connections)
- Automatically released if process crashes
- Visible in application queries
- Simple to implement
- Handles distributed systems well
- Meets FR-019 requirement (prevent duplicate refreshes)

## Indexes and Performance

### Index Strategy Summary

**Total Indexes**: 15 new indexes added

**Categories**:

1. **Entity Linking** (2 indexes)
   - `idx_intelligence_reports_entity`
   - `idx_intelligence_reports_entity_type`

2. **Intelligence Type** (1 index)
   - `idx_intelligence_reports_intelligence_type`

3. **Cache Management** (4 indexes)
   - `idx_intelligence_reports_cache_expires`
   - `idx_intelligence_reports_refresh_status`
   - `idx_intelligence_reports_stale`
   - `idx_intelligence_reports_entity_type_fresh` (composite)

4. **Versioning** (1 index)
   - `idx_intelligence_reports_version`

5. **AnythingLLM** (2 indexes)
   - `idx_intelligence_reports_workspace`
   - `idx_intelligence_reports_anythingllm_metadata` (GIN)

6. **Data Sources** (1 index)
   - `idx_intelligence_reports_data_sources_metadata` (GIN)

7. **Refresh Tracking** (1 index)
   - `idx_intelligence_reports_refresh_tracking`

### Common Query Patterns and Index Usage

#### Pattern 1: Get latest intelligence for entity

```sql
SELECT * FROM intelligence_reports
WHERE entity_id = 'uuid-here'
  AND intelligence_type = 'economic'
  AND refresh_status = 'fresh'
ORDER BY last_refreshed_at DESC
LIMIT 1;
```

**Index Used**: `idx_intelligence_reports_entity_type_fresh`

#### Pattern 2: Find expired cache needing refresh

```sql
SELECT entity_id, intelligence_type
FROM intelligence_reports
WHERE cache_expires_at < NOW()
  AND refresh_status = 'fresh'
  AND archived_at IS NULL;
```

**Index Used**: `idx_intelligence_reports_cache_expires`

#### Pattern 3: Get all intelligence for entity (dashboard)

```sql
SELECT * FROM intelligence_reports
WHERE entity_id = 'uuid-here'
  AND archived_at IS NULL
ORDER BY intelligence_type, last_refreshed_at DESC;
```

**Index Used**: `idx_intelligence_reports_entity`

#### Pattern 4: Find reports by data source

```sql
SELECT * FROM intelligence_reports
WHERE data_sources_metadata @> '[{"source": "world_bank_api"}]'
  AND intelligence_type = 'economic';
```

**Index Used**: `idx_intelligence_reports_data_sources_metadata` (GIN)

### Performance Benchmarks (Expected)

| Query Pattern | Expected Response Time | Index Used |
|--------------|----------------------|------------|
| Get latest intelligence for entity + type | <10ms | Composite (entity_type_fresh) |
| Find expired cache | <50ms | Cache expires partial index |
| Dashboard: all types for entity | <20ms | Entity index |
| Search by data source | <100ms | GIN index |
| Version history lookup | <30ms | Version index |

## Row Level Security (RLS)

### Updated RLS Policies

#### View Policy

```sql
CREATE POLICY "view_intelligence_by_entity_clearance"
ON intelligence_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = intelligence_reports.entity_id
      AND get_user_clearance_level(auth.uid()) >=
        CASE d.sensitivity_level
          WHEN 'low' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'high' THEN 3
          ELSE 1
        END
  )
  OR entity_id IS NULL -- Backwards compatibility
);
```

**Design Decision**: Inherit security from linked dossier rather than separate clearance on intelligence.

**Rationale**:
- Single source of truth for access control
- Automatically inherits dossier sensitivity changes
- Simpler to reason about permissions
- Consistent with existing dossier RLS
- Backwards compatible (unlinked intelligence visible to all)

#### Insert Policy

```sql
CREATE POLICY "insert_intelligence_authenticated"
ON intelligence_reports FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
  AND created_by = auth.uid()
  AND analyst_id = auth.uid()
);
```

**Design Decision**: Require created_by and analyst_id to match authenticated user.

**Rationale**:
- Prevents impersonation
- Audit trail integrity
- Aligns with existing security model

#### Update Policy

```sql
CREATE POLICY "update_intelligence_by_analyst_or_admin"
ON intelligence_reports FOR UPDATE
TO authenticated
USING (
  analyst_id = auth.uid() -- Own reports
  OR refresh_triggered_by = auth.uid() -- Can update if they triggered refresh
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'intelligence_admin')
  )
);
```

**Design Decision**: Allow updates by original analyst, refresh trigger, or admins.

**Rationale**:
- Analysts maintain ownership of their reports
- Refresh operations need to update reports
- Admins can fix issues
- Prevents unauthorized modifications

#### Delete Policy

```sql
CREATE POLICY "delete_intelligence_by_admin"
ON intelligence_reports FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'intelligence_admin')
  )
);
```

**Design Decision**: Only admins can delete intelligence.

**Rationale**:
- Preserve intelligence history
- Prevent accidental data loss
- Use soft delete (archived_at) for normal cases
- Hard delete only for compliance/legal reasons

## Views and Helper Functions

### intelligence_cache_status View

```sql
CREATE VIEW intelligence_cache_status AS
SELECT
  ir.entity_id,
  d.name_en AS entity_name,
  d.type AS entity_type,
  ir.intelligence_type,
  ir.refresh_status,
  ir.last_refreshed_at,
  ir.cache_expires_at,
  (ir.cache_expires_at < NOW()) AS is_expired,
  EXTRACT(EPOCH FROM (NOW() - ir.last_refreshed_at)) / 3600 AS hours_since_refresh,
  EXTRACT(EPOCH FROM (ir.cache_expires_at - NOW())) / 3600 AS hours_until_expiry,
  ir.confidence_score,
  ir.refresh_triggered_by,
  ir.refresh_trigger_type,
  ir.refresh_duration_ms,
  u.email AS triggered_by_email
FROM intelligence_reports ir
LEFT JOIN dossiers d ON ir.entity_id = d.id
LEFT JOIN users u ON ir.refresh_triggered_by = u.id
WHERE ir.archived_at IS NULL
ORDER BY ir.last_refreshed_at DESC;
```

**Purpose**: Monitoring and alerting dashboard for cache health.

**Use Cases**:
- Admin dashboard showing cache status
- Alerting for expired intelligence
- Performance monitoring (refresh durations)
- Capacity planning (refresh frequency)

### Helper Functions Summary

| Function | Purpose | Complexity |
|----------|---------|-----------|
| `is_intelligence_cache_expired()` | Check if single report expired | O(1) |
| `get_intelligence_ttl_hours()` | Get TTL for type | O(1) |
| `set_intelligence_cache_expiry()` | Trigger: auto-set expiry | O(1) |
| `mark_expired_intelligence_stale()` | Batch mark expired as stale | O(n) |
| `version_intelligence_report()` | Trigger: create version | O(1) |
| `get_latest_intelligence()` | Get most recent for entity | O(log n) |
| `lock_intelligence_for_refresh()` | Acquire refresh lock | O(1) |

## Data Migration Strategy

### Backwards Compatibility

All existing intelligence_reports records automatically updated with:

```sql
UPDATE intelligence_reports
SET
  intelligence_type = 'general',
  refresh_status = 'fresh',
  cache_created_at = COALESCE(created_at, NOW()),
  last_refreshed_at = COALESCE(analysis_timestamp, created_at, NOW()),
  cache_expires_at = NOW() + INTERVAL '24 hours',
  version = 1,
  data_sources_metadata = COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('source', source, 'retrieved_at', NOW()))
     FROM unnest(data_sources) AS source),
    '[]'::jsonb
  )
WHERE intelligence_type IS NULL;
```

**Zero Downtime**: Migration runs as ALTER TABLE ADD COLUMN (non-blocking in PostgreSQL 11+).

**Rollback Strategy**:
- New columns are nullable or have defaults
- No NOT NULL constraints added to existing data
- Can be dropped without breaking existing queries
- RLS policies gracefully handle NULL entity_id

## Storage Considerations

### Estimated Storage Impact

**Per Intelligence Report**:
- New scalar columns: ~50 bytes
- JSONB columns (average): ~500 bytes
  - data_sources_metadata: ~200 bytes (3-5 sources)
  - anythingllm_response_metadata: ~150 bytes
- Text columns: ~100 bytes (workspace_id, error messages)

**Total per report**: ~650 bytes overhead

**For 10,000 intelligence reports**: ~6.5 MB additional storage

**Versioning Impact** (if enabled):
- Each content update creates archived copy
- Estimate 10% of reports updated monthly
- ~1000 archived versions/month = 650 KB/month
- Archival policy can purge versions older than 1 year

## Monitoring and Maintenance

### Scheduled Jobs

#### Mark Expired Intelligence Stale

```sql
-- Run every 5 minutes
SELECT mark_expired_intelligence_stale();
```

**Purpose**: Update refresh_status to 'stale' for expired cache.

#### Cleanup Old Versions

```sql
-- Run weekly
DELETE FROM intelligence_reports
WHERE archived_at < NOW() - INTERVAL '1 year'
  AND review_status = 'archived';
```

**Purpose**: Remove archived versions older than retention period.

### Monitoring Queries

#### Cache Hit Ratio

```sql
SELECT
  COUNT(*) FILTER (WHERE refresh_status = 'fresh') * 100.0 / COUNT(*) AS cache_hit_ratio
FROM intelligence_reports
WHERE archived_at IS NULL;
```

**Target**: >80% (SC-003)

#### Average Refresh Duration

```sql
SELECT
  intelligence_type,
  AVG(refresh_duration_ms) AS avg_duration_ms,
  MAX(refresh_duration_ms) AS max_duration_ms
FROM intelligence_reports
WHERE refresh_duration_ms IS NOT NULL
GROUP BY intelligence_type;
```

**Target**: <10000ms average (SC-002)

#### Stale Intelligence Alert

```sql
SELECT entity_id, intelligence_type, hours_since_refresh
FROM intelligence_cache_status
WHERE refresh_status = 'stale'
  AND hours_since_refresh > 48
ORDER BY hours_since_refresh DESC;
```

**Purpose**: Alert for intelligence not refreshed in 48+ hours.

## Security Considerations

### SQL Injection Prevention

- All user inputs validated via CHECK constraints
- Parameterized queries required in Edge Functions
- No dynamic SQL in helper functions

### Access Control

- RLS enforced at database level
- Cannot be bypassed by application code
- Clearance levels inherited from dossiers
- Service role bypasses RLS (admin operations only)

### Audit Trail

- All refresh operations logged
- User attribution for all changes
- Timestamp tracking for compliance
- Optional audit_logs table integration

### Data Retention

- 7-year retention policy inherited from base table
- Archived versions subject to same retention
- GDPR compliance: user_id can be anonymized
- Right to erasure: cascade delete if user deleted

## Testing Strategy

### Unit Tests

1. Test TTL calculation for each intelligence type
2. Test cache expiration logic
3. Test version chain traversal
4. Test lock acquisition (concurrent refreshes)
5. Test RLS policies with different user clearances

### Integration Tests

1. Test refresh workflow end-to-end
2. Test background expiration job
3. Test version creation on content update
4. Test data source metadata aggregation
5. Test AnythingLLM integration

### Performance Tests

1. Benchmark entity + type lookup (<10ms)
2. Benchmark expired cache query (<50ms)
3. Benchmark dashboard query (<100ms)
4. Benchmark GIN index queries (<200ms)
5. Test concurrent refresh locking (no duplicates)

## Migration Checklist

- [x] Migration SQL file created
- [x] TypeScript types generated
- [x] Design documentation written
- [ ] Migration tested on staging database
- [ ] Performance benchmarks validated
- [ ] RLS policies tested with different user roles
- [ ] Edge Functions updated to use new schema
- [ ] Frontend components updated with new types
- [ ] Monitoring queries added to admin dashboard
- [ ] Scheduled jobs configured
- [ ] Rollback plan documented

## Next Steps

1. **Apply Migration**: Deploy to staging environment using Supabase MCP
2. **Create Edge Functions**:
   - `intelligence-get`: Fetch intelligence for entity
   - `intelligence-refresh`: Trigger refresh operation
   - `intelligence-batch-update`: Scheduled refresh job
3. **Update Frontend**:
   - Import new TypeScript types
   - Create IntelligenceWidget component
   - Create IntelligenceDashboard component
   - Add refresh button handlers
4. **Testing**:
   - Run performance benchmarks
   - Test cache expiration workflow
   - Test concurrent refresh locking
   - Validate RLS policies
5. **Documentation**:
   - API documentation for Edge Functions
   - Component documentation for frontend
   - Admin guide for monitoring

## References

- Feature Specification: `specs/029-dynamic-country-intelligence/spec.md`
- Migration SQL: `supabase/migrations/20250130000001_extend_intelligence_reports_dynamic_system.sql`
- TypeScript Types: `frontend/src/types/intelligence-reports.types.ts`
- Existing Intelligence Schema: `supabase/migrations/026_create_intelligence_reports.sql`
- Dossiers Schema: `supabase/migrations/[date]_create_dossiers.sql`

---

**Document Version**: 1.0
**Last Updated**: 2025-01-30
**Author**: Database Architect
**Reviewed By**: [Pending]
