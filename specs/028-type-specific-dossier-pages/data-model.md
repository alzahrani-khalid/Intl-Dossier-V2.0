# Data Model: Type-Specific Dossier Detail Pages

**Feature**: 028-type-specific-dossier-pages
**Date**: 2025-10-28

---

## Overview

This feature leverages the **existing unified dossier schema** from feature 026-unified-dossier-architecture. No new database tables or schema changes are required. This document references the existing data model and describes how type-specific page components will consume it.

---

## Existing Database Schema (No Changes)

### Core Dossier Table

```sql
-- Already exists from feature 026
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('country', 'organization', 'person', 'engagement', 'forum', 'working_group')),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  extension JSONB NOT NULL, -- Type-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_dossiers_type ON dossiers(type);
CREATE INDEX idx_dossiers_extension ON dossiers USING GIN(extension);
```

### Type-Specific Extension Schemas

Each dossier type stores unique data in the `extension` JSONB column:

#### Country Extension
```typescript
interface CountryExtension {
  iso_code_2: string;        // ISO 3166-1 alpha-2 (e.g., "SA")
  iso_code_3: string;        // ISO 3166-1 alpha-3 (e.g., "SAU")
  region: string;            // Geographic region
  capital: string;           // Capital city
  population?: number;
  gdp_usd?: number;
  official_languages: string[];
  government_type?: string;
}
```

#### Organization Extension
```typescript
interface OrganizationExtension {
  org_code: string;          // Unique organization code
  org_type: 'government' | 'ngo' | 'international' | 'private';
  parent_org_id?: string;    // For hierarchical organizations
  head_count?: number;
  established_date?: string;
  website_url?: string;
}
```

#### Person Extension
```typescript
interface PersonExtension {
  title?: string;            // Professional title
  photo_url?: string;        // Profile photo
  birth_date?: string;
  nationality?: string;
  education?: string[];
  languages?: string[];
  current_position?: {
    title: string;
    organization: string;
    start_date: string;
  };
}
```

#### Engagement Extension
```typescript
interface EngagementExtension {
  engagement_type: 'meeting' | 'conference' | 'visit' | 'negotiation';
  start_date: string;
  end_date?: string;
  location?: string;
  participants: Array<{
    dossier_id: string;
    role: string;
  }>;
  outcomes?: string[];
}
```

#### Forum Extension
```typescript
interface ForumExtension {
  forum_type: 'bilateral' | 'multilateral' | 'working_group';
  member_organizations: string[];  // Dossier IDs
  meeting_frequency?: string;
  next_meeting_date?: string;
  deliverables?: Array<{
    name: string;
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
}
```

#### Working Group Extension
```typescript
interface WorkingGroupExtension {
  parent_forum_id?: string;
  chair_organization?: string;
  mandate: string;
  start_date: string;
  end_date?: string;
  members: Array<{
    dossier_id: string;
    role: 'chair' | 'member' | 'observer';
  }>;
}
```

---

## Related Tables (Already Exist)

### Dossier Relationships
```sql
-- Already exists from feature 026
CREATE TABLE dossier_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  target_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  effective_from DATE,
  effective_to DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Documents
```sql
-- Already exists from feature 026
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);
```

### Calendar Entries
```sql
-- Already exists from feature 026
CREATE TABLE calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('meeting', 'deadline', 'milestone', 'event')),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  related_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## TypeScript Type Definitions

### Discriminated Union Pattern

