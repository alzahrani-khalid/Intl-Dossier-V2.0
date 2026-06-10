# Phase 60: Schema & Type Truth Restoration — Research

**Researched:** 2026-06-10 (live staging verification via Supabase MCP, project `zkrcjzdemdmwhearhfgg`)
**Method:** Every backlog claim probed against live `information_schema` / `pg_proc` / `pg_matviews` / `pg_policies` SQL — per handoff rule 3 (round-1 WG false-positive lesson). Repo side verified with grep against `supabase/migrations/` and `supabase/functions/`.

## Verified ground-truth matrix

| Object | Live staging | Repo migration | Generated types | Verdict |
| --- | --- | --- | --- | --- |
| `unified_work_items` (view) | ✅ VIEW | ❌ none creates it | ✅ present | **Capture live def → forward migration** |
| `get_unified_work_items` (fn) | ✅ | ❌ | ✅ | Capture live def → forward migration |
| `get_user_work_summary` (fn) | ✅ | ❌ | ✅ | Capture live def → forward migration |
| `get_user_productivity_metrics` (fn) | ✅ | ❌ | ✅ | Capture live def → forward migration |
| `user_work_summary` (view, dep of fn above) | ✅ VIEW | ❌ | — | Must be included in the capture migration |
| `user_productivity_metrics` (MATVIEW, dep) | ✅ | ❌ | — | Must be included in the capture migration (+ unique index / refresh fn if present) |
| `get_sla_dashboard_overview` + `get_sla_compliance_by_type` + `get_sla_compliance_by_assignee` + `get_sla_at_risk_items` + `capture_sla_daily_snapshot` | ❌ MISSING | ✅ `20260111600001_enhanced_sla_monitoring.sql` | ❌ | **Migration never applied — apply CORRECTED version via MCP** (see full_name fix below) |
| `event_details` (view) | ❌ MISSING | ✅ `035_create_event_details_view.sql` + `037_update_event_details_add_org_country.sql` | ❌ | **035 appliable as-is; 037 UNAPPLIABLE** (see below). Apply corrected view via MCP |
| `pending_role_approvals` (table) | ❌ MISSING | ✅ `20251011214943_create_pending_role_approvals.sql` | ❌ | Apply CORRECTED version (trigger depends on missing objects, see below) |
| `position_delegations` (table) | ❌ MISSING | ❌ none anywhere | ❌ | **Author new migration** from `positions-delegate` edge-fn shape |
| `word_assistant_logs` (table) | ❌ MISSING | ❌ none anywhere | ❌ | **Author new migration** from `word-assistant` edge-fn shape |
| `data_library_items` | ✅ matches `009_create_data_library_items.sql` | dual 009 conflict | ✅ present | **`009_data_library.sql` is the DEAD one** (title_en/file_url/category schema NOT live). Mark superseded; do not touch the table |
| `staff_profiles.full_name` / `.full_name_ar` | ❌ neither exists (cols: id, user_id, unit_id, role, …) | referenced by `20260111600001` lines 191-213, 382-407, 442 | — | **Claim CONFIRMED.** Fix: `JOIN users u ON u.id = sp.user_id` → `u.full_name` / `u.name_ar` (`users.full_name` ✅, `users.name_ar` ✅, `users.full_name_ar` ❌) |
| `assignments.organizational_unit_id` | ❌ (has `assignee_id`; unit lives on `staff_profiles.unit_id`) | — | — | **Claim CONFIRMED.** escalations-report must route unit via `staff_profiles.unit_id` |
| `organizational_units.name` | ❌ (has `name_ar`, `name_en`) | — | — | **Claim CONFIRMED.** escalations-report `.select('id, name')` → `id, name_en, name_ar` |

## Key dependency facts (verified live)

