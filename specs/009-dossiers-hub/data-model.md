# Data Model: Dossiers Hub

**Feature**: 009-dossiers-hub
**Date**: 2025-09-30
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────┐
│    dossiers     │
├─────────────────┤
│ id (PK)         │
│ name_en         │───┐
│ name_ar         │   │
│ type            │   │   ┌──────────────────┐
│ status          │   ├──<│ dossier_owners   │
│ sensitivity     │   │   ├──────────────────┤
│ summary_en      │   │   │ dossier_id (FK)  │
│ summary_ar      │   │   │ user_id (FK)     │
│ review_cadence  │   │   │ assigned_at      │
│ last_review     │   │   └──────────────────┘
│ version         │   │
│ tags            │   │   ┌──────────────────┐
│ created_at      │   ├──<│   key_contacts   │
│ updated_at      │   │   ├──────────────────┤
│ archived        │   │   │ dossier_id (FK)  │
└─────────────────┘   │   │ name             │
                      │   │ role             │
                      │   │ organization     │
                      │   │ last_interaction │
                      │   │ contact_info     │
                      │   └──────────────────┘
                      │
                      │   ┌──────────────────┐
                      ├──<│     briefs       │
                      │   ├──────────────────┤
                      │   │ id (PK)          │
                      │   │ dossier_id (FK)  │
                      │   │ content_en       │
                      │   │ content_ar       │
                      │   │ date_range_start │
                      │   │ date_range_end   │
                      │   │ generated_by     │
                      │   │ generated_at     │
                      │   └──────────────────┘
                      │
                      │   ┌───────────────────┐
                      └──<│ dossier_timeline  │ (Materialized View)
                          ├───────────────────┤
                          │ dossier_id        │
                          │ event_type        │
                          │ source_id         │
                          │ event_date        │
                          │ event_title_en    │
                          │ event_title_ar    │
                          │ event_description │
                          └───────────────────┘

External References (existing tables):
- engagements (via dossier_id FK)
- positions (via dossier_id FK)
- mous (via dossier_id FK)
- commitments (via dossier_id FK)
- documents (via dossier_id FK)
- intelligence_signals (via dossier_id FK)
```

## Tables

### 1. dossiers

**Purpose**: Core table storing dossier records for countries, organizations, forums, and themes.

**Schema**:
```sql
CREATE TABLE dossiers (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bilingual names
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,

  -- Classification
  type TEXT NOT NULL CHECK (type IN ('country', 'organization', 'forum', 'theme')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  sensitivity_level TEXT NOT NULL DEFAULT 'low' CHECK (sensitivity_level IN ('low', 'medium', 'high')),

  -- Content (bilingual)
  summary_en TEXT,
  summary_ar TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  review_cadence INTERVAL, -- e.g., '90 days', NULL for no cadence
  last_review_date TIMESTAMP WITH TIME ZONE,

  -- Optimistic locking (from research)
  version INTEGER NOT NULL DEFAULT 1,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived BOOLEAN NOT NULL DEFAULT FALSE,

  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(name_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_en, '')), 'B')
  ) STORED
);

-- Indexes for performance (from research)
CREATE INDEX idx_dossiers_type ON dossiers(type);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_level);
CREATE INDEX idx_dossiers_search ON dossiers USING GIN(search_vector);
CREATE INDEX idx_dossiers_tags ON dossiers USING GIN(tags);
CREATE INDEX idx_dossiers_type_status ON dossiers(type, status) WHERE NOT archived;

-- Auto-update timestamp
CREATE TRIGGER set_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment version (from research)
CREATE TRIGGER dossiers_version_trigger
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();
```

**RLS Policies**:
```sql
-- View: Based on sensitivity and user clearance
CREATE POLICY "view_dossiers_by_clearance"
ON dossiers FOR SELECT
USING (
  get_user_clearance_level(auth.uid()) >=
  CASE sensitivity_level
    WHEN 'low' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'high' THEN 3
  END
);

