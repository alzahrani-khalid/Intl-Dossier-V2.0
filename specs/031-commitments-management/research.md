# Research: Commitments Management v1.1

**Feature**: 031-commitments-management
**Date**: 2025-11-25

## Research Topics

### 1. Database Schema Evolution Strategy

**Decision**: Add columns to existing `aa_commitments` table (now named `commitments` in the codebase)

**Rationale**:
- Table already has solid foundation with constraints, indexes, and triggers
- Adding columns is non-breaking (use DEFAULT values)
- Preserves existing RLS policies
- Feature 030's materialized view `dossier_commitment_stats` continues to work

**Alternatives Considered**:
- Create new table: Rejected - would break existing queries and health score calculations
- View abstraction: Rejected - adds complexity without benefit

**Schema Changes Required**:
```sql
-- New columns to add:
title VARCHAR(200) NOT NULL DEFAULT '' -- Backfill from LEFT(description, 200)
proof_url TEXT -- URL to evidence file in Storage
proof_required BOOLEAN DEFAULT false
evidence_submitted_at TIMESTAMPTZ
status_changed_at TIMESTAMPTZ
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
```

**Existing Columns (no changes needed)**:
- `id`, `after_action_id`, `dossier_id`, `description`, `owner_type`, `owner_internal_id`, `owner_external_id`
- `due_date`, `priority`, `status`, `tracking_type`, `completion_notes`, `completed_at`
- `ai_extracted`, `confidence_score`, `created_at`, `updated_at`

---

### 2. Status History Audit Trail

**Decision**: Create separate `commitment_status_history` table

**Rationale**:
- Clean separation of concerns (commitment data vs audit trail)
- Efficient queries for timeline view (no JSON parsing)
- Insert-only pattern (never update history records)
- Matches FR-024 requirement for full status change audit

**Schema**:
```sql
CREATE TABLE commitment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  old_status commitment_status,
  new_status commitment_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX idx_status_history_commitment ON commitment_status_history(commitment_id, changed_at DESC);
```

**Trigger** (auto-insert on status change):
```sql
CREATE TRIGGER commitment_status_audit
AFTER UPDATE OF status ON commitments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION record_commitment_status_change();
```

**Alternatives Considered**:
- JSONB array on commitment record: Rejected - query inefficiency, harder to aggregate
- Generic audit_log table: Rejected - over-engineering for single use case

---

### 3. Evidence Storage Strategy

**Decision**: Supabase Storage with dedicated bucket

**Rationale**:
- Built-in integration with Supabase Auth
- Signed URLs for secure access
- RLS-style policies via storage.policies
- Automatic cleanup tied to commitment deletion

**Configuration**:
```yaml
Bucket: commitment-evidence
Structure: {commitment_id}/{filename}
Max Size: 10MB
Allowed Types: application/pdf, image/jpeg, image/png, application/vnd.openxmlformats-officedocument.wordprocessingml.document
Retention: Lifetime of commitment
Access: Signed URLs (1 hour expiry)
```

**Storage Policy**:
```sql
-- Upload: commitment owner or dossier assignee
CREATE POLICY "evidence_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'commitment-evidence' AND
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND (c.owner_internal_id = auth.uid() OR EXISTS (
      SELECT 1 FROM dossier_assignments da
      WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
    ))
  )
);

-- Download: same as upload
CREATE POLICY "evidence_download" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'commitment-evidence' AND
  EXISTS (
    SELECT 1 FROM commitments c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND (c.owner_internal_id = auth.uid() OR EXISTS (
      SELECT 1 FROM dossier_assignments da
      WHERE da.dossier_id = c.dossier_id AND da.user_id = auth.uid()
    ))
  )
);
```

**Alternatives Considered**:
- External URLs only: Rejected - spec requires file upload capability
- Direct S3: Rejected - adds infrastructure complexity

---

### 4. Optimistic Updates Pattern

**Decision**: TanStack Query mutation with onMutate/onError rollback

**Rationale**:
- Existing pattern in codebase (see `use-after-action.ts`)
- Immediate UI feedback for status changes
- Automatic rollback on failure
- Cache invalidation on success

