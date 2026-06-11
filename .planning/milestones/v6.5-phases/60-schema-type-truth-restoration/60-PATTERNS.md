# Phase 60: Schema & Type Truth Restoration - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 11 (8 SQL migrations, 2 type-file regens, 1 CI smoke-test script + 1 CI wiring)
**Analogs found:** 11 / 11

This phase creates/modifies almost no application code. It is overwhelmingly
**SQL migrations** + a **generated-types swap** + **one Node CI script**. There are
strong in-repo analogs for every one of these — the planner should copy them
directly. The dominant pattern across this codebase's corrective migrations is a
**root-cause comment header** (what broke, the Postgres error code, why) followed by
the minimal SQL fix that preserves all other logic byte-for-byte.

## File Classification

| New/Modified File                                                      | Role                                    | Data Flow                          | Closest Analog                                                                                                       | Match Quality                         |
| ---------------------------------------------------------------------- | --------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `supabase/migrations/2026061000000X_capture_unified_work_stack.sql`    | migration (capture-from-live)           | transform (view/matview/RPC DDL)   | `035_create_event_details_view.sql`                                                                                  | role-match (DDL, not corrective)      |
| `supabase/migrations/2026061000000X_fix_sla_monitoring_full_name.sql`  | migration (fix-then-apply RPC)          | transform (RPC DDL)                | `20260531120000_fix_get_team_workload_email_text_cast.sql`                                                           | exact                                 |
| `supabase/migrations/2026061000000X_create_event_details_view.sql`     | migration (fix-then-apply view)         | transform (view DDL)               | `035_create_event_details_view.sql`                                                                                  | exact                                 |
| `supabase/migrations/2026061000000X_create_pending_role_approvals.sql` | migration (author table)                | CRUD (table + RLS)                 | `20251011214943_create_pending_role_approvals.sql` (source) + `20260604120000_calendar_entries_select_rls.sql` (RLS) | exact (source)                        |
| `supabase/migrations/2026061000000X_create_position_delegations.sql`   | migration (author table)                | CRUD (table + RLS)                 | `009_create_data_library_items.sql` (table+RLS shape)                                                                | role-match                            |
| `supabase/migrations/2026061000000X_create_word_assistant_logs.sql`    | migration (author table)                | CRUD (table + RLS)                 | `009_create_data_library_items.sql` (table+RLS shape)                                                                | role-match                            |
| `supabase/migrations/009_data_library.sql`                             | migration (mark superseded)             | n/a (header comment only)          | `035`/`037` file-header comment convention                                                                           | role-match                            |
| `supabase/functions/escalations-report/index.ts`                       | edge function (schema-ref fix)          | request-response (PostgREST query) | sibling edge fns (`.select()` column lists)                                                                          | role-match                            |
| `frontend/src/types/database.types.ts`                                 | generated types (regen)                 | n/a (compile-time)                 | commit `ef88cc31` (Phase 54 regen)                                                                                   | exact (precedent)                     |
| `backend/src/types/database.types.ts`                                  | generated types (regen, byte-identical) | n/a (compile-time)                 | commit `ef88cc31` (Phase 54 regen)                                                                                   | exact (precedent)                     |
| `scripts/check-edge-fn-schema-refs.mjs` (name at discretion)           | CI script (smoke test)                  | batch / static-analysis            | `frontend/scripts/assert-size-limit-matches.mjs`                                                                     | exact (Node fs-walk + regex + exit 1) |
| `.github/workflows/ci.yml` (add job/step)                              | config (CI wiring)                      | n/a                                | `bundle-size-check` job (lines 380-406)                                                                              | exact                                 |

---

## Pattern Assignments

### Corrective RPC migrations — `*_fix_sla_monitoring_full_name.sql` (migration, transform)

**Analog:** `supabase/migrations/20260531120000_fix_get_team_workload_email_text_cast.sql`
(also `20260530120500_fix_get_engagement_briefs_text_cast.sql`)

This is the single most important pattern for the phase. Both SLA `full_name` fixes
(`staff_profiles.full_name` → `JOIN users u` → `u.full_name`/`u.name_ar`) follow this
template exactly: a comment header naming the broken column + error code + the user-
visible symptom, then `CREATE OR REPLACE FUNCTION` with the corrected JOIN, preserving
every other line.

**Root-cause comment header** (lines 1-10) — copy this style verbatim:

