# Quickstart: Unified Dossier Architecture

**Feature**: 026-unified-dossier-architecture
**Date**: 2025-01-22
**Audience**: Developers implementing the unified dossier system

## Overview

This guide provides practical examples and workflows for implementing the unified dossier architecture. It covers:
- Database setup and migrations
- Backend API implementation patterns
- Frontend component patterns
- Testing strategies
- Common workflows

---

## Prerequisites

- Node.js 18+ LTS
- pnpm (package manager)
- Supabase CLI
- PostgreSQL 15+ (via Supabase)
- Git

---

## Setup

### 1. Database Migrations

Run migrations in order:

```bash
# From project root
cd supabase/migrations

# Apply migrations
supabase db push

# OR apply individually
supabase migration up YYYYMMDDHHMMSS_create_unified_dossiers.sql
supabase migration up YYYYMMDDHHMMSS_create_extension_tables.sql
supabase migration up YYYYMMDDHHMMSS_create_relationships.sql
supabase migration up YYYYMMDDHHMMSS_create_calendar.sql
supabase migration up YYYYMMDDHHMMSS_update_rls_policies.sql
supabase migration up YYYYMMDDHHMMSS_create_indexes.sql
supabase migration up YYYYMMDDHHMMSS_migrate_data.sql
supabase migration up YYYYMMDDHHMMSS_update_polymorphic_refs.sql
```

### 2. Generate TypeScript Types

```bash
# Generate types from database schema
supabase gen types typescript --local > backend/src/types/database.types.ts

# Or use MCP tool
mcp__supabase__generate_typescript_types --project_id zkrcjzdemdmwhearhfgg
```

### 3. Install Dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

---

## Backend Patterns

### Creating a Dossier

**File**: `backend/src/services/dossier-service.ts`

```typescript
import { Database } from '../types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

type Dossier = Database['public']['Tables']['dossiers']['Row'];
type Country = Database['public']['Tables']['countries']['Row'];

export class DossierService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async createCountryDossier(data: {
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    iso_code_2: string;
    iso_code_3: string;
    capital_en?: string;
    capital_ar?: string;
    region?: string;
  }): Promise<Dossier> {
    // Transaction: Insert dossier + extension
    const { data: dossier, error: dossierError } = await this.supabase
      .from('dossiers')
      .insert({
        type: 'country',
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en,
        description_ar: data.description_ar,
        status: 'active',
        sensitivity_level: 1
      })
      .select()
      .single();

    if (dossierError) throw dossierError;

    const { error: countryError } = await this.supabase
      .from('countries')
      .insert({
        id: dossier.id,
        iso_code_2: data.iso_code_2,
        iso_code_3: data.iso_code_3,
        capital_en: data.capital_en,
        capital_ar: data.capital_ar,
        region: data.region
      });

    if (countryError) throw countryError;

    return dossier;
  }

  async getDossierWithExtension(id: string): Promise<any> {
    // Get dossier
    const { data: dossier, error } = await this.supabase
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch extension data based on type
    let extensionData = null;
    switch (dossier.type) {
      case 'country':
        const { data: country } = await this.supabase
          .from('countries')
          .select('*')
          .eq('id', id)
          .single();
        extensionData = country;
        break;
      case 'organization':
        const { data: org } = await this.supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();
        extensionData = org;
        break;
      // ... other types
    }

    return {
      ...dossier,
      extension_data: extensionData
    };
  }
}
```

### Creating Relationships

**File**: `backend/src/services/relationship-service.ts`

```typescript
export class RelationshipService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async createRelationship(data: {
    source_dossier_id: string;
    target_dossier_id: string;
    relationship_type: string;
    notes_en?: string;
    notes_ar?: string;
  }) {
    const { data: relationship, error } = await this.supabase
      .from('dossier_relationships')
      .insert({
        source_dossier_id: data.source_dossier_id,
        target_dossier_id: data.target_dossier_id,
        relationship_type: data.relationship_type,
        notes_en: data.notes_en,
        notes_ar: data.notes_ar,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return relationship;
  }

  async getBidirectionalRelationships(dossierId: string) {
    const { data, error } = await this.supabase
      .from('dossier_relationships')
      .select(`
        id,
        source_dossier_id,
        target_dossier_id,
        relationship_type,
        status,
        source:dossiers!source_dossier_id(id, type, name_en, name_ar),
        target:dossiers!target_dossier_id(id, type, name_en, name_ar)
      `)
      .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }
}
```

### Graph Traversal

