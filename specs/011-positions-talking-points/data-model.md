# Data Model: Positions & Talking Points Lifecycle

**Feature**: 011-positions-talking-points
**Date**: 2025-10-01
**Status**: Phase 1 - Design Complete

## Entity Relationship Diagram

```
┌─────────────────┐
│  users          │
│  (Supabase Auth)│
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────┐
│  positions                          │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + position_type_id: uuid (FK)       │◄───┐
│ + title_en: text                    │    │
│ + title_ar: text                    │    │
│ + content_en: text                  │    │
│ + content_ar: text                  │    │
│ + rationale_en: text                │    │
│ + rationale_ar: text                │    │
│ + alignment_notes_en: text          │    │
│ + alignment_notes_ar: text          │    │
│ + thematic_category: text           │    │
│ + status: enum                      │    │
│ + current_stage: int                │    │
│ + approval_chain_config: jsonb      │    │
│ + consistency_score: int            │    │
│ + author_id: uuid (FK users)        │    │
│ + created_at: timestamp             │    │
│ + updated_at: timestamp             │    │
│ + version: int (optimistic lock)    │    │
└───┬─────────────────────────────────┘    │
    │ 1:N                                   │
    ├────────────► position_versions        │
    │                                       │
    ├────────────► attachments              │
    │                                       │
    ├────────────► approvals                │
    │                                       │
    ├────────────► position_audience_groups │
    │                                       │
    └────────────► consistency_checks       │
                                            │
┌─────────────────────────────────────┐    │
│  position_types                     │────┘
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + name_en: text                     │
│ + name_ar: text                     │
│ + approval_stages: int (1-10)       │
│ + default_chain_config: jsonb       │
│ + created_at: timestamp             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  position_versions                  │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + position_id: uuid (FK)            │
│ + version_number: int               │
│ + content_en: text                  │
│ + content_ar: text                  │
│ + rationale_en: text                │
│ + rationale_ar: text                │
│ + full_snapshot: jsonb              │
│ + author_id: uuid (FK users)        │
│ + superseded: boolean               │
│ + created_at: timestamp             │
│ + retention_until: timestamp        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  approvals                          │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + position_id: uuid (FK)            │
│ + stage: int                        │
│ + approver_id: uuid (FK users)      │
│ + original_approver_id: uuid        │
│ + action: enum                      │
│ + comments: text                    │
│ + step_up_verified: boolean         │
│ + step_up_challenge_id: uuid        │
│ + delegated_from: uuid              │
│ + delegated_until: timestamp        │
│ + reassigned_by: uuid               │
│ + reassignment_reason: text         │
│ + created_at: timestamp             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  attachments                        │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + position_id: uuid (FK)            │
│ + file_name: text                   │
│ + file_size: bigint                 │
│ + file_type: text                   │
│ + storage_path: text                │
│ + uploader_id: uuid (FK users)      │
│ + created_at: timestamp             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  audience_groups                    │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + name_en: text                     │
│ + name_ar: text                     │
│ + description: text                 │
│ + created_at: timestamp             │
└───┬─────────────────────────────────┘
    │ N:M
    ├────────────► position_audience_groups
    │
    └────────────► user_audience_memberships

┌─────────────────────────────────────┐
│  position_audience_groups           │
│────────────────────────────────────│
│ + position_id: uuid (FK)            │
│ + audience_group_id: uuid (FK)      │
│ + granted_at: timestamp             │
│ + granted_by: uuid (FK users)       │
│  (PRIMARY KEY: position_id, group_id)│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  user_audience_memberships          │
│────────────────────────────────────│
│ + user_id: uuid (FK users)          │
│ + audience_group_id: uuid (FK)      │
│ + added_at: timestamp               │
│  (PRIMARY KEY: user_id, group_id)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  consistency_checks                 │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + position_id: uuid (FK)            │
│ + check_trigger: enum               │
│ + consistency_score: int            │
│ + ai_service_available: boolean     │
│ + conflicts: jsonb                  │
│ + suggested_resolutions: jsonb      │
│ + checked_at: timestamp             │
│ + checked_by: uuid (FK users)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  position_embeddings                │
│────────────────────────────────────│
│ + id: uuid (PK)                     │
│ + position_id: uuid (FK)            │
│ + content_en_embedding: vector(1536)│
│ + content_ar_embedding: vector(1536)│
│ + updated_at: timestamp             │
└─────────────────────────────────────┘
```

---

## Entity Definitions

### 1. positions

**Purpose**: Core entity representing an official organizational position or talking point.

