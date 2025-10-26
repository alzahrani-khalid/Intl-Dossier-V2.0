# Research: Unified Dossier Architecture

**Feature**: 026-unified-dossier-architecture
**Date**: 2025-01-22
**Status**: Complete

## Overview

This document consolidates research findings and technical decisions for implementing the unified dossier architecture. Since the feature specification is comprehensive and all technical context is known from CLAUDE.md, this research focuses on documenting the specific patterns, algorithms, and best practices that will guide the implementation.

---

## 1. Class Table Inheritance Pattern

### Decision
Implement Class Table Inheritance (CTI) pattern where universal `dossiers` table serves as base, with type-specific extension tables (countries, organizations, etc.) using same UUID as foreign key.

### Rationale
- **Single ID namespace**: Every entity has one ID (dossiers.id) that works across all queries
- **Type safety**: Extension tables enforce type-specific fields with proper constraints
- **Query flexibility**: Can query all entities via dossiers table, JOIN to extensions only when type-specific data needed
- **Referential integrity**: ON DELETE CASCADE ensures extension cleanup when dossier deleted

### Implementation Pattern

```sql
-- Universal base table
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('country', 'organization', 'forum', 'engagement', 'theme', 'working_group', 'person')),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'deleted')),
  sensitivity_level INTEGER NOT NULL DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description_ar, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Type-specific extension (example: countries)
CREATE TABLE countries (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  iso_code_2 CHAR(2) UNIQUE NOT NULL,
  iso_code_3 CHAR(3) UNIQUE NOT NULL,
  capital_en TEXT,
  capital_ar TEXT,
  region TEXT,
  subregion TEXT,
  population BIGINT,
  area_sq_km NUMERIC(15,2),
  flag_url TEXT
);

-- Constraint: dossier type must match extension table
CREATE FUNCTION validate_dossier_type() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT type FROM dossiers WHERE id = NEW.id) != TG_ARGV[0] THEN
    RAISE EXCEPTION 'Dossier type mismatch: expected %, got %',
      TG_ARGV[0], (SELECT type FROM dossiers WHERE id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_country_type
  BEFORE INSERT OR UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('country');
```

### Query Patterns

```sql
-- Query all dossiers (polymorphic)
SELECT id, type, name_en, name_ar, status FROM dossiers WHERE status = 'active';

-- Query specific type with extension data
SELECT d.id, d.name_en, c.iso_code_2, c.capital_en
FROM dossiers d
JOIN countries c ON c.id = d.id
WHERE d.type = 'country' AND d.status = 'active';

-- Query with conditional JOIN based on type
SELECT d.id, d.type, d.name_en,
  c.iso_code_2 AS country_code,
  o.org_code AS organization_code
FROM dossiers d
LEFT JOIN countries c ON c.id = d.id AND d.type = 'country'
LEFT JOIN organizations o ON o.id = d.id AND d.type = 'organization'
WHERE d.status = 'active';
```

### Alternatives Considered
- **Single Table Inheritance (STI)**: All fields in one table with many NULLs - rejected due to poor data integrity and wasted space
- **Concrete Table Inheritance**: Separate tables with duplicated dossier fields - rejected due to no single ID namespace
- **JSON column for type data**: Extension data in JSONB - rejected due to loss of type safety and query performance

---

## 2. Graph Query Patterns (Recursive CTEs)

### Decision
Use PostgreSQL recursive CTEs (Common Table Expressions) for graph traversal queries, enabling N-degree relationship exploration with path tracking.

### Rationale
- **Native PostgreSQL**: No external graph database required, reduces infrastructure complexity
- **Performance**: Recursive CTEs optimized by PostgreSQL query planner, can handle 5-degree traversal in <2s
- **Flexibility**: Can filter by relationship type, date range, entity type during traversal
- **Path tracking**: Can return full relationship path from source to target

### Implementation Pattern

