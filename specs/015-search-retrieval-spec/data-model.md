# Data Model: Search & Retrieval

**Feature**: 015-search-retrieval-spec
**Date**: 2025-10-04
**Status**: Ready for Implementation

---

## Overview

This data model supports a high-performance, bilingual search system with both keyword and semantic capabilities. The design leverages PostgreSQL full-text search extensions (pg_tsvector, pg_trgm, pgvector) and Redis caching for optimal performance.

---

## 1. Search Index Extensions

### Entity Search Vectors

**Applied to**: `dossiers`, `staff_profiles` (people), `engagements`, `positions`, `external_contacts`, `attachments` (documents)

```sql
-- Common pattern for all searchable entities
ALTER TABLE {entity_table} ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, name_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, summary_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(description_ar, summary_ar, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_en, notes_en, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(content_ar, notes_ar, '')), 'C')
  ) STORED;

-- GIN index for full-text search
CREATE INDEX idx_{entity}_search_vector ON {entity_table} USING GIN(search_vector);

-- Trigram indexes for fuzzy matching
CREATE INDEX idx_{entity}_title_en_trgm ON {entity_table} USING GIN(title_en gin_trgm_ops);
CREATE INDEX idx_{entity}_title_ar_trgm ON {entity_table} USING GIN(title_ar gin_trgm_ops);
```

**Weight Scheme**:
- **A (1.0)**: Titles, names (highest importance)
- **B (0.4)**: Descriptions, summaries
- **C (0.2)**: Content, notes (lowest importance)

---

## 2. Semantic Search Vectors

### Embedding Columns

**Applied to**: `positions`, `attachments` (documents), `briefs`

```sql
-- Add vector column for semantic search
ALTER TABLE positions ADD COLUMN embedding vector(1536);
ALTER TABLE attachments ADD COLUMN embedding vector(1536);
ALTER TABLE briefs ADD COLUMN embedding vector(1536);

-- HNSW index for approximate nearest neighbor search
CREATE INDEX idx_positions_embedding ON positions
  USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_attachments_embedding ON attachments
  USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_briefs_embedding ON briefs
  USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);
```

**Vector Dimensions**: 1536 (text-embedding-3-small model)
**Index Type**: HNSW (Hierarchical Navigable Small World) for fast k-NN
**Distance Function**: L2 (Euclidean distance), convertible to cosine similarity

---

## 3. Embedding Update Queue

### Table: `embedding_update_queue`

Tracks entities that need vector embedding generation/updates.

```sql
CREATE TABLE embedding_update_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,  -- 'positions', 'attachments', 'briefs'
  entity_id uuid NOT NULL,
  priority integer DEFAULT 5,  -- 1=highest, 10=lowest
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0
);

CREATE INDEX idx_queue_processing ON embedding_update_queue (created_at)
  WHERE processed_at IS NULL;

CREATE INDEX idx_queue_entity ON embedding_update_queue (entity_type, entity_id)
  WHERE processed_at IS NULL;
```

**Fields**:
- `entity_type`: Table name of the entity
- `entity_id`: UUID of the entity record
- `priority`: Processing priority (1=urgent, 10=background)
- `processed_at`: Timestamp when embedding was generated
- `error_message`: Error details if generation failed
- `retry_count`: Number of retry attempts

**Lifecycle**:
1. INSERT when entity created/updated (via trigger)
2. Background job processes queue every 30 seconds
3. UPDATE `processed_at` on success
4. UPDATE `error_message` and increment `retry_count` on failure
5. DELETE after 7 days (processed records only)

---

## 4. Search Query Tracking

### Table: `search_queries`

Tracks user search queries for analytics and "People also looked for" feature.

