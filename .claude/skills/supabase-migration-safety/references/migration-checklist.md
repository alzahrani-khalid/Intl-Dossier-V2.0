# Migration pre-flight checklist

## Before writing the migration

- [ ] Does the change require new RLS? (almost always yes for new tables)
- [ ] Does it depend on a table or column that doesn't exist in staging? (check via Supabase MCP)
- [ ] Are there foreign-key references that need to exist first? (order matters within a single migration)
- [ ] Will any check constraint be tightened? (that's a destructive change — split into two migrations)

## Writing the migration

- [ ] File named `YYYYMMDDHHMMSS_<descriptive_snake_case>.sql`
- [ ] Idempotent if possible (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` — Postgres 15+)
- [ ] `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` for every new table
- [ ] RLS policy SQL in the same file
- [ ] Indexes for foreign keys and any filtered column

## Applying

- [ ] Apply via Supabase MCP (`apply_migration`), never CLI direct
- [ ] After apply: regen types via MCP (`generate_typescript_types`)
- [ ] Commit the type regen in the same PR

## Verification

- [ ] Confirm RLS is on: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = '<table>';`
- [ ] Confirm policy exists: `SELECT polname FROM pg_policy WHERE polrelid = '<table>'::regclass;`
- [ ] Query as a real user via the MCP — does the policy filter as expected?

## Rollback

- Never edit the applied migration.
- Write a new forward migration that reverses the change (`DROP COLUMN`, `DROP POLICY`, etc.).
- Document the reason in the new migration's filename and a header comment.