-- Insert: Authenticated users can create
CREATE POLICY "insert_dossiers_authenticated"
ON dossiers FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Update: Hybrid permission (owner + admin/manager from clarification)
CREATE POLICY "update_dossiers_hybrid_permissions"
ON dossiers FOR UPDATE
USING (can_edit_dossier(id))
WITH CHECK (can_edit_dossier(id) AND version = (SELECT version FROM dossiers WHERE id = dossiers.id));

-- Delete/Archive: Same as update
CREATE POLICY "archive_dossiers_hybrid_permissions"
ON dossiers FOR DELETE
USING (can_edit_dossier(id));
```

**Validation Rules**:
- `name_en` and `name_ar` required, max 200 chars each
- `type` must be one of enum values
- `sensitivity_level` must be valid enum
- `version` must match current for updates (enforced by RLS)
- `tags` array max 20 items, each max 50 chars

---

### 2. dossier_owners

**Purpose**: Many-to-many relationship between dossiers and user owners.

**Schema**:
```sql
CREATE TABLE dossier_owners (
  -- Composite PK
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  role_type TEXT DEFAULT 'owner' CHECK (role_type IN ('owner', 'co-owner', 'reviewer')),

  PRIMARY KEY (dossier_id, user_id)
);

CREATE INDEX idx_dossier_owners_user ON dossier_owners(user_id);
CREATE INDEX idx_dossier_owners_dossier ON dossier_owners(dossier_id);
```

**RLS Policies**:
```sql
-- View: Users see assignments for dossiers they can access
CREATE POLICY "view_dossier_owners"
ON dossier_owners FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
    AND get_user_clearance_level(auth.uid()) >=
      CASE sensitivity_level WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END
  )
);

-- Manage: Only admins/managers can assign owners
CREATE POLICY "manage_dossier_owners_admins_only"
ON dossier_owners FOR ALL
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));
```

---

### 3. key_contacts

**Purpose**: Individuals associated with a dossier (not system users).

**Schema**:
```sql
CREATE TABLE key_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Contact info
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,

  -- Interaction tracking
  last_interaction_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_key_contacts_dossier ON key_contacts(dossier_id);
CREATE INDEX idx_key_contacts_last_interaction ON key_contacts(last_interaction_date DESC);
```

**RLS Policies**:
```sql
-- Inherit permissions from parent dossier
CREATE POLICY "manage_key_contacts_via_dossier"
ON key_contacts FOR ALL
USING (can_edit_dossier(dossier_id))
WITH CHECK (can_edit_dossier(dossier_id));
```

**Validation Rules**:
- `name` required, max 200 chars
- `email` must be valid email format if provided
- `phone` max 50 chars

---

### 4. briefs

**Purpose**: Generated or manually created executive briefs for dossiers.

**Schema**:
```sql
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Bilingual content (JSONB for structured sections)
  content_en JSONB NOT NULL,
  content_ar JSONB NOT NULL,

  -- Metadata
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('ai', 'manual')),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  generated_by_user_id UUID REFERENCES auth.users(id),

  -- Immutable flag
  is_template BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_briefs_dossier ON briefs(dossier_id);
CREATE INDEX idx_briefs_generated_at ON briefs(generated_at DESC);
```

**Content Structure** (JSONB format):
```json
{
  "summary": "Executive summary text...",
  "sections": [
    {
      "title": "Recent Activity",
      "content": "..."
    },
    {
      "title": "Open Commitments",
      "content": "..."
    },
    {
      "title": "Key Positions",
      "content": "..."
    },
    {
      "title": "Relationship Health",
      "content": "..."
    }
  ]
}
```

**RLS Policies**:
```sql
-- View: Inherit from dossier
CREATE POLICY "view_briefs_via_dossier"
ON briefs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
    AND get_user_clearance_level(auth.uid()) >=
      CASE sensitivity_level WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END
  )
);

