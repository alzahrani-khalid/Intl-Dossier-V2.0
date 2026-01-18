# Quickstart: Smart Dossier Context Inheritance

**Feature**: 035-dossier-context
**Date**: 2025-01-16
**Phase**: 1 - Design

## Overview

This guide helps developers quickly set up and understand the smart dossier context inheritance feature.

---

## Prerequisites

- Node.js 18+ LTS
- pnpm 8+
- Supabase CLI installed
- Local Supabase running (`supabase start`)
- Environment variables configured in `.env.local`

---

## Quick Setup

### 1. Apply Database Migration

```bash
# Apply migration via Supabase MCP (recommended)
# The migration creates:
# - work_item_dossiers table
# - Indexes for performance
# - RLS policies
# - dossier_activity_timeline view
# - resolve_dossier_context function

pnpm db:migrate
```

### 2. Deploy Edge Function

```bash
# Deploy the context resolution function
supabase functions deploy resolve-dossier-context
```

### 3. Install Frontend Dependencies

```bash
# No new dependencies required
# Uses existing: TanStack Router, TanStack Query, i18next
cd frontend && pnpm install
```

---

## Development Workflow

### Start Local Development

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Frontend
cd frontend && pnpm dev
```

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

---

## Key Files

### Database

- `supabase/migrations/YYYYMMDD_create_work_item_dossiers.sql`

### Edge Functions

- `supabase/functions/resolve-dossier-context/index.ts`

### Frontend Context

- `frontend/src/contexts/dossier-context.tsx` - Context provider
- `frontend/src/hooks/useDossierContext.ts` - Context hook
- `frontend/src/hooks/useResolveDossierContext.ts` - Resolution hook
- `frontend/src/hooks/useDossierActivityTimeline.ts` - Timeline hook

### Frontend Components

- `frontend/src/components/dossier/DossierContextBadge.tsx`
- `frontend/src/components/dossier/DossierSelector.tsx`
- `frontend/src/components/dossier/DossierActivityTimeline.tsx`

### Types

- `frontend/src/types/dossier-context.types.ts`

---

## Usage Examples

### 1. Using the Dossier Context Provider

```tsx
// Wrap your app or route with DossierProvider
import { DossierProvider } from '@/contexts/dossier-context';

function App() {
  return (
    <DossierProvider>
      <Routes />
    </DossierProvider>
  );
}
```

### 2. Accessing Dossier Context

```tsx
import { useDossierContext } from '@/hooks/useDossierContext';
import { useTranslation } from 'react-i18next';

