---
phase: 30-elected-official-wizard
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql
  - frontend/src/components/dossier/wizard/schemas/person.schema.ts
  - frontend/src/components/dossier/wizard/config/person.config.ts
  - frontend/src/components/dossier/wizard/defaults/index.ts
autonomous: true
requirements: [ELOF-01, ELOF-02, ELOF-03]
requirements_addressed: [ELOF-01, ELOF-02, ELOF-03]
tags: [v5.0, wizard, person-subtype, supabase-migration, zod-superRefine]

must_haves:
  truths:
    - "DB accepts an elected-official person row when only office_name_ar is populated (office_name_en NULL) and person_subtype='elected_official'"
    - 'DB still rejects an elected-official person row when BOTH office_name_en and office_name_ar are NULL'
    - "personSchema.superRefine rejects submission when person_subtype='elected_official' and both office_name_en/_ar are empty strings (FAILS with path 'office_name_en' and message key 'office_name_required')"
    - "personSchema.superRefine rejects submission when person_subtype='elected_official' and country_id is empty (FAILS with path 'country_id')"
    - "personSchema.superRefine rejects submission when person_subtype='elected_official' and term_start is empty (FAILS with path 'term_start')"
    - "personSchema accepts same inputs when person_subtype='standard' (new refinements skip for standard persons)"
    - "personWizardConfig.steps returns 4 steps when defaultValues.person_subtype='elected_official', 3 steps otherwise"
    - "getDefaultsForType variant returns { person_subtype: 'elected_official', is_current_term: true, country_id: '', organization_id: '', office_name_en: '', office_name_ar: '', district_en: '', district_ar: '', party_en: '', party_ar: '', term_start: '', term_end: '' }"
  artifacts:
    - path: 'supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql'
      provides: 'Relaxed persons_elected_official_requires_office CHECK constraint'
      contains: 'office_name_en IS NOT NULL OR office_name_ar IS NOT NULL'
    - path: 'frontend/src/components/dossier/wizard/schemas/person.schema.ts'
      provides: 'Extended Zod schema with elected-official fields + superRefine'
      contains: 'superRefine'
    - path: 'frontend/src/components/dossier/wizard/config/person.config.ts'
      provides: 'Subtype-aware step array'
      contains: 'office-term'
    - path: 'frontend/src/components/dossier/wizard/defaults/index.ts'
      provides: 'Elected-official defaults variant'
      contains: 'electedOfficialDefaults'
  key_links:
    - from: 'frontend/src/components/dossier/wizard/schemas/person.schema.ts'
      to: 'personSchema.superRefine'
      via: 'Zod refinement at module scope'
      pattern: "\\.superRefine\\("
    - from: 'frontend/src/components/dossier/wizard/config/person.config.ts'
      to: 'personWizardConfig.steps (function returning array)'
      via: 'Conditional step array based on defaultValues.person_subtype'
      pattern: "person_subtype === 'elected_official'"
    - from: 'supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql'
      to: 'persons_elected_official_requires_office constraint'
      via: 'ALTER TABLE DROP CONSTRAINT / ADD CONSTRAINT'
      pattern: 'persons_elected_official_requires_office'
---

<objective>
Land the schema groundwork for the Elected Official Wizard: relax the DB constraint to allow
Arabic-only office names (D-19), extend the Zod person schema with all ELOF-02 fields plus a
superRefine block that enforces elected-official-specific required-ness (D-15), expose a
subtype-aware step array in the wizard config (D-16), and register an elected-official defaults
variant (D-17).

Purpose: Unblocks Plan 30-02 (OfficeTermStep) and Plan 30-03 (wizard wiring + review step).
Without the relaxed DB constraint, any wizard submission with Arabic-only office_name would be
rejected at insert. Without the schema extensions, the form has nowhere to store office/term data.

Output:

- 1 Supabase migration file applied via Supabase MCP (BLOCKING task)
- person.schema.ts extended in place with 10 new optional fields + superRefine
- person.config.ts with a function-form steps exporter (conditional based on subtype)
- defaults/index.ts with an `electedOfficialDefaults` constant and exported helper
  </objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/30-elected-official-wizard/30-CONTEXT.md
@CLAUDE.md

# Source files being modified (read in full before editing):

@frontend/src/components/dossier/wizard/schemas/person.schema.ts
@frontend/src/components/dossier/wizard/config/person.config.ts
@frontend/src/components/dossier/wizard/defaults/index.ts

