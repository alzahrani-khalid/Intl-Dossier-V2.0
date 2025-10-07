# Research: Dossiers Hub

**Feature**: 009-dossiers-hub
**Date**: 2025-09-30
**Status**: Complete

## Research Areas

### 1. Optimistic Locking in Supabase/PostgreSQL

**Decision**: Use `version` integer column with increment-on-update trigger

**Rationale**:
- PostgreSQL triggers provide automatic versioning without application logic
- Supabase RLS policies can check version matching in UPDATE statements
- Client passes `current_version` in UPDATE, server rejects if mismatch
- Standard pattern used across Supabase applications

**Implementation Pattern**:
```sql
-- Add version column
ALTER TABLE dossiers ADD COLUMN version INTEGER DEFAULT 1 NOT NULL;

-- Create trigger to auto-increment
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dossiers_version_trigger
BEFORE UPDATE ON dossiers
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- RLS policy checks version
CREATE POLICY "Users can update dossiers with correct version"
ON dossiers FOR UPDATE
USING (auth.uid() = owner_id OR is_admin_or_manager())
WITH CHECK (version = (SELECT version FROM dossiers WHERE id = dossiers.id));
```

**Alternatives Considered**:
- Timestamp-based locking: Less reliable due to clock skew
- Row-level locks: Doesn't work well with connection pooling
- Application-level versioning: Requires more client logic

**References**:
- PostgreSQL triggers: https://www.postgresql.org/docs/current/trigger-definition.html
- Supabase RLS patterns: https://supabase.com/docs/guides/auth/row-level-security

---

### 2. Infinite Scroll with TanStack Query

**Decision**: Use `useInfiniteQuery` with cursor-based pagination

**Rationale**:
- Built-in support for infinite scrolling in TanStack Query v5
- Cursor-based pagination is more stable than offset for real-time data
- Automatic caching and deduplication
- Works seamlessly with React Intersection Observer

**Implementation Pattern**:
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['timeline-events', dossierId, filters],
  queryFn: ({ pageParam = null }) =>
    fetchTimelineEvents(dossierId, { cursor: pageParam, limit: 50 }),
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  initialPageParam: null
});

// Use Intersection Observer for scroll trigger
const { ref } = useInView({
  onChange: (inView) => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }
});
```

**Alternatives Considered**:
- Offset-based pagination: Can skip/duplicate items if data changes
- Virtual scrolling: Unnecessary complexity for 50-item batches
- Manual scroll handling: TanStack Query provides better DX

**References**:
- TanStack Query infinite queries: https://tanstack.com/query/latest/docs/react/guides/infinite-queries
- React Intersection Observer: https://www.npmjs.com/package/react-intersection-observer

---

### 3. Bilingual AI Brief Generation

**Decision**: Single prompt with structured JSON output containing both languages

**Rationale**:
- AnythingLLM supports structured output formats
- Single API call reduces latency and cost
- Ensures consistency between translations
- Easier to implement timeout and fallback logic

**Implementation Pattern**:
```typescript
const generateBrief = async (dossierData: DossierData): Promise<Brief> => {
  const prompt = `Generate executive brief in both English and Arabic...
  Return JSON: { "en": { "summary": "...", "sections": [...] }, "ar": { ... } }`;

  const response = await anythingLLM.chat({
    message: prompt,
    mode: "chat",
    workspace: "dossiers",
    timeout: 60000
  });

  return JSON.parse(response.textResponse);
};
```

**Fallback Strategy** (from clarification):
- On timeout or error, show manual template form
- Pre-populate template with dossier data (name, type, recent events)
- User completes sections manually in both languages
- Save as regular brief with `generated_by: "manual"` flag

**Alternatives Considered**:
- Sequential generation (EN then AR): Doubles latency, fails if one succeeds
- Translation API approach: Loses context, less accurate
- Client-side generation: Violates data sovereignty requirement

**References**:
- AnythingLLM API docs: https://docs.anythingllm.com/api
- Structured output patterns: LLM best practices for JSON generation

---

### 4. RLS Policies for Hybrid Permission Model

**Decision**: Function-based policy helpers for owner + admin/manager checks

**Rationale**:
- Hybrid model (from clarification): Owners can edit their dossiers, admins/managers can edit any
- PostgreSQL functions keep policy logic DRY
- Centralized permission checks easier to audit
- Supports future role additions

**Implementation Pattern**:
```sql
-- Helper function
CREATE OR REPLACE FUNCTION can_edit_dossier(dossier_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User is owner
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE id = dossier_id
      AND owner_id = auth.uid()
    )
    OR
    -- User is admin/manager
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
CREATE POLICY "View dossiers based on sensitivity"
ON dossiers FOR SELECT
USING (
  sensitivity_level <= get_user_clearance_level(auth.uid())
);