- SLA migration deps ALL exist live: `sla_events` ✅, `sla_policies` ✅, `intake_tickets.priority/.submitted_at/.assigned_to` ✅, `sla_escalations` ✅ already exists (migration uses `CREATE TABLE IF NOT EXISTS` — safe), `sla_compliance_snapshots` created by the migration itself.
- `pending_role_approvals` migration deps: `user_role` enum ✅ live, **`approval_status` enum ❌ MISSING** (must create), **`user_sessions` table ❌ MISSING** (referenced by `apply_admin_role_approval` trigger which also `UPDATE auth.users SET role` — **omit this trigger**; role-apply mechanics belong to Phase 61 role-source unification).
- `event_details` 035 deps all live: `events.title/type/start_time/end_time/location/virtual_link/status` ✅. **037 is unappliable**: it selects `organizations.name_en/name_ar` and `countries.name_en/name_ar/code` — but live `organizations` (cols: id, org_code, org_type, …) and `countries` (cols: id, iso_code_2, iso_code_3, …) are dossier-extension tables; names live on `dossiers`. `event_attendees` (event_id, entity_id, type, role, created_at) ✅ live. A corrected 037-equivalent must join `dossiers` for names (e.g. `JOIN dossiers d ON d.id = ea.entity_id` or via extension-table FK) — or ship 035 shape + NULL organizer/country columns. `EventsPage.tsx` does `.select('*')` on the view (frontend/src/pages/events/EventsPage.tsx:265) so the view shape defines the contract; check which fields the page reads before deciding.
- `position_delegations` shape from `supabase/functions/positions-delegate/index.ts` (lines 159-189): `id`, `position_id` (→positions), `delegator_id` (auth user), `delegate_id`, `reason text null`, `expires_at timestamptz null`, `status text default 'active'`; queried by `.eq('position_id', …).eq('delegate_id', …)` + status filter. Edge fn has a 42P01 fallback writing into position metadata — table creation activates the primary path.
- `word_assistant_logs` shape from `supabase/functions/word-assistant/index.ts` (line 256): `user_id`, `action text`, `input_text text` (truncated 500), `output_text text` (truncated 500), `session_id`, `created_at timestamptz`.
- `escalations-report` edge fn (supabase/functions/escalations-report/index.ts): line 121/130 embeds+filters `assignments.organizational_unit_id` (absent); line 213-214 `organizational_units.select('id, name')` (no `name`); line 240-241 `staff_profiles.select('user_id, full_name, current_assignment_count')` (no `full_name`). All three CONFIRMED broken vs live.
- Generated-types stale entries today: `unified_work_items`/RPC trio ✅ typed; SLA RPCs ❌; `event_details` ❌; 3 missing tables ❌; `data_library_items` ✅ typed (matches live).

## Drift observations OUT of P1 scope (do not fix here — note for backlog)

- `20260330000001_operations_hub_rpcs.sql` (repo) references `unified_work_items_view` — an object that exists NOWHERE (live has `unified_work_items`). The live deployed `get_dashboard_stats` etc. evidently differ from this stale repo file. P3 dashboard scope.
- `data-library` storage bucket NOT provisioned (P4 scope; verified `storage.buckets` has no matching bucket).
- `data_library_items` has 4 live RLS policies; DataLibraryPage targets the dead 009 schema (P4 rebuild scope).

## Implementation guidance