```typescript
export class GraphService {
  async traverseGraph(startDossierId: string, maxDegrees: number = 2) {
    const { data, error } = await this.supabase.rpc('traverse_relationship_graph', {
      start_dossier_id: startDossierId,
      max_degrees: maxDegrees
    });

    if (error) throw error;
    return data;
  }
}

// Database function (in migration):
/*
CREATE OR REPLACE FUNCTION traverse_relationship_graph(
  start_dossier_id UUID,
  max_degrees INTEGER DEFAULT 2
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  name_en TEXT,
  degree INTEGER,
  path UUID[],
  relationship_path TEXT[]
)
AS $$
WITH RECURSIVE relationship_graph AS (
  SELECT
    dr.target_dossier_id AS dossier_id,
    1 AS degree,
    ARRAY[start_dossier_id, dr.target_dossier_id] AS path,
    ARRAY[dr.relationship_type] AS relationship_path
  FROM dossier_relationships dr
  WHERE dr.source_dossier_id = start_dossier_id
    AND dr.status = 'active'

  UNION

  SELECT
    dr.target_dossier_id,
    rg.degree + 1,
    rg.path || dr.target_dossier_id,
    rg.relationship_path || dr.relationship_type
  FROM relationship_graph rg
  JOIN dossier_relationships dr ON dr.source_dossier_id = rg.dossier_id
  WHERE rg.degree < max_degrees
    AND NOT (dr.target_dossier_id = ANY(rg.path))
    AND dr.status = 'active'
)
SELECT DISTINCT
  d.id AS dossier_id,
  d.type AS dossier_type,
  d.name_en,
  rg.degree,
  rg.path,
  rg.relationship_path
FROM relationship_graph rg
JOIN dossiers d ON d.id = rg.dossier_id
WHERE d.status = 'active'
ORDER BY rg.degree, d.name_en;
$$ LANGUAGE sql STABLE;
*/
```

---

## Frontend Patterns

### Universal Dossier Card Component

**File**: `frontend/src/components/dossier/UniversalDossierCard.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DossierCardProps {
  dossier: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    status: string;
    extension_data?: any;
  };
}

export function UniversalDossierCard({ dossier }: DossierCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const name = isRTL ? dossier.name_ar : dossier.name_en;
  const description = isRTL ? dossier.description_ar : dossier.description_en;

  return (
    <Card
      className="h-full transition-shadow hover:shadow-lg"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{t(`dossier.type.${dossier.type}`)}</Badge>
          <Badge variant={dossier.status === 'active' ? 'default' : 'secondary'}>
            {t(`dossier.status.${dossier.status}`)}
          </Badge>
        </div>
        <CardTitle className="text-lg sm:text-xl line-clamp-2">{name}</CardTitle>
        {description && (
          <CardDescription className="text-sm line-clamp-3">
            {description}
          </CardDescription>
        )}

        {/* Type-specific info */}
        {dossier.type === 'country' && dossier.extension_data && (
          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
            <span>{dossier.extension_data.iso_code_2}</span>
            {dossier.extension_data.capital_en && (
              <span>• {dossier.extension_data.capital_en}</span>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
```

### TanStack Query Hook

**File**: `frontend/src/hooks/useDossier.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dossierApi } from '@/services/dossier-api';

export function useDossier(id: string) {
  return useQuery({
    queryKey: ['dossier', id],
    queryFn: () => dossierApi.getById(id),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useCreateDossier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dossierApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    }
  });
}

export function useUpdateDossier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      dossierApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dossier', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    }
  });
}
```

---

## Common Workflows

### Workflow 1: Create Country with Bilateral Relationship

```typescript
// 1. Create two country dossiers
const saudiArabia = await dossierService.createCountryDossier({
  name_en: 'Saudi Arabia',
  name_ar: 'المملكة العربية السعودية',
  iso_code_2: 'SA',
  iso_code_3: 'SAU',
  capital_en: 'Riyadh',
  capital_ar: 'الرياض',
  region: 'Asia'
});

const china = await dossierService.createCountryDossier({
  name_en: 'China',
  name_ar: 'الصين',
  iso_code_2: 'CN',
  iso_code_3: 'CHN',
  capital_en: 'Beijing',
  capital_ar: 'بكين',
  region: 'Asia'
});

// 2. Create bilateral relationship
await relationshipService.createRelationship({
  source_dossier_id: saudiArabia.id,
  target_dossier_id: china.id,
  relationship_type: 'bilateral_relation',
  notes_en: 'Strategic partnership established in 2023'
});
```

### Workflow 2: Create Engagement with Participants

```typescript
// 1. Create engagement dossier
const engagement = await dossierService.createEngagementDossier({
  name_en: 'Saudi-China Trade Summit 2025',
  name_ar: 'قمة التجارة السعودية الصينية 2025',
  engagement_type: 'meeting',
  engagement_category: 'bilateral',
  location_en: 'Riyadh'
});

// 2. Link participants via relationships
await relationshipService.createRelationship({
  source_dossier_id: engagement.id,
  target_dossier_id: saudiArabiaId,
  relationship_type: 'involves'
});

await relationshipService.createRelationship({
  source_dossier_id: engagement.id,
  target_dossier_id: chinaId,
  relationship_type: 'involves'
});

// 3. Create calendar event for the engagement
await calendarService.createEvent({
  dossier_id: engagement.id,
  event_type: 'main_event',
  title_en: 'Opening Ceremony',
  start_datetime: '2025-03-15T09:00:00Z',
  end_datetime: '2025-03-15T12:00:00Z',
  location_en: 'King Abdulaziz Conference Center',
  is_virtual: false,
  status: 'planned'
});
```