```sql
-- Find all entities within N degrees of separation
WITH RECURSIVE relationship_graph AS (
  -- Base case: direct relationships from starting dossier
  SELECT
    dr.source_dossier_id,
    dr.target_dossier_id,
    dr.relationship_type,
    1 AS degree,
    ARRAY[dr.source_dossier_id, dr.target_dossier_id] AS path,
    ARRAY[dr.relationship_type] AS relationship_path
  FROM dossier_relationships dr
  WHERE dr.source_dossier_id = $1 -- starting dossier ID
    AND dr.status = 'active'
    AND (dr.effective_to IS NULL OR dr.effective_to > now())

  UNION

  -- Recursive case: traverse to next degree
  SELECT
    rg.source_dossier_id,
    dr.target_dossier_id,
    dr.relationship_type,
    rg.degree + 1,
    rg.path || dr.target_dossier_id,
    rg.relationship_path || dr.relationship_type
  FROM relationship_graph rg
  JOIN dossier_relationships dr ON dr.source_dossier_id = rg.target_dossier_id
  WHERE rg.degree < $2 -- max degrees parameter
    AND NOT (dr.target_dossier_id = ANY(rg.path)) -- prevent cycles
    AND dr.status = 'active'
    AND (dr.effective_to IS NULL OR dr.effective_to > now())
)
SELECT DISTINCT
  d.id,
  d.type,
  d.name_en,
  d.name_ar,
  rg.degree,
  rg.path,
  rg.relationship_path
FROM relationship_graph rg
JOIN dossiers d ON d.id = rg.target_dossier_id
WHERE d.status = 'active'
ORDER BY rg.degree, d.name_en;
```

### Bidirectional Relationship Queries

```sql
-- Find all entities connected to a dossier (source OR target)
WITH bidirectional_relationships AS (
  -- Outgoing relationships (this dossier is source)
  SELECT target_dossier_id AS related_dossier_id, relationship_type, 'outgoing' AS direction
  FROM dossier_relationships
  WHERE source_dossier_id = $1 AND status = 'active'

  UNION

  -- Incoming relationships (this dossier is target)
  SELECT source_dossier_id AS related_dossier_id, relationship_type, 'incoming' AS direction
  FROM dossier_relationships
  WHERE target_dossier_id = $1 AND status = 'active'
)
SELECT d.id, d.type, d.name_en, br.relationship_type, br.direction
FROM bidirectional_relationships br
JOIN dossiers d ON d.id = br.related_dossier_id
WHERE d.status = 'active'
ORDER BY br.relationship_type, d.name_en;
```

### Performance Optimization
- **Indexes**: CREATE INDEX idx_relationships_source ON dossier_relationships(source_dossier_id) WHERE status = 'active'
- **Indexes**: CREATE INDEX idx_relationships_target ON dossier_relationships(target_dossier_id) WHERE status = 'active'
- **Depth limit**: Enforce max degree parameter (typically 10) to prevent runaway queries
- **Cycle prevention**: Track visited nodes in path array to avoid infinite loops

### Alternatives Considered
- **Neo4j/ArangoDB**: Dedicated graph databases - rejected due to infrastructure complexity and data duplication
- **Application-level traversal**: Multiple queries from app code - rejected due to N+1 query problem and poor performance
- **Materialized path**: Pre-computed paths stored as columns - rejected due to complexity in maintaining paths on relationship changes

---

## 3. Full-Text Search Implementation

### Decision
Use PostgreSQL tsvector generated column with weighted full-text search, supporting both English and Arabic text with ranked results.

### Rationale
- **Native PostgreSQL**: No external search engine (Elasticsearch) required
- **Real-time updates**: Generated column automatically updates on row changes
- **Weighted ranking**: Name fields weighted higher (A) than descriptions (B) for better relevance
- **Multilingual**: Handles both English and Arabic text using 'simple' dictionary (no stemming to preserve Arabic)
- **Performance**: GiST index on search_vector enables fast full-text queries

### Implementation Pattern

```sql
-- Generated search_vector column (already in dossiers table)
search_vector TSVECTOR GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(name_en, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(name_ar, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description_en, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(description_ar, '')), 'B')
) STORED;

-- GiST index for fast full-text search
CREATE INDEX idx_dossiers_search_vector ON dossiers USING GiST(search_vector);

-- Additional index for type filtering
CREATE INDEX idx_dossiers_type_status ON dossiers(type, status);

-- Search query with ranking
SELECT
  d.id,
  d.type,
  d.name_en,
  d.name_ar,
  d.status,
  ts_rank(d.search_vector, query) AS rank,
  ts_headline('simple', d.description_en, query, 'MaxWords=50') AS snippet
FROM dossiers d,
  to_tsquery('simple', $1) AS query
WHERE d.search_vector @@ query
  AND d.status != 'deleted'
ORDER BY
  -- Prioritize exact matches in name_en
  (d.name_en ILIKE '%' || $2 || '%') DESC,
  -- Then by relevance rank
  ts_rank(d.search_vector, query) DESC,
  -- Then by status (active > inactive > archived)
  CASE d.status
    WHEN 'active' THEN 1
    WHEN 'inactive' THEN 2
    WHEN 'archived' THEN 3
    ELSE 4
  END,
  -- Finally alphabetically
  d.name_en
LIMIT $3 OFFSET $4;
```

