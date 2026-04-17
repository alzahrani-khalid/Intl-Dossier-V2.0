---
phase: 32-person-native-basic-info
plan: 32-01-migration-and-edge-function
type: plan
created: 2026-04-18
requirements: [PBI-04, PBI-05]
depends_on: []
owner: parent_session
autonomous: false
estimated_wave: 1
---

# Plan 32-01: DB Migration + Name Backfill + Edge Function Passthrough

## Goal

Add 11 nullable typed identity columns to `persons`, backfill `first_name_en/ar` and `last_name_en/ar` from `dossiers.name_en/ar` by splitting on the LAST space (D-06/D-07), and extend the `dossiers-create` Edge Function additively (D-30) so old payloads still return 200 while new payloads persist identity fields. Applied to staging `zkrcjzdemdmwhearhfgg` via Supabase MCP (D-28).

## Requirements addressed

- **PBI-04** — Non-breaking migration + name backfill. 11 nullable columns; every pre-existing person with a space in `dossiers.name_en` has both `first_name_en` and `last_name_en` populated.
- **PBI-05** — Edge Function passes through new fields additively; old payloads without new fields still return 200 OK and create person rows with new columns NULL.

## Dependencies

None — this is Wave 1. Blocks Plans 32-02, 32-03, 32-04 (they rely on column presence + function passthrough for end-to-end verification).

## Owner: parent_session (MANDATORY)

Per memory `phase_17_checkpoint.md`: subagents cannot invoke Supabase MCP. Per user global CLAUDE.md: "when you need to apply migration to supabase, use the supabase mcp to do it yourself." Both the `mcp__supabase__apply_migration` (Task 2) and the Edge Function deployment (Task 4) MUST run in the parent session. `gsd-executor` should surface these tasks to the parent rather than delegating.

## Files to modify / create

| Path                                                            | Action | Rationale                                          |
| --------------------------------------------------------------- | ------ | -------------------------------------------------- |
| `supabase/migrations/20260418000001_person_identity_fields.sql` | create | DDL + backfill for 11 typed columns                |
| `supabase/functions/dossiers-create/index.ts`                   | modify | Additive extensionData passthrough for new columns |

## Tasks

### Task 1: Author migration file with DDL + backfill

**Files:** `supabase/migrations/20260418000001_person_identity_fields.sql` (create)
**Decisions applied:** D-06, D-07, D-10, D-29
**Acceptance:** File exists; SQL is valid; re-running the UPDATE is a no-op (idempotent via `WHERE first_name_en IS NULL AND last_name_en IS NULL` guard).
**Autonomous:** true (file authoring only — application is Task 2)

Write the migration with the following shape. Every new column is nullable (D-10). Backfill splits on the LAST space (D-06); single-word names go to `last_name` only with `first_name = NULL` (D-07). The backfill is idempotent: it only writes rows where both target columns are still NULL, so re-running the migration on a partially-populated table is safe (D-29).

