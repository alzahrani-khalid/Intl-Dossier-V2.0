---
phase: 30-elected-official-wizard
plan: '01'
subsystem: wizard/schema
tags: [v5.0, wizard, person-subtype, supabase-migration, zod-superRefine]
dependency_graph:
  requires: []
  provides:
    - personSchema with 11 elected-official fields + superRefine
    - electedOfficialWizardConfig (4 steps)
    - getElectedOfficialDefaults()
    - persons_elected_official_requires_office relaxed to OR office_name_ar IS NOT NULL
  affects:
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts
    - frontend/src/components/dossier/wizard/config/person.config.ts
    - frontend/src/components/dossier/wizard/defaults/index.ts
    - supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql
tech_stack:
  added: []
  patterns:
    - Zod superRefine for cross-field elected-official validation
    - Dual WizardConfig export (standard 3-step + elected-official 4-step)
    - Dedicated getter pattern for sub-type defaults (not keyed in DossierType map)
key_files:
  created:
    - supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql
  modified:
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts
    - frontend/src/components/dossier/wizard/config/person.config.ts
    - frontend/src/components/dossier/wizard/defaults/index.ts
decisions:
  - 'Auto-derive is_current_term client-side in filterExtensionData (no DB trigger weight)'
  - 'getElectedOfficialDefaults() as dedicated getter — elected_official is not a DossierType key'
  - 'Migration applied via supabase db query --linked (db push blocked by remote/local version divergence)'
metrics:
  duration: '~20 minutes'
  completed: '2026-04-17'
  tasks_completed: 4
  files_changed: 4
---

# Phase 30 Plan 01: Schema Migration — Summary

**One-liner:** Relaxed DB office-name constraint to allow Arabic-only (OR logic), extended personSchema with 11 elected-official fields + superRefine validation, added 4-step electedOfficialWizardConfig, and registered electedOfficialDefaults with dedicated getter.

## Tasks Completed

| #   | Name                                                               | Commit   | Files                                                                           |
| --- | ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------- |
| 1   | Apply Supabase migration to relax office-name constraint           | 8d8a14b0 | supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql |
| 2   | Extend person.schema.ts with elected-official fields + superRefine | 1962f9e1 | frontend/src/components/dossier/wizard/schemas/person.schema.ts                 |
| 3   | Extend person.config.ts with subtype-aware step array              | 17f6ad42 | frontend/src/components/dossier/wizard/config/person.config.ts                  |
| 4   | Add electedOfficialDefaults variant and exported helper            | a774cb26 | frontend/src/components/dossier/wizard/defaults/index.ts                        |

## Migration Applied

- **File:** `supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql`
- **Applied via:** `supabase db query --linked -f <file>` (db push blocked by remote/local migration count divergence)
- **Registered in schema_migrations:** Yes — INSERT INTO supabase_migrations.schema_migrations executed
- **Constraint verification:** `pg_get_constraintdef` returns `CHECK (((person_subtype <> 'elected_official'::text) OR (office_name_en IS NOT NULL) OR (office_name_ar IS NOT NULL)))`
- **Staging project:** zkrcjzdemdmwhearhfgg (eu-west-2)

## Schema Validation Matrix

| person_subtype   | office_name_en | office_name_ar | country_id | term_start | Expected outcome                             |
| ---------------- | -------------- | -------------- | ---------- | ---------- | -------------------------------------------- |
| standard         | any            | any            | any        | any        | PASS (superRefine skips)                     |
| elected_official | populated      | empty          | populated  | populated  | PASS                                         |
| elected_official | empty          | populated (AR) | populated  | populated  | PASS                                         |
| elected_official | empty          | empty          | populated  | populated  | FAIL path: office_name_en + office_name_ar   |
| elected_official | populated      | any            | empty      | populated  | FAIL path: country_id                        |
| elected_official | populated      | any            | populated  | empty      | FAIL path: term_start                        |
| elected_official | populated      | any            | populated  | 2026-01-01 | FAIL path: term_end (if term_end=2025-01-01) |

## Key Decisions

### Auto-derive is_current_term client-side

`is_current_term` is computed in `filterExtensionData` at submit time: `true` if `term_end` is empty or `>= today's date`. No DB trigger needed. Rationale: avoids trigger weight, keeps logic visible in the wizard config where it belongs.

### getElectedOfficialDefaults() dedicated getter

`elected_official` is a `person_subtype` value, not a `DossierType`. The DossierType map in `getDefaultsForType()` remains unchanged (7 keys). A dedicated `getElectedOfficialDefaults()` export cleanly separates the concern.

### Migration applied via db query instead of db push

`supabase db push --linked` failed because the remote has migration history entries not present in the local worktree's migration files. Used `supabase db query --linked -f <file>` which executes the SQL via the Management API without requiring local/remote history to match. The migration was then manually registered in `supabase_migrations.schema_migrations`.

## Deviations from Plan

### [Rule 3 - Blocking] supabase db push --linked blocked by migration history divergence

- **Found during:** Task 1
- **Issue:** `supabase db push --linked` and `--include-all` both fail when remote has migration versions not present locally (worktree only contains Phase 26-30 migrations, remote has hundreds from prior phases).
- **Fix:** Used `supabase db query --linked -f <file>` to execute the SQL directly via the Management API, then manually registered the migration version in `supabase_migrations.schema_migrations` with an INSERT ON CONFLICT DO NOTHING.
- **Files modified:** None (operational workaround only)
- **Impact:** Migration is applied and registered correctly. Future `db push` from the main repo (with full migration history) will skip this version as already applied.

## Known Stubs

None — all exported values are concrete. The `office-term` step id in `electedOfficialWizardConfig.steps` references a step component that Plan 30-02 will build. This is an intentional forward reference (step id only, no component rendered yet).

## Self-Check: PASSED

- [x] `supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql` exists
- [x] Constraint verified on staging: `office_name_ar IS NOT NULL` in definition
- [x] `personSchema` contains `superRefine`
- [x] `electedOfficialWizardConfig` exported with 4-step array (office-term step included)
- [x] `getElectedOfficialDefaults()` exported from defaults/index.ts
- [x] `personWizardConfig` unchanged (3 steps, standard defaults)
- [x] TypeCheck: no wizard-file errors introduced
- [x] Commits: 8d8a14b0, 1962f9e1, 17f6ad42, a774cb26 all exist