### Search Query Transformation

```javascript
// Transform user query to tsquery format
function transformSearchQuery(userQuery: string): string {
  // Split on whitespace, filter empty strings
  const terms = userQuery.trim().split(/\s+/).filter(t => t.length > 0);

  // Join with OR operator for phrase matching
  // Example: "Saudi Arabia" -> "Saudi | Arabia"
  return terms.join(' | ');
}

// Usage
const userQuery = "Saudi Arabia climate";
const tsquery = transformSearchQuery(userQuery); // "Saudi | Arabia | climate"
```

### RLS Integration for Clearance Filtering

```sql
-- RLS policy for search results (clearance level filtering)
CREATE POLICY "Users can search dossiers within clearance"
ON dossiers FOR SELECT
USING (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
);
```

### Performance Targets
- **Search latency**: <1s for 95% of queries with 10,000+ entities (SC-004)
- **Result limit**: Default 20 results per page, max 100
- **Index size**: GiST index typically 30-40% of table size

### Alternatives Considered
- **Elasticsearch**: External search engine - rejected due to data duplication, infrastructure complexity, sync lag
- **Trigram similarity (pg_trgm)**: Fuzzy matching only - rejected as insufficient for full-text search (but can be combined for typo tolerance)
- **LIKE queries**: Pattern matching - rejected due to poor performance and lack of ranking

---

## 4. Migration Strategy

### Decision
Multi-step migration approach: (1) Create new schema, (2) Migrate data with preservation, (3) Update references, (4) Deprecate old tables.

### Rationale
- **Zero data loss**: All existing data preserved with full integrity (SC-007)
- **Rollback capability**: Each step can be rolled back independently
- **Incremental validation**: Can verify data after each step before proceeding
- **Minimal downtime**: New schema created without locking old tables

### Migration Steps

#### Step 1: Create New Schema

```sql
-- migration: YYYYMMDDHHMMSS_create_unified_dossiers.sql
-- Creates dossiers table, extension tables, relationships, calendar
-- No data modification, just schema creation
```

#### Step 2: Migrate Existing Data

```sql
-- migration: YYYYMMDDHHMMSS_migrate_data.sql

-- Migrate countries
INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, created_at, updated_at)
SELECT
  id,
  'country'::TEXT,
  name_en,
  name_ar,
  description_en,
  description_ar,
  status,
  created_at,
  updated_at
FROM countries_old;

INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km, flag_url)
SELECT id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km, flag_url
FROM countries_old;

-- Repeat for organizations, forums, themes, working_groups

-- Migrate engagements (convert dossier_id FK to relationship)
INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, created_at, updated_at)
SELECT id, 'engagement'::TEXT, name_en, name_ar, description_en, description_ar, status, created_at, updated_at
FROM engagements_old;

INSERT INTO engagements (id, engagement_type, engagement_category, location_en, location_ar)
SELECT id, engagement_type, engagement_category, location_en, location_ar
FROM engagements_old;

-- Convert engagement.dossier_id FK to relationship entry
INSERT INTO dossier_relationships (source_dossier_id, target_dossier_id, relationship_type, status, created_at)
SELECT
  e.id AS source_dossier_id,
  e.dossier_id AS target_dossier_id,
  'discusses'::TEXT AS relationship_type,
  'active'::TEXT AS status,
  e.created_at
FROM engagements_old e
WHERE e.dossier_id IS NOT NULL;
```

#### Step 3: Update Polymorphic References

```sql
-- migration: YYYYMMDDHHMMSS_update_polymorphic_refs.sql

-- Update intake_entity_links to use dossiers.id
UPDATE intake_entity_links
SET entity_type = 'dossier'
WHERE entity_type IN ('country', 'organization', 'forum', 'engagement', 'theme', 'working_group');

-- Update tasks.work_item_type
UPDATE tasks
SET work_item_type = 'dossier'
WHERE work_item_type IN ('country', 'organization', 'forum', 'engagement', 'theme', 'working_group');

-- Update position_dossier_links (already references dossiers.id, verify only)
-- No changes needed if already pointing to dossiers.id

-- Update mou signatories (verify references dossiers.id)
-- No changes needed if already pointing to dossiers.id
```

