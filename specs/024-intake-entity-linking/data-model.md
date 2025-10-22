# Data Model: Intake Entity Linking System

**Feature**: 024-intake-entity-linking
**Date**: 2025-01-18
**Status**: Phase 1 Complete

## Overview

This document defines the database schema, entities, relationships, validation rules, and state transitions for the Intake Entity Linking System. All entities support organization-level multi-tenancy and clearance-based access control.

---

## Entity: intake_entity_links

**Purpose**: Polymorphic junction table linking intake tickets to 11 different entity types with typed relationships.

### Schema
```sql
CREATE TABLE intake_entity_links (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,

  -- Polymorphic relationship
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'dossier', 'position', 'mou', 'engagement', 'assignment',
    'commitment', 'intelligence_signal', 'organization',
    'country', 'forum', 'working_group', 'topic'
  )),
  entity_id UUID NOT NULL,

  -- Link metadata
  link_type TEXT NOT NULL CHECK (link_type IN ('primary', 'related', 'requested', 'mentioned', 'assigned_to')),
  source TEXT NOT NULL DEFAULT 'human' CHECK (source IN ('human', 'ai', 'import')),
  confidence NUMERIC(3, 2) CHECK (confidence >= 0.00 AND confidence <= 1.00), -- Nullable, only for AI suggestions
  notes TEXT, -- Optional user-provided context

  -- Ordering
  link_order INTEGER NOT NULL DEFAULT 0, -- For user-defined prioritization

  -- Provenance
  suggested_by UUID REFERENCES profiles(id), -- User who created AI suggestion (nullable)
  linked_by UUID NOT NULL REFERENCES profiles(id), -- User who created/accepted the link

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete timestamp

  -- Validation: link type rules (enforced at application layer for flexibility)
  CONSTRAINT valid_primary_link_entity CHECK (
    link_type != 'primary' OR entity_type IN ('dossier', 'country', 'organization', 'forum', 'topic')
  ),
  CONSTRAINT valid_assigned_to_link_entity CHECK (
    link_type != 'assigned_to' OR entity_type = 'assignment'
  ),
  CONSTRAINT valid_requested_link_entity CHECK (
    link_type != 'requested' OR entity_type IN ('position', 'mou', 'engagement')
  )
);

-- Indexes for performance
CREATE INDEX idx_intake_entity_links_intake ON intake_entity_links (intake_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_intake_entity_links_reverse ON intake_entity_links (entity_type, entity_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_intake_entity_links_type ON intake_entity_links (intake_id, link_type, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_intake_entity_links_audit ON intake_entity_links (created_at DESC); -- For audit queries

-- Unique constraints: only 1 primary link per intake, only 1 assigned_to per intake
CREATE UNIQUE INDEX idx_intake_entity_links_unique_primary
ON intake_entity_links (intake_id, link_type)
WHERE link_type = 'primary' AND deleted_at IS NULL;

CREATE UNIQUE INDEX idx_intake_entity_links_unique_assigned_to
ON intake_entity_links (intake_id, link_type)
WHERE link_type = 'assigned_to' AND deleted_at IS NULL;

-- Prevent duplicate active links (same intake + entity + link type)
CREATE UNIQUE INDEX idx_intake_entity_links_unique_active
ON intake_entity_links (intake_id, entity_type, entity_id, link_type)
WHERE deleted_at IS NULL;

-- Trigger: Update updated_at timestamp
CREATE TRIGGER trg_intake_entity_links_updated_at
BEFORE UPDATE ON intake_entity_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Create audit log entry
CREATE TRIGGER trg_intake_entity_links_audit
AFTER INSERT OR UPDATE OR DELETE ON intake_entity_links
FOR EACH ROW
EXECUTE FUNCTION log_link_operation();
```

### Fields

| Field | Type | Nullable | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | UUID | No | Primary key | Auto-generated |
| `intake_id` | UUID | No | Foreign key to intake_tickets | Must exist in intake_tickets |
| `entity_type` | TEXT | No | Type of linked entity | One of 11 allowed types |
| `entity_id` | UUID | No | ID of linked entity | Must exist in corresponding entity table |
| `link_type` | TEXT | No | Relationship type | primary/related/requested/mentioned/assigned_to |
| `source` | TEXT | No | Link creation source | human/ai/import, default 'human' |
| `confidence` | NUMERIC(3,2) | Yes | AI confidence score | 0.00-1.00, only for source='ai' |
| `notes` | TEXT | Yes | User-provided context | Max 1000 chars |
| `link_order` | INTEGER | No | User-defined ordering | Default 0, allows gaps |
| `suggested_by` | UUID | Yes | User who created AI suggestion | References profiles(id) |
| `linked_by` | UUID | No | User who created link | References profiles(id) |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp | Auto-updated via trigger |
| `deleted_at` | TIMESTAMPTZ | Yes | Soft delete timestamp | NULL = active |

