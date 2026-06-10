---
phase: 60-schema-type-truth-restoration
plan: 01
subsystem: database
tags: [postgres, supabase, migration, views, materialized-view, rpc, my-work, capture-from-live]

requires:
  - phase: 60-schema-type-truth-restoration
    provides: live-staging-verified ground-truth matrix (RESEARCH.md rows 1-6)
provides:
  - Forward migration reproducing the live unified-work-item stack (2 views + 1 matview + 3 RPCs + refresh helper + unique index)
  - supabase/migrations/20260610000001_capture_unified_work_stack.sql recorded in staging migration history
affects: [60-02 sla-monitoring, 60 types-regen, my-work, dashboard]

tech-stack:
  added: []
  patterns:
    - 'Capture-from-live: pg_get_viewdef / pg_matviews.definition / pg_get_functiondef dumped verbatim into an idempotent CREATE OR REPLACE migration'

key-files:
  created:
    - supabase/migrations/20260610000001_capture_unified_work_stack.sql
  modified: []

key-decisions:
  - "Reproduced the three get_* reader RPCs VERBATIM from live as plain LANGUAGE plpgsql (no SECURITY DEFINER, no SET search_path) — live truth overrode the plan's assumption that they carried definer/search_path lines."
  - 'Preserved refresh_user_productivity_metrics as SECURITY DEFINER (it genuinely is, live).'
  - 'Added authenticated-only GRANTs per plan; did NOT add anon grants and did NOT revoke the pre-existing live default grants (live drift, out of scope to tighten here).'

patterns-established:
  - 'Pattern 1: dependency-first ordering in capture migrations — main view -> dependent view -> matview -> unique index -> reader functions -> refresh helper'

requirements-completed: [P1]

duration: 18 min
completed: 2026-06-10
---

# Phase 60 Plan 01: Capture Unified Work Stack Summary

**Committed forward migration recreating the live my-work stack — `unified_work_items` + `user_work_summary` views, `user_productivity_metrics` matview (+ unique index + refresh helper), and the `get_unified_work_items` / `get_user_work_summary` / `get_user_productivity_metrics` RPCs — captured verbatim from staging and applied idempotently.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-10T07:00:00Z (approx)
- **Completed:** 2026-06-10T07:18:00Z (approx)
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments

- Dumped the canonical live DDL for all 6 stack objects + the matview UNIQUE index + the `refresh_user_productivity_metrics` helper via MCP `execute_sql` (pg_get_viewdef / pg_matviews.definition / pg_get_functiondef) — no hand-written definitions.
- Assembled them into one dated, dependency-ordered, idempotent migration wrapped in a single BEGIN/COMMIT.
- Applied to staging via MCP `apply_migration` (idempotent no-op; recorded in migration history as `capture_unified_work_stack`, version `20260610071608`).
- Verified all 6 objects live-callable after apply via the four required probes (3 RPCs / 2 views / 1 matview / clean smoke-calls).

## Task Commits

1. **Task 1: Dump live unified-work-stack definitions** — captured in-conversation via MCP execute_sql (no commit; capture feeds Task 2 per the plan).
2. **Task 2: Assemble, commit, apply the capture migration** — `d645c767` (feat) — created `supabase/migrations/20260610000001_capture_unified_work_stack.sql`, applied via MCP.

**Plan metadata:** this SUMMARY commit (docs).

## Files Created/Modified

- `supabase/migrations/20260610000001_capture_unified_work_stack.sql` (383 lines) — forward migration recreating `unified_work_items` (view), `user_work_summary` (view), `user_productivity_metrics` (matview) + `idx_user_productivity_metrics_user_id` UNIQUE index, `get_unified_work_items` / `get_user_work_summary` / `get_user_productivity_metrics` RPCs, `refresh_user_productivity_metrics` helper, and authenticated-only GRANTs.

## Captured Definition Probes (Task 1, verbatim source)

- `pg_get_viewdef('public.unified_work_items')` — 3-arm UNION ALL over `aa_commitments` (owner_user_id), `tasks` (assignee_id, is_deleted=false), `intake_tickets` (assigned_to) with computed `tracking_type` / `is_overdue` / `days_until_due` / `metadata`. Non-empty.
- `pg_get_viewdef('public.user_work_summary')` — per-user FILTER counts over `unified_work_items` GROUP BY assigned_to. Non-empty.
- `pg_matviews.definition('user_productivity_metrics')` — completed_items CTE + recent/all-time/source CTEs FULL JOINed; 30d & all-time completion metrics. Non-empty.
- `pg_indexes(user_productivity_metrics)` — one row: `CREATE UNIQUE INDEX idx_user_productivity_metrics_user_id ... (user_id)` (the CONCURRENT-refresh prerequisite).
- `pg_get_functiondef` x3 — all three `get_*` RPCs returned non-empty; signatures match generated types (`get_unified_work_items` 13 optional args; `get_user_work_summary` / `get_user_productivity_metrics` `p_user_id uuid DEFAULT auth.uid()`). **All three are plain `LANGUAGE plpgsql`, NOT SECURITY DEFINER, NO SET search_path.**
- Refresh-helper probe — found `refresh_user_productivity_metrics()` (SECURITY DEFINER, `REFRESH MATERIALIZED VIEW CONCURRENTLY`), captured too.
- No object returned 42P01 — all six confirmed live.