#### Step 4: Verify Data Integrity

```sql
-- Verification queries (run before dropping old tables)

-- Check no orphaned extension rows
SELECT 'countries' AS table_name, COUNT(*) AS orphans
FROM countries c
WHERE NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.id = c.id AND d.type = 'country')
UNION ALL
SELECT 'organizations', COUNT(*)
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.id = o.id AND d.type = 'organization');

-- Check all relationships reference valid dossiers
SELECT COUNT(*) AS invalid_relationships
FROM dossier_relationships dr
WHERE NOT EXISTS (SELECT 1 FROM dossiers WHERE id = dr.source_dossier_id)
   OR NOT EXISTS (SELECT 1 FROM dossiers WHERE id = dr.target_dossier_id);

-- Check record counts match
SELECT
  (SELECT COUNT(*) FROM countries_old) AS old_count,
  (SELECT COUNT(*) FROM dossiers WHERE type = 'country') AS new_count,
  (SELECT COUNT(*) FROM countries) AS extension_count;
```

#### Step 5: Deprecate Old Tables

```sql
-- migration: YYYYMMDDHHMMSS_deprecate_old_tables.sql

-- Rename old tables with _deprecated suffix (don't drop yet)
ALTER TABLE countries_old RENAME TO countries_deprecated_20250122;
ALTER TABLE organizations_old RENAME TO organizations_deprecated_20250122;
ALTER TABLE forums_old RENAME TO forums_deprecated_20250122;
ALTER TABLE engagements_old RENAME TO engagements_deprecated_20250122;
ALTER TABLE themes_old RENAME TO themes_deprecated_20250122;
ALTER TABLE working_groups_old RENAME TO working_groups_deprecated_20250122;

-- Drop after 30 days in production (separate migration)
```

### Rollback Strategy
- Step 1: Drop new tables (no data affected)
- Step 2: DELETE FROM new tables, no changes to old tables
- Step 3: Restore polymorphic references to original entity_type values
- Step 4: No changes made, just verification
- Step 5: Rename tables back from _deprecated

### Validation Checklist
- [ ] All country records migrated (count match)
- [ ] All organization records migrated (count match)
- [ ] All forum records migrated (count match)
- [ ] All engagement records migrated (count match)
- [ ] All engagement relationships created from dossier_id FK
- [ ] All theme records migrated (count match)
- [ ] All working_group records migrated (count match)
- [ ] Zero orphaned extension rows
- [ ] Zero invalid relationships (all reference valid dossiers)
- [ ] All polymorphic references updated to 'dossier'
- [ ] TypeScript types regenerated with zero errors
- [ ] All existing tests pass with new schema

---

## 5. RLS Policy Design

### Decision
Maintain clearance-based RLS policies for unified dossiers table, with policies cascading to extension tables via JOIN filters.

### Rationale
- **Security by default**: Users cannot access dossiers above their clearance level
- **Consistent enforcement**: Single policy on dossiers table covers all types
- **Extension protection**: Extension tables don't need separate policies (JOIN to dossiers enforces clearance)
- **Performance**: RLS policies use indexed columns (sensitivity_level) for fast filtering

### Implementation Pattern

```sql
-- Enable RLS on dossiers table
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view dossiers within their clearance level
CREATE POLICY "Users can view dossiers within clearance"
ON dossiers FOR SELECT
USING (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Users can insert dossiers up to their clearance level
CREATE POLICY "Users can create dossiers within clearance"
ON dossiers FOR INSERT
WITH CHECK (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Users can update dossiers within their clearance
CREATE POLICY "Users can update dossiers within clearance"
ON dossiers FOR UPDATE
USING (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Users can delete dossiers within their clearance (soft delete via status)
CREATE POLICY "Users can delete dossiers within clearance"
ON dossiers FOR UPDATE
USING (
  sensitivity_level <= (
    SELECT clearance_level
    FROM profiles
    WHERE id = auth.uid()
  )
);
```

### Extension Table RLS