```typescript
// Base dossier interface
interface BaseDossier {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Type-specific dossier interfaces
interface CountryDossier extends BaseDossier {
  type: 'country';
  extension: CountryExtension;
}

interface OrganizationDossier extends BaseDossier {
  type: 'organization';
  extension: OrganizationExtension;
}

interface PersonDossier extends BaseDossier {
  type: 'person';
  extension: PersonExtension;
}

interface EngagementDossier extends BaseDossier {
  type: 'engagement';
  extension: EngagementExtension;
}

interface ForumDossier extends BaseDossier {
  type: 'forum';
  extension: ForumExtension;
}

interface WorkingGroupDossier extends BaseDossier {
  type: 'working_group';
  extension: WorkingGroupExtension;
}

// Discriminated union
type Dossier =
  | CountryDossier
  | OrganizationDossier
  | PersonDossier
  | EngagementDossier
  | ForumDossier
  | WorkingGroupDossier;

// Type guards
export function isCountryDossier(dossier: Dossier): dossier is CountryDossier {
  return dossier.type === 'country';
}

export function isOrganizationDossier(dossier: Dossier): dossier is OrganizationDossier {
  return dossier.type === 'organization';
}

export function isPersonDossier(dossier: Dossier): dossier is PersonDossier {
  return dossier.type === 'person';
}

export function isEngagementDossier(dossier: Dossier): dossier is EngagementDossier {
  return dossier.type === 'engagement';
}

export function isForumDossier(dossier: Dossier): dossier is ForumDossier {
  return dossier.type === 'forum';
}

export function isWorkingGroupDossier(dossier: Dossier): dossier is WorkingGroupDossier {
  return dossier.type === 'working_group';
}
```

---

## Data Access Patterns

### Existing Supabase Queries (No Changes)

```typescript
// Fetch single dossier by ID
const { data: dossier, error } = await supabase
  .from('dossiers')
  .select('*')
  .eq('id', dossierId)
  .single();

// Fetch dossiers by type
const { data: countries, error } = await supabase
  .from('dossiers')
  .select('*')
  .eq('type', 'country');

// Fetch dossier with relationships
const { data: dossier, error } = await supabase
  .from('dossiers')
  .select(`
    *,
    source_relationships:dossier_relationships!source_dossier_id(
      id,
      target_dossier_id,
      relationship_type,
      effective_from,
      effective_to
    ),
    target_relationships:dossier_relationships!target_dossier_id(
      id,
      source_dossier_id,
      relationship_type,
      effective_from,
      effective_to
    )
  `)
  .eq('id', dossierId)
  .single();

// Fetch dossier counts by type (for Dossiers Hub)
const { count: countryCount } = await supabase
  .from('dossiers')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'country');
```

### TanStack Query Hooks (New)

```typescript
// Hook for fetching single dossier with type narrowing
export function useDossier<T extends DossierType>(
  id: string,
  expectedType: T
) {
  const { data, ...rest } = useQuery({
    queryKey: ['dossier', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data.type !== expectedType) {
        throw new Error(`Type mismatch: expected ${expectedType}, got ${data.type}`);
      }

      return data;
    },
  });

  return {
    data: data as Extract<Dossier, { type: T }>,
    ...rest,
  };
}

// Hook for fetching dossier counts (for Dossiers Hub)
export function useDossierCounts() {
  return useQuery({
    queryKey: ['dossier-counts'],
    queryFn: async () => {
      const types: DossierType[] = ['country', 'organization', 'person', 'engagement', 'forum', 'working_group'];
      const counts: Record<DossierType, number> = {} as any;

      await Promise.all(
        types.map(async (type) => {
          const { count } = await supabase
            .from('dossiers')
            .select('*', { count: 'exact', head: true })
            .eq('type', type);
          counts[type] = count || 0;
        })
      );

      return counts;
    },
  });
}
```

---

## Summary

- **No database schema changes required** - leveraging existing unified dossier architecture from feature 026
- **Type-specific data** stored in JSONB `extension` column with well-defined TypeScript interfaces
- **Discriminated unions** enable compile-time type safety for 6 dossier types
- **Type guards** provide runtime validation at route/component boundaries
- **TanStack Query hooks** abstract Supabase data fetching with type narrowing
- **All data access** uses existing RLS policies and Supabase client configuration

---

**Status**: ✅ **Data Model Complete** - No schema migrations needed
