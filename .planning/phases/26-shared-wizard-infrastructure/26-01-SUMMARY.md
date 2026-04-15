---
phase: 26-shared-wizard-infrastructure
plan: 01
subsystem: wizard-type-contracts
tags: [zod-schemas, type-definitions, defaults-factory, wave-1]
dependency_graph:
  requires: [26-00]
  provides: [wizard-config-types, per-type-schemas, defaults-factory]
  affects: [26-02, 26-03]
tech_stack:
  added: []
  patterns: [base-merge-schema-composition, defaults-factory-pattern]
key_files:
  created:
    - frontend/src/components/dossier/wizard/config/types.ts
    - frontend/src/components/dossier/wizard/schemas/base.schema.ts
    - frontend/src/components/dossier/wizard/schemas/country.schema.ts
    - frontend/src/components/dossier/wizard/schemas/organization.schema.ts
    - frontend/src/components/dossier/wizard/schemas/topic.schema.ts
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts
    - frontend/src/components/dossier/wizard/schemas/forum.schema.ts
    - frontend/src/components/dossier/wizard/schemas/working-group.schema.ts
    - frontend/src/components/dossier/wizard/schemas/engagement.schema.ts
    - frontend/src/components/dossier/wizard/schemas/elected-official.schema.ts
    - frontend/src/components/dossier/wizard/schemas/index.ts
    - frontend/src/components/dossier/wizard/defaults/base.defaults.ts
    - frontend/src/components/dossier/wizard/defaults/index.ts
  modified:
    - frontend/src/components/dossier/wizard/schemas/__tests__/schemas.test.ts
    - frontend/src/components/dossier/wizard/defaults/__tests__/defaults.test.ts
decisions:
  - Per-type schemas use flat top-level fields (no extension_data nesting) per D-07
  - electedOfficialSchema extends personSchema not baseDossierSchema
  - getDefaultsForType only covers 7 DossierType values; elected_official handled via Phase 30 override
  - Wave 0 test stubs converted from require() to static import for vitest compatibility
metrics:
  duration: 4m
  completed: 2026-04-15
---

# Phase 26 Plan 01: Type Contracts, Schemas, and Defaults Summary

WizardConfig<T>/CreateWizardReturn<T> type definitions, 9 per-type Zod schemas via base.merge() composition, and getDefaultsForType() factory for all 7 DossierType values

## What Was Done

### Task 1: WizardConfig types and per-type Zod schemas (c3929e8c)

Created `config/types.ts` with `WizardConfig<T extends FieldValues>` and `CreateWizardReturn<T extends FieldValues>` interfaces that downstream plans (02 hook, 03 shell) depend on.

Created `baseDossierSchema` with shared fields (name_en, name_ar, abbreviation, description, status, sensitivity_level, tags) -- no `type` field, no `extension_data` nesting.

Created 8 per-type schema files, each using `baseDossierSchema.merge(typeFields)`:
- country: iso_code_2, iso_code_3, capital, region
- organization: org_type, org_code, website, headquarters
- topic: theme_category
- person: title, photo_url, biography, person_subtype
- forum: forum_type, organizing_body_id
- working-group: wg_status, established_date, mandate, parent_body_id
- engagement: engagement_type, category, location, dates, participant_ids
- elected-official: extends personSchema (not base) with office_title, term dates, constituency, political_party; overrides person_subtype default to 'elected_official'

Created `schemas/index.ts` re-exporting all 9 schemas and 9 type aliases.

### Task 2: Defaults factory and base defaults (7c9a1ad9)

Created `defaults/base.defaults.ts` with `baseDefaults: BaseDossierFormData` (status 'active', sensitivity_level 1, empty strings).

Created `defaults/index.ts` with `getDefaultsForType<T>(type: DossierType): T` covering all 7 types. Each type-specific defaults object spreads `baseDefaults` with type-specific fields initialized to empty strings, empty arrays, or sensible defaults. Inline comment documents that elected_official is not a DossierType and Phase 30 uses person defaults with person_subtype override.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wave 0 test stubs used require() which vitest cannot resolve for .ts files**
- **Found during:** Task 1 verification
- **Issue:** Test stubs from Plan 00 used `require('../base.schema')` pattern which fails with MODULE_NOT_FOUND because vitest's require() doesn't resolve .ts extensions
- **Fix:** Converted both test files from `require()` to static `import` statements
- **Files modified:** schemas/__tests__/schemas.test.ts, defaults/__tests__/defaults.test.ts
- **Commits:** c3929e8c, 7c9a1ad9

## Test Results

- schemas.test.ts: 7/7 passed (base validation, country fields, elected-official extension, index re-exports)
- defaults.test.ts: 5/5 passed (country defaults, person subtype, all 7 types, elected_official pattern, baseDefaults export)
- TypeScript compilation: 0 errors in wizard/ files

## Self-Check: PASSED