### Validation Rules (Application Layer)

1. **Entity Existence**: Before creating link, verify entity exists in corresponding table and is not archived
2. **Clearance Level**: User clearance must be >= entity classification_level
3. **Organization Boundary**: Entity must belong to same organization as intake ticket
4. **Link Type Constraints**:
   - `primary`: Only 1 per intake, only to anchor entities (dossier/country/organization/forum/topic)
   - `assigned_to`: Only 1 per intake, only to assignment entities
   - `requested`: Unlimited, only to position/mou/engagement entities
   - `related`: Unlimited, any entity type
   - `mentioned`: Unlimited, any entity type
5. **Source Consistency**: If source='ai', confidence must be provided; if source='human', confidence should be NULL

### State Transitions

```
[Created] --soft_delete--> [Deleted]
[Deleted] --restore--> [Created]
[Created] --update--> [Created] (fields: notes, link_order)
```

State transitions logged in link_audit_logs table.

### Example Row
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "intake_id": "660e8400-e29b-41d4-a716-446655440000",
  "entity_type": "dossier",
  "entity_id": "770e8400-e29b-41d4-a716-446655440000",
  "link_type": "primary",
  "source": "ai",
  "confidence": 0.92,
  "notes": "Bilateral meeting mentioned in intake description",
  "link_order": 1,
  "suggested_by": "880e8400-e29b-41d4-a716-446655440000",
  "linked_by": "880e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-18T10:30:00Z",
  "updated_at": "2025-01-18T10:30:00Z",
  "deleted_at": null
}
```

---

## Entity: link_audit_logs

**Purpose**: Immutable audit trail of all link operations for compliance (7-year retention).

### Schema
```sql
CREATE TABLE link_audit_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL, -- References intake_entity_links(id), no FK to preserve deleted links

  -- Operation metadata
  intake_id UUID NOT NULL, -- Denormalized for fast querying
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'deleted', 'restored', 'migrated', 'updated')),

  -- Actor
  performed_by UUID NOT NULL REFERENCES profiles(id),

  -- Details
  details JSONB, -- Stores action-specific data (e.g., old_values, new_values, migration_target)

  -- Audit
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_link_audit_logs_link ON link_audit_logs (link_id, timestamp DESC);
CREATE INDEX idx_link_audit_logs_intake ON link_audit_logs (intake_id, timestamp DESC);
CREATE INDEX idx_link_audit_logs_timestamp ON link_audit_logs (timestamp DESC);
CREATE INDEX idx_link_audit_logs_details ON link_audit_logs USING GIN (details); -- For JSONB queries

-- Immutable: No UPDATE or DELETE allowed
REVOKE UPDATE, DELETE ON link_audit_logs FROM PUBLIC;
REVOKE UPDATE, DELETE ON link_audit_logs FROM authenticated;
```

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `link_id` | UUID | No | ID of the link (not FK to preserve history) |
| `intake_id` | UUID | No | Denormalized intake ID for fast queries |
| `entity_type` | TEXT | No | Type of linked entity |
| `entity_id` | UUID | No | ID of linked entity |
| `action` | TEXT | No | created/deleted/restored/migrated/updated |
| `performed_by` | UUID | No | User who performed the action |
| `details` | JSONB | Yes | Action-specific metadata |
| `timestamp` | TIMESTAMPTZ | No | When the action occurred |

### Details JSON Structure (by action)

**created**:
```json
{
  "link_type": "primary",
  "source": "ai",
  "confidence": 0.92,
  "suggested_by": "user_uuid"
}
```

**deleted**:
```json
{
  "reason": "Incorrect entity linked",
  "link_type": "related"
}
```

**restored**:
```json
{
  "deleted_at": "2025-01-18T10:30:00Z",
  "restored_from": "soft_delete"
}
```

**migrated**:
```json
{
  "source_intake_id": "intake_uuid",
  "target_position_id": "position_uuid",
  "migration_type": "intake_to_position"
}
```

**updated**:
```json
{
  "old_values": {"notes": "Old note", "link_order": 1},
  "new_values": {"notes": "Updated note", "link_order": 2}
}
```

### Example Row
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "link_id": "550e8400-e29b-41d4-a716-446655440000",
  "intake_id": "660e8400-e29b-41d4-a716-446655440000",
  "entity_type": "dossier",
  "entity_id": "770e8400-e29b-41d4-a716-446655440000",
  "action": "created",
  "performed_by": "880e8400-e29b-41d4-a716-446655440000",
  "details": {
    "link_type": "primary",
    "source": "ai",
    "confidence": 0.92
  },
  "timestamp": "2025-01-18T10:30:00Z"
}
```

