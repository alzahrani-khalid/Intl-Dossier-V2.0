---
status: complete
phase: 102-staging-data-debt-tail
plan: 14
requirement: PREVIEW-HOLLOW-01
completed: 2026-09-12
---

# P102-14 Summary

Deleted the unreachable preview-layouts route, hook, dedicated types, and English/Arabic i18n namespace. Regenerated `routeTree.gen.ts`, added the idempotent drop migration, exported the staging seed rows before the drop, applied the migration twice, and verified staging's bounded catalog end state. Under the overseer ruling (56e0d361c) that added `{frontend,backend}/src/types/database.types.ts` to `files_modified`, this attempt also hand-deleted the three dropped tables, three RPCs and three enums from both generated snapshots. The required `git grep` now returns 0 hits, and a positive control on the same tree returns non-zero.

## Population and pre-drop evidence

The creating migration and live catalogs re-derived the population as 4 triggers, 13 live policies, 5 functions, 3 tables, and 3 enum types. Per the plan, the migration explicitly drops the required 8 policies (the four `preview_layouts_*` policies and four `entity_preview_layouts_org_isolation_*` policies); the remaining table-owned policies disappear with their tables.

Command:

```text
psql "$SUPABASE_DB_URL" ... -- catalog counts, seed count, policies, triggers
```

Verbatim output:

```text
3 5 3 1
SEED_ROWS=12
public.entity_preview_layouts.entity_preview_layouts_org_isolation_delete
public.entity_preview_layouts.entity_preview_layouts_org_isolation_insert
public.entity_preview_layouts.entity_preview_layouts_org_isolation_select
public.entity_preview_layouts.entity_preview_layouts_org_isolation_update
public.entity_preview_layouts.preview_layouts_admin_delete
public.entity_preview_layouts.preview_layouts_admin_insert
public.entity_preview_layouts.preview_layouts_admin_update
public.entity_preview_layouts.preview_layouts_select
public.preview_layout_fields.preview_layout_fields_admin_delete
public.preview_layout_fields.preview_layout_fields_admin_insert
public.preview_layout_fields.preview_layout_fields_admin_update
public.preview_layout_fields.preview_layout_fields_select
public.user_preview_preferences.user_preview_preferences_own
entity_preview_layouts.tr_enforce_single_default_layout
entity_preview_layouts.tr_enforce_single_default_layout
entity_preview_layouts.tr_entity_preview_layouts_updated
preview_layout_fields.tr_preview_layout_fields_updated
user_preview_preferences.tr_user_preview_preferences_updated
```

`information_schema.triggers` emits one row per trigger event, so `tr_enforce_single_default_layout` appears twice for its `INSERT OR UPDATE` events; this is 4 distinct triggers.

## Pre-drop CSV export

Command:

```text
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "\copy (select * from public.entity_preview_layouts order by id) to '/private/tmp/p102-preview-layouts-20260911T221148Z.csv' csv header"
wc -l /private/tmp/p102-preview-layouts-20260911T221148Z.csv
```

Verbatim output:

```text
COPY 12
EXPORT_PATH=/private/tmp/p102-preview-layouts-20260911T221148Z.csv
      13 /private/tmp/p102-preview-layouts-20260911T221148Z.csv
```

The header plus 12 data lines confirms all 12 seed rows were exported before any drop statement ran. Presence re-checked on 2026-09-12 during this attempt:

```text
-rw-r--r--  1 khalidalzahrani  wheel  4824 Sep 12 01:11 /private/tmp/p102-preview-layouts-20260911T221148Z.csv
      13 /private/tmp/p102-preview-layouts-20260911T221148Z.csv
```

## Frontend deletion and route generation

The initial requested build could not write Vite's temporary config through the harness-managed, read-only `node_modules` symlink:

```text
pnpm -C frontend build
Error: EPERM: operation not permitted, open '.../frontend/node_modules/.vite-temp/vite.config.ts.timestamp-1789164741279-8af3fd19f377e.mjs'
ELIFECYCLE Command failed with exit code 1.
```

The equivalent native-loader build avoided writing into `node_modules` and regenerated the route tree:

```text
node -e "global.__dirname=process.cwd(); import('vite').then(({build}) => build({configLoader:'native'})).catch((error) => { console.error(error); process.exitCode=1 })"
```

Verbatim terminal result:

```text
vite v7.3.3 building client environment for production...
transforming...
✓ 9537 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 11.45s
```

The build reported only the repository's existing CSS-token, circular-chunk, mixed-import, and chunk-size warnings. The commit hooks subsequently ran the repository build successfully as well.

## Migration applies

Command (run twice in sequence):

```text
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260911000002_p102_drop_preview_layouts.sql
```

First apply, verbatim output:

```text
DO
DO
DROP FUNCTION
DROP FUNCTION
DROP FUNCTION
DROP FUNCTION
DROP FUNCTION
DROP TABLE
DROP TABLE
DROP TABLE
DROP TYPE
DROP TYPE
DROP TYPE
```

Second apply, verbatim output (notices identify already-absent objects; every guarded drop completes):

```text
DO
DO
NOTICE:  type "public.preview_entity_type" does not exist, skipping
DROP FUNCTION
NOTICE:  type "public.preview_entity_type" does not exist, skipping
DROP FUNCTION
NOTICE:  function public.set_default_layout(uuid) does not exist, skipping
DROP FUNCTION
NOTICE:  function public.enforce_single_default_layout() does not exist, skipping
DROP FUNCTION
NOTICE:  function public.update_preview_layout_timestamp() does not exist, skipping
DROP FUNCTION
NOTICE:  table "user_preview_preferences" does not exist, skipping
DROP TABLE
NOTICE:  table "preview_layout_fields" does not exist, skipping
DROP TABLE
NOTICE:  table "entity_preview_layouts" does not exist, skipping
DROP TABLE
NOTICE:  type "public.preview_field_type" does not exist, skipping
DROP TYPE
NOTICE:  type "public.preview_context" does not exist, skipping
DROP TYPE
NOTICE:  type "public.preview_entity_type" does not exist, skipping
DROP TYPE
```

## Generated type snapshots (this attempt, overseer ruling 56e0d361c)

These commands ran in execution order on 2026-09-12.

1. Reader census over the whole repository, excluding migrations, planning, and the two snapshots. It covers every table, function, enum and file name of the feature:

```text
git grep -n -E 'entity_preview_layouts|preview_layout_fields|user_preview_preferences|preview_context|preview_entity_type|preview_field_type|get_preview_layout|get_entity_layouts|set_default_layout|enforce_single_default_layout|update_preview_layout_timestamp|usePreviewLayouts|preview-layout' -- . ':!supabase/migrations' ':!.planning' ':!frontend/src/types/database.types.ts' ':!backend/src/types/database.types.ts'
```

```text
reports/settings-admin-workflow-inspection-2026-06-09.md:89:| `field-permissions`, `preview-layouts`, `retention-policies` | Admin child pages                       | EN/AR files present                             | EN/AR files present                             | `index.ts:331,373,376,457,499,502` | Registered                                                                  |
scripts/glossary-senses.d/brief-stance.json:40:    "frontend/src/i18n/ar/preview-layouts.json",
scripts/glossary-senses.d/dossier-b.json:36:    "frontend/src/i18n/ar/preview-layouts.json"
REPO_OTHER_READERS_RC=0
```

No TypeScript reader exists, so deleting the type blocks cannot break a consumer. The three hits are outside `files_modified`; see "Left for a later task" below.

2. Pre-edit baseline with the quoted criterion pattern. This shows the instrument sees the target paths:

```text
$ git grep -c (pre-edit, quoted)
backend/src/types/database.types.ts:3
frontend/src/types/database.types.ts:3
PRE_RC=0
```

3. Hand-deletion of the blocks by a structural script (session scratchpad `strip-preview.mjs`; not committed). It deletes each `      <name>: {` … `      }` block, each `      <enum>:` union with its `| "…"` lines, and each `      <enum>: [` … `      ],` Constants array. It asserts every table and function name matched exactly once and every enum exactly twice (`Enums` + `Constants`), and that no name survives, before writing. No `supabase gen types` rewrite, and none of the files' other differences were reconciled.

```text
frontend/src/types/database.types.ts: removed 248 lines {"entity_preview_layouts":1,"preview_layout_fields":1,"user_preview_preferences":1,"get_entity_layouts":1,"get_preview_layout":1,"set_default_layout":1,"preview_context":2,"preview_entity_type":2,"preview_field_type":2}
backend/src/types/database.types.ts: removed 248 lines {"entity_preview_layouts":1,"preview_layout_fields":1,"user_preview_preferences":1,"get_entity_layouts":1,"get_preview_layout":1,"set_default_layout":1,"preview_context":2,"preview_entity_type":2,"preview_field_type":2}
REMOVED_BLOCKS_IDENTICAL fe==be
 backend/src/types/database.types.ts  | 248 -----------------------------------
 frontend/src/types/database.types.ts | 248 -----------------------------------
 2 files changed, 496 deletions(-)
```

The removed-line logs for the two files are byte-identical (`cmp` exit 0), and the diff is deletions only. The removal covered the complete surface: three tables (Row/Insert/Update/Relationships, including both foreign keys into `entity_preview_layouts`), three RPCs, and three enums under both `Enums` and `Constants`. No foreign key is left pointing at a dropped relation.

