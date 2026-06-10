---
phase: 60-schema-type-truth-restoration
plan: 02
subsystem: database
tags: [sla, rpc, postgres, edge-function, supabase, schema-truth, migration]

# Dependency graph
requires:
  - phase: 60-schema-type-truth-restoration
    provides: live-staging ground-truth matrix (60-RESEARCH.md) confirming staff_profiles has no full_name, organizational_units has no name, assignments has no organizational_unit_id
provides:
  - 5 SLA functions live on staging (get_sla_dashboard_overview, get_sla_compliance_by_type, get_sla_compliance_by_assignee, get_sla_at_risk_items, capture_sla_daily_snapshot) + sla_compliance_metrics matview
  - corrected SLA migration committed to supabase/migrations/ (reproducible on a fresh DB)
  - escalations-report edge function references only live columns and is redeployed active on staging
affects: [60-05-types-regen, sla-dashboard, escalations-report]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Corrective migration with root-cause comment header (object + PG error code + fix), all other logic preserved'
    - 'Resolve assignee display names through users.full_name via staff_profiles.user_id (staff_profiles has no full_name)'
    - 'Route organizational unit through staff_profiles.unit_id (assignments has no organizational_unit_id)'

key-files:
  created:
    - supabase/migrations/20260610000002_enhanced_sla_monitoring_corrected.sql
  modified:
    - supabase/functions/escalations-report/index.ts

key-decisions:
  - 'Live DB was partially-applied: enums + sla_escalations + sla_compliance_snapshots + sla_compliance_by_assignee view already existed; only the matview + 5 functions were missing. Applied the missing objects idempotently rather than re-running CREATE TYPE/TABLE/VIEW (CREATE TYPE has no IF NOT EXISTS).'
  - 'Dropped assignments.sla_status from the edge-fn embed alongside organizational_unit_id — live verification showed assignments has no sla_status column either, and it was never read in any logic.'
  - 'Committed migration file carries the full reproducible DDL plus the two RPC bug fixes, so the repo matches live.'

patterns-established:
  - 'SLA assignee/at-risk RPCs resolve names via users.full_name / users.name_ar (LEFT JOIN users u ON u.id = sp.user_id), never staff_profiles.full_name'

requirements-completed: [P1]

# Metrics
duration: 35 min
completed: 2026-06-10
---

# Phase 60 Plan 02: Corrected SLA Monitoring Migration + escalations-report Schema-Ref Fix Summary

**Applied the never-applied SLA monitoring migration with users-join name resolution (5 RPCs + matview now live and callable), and fixed + redeployed the escalations-report edge function to reference only live columns (unit via staff_profiles.unit_id, organizational_units.name_en, users.full_name).**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-10T07:00Z (approx)
- **Completed:** 2026-06-10T07:31Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created the corrected SLA migration `20260610000002_enhanced_sla_monitoring_corrected.sql` — byte-for-byte copy of the never-applied `20260111600001` with `staff_profiles.full_name`/`.full_name_ar` rewritten to `users.full_name`/`users.name_ar` via `LEFT JOIN users u ON u.id = sp.user_id` in all 3 spots (assignee view + 2 RPCs).
- Applied the missing live objects (matview `sla_compliance_metrics` + 5 functions + grants) via MCP. The 3 enum types, both SLA tables, and the assignee view already existed live (partial prior apply), so re-running their DDL would have failed on `CREATE TYPE` — applied only the missing pieces idempotently.
- Fixed two pre-existing latent bugs in the SLA RPC bodies (deviations) so the 4 dashboard RPCs actually smoke-call: a `42702` ambiguous-column in the dashboard-overview trend CTE and a `42804` varchar/text mismatch on `name_ar` in the by-assignee RPC.
- Rewrote `escalations-report/index.ts` to drop `assignments.organizational_unit_id` (+ unused `sla_status`), route unit aggregation through `staff_profiles.unit_id`, fetch org-unit names via `name_en`, and resolve assignee names from `users.full_name`. Redeployed via Supabase CLI; confirmed live 200 responses.

