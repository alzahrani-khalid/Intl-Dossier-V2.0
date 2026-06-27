# Supabase guidance (migrations, edge functions, RLS)

Directory-specific notes for `supabase/`. The root `/CLAUDE.md` is the source of
truth for project-wide conventions and deployment config; this file covers the
migration, RLS, and edge-function specifics. Read the root file first. Two
dedicated skills go deeper: `edge-function-add` and `supabase-migration-safety`.

## Staging project

- Project id **`zkrcjzdemdmwhearhfgg`**, region **eu-west-2**, PostgreSQL 17.6
  (`db.zkrcjzdemdmwhearhfgg.supabase.co`). `supabase/config.toml` is local-dev
  config only (`major_version = 17`).

## Migrations are applied via the Supabase MCP — not CLI push

- The canonical migration set is `supabase/migrations/` (461 `.sql` files).
  **Apply migrations with the Supabase MCP** (`mcp__supabase__apply_migration`),
  not `supabase db push`. This is stated in the root `/CLAUDE.md` and is the
  house rule. After applying, **verify against the live schema** (e.g.
  `mcp__supabase__execute_sql`, `list_tables`) — the MCP runs against the remote
  project directly, so there is no local dry run.
- A legacy CLI path still exists (`pnpm db:migrate` → `cd backend && supabase
migration up`) that drives the separate, older `backend/migrations/` dir (11
  files). Treat `backend/migrations/` as legacy; new schema work goes in
  `supabase/migrations/` via the MCP.

### Naming

Two eras coexist; do not assume one format:

- Legacy sequential (`001_create_users.sql`) — collision-prone, several `001_*`
  exist. Do not add new ones in this form.
- Current timestamped: `YYYYMMDDHHMMSS_description.sql` (e.g.
  `20260609000000_fix_persons_select_rls_allow_null_org.sql`), or the shorter
  phase form `YYYYMMDD_phaseNN_description.sql` (e.g.
  `20260618_phase72_rag_chunks.sql`). Use a timestamped name for new migrations.

## RLS patterns

### profiles: use `profiles.user_id = auth.uid()`, never `profiles.id`

The `profiles` table has **no `id` column** — its PK/user link is `user_id`
(`supabase/migrations/20251017030000_create_profiles.sql`). In an RLS policy or
a function body, a bare `profiles.id = auth.uid()` does **not** error: SQL binds
the unqualified `id` to the _outer_ table, the subquery matches nothing, returns
NULL, and `COALESCE` falls back to clearance 1 — silently collapsing the gate
for **every** user. This actually happened and blocked 20 of 35 staging dossiers
(see `20260610000002_fix_position_dossier_links_rls_clearance_subquery.sql`).

Correct shape — always qualify `profiles.user_id` and wrap the **subquery** in
COALESCE, not a bare column:

```sql
AND dossiers.sensitivity_level <= COALESCE(
  (SELECT profiles.clearance_level FROM profiles WHERE profiles.user_id = auth.uid()),
  1)
```

Prefer the canonical helper where it fits:
`get_user_clearance_level(user_id UUID)` (`20260614000001_p68_clearance_canonical.sql`,
`SECURITY DEFINER STABLE`) — six policies already call it. `clearance_level` is a
1–4 integer; `dossiers.sensitivity_level` is already an integer.

(Do not confuse `profiles` with `staff_profiles`, which _does_ have its own `id`.)

### Org isolation

The persons org-isolation policy uses a JWT claim and allows NULL-org rows on
SELECT (`20260609000000_fix_persons_select_rls_allow_null_org.sql`):

```sql
CREATE POLICY persons_org_isolation_select ON public.persons
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id = ((auth.jwt() ->> 'org_id'::text))::uuid
  );
```

The sibling INSERT/UPDATE/DELETE policies still block all-NULL-org rows (latent);
mutations route through `SECURITY DEFINER` RPCs. Keep that asymmetry in mind when
a write "mysteriously" fails RLS.

## Migration safety essentials