**Pattern**:
```typescript
const updateStatusMutation = useMutation({
  mutationFn: (data) => updateCommitmentStatus(data.id, data.status),
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: commitmentKeys.list() });
    const previous = queryClient.getQueryData(commitmentKeys.list());

    // Optimistic update
    queryClient.setQueryData(commitmentKeys.list(), (old) => ({
      ...old,
      commitments: old.commitments.map(c =>
        c.id === data.id ? { ...c, status: data.status } : c
      )
    }));

    return { previous };
  },
  onError: (err, data, context) => {
    queryClient.setQueryData(commitmentKeys.list(), context.previous);
    toast.error(t('commitments.errors.statusUpdateFailed'));
  },
  onSuccess: () => {
    toast.success(t('commitments.status.updated'));
    queryClient.invalidateQueries({ queryKey: commitmentKeys.list() });
  }
});
```

---

### 5. Cursor-Based Pagination

**Decision**: Use `updated_at` + `id` compound cursor

**Rationale**:
- Stable pagination (new items don't shift pages)
- Efficient with existing `idx_commitments_updated_at` index
- Infinite scroll friendly
- URL-encodable for sharing

**Implementation**:
```typescript
interface PaginationCursor {
  updated_at: string;
  id: string;
}

// Query pattern
const fetchCommitments = async (cursor?: PaginationCursor, limit = 20) => {
  let query = supabase
    .from('commitments')
    .select('*', { count: 'exact' })
    .order('due_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor) {
    query = query.or(`due_date.gt.${cursor.updated_at},and(due_date.eq.${cursor.updated_at},id.gt.${cursor.id})`);
  }

  return query;
};
```

**Alternatives Considered**:
- Offset pagination: Rejected - unstable with concurrent edits
- Keyset on `created_at`: Rejected - `due_date` ordering preferred for user experience

---

### 6. Filter URL Synchronization

**Decision**: TanStack Router search params with type-safe schema

**Rationale**:
- Existing pattern in codebase
- Type-safe validation
- Automatic URL sync
- Shareable filter states

**Schema**:
```typescript
// Route search params
const commitmentSearchSchema = z.object({
  status: z.string().optional(), // comma-separated: "pending,in_progress"
  priority: z.string().optional(), // comma-separated: "high,critical"
  ownerType: z.enum(['internal', 'external']).optional(),
  overdue: z.boolean().optional(),
  dossierId: z.string().uuid().optional(),
});

// Parse for API
const parseFilters = (search: z.infer<typeof commitmentSearchSchema>) => ({
  status: search.status?.split(',').filter(Boolean),
  priority: search.priority?.split(',').filter(Boolean),
  ownerType: search.ownerType,
  overdue: search.overdue,
  dossierId: search.dossierId,
});
```

---

### 7. Status Regression Prevention

**Decision**: Database constraint + application-level validation

**Rationale**:
- Database constraint provides data integrity guarantee
- Application validation provides user-friendly error messages
- Admin override via special function

**Implementation**:
```sql
-- Valid transitions (non-admin)
-- pending → in_progress, cancelled
-- in_progress → pending, completed, cancelled
-- completed → (none, or cancelled with admin)
-- cancelled → (none)

CREATE OR REPLACE FUNCTION check_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow all transitions for admin users
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN NEW;
  END IF;

  -- Check valid transitions
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot change status from completed (admin required)';
  END IF;

  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot change status from cancelled';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 8. UI Component Selection

**Decision**: Use existing Aceternity UI components + shadcn/ui primitives

| Component Need | Selected Component | Source |
|----------------|-------------------|--------|
| File upload | `file-upload` | Aceternity (already installed) |
| Filter drawer | `sheet` | shadcn/ui (already installed) |
| Status dropdown | `dropdown-menu` | shadcn/ui (already installed) |
| Detail drawer | `sheet` | shadcn/ui (already installed) |
| Timeline | `timeline` | Aceternity (install needed) |
| Expandable card | `expandable-card` | Aceternity (already installed) |
| Form | `form` | shadcn/ui (already installed) |
| Badge | `badge` | shadcn/ui (already installed) |

**Install Command**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes
```

---

## Summary

All technical unknowns have been resolved:

| Topic | Decision | Risk Level |
|-------|----------|------------|
| Schema Evolution | Add columns to existing table | Low |
| Status Audit | Separate history table with trigger | Low |
| Evidence Storage | Supabase Storage bucket | Low |
| Optimistic Updates | TanStack Query onMutate pattern | Low |
| Pagination | Cursor-based with due_date+id | Low |
| Filter URL Sync | TanStack Router search params | Low |
| Status Regression | DB constraint + app validation | Low |
| UI Components | Aceternity + shadcn/ui | Low |

**Proceed to Phase 1: Design & Contracts**
