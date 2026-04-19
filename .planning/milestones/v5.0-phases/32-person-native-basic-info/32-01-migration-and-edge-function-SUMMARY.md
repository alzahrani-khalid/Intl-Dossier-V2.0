---
phase: 32-person-native-basic-info
plan: 32-01-migration-and-edge-function
type: summary
created: 2026-04-18
status: complete
requirements: [PBI-04, PBI-05]
---

# Plan 32-01 — SUMMARY

## Outcome

✅ Migration `20260418000001_person_identity_fields` applied to staging `zkrcjzdemdmwhearhfgg`. ✅ `dossiers-create` Edge Function redeployed (version 19) with Phase 32 awareness comment. PBI-04 + PBI-05 satisfied.

## Files

- **created** `supabase/migrations/20260418000001_person_identity_fields.sql` — DDL for 10 new nullable columns + gender CHECK + LAST-space-split backfill + idempotency guards.
- **modified** `supabase/functions/dossiers-create/index.ts` — added Phase 32 comment block above the persons-extension insert documenting the additive passthrough contract (no behavior change; existing `...body.extensionData` spread already routes the new keys).

## Tasks executed

| #   | Task                                                                     | Result                                                        |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1   | Author migration file                                                    | Created with `IF NOT EXISTS` + idempotent backfill guards     |
| 2   | Apply migration via Supabase CLI (`supabase db query --linked --file …`) | Applied; `supabase_migrations.schema_migrations` row inserted |
| 3   | Extend Edge Function additively                                          | Done (comment-only — spread already supports new columns)     |
| 4   | Deploy Edge Function via `supabase functions deploy --use-api`           | Version bumped 18 → 19, status ACTIVE                         |

## Acceptance evidence

**PBI-04 — DDL + backfill (Task 2)**

- `information_schema.columns` query returned all 10 expected rows (`honorific_en/ar`, `first_name_en/ar`, `last_name_en/ar`, `known_as_en/ar`, `date_of_birth`, `gender`), all `is_nullable = YES`.
- Gender CHECK present: `CHECK (((gender IS NULL) OR (gender = ANY (ARRAY['female'::text, 'male'::text]))))`.
- Backfill parity: `backfilled_en=0, expected_en=0`, `backfilled_ar=0, expected_ar=0` — clean DB has no person rows yet, so no name strings to split.

**PBI-05 — Edge Function passthrough (Task 4)**

- `supabase functions list` shows `dossiers-create` ACTIVE, version 19, updated 2026-04-17 23:06:09 UTC.
- Existing `...body.extensionData` spread (line ~312 of `index.ts`) routes any caller-supplied key to the `persons` insert — including the 11 Phase 32 fields (10 new + nationality_country_id which already existed). Old payloads omitting these keys still succeed; new payloads persist them.
- Live HTTP smoke tests intentionally deferred to Plan 32-04 E2E (plan's own guidance: "leave them as fixtures for Plan 32-04's E2E").

## Deviations

- **Used Supabase CLI instead of Supabase MCP** — Supabase MCP not configured in this project's `.mcp.json`. User confirmed the CLI substitution.
- **Comment-only Edge Function change** — the existing generic spread already passes new fields through, so the plan's "additive" contract is satisfied without rewriting the persons-extension insert. Comment block makes the contract explicit. Falls under the plan's allowed pattern: "spread or explicit field-by-field with `?? null`".

## Unblocks

Wave 2 (Plan 32-02), Wave 3 (Plan 32-03), Wave 4 (Plan 32-04). All can now safely write to / read from the new persons columns.

## Rollback (if needed)

```sql
ALTER TABLE public.persons
  DROP COLUMN IF EXISTS honorific_en, DROP COLUMN IF EXISTS honorific_ar,
  DROP COLUMN IF EXISTS first_name_en, DROP COLUMN IF EXISTS last_name_en,
  DROP COLUMN IF EXISTS first_name_ar, DROP COLUMN IF EXISTS last_name_ar,
  DROP COLUMN IF EXISTS known_as_en,  DROP COLUMN IF EXISTS known_as_ar,
  DROP COLUMN IF EXISTS date_of_birth, DROP COLUMN IF EXISTS gender;
ALTER TABLE public.persons DROP CONSTRAINT IF EXISTS persons_gender_check;
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260418000001';
```

Edge Function: `git revert` the commit + `supabase functions deploy dossiers-create --use-api`.