## Post-Apply Probe Outputs (Task 2, verbatim)

Migration applied: `apply_migration` returned `{"success":true}`.

1. **RPC presence** — `SELECT proname ... IN (get_unified_work_items, get_user_work_summary, get_user_productivity_metrics) ORDER BY proname`:
   `[{"proname":"get_unified_work_items"},{"proname":"get_user_productivity_metrics"},{"proname":"get_user_work_summary"}]` → **3 rows ✓**
2. **View presence** — `SELECT viewname ... IN (unified_work_items, user_work_summary)`:
   `[{"viewname":"unified_work_items"},{"viewname":"user_work_summary"}]` → **2 rows ✓**
3. **Matview presence** — `SELECT matviewname ... = 'user_productivity_metrics'`:
   `[{"matviewname":"user_productivity_metrics"}]` → **1 row ✓**
4. **RPC smoke-calls (NULL-safe args)** — counts from `get_user_work_summary(NULL)`, `get_user_productivity_metrics(NULL)`, `get_unified_work_items(NULL,...,1)`:
   `[{"rpc":"work_summary","n":0},{"rpc":"productivity","n":0},{"rpc":"unified","n":0}]` → all three returned empty cleanly, **NO 42883 / 42703 / 42P01 ✓** (n=0 because NULL user_id matches no rows — the calls executed successfully).

Migration-history confirmation — `supabase_migrations.schema_migrations`:
`[{"version":"20260610071608","name":"capture_unified_work_stack"}]` → **recorded ✓**

## Decisions Made

- **get\_\* RPCs are NOT definer functions live.** The plan's action and an acceptance criterion assumed `pg_get_functiondef` would yield `SECURITY DEFINER` + `SET search_path` lines to preserve. Live truth (process rule: verify every DB claim against staging) shows the three reader RPCs are plain `LANGUAGE plpgsql`. Capture-from-live mandates reproducing what actually runs, so they were committed without definer/search_path. The refresh helper IS definer and that line was preserved.
- **GRANTs:** added authenticated-only `GRANT SELECT` (3 objects) + `GRANT EXECUTE` (4 functions) per the plan's "if the dump did not include grants" branch (pg_get_functiondef carries no GRANTs). Did not add anon (threat T-60-01-I) and did not revoke the broader pre-existing default grants live (that drift is out of this plan's scope).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / wrong premise] get\_\* RPC bodies have no SET search_path line**

- **Found during:** Task 1 (dumping live function definitions)
- **Issue:** The plan instructed "each captured RPC body still carries SECURITY DEFINER + SET search*path — keep those lines, do NOT strip them," and made "Each captured RPC body still contains a SET search_path line" an acceptance criterion. Live `pg_get_functiondef` for the three `get*\*`readers shows plain`LANGUAGE plpgsql` with neither definer nor search_path. Honoring the plan literally would have meant either fabricating those lines (violating capture-from-live / the "do NOT hand-write any definition" rule) or failing a criterion that contradicts live truth.
- **Fix:** Reproduced the three reader RPCs verbatim as they run live (no definer, no search_path). Preserved `SECURITY DEFINER` on `refresh_user_productivity_metrics` because it genuinely carries it.
- **Files modified:** supabase/migrations/20260610000001_capture_unified_work_stack.sql
- **Verification:** Post-apply smoke-calls succeeded (probe 4); apply was a no-op (idempotent CREATE OR REPLACE against live = identical definitions).
- **Committed in:** d645c767 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 wrong-premise correction).
**Impact on plan:** The "SET search_path present" acceptance criterion is intentionally not met because live reality contradicts the plan's premise; all other acceptance criteria pass. No security regression — the migration reproduces live privileges exactly (definer only where live has it). No scope creep.

## Issues Encountered

None. Capture, assemble, commit, build, apply, and all four probes ran cleanly.

## Authentication Gates

None — MCP access to staging was already authenticated.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The unified-work stack is now reproducible from a committed migration; safe to proceed to the remaining Phase 60 plans (SLA monitoring fix-then-apply, event_details, the three authored tables, types regen, CI smoke test).
- Note for the eventual types-regen plan: these objects were already in generated types, so this plan does not change `database.types.ts`.
- Backlog note (unchanged, out of P1 scope): live carries broader-than-authenticated default grants on these objects (anon CRUD on the views); not tightened here.

---

_Phase: 60-schema-type-truth-restoration_
_Completed: 2026-06-10_

## Self-Check: PASSED

- key-files.created exists on disk: `supabase/migrations/20260610000001_capture_unified_work_stack.sql` ✓
- Commit present: `d645c767 feat(60-01): capture unified work stack as forward migration from live staging` ✓
- File-content acceptance gates: 1 BEGIN / 1 COMMIT, `CREATE OR REPLACE VIEW public.unified_work_items`=1, `CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_productivity_metrics`=1, non-comment get\_\* function gate=3 ✓
- Apply + 4 probes: success / 3 RPCs / 2 views / 1 matview / clean smoke-calls ✓
- Migration recorded in staging history (capture_unified_work_stack) ✓
- `pnpm --filter intake-frontend build` → `✓ built` ✓
- Documented deviation: get\_\* RPCs are not definer/search_path live (criterion contradicts live truth) ✓