**Fields**:
- `id`: Unique identifier (UUID v4)
- `position_type_id`: Foreign key to position_types (determines approval chain length)
- `title_en/ar`: Position title in English and Arabic
- `content_en/ar`: Main position text in both languages
- `rationale_en/ar`: Explanation/justification in both languages
- `alignment_notes_en/ar`: Notes on alignment with other positions
- `thematic_category`: Categorization for faceted search (e.g., "Trade Policy", "Climate", "Security")
- `status`: Enum of `draft`, `under_review`, `approved`, `published`
- `current_stage`: Current approval stage (0 = not submitted, 1-10 = approval stage)
- `approval_chain_config`: JSONB storing the approval chain structure for this specific position
- `consistency_score`: 0-100 score indicating alignment with existing positions
- `author_id`: User who created the position
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last modification
- `version`: Optimistic locking field for concurrent edit protection

**Validation Rules**:
- Both `title_en` and `title_ar` required before submission (FR-047)
- Both `content_en` and `content_ar` required before submission (FR-047)
- `status` transitions: draft → under_review → approved → published (unidirectional except draft)
- `current_stage` must match `approval_chain_config.stages.length` when status is `approved`
- `consistency_score` must be 0-100

**Indexes**:
- `idx_positions_status` on `status` for filtering
- `idx_positions_author` on `author_id` for author's positions
- `idx_positions_thematic` on `thematic_category` for faceted search
- `idx_positions_created` on `created_at` for date sorting

---

### 2. position_types

**Purpose**: Defines position types and their approval chain configurations.

**Fields**:
- `id`: Unique identifier
- `name_en/ar`: Type name in both languages (e.g., "Critical Policy", "Standard Position")
- `approval_stages`: Number of stages (1-10) for this position type
- `default_chain_config`: JSONB with default approver roles/groups for each stage
- `created_at`: Timestamp

**Examples**:
```json
{
  "name_en": "Critical Policy Position",
  "name_ar": "موقف السياسة الحرجة",
  "approval_stages": 5,
  "default_chain_config": {
    "stages": [
      {"order": 1, "role": "Section Chief"},
      {"order": 2, "role": "Department Director"},
      {"order": 3, "role": "Legal Review"},
      {"order": 4, "role": "Executive Committee"},
      {"order": 5, "role": "President/CEO"}
    ]
  }
}
```

---

### 3. position_versions

**Purpose**: Immutable history of position changes for auditing and comparison.

**Fields**:
- `id`: Unique identifier
- `position_id`: Parent position
- `version_number`: Sequential version (1, 2, 3...)
- `content_en/ar`: Snapshot of content at this version
- `rationale_en/ar`: Snapshot of rationale
- `full_snapshot`: JSONB with complete position state (includes metadata, alignment notes, etc.)
- `author_id`: User who created this version
- `superseded`: Boolean indicating if newer version exists
- `created_at`: Version creation timestamp
- `retention_until`: Auto-calculated as `created_at + 7 years` (FR-022)

**Validation Rules**:
- Immutable after creation (no UPDATE allowed)
- `retention_until` must be exactly 7 years from `created_at`
- `version_number` must be sequential per `position_id`

**Indexes**:
- `idx_versions_position` on `position_id` for version history retrieval
- `idx_versions_retention` on `retention_until` for cleanup job

**Partitioning**:
```sql
PARTITION BY RANGE (created_at);
-- Annual partitions for efficient querying and archival
```

---

### 4. approvals

**Purpose**: Audit trail of all approval actions within the approval chain.

**Fields**:
- `id`: Unique identifier
- `position_id`: Position being approved
- `stage`: Approval stage number (1-10)
- `approver_id`: User performing the action (may be delegate)
- `original_approver_id`: Original assigned approver (if different from `approver_id`)
- `action`: Enum of `approve`, `request_revisions`, `delegate`, `reassign`
- `comments`: Approver's comments (optional for `approve`, required for `request_revisions`)
- `step_up_verified`: Boolean confirming step-up authentication completed
- `step_up_challenge_id`: Reference to step-up challenge (for audit)
- `delegated_from`: User who delegated (if `action` = `delegate`)
- `delegated_until`: Delegation expiry timestamp
- `reassigned_by`: Admin who performed reassignment (if `action` = `reassign`)
- `reassignment_reason`: Justification for admin reassignment
- `created_at`: Action timestamp

**Validation Rules**:
- `step_up_verified` must be `true` for `action` = `approve` (FR-012)
- `comments` required if `action` = `request_revisions`
- `reassigned_by` must have admin role if `action` = `reassign`
- Cannot approve same stage twice (constraint on position_id + stage + approver_id)

