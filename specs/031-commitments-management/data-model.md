# Data Model: Commitments Management v1.1

**Feature**: 031-commitments-management
**Date**: 2025-11-25

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          dossiers                                │
│  (id, name, type, ...)                                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ 1:N
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         commitments                              │
│  (id, dossier_id, title, description, due_date, status, ...)    │
│  + NEW: proof_url, proof_required, evidence_submitted_at        │
│  + NEW: status_changed_at, created_by, updated_by               │
└───────────────────┬─────────────────────────┬───────────────────┘
                    │ 1:N                      │ N:1
                    ▼                          ▼
┌───────────────────────────────┐  ┌──────────────────────────────┐
│   commitment_status_history   │  │        auth.users            │
│  (NEW TABLE)                  │  │  (owner_internal_id)         │
│  - id                         │  └──────────────────────────────┘
│  - commitment_id              │
│  - old_status                 │          N:1
│  - new_status                 │           │
│  - changed_by                 │           ▼
│  - changed_at                 │  ┌──────────────────────────────┐
│  - notes                      │  │     external_contacts        │
└───────────────────────────────┘  │  (owner_external_id)         │
                                   └──────────────────────────────┘
```

---

## Entities

### 1. Commitment (Extended)

**Table**: `commitments` (existing, previously `aa_commitments`)

**Purpose**: Tracked obligations with lifecycle management

#### Existing Columns (No Changes)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `after_action_id` | UUID | FK → after_action_records, NOT NULL | Source after-action record |
| `dossier_id` | UUID | FK → dossiers, NOT NULL | Parent dossier (denormalized) |
| `description` | TEXT | NOT NULL, 10-2000 chars | Commitment description |
| `owner_type` | ENUM | NOT NULL | 'internal' or 'external' |
| `owner_internal_id` | UUID | FK → auth.users, nullable | If internal owner |
| `owner_external_id` | UUID | FK → external_contacts, nullable | If external owner |
| `due_date` | DATE | NOT NULL | When commitment is due |
| `priority` | ENUM | NOT NULL, DEFAULT 'medium' | low/medium/high/critical |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | pending/in_progress/completed/cancelled/overdue |
| `tracking_type` | ENUM | NOT NULL | automatic/manual |
| `completion_notes` | TEXT | nullable | Notes when completing |
| `completed_at` | TIMESTAMPTZ | nullable | When marked complete |
| `ai_extracted` | BOOLEAN | NOT NULL, DEFAULT false | AI extraction flag |
| `confidence_score` | NUMERIC(3,2) | 0-1 range, nullable | AI confidence |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Created timestamp |
| `updated_at` | TIMESTAMPTZ | nullable | Auto-updated via trigger |

#### New Columns (v1.1)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `title` | VARCHAR(200) | NOT NULL | Short commitment title |
| `proof_url` | TEXT | nullable | Evidence file URL in Storage |
| `proof_required` | BOOLEAN | NOT NULL, DEFAULT false | Whether evidence upload is required |
| `evidence_submitted_at` | TIMESTAMPTZ | nullable | When evidence was uploaded |
| `status_changed_at` | TIMESTAMPTZ | nullable | Last status transition time |
| `created_by` | UUID | FK → auth.users, nullable | User who created |
| `updated_by` | UUID | FK → auth.users, nullable | User who last updated |

#### Existing Constraints

```sql
CONSTRAINT check_owner_exclusivity CHECK (
  (owner_type = 'internal' AND owner_internal_id IS NOT NULL AND owner_external_id IS NULL) OR
  (owner_type = 'external' AND owner_external_id IS NOT NULL AND owner_internal_id IS NULL)
)

CONSTRAINT check_tracking_type_for_internal CHECK (
  (owner_type = 'internal') OR
  (owner_type = 'external' AND tracking_type = 'manual')
)

CONSTRAINT check_completed_at_when_completed CHECK (
  (status = 'completed' AND completed_at IS NOT NULL) OR
  (status != 'completed')
)