-- Insert: Users who can edit dossier can create briefs
CREATE POLICY "create_briefs_via_dossier_edit"
ON briefs FOR INSERT
WITH CHECK (can_edit_dossier(dossier_id));
```

**Validation Rules**:
- `content_en` and `content_ar` must have `summary` and `sections` keys
- `generated_by` required
- Briefs are immutable after creation (no UPDATE policy)

---

### 5. dossier_timeline (Materialized View)

**Purpose**: Aggregated timeline of all events related to a dossier from multiple source tables.

**Schema**:
```sql
CREATE MATERIALIZED VIEW dossier_timeline AS
SELECT
  d.id as dossier_id,
  'engagement' as event_type,
  e.id::text as source_id,
  e.date as event_date,
  e.title_en as event_title_en,
  e.title_ar as event_title_ar,
  e.summary_en as event_description_en,
  e.summary_ar as event_description_ar,
  jsonb_build_object('type', e.engagement_type, 'location', e.location) as metadata
FROM dossiers d
JOIN engagements e ON e.dossier_id = d.id

UNION ALL

SELECT
  d.id,
  'position' as event_type,
  p.id::text,
  p.created_at,
  p.title_en,
  p.title_ar,
  p.description_en,
  p.description_ar,
  jsonb_build_object('stance', p.stance, 'priority', p.priority) as metadata
FROM dossiers d
JOIN positions p ON p.dossier_id = d.id

UNION ALL

SELECT
  d.id,
  'mou' as event_type,
  m.id::text,
  m.signed_date,
  m.title_en,
  m.title_ar,
  m.summary_en,
  m.summary_ar,
  jsonb_build_object('status', m.status, 'expiry_date', m.expiry_date) as metadata
FROM dossiers d
JOIN mous m ON m.dossier_id = d.id

UNION ALL

SELECT
  d.id,
  'commitment' as event_type,
  c.id::text,
  c.due_date,
  c.title_en,
  c.title_ar,
  c.description_en,
  c.description_ar,
  jsonb_build_object('status', c.status, 'assignee', c.assignee_id) as metadata
FROM dossiers d
JOIN commitments c ON c.dossier_id = d.id

UNION ALL

SELECT
  d.id,
  'document' as event_type,
  doc.id::text,
  doc.uploaded_at,
  doc.name_en,
  doc.name_ar,
  doc.description_en,
  doc.description_ar,
  jsonb_build_object('file_type', doc.file_type, 'size', doc.file_size) as metadata
FROM dossiers d
JOIN documents doc ON doc.dossier_id = d.id

UNION ALL

SELECT
  d.id,
  'intelligence' as event_type,
  i.id::text,
  i.logged_at,
  i.title_en,
  i.title_ar,
  i.content_en,
  i.content_ar,
  jsonb_build_object('source', i.source, 'confidence', i.confidence_level) as metadata
FROM dossiers d
JOIN intelligence_signals i ON i.dossier_id = d.id;

-- Indexes for cursor-based pagination (from research)
CREATE UNIQUE INDEX idx_timeline_cursor ON dossier_timeline(dossier_id, event_date DESC, event_type, source_id);
CREATE INDEX idx_timeline_dossier ON dossier_timeline(dossier_id);
CREATE INDEX idx_timeline_type ON dossier_timeline(event_type);
```

**Refresh Strategy**:
```sql
-- Manual refresh for now (can optimize to incremental later)
REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_timeline;

-- For Phase 2: Consider trigger-based refresh on source tables
-- or scheduled refresh via pg_cron for performance
```

**Query Pattern** (cursor-based pagination):
```sql
-- First page (50 items)
SELECT * FROM dossier_timeline
WHERE dossier_id = $1
AND event_date <= NOW()
ORDER BY event_date DESC, event_type, source_id
LIMIT 50;

-- Next page (cursor from last item)
SELECT * FROM dossier_timeline
WHERE dossier_id = $1
AND (event_date, event_type, source_id) < ($last_date, $last_type, $last_id)
ORDER BY event_date DESC, event_type, source_id
LIMIT 50;
```

---

## Helper Functions

### 1. increment_version()

```sql
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. update_updated_at_column()

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. can_edit_dossier(dossier_id UUID)