### Migration strategy (per object)
1. **Capture-from-live** (unified work stack): dump `pg_get_viewdef` for `unified_work_items` + `user_work_summary`, matview def for `user_productivity_metrics` (pg_matviews.definition + indexes via pg_indexes + any refresh function), `pg_get_functiondef` for the 3 RPCs. Commit as ONE dated migration `2026061000000X_capture_unified_work_stack.sql` with `CREATE OR REPLACE VIEW` / `CREATE MATERIALIZED VIEW IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION`. Apply via MCP `apply_migration` (idempotent no-op against live, but records it in migration history and makes the repo reproducible).
2. **Fix-then-apply** (SLA monitoring): copy `20260111600001` → new dated migration; replace `sp.full_name`→`u.full_name`, `sp.full_name_ar`→`u.name_ar` with `LEFT JOIN users u ON u.id = sp.user_id` in all 3 spots (lines ~191-213 view, ~382-407 + ~442 functions); keep `CREATE TABLE IF NOT EXISTS sla_escalations` (already live, harmless); apply via MCP; verify 4 RPCs callable.
3. **Fix-then-apply** (event_details): new migration creating the view in the 035 shape + organizer/country columns sourced via `event_attendees`→`dossiers` joins (or NULL placeholders if EventsPage doesn't read them); GRANT SELECT to authenticated.
4. **Fix-then-apply** (pending_role_approvals): new migration = `approval_status` enum + table + indexes (from `20251011214943`) + sane RLS; OMIT `apply_admin_role_approval` trigger (depends on missing `user_sessions`, mutates `auth.users.role` — Phase 61 decision).
5. **Author-new** (position_delegations, word_assistant_logs): minimal tables matching edge-fn shapes + RLS (owner-scoped).
6. **Supersede dead 009**: do NOT delete; add a header comment to `009_data_library.sql` marking it superseded-by-live (never-applied), or move to a `superseded/` subfolder — keep git history. (Local-only migrations dir is not replayed against staging; the marker prevents future agents from "fixing" the drift backwards.)

### Types regeneration
- After ALL migrations applied: MCP `generate_typescript_types` → write to `frontend/src/types/database.types.ts`, `backend/src/types/database.types.ts`, and `backend/backend/src/types/database.types.ts` (doubled-path copy EXISTS in repo — keep byte-identical or investigate whether it's dead; Phase 54 precedent kept copies byte-identical).
- Build + typecheck both workspaces after swap; `as`-casts mean drift compiles, so run `pnpm --filter intake-frontend build` AND `pnpm --filter intake-frontend exec tsc --noEmit` (or repo type-check script).

### CI smoke test
- Script (Node, `scripts/` dir) parsing `supabase/functions/**/index.ts` for `.from('X')` / `.rpc('Y')` string literals; assert each X ∈ Tables|Views keys and Y ∈ Functions keys of `frontend/src/types/database.types.ts` (parse with regex or ts-morph — regex on `X: {` inside `Tables:`/`Functions:` blocks is sufficient and dependency-free).
- Known-failure allowlist file for legitimately-dynamic names; wire into CI workflow as a job step (repo already has .github/workflows; add to an existing lint/typecheck job to avoid new required-context churn on protected main).
- Expectation: after P1 lands, the allowlist should be EMPTY or document each entry with a backlog ref.

## Validation Architecture

| Requirement | Validation | How |
| --- | --- | --- |
| Live objects captured to migrations | Re-run object-existence SQL: every P1 object returns a row in BOTH live catalog AND repo grep | `mcp execute_sql` + grep |
| SLA RPCs live | `SELECT * FROM get_sla_dashboard_overview(…)` smoke-call returns rows/empty (not 42883/42703) | execute_sql |
| event_details live | `SELECT * FROM event_details LIMIT 1` succeeds; EventsPage loads without 404/400 | execute_sql + dev server |
| 3 tables live + typed | `information_schema.tables` rows + names present in regenerated database.types.ts | execute_sql + grep |
| Types in sync | regenerate twice → identical output; frontend+backend builds green | MCP + pnpm build |
| Smoke test works | seeded fake `.rpc('nonexistent_fn')` in a scratch fixture makes the script exit non-zero; real tree exits 0 | run script |
| escalations-report fixed | edge fn SQL references only live columns (unit via staff_profiles.unit_id; name_en/name_ar; users.full_name) | grep + optional invoke |

## Open decisions for planner

1. event_details organizer/country columns: dossier-join vs NULL placeholders — decide after reading which fields EventsPage actually renders.
2. `009_data_library.sql` supersession mechanism: header comment vs subfolder move (recommend header comment — lowest blast radius).
3. escalations-report is an EDGE FUNCTION fix (TypeScript, not SQL) — it must be redeployed via Supabase CLI/MCP after edit, or the fix is inert (handoff rule 4).