**Indexes**:
- `idx_approvals_position` on `position_id` for approval history
- `idx_approvals_user` on `approver_id` for user's approval dashboard

---

### 5. attachments

**Purpose**: Supporting documents attached to positions.

**Fields**:
- `id`: Unique identifier
- `position_id`: Parent position
- `file_name`: Original filename
- `file_size`: Size in bytes
- `file_type`: MIME type
- `storage_path`: Path in Supabase Storage bucket
- `uploader_id`: User who uploaded
- `created_at`: Upload timestamp

**Validation Rules**:
- `file_type` must be in allowed list (PDF, DOCX, XLSX, PNG, JPG)
- `file_size` must be <= 50MB (configurable)
- Cascade delete when position is deleted

**Indexes**:
- `idx_attachments_position` on `position_id`

---

### 6. audience_groups

**Purpose**: Defines groups of users who can access published positions.

**Fields**:
- `id`: Unique identifier
- `name_en/ar`: Group name in both languages (e.g., "Senior Management", "Policy Team")
- `description`: Purpose of the group
- `created_at`: Creation timestamp

**Examples**:
- "Executive Leadership"
- "All Staff"
- "Policy Officers"
- "External Relations Team"

---

### 7. position_audience_groups (Junction Table)

**Purpose**: Many-to-many relationship between positions and audience groups.

**Fields**:
- `position_id`: Foreign key to positions
- `audience_group_id`: Foreign key to audience_groups
- `granted_at`: When access was granted
- `granted_by`: User who granted access (usually position author)

**Composite Primary Key**: (`position_id`, `audience_group_id`)

---

### 8. user_audience_memberships (Junction Table)

**Purpose**: Many-to-many relationship between users and audience groups.

**Fields**:
- `user_id`: Foreign key to auth.users (Supabase Auth)
- `audience_group_id`: Foreign key to audience_groups
- `added_at`: Membership timestamp

**Composite Primary Key**: (`user_id`, `audience_group_id`)

---

### 9. consistency_checks

**Purpose**: Records of consistency analysis runs and detected conflicts.

**Fields**:
- `id`: Unique identifier
- `position_id`: Position being checked
- `check_trigger`: Enum of `manual`, `automatic_on_submit`
- `consistency_score`: 0-100 overall alignment score
- `ai_service_available`: Boolean indicating if AI was available
- `conflicts`: JSONB array of detected conflicts:
  ```json
  [
    {
      "conflict_position_id": "uuid",
      "conflict_type": "contradiction" | "ambiguity" | "overlap",
      "severity": "high" | "medium" | "low",
      "description": "text",
      "suggested_resolution": "text",
      "affected_sections": ["section1", "section2"]
    }
  ]
  ```
- `suggested_resolutions`: JSONB with resolution strategies
- `checked_at`: Check timestamp
- `checked_by`: User who triggered (null for automatic)

**Indexes**:
- `idx_consistency_position` on `position_id`
- `idx_consistency_score` on `consistency_score` for low-score alerts

---

### 10. position_embeddings

**Purpose**: Vector embeddings for semantic similarity search in consistency checking.

**Fields**:
- `id`: Unique identifier
- `position_id`: Parent position
- `content_en_embedding`: pgvector(1536) for English content
- `content_ar_embedding`: pgvector(1536) for Arabic content
- `updated_at`: Last embedding generation

**Validation Rules**:
- Embeddings regenerated when content changes
- Used for cosine similarity searches in consistency checks

**Indexes**:
- `idx_embeddings_en_vector` using ivfflat on `content_en_embedding`
- `idx_embeddings_ar_vector` using ivfflat on `content_ar_embedding`

---

## State Transitions

### Position Status Flow

```
draft
  │
  │ (submit for review)
  ▼
under_review
  │
  ├─── (approve at each stage) ───┐
  │                               │
  │ (request revisions)           │
  └──────────► draft              │
                                  ▼
                              approved
                                  │
                                  │ (publish)
                                  ▼
                              published
```

**Rules**:
- `draft` → `under_review`: Requires both EN/AR content, sets `current_stage = 1`
- `under_review` → `draft`: Returns to author with approval comments
- `under_review` → `approved`: When `current_stage` reaches final stage with all approvals
- `approved` → `published`: Authorized publisher action
- `published` positions cannot return to previous states; new version required for changes

---

## Validation Constraints

### Database Constraints