4. **The criterion grep, post-edit: 0 hits.** The pattern is quoted so git's basic regex receives the `\|` alternation:

```text
$ git grep -n 'preview-layouts\|usePreviewLayouts\|entity_preview_layouts' -- frontend/src backend/src supabase/functions
REQUESTED_GREP_RC=1 hits=0
```

5. **Positive control beside the zero:** the same quoted pattern on the same post-edit tree, pointed at a path that must still contain the names:

```text
$ git grep -c 'preview-layouts\|usePreviewLayouts\|entity_preview_layouts' -- supabase/migrations
supabase/migrations/20260115100001_entity_preview_layouts.sql:59
supabase/migrations/20260627000001_sec_helper_is_platform_admin.sql:1
supabase/migrations/20260627000002_sec_be_01_admin_rls_db_role.sql:9
supabase/migrations/20260911000002_p102_drop_preview_layouts.sql:13
CONTROL_RC=0
```

Taken with step 2 (3 + 3 hits in these exact target paths before the edit), this shows the instrument could report non-zero, so the zero in step 4 is real.

6. Full-symbol census over the criterion's paths, post-edit. This covers the names that the three-term criterion pattern does not include:

```text
$ git grep -n -E 'preview_context|preview_entity_type|preview_field_type|get_preview_layout|get_entity_layouts|set_default_layout|preview_layout_fields|user_preview_preferences' -- frontend/src backend/src supabase/functions
SYMBOL_CENSUS_RC=1
```

7. Standalone typecheck of each edited snapshot (strict), which would catch any dangling `Database["public"]["Enums"]["preview_*"]` reference:

```text
./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target es2022 --moduleResolution bundler --module esnext frontend/src/types/database.types.ts
TSC_frontend_RC=0
./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target es2022 --moduleResolution bundler --module esnext backend/src/types/database.types.ts
TSC_backend_RC=0
```

The commit (`e2fc51c89`) also passed the repository pre-commit hook (lint-staged, build, knip). The last lines of its output were knip's pre-existing unused-export and configuration-hint listing, followed by `COMMIT_RC=0`.

Note on the unquoted form of the criterion: in a shell, `git grep -n preview-layouts\|usePreviewLayouts\|entity_preview_layouts` strips the backslashes, and git grep then searches for the literal string `a|b|c`. That returns 0 on any tree, so it is not the evidence. The quoted form above is, and its zero is bounded by the controls in steps 2 and 5.

## Post-work catalog oracle

The plan's command oracle was executed under `bash` because its unquoted `set -- $PSQL_OUT` relies on POSIX field splitting (zsh does not split scalar parameters by default). Rerun verbatim on 2026-09-12, after this attempt's work:

```text
P102-14-CATALOG tables_remaining=0 functions_remaining=0 types_remaining=0 control_dossiers=1 expected 0 0 0 1
PASS preview-dropped
ORACLE_RC=0
```

## Left for a later task (outside `files_modified`, not touched)

No task has been named for these yet. The operator needs to create one, because these paths are outside this plan's fixed allowlist:

- `scripts/glossary-senses.d/brief-stance.json:40` and `scripts/glossary-senses.d/dossier-b.json:36` still list the deleted `frontend/src/i18n/ar/preview-layouts.json`. `node scripts/glossary-census.mjs --slice <either overlay>` therefore throws `unknown ar slice file`. That tool is run by hand and is not wired into CI or lint.
- Dead tracked copies remain at `frontend/public/locales/{en,ar}/preview-layouts.json`. `public/locales` is not wired into the i18n loader (static bundle in `src/i18n/index.ts`), so they have no runtime effect.
- `reports/settings-admin-workflow-inspection-2026-06-09.md:89` is a dated historical inspection report that names the namespace. It is left as a record, not a defect.
- The migration was applied with `psql -f` as the plan mandates (D-24), so `supabase_migrations.schema_migrations` has no row for `20260911000002`. Every statement is `IF EXISTS`, so a later `db push` re-apply does nothing (see the second apply above).
- The CSV export is at `/private/tmp/…`, which is cleared on reboot. The plan named `.tickmarkr/overseer/`, which is outside the worktree. All 12 rows are also the seed `INSERT`s in `20260115100001_entity_preview_layouts.sql`, so the data can be rebuilt.

## Commits

```text
daa92d7d8 refactor(frontend): remove preview layouts feature
db49f27fb chore(db): drop preview layout objects
b09f82e5e docs(planning): record preview layouts removal
f6f5cf02a docs(planning): record P102-14 grep criterion as blocked on scope
e2fc51c89 chore(types): strip dropped preview layout objects from database types
```

This SUMMARY update is committed on top of those.