```sql
-- Fix get_team_workload 42804: auth.users.email is character varying(255) but the
-- function's RETURNS TABLE declares user_email as text. The bare `u.email` select
-- therefore failed at RETURN QUERY with:
--   42804: structure of query does not match function result type
--   DETAIL: Returned type character varying(255) does not match expected type text
-- This 500'd GET /functions/v1/unified-work-list?endpoint=team ...
-- Fix: cast u.email::text to match the declared return type. All other logic is
-- preserved byte-for-byte.
```

For Phase 60 the header should instead state: `staff_profiles has no full_name column
(cols: id, user_id, unit_id, role); the SLA assignee/at-risk RPCs in
20260111600001 referenced sp.full_name → 42703 undefined_column. Fix: LEFT JOIN users
u ON u.id = sp.user_id and select u.full_name / u.name_ar.` (verified live in RESEARCH.md).

**Function signature + JOIN body** (lines 12-52) — the corrective skeleton:

```sql
CREATE OR REPLACE FUNCTION public.get_team_workload(requesting_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(user_id uuid, user_email text, ...)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ws.user_id,
    u.email::text AS user_email,         -- the corrected reference
    ...
  FROM user_work_summary ws
  JOIN auth.users u ON ws.user_id = u.id  -- the added JOIN
  ...;
END;
$function$;
```

Apply the JOIN-to-`users` + select `u.full_name`/`u.name_ar` in all 3 spots flagged in
RESEARCH.md (view lines ~191-213, functions ~382-407 + ~442). Note: SLA migration body
also keeps `CREATE TABLE IF NOT EXISTS sla_escalations` (harmless against live).

---

### View migrations — `*_capture_unified_work_stack.sql` & `*_create_event_details_view.sql` (migration, transform)

**Analog:** `supabase/migrations/035_create_event_details_view.sql`

The whole-file shape (BEGIN/COMMIT wrapper, `CREATE OR REPLACE VIEW`, `COMMENT ON VIEW`,
explicit `GRANT SELECT ... TO authenticated` + `TO anon`) is the exact template for the
`event_details` rebuild and a close template for the unified-work view captures.

**Full view migration template** (lines 1-30):

```sql
-- 035_create_event_details_view.sql
-- Events mapped to UI shape for current production schema

BEGIN;

CREATE OR REPLACE VIEW public.event_details AS
SELECT
  e.id,
  e.title AS title_en,
  ...
  CASE WHEN e.status::text = 'in_progress' THEN 'ongoing' ELSE e.status::text END AS status
FROM public.events e;

COMMENT ON VIEW public.event_details IS 'Events mapped to UI shape expected by UI (...).';

GRANT SELECT ON public.event_details TO authenticated;
GRANT SELECT ON public.event_details TO anon;

COMMIT;
```

**Notes for the planner:**