function WorkItemForm() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const {
    selectedDossierIds,
    resolvedDossiers,
    inheritanceSource,
    requiresSelection,
    selectDossier,
  } = useDossierContext();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col gap-4">
      {requiresSelection ? (
        <DossierSelector
          value={selectedDossierIds}
          onChange={(ids) => ids.forEach(selectDossier)}
          required
          multiple
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {resolvedDossiers.map((dossier) => (
            <DossierContextBadge
              key={dossier.id}
              dossier={dossier}
              inheritanceSource={inheritanceSource}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Resolving Context from Entity

```tsx
import { useResolveDossierContext } from '@/hooks/useResolveDossierContext';

function EngagementPage({ engagementId }: { engagementId: string }) {
  const { resolveFromEntity, isResolving, error } = useResolveDossierContext();

  useEffect(() => {
    // Resolve dossier context when page loads
    resolveFromEntity('engagement', engagementId);
  }, [engagementId]);

  if (isResolving) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <EngagementContent />;
}
```

### 4. Displaying Activity Timeline

```tsx
import { DossierActivityTimeline } from '@/components/dossier/DossierActivityTimeline';

function DossierPage({ dossierId }: { dossierId: string }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-start">
        {t('dossier.activity_timeline')}
      </h1>

      <DossierActivityTimeline dossierId={dossierId} initialLimit={20} className="mt-6" />
    </div>
  );
}
```

### 5. Creating Work Item with Dossier Context

```tsx
import { useDossierContext } from '@/hooks/useDossierContext';
import { useCreateTask } from '@/hooks/useCreateTask';

function CreateTaskForm() {
  const { selectedDossierIds, inheritanceSource } = useDossierContext();
  const createTask = useCreateTask();

  const handleSubmit = async (formData: TaskFormData) => {
    await createTask.mutateAsync({
      ...formData,
      dossier_ids: selectedDossierIds,
      inheritance_source: inheritanceSource || 'direct',
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## URL State Sync

The dossier context syncs with URL parameters for deep-linking:

```
/dossiers/123?dossierId=123&view=timeline
/engagements/456?inheritedDossier=123&source=engagement
/my-work?selectedDossiers=123,456
```

### URL Parameters

| Parameter          | Description                 | Example                     |
| ------------------ | --------------------------- | --------------------------- |
| `dossierId`        | Current dossier ID          | `?dossierId=123`            |
| `selectedDossiers` | Comma-separated dossier IDs | `?selectedDossiers=123,456` |
| `source`           | Inheritance source          | `?source=engagement`        |
| `view`             | View mode (timeline/grid)   | `?view=timeline`            |

---

## API Endpoints

### Resolve Dossier Context

```bash
curl -X POST \
  'https://PROJECT_REF.supabase.co/functions/v1/resolve-dossier-context' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "entity_type": "engagement",
    "entity_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Create Work Item Dossier Link

```bash
curl -X POST \
  'https://PROJECT_REF.supabase.co/functions/v1/work-item-dossiers' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "work_item_type": "task",
    "work_item_id": "123e4567-e89b-12d3-a456-426614174002",
    "dossier_ids": ["550e8400-e29b-41d4-a716-446655440000"],
    "inheritance_source": "direct"
  }'
```

### Get Activity Timeline

```bash
curl -X GET \
  'https://PROJECT_REF.supabase.co/functions/v1/dossier-activity-timeline?dossier_id=550e8400-e29b-41d4-a716-446655440000&limit=20' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Testing Credentials

For browser/E2E testing:

- **Email**: kazahrani@stats.gov.sa
- **Password**: itisme

---

## Mobile-First & RTL Guidelines

All components must follow these patterns:

```tsx
// RTL detection
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

// Container direction
<div dir={isRTL ? 'rtl' : 'ltr'}>

// Logical properties only
className="ms-4 me-4 ps-4 pe-4 text-start"

// Never use physical directions
// ❌ ml-4, mr-4, pl-4, pr-4, text-left, text-right

// Icon flipping
<ChevronRight className={isRTL ? 'rotate-180' : ''} />

// Touch targets
className="min-h-11 min-w-11"

// Mobile-first breakpoints
className="px-4 sm:px-6 lg:px-8"
```

---

## Performance Targets

| Operation             | Target | Measurement            |
| --------------------- | ------ | ---------------------- |
| Context resolution    | <100ms | X-Response-Time header |
| Timeline initial load | <2s    | First contentful paint |
| Timeline pagination   | <500ms | Network request time   |

---

## Troubleshooting

### Context Not Resolving

1. Check entity exists and has dossier link
2. Verify user has permission to view dossier
3. Check Edge Function logs: `supabase functions logs resolve-dossier-context`

### Timeline Empty

1. Verify dossier has linked work items
2. Check work_item_dossiers table
3. Check RLS policies with `supabase db policy list`

### URL State Not Syncing

1. Ensure DossierProvider wraps the component
2. Check route has search param validation
3. Verify TanStack Router version is v5+

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement database migration first
3. Then Edge Function
4. Then frontend components in order:
   - DossierContextProvider
   - useDossierContext hook
   - DossierContextBadge
   - DossierSelector
   - DossierActivityTimeline
5. Add E2E tests
6. Update existing work creation flows