CONSTRAINT check_confidence_score_required CHECK (
  (ai_extracted = true AND confidence_score IS NOT NULL) OR
  (ai_extracted = false)
)
```

#### New Constraint (v1.1)

```sql
CONSTRAINT check_evidence_submitted CHECK (
  (proof_url IS NOT NULL AND evidence_submitted_at IS NOT NULL) OR
  (proof_url IS NULL AND evidence_submitted_at IS NULL)
)
```

#### Indexes

**Existing**:
- `idx_commitments_after_action` (after_action_id)
- `idx_commitments_dossier` (dossier_id)
- `idx_commitments_internal_owner` (owner_internal_id) WHERE owner_type='internal'
- `idx_commitments_external_owner` (owner_external_id) WHERE owner_type='external'
- `idx_commitments_due_date` (due_date)
- `idx_commitments_status` (status)
- `idx_commitments_priority` (priority)
- `idx_commitments_updated_at` (updated_at)

**New (v1.1)**:
```sql
CREATE INDEX idx_commitments_status_due ON commitments(status, due_date);
CREATE INDEX idx_commitments_proof_required ON commitments(proof_required) WHERE proof_required = true;
```

---

### 2. Commitment Status History (New)

**Table**: `commitment_status_history`

**Purpose**: Audit trail for status transitions (supports FR-024)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `commitment_id` | UUID | FK → commitments, NOT NULL, ON DELETE CASCADE | Parent commitment |
| `old_status` | ENUM | nullable | Previous status (null for initial) |
| `new_status` | ENUM | NOT NULL | New status |
| `changed_by` | UUID | FK → auth.users, NOT NULL | User who made change |
| `changed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When change occurred |
| `notes` | TEXT | nullable | Optional change notes |

#### Indexes

```sql
CREATE INDEX idx_status_history_commitment ON commitment_status_history(commitment_id, changed_at DESC);
CREATE INDEX idx_status_history_changed_by ON commitment_status_history(changed_by);
```

#### RLS Policies

```sql
-- SELECT: Same access as parent commitment
CREATE POLICY "status_history_select" ON commitment_status_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = commitment_status_history.commitment_id
    AND (
      c.owner_internal_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dossier_assignments da
        WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
      )
    )
  )
);

-- INSERT: Via trigger only (no direct inserts)
-- No INSERT policy - managed by trigger
```

---

## State Transitions

### Commitment Status State Machine

```
                    ┌──────────────┐
                    │   pending    │◄────── (initial)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐  ┌────────────┐
       │in_progress │  │ cancelled  │◄───────────────┐
       └──────┬─────┘  └────────────┘                │
              │                                      │
              ├──────────────────────────────────────┤
              │                                      │
              ▼                                      │
       ┌────────────┐                               │
       │ completed  │───────(admin only)────────────┤
       └────────────┘                               │
              │                                      │
              ▼                                      │
       ┌────────────┐                               │
       │  overdue   │ (auto via trigger when        │
       └────────────┘  due_date < today)            │
```

### Valid Transitions (Non-Admin)

| From | To | Condition |
|------|-----|-----------|
| pending | in_progress | User action |
| pending | cancelled | User action + optional reason |
| in_progress | pending | User action (reversal allowed) |
| in_progress | completed | User action |
| in_progress | cancelled | User action + optional reason |
| pending/in_progress | overdue | Auto-trigger when due_date < today |

### Blocked Transitions (Non-Admin)

| From | To | Reason |
|------|-----|--------|
| completed | * | Requires admin role |
| cancelled | * | Terminal state |

---

## Validation Rules

### Create Commitment

```typescript
const createCommitmentSchema = z.object({
  dossier_id: z.string().uuid(),
  after_action_id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  due_date: z.string().refine(date => new Date(date) >= new Date(), {
    message: 'Due date must be in the future'
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  owner_type: z.enum(['internal', 'external']),
  owner_internal_id: z.string().uuid().optional(),
  owner_external_id: z.string().uuid().optional(),
  tracking_type: z.enum(['automatic', 'manual']),
  proof_required: z.boolean().default(false),
}).refine(data => {
  if (data.owner_type === 'internal') {
    return !!data.owner_internal_id && !data.owner_external_id;
  }
  return !!data.owner_external_id && !data.owner_internal_id;
}, { message: 'Owner ID must match owner type' });
```

### Update Commitment

```typescript
const updateCommitmentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  proof_required: z.boolean().optional(),
});
```

### Update Status

```typescript
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  completion_notes: z.string().max(2000).optional(),
  cancellation_reason: z.string().max(500).optional(),
}).refine(data => {
  if (data.status === 'cancelled') {
    return true; // cancellation_reason is optional
  }
  if (data.status === 'completed') {
    return true; // completion_notes is optional
  }
  return true;
});
```

---

## Migration Strategy

### Step 1: Add New Columns

```sql
-- Migration: YYYYMMDDHHMMSS_add_commitment_v11_columns.sql

-- Add new columns with defaults for existing rows
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Backfill title from description for existing rows
UPDATE commitments
SET title = LEFT(description, 200)
WHERE title IS NULL;

-- Make title NOT NULL after backfill
ALTER TABLE commitments ALTER COLUMN title SET NOT NULL;

-- Backfill status_changed_at from updated_at
UPDATE commitments
SET status_changed_at = COALESCE(updated_at, created_at)
WHERE status_changed_at IS NULL;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_commitments_status_due ON commitments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_commitments_proof_required ON commitments(proof_required) WHERE proof_required = true;

-- Add constraint for evidence consistency
ALTER TABLE commitments
ADD CONSTRAINT check_evidence_submitted CHECK (
  (proof_url IS NOT NULL AND evidence_submitted_at IS NOT NULL) OR
  (proof_url IS NULL AND evidence_submitted_at IS NULL)
);
```