# Reference files (read the relevant section — no full reads needed):

@supabase/migrations/20260202000001_merge_elected_official_into_person.sql
@frontend/src/components/dossier/wizard/config/types.ts
</context>

<interfaces>
<!-- Canonical types / contracts downstream plans consume. -->

From frontend/src/components/dossier/wizard/config/types.ts:

```typescript
// WizardStepConfig is a single step descriptor; WizardConfig<T> has:
//   type: DossierType
//   schema: z.ZodType<T>
//   defaultValues: T
//   steps: WizardStepConfig[]   // current shape — NO change in Phase 30
//   filterExtensionData: (data: T) => Partial<T>
```

Current personSchema shape (before Phase 30):

```typescript
export const personSchema = baseDossierSchema.merge(
  z.object({
    title_en: z.string().optional(),
    title_ar: z.string().optional(),
    photo_url: z.string().url().optional().or(z.literal('')),
    biography_en: z.string().optional(),
    biography_ar: z.string().optional(),
    person_subtype: z.enum(['standard', 'elected_official']).default('standard'),
  }),
)
export type PersonFormData = z.infer<typeof personSchema>
```

Phase 30 extends this — Plan 30-02 and 30-03 depend on the new PersonFormData type
containing `office_name_en`, `office_name_ar`, `district_en`, `district_ar`, `party_en`,
`party_ar`, `term_start`, `term_end`, `country_id`, `organization_id`, `is_current_term`.

Canonical DossierPicker prop form (from ForumDetailsStep.tsx, WorkingGroupDetailsStep.tsx):

```typescript
<DossierPicker
  value={field.value ?? ''}
  onChange={(id): void => field.onChange(id ?? '')}
  filterByDossierType="country"   // or "organization"
  placeholder={...}
/>
// Import: import { DossierPicker } from '@/components/work-creation/DossierPicker'
// NOTE: NOT @/components/dossier/DossierPicker — Phase 29 uses work-creation path.
```

Existing CHECK constraint at supabase/migrations/20260202000001_merge_elected_official_into_person.sql:76-78:

```sql
ALTER TABLE persons ADD CONSTRAINT persons_elected_official_requires_office
  CHECK (person_subtype != 'elected_official' OR office_name_en IS NOT NULL);
```

This plan relaxes it to: `CHECK (person_subtype != 'elected_official' OR office_name_en IS NOT NULL OR office_name_ar IS NOT NULL)`
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1 [BLOCKING]: Apply Supabase migration to relax office-name constraint via Supabase MCP</name>
  <files>supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql</files>
  <read_first>
    - supabase/migrations/20260202000001_merge_elected_official_into_person.sql (lines 60-80 — existing constraint definition)
    - CLAUDE.md (§"Deployment Configuration > Staging Environment" — project_id zkrcjzdemdmwhearhfgg)
    - CLAUDE.md global instructions: "when you need to apply migration to supabase, use the supabase mcp to do it yourself"
  </read_first>
  <action>
Create the migration file at the exact path `supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql` with this EXACT content (RTL-safe, idempotent, includes rollback docs):

```sql
-- ============================================================================
-- Migration: Relax persons_elected_official_requires_office CHECK constraint
-- Date: 2026-04-17
-- Phase: 30 (Elected Official Wizard) — D-19
-- Description: Allow Arabic-only office_name for elected officials.
--              Previously required office_name_en IS NOT NULL.
--              Now requires at least one of office_name_en / office_name_ar.
-- Rollback: DROP CONSTRAINT persons_elected_official_requires_office;
--           ADD CONSTRAINT persons_elected_official_requires_office
--             CHECK (person_subtype != 'elected_official' OR office_name_en IS NOT NULL);
-- ============================================================================

DO $$
BEGIN
  -- Drop old constraint if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'persons_elected_official_requires_office'
  ) THEN
    ALTER TABLE persons DROP CONSTRAINT persons_elected_official_requires_office;
  END IF;

  -- Re-add relaxed constraint: at least one of EN/AR
  ALTER TABLE persons ADD CONSTRAINT persons_elected_official_requires_office
    CHECK (
      person_subtype != 'elected_official'
      OR office_name_en IS NOT NULL
      OR office_name_ar IS NOT NULL
    );
END $$;

COMMENT ON CONSTRAINT persons_elected_official_requires_office ON persons IS
  'Phase 30 (D-19): Elected officials must have at least one of office_name_en or office_name_ar populated.';
```