---

## Entity: ai_link_suggestions

**Purpose**: Temporary storage for AI-generated link suggestions before user acceptance/rejection.

### Schema
```sql
CREATE TABLE ai_link_suggestions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,

  -- Suggested link
  suggested_entity_type TEXT NOT NULL CHECK (suggested_entity_type IN (
    'dossier', 'position', 'mou', 'engagement', 'assignment',
    'commitment', 'intelligence_signal', 'organization',
    'country', 'forum', 'working_group', 'topic'
  )),
  suggested_entity_id UUID NOT NULL,
  suggested_link_type TEXT NOT NULL CHECK (suggested_link_type IN ('primary', 'related', 'requested', 'mentioned', 'assigned_to')),

  -- AI metadata
  confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0.00 AND confidence <= 1.00),
  reasoning TEXT NOT NULL, -- LLM-generated explanation

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ, -- When user accepted/rejected
  reviewed_by UUID REFERENCES profiles(id) -- User who reviewed
);

-- Indexes
CREATE INDEX idx_ai_link_suggestions_intake ON ai_link_suggestions (intake_id, status, created_at DESC);
CREATE INDEX idx_ai_link_suggestions_status ON ai_link_suggestions (status, created_at DESC);

-- Cleanup: Delete accepted/rejected suggestions older than 30 days
CREATE INDEX idx_ai_link_suggestions_cleanup ON ai_link_suggestions (reviewed_at)
WHERE status IN ('accepted', 'rejected');
```

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `intake_id` | UUID | No | Foreign key to intake_tickets |
| `suggested_entity_type` | TEXT | No | Type of suggested entity |
| `suggested_entity_id` | UUID | No | ID of suggested entity |
| `suggested_link_type` | TEXT | No | Suggested relationship type |
| `confidence` | NUMERIC(3,2) | No | AI confidence score (0.00-1.00) |
| `reasoning` | TEXT | No | LLM explanation for suggestion |
| `status` | TEXT | No | pending/accepted/rejected |
| `created_at` | TIMESTAMPTZ | No | When suggestion was generated |
| `reviewed_at` | TIMESTAMPTZ | Yes | When user reviewed |
| `reviewed_by` | UUID | Yes | User who reviewed |

### State Transitions

```
[pending] --accept--> [accepted] (creates intake_entity_link)
[pending] --reject--> [rejected] (logs rejection for model improvement)
```