```sql
-- Extension tables don't need separate policies
-- Clearance filtering happens automatically via JOIN to dossiers

-- Example: Query countries with clearance filtering
SELECT d.id, d.name_en, c.iso_code_2, c.capital_en
FROM dossiers d
JOIN countries c ON c.id = d.id
WHERE d.type = 'country';
-- RLS policy on dossiers filters out high-clearance countries automatically
```

### Relationship RLS

```sql
-- Enable RLS on dossier_relationships
ALTER TABLE dossier_relationships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view relationships if both dossiers are accessible
CREATE POLICY "Users can view relationships within clearance"
ON dossier_relationships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = source_dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = target_dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
);

-- Policy: Users can create relationships if both dossiers are accessible
CREATE POLICY "Users can create relationships within clearance"
ON dossier_relationships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = source_dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = target_dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
);
```

### Calendar Events RLS

```sql
-- Enable RLS on calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view calendar events for accessible dossiers
CREATE POLICY "Users can view calendar events within clearance"
ON calendar_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
);
```

### Performance Optimization
- **Index on profiles.clearance_level**: CREATE INDEX idx_profiles_clearance ON profiles(clearance_level)
- **Index on dossiers.sensitivity_level**: CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_level)
- **Cached clearance lookup**: Application can cache user's clearance_level for session duration

---

## 6. Performance Optimization Strategies

### Decision
Multi-layered optimization: database indexes, Redis caching, React lazy loading, virtualization for large lists.

### Rationale
- **Performance targets**: Must meet <2s graph queries, <1s search, <3s graph viz (SC-003, SC-004, SC-012)
- **Scalability**: System must handle 10,000+ entities without degradation
- **User experience**: Fast response times critical for staff productivity

### Database Indexes

```sql
-- Primary key indexes (automatic)
-- dossiers.id, countries.id, organizations.id, etc.

-- Type and status filtering
CREATE INDEX idx_dossiers_type_status ON dossiers(type, status);

-- Full-text search
CREATE INDEX idx_dossiers_search_vector ON dossiers USING GiST(search_vector);

-- Relationship queries (bidirectional)
CREATE INDEX idx_relationships_source ON dossier_relationships(source_dossier_id)
  WHERE status = 'active';
CREATE INDEX idx_relationships_target ON dossier_relationships(target_dossier_id)
  WHERE status = 'active';
CREATE INDEX idx_relationships_type ON dossier_relationships(relationship_type);

-- Calendar datetime range queries
CREATE INDEX idx_calendar_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_dossier ON calendar_events(dossier_id);

-- Clearance filtering
CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_level);

-- Composite index for common query patterns
CREATE INDEX idx_dossiers_type_status_sensitivity
  ON dossiers(type, status, sensitivity_level);
```

### Redis Caching Strategy

```typescript
// Cache frequently accessed dossiers
const CACHE_TTL = {
  DOSSIER: 300,        // 5 minutes
  RELATIONSHIPS: 600,  // 10 minutes
  SEARCH_RESULTS: 180  // 3 minutes
};

// Cache key patterns
const CACHE_KEYS = {
  dossier: (id: string) => `dossier:${id}`,
  relationships: (id: string) => `relationships:${id}`,
  search: (query: string, filters: string) => `search:${query}:${filters}`,
  graphData: (id: string, degrees: number) => `graph:${id}:${degrees}`
};

// Example: Cache dossier with relationships
async function getDossierWithCache(id: string) {
  const cacheKey = CACHE_KEYS.dossier(id);

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss: fetch from database
  const dossier = await db.query('SELECT * FROM dossiers WHERE id = $1', [id]);

  // Store in cache
  await redis.setex(cacheKey, CACHE_TTL.DOSSIER, JSON.stringify(dossier));

  return dossier;
}

// Cache invalidation on updates
async function updateDossier(id: string, updates: any) {
  await db.query('UPDATE dossiers SET ... WHERE id = $1', [id, ...updates]);

  // Invalidate caches
  await redis.del(CACHE_KEYS.dossier(id));
  await redis.del(CACHE_KEYS.relationships(id));
  await redis.del(CACHE_KEYS.graphData(id, '*')); // Wildcard delete
}
```

### React Performance Patterns