```sql
-- Phase 32: Person-Native Basic Info
-- Adds 11 typed identity columns to persons (all nullable per D-10)
-- Backfills first_name_en/ar + last_name_en/ar from dossiers.name_en/ar
-- using the LAST-space split rule (D-06); single-word names → last_name only (D-07).

BEGIN;

-- DDL: 11 nullable identity columns
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS honorific_en   text,
  ADD COLUMN IF NOT EXISTS honorific_ar   text,
  ADD COLUMN IF NOT EXISTS first_name_en  text,
  ADD COLUMN IF NOT EXISTS last_name_en   text,
  ADD COLUMN IF NOT EXISTS first_name_ar  text,
  ADD COLUMN IF NOT EXISTS last_name_ar   text,
  ADD COLUMN IF NOT EXISTS known_as_en    text,
  ADD COLUMN IF NOT EXISTS known_as_ar    text,
  ADD COLUMN IF NOT EXISTS date_of_birth  date,
  ADD COLUMN IF NOT EXISTS gender         text
    CHECK (gender IS NULL OR gender IN ('female', 'male'));

COMMENT ON COLUMN public.persons.honorific_en IS 'Phase 32: curated honorific (English), e.g. ''H.E.'', ''Dr.''';
COMMENT ON COLUMN public.persons.honorific_ar IS 'Phase 32: curated honorific (Arabic), e.g. ''سعادة''';
COMMENT ON COLUMN public.persons.first_name_en IS 'Phase 32: given name English (NULL for single-word names per D-07)';
COMMENT ON COLUMN public.persons.last_name_en  IS 'Phase 32: family/surname English';
COMMENT ON COLUMN public.persons.first_name_ar IS 'Phase 32: given name Arabic';
COMMENT ON COLUMN public.persons.last_name_ar  IS 'Phase 32: family/surname Arabic';
COMMENT ON COLUMN public.persons.known_as_en IS 'Phase 32: optional nickname English';
COMMENT ON COLUMN public.persons.known_as_ar IS 'Phase 32: optional nickname Arabic';
COMMENT ON COLUMN public.persons.date_of_birth IS 'Phase 32: optional DOB';
COMMENT ON COLUMN public.persons.gender IS 'Phase 32: two-value enum {female, male}, nullable (per SPEC out-of-scope list)';

-- Backfill EN: split on LAST space. Idempotent guard on NULL.
-- Per D-06: first = everything before last space; last = everything after last space.
-- Per D-07: single-word name → first=NULL, last=full_string.
UPDATE public.persons p
   SET first_name_en = CASE
         WHEN position(' ' IN d.name_en) = 0 THEN NULL
         ELSE regexp_replace(d.name_en, '\s+\S+$', '')
       END,
       last_name_en = CASE
         WHEN position(' ' IN d.name_en) = 0 THEN d.name_en
         ELSE regexp_replace(d.name_en, '^.*\s+', '')
       END
  FROM public.dossiers d
 WHERE d.id = p.id
   AND d.name_en IS NOT NULL
   AND btrim(d.name_en) <> ''
   AND p.first_name_en IS NULL
   AND p.last_name_en  IS NULL;

-- Backfill AR: same rule, Arabic source column.
UPDATE public.persons p
   SET first_name_ar = CASE
         WHEN position(' ' IN d.name_ar) = 0 THEN NULL
         ELSE regexp_replace(d.name_ar, '\s+\S+$', '')
       END,
       last_name_ar = CASE
         WHEN position(' ' IN d.name_ar) = 0 THEN d.name_ar
         ELSE regexp_replace(d.name_ar, '^.*\s+', '')
       END
  FROM public.dossiers d
 WHERE d.id = p.id
   AND d.name_ar IS NOT NULL
   AND btrim(d.name_ar) <> ''
   AND p.first_name_ar IS NULL
   AND p.last_name_ar  IS NULL;

COMMIT;
```

Notes on the regex split (D-06):

- `regexp_replace(x, '\s+\S+$', '')` removes the trailing whitespace-run + final token → keeps "everything before the last space".
- `regexp_replace(x, '^.*\s+', '')` keeps only the final token after the last whitespace-run.
- Handles `"Jean-Paul Sartre"` → first=`"Jean-Paul"`, last=`"Sartre"` (hyphen inside the first token is preserved).
- Handles `"Mary Jane Smith"` → first=`"Mary Jane"`, last=`"Smith"` (multi-word first names preserved).
- Handles `"Madonna"` (single word) → first=NULL, last=`"Madonna"` via the `position(' ' IN ...) = 0` branch.

### Task 2: [BLOCKING] Apply migration to staging via Supabase MCP

**Files:** none (MCP call only)
**Decisions applied:** D-28
**Acceptance:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'persons' AND column_name IN ('honorific_en','honorific_ar','first_name_en','first_name_ar','last_name_en','last_name_ar','known_as_en','known_as_ar','date_of_birth','gender')` returns exactly 10 rows (PBI-04). Row-count check passes: `SELECT COUNT(*) FROM persons WHERE first_name_en IS NOT NULL AND last_name_en IS NOT NULL` equals `SELECT COUNT(*) FROM persons p JOIN dossiers d ON d.id = p.id WHERE d.name_en LIKE '% %'`.
**Autonomous:** false — **parent_session only** (Supabase MCP unavailable in subagents)

Steps for the parent session executor:

1. Verify linked project: `mcp__supabase__list_projects` → confirm `zkrcjzdemdmwhearhfgg` (Intl-Dossier, eu-west-2) is present.
2. Apply via `mcp__supabase__apply_migration` with `name: "20260418000001_person_identity_fields"` and the SQL body from Task 1.
3. Run acceptance query: `mcp__supabase__execute_sql` with:
   ```sql
   SELECT column_name, is_nullable, data_type
     FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'persons'
      AND column_name IN (
        'honorific_en','honorific_ar',
        'first_name_en','first_name_ar',
        'last_name_en','last_name_ar',
        'known_as_en','known_as_ar',
        'date_of_birth','gender'
      )
    ORDER BY column_name;
   ```
   Expected: 10 rows, all `is_nullable = 'YES'`.
4. Backfill parity check:
   ```sql
   SELECT
     (SELECT COUNT(*) FROM persons WHERE first_name_en IS NOT NULL AND last_name_en IS NOT NULL) AS backfilled,
     (SELECT COUNT(*) FROM persons p JOIN dossiers d ON d.id = p.id WHERE d.name_en LIKE '% %') AS expected;
   ```
   `backfilled >= expected` must hold (equal in a clean DB; `>=` in case other rows were populated manually).
5. Verify migration recorded: `SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20260418000001';` returns one row.