Then apply the migration via the Supabase MCP against the staging project (project_id `zkrcjzdemdmwhearhfgg`):

1. Use `mcp__supabase__apply_migration` with:
   - `project_id`: `zkrcjzdemdmwhearhfgg`
   - `name`: `relax_elected_official_office_constraint`
   - `query`: the full SQL content above

2. Verify with `mcp__supabase__execute_sql` against project_id `zkrcjzdemdmwhearhfgg`:
   ```sql
   SELECT conname, pg_get_constraintdef(oid) AS def
   FROM pg_constraint
   WHERE conname = 'persons_elected_official_requires_office';
   ```
   Expected output: one row where `def` contains the substring `office_name_ar IS NOT NULL`.

This is a BLOCKING task — no subsequent task in this plan may begin until the migration is confirmed applied via MCP on staging. Record the Supabase migration timestamp and version in the task completion notes.

DO NOT run the migration locally without MCP; this project uses Supabase-managed PostgreSQL with MCP as the authoritative apply path (per CLAUDE.md global rules + project Deployment Configuration).
</action>
<verify>
<automated>grep -q "office_name_ar IS NOT NULL" supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql && echo "migration file present"</automated>
</verify>
<acceptance_criteria> - File exists at `supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql` - File contains the literal string `office_name_ar IS NOT NULL OR office_name_en IS NOT NULL` (order may vary; assertion: both operands appear within the same ADD CONSTRAINT CHECK block) - File contains the literal string `DROP CONSTRAINT persons_elected_official_requires_office` - File contains the literal string `ADD CONSTRAINT persons_elected_official_requires_office` - File contains `COMMENT ON CONSTRAINT persons_elected_official_requires_office` - Supabase MCP `apply_migration` returned success for project `zkrcjzdemdmwhearhfgg` - Post-apply `mcp__supabase__execute_sql` query on pg_constraint returns a row whose `def` column contains `office_name_ar IS NOT NULL`
</acceptance_criteria>
<done>
Migration file exists, applied via Supabase MCP against staging (zkrcjzdemdmwhearhfgg),
and pg_constraint query confirms the relaxed CHECK definition includes `office_name_ar IS NOT NULL`.
</done>
</task>

<task type="auto">
  <name>Task 2: Extend person.schema.ts with elected-official fields + superRefine</name>
  <files>frontend/src/components/dossier/wizard/schemas/person.schema.ts</files>
  <read_first>
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts (current full content)
    - frontend/src/components/dossier/wizard/schemas/base.schema.ts (to confirm merge semantics)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-08, D-15, D-11 — refinement rules)
  </read_first>
  <action>
Replace the entire content of `frontend/src/components/dossier/wizard/schemas/person.schema.ts` with this EXACT content (preserves trailing comma, single-quote, no-semicolon code style per CLAUDE.md):

```typescript
import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const personFields = z.object({
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  biography_en: z.string().optional(),
  biography_ar: z.string().optional(),
  person_subtype: z.enum(['standard', 'elected_official']).default('standard'),
  // Elected-official fields (Phase 30 D-15) — all optional at the column level;
  // required-ness for person_subtype='elected_official' is enforced via superRefine below.
  office_name_en: z.string().optional(),
  office_name_ar: z.string().optional(),
  district_en: z.string().optional(),
  district_ar: z.string().optional(),
  party_en: z.string().optional(),
  party_ar: z.string().optional(),
  term_start: z.string().optional(),
  term_end: z.string().optional(),
  country_id: z.string().optional(),
  organization_id: z.string().optional(),
  is_current_term: z.boolean().optional(),
})

export const personSchema = baseDossierSchema.merge(personFields).superRefine((data, ctx) => {
  // Phase 30 D-08, D-10, D-12: elected-official-specific required-ness
  if (data.person_subtype !== 'elected_official') return

  // At least one of office_name_en / office_name_ar
  const officeEn = (data.office_name_en ?? '').trim()
  const officeAr = (data.office_name_ar ?? '').trim()
  if (officeEn === '' && officeAr === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['office_name_en'],
      message: 'form-wizard:elected_official.validation.office_name_required',
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['office_name_ar'],
      message: 'form-wizard:elected_official.validation.office_name_required',
    })
  }

  // country_id required
  if ((data.country_id ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['country_id'],
      message: 'form-wizard:elected_official.validation.country_required',
    })
  }

  // term_start required
  if ((data.term_start ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['term_start'],
      message: 'form-wizard:elected_official.validation.term_start_required',
    })
  }

  // term_end >= term_start when both present (D-11 — DB also enforces this)
  const termStart = data.term_start ?? ''
  const termEnd = data.term_end ?? ''
  if (termStart !== '' && termEnd !== '' && termEnd < termStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['term_end'],
      message: 'form-wizard:elected_official.validation.term_end_after_start',
    })
  }
})

export type PersonFormData = z.infer<typeof personSchema>
```