### Step 2: Create Status History Table

```sql
-- Migration: YYYYMMDDHHMMSS_create_commitment_status_history.sql

CREATE TABLE IF NOT EXISTS commitment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  old_status commitment_status,
  new_status commitment_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX idx_status_history_commitment ON commitment_status_history(commitment_id, changed_at DESC);
CREATE INDEX idx_status_history_changed_by ON commitment_status_history(changed_by);

-- Enable RLS
ALTER TABLE commitment_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policy (read access matches parent commitment)
CREATE POLICY "status_history_select" ON commitment_status_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = commitment_status_history.commitment_id
    AND (
      c.owner_internal_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dossier_assignments da
        WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
      )
    )
  )
);

-- Trigger function to auto-record status changes
CREATE OR REPLACE FUNCTION record_commitment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO commitment_status_history (commitment_id, old_status, new_status, changed_by, notes)
  VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.completion_notes);

  -- Update status_changed_at
  NEW.status_changed_at := now();
  NEW.updated_by := auth.uid();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on status change
CREATE TRIGGER commitment_status_audit
BEFORE UPDATE OF status ON commitments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION record_commitment_status_change();
```

### Step 3: Create Storage Bucket

```sql
-- Migration: YYYYMMDDHHMMSS_create_commitment_evidence_bucket.sql

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'commitment-evidence',
  'commitment-evidence',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Upload policy
CREATE POLICY "commitment_evidence_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'commitment-evidence' AND
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND (
      c.owner_internal_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dossier_assignments da
        WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
      )
    )
  )
);

-- Download policy
CREATE POLICY "commitment_evidence_download" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'commitment-evidence' AND
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND (
      c.owner_internal_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dossier_assignments da
        WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
      )
    )
  )
);

-- Delete policy (cleanup with commitment)
CREATE POLICY "commitment_evidence_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'commitment-evidence' AND
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND (
      c.owner_internal_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM dossier_assignments da
        WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
      )
    )
  )
);
```

---

## TypeScript Types

```typescript
// Commitment entity (extended)
export interface Commitment {
  id: string;
  dossier_id: string;
  after_action_id: string | null;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner_type: 'internal' | 'external';
  owner_internal_id: string | null;
  owner_external_id: string | null;
  tracking_type: 'automatic' | 'manual';
  proof_url: string | null;
  proof_required: boolean;
  evidence_submitted_at: string | null;
  completion_notes: string | null;
  completed_at: string | null;
  status_changed_at: string | null;
  ai_extracted: boolean;
  confidence_score: number | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

// Status history entry
export interface CommitmentStatusHistory {
  id: string;
  commitment_id: string;
  old_status: Commitment['status'] | null;
  new_status: Commitment['status'];
  changed_by: string;
  changed_at: string;
  notes: string | null;
}

// Create input
export interface CreateCommitmentInput {
  dossier_id: string;
  after_action_id?: string;
  title: string;
  description: string;
  due_date: string;
  priority?: Commitment['priority'];
  owner_type: Commitment['owner_type'];
  owner_internal_id?: string;
  owner_external_id?: string;
  tracking_type: Commitment['tracking_type'];
  proof_required?: boolean;
}

// Update input
export interface UpdateCommitmentInput {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: Commitment['priority'];
  proof_required?: boolean;
}

// Status update input
export interface UpdateStatusInput {
  status: Exclude<Commitment['status'], 'overdue'>;
  completion_notes?: string;
  cancellation_reason?: string;
}

// Filter params
export interface CommitmentFilters {
  dossierId?: string;
  status?: Commitment['status'][];
  priority?: Commitment['priority'][];
  ownerType?: Commitment['owner_type'];
  overdue?: boolean;
  cursor?: string;
  limit?: number;
}
```

---

## Backward Compatibility

### Existing Queries (Continue to Work)

- `dossier_commitment_stats` materialized view - unchanged columns
- Health score calculations - unchanged columns
- Existing RLS policies - unchanged
- `PersonalCommitmentsDashboard` - will be updated to use correct table

### Type Generation

After migration, regenerate types:
```bash
npx supabase gen types typescript --project-id zkrcjzdemdmwhearhfgg > frontend/src/types/database.types.ts
```
