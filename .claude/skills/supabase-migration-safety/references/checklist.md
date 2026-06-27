# Migration safety checklist

Final pass before applying a new `supabase/migrations/*.sql` (and any seed).

## Naming + apply

- [ ] Timestamped name `YYYYMMDDHHMMSS_description.sql` (or `YYYYMMDD_phaseNN_*`);
      no new `001_*`-style files.
- [ ] Applied via `mcp__supabase__apply_migration` (not `supabase db push`, not
      the legacy `backend/migrations/` CLI path).
- [ ] Inspected current schema first (`list_tables` / `execute_sql`).
- [ ] Re-verified against the live schema after applying; ran `get_advisors`.

## Idempotency

- [ ] `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
      `CREATE [UNIQUE] INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`.
- [ ] `DROP POLICY IF EXISTS` / `DROP TRIGGER IF EXISTS` before re-create.
- [ ] Enums guarded with a `DO ... EXCEPTION WHEN duplicate_object` block.

## RLS

- [ ] Any `profiles` reference uses `profiles.user_id = auth.uid()` — NEVER
      `profiles.id` (no `id` column; binds to outer table → NULL → clearance 1).
- [ ] Clearance comparisons COALESCE the **subquery**, not a bare column;
      reuse `get_user_clearance_level(uuid)` where it fits.
- [ ] Org isolation follows the `((auth.jwt() ->> 'org_id'))::uuid` pattern;
      NULL-org handling matches intent (SELECT allows NULL; mutations via RPC).
- [ ] Policy tested as an authenticated user — NOT only via the service-role MCP
      (service-role bypasses RLS and hides broken policies).

## Constraints + seed data

- [ ] Verified CHECK constraints (`pg_constraint`) AND enum values
      (`pg_enum`/`pg_type`) before writing INSERTs.
- [ ] Used correct non-obvious values: `activity_stream.action_type` =
      `create`/`update` (not `created`/`updated`); intake `urgency` = `critical`
      vs work-item `priority` = `urgent`.
- [ ] Partial unique indexes checked via `pg_indexes` (not `pg_constraint`); any
      `ON CONFLICT` repeats the partial predicate (`WHERE deleted_at IS NULL`).

## Functions

- [ ] `RETURNS TABLE` columns typed `text` that select a `varchar` source (e.g.
      `auth.users.email`) cast `::text` to avoid 42804 at `RETURN QUERY`.
- [ ] `SECURITY DEFINER` vs `INVOKER` chosen deliberately; `search_path` pinned if
      `SECURITY DEFINER`.

## Conventions

- [ ] Bilingual columns `*_en` / `*_ar`.
- [ ] Source-table carve-outs preserved (no renaming tasks/commitments/intake
      columns to the unified glossary; map at query layer).
- [ ] Migration comment documents the _why_ (especially for fix migrations).