```sql
CREATE TABLE search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  query_text text NOT NULL,
  query_text_normalized text NOT NULL,  -- Lowercased, trimmed
  language_detected text,  -- 'en', 'ar', 'mixed'
  filters jsonb,  -- Entity type filters, date ranges, etc.
  results_count integer,
  clicked_result_id uuid,
  clicked_result_type text,
  clicked_rank integer,  -- Position in results (1-based)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_search_queries_user ON search_queries (user_id, created_at DESC);
CREATE INDEX idx_search_queries_normalized ON search_queries (query_text_normalized);
CREATE INDEX idx_search_queries_clicks ON search_queries (query_text_normalized, clicked_result_id)
  WHERE clicked_result_id IS NOT NULL;
```

**Fields**:
- `query_text`: Raw user input
- `query_text_normalized`: Normalized for aggregation (lowercase, trimmed, diacritics removed)
- `language_detected`: Auto-detected language
- `filters`: JSON object with applied filters
- `results_count`: Number of results returned
- `clicked_result_id`: ID of entity user clicked (if any)
- `clicked_result_type`: Entity type ('dossier', 'person', etc.)
- `clicked_rank`: Position in search results (1=first result)

**Privacy**:
- User ID anonymized after 90 days (UPDATE user_id = NULL)
- Aggregated click data retained for analytics
- GDPR compliance: Delete on user request

---

## 5. Search Click Analytics

### Table: `search_click_aggregates`

Aggregated co-click data for "People also looked for" suggestions.

```sql
CREATE TABLE search_click_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text_normalized text NOT NULL,
  followed_by_query_normalized text NOT NULL,
  co_occurrence_count integer DEFAULT 1,
  last_updated timestamptz DEFAULT now(),
  UNIQUE (query_text_normalized, followed_by_query_normalized)
);

CREATE INDEX idx_click_aggregates_query ON search_click_aggregates (query_text_normalized, co_occurrence_count DESC);
```

**Fields**:
- `query_text_normalized`: Original search query
- `followed_by_query_normalized`: Subsequent search query (within 5 minutes)
- `co_occurrence_count`: Number of times this pattern occurred
- `last_updated`: Timestamp of last occurrence

**Lifecycle**:
1. Background job analyzes `search_queries` table hourly
2. Identifies query pairs where user searched A, then searched B within 5 minutes
3. INSERT or UPDATE co-occurrence count
4. Only show suggestion if count >= 10 (privacy threshold)

**Implementation Note**: Deferred to post-MVP (per research.md §9)

---

## 6. Redis Cache Schema

### Suggestion Cache

**Key Pattern**: `search:suggest:{entityType}:{prefix}`
**Data Structure**: Sorted Set (ZSET)
**TTL**: 300 seconds (5 minutes)

```redis
# Example
ZADD search:suggest:dossiers:clim
  0.95 '{"id":"uuid1","title_en":"Climate Action Plan","title_ar":"خطة العمل المناخية","type":"dossier"}'
  0.89 '{"id":"uuid2","title_en":"Climate Treaty 2024","title_ar":"معاهدة المناخ 2024","type":"dossier"}'
  0.82 '{"id":"uuid3","title_en":"Climate Change Report","title_ar":"تقرير تغير المناخ","type":"dossier"}'

EXPIRE search:suggest:dossiers:clim 300
```

**Fields**:
- **Score**: Relevance score (0.0 - 1.0)
- **Value**: JSON-encoded suggestion object

### Search Result Cache

**Key Pattern**: `search:results:{queryHash}:{filters}`
**Data Structure**: String (JSON)
**TTL**: 60 seconds (1 minute)

```redis
# Example
SET search:results:abc123:type=dossier '{"results":[...],"total":42,"took_ms":87}' EX 60
```

### Count Cache

**Key Pattern**: `search:count:{entityType}:{queryHash}`
**Data Structure**: String (integer)
**TTL**: 300 seconds (5 minutes)

```redis
# Example
SET search:count:dossiers:abc123 "42" EX 300
```

---

## 7. Database Functions

### Function: `search_entities_fulltext`

Performs full-text search across an entity type.

