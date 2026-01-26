# Dossier Extension Pattern Documentation

**Date**: 2026-01-27
**Feature**: Organization Dossier Phase 1
**Status**: Active

---

## Overview

The Intl-Dossier system uses a **Class Table Inheritance** pattern to support multiple dossier types (country, organization, person, engagement, forum, working_group, topic, elected_official) while maintaining a unified base structure.

This document explains the architecture, implementation patterns, and best practices for extending dossier types.

---

## Architecture

### Class Table Inheritance Pattern

```
┌─────────────────────────────────────────────────────────┐
│                     dossiers (base)                     │
│  id | type | name_en | name_ar | description_en | ...  │
└─────────────────────────────────────────────────────────┘
           │
           │ 1:1 relationship via matching id
           │
     ┌─────┴─────┬─────────────────┬─────────────────┐
     │           │                 │                 │
     ▼           ▼                 ▼                 ▼
┌─────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────────┐
│countries│ │organizations │ │ persons  │ │ engagements    │
│ id (PK) │ │   id (PK)    │ │ id (PK)  │ │    id (PK)     │
│iso_code │ │  org_code    │ │ title_en │ │engagement_type │
│ region  │ │  org_type    │ │photo_url │ │   location_en  │
│  ...    │ │  website     │ │   ...    │ │      ...       │
└─────────┘ └──────────────┘ └──────────┘ └────────────────┘
```

### Key Principles

1. **Base Table**: `dossiers` contains common fields (name, description, timestamps, etc.)
2. **Extension Tables**: Type-specific tables (`countries`, `organizations`, etc.) share the same `id` as their parent dossier
3. **Type Validation**: Database triggers ensure extension records match the dossier's `type` field
4. **Foreign Keys**: Extension table `id` references `dossiers(id)` with `ON DELETE CASCADE`

---

## Database Schema Pattern

### Extension Table Structure

```sql
-- Example: organizations extension table
CREATE TABLE organizations (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  org_code TEXT UNIQUE,
  org_type TEXT NOT NULL CHECK (org_type IN ('government', 'ngo', 'private', 'international', 'academic')),
  headquarters_country_id UUID REFERENCES countries(id),
  parent_org_id UUID REFERENCES organizations(id) CHECK (parent_org_id != id),
  website TEXT,
  email TEXT,
  phone TEXT,
  address_en TEXT,
  address_ar TEXT,
  logo_url TEXT,
  established_date DATE
);

-- Type validation trigger
CREATE TRIGGER validate_organization_type
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('organization');
```

### Validation Function

```sql
CREATE OR REPLACE FUNCTION validate_dossier_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = NEW.id AND type = TG_ARGV[0]
  ) THEN
    RAISE EXCEPTION 'Dossier % must have type=%', NEW.id, TG_ARGV[0];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## TypeScript Type Pattern

### Discriminated Union Pattern

```typescript
// Base interface shared by all dossier types
export interface BaseDossier {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  created_at: string;
  updated_at: string;
}

// Extension interface for each type
export interface OrganizationExtension {
  org_code?: string;
  org_type: 'government' | 'ngo' | 'international' | 'private' | 'academic';
  parent_org_id?: string;
  headquarters_country_id?: string;
  website?: string;
  email?: string;
  phone?: string;
  address_en?: string;
  address_ar?: string;
  logo_url?: string;
  established_date?: string;
}

// Typed dossier with extension
export interface OrganizationDossier extends BaseDossier {
  type: 'organization';
  extension: OrganizationExtension;
}

// Discriminated union of all dossier types
export type Dossier = CountryDossier | OrganizationDossier | PersonDossier | EngagementDossier;
// ... other types
```

### Type Guards

```typescript
// Type guard for runtime type checking
export function isOrganizationDossier(dossier: Dossier): dossier is OrganizationDossier {
  return dossier.type === 'organization';
}

// Assertion for route loaders
export function assertDossierType(
  dossier: Dossier,
  expectedType: DossierType
): asserts dossier is Extract<Dossier, { type: typeof expectedType }> {
  if (dossier.type !== expectedType) {
    throw new Error(`Dossier type mismatch: expected "${expectedType}", got "${dossier.type}"`);
  }
}
```

---

## Query Patterns

### Fetching with Extension Data

```typescript
// Fetch dossier with extension using Supabase
const { data, error } = await supabase
  .from('dossiers')
  .select(
    `
    id,
    name_en,
    name_ar,
    type,
    organizations (
      org_code,
      org_type,
      parent_org_id,
      headquarters_country_id,
      website,
      email,
      phone,
      address_en,
      address_ar,
      logo_url,
      established_date
    )
  `
  )
  .eq('id', dossierId)
  .eq('type', 'organization')
  .single();

