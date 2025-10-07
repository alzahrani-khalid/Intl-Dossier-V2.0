# Data Model: Positions UI Critical Integrations
**Feature Branch**: `012-positions-ui-critical`
**Date**: 2025-10-01

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│   Dossiers      │       │ Engagement_Positions │       │   Positions     │
│                 │       │   (Junction Table)   │       │                 │
│ • id (PK)       │       │                      │       │ • id (PK)       │
│ • title         │       │ • id (PK)            │       │ • dossier_id    │
│ • status        │       │ • engagement_id (FK) │◄──────│ • title         │
└─────────────────┘       │ • position_id (FK)   │       │ • content       │
        │                 │ • attached_by (FK)   │       │ • type          │
        │                 │ • attached_at        │       │ • status        │
        │                 │ • attachment_reason  │       │ • language      │
        │                 │ • display_order      │       │ • created_at    │
        │                 │ • relevance_score    │       │ • updated_at    │
        │                 └──────────────────────┘       └─────────────────┘
        │                           │                              │
        │                           │                              │
        │                  ┌────────▼────────┐                     │
        └─────────────────►│   Engagements   │                     │
                           │                 │                     │
                           │ • id (PK)       │                     │
                           │ • dossier_id    │                     │
                           │ • title         │                     │
                           │ • description   │                     │
                           │ • date          │                     │
                           │ • stakeholders  │                     │
                           └─────────────────┘                     │
                                   │                               │
                                   │                               │
                          ┌────────▼────────┐                      │
                          │ Position_       │                      │
                          │ Suggestions     │                      │
                          │                 │                      │
                          │ • id (PK)       │                      │
                          │ • engagement_id │                      │
                          │ • position_id   │──────────────────────┘
                          │ • relevance     │
                          │ • reasoning     │
                          │ • created_at    │
                          │ • user_action   │
                          └─────────────────┘

┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│ Briefing_Packs  │       │ Position_Usage_      │       │ Position_       │
│                 │       │ Analytics            │       │ Embeddings      │
│ • id (PK)       │       │                      │       │                 │
│ • engagement_id │       │ • id (PK)            │       │ • id (PK)       │
│ • position_ids  │       │ • position_id (FK)   │       │ • position_id   │
│ • language      │       │ • view_count         │       │ • embedding     │
│ • generated_by  │       │ • attachment_count   │       │ • model_version │
│ • generated_at  │       │ • briefing_count     │       │ • created_at    │
│ • file_url      │       │ • last_viewed_at     │       │ • updated_at    │
│ • expires_at    │       │ • trend_data         │       └─────────────────┘
└─────────────────┘       └──────────────────────┘
```

## Core Entities

### 1. Engagement_Positions (Junction Table)
**Purpose**: Manages many-to-many relationship between engagements and positions with rich metadata.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `engagement_id` | UUID | FOREIGN KEY → engagements(id), NOT NULL, ON DELETE CASCADE | Associated engagement |
| `position_id` | UUID | FOREIGN KEY → positions(id), NOT NULL, ON DELETE RESTRICT | Associated position |
| `attached_by` | UUID | FOREIGN KEY → users(id), NOT NULL | User who attached the position |
| `attached_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When position was attached |
| `attachment_reason` | TEXT | NULLABLE | Optional explanation for attachment |
| `display_order` | INTEGER | NULLABLE | Order for displaying positions in engagement |
| `relevance_score` | DECIMAL(3,2) | NULLABLE, CHECK (relevance_score BETWEEN 0 AND 1) | AI-generated relevance (0.00-1.00) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

**Indexes**:
- `idx_engagement_positions_engagement_id` ON `engagement_id`
- `idx_engagement_positions_position_id` ON `position_id`
- `idx_engagement_positions_attached_by` ON `attached_by`

**Constraints**:
- `UNIQUE(engagement_id, position_id)` - Prevent duplicate attachments
- `CHECK(engagement_id != position_id)` - Sanity check (different entity types)

**Validation Rules** (Application Layer):
- User must have edit access to parent dossier to attach/detach (FR-043)
- Cannot attach more than 100 positions per engagement (FR-040)
- Cannot delete position if attached to any engagement (FR-011)

**State Transitions**:
```
[Not Attached] ──attach()──> [Attached]
                              │
                              │ detach()
                              ▼
                          [Detached]
```

---

### 2. Position_Suggestions
**Purpose**: Stores AI-generated position recommendations for engagements.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `engagement_id` | UUID | FOREIGN KEY → engagements(id), NOT NULL, ON DELETE CASCADE | Associated engagement |
| `position_id` | UUID | FOREIGN KEY → positions(id), NOT NULL, ON DELETE CASCADE | Suggested position |
| `relevance_score` | DECIMAL(3,2) | NOT NULL, CHECK (relevance_score BETWEEN 0 AND 1) | Similarity score (0.00-1.00) |
| `suggestion_reasoning` | JSONB | NULLABLE | Explanation of why suggested (keywords, context factors) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When suggestion was generated |
| `user_action` | TEXT | NULLABLE, CHECK (user_action IN ('accepted', 'rejected', 'ignored')) | How user responded |
| `actioned_at` | TIMESTAMPTZ | NULLABLE | When user took action |