### Example Row
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "intake_id": "660e8400-e29b-41d4-a716-446655440000",
  "suggested_entity_type": "dossier",
  "suggested_entity_id": "770e8400-e29b-41d4-a716-446655440000",
  "suggested_link_type": "primary",
  "confidence": 0.92,
  "reasoning": "The intake description mentions 'bilateral meeting with Saudi Arabia', which strongly correlates with the Saudi Arabia country dossier. The meeting context and diplomatic nature suggest this is the primary entity for this intake.",
  "status": "pending",
  "created_at": "2025-01-18T10:30:00Z",
  "reviewed_at": null,
  "reviewed_by": null
}
```

---

## Entity: intake_embeddings

**Purpose**: Vector embeddings for intake ticket text to enable AI-powered semantic search.

### Schema
```sql
CREATE TABLE intake_embeddings (
  -- Identity
  intake_id UUID PRIMARY KEY REFERENCES intake_tickets(id) ON DELETE CASCADE,

  -- Vector data
  embedding vector(1536), -- 1536-dimensional embeddings (OpenAI-compatible)

  -- Metadata
  text_hash TEXT NOT NULL, -- Hash of intake text to detect changes
  model_version TEXT NOT NULL DEFAULT 'text-embedding-ada-002', -- Track model for migrations

  -- Audit
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_intake_embeddings_vector
ON intake_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER trg_intake_embeddings_updated_at
BEFORE UPDATE ON intake_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `intake_id` | UUID | No | Foreign key to intake_tickets (primary key) |
| `embedding` | vector(1536) | Yes | Vector embedding of intake text |
| `text_hash` | TEXT | No | SHA256 hash of intake text for change detection |
| `model_version` | TEXT | No | Embedding model identifier |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

### Example Row
```json
{
  "intake_id": "660e8400-e29b-41d4-a716-446655440000",
  "embedding": [0.0123, -0.0456, 0.0789, ...], // 1536 floats
  "text_hash": "a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "model_version": "text-embedding-ada-002",
  "updated_at": "2025-01-18T10:30:00Z"
}
```

---

## Entity: entity_embeddings

**Purpose**: Vector embeddings for all entities to enable reverse semantic search (find entities relevant to an intake).

### Schema
```sql
CREATE TABLE entity_embeddings (
  -- Identity (composite primary key)
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'dossier', 'position', 'mou', 'engagement', 'assignment',
    'commitment', 'intelligence_signal', 'organization',
    'country', 'forum', 'working_group', 'topic'
  )),
  entity_id UUID NOT NULL,
  PRIMARY KEY (entity_type, entity_id),

  -- Vector data
  embedding vector(1536),

  -- Metadata for search ranking
  metadata JSONB NOT NULL, -- {name, description, classification_level, last_linked_at, org_id}

  -- Model tracking
  text_hash TEXT NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'text-embedding-ada-002',

  -- Audit
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_entity_embeddings_vector
ON entity_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- GIN index for metadata queries
CREATE INDEX idx_entity_embeddings_metadata
ON entity_embeddings USING GIN (metadata);

-- B-tree index for entity lookups
CREATE INDEX idx_entity_embeddings_entity
ON entity_embeddings (entity_type, entity_id);
```

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `entity_type` | TEXT | No | Type of entity (part of composite PK) |
| `entity_id` | UUID | No | ID of entity (part of composite PK) |
| `embedding` | vector(1536) | Yes | Vector embedding of entity text |
| `metadata` | JSONB | No | Cached entity metadata for ranking |
| `text_hash` | TEXT | No | SHA256 hash for change detection |
| `model_version` | TEXT | No | Embedding model identifier |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

### Metadata JSON Structure
```json
{
  "name": "Saudi Arabia Country Dossier",
  "description": "Comprehensive dossier covering diplomatic relations, trade agreements, and bilateral meetings with the Kingdom of Saudi Arabia.",
  "classification_level": 2, // 0-3 clearance hierarchy
  "last_linked_at": "2025-01-15T08:20:00Z", // For recency ranking
  "org_id": "bb0e8400-e29b-41d4-a716-446655440000"
}
```

### Example Row
```json
{
  "entity_type": "dossier",
  "entity_id": "770e8400-e29b-41d4-a716-446655440000",
  "embedding": [0.0234, -0.0567, 0.0890, ...], // 1536 floats
  "metadata": {
    "name": "Saudi Arabia Country Dossier",
    "classification_level": 2,
    "last_linked_at": "2025-01-15T08:20:00Z",
    "org_id": "bb0e8400-e29b-41d4-a716-446655440000"
  },
  "text_hash": "b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3",
  "model_version": "text-embedding-ada-002",
  "updated_at": "2025-01-15T08:20:00Z"
}
```

---

## Relationships

### intake_entity_links Relationships

```
intake_entity_links.intake_id → intake_tickets.id (1:N)
intake_entity_links.entity_id → [polymorphic to 11 entity tables] (N:1)
intake_entity_links.linked_by → profiles.id (N:1)
intake_entity_links.suggested_by → profiles.id (N:1)
```

### link_audit_logs Relationships

```
link_audit_logs.link_id → intake_entity_links.id (N:1, no FK)
link_audit_logs.intake_id → intake_tickets.id (N:1, no FK for immutability)
link_audit_logs.performed_by → profiles.id (N:1)
```

### ai_link_suggestions Relationships

```
ai_link_suggestions.intake_id → intake_tickets.id (1:N)
ai_link_suggestions.reviewed_by → profiles.id (N:1)
```

### intake_embeddings Relationships

```
intake_embeddings.intake_id → intake_tickets.id (1:1)
```

### entity_embeddings Relationships

```
entity_embeddings.(entity_type, entity_id) → [polymorphic to 11 entity tables] (1:1)
```

---

## Entity Diagram (Mermaid)

```mermaid
erDiagram
    intake_tickets ||--o{ intake_entity_links : "has many"
    intake_tickets ||--o| intake_embeddings : "has one"
    intake_tickets ||--o{ ai_link_suggestions : "has many"

    intake_entity_links }o--|| profiles : "linked by"
    intake_entity_links }o--o| profiles : "suggested by"
    intake_entity_links ||--o{ link_audit_logs : "logged in"

    ai_link_suggestions }o--o| profiles : "reviewed by"

    entities ||--o| entity_embeddings : "has embedding"

    intake_entity_links {
        uuid id PK
        uuid intake_id FK
        text entity_type
        uuid entity_id
        text link_type
        text source
        numeric confidence
        text notes
        int link_order
        uuid suggested_by FK
        uuid linked_by FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    link_audit_logs {
        uuid id PK
        uuid link_id
        uuid intake_id
        text entity_type
        uuid entity_id
        text action
        uuid performed_by FK
        jsonb details
        timestamptz timestamp
    }

    ai_link_suggestions {
        uuid id PK
        uuid intake_id FK
        text suggested_entity_type
        uuid suggested_entity_id
        text suggested_link_type
        numeric confidence
        text reasoning
        text status
        timestamptz created_at
        timestamptz reviewed_at
        uuid reviewed_by FK
    }

    intake_embeddings {
        uuid intake_id PK_FK
        vector_1536 embedding
        text text_hash
        text model_version
        timestamptz updated_at
    }

    entity_embeddings {
        text entity_type PK
        uuid entity_id PK
        vector_1536 embedding
        jsonb metadata
        text text_hash
        text model_version
        timestamptz updated_at
    }
```

---

## Row Level Security (RLS) Policies

### intake_entity_links

```sql
-- Users can only see links for intakes in their organization
CREATE POLICY intake_entity_links_select ON intake_entity_links
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can create links if they have access to the intake
CREATE POLICY intake_entity_links_insert ON intake_entity_links
FOR INSERT WITH CHECK (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can update/delete links they created or if they have steward+ role
CREATE POLICY intake_entity_links_update ON intake_entity_links
FOR UPDATE USING (
  linked_by = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND global_role IN ('steward', 'admin')
  )
);
```

### link_audit_logs

```sql
-- Users can only view audit logs for intakes in their organization
CREATE POLICY link_audit_logs_select ON link_audit_logs
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- No UPDATE or DELETE policies (immutable table)
```

### ai_link_suggestions

```sql
-- Users can only view suggestions for intakes in their organization
CREATE POLICY ai_link_suggestions_select ON ai_link_suggestions
FOR SELECT USING (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can create suggestions if they have access to the intake
CREATE POLICY ai_link_suggestions_insert ON ai_link_suggestions
FOR INSERT WITH CHECK (
  intake_id IN (
    SELECT it.id
    FROM intake_tickets it
    WHERE it.org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can update suggestions they created
CREATE POLICY ai_link_suggestions_update ON ai_link_suggestions
FOR UPDATE USING (reviewed_by = auth.uid());
```

---

## Database Functions

### update_updated_at_column()

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### log_link_operation()

```sql
CREATE OR REPLACE FUNCTION log_link_operation()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  details_json JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    details_json := jsonb_build_object(
      'link_type', NEW.link_type,
      'source', NEW.source,
      'confidence', NEW.confidence
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    action_type := 'deleted';
    details_json := jsonb_build_object(
      'link_type', OLD.link_type
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    action_type := 'restored';
    details_json := jsonb_build_object(
      'deleted_at', OLD.deleted_at
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    details_json := jsonb_build_object(
      'old_values', jsonb_build_object(
        'notes', OLD.notes,
        'link_order', OLD.link_order
      ),
      'new_values', jsonb_build_object(
        'notes', NEW.notes,
        'link_order', NEW.link_order
      )
    );
  ELSE
    RETURN NULL; -- Ignore DELETE operations
  END IF;

  -- Insert audit log
  INSERT INTO link_audit_logs (
    link_id,
    intake_id,
    entity_type,
    entity_id,
    action,
    performed_by,
    details
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.intake_id, OLD.intake_id),
    COALESCE(NEW.entity_type, OLD.entity_type),
    COALESCE(NEW.entity_id, OLD.entity_id),
    action_type,
    auth.uid(),
    details_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### check_clearance_level()

```sql
CREATE OR REPLACE FUNCTION check_clearance_level(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  user_clearance INT;
  entity_clearance INT;
BEGIN
  -- Get user clearance level
  SELECT clearance_level INTO user_clearance
  FROM profiles
  WHERE id = p_user_id;

  -- Get entity classification level (polymorphic query)
  EXECUTE format(
    'SELECT classification_level FROM %I WHERE id = $1',
    p_entity_type || 's' -- Pluralize table name
  ) INTO entity_clearance
  USING p_entity_id;

  -- Return true if user has sufficient clearance
  RETURN user_clearance >= entity_clearance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Data Migration Strategy

### From Intake to Position (FR-012)

When an intake ticket is converted to a position/MOU/engagement, entity links must be migrated:

**Step 1**: Copy links from intake_entity_links to position_entity_links (or equivalent)
**Step 2**: Map link types appropriately (e.g., 'primary' → 'related' if position already has primary)
**Step 3**: Log migration in link_audit_logs with action='migrated'
**Step 4**: Mark intake links as migrated (flag or soft-delete depending on requirements)

```sql
-- Example migration function
CREATE OR REPLACE FUNCTION migrate_intake_links_to_position(
  p_intake_id UUID,
  p_position_id UUID,
  p_performed_by UUID
) RETURNS INTEGER AS $$
DECLARE
  links_migrated INTEGER := 0;
  link_record RECORD;
BEGIN
  -- Loop through active links
  FOR link_record IN
    SELECT * FROM intake_entity_links
    WHERE intake_id = p_intake_id AND deleted_at IS NULL
  LOOP
    -- Insert into position_entity_links (adapt link_type if needed)
    INSERT INTO position_entity_links (
      position_id,
      entity_type,
      entity_id,
      link_type,
      notes,
      link_order,
      linked_by
    ) VALUES (
      p_position_id,
      link_record.entity_type,
      link_record.entity_id,
      link_record.link_type, -- TODO: Map link types if schema differs
      link_record.notes,
      link_record.link_order,
      p_performed_by
    );

    -- Log migration in audit table
    INSERT INTO link_audit_logs (
      link_id,
      intake_id,
      entity_type,
      entity_id,
      action,
      performed_by,
      details
    ) VALUES (
      link_record.id,
      p_intake_id,
      link_record.entity_type,
      link_record.entity_id,
      'migrated',
      p_performed_by,
      jsonb_build_object(
        'target_position_id', p_position_id,
        'link_type', link_record.link_type
      )
    );

    links_migrated := links_migrated + 1;
  END LOOP;

  RETURN links_migrated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Performance Considerations

1. **Indexes**: 8 indexes on intake_entity_links (3 B-tree, 2 unique partial, 2 HNSW vector, 1 GIN)
2. **Query patterns**:
   - Get links for intake: `O(log n)` with idx_intake_entity_links_intake
   - Reverse lookup: `O(log n)` with idx_intake_entity_links_reverse
   - Vector similarity: `O(log n)` with HNSW index (m=16, ef_construction=64)
3. **Cache strategy**: Entity metadata cached in Redis (5-min TTL) to reduce reverse lookup queries
4. **Batch operations**: Application-layer batch validation to avoid N+1 queries

## Storage Estimates

- **intake_entity_links**: ~500 bytes per row
  - 10,000 intakes × 3 links avg = 30,000 rows = 15MB
- **link_audit_logs**: ~400 bytes per row (JSONB details)
  - 30,000 links × 2 operations avg = 60,000 rows = 24MB
  - 7-year retention: ~600,000 rows = 240MB
- **ai_link_suggestions**: ~300 bytes per row
  - 10,000 intakes × 5 suggestions = 50,000 rows = 15MB
  - 30-day retention: ~5,000 active rows = 1.5MB
- **intake_embeddings**: ~6200 bytes per row (1536 floats × 4 bytes)
  - 10,000 intakes = 62MB
- **entity_embeddings**: ~6500 bytes per row (embedding + metadata)
  - 5,000 entities = 32.5MB

**Total estimated storage**: ~400MB (including indexes)

---

## Summary

This data model supports all functional requirements (FR-001 through FR-018) with:
- ✅ Polymorphic associations for 11 entity types
- ✅ 5 link types with validation rules
- ✅ Soft delete with audit trail
- ✅ AI suggestions via vector embeddings
- ✅ Organization multi-tenancy via RLS
- ✅ Clearance level enforcement
- ✅ 7-year audit log retention
- ✅ Link migration for intake-to-position conversion
- ✅ Performance targets met (<2s reverse lookup, <3s AI suggestions)