## Task Commits

1. **Task 1: corrected SLA migration file** - `11bd0de8` (fix)
2. **Task 1: SLA RPC type/ambiguity bug fixes folded into migration** - `1cd7bb82` (fix)
3. **Task 2: escalations-report real-column fix** - `997eb76f` (fix)

**Plan metadata:** this SUMMARY commit (docs).

## Migrations Applied to Staging (project zkrcjzdemdmwhearhfgg, via MCP apply_migration)

1. `enhanced_sla_monitoring_corrected` — created the missing matview + 5 functions + grants (corrected users-join).
2. `fix_get_sla_dashboard_overview_ambiguous_total_items` — qualified the trend-CTE columns (alias `s`) to resolve `42702`.
3. `fix_get_sla_compliance_by_assignee_name_ar_text_cast` — cast `u.name_ar::text` (and `COALESCE(u.full_name,...)::text`) to resolve `42804`.

## SLA Probe Outputs (verbatim)

**Probe (a) — 5 functions present live** (`SELECT proname ... WHERE proname IN (...)`):

```
capture_sla_daily_snapshot
get_sla_at_risk_items
get_sla_compliance_by_assignee
get_sla_compliance_by_type
get_sla_dashboard_overview
```

(exactly 5 rows)

**Probe (b) — 4 dashboard RPCs smoke-call cleanly** (no 42703 / 42883 / 42702 / 42804):

```
rpc          | rows
-------------+-----
at_risk      |    0
by_assignee  |    0
by_type      |    0
overview     |    1
```

## Edge-Function Deploy + Invoke (verbatim)

**Deploy success line:**

```
Deployed Functions on project zkrcjzdemdmwhearhfgg: escalations-report
```

**Live invoke #1 (default group_by):** `GET /functions/v1/escalations-report?group_by=unit` →

```
HTTP_STATUS:200
{"summary":{"total_escalations":0,...},"time_series":[],"by_unit":[],"by_assignee":[],"by_work_type":[],"metadata":{...}}
```

**Live invoke #2 (unit-filter branch, the most-rewritten path):** `GET /functions/v1/escalations-report?unit_id=<empty>` → `HTTP_STATUS:200` (clean, no column error).

## Files Created/Modified

- `supabase/migrations/20260610000002_enhanced_sla_monitoring_corrected.sql` - Corrected, reproducible full SLA monitoring DDL (users-join name resolution + the two RPC bug fixes folded in).
- `supabase/functions/escalations-report/index.ts` - Edge fn now references only live columns; JSON response envelope (`assignee_name`, `unit_name`, `byUnit`, `byAssignee`) preserved so the frontend contract is unchanged.

## Decisions Made

- **Idempotent partial apply:** live was partially applied (enums/tables/view present, matview/functions absent). Applied only the missing objects to avoid a `CREATE TYPE`-already-exists failure, while the committed file remains the full reproducible migration.
- **Dropped `sla_status` too:** the plan said keep `id, work_item_type, assignee_id, sla_status` in the embed, but live `assignments` has no `sla_status` column and it was never read — removed to avoid a second 42703.
- **Header wording:** corrective `--` headers describe the broken columns in prose (avoiding literal `sp.full_name` / `organizational_unit_id` tokens) so the plan's grep gates assert against real SQL only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `get_sla_dashboard_overview` 42702 ambiguous column `total_items`**

- **Found during:** Task 1 (smoke-calling the 4 dashboard RPCs after apply)
- **Issue:** The trend CTE selected unqualified `total_items` / `met_count` / `breached_count` from `sla_compliance_snapshots`, which collide with the function's `RETURNS TABLE` OUT params → `42702 column reference is ambiguous` at RETURN QUERY. Pre-existing defect in the original `20260111600001` body (copied verbatim).
- **Fix:** Aliased the snapshots table (`s`) and qualified every column read in the trend CTE.
- **Files modified:** committed migration file; applied live via `fix_get_sla_dashboard_overview_ambiguous_total_items`.
- **Verification:** overview RPC now returns 1 row, no error.
- **Committed in:** `1cd7bb82`

