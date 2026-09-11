---
status: blocked
phase: 102-staging-data-debt-tail
plan: 14
requirement: PREVIEW-HOLLOW-01
completed: 2026-09-11
---

# P102-14 Summary

Deleted the unreachable preview-layouts route, hook, dedicated types, and English/Arabic i18n namespace. Regenerated `routeTree.gen.ts`, added the idempotent drop migration, exported the staging seed rows before the drop, applied the migration twice, and verified staging's bounded catalog end state.

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

The header plus 12 data lines confirms all 12 seed rows were exported before any drop statement ran.

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

## Post-work catalog oracle

The plan's command oracle was executed under `bash` because its unquoted `set -- $PSQL_OUT` relies on POSIX field splitting (zsh does not split scalar parameters by default).

Verbatim output:

```text
P102-14-CATALOG tables_remaining=0 functions_remaining=0 types_remaining=0 control_dossiers=1 expected 0 0 0 1
PASS preview-dropped
```

## Source grep: criterion NOT met

The criterion command, quoted so git's basic regex receives the `\|` alternation. Rerun 2026-09-12 on this attempt's tree:

```text
git grep -n 'preview-layouts\|usePreviewLayouts\|entity_preview_layouts' -- frontend/src backend/src supabase/functions
```

Verbatim output:

```text
backend/src/types/database.types.ts:12414:      entity_preview_layouts: {
backend/src/types/database.types.ts:22704:            referencedRelation: "entity_preview_layouts"
backend/src/types/database.types.ts:28334:            referencedRelation: "entity_preview_layouts"
frontend/src/types/database.types.ts:12414:      entity_preview_layouts: {
frontend/src/types/database.types.ts:22704:            referencedRelation: "entity_preview_layouts"
frontend/src/types/database.types.ts:28334:            referencedRelation: "entity_preview_layouts"
REQUESTED_GREP_HITS=6
```

The criterion requires 0. It is **not met**. The previous attempt's excluded-pathspec grep (`FEATURE_SOURCE_GREP_HITS=0`) was a different command, and the judge correctly rejected it as a substitute. It is withdrawn; no zero is claimed.

Do not use the unquoted form as a pass either. The shell strips the backslashes, so git grep searches for the literal string `a|b|c`, which returns 0 on any tree. Verbatim output, beside a single-term control on the same tree:

```text
$ git grep -n preview-layouts\|usePreviewLayouts\|entity_preview_layouts -- frontend/src backend/src supabase/functions
UNQUOTED_RC=1
$ git grep -c entity_preview_layouts -- frontend/src backend/src supabase/functions
backend/src/types/database.types.ts:3
frontend/src/types/database.types.ts:3
CONTROL_RC=0
```

The quoted command's six hits show it can report non-zero, so no separate positive control is needed.

## BLOCKED: needs an operator ruling or a follow-up task

- **Unmet item:** the judge criterion "`git grep -n preview-layouts\|usePreviewLayouts\|entity_preview_layouts -- frontend/src backend/src supabase/functions` = 0 hits".
- **Why this plan cannot clear it:** all six hits are content inside `frontend/src/types/database.types.ts` and `backend/src/types/database.types.ts`, both generated Supabase snapshots. Neither path is in P102-14's fixed allowlist (`files_modified`), and no in-scope edit can change what git grep reads in them. The defect and its fix are both at those two paths.
- **Remedy:** add those two paths to the allowlist, then strip the preview residue from both files. Line numbers are the same in both files, even though the files differ elsewhere (`cmp` first differs at line 33276):
  - tables `entity_preview_layouts` (:12414), `preview_layout_fields` (:22650), `user_preview_preferences` (:28295)
  - functions `get_entity_layouts` (:35002), `get_preview_layout` (:35844), `set_default_layout` (:37927)
  - enums `preview_context`, `preview_entity_type`, `preview_field_type` under `Enums` (:39091, :39097, :39110) and `Constants` (:40478, :40485, :40499)

  Strip all of it, not just the six grep-matching lines. Stripping only those would leave two tables whose foreign keys point at a relation that is gone. Nothing outside the snapshots reads these names. Verbatim output of the census that excluded the two snapshot paths:

  ```text
  git grep -n -E 'preview_context|preview_entity_type|preview_field_type|get_preview_layout|get_entity_layouts|set_default_layout|preview_layout_fields|user_preview_preferences' -- frontend/src backend/src supabase/functions ':!frontend/src/types/database.types.ts' ':!backend/src/types/database.types.ts'
  OTHER_READERS_RC=1
  ```

  A full `supabase gen types` regeneration would also work, but it would pull every other schema drift since the snapshots were taken into this diff. Stripping keeps the change to the preview objects.
- **Carry in the same follow-up:** these are also outside this allowlist and also refer to the deleted namespace.
  - `scripts/glossary-senses.d/brief-stance.json:40` and `scripts/glossary-senses.d/dossier-b.json:36` still list `frontend/src/i18n/ar/preview-layouts.json`, so `glossary-census.mjs --slice` on either overlay throws.
  - Dead tracked copies remain at `frontend/public/locales/{en,ar}/preview-layouts.json`.

Everything else in the plan is done: the route, hook, dedicated types file, and both i18n JSON files are deleted; the i18n registrations are removed; the route tree is regenerated; the migration was applied twice; the 12 seed rows were exported first; and the catalog oracle returned `0 0 0 1`.

## Commits

```text
ff93e377a refactor(frontend): remove preview layouts feature
c0581964f chore(db): drop preview layout objects
32bddb05d docs(planning): record preview layouts removal
```