**Indexes**:
- `idx_position_suggestions_engagement_id` ON `engagement_id`
- `idx_position_suggestions_relevance` ON `relevance_score DESC`
- `idx_position_suggestions_created_at` ON `created_at DESC`

**Validation Rules**:
- Suggestions expire after 24 hours (re-generate on engagement update)
- Minimum relevance_score of 0.70 to be shown (threshold from research.md)
- Maximum 20 suggestions per engagement

**State Transitions**:
```
[Generated] ──user views──> [Visible]
                              │
                              ├─ accept() ──> [Accepted] (creates engagement_position)
                              ├─ reject() ──> [Rejected]
                              └─ timeout ──> [Ignored]
```

---

### 3. Briefing_Packs
**Purpose**: Represents generated PDF documents combining engagement details and positions.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `engagement_id` | UUID | FOREIGN KEY → engagements(id), NOT NULL, ON DELETE CASCADE | Associated engagement |
| `position_ids` | UUID[] | NOT NULL, CHECK (array_length(position_ids, 1) > 0) | Array of included position IDs |
| `language` | TEXT | NOT NULL, CHECK (language IN ('en', 'ar')) | Briefing pack language |
| `generated_by` | UUID | FOREIGN KEY → users(id), NOT NULL | User who generated the pack |
| `generated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Generation timestamp |
| `file_url` | TEXT | NOT NULL | Supabase Storage URL for PDF |
| `file_size_bytes` | BIGINT | NOT NULL | PDF file size |
| `expires_at` | TIMESTAMPTZ | NULLABLE | When briefing pack expires (if applicable) |
| `metadata` | JSONB | NULLABLE | Additional metadata (page count, template version, etc.) |

**Indexes**:
- `idx_briefing_packs_engagement_id` ON `engagement_id`
- `idx_briefing_packs_generated_at` ON `generated_at DESC`
- `idx_briefing_packs_expires_at` ON `expires_at` WHERE `expires_at IS NOT NULL`

**Validation Rules**:
- Maximum 100 positions per briefing pack (FR-041)
- Generation timeout: 10 seconds per 100 positions
- Retry up to 3 times on generation failure
- Auto-translate positions if language mismatch (FR-021)

**State Transitions**:
```
[Requested] ──generate()──> [Generating] ──success──> [Available]
                              │                          │
                              │ failure                  │ expires_at reached
                              ▼                          ▼
                          [Failed]                   [Expired]
                              │                          │
                              │ retry()                  │
                              └──────────────────────────┘
```

---

### 4. Position_Usage_Analytics
**Purpose**: Tracks position usage metrics for analytics and insights.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `position_id` | UUID | FOREIGN KEY → positions(id), NOT NULL, ON DELETE CASCADE, UNIQUE | Associated position |
| `view_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (view_count >= 0) | Total views |
| `attachment_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (attachment_count >= 0) | Times attached to engagements |
| `briefing_pack_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (briefing_pack_count >= 0) | Times included in briefing packs |
| `last_viewed_at` | TIMESTAMPTZ | NULLABLE | Most recent view timestamp |
| `last_attached_at` | TIMESTAMPTZ | NULLABLE | Most recent attachment timestamp |
| `trend_data` | JSONB | NULLABLE | Usage trends over time (daily/weekly/monthly) |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last analytics update |

**Indexes**:
- `idx_position_usage_position_id` ON `position_id` (unique)
- `idx_position_usage_attachment_count` ON `attachment_count DESC`
- `idx_position_usage_briefing_count` ON `briefing_pack_count DESC`

**Validation Rules**:
- Counters increment atomically (no race conditions)
- Trend data updated daily via scheduled job
- Analytics refreshed on each position interaction

**Computed Fields** (Application Layer):
- `popularity_score`: Weighted formula combining views, attachments, briefings
- `usage_rank`: Position's rank among all positions by popularity

---

### 5. Position_Embeddings
**Purpose**: Stores vector embeddings for AI-powered position suggestions.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `position_id` | UUID | FOREIGN KEY → positions(id), NOT NULL, ON DELETE CASCADE, UNIQUE | Associated position |
| `embedding` | VECTOR(1536) | NOT NULL | pgvector embedding (OpenAI ada-002 dimensionality) |
| `model_version` | TEXT | NOT NULL | Embedding model version for future migrations |
| `source_text` | TEXT | NOT NULL | Text used to generate embedding (for debugging) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Embedding creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last embedding update |