- **Idempotency is the norm here.** Use `CREATE TABLE IF NOT EXISTS`,
  `ADD COLUMN IF NOT EXISTS`, `CREATE [UNIQUE] INDEX IF NOT EXISTS`,
  `CREATE OR REPLACE FUNCTION`, and `DROP POLICY IF EXISTS` before `CREATE POLICY`.
  Postgres has no `CREATE TYPE IF NOT EXISTS` — guard enums with a `DO` block that
  catches `duplicate_object` (pattern in `20260114400001_access_requests.sql`).
- **Verify CHECK/enum constraints before seed inserts.** Allowed values are often
  non-obvious. `activity_stream.action_type` is `create`/`update` (NOT
  `created`/`updated`) — `20260110100000_activity_feed_enhanced.sql`. `intake_tickets`
  uses ENUM types, where `urgency` legitimately accepts `critical` while work-item
  `priority` accepts `urgent` — different columns/enums
  (`20250129001_create_intake_tickets_table.sql`). Query `pg_constraint` for
  CHECKs **and** `pg_enum`/`pg_type` for enums before writing INSERTs.
- **Partial unique indexes live in `pg_indexes`, not `pg_constraint`.** The
  `work_item_dossiers` junction enforces active-row uniqueness via
  `idx_work_item_dossiers_unique_active ... WHERE deleted_at IS NULL`
  (`20260116500001_create_work_item_dossiers.sql`). A `pg_constraint`-only check
  misses it. An `ON CONFLICT` against it must repeat the partial predicate
  (`... WHERE deleted_at IS NULL DO NOTHING`).
- **RETURNS TABLE varchar/text → 42804.** A function declaring `RETURNS TABLE (...
col text ...)` that selects a `varchar` column (commonly `auth.users.email`,
  `varchar(255)`) throws Postgres **42804** at `RETURN QUERY` time. It compiles
  fine and mocked tests miss it. Cast `::text` in the SELECT — precedent in
  `20260531120000_fix_get_team_workload_email_text_cast.sql`.

## Edge functions

- Live under `supabase/functions/<name>/index.ts` (Deno + TypeScript, one
  `index.ts` per function; no per-function `deno.json` or import map). Shared
  helpers in `supabase/functions/_shared/` (`cors.ts`, `auth.ts`, `logger.ts`,
  `rate-limit.ts`, …). They are the app's primary data path, so they build a
  **JWT-scoped client and rely on RLS** (the opposite of the Express backend,
  which uses service-role + in-code checks).
- **Auth — the `@2` + `getUser(token)` gotcha.** Either inject the
  `Authorization` header into the client and call `getUser()`
  (`functions/tasks-get/index.ts`), or pass the token explicitly to
  `getUser(token)` (`_shared/auth.ts` `validateJWT`). A bare `getUser()` on a
  plain anon client returns **401 on valid tokens** on older supabase-js
  (`@2.39.3`). Use service-role (`createServiceClient`) only when you deliberately
  bypass RLS.
- **CORS via the `ALLOWED_ORIGINS` secret.** Use `getCorsHeaders(req)` /
  `handleCorsPreflightRequest(req)` from `_shared/cors.ts` (origin-validated), not
  the deprecated wildcard `corsHeaders`. `ALLOWED_ORIGINS` is a **Supabase secret,
  not in the repo**; unset in a deployed env → every non-localhost origin gets
  `Access-Control-Allow-Origin: null`. Set it per environment with
  `supabase secrets set`.
- **`verify_jwt`** is per-function in `config.toml`; unlisted functions default to
  `true` (gateway rejects unauthenticated calls). Add an explicit `{ verify_jwt =
false }` entry only for genuinely public endpoints (mirroring `health-check`).
- **Deploy via the Supabase CLI or MCP** (not `git push`):
  `supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg`. See
  `supabase/deploy-functions.sh` (example) and the `edge-function-add` skill.
  Cron-triggered functions are wired via pg_cron — see `supabase/CRON_SETUP.md`.