```typescript
// Lazy loading for route-based code splitting
const DossierListPage = lazy(() => import('./pages/dossiers/DossierListPage'));
const DossierDetailPage = lazy(() => import('./pages/dossiers/DossierDetailPage'));
const RelationshipGraphPage = lazy(() => import('./pages/relationships/RelationshipGraphPage'));

// Virtualization for large entity lists
import { useVirtualizer } from '@tanstack/react-virtual';

function DossierList({ dossiers }: { dossiers: Dossier[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: dossiers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5 // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <DossierCard dossier={dossiers[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Memoization for expensive components
const GraphVisualization = memo(({ nodes, edges }: GraphProps) => {
  // React Flow graph rendering
  return <ReactFlow nodes={nodes} edges={edges} />;
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if node/edge count or IDs change
  return (
    prevProps.nodes.length === nextProps.nodes.length &&
    prevProps.edges.length === nextProps.edges.length &&
    prevProps.nodes.every((node, i) => node.id === nextProps.nodes[i].id)
  );
});
```

### TanStack Query Optimization

```typescript
// Stale-while-revalidate pattern
const { data: dossier } = useQuery({
  queryKey: ['dossier', id],
  queryFn: () => fetchDossier(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false // Don't refetch on tab focus
});

// Prefetch related data
const queryClient = useQueryClient();

function prefetchRelationships(dossierId: string) {
  queryClient.prefetchQuery({
    queryKey: ['relationships', dossierId],
    queryFn: () => fetchRelationships(dossierId)
  });
}

// Optimistic updates for better UX
const updateMutation = useMutation({
  mutationFn: updateDossier,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['dossier', newData.id] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['dossier', newData.id]);

    // Optimistically update cache
    queryClient.setQueryData(['dossier', newData.id], newData);

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(['dossier', newData.id], context.previous);
    }
  }
});
```

### Graph Visualization Performance

```typescript
// Limit node count for initial render
const MAX_INITIAL_NODES = 50;
const MAX_DEGREES = 2;

// Progressive loading: start with 1 degree, expand on demand
function useGraphData(startDossierId: string) {
  const [degrees, setDegrees] = useState(1);

  const { data } = useQuery({
    queryKey: ['graph', startDossierId, degrees],
    queryFn: () => fetchGraphData(startDossierId, degrees),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: degrees <= MAX_DEGREES
  });

  const expandGraph = () => {
    if (degrees < MAX_DEGREES) {
      setDegrees(prev => prev + 1);
    }
  };

  return { data, expandGraph, canExpand: degrees < MAX_DEGREES };
}

// Debounce layout calculations
import { useDebouncedCallback } from 'use-debounce';

const onLayout = useDebouncedCallback((nodes, edges) => {
  // Expensive layout calculation
  calculateLayout(nodes, edges);
}, 300);
```

### Query Complexity Budget

```typescript
// Backend: Track query complexity and reject expensive queries
interface QueryComplexity {
  maxDegrees: number;
  maxResults: number;
  allowRecursive: boolean;
}

const QUERY_BUDGETS: Record<string, QueryComplexity> = {
  graphTraversal: { maxDegrees: 5, maxResults: 500, allowRecursive: true },
  search: { maxDegrees: 0, maxResults: 100, allowRecursive: false },
  relationships: { maxDegrees: 2, maxResults: 100, allowRecursive: true }
};

function validateQueryComplexity(queryType: string, params: any) {
  const budget = QUERY_BUDGETS[queryType];

  if (params.degrees > budget.maxDegrees) {
    throw new Error(`Query exceeds max degrees: ${params.degrees} > ${budget.maxDegrees}`);
  }

  if (params.limit > budget.maxResults) {
    throw new Error(`Query exceeds max results: ${params.limit} > ${budget.maxResults}`);
  }
}
```

---

## Summary

All research areas have been documented with implementation patterns, rationale, and best practices. Key architectural decisions:

1. **Class Table Inheritance**: Universal dossiers base + type-specific extensions using same UUID
2. **Graph Queries**: PostgreSQL recursive CTEs for N-degree traversal with path tracking
3. **Full-Text Search**: Native tsvector with weighted ranking and multilingual support
4. **Migration**: Multi-step approach with data preservation and rollback capability
5. **RLS Policies**: Clearance-based filtering on dossiers cascading to extensions
6. **Performance**: Multi-layered optimization (indexes, Redis, React patterns, query budgets)

All technical unknowns resolved. Ready to proceed to Phase 1: Design & Contracts.