**Indexes**:
- `idx_position_embeddings_position_id` ON `position_id` (unique)
- `idx_position_embeddings_vector` USING ivfflat (`embedding` vector_cosine_ops) WITH (lists = 100)

**Validation Rules**:
- Re-generate embedding when position content changes significantly (>20% edit)
- Batch generate embeddings for new positions (avoid AnythingLLM overload)
- Circuit breaker on embedding service failures (fallback to keyword search)

**Operations**:
- `match_positions(query_embedding, threshold, limit)`: Find similar positions using cosine similarity
- `update_embedding(position_id)`: Regenerate embedding when content changes

---

## Extended Entities (from existing system)

### Dossier-Position Context
**Purpose**: Extends position data to show dossier associations and context-specific metadata.

**Virtual Relationship** (query-time join, not a separate table):
```sql
SELECT
  p.id,
  p.title,
  p.content,
  d.id AS dossier_id,
  d.title AS dossier_title,
  COUNT(ep.id) AS engagement_attachment_count
FROM positions p
JOIN dossiers d ON p.dossier_id = d.id
LEFT JOIN engagement_positions ep ON p.id = ep.position_id
WHERE d.id = :dossier_id
GROUP BY p.id, d.id;
```

**Contextual Attributes** (computed):
- `dossier_id`: Parent dossier
- `position_id`: Position identifier
- `contextual_tags`: Dossier-specific categorization
- `display_order`: Order within dossier's positions tab
- `engagement_count`: Number of engagements using this position

---

## Relationships

### One-to-Many
- `Dossiers (1) → Positions (N)`: One dossier has many positions
- `Users (1) → Engagement_Positions (N)`: One user attaches many positions
- `Users (1) → Briefing_Packs (N)`: One user generates many briefing packs
- `Positions (1) → Position_Embeddings (1)`: One position has one embedding (1:1 actually)

### Many-to-Many
- `Engagements (N) ↔ Positions (N)` via `Engagement_Positions`: Many engagements can include many positions

### Self-Referential
- None

---

## Database Triggers & Functions

### 1. Auto-update Engagement_Positions.updated_at
```sql
CREATE OR REPLACE FUNCTION update_engagement_positions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER engagement_positions_updated_at
BEFORE UPDATE ON engagement_positions
FOR EACH ROW
EXECUTE FUNCTION update_engagement_positions_timestamp();
```

### 2. Increment Position_Usage_Analytics on Attachment
```sql
CREATE OR REPLACE FUNCTION increment_position_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO position_usage_analytics (position_id, attachment_count, last_attached_at)
  VALUES (NEW.position_id, 1, now())
  ON CONFLICT (position_id)
  DO UPDATE SET
    attachment_count = position_usage_analytics.attachment_count + 1,
    last_attached_at = now(),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER position_attached
AFTER INSERT ON engagement_positions
FOR EACH ROW
EXECUTE FUNCTION increment_position_attachment_count();
```

### 3. Prevent Position Deletion if Attached
```sql
CREATE OR REPLACE FUNCTION prevent_position_deletion_if_attached()
RETURNS TRIGGER AS $$
DECLARE
  attachment_count INTEGER;
  engagement_titles TEXT;
BEGIN
  SELECT COUNT(*), string_agg(e.title, ', ')
  INTO attachment_count, engagement_titles
  FROM engagement_positions ep
  JOIN engagements e ON ep.engagement_id = e.id
  WHERE ep.position_id = OLD.id;

  IF attachment_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete position: attached to % engagement(s): %',
      attachment_count, engagement_titles
    USING HINT = 'Detach position from all engagements before deletion';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER position_deletion_check
BEFORE DELETE ON positions
FOR EACH ROW
EXECUTE FUNCTION prevent_position_deletion_if_attached();
```

### 4. Vector Similarity Search Function
```sql
CREATE OR REPLACE FUNCTION match_positions(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  position_id uuid,
  relevance_score float,
  position_title text,
  position_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.position_id,
    1 - (pe.embedding <=> query_embedding) AS relevance_score,
    p.title AS position_title,
    p.type AS position_type
  FROM position_embeddings pe
  JOIN positions p ON pe.position_id = p.id
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY relevance_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## RLS Policies

### Engagement_Positions
```sql
-- View: Users can see attachments for engagements in dossiers they have access to
CREATE POLICY "Users can view engagement positions" ON engagement_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = engagement_positions.engagement_id
    AND (
      d.is_public = true
      OR d.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid())
    )
  )
);

-- Insert: Only dossier collaborators can attach positions
CREATE POLICY "Dossier collaborators can attach positions" ON engagement_positions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = engagement_positions.engagement_id
    AND (
      d.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid())
    )
  )
);