```sql
-- positions table
ALTER TABLE positions
  ADD CONSTRAINT check_status_values CHECK (status IN ('draft', 'under_review', 'approved', 'published')),
  ADD CONSTRAINT check_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 100),
  ADD CONSTRAINT check_current_stage CHECK (current_stage >= 0 AND current_stage <= 10);

-- position_types table
ALTER TABLE position_types
  ADD CONSTRAINT check_approval_stages CHECK (approval_stages >= 1 AND approval_stages <= 10);

-- approvals table
ALTER TABLE approvals
  ADD CONSTRAINT check_action_values CHECK (action IN ('approve', 'request_revisions', 'delegate', 'reassign')),
  ADD CONSTRAINT check_step_up_on_approve CHECK (
    (action = 'approve' AND step_up_verified = true) OR (action != 'approve')
  );

-- attachments table
ALTER TABLE attachments
  ADD CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 52428800); -- 50MB
```

---

## Row Level Security (RLS) Policies

### positions Table

```sql
-- Drafters can see their own drafts
CREATE POLICY "Drafters view own drafts" ON positions FOR SELECT
USING (author_id = auth.uid() AND status = 'draft');

-- Approvers can see positions in review at their stage
CREATE POLICY "Approvers view positions at their stage" ON positions FOR SELECT
USING (
  status = 'under_review' AND
  EXISTS (
    SELECT 1 FROM approval_chain_stages acs
    WHERE acs.position_id = positions.id
      AND acs.stage = positions.current_stage
      AND acs.approver_group_id IN (
        SELECT audience_group_id FROM user_audience_memberships
        WHERE user_id = auth.uid()
      )
  )
);

-- Users can view published positions for their audience groups
CREATE POLICY "Users view published positions for their groups" ON positions FOR SELECT
USING (
  status = 'published' AND
  EXISTS (
    SELECT 1 FROM position_audience_groups pag
    INNER JOIN user_audience_memberships uam
      ON pag.audience_group_id = uam.audience_group_id
    WHERE pag.position_id = positions.id
      AND uam.user_id = auth.uid()
  )
);

-- Drafters can update their own drafts
CREATE POLICY "Drafters update own drafts" ON positions FOR UPDATE
USING (author_id = auth.uid() AND status = 'draft');
```

### approvals Table

```sql
-- Approvers can insert approvals for their stage
CREATE POLICY "Approvers insert approvals" ON approvals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM positions p
    WHERE p.id = position_id
      AND p.status = 'under_review'
      AND p.current_stage = stage
  ) AND
  approver_id = auth.uid()
);

-- Admins can reassign approvals
CREATE POLICY "Admins reassign approvals" ON approvals FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin' AND action = 'reassign');
```

---

## Migration Strategy

### Phase 1: Core Tables
1. Create `position_types` table
2. Create `positions` table with basic fields
3. Create `position_versions` table with partitioning
4. Create `approvals` table

### Phase 2: Access Control
5. Create `audience_groups` table
6. Create `position_audience_groups` junction table
7. Create `user_audience_memberships` junction table
8. Apply RLS policies

### Phase 3: Advanced Features
9. Create `attachments` table with Supabase Storage integration
10. Create `consistency_checks` table
11. Create `position_embeddings` table with pgvector extension
12. Create indexes for performance

---

## Data Seeding

### Required Seed Data

1. **Position Types** (at least 2 types):
   - "Standard Position" (3 approval stages)
   - "Critical Position" (5 approval stages)

2. **Audience Groups** (at least 3 groups):
   - "All Staff"
   - "Management"
   - "Policy Officers"

3. **Test Data**:
   - 5 sample positions in various states
   - 10 approval records
   - 3 sample versions

---

## Performance Considerations

| Table | Expected Volume (Year 1) | Growth Rate | Optimization |
|-------|---------------------------|-------------|--------------|
| positions | 1,000 | 1,000/year | Index on status, thematic_category |
| position_versions | 10,000 | 10,000/year | Annual partitions, 7-year retention |
| approvals | 5,000 | 5,000/year | Index on position_id, approver_id |
| attachments | 2,000 | 2,000/year | Supabase Storage, CDN for large files |
| consistency_checks | 2,000 | 2,000/year | Archive after 1 year |
| position_embeddings | 1,000 | 1,000/year | IVFFlat index for vector search |

---

## Next Steps

1. Generate OpenAPI contracts for Edge Functions based on this data model
2. Create contract tests for each CRUD endpoint
3. Generate TypeScript types from database schema
4. Implement RLS policies in migration files
5. Create quickstart validation script