```sql
CREATE OR REPLACE FUNCTION search_entities_fulltext(
  p_entity_type text,
  p_query text,
  p_language text DEFAULT 'english',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  entity_id uuid,
  entity_title text,
  entity_snippet text,
  rank_score real
) AS $$
DECLARE
  v_table_name text;
  v_tsquery tsquery;
BEGIN
  -- Sanitize entity type (prevent SQL injection)
  v_table_name := CASE p_entity_type
    WHEN 'dossiers' THEN 'dossiers'
    WHEN 'people' THEN 'staff_profiles'
    WHEN 'engagements' THEN 'engagements'
    WHEN 'positions' THEN 'positions'
    WHEN 'documents' THEN 'attachments'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Convert query to tsquery
  v_tsquery := plainto_tsquery(p_language, p_query);

  -- Execute search (dynamic SQL required)
  RETURN QUERY EXECUTE format(
    'SELECT
      id,
      COALESCE(title_en, name_en) as entity_title,
      ts_headline($1, COALESCE(description_en, summary_en, ''''), ''StartSel=<mark>, StopSel=</mark>'') as entity_snippet,
      ts_rank_cd(search_vector, $2) as rank_score
    FROM %I
    WHERE search_vector @@ $2
    ORDER BY rank_score DESC
    LIMIT $3 OFFSET $4',
    v_table_name
  ) USING p_language, v_tsquery, p_limit, p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### Function: `search_entities_semantic`

Performs semantic search using vector embeddings.

```sql
CREATE OR REPLACE FUNCTION search_entities_semantic(
  p_entity_type text,
  p_query_embedding vector(1536),
  p_similarity_threshold real DEFAULT 0.6,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  entity_id uuid,
  entity_title text,
  similarity_score real
) AS $$
DECLARE
  v_table_name text;
BEGIN
  -- Sanitize entity type
  v_table_name := CASE p_entity_type
    WHEN 'positions' THEN 'positions'
    WHEN 'documents' THEN 'attachments'
    WHEN 'briefs' THEN 'briefs'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Entity type does not support semantic search: %', p_entity_type;
  END IF;

  -- Execute vector search
  RETURN QUERY EXECUTE format(
    'SELECT
      id,
      COALESCE(title_en, name_en) as entity_title,
      1 - (embedding <=> $1) as similarity_score
    FROM %I
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1) >= $2
    ORDER BY embedding <=> $1
    LIMIT $3',
    v_table_name
  ) USING p_query_embedding, p_similarity_threshold, p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 8. Triggers for Real-Time Updates

### Trigger: Update Embedding Queue

Automatically queue entities for embedding updates when content changes.

```sql
CREATE OR REPLACE FUNCTION trg_queue_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if title/description changed
  IF (TG_OP = 'INSERT') OR
     (OLD.title_en IS DISTINCT FROM NEW.title_en) OR
     (OLD.title_ar IS DISTINCT FROM NEW.title_ar) OR
     (OLD.description_en IS DISTINCT FROM NEW.description_en) OR
     (OLD.description_ar IS DISTINCT FROM NEW.description_ar) THEN

    INSERT INTO embedding_update_queue (entity_type, entity_id, priority)
    VALUES (TG_TABLE_NAME, NEW.id, 5)
    ON CONFLICT (entity_type, entity_id) WHERE processed_at IS NULL
    DO UPDATE SET created_at = now(), retry_count = 0;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to searchable entities with embeddings
CREATE TRIGGER trg_positions_embedding_update
AFTER INSERT OR UPDATE OF title_en, title_ar, description_en, description_ar
ON positions
FOR EACH ROW
EXECUTE FUNCTION trg_queue_embedding_update();

CREATE TRIGGER trg_attachments_embedding_update
AFTER INSERT OR UPDATE OF file_name, description_en, description_ar
ON attachments
FOR EACH ROW
EXECUTE FUNCTION trg_queue_embedding_update();
```

---

## 9. Entity-Specific Considerations

### Dossiers