-- Delete: Only dossier collaborators can detach positions
CREATE POLICY "Dossier collaborators can detach positions" ON engagement_positions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = engagement_positions.engagement_id
    AND (
      d.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid())
    )
  )
);
```

### Position_Suggestions
```sql
-- View: Users can see suggestions for engagements they have access to
CREATE POLICY "Users can view position suggestions" ON position_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = position_suggestions.engagement_id
    AND (
      d.is_public = true
      OR d.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid())
    )
  )
);

-- Insert: System-only (AI service creates suggestions)
CREATE POLICY "System creates suggestions" ON position_suggestions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL); -- Any authenticated user (AI service uses service role)

-- Update: Users can mark suggestions as accepted/rejected
CREATE POLICY "Users can update suggestion actions" ON position_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = position_suggestions.engagement_id
    AND (d.created_by = auth.uid() OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid()))
  )
)
WITH CHECK (user_action IN ('accepted', 'rejected', 'ignored'));
```

### Briefing_Packs
```sql
-- View: Users can view briefing packs for engagements they have access to
CREATE POLICY "Users can view briefing packs" ON briefing_packs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = briefing_packs.engagement_id
    AND (
      d.is_public = true
      OR d.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid())
    )
  )
);

-- Insert: Users can generate briefing packs for engagements they have access to
CREATE POLICY "Users can generate briefing packs" ON briefing_packs
FOR INSERT
WITH CHECK (
  generated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = briefing_packs.engagement_id
    AND (d.created_by = auth.uid() OR EXISTS (SELECT 1 FROM dossier_collaborators WHERE dossier_id = d.id AND user_id = auth.uid()))
  )
);
```

### Position_Usage_Analytics
```sql
-- View: All authenticated users can view usage analytics
CREATE POLICY "Users can view position analytics" ON position_usage_analytics
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert/Update: System-only (automated by triggers and cron jobs)
CREATE POLICY "System updates analytics" ON position_usage_analytics
FOR ALL
USING (false) -- No direct user access
WITH CHECK (false);
```

---

## Migration Strategy

### Phase 1: Core Tables
1. Create `engagement_positions` junction table
2. Create `position_suggestions` table
3. Create `briefing_packs` table

### Phase 2: Analytics & AI
4. Create `position_usage_analytics` table
5. Create `position_embeddings` table with pgvector extension
6. Add vector indexes (ivfflat)

### Phase 3: Triggers & Functions
7. Create timestamp update triggers
8. Create analytics increment triggers
9. Create position deletion prevention trigger
10. Create vector similarity search function

### Phase 4: RLS Policies
11. Enable RLS on all new tables
12. Create SELECT, INSERT, UPDATE, DELETE policies
13. Test policy enforcement with different user roles

### Phase 5: Data Backfill
14. Generate embeddings for existing positions (batch job)
15. Initialize analytics counters for existing positions
16. Audit and validate data integrity

---

## Performance Considerations

### Indexes
- B-tree indexes on foreign keys for fast joins
- Partial indexes on `expires_at` (only non-null values)
- Vector index (ivfflat) for similarity search (tune `lists` parameter based on dataset size)

### Query Optimization
- Use `EXPLAIN ANALYZE` for attachment queries (expect <50ms)
- Materialized views for popular positions dashboard (refresh daily)
- Connection pooling for high-concurrency attachment operations

### Caching Strategy
- Redis cache for position suggestions (TTL: 1 hour)
- Client-side cache (TanStack Query) for position lists (staleTime: 5 minutes)
- CDN cache for briefing pack URLs (TTL: 7 days)

---

## Audit & Compliance

### Audit Log Triggers
All critical operations logged to `audit_logs` table:
- Position attachment/detachment (who, when, why)
- Briefing pack generation (what positions included, for which engagement)
- AI suggestion acceptance/rejection (user feedback on AI accuracy)

### Data Retention
- Briefing packs: Retention policy TBD (pending clarification FR-028)
- Position suggestions: 30 days (analytics purposes)
- Usage analytics: Indefinite (aggregated trends)
- Audit logs: 7 years (compliance requirement)

---

## Testing Data Scenarios

### Happy Path
1. User attaches 10 positions to engagement (all succeed)
2. AI suggests 15 relevant positions (75% relevance)
3. User generates bilingual briefing pack (English & Arabic)

### Edge Cases
1. Attempt to attach 101st position (should fail with error)
2. Delete position with 5 engagement attachments (should fail with list of engagements)
3. Generate briefing pack with 100 positions, mixed languages (auto-translate to target language)

### Failure Scenarios
1. AnythingLLM service down (fallback to keyword suggestions)
2. Briefing pack generation timeout (retry with backoff)
3. Concurrent attachment conflicts (optimistic locking with versioning)

---

**Ready for Phase 1 continuation**: API contract generation