- 035 itself is appliable as-is per RESEARCH.md; 037 is unappliable (joins `organizations.name_en`/`countries.name_en` which don't exist on the dossier-extension tables). The new migration ships the **035 shape + organizer/country columns via `event_attendees`→`dossiers` joins OR NULL placeholders** — decide after reading which fields `frontend/src/pages/events/EventsPage.tsx` (`.select('*')` at line ~265) actually renders.
- **Capture-from-live stack** (`unified_work_items`, `user_work_summary` views; `user_productivity_metrics` MATVIEW; 3 RPCs): use this same wrapper but populate the bodies from `pg_get_viewdef` / `pg_matviews.definition` / `pg_get_functiondef` dumps. Use `CREATE OR REPLACE VIEW` / `CREATE MATERIALIZED VIEW IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION` so it is an idempotent no-op against live but records in migration history. Include the matview's unique index (from `pg_indexes`) and any refresh function.

---

### Table-authoring migrations — `*_create_pending_role_approvals.sql`, `*_create_position_delegations.sql`, `*_create_word_assistant_logs.sql` (migration, CRUD)

**Analog (table body):** `supabase/migrations/009_create_data_library_items.sql` and the
**source** `supabase/migrations/20251011214943_create_pending_role_approvals.sql`
**Analog (RLS policy):** `supabase/migrations/20260604120000_calendar_entries_select_rls.sql`

**Table DDL pattern** (`009_data_library.sql` lines 4-20) — bilingual columns, CHECK
constraints, FK to `public.users(id)`, `TIMESTAMPTZ DEFAULT NOW()`:

```sql
CREATE TABLE IF NOT EXISTS public.data_library_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title_en TEXT NOT NULL CHECK (LENGTH(title_en) > 0),
    ...
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ...
);
```

**Owner-scoped RLS pattern** (`20260604120000_calendar_entries_select_rls.sql` lines 11-30) —
`DROP POLICY IF EXISTS` then `CREATE POLICY ... USING (owner_col = auth.uid() OR ...)`:

```sql
DROP POLICY IF EXISTS "calendar_entries_select_policy" ON public.calendar_entries;
CREATE POLICY "calendar_entries_select_policy"
ON public.calendar_entries
FOR SELECT
TO public
USING (
  organizer_id = auth.uid()
  OR created_by = auth.uid()
  OR ...
);
```

**Per-table guidance (shapes verified live in RESEARCH.md):**

- `pending_role_approvals`: **copy from the source migration `20251011214943`** but (a) prepend `CREATE TYPE approval_status AS ENUM (...)` — the enum is MISSING live; (b) **OMIT the `apply_admin_role_approval` trigger** — it depends on missing `user_sessions` and mutates `auth.users.role` (Phase 61 scope). Keep table + indexes + sane owner-scoped RLS.
- `position_delegations`: author new from `supabase/functions/positions-delegate/index.ts` (lines 159-189): `id`, `position_id` (→`positions`), `delegator_id` (auth user), `delegate_id`, `reason text null`, `expires_at timestamptz null`, `status text default 'active'`. Owner-scoped RLS on `delegator_id`/`delegate_id`.
- `word_assistant_logs`: author new from `supabase/functions/word-assistant/index.ts` (line 256): `user_id`, `action text`, `input_text text`, `output_text text`, `session_id`, `created_at timestamptz`. Owner-scoped RLS on `user_id`.

---

### Superseding a dead migration — `009_data_library.sql` (migration, header comment only)

**Analog (header-comment convention):** every numbered migration opens with a
`-- NNN_filename.sql` + one-line purpose comment (see `035` line 1-2, `009_data_library.sql`
line 1-2). The supersede marker extends that existing first-line convention.

Recommended (lowest blast radius per RESEARCH.md open-decision #2): prepend a header to
`009_data_library.sql` — do NOT delete it, do NOT touch the live `data_library_items`
table. The marker must say it is **superseded-by-live / never-applied** and that the live
schema is the `009_create_data_library_items.sql` shape (`title_en`/`title_ar` bilingual,
not this file's `title_en`/`file_url`/`category` shape). This prevents a future agent from
"fixing" the drift backwards. Existing first-line style to mirror:

```sql
-- 009_data_library.sql: DataLibraryItems table
-- Documents and resources in the data library
```

---

### Edge-function schema-ref fix — `supabase/functions/escalations-report/index.ts` (edge function, request-response)

**Analog:** sibling edge functions' PostgREST `.select('col, col')` column lists (this is a
TypeScript edit, not SQL). Three confirmed-broken references (RESEARCH.md line 33):

- line 121/130: embeds+filters `assignments.organizational_unit_id` (absent → unit lives on `staff_profiles.unit_id`) → re-route via `staff_profiles.unit_id`
- line 213-214: `organizational_units.select('id, name')` → `'id, name_en, name_ar'`
- line 240-241: `staff_profiles.select('user_id, full_name, ...')` → join `users` for `full_name`

**CRITICAL (handoff rule 4 / RESEARCH.md open-decision #3):** this is an EDGE FUNCTION —
the fix is inert until redeployed via Supabase CLI/MCP. SQL-only application does nothing.

---

### Generated types regen — `frontend/src/types/database.types.ts` + `backend/src/types/database.types.ts` (generated types)

**Analog:** commit `ef88cc31` "chore(54-04): regenerate database.types.ts from staging".
This is the exact precedent — read the commit message for the verification recipe.

**The Phase 54 recipe (copy exactly):**

1. After ALL migrations applied, MCP `generate_typescript_types` (project `zkrcjzdemdmwhearhfgg`).
2. Write the **same byte-for-byte content** to BOTH `frontend/src/types/database.types.ts` AND `backend/src/types/database.types.ts`.
3. Verify byte-identity: `cmp backend/src/types/database.types.ts frontend/src/types/database.types.ts` → must be silent (exit 0). (Confirmed today: these two files are currently byte-identical, 39567 lines each.)
4. `grep -q` for each newly-added symbol (e.g. `get_sla_dashboard_overview:`, `event_details:`, `pending_role_approvals:`, `position_delegations:`, `word_assistant_logs:`).
5. `pnpm --filter intake-frontend type-check` → 0 AND `pnpm --filter intake-backend type-check` → 0.
6. Build both: `pnpm --filter intake-frontend build` (because `as`-casts let drift compile silently — RESEARCH.md line 56).

**File structure facts (for the regen + the smoke test):**

- Header is a literal `export type Json = ...` then `export type Database = { ... __InternalSupabase: { PostgrestVersion: "13.0.5" } public: { Tables: {...} Views: {...} Functions: {...} Enums: {...} CompositeTypes: {...} } }`. **No `@ts-nocheck` at the very top** (the 47-01 allowlist is elsewhere). Keep this exact header — do not hand-edit.
- Top-level keys (frontend copy today): `Tables:` @ line 16, `Views:` @ line 30166, `Functions:` @ line 32014, `Enums:` @ line 36980, `CompositeTypes:` @ line 38145.
- Each entry under a block appears as `      <name>: {` (6-space indent under `Tables:`/`Views:`/`Functions:`).

**⚠ DEAD doubled-path copy — `backend/backend/src/types/database.types.ts`:**
This file IS git-tracked but is **dead**: it is only 1037 lines (vs 39567), has a leaked
Supabase-CLI log header (`Using workdir ...` / `Connecting to db 5432`), references stale
`calendar_events`, and **nothing imports it** (verified: zero `backend/backend` references
across `.ts`/`.json` outside node_modules/worktrees). The Phase 54 commit `ef88cc31`
explicitly wrote only TWO copies (frontend + backend/src). **Recommendation for planner:**
do NOT regenerate into it; either leave untouched or (cleaner) delete it as an orphan —
RESEARCH.md line 55 flagged exactly this ("keep byte-identical or investigate whether it's
dead" — it is dead). Decide explicitly; do not silently propagate the stale copy.

---

### CI smoke test — `scripts/check-edge-fn-schema-refs.mjs` (CI script, static-analysis)

**Analog:** `frontend/scripts/assert-size-limit-matches.mjs` — a dependency-free Node ESM
script that fs-walks a tree, regex-matches, prints per-item results, and `process.exit(1)`
on any failure. The smoke test is structurally identical (walk `supabase/functions`,
regex-extract `.from`/`.rpc` literals, assert membership in parsed type-file keys).

**Reusable building blocks from the analog:**

`recursive fs walk` (lines 20-33):

```js
function walkFiles(root, dir = root) {
  if (!fs.existsSync(root)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkFiles(root, absolute)
    return path.relative(root, absolute).split(path.sep).join('/')
  })
}
```

`fail-collect + exit pattern` (lines 41, 70-80):

```js
let hasMissingMatch = false
// ...per item:
console.log(`${check.name}: ${matches.size} file(s)`)
if (/* assertion fails */) {
  hasMissingMatch = true
  console.error(`${check.name}: expected ..., got ${matches.size}`)
}
// ...end:
if (hasMissingMatch) process.exit(1)
```

`script-relative path resolution` (lines 6-9):

```js
const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')
```

**Parser calibration (verified against the live tree — these regexes WORK):**

- Extract refs from edge fns: `/\.(from|rpc)\(\s*['"]([a-zA-Z_]\w*)['"]/g` over each
  `index.ts`. There are **301 `index.ts` files**, **344 distinct `.from()` names**, plus the
  `.rpc()` set. Group 1 = `from`|`rpc`, group 2 = the name.
- Membership check in `frontend/src/types/database.types.ts`: a `.from('X')` name must
  appear as `X: {` inside the `Tables:` OR `Views:` block; a `.rpc('Y')` name must appear
  as `Y: {` inside the `Functions:` block. RESEARCH.md line 60 confirms **regex on
  `X: {` within the block is sufficient and dependency-free** — no ts-morph needed. Simplest
  robust approach: slice the file between `Tables: {`/`Views: {`/`Functions: {` markers and
  their matching close, then test for `^      <name>: {`.
- **Known-failure allowlist file** (RESEARCH.md line 61): a sibling JSON/array of
  legitimately-dynamic names. After P1 lands it should be EMPTY or each entry carries a
  backlog ref. Mirror the analog's `expectedMatchCounts` Map idea (line 42-51) for the
  allowlist data structure.

**Positive-failure self-test (REQUIRED by validation matrix, RESEARCH.md line 73):**
the script must exit non-zero on a seeded fake `.rpc('nonexistent_fn')`. This codebase
already has a first-class pattern for that — see the CI wiring below.

---

### CI wiring — `.github/workflows/ci.yml` (config)

**Analog (job that runs a Node script):** the `bundle-size-check` job (lines 380-406):

```yaml
bundle-size-check:
  name: Bundle Size Check (size-limit)
  runs-on: ubuntu-latest
  needs: [lint, type-check]
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Assert size-limit paths match built files
      run: node frontend/scripts/assert-size-limit-matches.mjs
```

The schema-ref smoke test is the same shape: `needs: [lint, type-check]` (or fold a step
into the existing `lint`/`type-check` job to avoid a NEW required-context on protected
`main` — RESEARCH.md line 61 explicitly recommends this), `run: node scripts/check-edge-fn-schema-refs.mjs`.

**Analog (positive-failure assertion):** the `design-token-check` (lines 85-90) and
`i18next-factory-check` (lines 111-116) jobs prove a fixture FAILS via bash negation:

```yaml
- name: Assert design-token fixture fails lint (positive-failure)
  shell: bash
  run: |
    set -e
    ! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 \
      tools/eslint-fixtures/bad-design-token.tsx
```

Use the identical `! node scripts/check-edge-fn-schema-refs.mjs <scratch-fixture-with-fake-rpc>`
idiom to satisfy the "seeded fake exits non-zero" validation requirement.

---

## Shared Patterns

### Corrective-migration comment header (the phase's signature pattern)

**Source:** `supabase/migrations/20260531120000_fix_get_team_workload_email_text_cast.sql` (lines 1-10), `20260530120500_fix_get_engagement_briefs_text_cast.sql` (lines 1-5), `20260604120000_calendar_entries_select_rls.sql` (lines 1-10)
**Apply to:** EVERY migration in this phase.
Every corrective migration here opens with a multi-line `--` block stating: the object,
the broken reference, the Postgres error code (42703 undefined_column / 42804 type-mismatch
/ 42P01 undefined_table), the user-visible symptom (which screen/endpoint 500'd), and a
one-line "Fix:" + "all other logic preserved byte-for-byte". This is the codebase's house
style for schema-truth repairs and downstream agents/reviewers rely on it.

### Migration application via MCP `apply_migration` (process rule, locked)

**Source:** CONTEXT.md "Process rules" + RESEARCH.md "Migration strategy".
**Apply to:** all 6 SQL migrations.
Apply via Supabase MCP `apply_migration` ONLY (project `zkrcjzdemdmwhearhfgg`), AND commit
the identical SQL file to `supabase/migrations/`. Use idempotent DDL (`CREATE OR REPLACE`,
`IF NOT EXISTS`) so capture-from-live migrations are no-ops against the live DB while still
recording in migration history. Dated naming `2026061000000X_*.sql` (timestamps at
discretion). VERIFY every DB/RPC claim against staging SQL before acting (round-1 WG false
positive). Filenames are at Claude's discretion (CONTEXT.md).

### Bilingual column + owner-scoped RLS (table authoring)

**Source:** `009_create_data_library_items.sql` (bilingual `*_en`/`*_ar` + CHECK + FK), `20260604120000_calendar_entries_select_rls.sql` (`DROP POLICY IF EXISTS` → `CREATE POLICY ... USING (col = auth.uid() OR ...)`).
**Apply to:** the 3 authored tables (`pending_role_approvals`, `position_delegations`, `word_assistant_logs`).

### Byte-identical types across workspaces (regen invariant)

**Source:** commit `ef88cc31` (Phase 54 / D-14 / Pitfall 5).
**Apply to:** the two LIVE type copies (`frontend/src/types/`, `backend/src/types/`) — NOT the dead `backend/backend/src/` copy.
Verify with `cmp` (silent) + `grep -q` new symbols + dual `type-check` + `build`.

---

## No Analog Found

None. Every file in this phase maps to an existing in-repo pattern. The closest thing to a
"new" artifact is the smoke-test script, and even that is structurally covered by
`frontend/scripts/assert-size-limit-matches.mjs` (fs-walk + regex + exit 1) and the
positive-failure CI jobs (`design-token-check`, `i18next-factory-check`).

---

## Metadata

**Analog search scope:** `supabase/migrations/` (437 files), `supabase/functions/**/index.ts` (301), `scripts/`, `frontend/scripts/`, `.github/workflows/`, the 3 `database.types.ts` copies, git history for `database.types.ts`.
**Files scanned (read in full):** `20260530120500_fix_get_engagement_briefs_text_cast.sql`, `20260531120000_fix_get_team_workload_email_text_cast.sql`, `035_create_event_details_view.sql`, `20260604120000_calendar_entries_select_rls.sql`, `009_data_library.sql` (head), `scripts/lint.mjs`, `frontend/scripts/assert-size-limit-matches.mjs`, `.github/workflows/ci.yml`, `frontend/src/types/database.types.ts` (header + key layout).
**Live-verification source:** RESEARCH.md ground-truth matrix (already probed against staging `zkrcjzdemdmwhearhfgg`).
**Pattern extraction date:** 2026-06-10