CREATE POLICY "Edit dossiers with hybrid permissions"
ON dossiers FOR UPDATE
USING (can_edit_dossier(id))
WITH CHECK (can_edit_dossier(id));
```

**Sensitivity-Based Access**:
- Dossiers have sensitivity levels (Low, Medium, High)
- Users have clearance levels
- User can only view dossiers at or below their clearance
- Separate from edit permissions

**Alternatives Considered**:
- Inline policy logic: Harder to maintain, duplicated code
- Application-level checks only: Bypassed if RLS disabled
- Attribute-based access control (ABAC): Over-engineered for current needs

**References**:
- Supabase RLS best practices: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL security functions: https://www.postgresql.org/docs/current/sql-createfunction.html

---

### 5. Timeline Event Aggregation

**Decision**: Materialized view with refresh trigger for performance

**Rationale**:
- Timeline aggregates events from 6+ tables (engagements, positions, MoUs, etc.)
- Materialized view pre-computes joins for <1.5s performance target
- Refresh on source table changes keeps data current
- Supports cursor-based pagination efficiently

**Implementation Pattern**:
```sql
CREATE MATERIALIZED VIEW dossier_timeline AS
SELECT
  d.id as dossier_id,
  'engagement' as event_type,
  e.id as source_id,
  e.date as event_date,
  e.title as event_title,
  e.description as event_description
FROM dossiers d
JOIN engagements e ON e.dossier_id = d.id
UNION ALL
SELECT d.id, 'position', p.id, p.created_at, p.title, p.summary
FROM dossiers d
JOIN positions p ON p.dossier_id = d.id
-- ... other event types
ORDER BY event_date DESC;

CREATE INDEX idx_timeline_dossier_date ON dossier_timeline(dossier_id, event_date DESC);

-- Refresh trigger (for real-time updates, could use pg_cron for batched)
CREATE OR REPLACE FUNCTION refresh_timeline()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_timeline;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Alternative for Real-Time** (if materialized view too slow to refresh):
- Supabase Realtime subscriptions on source tables
- Client-side merging and sorting
- Trade-off: More client logic, less server load

**Alternatives Considered**:
- Runtime UNION ALL query: Too slow for large datasets
- Separate queries per type: N+1 problem, client-side sorting
- Denormalized events table: Sync complexity, data duplication

**References**:
- PostgreSQL materialized views: https://www.postgresql.org/docs/current/sql-creatematerializedview.html
- Supabase performance optimization: https://supabase.com/docs/guides/database/performance

---

### 6. Performance Optimization Strategies

**Decision**: Multi-layered caching with database indexes and client-side state

**Rationale**:
- <1.5s target requires optimization at multiple levels
- Database: Proper indexes on foreign keys, filter columns, sort columns
- API: Edge function caching headers for stable data
- Client: TanStack Query caching with stale-while-revalidate

**Implementation Checklist**:

**Database Indexes**:
```sql
-- Dossiers table
CREATE INDEX idx_dossiers_type ON dossiers(type);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_owner ON dossiers(owner_id);
CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_level);
CREATE INDEX idx_dossiers_search ON dossiers USING gin(to_tsvector('english', name || ' ' || summary_en));

-- Timeline (from materialized view)
CREATE INDEX idx_timeline_dossier_date ON dossier_timeline(dossier_id, event_date DESC);

-- Composite for common filter combinations
CREATE INDEX idx_dossiers_type_status ON dossiers(type, status) WHERE archived = false;
```

**Edge Function Caching**:
```typescript
// For relatively stable data (dossier list)
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, s-maxage=300',
  }
});
```

**Client Caching Strategy**:
```typescript
queryClient.setDefaultOptions({
  queries: {
    staleTime: 30_000, // 30s - data fresh for this duration
    cacheTime: 5 * 60_000, // 5 minutes - keep in cache
    refetchOnWindowFocus: false,
    retry: 2
  }
});
```

**Performance Budget**:
- Database query: <200ms (p95)
- Edge function overhead: <100ms
- Network latency: <500ms (estimate)
- Client rendering: <700ms
- Total: ~1.5s target

**Alternatives Considered**:
- Redis caching layer: Adds infrastructure complexity
- Full-text search with Algolia: External dependency, violates data sovereignty
- GraphQL with DataLoader: Overkill for REST patterns

**References**:
- PostgreSQL index types: https://www.postgresql.org/docs/current/indexes-types.html
- TanStack Query caching: https://tanstack.com/query/latest/docs/react/guides/caching
- Edge function optimization: Supabase edge function best practices

---

## Summary

All technical decisions resolved:
- ✅ Optimistic locking pattern defined
- ✅ Infinite scroll implementation chosen
- ✅ AI brief generation strategy confirmed
- ✅ RLS policy patterns designed
- ✅ Timeline aggregation approach selected
- ✅ Performance optimization strategy planned

**Next Phase**: Data model design and contract generation (Phase 1)