Then run `pnpm -C frontend typecheck` to confirm the new shape compiles. The `PersonFormData` type MUST now include all new optional fields.
</action>
<verify>
<automated>cd frontend && pnpm typecheck 2>&1 | tail -20</automated>
</verify>
<acceptance_criteria> - `grep -c "office_name_en" frontend/src/components/dossier/wizard/schemas/person.schema.ts` ≥ 3 - `grep -c "superRefine" frontend/src/components/dossier/wizard/schemas/person.schema.ts` ≥ 1 - File contains literal string `path: ['country_id']` - File contains literal string `path: ['term_start']` - File contains literal string `path: ['office_name_en']` AND `path: ['office_name_ar']` - File contains `country_id: z.string().optional()` - File contains `term_start: z.string().optional()` - File contains `is_current_term: z.boolean().optional()` - `pnpm -C frontend typecheck` exits with code 0 (no TS errors introduced by this file) - No semicolons at end-of-statement lines inside this file (grep -nE "^[^/]\*;$" returns 0 matches outside comments)
</acceptance_criteria>
<done>
Schema extended, superRefine added with four validation rules (at-least-one office_name,
required country_id, required term_start, term_end >= term_start), PersonFormData type
exports all new fields, typecheck passes.
</done>
</task>

<task type="auto">
  <name>Task 3: Extend person.config.ts with subtype-aware step array</name>
  <files>frontend/src/components/dossier/wizard/config/person.config.ts</files>
  <read_first>
    - frontend/src/components/dossier/wizard/config/person.config.ts (current full content)
    - frontend/src/components/dossier/wizard/config/types.ts (WizardConfig shape)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-16)
  </read_first>
  <action>
Replace the entire content of `frontend/src/components/dossier/wizard/config/person.config.ts` with this EXACT content:

```typescript
import type { WizardConfig } from './types'
import type { PersonFormData } from '../schemas/person.schema'
import { personSchema } from '../schemas/person.schema'
import { getDefaultsForType } from '../defaults'
import { getElectedOfficialDefaults } from '../defaults'

const basicStep = {
  id: 'basic',
  title: 'form-wizard:steps.basicInfo',
  description: 'form-wizard:steps.basicInfoDesc',
}

const personDetailsStep = {
  id: 'person-details',
  title: 'form-wizard:steps.personDetails',
  description: 'form-wizard:steps.personDetailsDesc',
}

const officeTermStep = {
  id: 'office-term',
  title: 'form-wizard:steps.officeTerm',
  description: 'form-wizard:steps.officeTermDesc',
}

const reviewStep = {
  id: 'review',
  title: 'form-wizard:steps.review',
  description: 'form-wizard:steps.reviewDesc',
}

// Standard person wizard (3 steps): Basic → Person Details → Review
export const personWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getDefaultsForType<PersonFormData>('person'),
  steps: [basicStep, personDetailsStep, reviewStep],
  filterExtensionData: (data: PersonFormData) => ({
    title_en: data.title_en !== '' ? data.title_en : undefined,
    title_ar: data.title_ar !== '' ? data.title_ar : undefined,
    photo_url: data.photo_url !== '' ? data.photo_url : undefined,
    biography_en: data.biography_en !== '' ? data.biography_en : undefined,
    biography_ar: data.biography_ar !== '' ? data.biography_ar : undefined,
    person_subtype: data.person_subtype,
  }),
}

// Elected Official wizard variant (4 steps): Basic → Person Details → Office/Term → Review
// Phase 30 D-01, D-16, D-17 — same shell/hook, subtype-aware step array.
export const electedOfficialWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getElectedOfficialDefaults(),
  steps: [basicStep, personDetailsStep, officeTermStep, reviewStep],
  filterExtensionData: (data: PersonFormData) => ({
    // Person shared fields
    title_en: data.title_en !== '' ? data.title_en : undefined,
    title_ar: data.title_ar !== '' ? data.title_ar : undefined,
    photo_url: data.photo_url !== '' ? data.photo_url : undefined,
    biography_en: data.biography_en !== '' ? data.biography_en : undefined,
    biography_ar: data.biography_ar !== '' ? data.biography_ar : undefined,
    person_subtype: data.person_subtype,
    // Elected-official fields — send only populated values; empty strings become undefined
    office_name_en:
      data.office_name_en !== undefined && data.office_name_en !== ''
        ? data.office_name_en
        : undefined,
    office_name_ar:
      data.office_name_ar !== undefined && data.office_name_ar !== ''
        ? data.office_name_ar
        : undefined,
    district_en:
      data.district_en !== undefined && data.district_en !== '' ? data.district_en : undefined,
    district_ar:
      data.district_ar !== undefined && data.district_ar !== '' ? data.district_ar : undefined,
    party_en: data.party_en !== undefined && data.party_en !== '' ? data.party_en : undefined,
    party_ar: data.party_ar !== undefined && data.party_ar !== '' ? data.party_ar : undefined,
    term_start:
      data.term_start !== undefined && data.term_start !== '' ? data.term_start : undefined,
    term_end: data.term_end !== undefined && data.term_end !== '' ? data.term_end : undefined,
    country_id:
      data.country_id !== undefined && data.country_id !== '' ? data.country_id : undefined,
    organization_id:
      data.organization_id !== undefined && data.organization_id !== ''
        ? data.organization_id
        : undefined,
    // Phase 30 D-10: auto-derive is_current_term at submit time.
    // true if term_end is empty/null OR term_end >= today's ISO date (YYYY-MM-DD comparison is safe).
    is_current_term:
      data.term_end === undefined || data.term_end === ''
        ? true
        : data.term_end >= new Date().toISOString().slice(0, 10),
  }),
}
```

This creates TWO exported configs: the existing `personWizardConfig` (unchanged step count for
standard persons) and a NEW `electedOfficialWizardConfig` (4 steps) — Phase 30 D-01's "same
shell / subtype-aware steps" model, without mutating the existing persons create route.

Then run `pnpm -C frontend typecheck`.
</action>
<verify>
<automated>cd frontend && pnpm typecheck 2>&1 | tail -20</automated>
</verify>
<acceptance_criteria> - File contains literal string `export const electedOfficialWizardConfig` - File contains literal string `export const personWizardConfig` (unchanged export name) - `grep -c "office-term" frontend/src/components/dossier/wizard/config/person.config.ts` ≥ 1 - `grep -c "officeTermStep" frontend/src/components/dossier/wizard/config/person.config.ts` ≥ 2 - `personWizardConfig.steps.length === 3` when destructured at runtime (basic, person-details, review) - `electedOfficialWizardConfig.steps.length === 4` (basic, person-details, office-term, review) - File contains literal `is_current_term:` inside electedOfficialWizardConfig's filterExtensionData - File imports `getElectedOfficialDefaults` from `../defaults` - `pnpm -C frontend typecheck` exits 0
</acceptance_criteria>
<done>
Both configs exported, standard persons wizard behavior unchanged (3 steps), new elected-
official config returns 4 steps, filterExtensionData auto-derives is_current_term client-side.
</done>
</task>

<task type="auto">
  <name>Task 4: Add electedOfficialDefaults variant and exported helper</name>
  <files>frontend/src/components/dossier/wizard/defaults/index.ts</files>
  <read_first>
    - frontend/src/components/dossier/wizard/defaults/index.ts (current full content)
    - frontend/src/components/dossier/wizard/defaults/base.defaults.ts (to confirm baseDefaults shape)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-17)
  </read_first>
  <action>
Modify `frontend/src/components/dossier/wizard/defaults/index.ts` as follows — DO NOT replace the whole file; apply these specific edits:

1. After the `personDefaults` const (around line 45) and BEFORE `forumDefaults`, insert this new const:

```typescript
const electedOfficialDefaults: PersonFormData = {
  ...baseDefaults,
  title_en: '',
  title_ar: '',
  photo_url: '',
  biography_en: '',
  biography_ar: '',
  person_subtype: 'elected_official' as const,
  // Phase 30 D-15, D-17: elected-official defaults
  office_name_en: '',
  office_name_ar: '',
  district_en: '',
  district_ar: '',
  party_en: '',
  party_ar: '',
  term_start: '',
  term_end: '',
  country_id: '',
  organization_id: '',
  is_current_term: true,
}
```

2. After the `getDefaultsForType` function (end of file), add this NEW exported helper:

```typescript
/**
 * Phase 30 D-17: Defaults for the Elected Official wizard.
 * This is a Person variant (person_subtype='elected_official'), not a separate DossierType,
 * so it is fetched via a dedicated getter rather than the type-keyed map.
 */
export function getElectedOfficialDefaults(): PersonFormData {
  return electedOfficialDefaults
}
```

3. Update the existing NOTE comment (lines ~82-83) to read:

```typescript
// Phase 30 D-17: elected_official defaults are exported via getElectedOfficialDefaults().
// They share the 'person' DossierType but override person_subtype + seed ELOF-02 fields.
```

DO NOT change the existing `personDefaults` const (it remains the standard-person baseline).
DO NOT add `elected_official` as a key to the DossierType map.

Then run `pnpm -C frontend typecheck`.
</action>
<verify>
<automated>cd frontend && pnpm typecheck 2>&1 | tail -20</automated>
</verify>
<acceptance_criteria> - `grep -c "electedOfficialDefaults" frontend/src/components/dossier/wizard/defaults/index.ts` ≥ 2 (const + helper) - `grep -c "getElectedOfficialDefaults" frontend/src/components/dossier/wizard/defaults/index.ts` ≥ 1 - File contains literal string `person_subtype: 'elected_official' as const` - File contains `is_current_term: true` inside electedOfficialDefaults - File contains `country_id: ''`, `organization_id: ''`, `office_name_en: ''`, `office_name_ar: ''`, `term_start: ''`, `term_end: ''` (exactly these empty-string defaults) - `personDefaults` (existing const) is unchanged (grep shows `person_subtype: 'standard' as const` still present) - The `DossierType` map inside `getDefaultsForType` contains exactly 7 keys (country, organization, topic, person, forum, working_group, engagement) — no `elected_official` key added - `pnpm -C frontend typecheck` exits 0
</acceptance_criteria>
<done>
electedOfficialDefaults const added, getElectedOfficialDefaults() exported, personDefaults
untouched, DossierType map unchanged, typecheck passes.
</done>
</task>

</tasks>

<verification>
Run at plan close:
1. `cd frontend && pnpm typecheck` → exits 0
2. `cd frontend && pnpm lint frontend/src/components/dossier/wizard/schemas/person.schema.ts frontend/src/components/dossier/wizard/config/person.config.ts frontend/src/components/dossier/wizard/defaults/index.ts` → exits 0
3. Supabase MCP `execute_sql` confirms `persons_elected_official_requires_office` constraint definition contains `office_name_ar IS NOT NULL`
4. `grep -q "electedOfficialWizardConfig" frontend/src/components/dossier/wizard/config/person.config.ts` — exits 0
</verification>

<success_criteria>

- Supabase staging DB accepts an INSERT into `persons` with person_subtype='elected_official' and office_name_en=NULL + office_name_ar='وزير'
- Supabase staging DB rejects an INSERT into `persons` with person_subtype='elected_official' and both office_name_en=NULL and office_name_ar=NULL (CHECK constraint violation)
- `personSchema.safeParse({ ...validStandardPerson })` succeeds (standard flow unaffected)
- `personSchema.safeParse({ person_subtype: 'elected_official', ... minimal fields ... })` fails with exactly the expected issues when required fields are empty
- `electedOfficialWizardConfig.steps` returns 4 WizardStepConfig objects in order: basic, person-details, office-term, review
- `getElectedOfficialDefaults()` returns an object with `person_subtype === 'elected_official'` and all ELOF-02 fields seeded as empty strings
  </success_criteria>

<output>
After all 4 tasks complete, create `.planning/phases/30-elected-official-wizard/30-01-SUMMARY.md`
documenting: migration applied (timestamp + MCP confirmation), files modified (4), schema
validation matrix (subtype × field presence × expected outcome), and the decision to
auto-derive `is_current_term` client-side at submit (rationale: no trigger weight added).
</output>