// Transform to typed dossier
const dossier: OrganizationDossier = {
  ...data,
  type: 'organization',
  extension: Array.isArray(data.organizations) ? data.organizations[0] : data.organizations,
};
```

### Fetching Related Data

```typescript
// Fetch headquarters country name
const { data: country } = await supabase
  .from('dossiers')
  .select('name_en, name_ar')
  .eq('id', extension.headquarters_country_id)
  .single();
```

---

## Implementation Checklist

When adding or modifying a dossier extension type:

### Database Layer

- [ ] Extension table exists with correct columns
- [ ] Primary key references `dossiers(id)` with `ON DELETE CASCADE`
- [ ] Type validation trigger is configured
- [ ] CHECK constraints for enum-like fields
- [ ] Indexes on frequently queried columns (foreign keys, filters)
- [ ] RLS policies for SELECT, INSERT, UPDATE, DELETE

### TypeScript Layer

- [ ] Extension interface matches database schema exactly
- [ ] Typed dossier interface extends `BaseDossier`
- [ ] Type included in `Dossier` discriminated union
- [ ] Type guard function exists
- [ ] `getDossierTypeLabel()` includes the type
- [ ] `getAllDossierTypes()` includes the type

### i18n Layer

- [ ] `type.<type_name>` key in EN and AR
- [ ] `typeDescription.<type_name>` key in EN and AR
- [ ] `sections.<type_name>.fields.*` keys for all extension fields
- [ ] Enum value labels (e.g., `sections.organization.orgType.academic`)

### Component Layer

- [ ] Type-specific page/route exists
- [ ] Section components use i18n keys (not hardcoded labels)
- [ ] Mobile-first responsive design
- [ ] RTL support with logical properties
- [ ] `dir={isRTL ? 'rtl' : 'ltr'}` on containers
- [ ] Language-aware field display (e.g., `address_en` vs `address_ar`)

---

## Common Pitfalls

### 1. TypeScript/Database Mismatch

**Problem**: TypeScript types don't match database schema.

```typescript
// WRONG: field name mismatch
interface OrganizationExtension {
  website_url?: string; // Database has 'website'
}
```

**Solution**: Always verify field names against the migration file:

```sql
-- Check: supabase/migrations/20251022000002_create_extension_tables.sql
website TEXT,  -- Not website_url
```

### 2. Missing Enum Values

**Problem**: TypeScript enum doesn't include all database values.

```typescript
// WRONG: missing 'academic'
org_type: 'government' | 'ngo' | 'international' | 'private';
```

**Solution**: Check database CHECK constraint:

```sql
CHECK (org_type IN ('government', 'ngo', 'private', 'international', 'academic'))
```

### 3. Non-Existent Fields

**Problem**: TypeScript references fields that don't exist in database.

```typescript
// WRONG: head_count doesn't exist in organizations table
head_count?: number
```

**Solution**: Remove non-existent fields and add missing ones from the schema.

### 4. Hardcoded Labels

**Problem**: Component uses hardcoded strings instead of i18n.

```tsx
// WRONG
<label>Organization Code</label>

// RIGHT
<label>{t('sections.organization.fields.orgCode')}</label>
```

### 5. Forgetting RTL Support

**Problem**: Component doesn't handle RTL languages.

```tsx
// WRONG
<div className="ml-4 text-left">

// RIGHT
<div className="ms-4 text-start" dir={isRTL ? 'rtl' : 'ltr'}>
```

---

## Extension Types Reference

| Type             | Extension Table | Key Fields                                             |
| ---------------- | --------------- | ------------------------------------------------------ |
| country          | countries       | iso_code_2, iso_code_3, capital_en, region, population |
| organization     | organizations   | org_code, org_type, headquarters_country_id, website   |
| person           | persons         | title_en, nationality_country_id, biography_en         |
| engagement       | engagements     | engagement_type, engagement_category, location_en      |
| forum            | forums          | number_of_sessions, keynote_speakers, sponsors         |
| working_group    | working_groups  | mandate_en, lead_org_id, wg_status                     |
| topic/theme      | themes          | theme_category, parent_theme_id                        |
| elected_official | (custom)        | office_type, term_start, committee_assignments         |

---

## Related Files

- **Database Migrations**: `supabase/migrations/20251022000002_create_extension_tables.sql`
- **TypeScript Types**: `frontend/src/lib/dossier-type-guards.ts`
- **i18n Keys**: `frontend/src/i18n/en/dossier.json`, `frontend/src/i18n/ar/dossier.json`
- **Route Configuration**: `frontend/src/lib/dossier-routes.ts`

---

## Changelog

| Date       | Change                                                 |
| ---------- | ------------------------------------------------------ |
| 2026-01-27 | Initial documentation for Organization Dossier Phase 1 |