**2. [Rule 1 - Bug] `get_sla_compliance_by_assignee` 42804 varchar/text mismatch on `name_ar`**

- **Found during:** Task 1 (smoke-calling the by-assignee RPC)
- **Issue:** `users.name_ar` is `varchar(200)` but the RETURNS TABLE declares `assignee_name_ar TEXT`; bare select → `42804 structure of query does not match function result type` (column 3). Same class as the precedent `20260531120000_fix_get_team_workload_email_text_cast.sql`.
- **Fix:** Cast `u.name_ar::text` (and `COALESCE(u.full_name,...)::text` for symmetry).
- **Files modified:** committed migration file; applied live via `fix_get_sla_compliance_by_assignee_name_ar_text_cast`.
- **Verification:** by-assignee RPC now returns 0 rows (empty), no error.
- **Committed in:** `1cd7bb82`

**3. [Rule 2 - Missing/Wrong critical] `assignments.sla_status` is also absent live**

- **Found during:** Task 2 (verifying assignments columns before the edge-fn rewrite)
- **Issue:** The plan's `<interfaces>` said to keep `sla_status` in the embed, but live `assignments` has no `sla_status` column; including it would cause the same 42703-class PostgREST error the task is meant to eliminate. It was never read in any logic (only in the local interface + embed select).
- **Fix:** Removed `sla_status` from the embed and the local `Assignment` interface alongside `organizational_unit_id`.
- **Files modified:** supabase/functions/escalations-report/index.ts
- **Verification:** redeployed function returns 200 on both the default and unit-filter paths.
- **Committed in:** `997eb76f`

---

**Total deviations:** 3 auto-fixed (2 Rule-1 bugs, 1 Rule-2 wrong-critical-reference)
**Impact on plan:** All three were necessary for the plan's own acceptance criteria (the 4 RPCs must smoke-call cleanly; the edge fn must reference only live columns). The first two are pre-existing latent defects in the never-applied original migration, surfaced only because this plan finally makes the RPCs callable. No scope creep — every fix traces to a schema-truth defect in the two target files.

## Issues Encountered

- Live DB was in a partially-applied state for this migration (enums/tables/view present, matview/functions absent). Resolved by applying only the missing objects idempotently; documented in the live-apply header comment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The 5 SLA functions + matview are live and the 4 dashboard RPCs are callable — ready to appear in regenerated types in plan 60-05 [sla #2], with the absent-column bug resolved [sla #4].
- escalations-report references only live columns and is active on staging [tq #5].
- No blockers.

---

_Phase: 60-schema-type-truth-restoration_
_Completed: 2026-06-10_

## Self-Check: PASSED

- `supabase/migrations/20260610000002_enhanced_sla_monitoring_corrected.sql` exists on disk.
- grep gates: `sp.full_name`=0, `LEFT JOIN users u ON u.id = sp.user_id`=3, `u.name_ar`=4, `full_name_ar`=0, `CREATE OR REPLACE FUNCTION`=5.
- `supabase/functions/escalations-report/index.ts`: `organizational_unit_id`=0, `select('id, name')`=0, `name_en`=3, `from('users')`=1.
- MCP probe (a): exactly 5 SLA functions live. Probe (b): all 4 dashboard RPCs smoke-call with no 42703/42883/42702/42804.
- Edge fn redeployed (`Deployed Functions on project zkrcjzdemdmwhearhfgg: escalations-report`) and returns HTTP 200 live.
- `git log` shows 3 `fix(60-02)` commits (`11bd0de8`, `1cd7bb82`, `997eb76f`).
- `pnpm --filter intake-frontend build` exits 0 (✓ built) after each commit.