**Searchable Fields**:
- title_en, title_ar (weight A)
- summary_en, summary_ar (weight B)
- background_en, background_ar (weight C)

**Additional Indexes**:
- `status` (filter archived dossiers)
- `created_at` (recency boost)

### People (staff_profiles + external_contacts)

**Searchable Fields**:
- full_name_en, full_name_ar (weight A)
- title_position_en, title_position_ar (weight B)
- organization_en, organization_ar (weight C)

**Merged View**:
```sql
CREATE VIEW search_people AS
SELECT id, 'staff' as person_type, full_name_en, full_name_ar, title_en, title_ar FROM staff_profiles
UNION ALL
SELECT id, 'external' as person_type, full_name_en, full_name_ar, title_en, title_ar FROM external_contacts;
```

### Engagements

**Searchable Fields**:
- title_en, title_ar (weight A)
- description_en, description_ar (weight B)
- objectives_en, objectives_ar (weight C)

### Positions

**Searchable Fields**:
- title_en, title_ar (weight A)
- key_messages_en, key_messages_ar (weight B)
- background_en, background_ar (weight C)

**Semantic Search**: Enabled (embedding column)

### Documents (attachments)

**Searchable Fields**:
- file_name (weight A)
- description_en, description_ar (weight B)
- extracted_text_en, extracted_text_ar (weight C - OCR/PDF extraction)

**Semantic Search**: Enabled (embedding column)

---

## 10. Row Level Security (RLS) Policies

All search queries must respect existing RLS policies on underlying tables.

```sql
-- Example: Search respects dossier visibility
CREATE POLICY search_dossiers_policy ON dossiers
FOR SELECT
USING (
  -- User's organization matches
  organization_id = auth.jwt() ->> 'organization_id'
  OR
  -- Dossier is public
  visibility = 'public'
  OR
  -- User is owner
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = dossiers.id
    AND user_id = auth.uid()
  )
);
```

**Search Implementation**:
- Search functions run with `SECURITY DEFINER` but still enforce RLS
- Restricted results are counted but not returned
- Count displayed to user: "3 additional results require higher permissions"

---

## 11. Performance Indexes

### Covering Indexes

Avoid table lookups by including all frequently accessed columns.

```sql
-- Dossiers covering index
CREATE INDEX idx_dossiers_search_covering ON dossiers (
  id, title_en, title_ar, summary_en, summary_ar, status, updated_at
) WHERE status != 'deleted';

-- Positions covering index
CREATE INDEX idx_positions_search_covering ON positions (
  id, title_en, title_ar, status, updated_at
) WHERE status = 'published';
```

### Partial Indexes

Index only active/published records to reduce index size.

```sql
CREATE INDEX idx_dossiers_active_search ON dossiers (search_vector)
WHERE status IN ('active', 'archived');

CREATE INDEX idx_positions_published_search ON positions (search_vector)
WHERE status = 'published';
```

---

## 12. Data Retention

### Search Queries

- User-identified data: 90 days
- Anonymized aggregates: 2 years
- Click analytics: Indefinitely (aggregated only)

### Embedding Queue

- Processed records: 7 days
- Failed records: 30 days (for debugging)

### Redis Cache

- Suggestions: 5 minutes
- Results: 1 minute
- Counts: 5 minutes

---

## Summary

| Entity Type | Full-Text | Fuzzy Match | Semantic | Notes |
|-------------|-----------|-------------|----------|-------|
| Dossiers | ✓ | ✓ | - | Primary entity type |
| People | ✓ | ✓ | - | Merged view of staff + external contacts |
| Engagements | ✓ | ✓ | - | - |
| Positions | ✓ | ✓ | ✓ | Semantic search enabled |
| Documents | ✓ | ✓ | ✓ | Includes OCR text extraction |
| Briefs | - | - | ✓ | Semantic only (attached to dossiers) |

**Total Searchable Entities**: 6 types across 50,000 estimated records

---

**Status**: Ready for API contract design (Phase 1 continues with contracts/)
