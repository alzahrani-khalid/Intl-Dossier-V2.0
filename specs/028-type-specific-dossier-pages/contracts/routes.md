# Route Contracts: Type-Specific Dossier Detail Pages

**Feature**: 028-type-specific-dossier-pages
**Date**: 2025-10-28

---

## Overview

This document defines the routing structure for type-specific dossier pages using TanStack Router v5. All routes use file-based routing with type-safe loaders and discriminated union type checking.

---

## Route Hierarchy

```
/dossiers
├── /                                    # Dossiers Hub
├── /countries                           # Country list
│   └── /:id                            # Country detail
├── /organizations                       # Organization list
│   └── /:id                            # Organization detail
├── /persons                             # Person list
│   └── /:id                            # Person detail
├── /engagements                         # Engagement list
│   └── /:id                            # Engagement detail
├── /forums                              # Forum list
│   └── /:id                            # Forum detail
└── /working-groups                      # Working group list
    └── /:id                            # Working group detail
```

---

## Route Definitions

### 1. Dossiers Hub

**File**: `/frontend/src/routes/_protected/dossiers/index.tsx`

**Route**: `/dossiers`

**Purpose**: Central navigation hub displaying all 6 dossier types as BentoGrid cards with counts

**Loader**: Fetches dossier counts for each type

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/_protected/dossiers/')({
  component: DossiersHub,
  loader: async () => {
    const types = ['country', 'organization', 'person', 'engagement', 'forum', 'working_group'] as const;
    const counts = {} as Record<typeof types[number], number>;

    await Promise.all(
      types.map(async (type) => {
        const { count } = await supabase
          .from('dossiers')
          .select('*', { count: 'exact', head: true })
          .eq('type', type);
        counts[type] = count || 0;
      })
    );

    return { counts };
  },
});
```

---

### 2. Country Dossier Detail

**File**: `/frontend/src/routes/_protected/dossiers/countries/$id.tsx`

**Route**: `/dossiers/countries/:id`

**Purpose**: Display country-specific layout with geographic context, diplomatic relations, bilateral agreements

**Loader**: Fetches country dossier with type validation

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { isCountryDossier } from '@/lib/dossier-type-guards';

export const Route = createFileRoute('/_protected/dossiers/countries/$id')({
  component: CountryDossierPage,
  loader: async ({ params }) => {
    const { data: dossier, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!isCountryDossier(dossier)) {
      throw new Error(`Type mismatch: expected country, got ${dossier.type}`);
    }

    return { dossier };
  },
  errorComponent: ({ error }) => (
    <div className="p-4">
      <h2>Error Loading Country Dossier</h2>
      <p>{error.message}</p>
    </div>
  ),
});
```

---

### 3. Organization Dossier Detail

**File**: `/frontend/src/routes/_protected/dossiers/organizations/$id.tsx`

**Route**: `/dossiers/organizations/:id`

**Purpose**: Display organization-specific layout with org chart, key contacts, MoUs

**Loader**: Similar to country, validates organization type

---

### 4. Person Dossier Detail

**File**: `/frontend/src/routes/_protected/dossiers/persons/$id.tsx`

**Route**: `/dossiers/persons/:id`

**Purpose**: Display person-specific layout with profile, positions, interactions

**Loader**: Similar to country, validates person type

---

### 5. Engagement Dossier Detail

**File**: `/frontend/src/routes/_protected/dossiers/engagements/$id.tsx`

**Route**: `/dossiers/engagements/:id`

**Purpose**: Display engagement-specific layout with timeline, participants, outcomes

**Loader**: Similar to country, validates engagement type

---

### 6. Forum Dossier Detail

**File**: `/frontend/src/routes/_protected/dossiers/forums/$id.tsx`

**Route**: `/dossiers/forums/:id`

**Purpose**: Display forum-specific layout with members, meeting schedule, deliverables

**Loader**: Similar to country, validates forum type

---

### 7. Working Group Dossier Detail

**File**: `/frontend/src/routes/_protected/dossiers/working-groups/$id.tsx`

**Route**: `/dossiers/working-groups/:id`

**Purpose**: Display working group-specific layout with members, milestones, decisions

**Loader**: Similar to country, validates working_group type

---

## Type Safety Contract

### Type Guard Functions

```typescript
// File: /frontend/src/lib/dossier-type-guards.ts

export type DossierType =
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'forum'
  | 'working_group';

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

### Navigation Type Safety

```typescript
import { useNavigate } from '@tanstack/react-router';

export function DossiersHub() {
  const navigate = useNavigate();

  const handleNavigateToType = (type: DossierType) => {
    // Type-safe route navigation
    navigate({
      from: '/dossiers',
      to: `/dossiers/${type}s`, // ✅ TypeScript validates route exists
    });
  };

  return (
    <BentoGrid>
      <BentoGridItem
        onClick={() => handleNavigateToType('country')}
        title="Countries"
      />
      {/* ...other types */}
    </BentoGrid>
  );
}
```

---

## Route Parameters

| Route | Param | Type | Description |
|-------|-------|------|-------------|
| `/dossiers/countries/:id` | `id` | `string` (UUID) | Dossier ID |
| `/dossiers/organizations/:id` | `id` | `string` (UUID) | Dossier ID |
| `/dossiers/persons/:id` | `id` | `string` (UUID) | Dossier ID |
| `/dossiers/engagements/:id` | `id` | `string` (UUID) | Dossier ID |
| `/dossiers/forums/:id` | `id` | `string` (UUID) | Dossier ID |
| `/dossiers/working-groups/:id` | `id` | `string` (UUID) | Dossier ID |

---

## Navigation Flow

```mermaid
graph TD
    A[Sidebar: "Dossiers" Menu Item] --> B[Dossiers Hub]
    B --> C{Select Dossier Type}
    C -->|Countries| D[Country List]
    C -->|Organizations| E[Organization List]
    C -->|Persons| F[Person List]
    C -->|Engagements| G[Engagement List]
    C -->|Forums| H[Forum List]
    C -->|Working Groups| I[Working Group List]

    D --> J[Country Detail Page]
    E --> K[Organization Detail Page]
    F --> L[Person Detail Page]
    G --> M[Engagement Detail Page]
    H --> N[Forum Detail Page]
    I --> O[Working Group Detail Page]

    J --> P{Breadcrumbs}
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    P -->|Back to Hub| B
    P -->|Back to List| D
```

---

## Error Handling

### Type Mismatch Errors

```typescript
// When route expects country but receives organization
if (!isCountryDossier(dossier)) {
  throw new Error(
    `Route type mismatch: expected country, got ${dossier.type}`
  );
}
```

### Not Found Errors

```typescript
// When dossier ID doesn't exist
if (error) {
  throw new Error(`Dossier not found: ${params.id}`);
}
```

### Permission Errors

```typescript
// When user lacks permission to view dossier type
if (!hasPermission(user, dossier.type)) {
  throw new Error(`Unauthorized: cannot view ${dossier.type} dossiers`);
}
```

---

## Performance Considerations

1. **Loader Data Caching**: TanStack Router caches loader data per route
2. **Prefetching**: Hover on BentoGrid card → prefetch dossier data
3. **Lazy Loading**: Type-specific components loaded only when route accessed
4. **Parallel Fetching**: Dossiers Hub fetches all counts in parallel

---

**Status**: ✅ **Route Contracts Complete**