### Workflow 3: Search and Filter Dossiers

```typescript
// Frontend component
function DossierSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dossiers', 'search', searchQuery, typeFilter],
    queryFn: () =>
      dossierApi.search({
        q: searchQuery,
        type: typeFilter || undefined,
        limit: 20
      }),
    enabled: searchQuery.length >= 2
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Type filters */}
      <div className="flex gap-2 mt-4">
        {['country', 'organization', 'forum', 'engagement'].map((type) => (
          <Button
            key={type}
            variant={typeFilter === type ? 'default' : 'outline'}
            onClick={() => setTypeFilter(type === typeFilter ? null : type)}
          >
            {t(`dossier.type.${type}`)}
          </Button>
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {data?.data.map((dossier) => (
          <UniversalDossierCard key={dossier.id} dossier={dossier} />
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

### Unit Test Example

**File**: `backend/tests/unit/dossier-service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DossierService } from '../../src/services/dossier-service';
import { createMockSupabaseClient } from '../mocks/supabase';

describe('DossierService', () => {
  let service: DossierService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new DossierService(mockSupabase);
  });

  it('should create country dossier with extension', async () => {
    const countryData = {
      name_en: 'Saudi Arabia',
      name_ar: 'المملكة العربية السعودية',
      iso_code_2: 'SA',
      iso_code_3: 'SAU'
    };

    const result = await service.createCountryDossier(countryData);

    expect(result.type).toBe('country');
    expect(result.name_en).toBe('Saudi Arabia');
    expect(mockSupabase.from).toHaveBeenCalledWith('dossiers');
    expect(mockSupabase.from).toHaveBeenCalledWith('countries');
  });
});
```

### E2E Test Example

**File**: `frontend/tests/e2e/dossier-crud.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('create and view country dossier', async ({ page }) => {
  // Navigate to create page
  await page.goto('/dossiers/create');

  // Select country type
  await page.click('[data-testid="type-select"]');
  await page.click('[data-testid="type-option-country"]');

  // Fill form (bilingual)
  await page.fill('[name="name_en"]', 'Saudi Arabia');
  await page.fill('[name="name_ar"]', 'المملكة العربية السعودية');
  await page.fill('[name="iso_code_2"]', 'SA');
  await page.fill('[name="iso_code_3"]', 'SAU');

  // Submit
  await page.click('[type="submit"]');

  // Verify redirect to detail page
  await expect(page).toHaveURL(/\/dossiers\/[a-f0-9-]+/);
  await expect(page.locator('h1')).toContainText('Saudi Arabia');

  // Verify type badge
  await expect(page.locator('[data-testid="type-badge"]')).toContainText('Country');
});
```

---

## Performance Tips

### 1. Use Indexes

```sql
-- Already created in migrations, but verify:
CREATE INDEX idx_dossiers_type_status ON dossiers(type, status);
CREATE INDEX idx_dossiers_search_vector ON dossiers USING GiST(search_vector);
```

### 2. Cache Frequently Accessed Data

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedDossier(id: string) {
  const cached = await redis.get(`dossier:${id}`);
  if (cached) return JSON.parse(cached);

  const dossier = await dossierService.getDossierWithExtension(id);
  await redis.setex(`dossier:${id}`, 300, JSON.stringify(dossier)); // 5 min TTL

  return dossier;
}
```

### 3. Optimize Graph Queries

```typescript
// Limit degrees and use indexes
const MAX_DEGREES = 3;

const graph = await graphService.traverseGraph(startId, MAX_DEGREES);
```

---

## Troubleshooting

### Issue: TypeScript errors after schema changes

**Solution**:
```bash
supabase gen types typescript --local > backend/src/types/database.types.ts
pnpm typecheck
```

### Issue: RLS policy blocking queries

**Solution**: Check user's clearance level
```sql
SELECT clearance_level FROM profiles WHERE id = auth.uid();
```

### Issue: Slow full-text search

**Solution**: Verify GiST index exists
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'dossiers';
-- Should include idx_dossiers_search_vector
```

---

## Next Steps

1. Run `/speckit.tasks` to generate actionable implementation tasks
2. Implement database migrations
3. Build backend services
4. Create frontend components
5. Write tests
6. Deploy to staging

---

**Quickstart Complete**: Developers have all necessary patterns and examples to implement unified dossier architecture.
