---
phase: 29-complex-type-wizards
plan: 02
status: COMPLETE
commits:
  - 51448e1d — feat(29-02): add working_groups.parent_body_id migration
  - 12fe2da5 — feat(29-02): add conditional forums.organizing_body migration
  - (SUMMARY commit appended after this file)
files_changed:
  - supabase/migrations/20260416120000_phase29_wg_parent_body.sql (NEW, 15 lines)
  - supabase/migrations/20260416120001_phase29_ensure_forums_organizing_body.sql (NEW, 27 lines)
applied_to: zkrcjzdemdmwhearhfgg (Intl-Dossier staging, eu-west-2)
applied_via: Supabase CLI (`supabase db query --linked -f …`) — MCP unavailable in this session; user approved CLI fallback
---

## Objective recap

Write two Supabase migration files and apply them to the staging database so Wave 2 wizards (29-03 Forum, 29-04 Working Group) can persist their link FKs.

## Tasks executed

### Task 1 — Migration A: `working_groups.parent_body_id`

- File: `supabase/migrations/20260416120000_phase29_wg_parent_body.sql`
- Content: `ALTER TABLE … ADD COLUMN IF NOT EXISTS parent_body_id UUID NULL REFERENCES public.dossiers(id) ON DELETE SET NULL` + COMMENT + partial index `idx_working_groups_parent_body_id` (WHERE parent_body_id IS NOT NULL).
- Verify commands passed:
  - File exists ✓
  - grep "ADD COLUMN IF NOT EXISTS parent_body_id UUID NULL" ✓
  - grep "REFERENCES public.dossiers(id) ON DELETE SET NULL" ✓
  - grep "CREATE INDEX IF NOT EXISTS idx_working_groups_parent_body_id" ✓
  - grep "COMMENT ON COLUMN public.working_groups.parent_body_id" ✓
- Committed: `51448e1d feat(29-02): add working_groups.parent_body_id migration`

### Task 2 — Migration B: conditional `forums.organizing_body`

- File: `supabase/migrations/20260416120001_phase29_ensure_forums_organizing_body.sql`
- Content: plpgsql `DO $MIG$ … END $MIG$` block that checks `information_schema.columns` and only adds column + FK + index + comment if missing. Idempotent.
- Verify commands passed:
  - File exists ✓
  - grep `DO \$MIG\$` ✓
  - grep `column_name = 'organizing_body'` ✓
  - grep `ALTER TABLE public.forums` ✓
  - grep `REFERENCES public.organizations(id) ON DELETE SET NULL` ✓
- Committed: `12fe2da5 feat(29-02): add conditional forums.organizing_body migration`

### Task 3 — Apply + verify against staging

Executed via `supabase db query --linked -f <file>` (CLI fallback; Supabase MCP was referenced in user's allow-list but the server was NOT active in this session — user explicitly approved the CLI path).

**Step 1 (apply Migration A):** `supabase db query --linked` returned `[]` (expected for DDL; no runtime error). ✓

**Step 2 (apply Migration B):** Same — `[]`, no error. ✓ (The DO block skipped the body if the column already existed; safe either way.)

**Step 3 — working_groups.parent_body_id column evidence:**

```
column_name     | data_type | is_nullable
----------------+-----------+------------
parent_body_id  | uuid      | YES
```

Exactly one row. ✓

**Step 4 — forums.organizing_body column evidence:**

```
column_name      | data_type | is_nullable
-----------------+-----------+------------
organizing_body  | uuid      | YES
```

Exactly one row. ✓

**Step 5 — FK constraints evidence:**

```
conname                              | def
-------------------------------------+---------------------------------------------------------------------------
working_groups_parent_body_id_fkey   | FOREIGN KEY (parent_body_id) REFERENCES dossiers(id) ON DELETE SET NULL
forums_organizing_body_fkey          | FOREIGN KEY (organizing_body) REFERENCES organizations(id) ON DELETE SET NULL
```

Both target FKs present. ✓ (Plan's original ILIKE pattern used `REFERENCES public.dossiers` but pg_get_constraintdef strips the `public.` schema prefix; a simpler pattern confirmed both FKs exist as specified.)

**Step 6 — Indexes evidence:**

```
indexname                              | indexdef
---------------------------------------+----------------------------------------------------------------------------
idx_working_groups_parent_body_id      | CREATE INDEX … ON public.working_groups (parent_body_id) WHERE (… IS NOT NULL)
idx_forums_organizing_body             | CREATE INDEX … ON public.forums (organizing_body) WHERE (… IS NOT NULL)
```

Both indexes present. ✓

## Must-haves (truths) satisfied

- ✅ `working_groups.parent_body_id` exists in staging, UUID NULL, FK → `dossiers(id)` ON DELETE SET NULL
- ✅ `forums.organizing_body` exists in staging, UUID NULL, FK → `organizations(id)` ON DELETE SET NULL
- ✅ Both migration files committed to the repo (replayable locally / CI / prod)

## Surprises / observations (for reviewer + Wave 2 planner)

1. **MCP unavailable, CLI used.** The user's global memory rule says "use Supabase MCP to apply migrations yourself," but this session only had filesystem/docker/shadcn/anythingllm/heroui-react MCP servers active. User confirmed via AskUserQuestion to proceed with the Supabase CLI (`supabase db query --linked`). Documenting here so the memory rule can be revisited.
2. **Second FK on `forums` already existed.** Query showed a separate `fk_forums_organizing_body` (on column `organizing_body_id`) already pointing at `dossiers(id)`. Our new `forums_organizing_body_fkey` is on a different column (`organizing_body` → `organizations(id)`). Both coexist; this is consistent with Plan RESEARCH §1.5 which noted schema confusion between `organizing_body` and `organizing_body_id`.
3. **Migration-history drift exists on staging.** `supabase db push --linked --dry-run` reports ~200 remote migration versions that are not present in `supabase/migrations/`. This pre-existed phase 29 and is NOT caused by this plan. Worth a follow-up ticket to run `supabase migration repair` + `supabase db pull` when corporate-infra migration is done. For now, DDL was executed directly via `supabase db query --linked` which bypasses the `supabase_migrations.schema_migrations` history table — meaning a future `db push` will still complain about drift, but the column/FK/index state is correct.
4. **Migration B no-op path is expected.** If the column was pre-existing from an earlier migration, the DO block skipped the body silently. That's the designed safety-net behavior.

## Ready for Wave 2

Plans 29-03 (Forum wizard) and 29-04 (Working Group wizard) can safely use these columns in INSERT payloads:

- `INSERT INTO working_groups (…, parent_body_id) VALUES (…, <dossier-uuid>)` ✓
- `INSERT INTO forums (…, organizing_body) VALUES (…, <organization-uuid>)` ✓

Plan 29-05 (Engagement) is blocked only on Plan 29-01 (DossierPicker multi-select), not on this plan.