```sql
CREATE OR REPLACE FUNCTION can_edit_dossier(dossier_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User is assigned owner
    EXISTS (
      SELECT 1 FROM dossier_owners
      WHERE dossier_owners.dossier_id = can_edit_dossier.dossier_id
      AND dossier_owners.user_id = auth.uid()
    )
    OR
    -- User is admin/manager
    is_admin_or_manager(auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. get_user_clearance_level(user_id UUID)

```sql
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  clearance INTEGER;
BEGIN
  SELECT
    CASE ur.role
      WHEN 'admin' THEN 3
      WHEN 'manager' THEN 3
      WHEN 'analyst' THEN 2
      ELSE 1
    END INTO clearance
  FROM user_roles ur
  WHERE ur.user_id = get_user_clearance_level.user_id
  ORDER BY clearance DESC
  LIMIT 1;

  RETURN COALESCE(clearance, 1); -- Default to level 1 (low)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. is_admin_or_manager(user_id UUID)

```sql
CREATE OR REPLACE FUNCTION is_admin_or_manager(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = is_admin_or_manager.user_id
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. calculate_relationship_health(dossier_id UUID)

**Purpose**: Calculate relationship health score (0-100) based on engagement frequency, commitment fulfillment rate, and recency.

```sql
CREATE OR REPLACE FUNCTION calculate_relationship_health(dossier_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  engagement_count INTEGER;
  engagement_freq NUMERIC;
  commitment_total INTEGER;
  commitment_fulfilled INTEGER;
  commitment_rate NUMERIC;
  last_event_date TIMESTAMP WITH TIME ZONE;
  recency_score INTEGER;
  total_score INTEGER;
BEGIN
  -- Count engagements in last 365 days
  SELECT COUNT(*)
  INTO engagement_count
  FROM dossier_timeline
  WHERE dossier_timeline.dossier_id = calculate_relationship_health.dossier_id
    AND event_type = 'engagement'
    AND event_date > NOW() - INTERVAL '365 days';

  -- Calculate engagement frequency (normalize to 0-100 scale)
  engagement_freq := LEAST(engagement_count * 10, 100); -- 10+ engagements = 100

  -- Count commitments and fulfilled commitments
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE metadata->>'status' = 'fulfilled')
  INTO commitment_total, commitment_fulfilled
  FROM dossier_timeline
  WHERE dossier_timeline.dossier_id = calculate_relationship_health.dossier_id
    AND event_type = 'commitment';

  -- Calculate commitment fulfillment rate
  IF commitment_total > 0 THEN
    commitment_rate := (commitment_fulfilled::NUMERIC / commitment_total::NUMERIC) * 100;
  ELSE
    commitment_rate := 0;
  END IF;

  -- Get most recent event date
  SELECT MAX(event_date)
  INTO last_event_date
  FROM dossier_timeline
  WHERE dossier_timeline.dossier_id = calculate_relationship_health.dossier_id;

  -- Calculate recency score
  recency_score := CASE
    WHEN last_event_date IS NULL THEN 0
    WHEN last_event_date > NOW() - INTERVAL '30 days' THEN 100
    WHEN last_event_date > NOW() - INTERVAL '90 days' THEN 70
    WHEN last_event_date > NOW() - INTERVAL '180 days' THEN 40
    ELSE 10
  END;

  -- Insufficient data check (per spec edge case)
  IF engagement_count < 3 OR commitment_total = 0 THEN
    RETURN NULL; -- Returns NULL to display "—" in UI
  END IF;

  -- Weighted calculation: 30% engagement + 40% commitment + 30% recency
  total_score := ROUND(
    (engagement_freq * 0.30) +
    (commitment_rate * 0.40) +
    (recency_score * 0.30)
  );

  RETURN COALESCE(total_score, 0);
