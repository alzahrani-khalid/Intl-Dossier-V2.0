---
name: supabase-migration-safety
description: Write and apply safe Supabase migrations in the Intl-Dossier V2.0 repo. Use when adding or editing SQL under supabase/migrations/ or seeding data — covers applying via the Supabase MCP, verifying CHECK/enum constraints before seed inserts, the profiles.user_id=auth.uid() RLS rule (profiles has no id column), idempotent DDL, the partial-unique-index gotcha (pg_indexes not pg_constraint), and the RETURNS TABLE varchar/text 42804 cast.
---

# Supabase migration safety (Intl-Dossier V2.0)

The canonical migration set is `supabase/migrations/` (461+ `.sql` files) against
the staging project `zkrcjzdemdmwhearhfgg` (eu-west-2, PostgreSQL 17). Migrations
run against the **remote** project with no local dry run, so safety is about
verifying before and after. Read this whole file; use `references/checklist.md`
as the final pass.

## Apply via the Supabase MCP, then verify against the live schema

- Apply with **`mcp__supabase__apply_migration`** — the house rule, not
  `supabase db push`. (The legacy `pnpm db:migrate` CLI path drives the separate,
  older `backend/migrations/` dir; do not use it for new schema work.)
- Before writing, inspect current state with `mcp__supabase__list_tables` and
  `mcp__supabase__execute_sql`. After applying, re-query to confirm the object
  exists and behaves (especially RLS — see below). Run
  `mcp__supabase__get_advisors` to catch security/performance regressions.
- **RLS cannot be verified with the service-role MCP connection** — service-role
  bypasses RLS, so a broken policy still returns rows. To actually test a policy,
  exercise it as an authenticated user (impersonation / a JWT-scoped client), or
  through the edge function / route that uses it.

### Naming

Use a timestamped name: `YYYYMMDDHHMMSS_description.sql` (e.g.
`20260609000000_fix_persons_select_rls_allow_null_org.sql`), or the phase form
`YYYYMMDD_phaseNN_description.sql`. Do not add new `001_*`-style sequential files
(several already collide).

## Verify CHECK / enum constraints before seed inserts

Allowed values here are frequently **non-obvious** and enforced two ways. Query
both before writing INSERTs:

```sql
-- CHECK constraints on a table:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'public.activity_stream'::regclass;

-- Enum values for an enum-typed column:
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'urgency_level' ORDER BY enumsortorder;
```

Known traps:

- `activity_stream.action_type` is a CHECK accepting `create` / `update` (NOT
  `created` / `updated`) — `20260110100000_activity_feed_enhanced.sql`. (Some old
  audit triggers wrote `created`/`updated`; the canonical CHECK uses bare verbs.)
- `intake_tickets` uses ENUM types: `urgency` accepts `critical`, while work-item
  `priority` (`priority_level` enum) accepts `urgent` — different columns, do not
  conflate (`20250129001_create_intake_tickets_table.sql`).

## RLS: `profiles.user_id = auth.uid()`, never `profiles.id`

`profiles` has **no `id` column** (`20251017030000_create_profiles.sql`); the
user link is `user_id`. A bare `profiles.id = auth.uid()` does not error — it
binds `id` to the outer table, matches nothing, returns NULL, and COALESCE falls
back to clearance 1, collapsing the gate for everyone (real incident:
`20260610000002_fix_position_dossier_links_rls_clearance_subquery.sql`). Always
qualify `profiles.user_id` and COALESCE the **subquery**, not a bare column:

```sql
AND dossiers.sensitivity_level <= COALESCE(
  (SELECT profiles.clearance_level FROM profiles WHERE profiles.user_id = auth.uid()),
  1)
```

Prefer `get_user_clearance_level(uuid)` (`20260614000001_p68_clearance_canonical.sql`)
where it fits. For org isolation, follow `persons_org_isolation_select`
(`20260609000000_*`): `organization_id IS NULL OR organization_id = ((auth.jwt()
->> 'org_id'))::uuid`. Replace policies with `DROP POLICY IF EXISTS <name> ON

<table>;` immediately before `CREATE POLICY`.

## Idempotent DDL is the norm

Write migrations so re-running is a no-op:

- `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
  `CREATE [UNIQUE] INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`.
- `DROP POLICY IF EXISTS` / `DROP TRIGGER IF EXISTS` before re-create.
- Enums have no `IF NOT EXISTS`; guard with a `DO` block
  (`20260114400001_access_requests.sql`):

```sql
DO $$ BEGIN
  CREATE TYPE access_request_urgency AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

## Partial unique index gotcha (pg_indexes, not pg_constraint)

Some uniqueness is enforced by **partial unique indexes**, which are invisible to
a `pg_constraint`-only check. The `work_item_dossiers` junction
(`20260116500001_create_work_item_dossiers.sql`):

```sql
CREATE UNIQUE INDEX idx_work_item_dossiers_unique_active
  ON work_item_dossiers (work_item_type, work_item_id, dossier_id)
  WHERE deleted_at IS NULL;
```

To find these, query `pg_indexes` (`indexdef LIKE '%UNIQUE%... WHERE%'`). An
`ON CONFLICT` targeting a partial index must **repeat the predicate** (e.g.
`ON CONFLICT (...) WHERE deleted_at IS NULL DO NOTHING`), or the conflict target
won't match.

## RETURNS TABLE varchar/text → 42804

A function declaring `RETURNS TABLE (... col text ...)` that selects a `varchar`
column (commonly `auth.users.email`, `varchar(255)`) throws Postgres **42804**
(`Returned type character varying(255) does not match expected type text`) at
`RETURN QUERY` time. It compiles fine; mocked unit tests never hit it. Cast in the
SELECT:

```sql
SELECT u.email::text AS user_email, ...
```

Precedent: `20260531120000_fix_get_team_workload_email_text_cast.sql`.

## House conventions

Bilingual columns are `*_en` / `*_ar`. Respect source-table carve-outs: tasks use
`sla_deadline` / `workflow_stage`, commitments (`aa_commitments`) use `due_date`
/ `owner_*`, intake tickets have their own `status` / `urgency`. Do not "normalize"
these to the unified work-item glossary at the table level — map at the query
layer instead (root `/CLAUDE.md`). Comment the _why_ on any fix migration; the
existing fix migrations document the bug they close, which is how these gotchas
stay discoverable.