If any assertion fails: STOP. Do not proceed to Task 3. Surface the failure.

### Task 3: Extend `dossiers-create` Edge Function additively

**Files:** `supabase/functions/dossiers-create/index.ts` (modify)
**Decisions applied:** D-30, D-31
**Acceptance:** Unit test added or existing contract test updated to pass. `deno check` (if used) or `tsc` succeeds on the function source. Old payloads (no new fields) still return 200.
**Autonomous:** true (source edit only; deployment is Task 4)

Locate the persons-insert branch in the Edge Function (likely inside a `switch (type)` or `if (type === 'person')` block that inserts into the `persons` extension table after the `dossiers` row insert). Extend the insert payload additively — spread or explicit field-by-field with `?? null`:

```ts
// Inside the persons insert branch (D-30 additive pattern).
// Read new identity fields from incoming extensionData; default to null.
const personExtension = {
  id: dossierRow.id,
  // ---- existing fields (keep as-is) ----
  title_en: extensionData?.title_en ?? null,
  title_ar: extensionData?.title_ar ?? null,
  email: extensionData?.email ?? null,
  phone: extensionData?.phone ?? null,
  biography_en: extensionData?.biography_en ?? null,
  biography_ar: extensionData?.biography_ar ?? null,
  photo_url: extensionData?.photo_url ?? null,
  linkedin_url: extensionData?.linkedin_url ?? null,
  twitter_url: extensionData?.twitter_url ?? null,
  expertise_areas: extensionData?.expertise_areas ?? null,
  languages: extensionData?.languages ?? null,
  // ---- Phase 32 additive fields (D-30) ----
  honorific_en: extensionData?.honorific_en ?? null,
  honorific_ar: extensionData?.honorific_ar ?? null,
  first_name_en: extensionData?.first_name_en ?? null,
  last_name_en: extensionData?.last_name_en ?? null,
  first_name_ar: extensionData?.first_name_ar ?? null,
  last_name_ar: extensionData?.last_name_ar ?? null,
  known_as_en: extensionData?.known_as_en ?? null,
  known_as_ar: extensionData?.known_as_ar ?? null,
  nationality_country_id: extensionData?.nationality_country_id ?? null,
  date_of_birth: extensionData?.date_of_birth ?? null,
  gender: extensionData?.gender ?? null,
  // ---- keep any subtype-specific fields (elected-official office/term) as-is ----
}

const { error: personErr } = await supabaseAdmin.from('persons').insert(personExtension)

if (personErr) {
  // existing error handling; no behavioral change for old payloads.
  return jsonError(personErr)
}
```

Constraints per D-31:

- Do NOT compose `name_en/ar` inside the Edge Function. The client (`filterExtensionData` — Plan 32-02) already composes them. The function receives `name_en/ar` already-composed and inserts into `dossiers` unchanged.
- Do NOT touch the `dossiers` row's insert path.
- Any field the client omits remains `null` — old payloads keep working (PBI-05 control submission).

If the Edge Function uses a union/discriminated type for the extension payload, extend the `Person` branch only. Do not add identity fields to the `Organization`, `Country`, `Forum`, etc. branches.

### Task 4: [BLOCKING] Deploy Edge Function via Supabase MCP

**Files:** none (MCP call only)
**Decisions applied:** D-28
**Acceptance:** `mcp__supabase__list_edge_functions` shows `dossiers-create` with an updated deployment timestamp. Smoke test via `mcp__supabase__execute_sql` + a POST assertion in Plan 32-04's E2E.
**Autonomous:** false — **parent_session only**

Steps for the parent session executor:

1. Use `mcp__supabase__deploy_edge_function` with `name: "dossiers-create"` and the file contents from Task 3.
2. Verify deployment: `mcp__supabase__list_edge_functions` → confirm `dossiers-create` `updated_at` is within the last minute.
3. Smoke test (backwards compat — PBI-05 control case). Using an authenticated test user (`$TEST_USER_EMAIL`), POST a legacy payload WITHOUT the 11 new fields. Expected response: `200 OK`; resulting `persons` row has all 11 new columns `NULL`.
4. Smoke test (new fields — PBI-05 happy path). POST a payload including `honorific_en: 'H.E.'`, `first_name_en: 'Test'`, `last_name_en: 'PhaseThirtyTwo'`, `nationality_country_id: <any existing country dossier id>`, `gender: 'male'`. Expected: `200 OK`; `SELECT honorific_en, first_name_en, last_name_en, nationality_country_id, gender FROM persons WHERE id = <returned id>` returns the submitted values exactly.
5. Clean up smoke-test rows or leave them as fixtures for Plan 32-04's E2E.

## Tests

- **SQL assertion** (Task 2 acceptance): information_schema column count (10) + backfill parity count.
- **Edge Function contract test** (optional, colocated with the function or as a Vitest in `tests/edge-functions/dossiers-create.test.ts` if one exists): old payload still returns 200; new payload persists all 11 fields.
- **No Vitest unit tests for the migration SQL itself** — verification is via live staging query (Task 2).

## Verification commands

```bash
# From repo root, after Task 2 runs via MCP:
# (Run these via parent session's MCP execute_sql, not via CLI — no psql direct access in this repo.)

# Column presence (PBI-04):
mcp__supabase__execute_sql "
  SELECT column_name, is_nullable
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='persons'
     AND column_name IN (
       'honorific_en','honorific_ar','first_name_en','first_name_ar',
       'last_name_en','last_name_ar','known_as_en','known_as_ar',
       'date_of_birth','gender'
     )
   ORDER BY column_name;
"

# Backfill parity (PBI-04):
mcp__supabase__execute_sql "
  SELECT
    (SELECT COUNT(*) FROM persons WHERE first_name_en IS NOT NULL AND last_name_en IS NOT NULL) AS backfilled,
    (SELECT COUNT(*) FROM persons p JOIN dossiers d ON d.id=p.id WHERE d.name_en LIKE '% %') AS expected;
"

# Edge Function deployed (PBI-05):
mcp__supabase__list_edge_functions
```

## Rollback

- **Migration:** columns are additive and nullable — no data loss on drop. Rollback SQL (manual, if truly needed):
  ```sql
  ALTER TABLE public.persons
    DROP COLUMN IF EXISTS honorific_en, DROP COLUMN IF EXISTS honorific_ar,
    DROP COLUMN IF EXISTS first_name_en, DROP COLUMN IF EXISTS last_name_en,
    DROP COLUMN IF EXISTS first_name_ar, DROP COLUMN IF EXISTS last_name_ar,
    DROP COLUMN IF EXISTS known_as_en,  DROP COLUMN IF EXISTS known_as_ar,
    DROP COLUMN IF EXISTS date_of_birth, DROP COLUMN IF EXISTS gender;
  DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260418000001';
  ```
- **Edge Function:** `git revert` the commit touching `supabase/functions/dossiers-create/index.ts` and redeploy via `mcp__supabase__deploy_edge_function`.

## Threat model

| Threat                                                                                                | Severity            | Mitigation                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL injection via backfill UPDATE                                                                     | Low                 | Migration is literal SQL; no string interpolation from user input. `regexp_replace` uses constant patterns.                                              |
| Data loss on re-run of backfill                                                                       | Medium              | Guarded by `WHERE p.first_name_en IS NULL AND p.last_name_en IS NULL` — re-runs are no-ops on already-populated rows.                                    |
| Backfill produces wrong split for edge inputs (CJK, multiple consecutive spaces, trailing whitespace) | Low                 | `btrim` filters empty strings; `regexp_replace` handles multi-space via `\s+`. CJK names without spaces fall to the single-word branch (D-07).           |
| Edge Function regression (old clients break)                                                          | High (if triggered) | All new fields default `?? null`. Control smoke test in Task 4 step 3 confirms old payloads still return 200.                                            |
| RLS regression on `persons` insert                                                                    | Medium              | No new policies added; existing `auth.uid()` + clearance policy still applies. Verified by Task 4 step 4 (authenticated test user inserts successfully). |
| Migration applied twice (duplicate run)                                                               | Low                 | `ADD COLUMN IF NOT EXISTS` + idempotent UPDATE guards.                                                                                                   |