END;
$$;
```

**Algorithm Breakdown**:
- **Engagement Frequency (30% weight)**: Count of engagements in last 365 days, normalized to 0-100 scale (10+ engagements = max score)
- **Commitment Fulfillment Rate (40% weight)**: Percentage of commitments marked as 'fulfilled' (0-100%)
- **Recency Score (30% weight)**:
  - 100 points: Activity within 30 days
  - 70 points: Activity within 90 days
  - 40 points: Activity within 180 days
  - 10 points: Activity older than 180 days

**Return Values**:
- `NULL`: Insufficient data (< 3 engagements OR 0 commitments) → UI displays "—" with tooltip
- `0-39`: Poor relationship health (red indicator)
- `40-59`: Fair relationship health (orange indicator)
- `60-79`: Good relationship health (yellow indicator)
- `80-100`: Excellent relationship health (green indicator)

**Performance**: Function is marked `STABLE` for query optimization. Results can be cached per request.

**Usage Example**:
```sql
-- Get health score for dossier
SELECT calculate_relationship_health('uuid-here');

-- Include in dossier query
SELECT
  d.*,
  calculate_relationship_health(d.id) as health_score
FROM dossiers d
WHERE d.id = 'uuid-here';
```

---

## Migrations Strategy

**Migration Order**:
1. Create helper functions
2. Create `dossiers` table with indexes and triggers
3. Create `dossier_owners` table
4. Create `key_contacts` table
5. Create `briefs` table
6. Enable RLS on all tables
7. Create RLS policies
8. Create materialized view `dossier_timeline`
9. Add foreign keys to existing tables (engagements, positions, etc.)

**Rollback Strategy**:
- All migrations reversible
- Drop materialized view first
- Drop tables in reverse order
- Drop functions last

---

## TypeScript Types

```typescript
// Generated from database schema
export type DossierType = 'country' | 'organization' | 'forum' | 'theme';
export type DossierStatus = 'active' | 'inactive' | 'archived';
export type SensitivityLevel = 'low' | 'medium' | 'high';
export type GeneratedBy = 'ai' | 'manual';
export type EventType = 'engagement' | 'position' | 'mou' | 'commitment' | 'document' | 'intelligence';

export interface Dossier {
  id: string;
  name_en: string;
  name_ar: string;
  type: DossierType;
  status: DossierStatus;
  sensitivity_level: SensitivityLevel;
  summary_en: string | null;
  summary_ar: string | null;
  tags: string[];
  review_cadence: string | null; // ISO 8601 duration
  last_review_date: string | null; // ISO 8601 datetime
  version: number;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  archived: boolean;
}

export interface DossierOwner {
  dossier_id: string;
  user_id: string;
  assigned_at: string;
  role_type: 'owner' | 'co-owner' | 'reviewer';
}

export interface KeyContact {
  id: string;
  dossier_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  last_interaction_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BriefContent {
  summary: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export interface Brief {
  id: string;
  dossier_id: string;
  content_en: BriefContent;
  content_ar: BriefContent;
  date_range_start: string | null;
  date_range_end: string | null;
  generated_by: GeneratedBy;
  generated_at: string;
  generated_by_user_id: string | null;
  is_template: boolean;
}

export interface TimelineEvent {
  dossier_id: string;
  event_type: EventType;
  source_id: string;
  event_date: string;
  event_title_en: string;
  event_title_ar: string;
  event_description_en: string | null;
  event_description_ar: string | null;
  metadata: Record<string, unknown>;
}
```

---

## Summary

**Tables Created**: 4 physical tables + 1 materialized view
**Helper Functions**: 5 security/utility functions
**RLS Policies**: Full coverage on all tables
**Performance Optimizations**: 10+ indexes, materialized view for aggregation
**Constitutional Compliance**: ✅ Bilingual, ✅ Type-safe schema, ✅ RLS enforced

**Next Phase**: API contract generation (Phase 1 continued)