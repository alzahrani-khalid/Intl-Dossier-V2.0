# Quickstart Guide: Commitments Management v1.1

**Feature**: 031-commitments-management
**Date**: 2025-11-25

## Overview

This feature transforms the existing read-only commitments list into a full lifecycle management system with CRUD operations, inline status updates, advanced filtering with URL sync, and evidence upload capabilities.

## Prerequisites

### Required Tools
- Node.js 18+ LTS
- pnpm 8+
- Supabase CLI 1.x
- Git

### Required Access
- Supabase project admin access
- Storage bucket creation permissions
- Edge Function deployment permissions

### Environment Variables

```bash
# frontend/.env.local
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearthfgg.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Quick Setup

### 1. Database Migration

Apply the schema changes to add new columns and create the status history table:

```bash
# Using Supabase MCP (recommended)
# The migration will be applied via mcp__supabase__apply_migration

# Or using Supabase CLI
supabase db push
```

Migration includes:
- New columns on `commitments` table: `title`, `proof_url`, `proof_required`, `evidence_submitted_at`, `status_changed_at`, `created_by`, `updated_by`
- New `commitment_status_history` table with audit trigger
- Storage bucket `commitment-evidence` with access policies

### 2. Install Aceternity Timeline Component

```bash
cd frontend
npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes
```

### 3. Frontend Dependencies

All required dependencies are already installed:
- TanStack Query v5 (optimistic updates)
- TanStack Router v5 (URL filter sync)
- Framer Motion (animations)
- Aceternity UI components

### 4. Start Development

```bash
# From repository root
pnpm dev
```

## Project Structure

### New/Modified Files

```
frontend/src/
├── components/commitments/
│   ├── CommitmentsList.tsx      # Enhanced list (modify existing)
│   ├── CommitmentCard.tsx       # New card component
│   ├── CommitmentForm.tsx       # New create/edit form
│   ├── CommitmentFilterDrawer.tsx  # New filter panel
│   ├── CommitmentDetailDrawer.tsx  # New detail view with timeline
│   └── EvidenceUpload.tsx       # New evidence upload component
├── hooks/
│   └── useCommitments.ts        # Enhanced with mutations
├── services/
│   └── commitments.service.ts   # Enhanced CRUD operations
└── routes/_protected/
    └── commitments.tsx          # Enhanced route with search params

supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_commitments_v11.sql  # Schema evolution
└── functions/
    └── commitment-upload-evidence/         # File upload Edge Function
```

## Key Implementation Patterns

### 1. Optimistic Status Updates

```typescript
// In useCommitments.ts
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
    queryClient.invalidateQueries({ queryKey: commitmentKeys.list() });
  }
});
```

### 2. URL Filter Synchronization

```typescript
// In commitments route
const commitmentSearchSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  ownerType: z.enum(['internal', 'external']).optional(),
  overdue: z.boolean().optional(),
  dossierId: z.string().uuid().optional(),
});

export const Route = createFileRoute('/_protected/commitments')({
  validateSearch: commitmentSearchSchema,
});
```

### 3. Mobile-First & RTL Component Pattern

```tsx
import { useTranslation } from 'react-i18next';

export function CommitmentCard({ commitment }: Props) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-base sm:text-lg text-start">{commitment.title}</h3>
      <Badge className="ms-auto">{t(`status.${commitment.status}`)}</Badge>
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
    </div>
  );
}
```

### 4. Cursor-Based Pagination

```typescript
const fetchCommitments = async (cursor?: PaginationCursor, limit = 20) => {
  let query = supabase
    .from('commitments')
    .select('*', { count: 'exact' })
    .order('due_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor) {
    query = query.or(
      `due_date.gt.${cursor.due_date},and(due_date.eq.${cursor.due_date},id.gt.${cursor.id})`
    );
  }

  return query;
};
```

## Testing

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

### Manual Testing Checklist

1. **CRUD Operations**
   - [ ] Create commitment from dossier page
   - [ ] Edit commitment details
   - [ ] Cancel commitment with reason

2. **Status Updates**
   - [ ] Update status from list view (2 taps max)
   - [ ] Verify optimistic update
   - [ ] Check status history in detail drawer

3. **Filtering**
   - [ ] Apply multiple status filters
   - [ ] Share filtered URL
   - [ ] Clear individual filter chips

4. **Evidence Upload**
   - [ ] Upload PDF file
   - [ ] Upload image from camera (mobile)
   - [ ] Download uploaded evidence

5. **RTL Support**
   - [ ] Switch to Arabic language
   - [ ] Verify layout mirrors correctly
   - [ ] Check icon directions

## Translations

Add translations to `frontend/public/locales/{en,ar}/commitments.json`:

```json
{
  "title": "Commitments",
  "actions": {
    "create": "Add Commitment",
    "edit": "Edit",
    "cancel": "Cancel",
    "uploadEvidence": "Upload Evidence"
  },
  "status": {
    "pending": "Pending",
    "in_progress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled"
  },
  "priority": {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "critical": "Critical"
  },
  "filters": {
    "title": "Filter Commitments",
    "status": "Status",
    "priority": "Priority",
    "ownerType": "Owner Type",
    "overdue": "Overdue Only",
    "clear": "Clear Filters"
  },
  "errors": {
    "statusUpdateFailed": "Failed to update status",
    "uploadFailed": "Failed to upload evidence"
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: Status update fails with "INVALID_STATUS_TRANSITION"
**Solution**: Check allowed transitions in data-model.md. Completed/Cancelled cannot be changed by non-admins.

**Issue**: Evidence upload returns 403
**Solution**: Verify user has dossier assignment or is commitment owner. Check RLS policies.

**Issue**: Filters not persisting in URL
**Solution**: Ensure search params schema matches route validation in TanStack Router.

## Related Documentation

- [Specification](./spec.md)
- [Data Model](./data-model.md)
- [Research Notes](./research.md)
- [API Contracts](./contracts/commitments.openapi.yaml)
