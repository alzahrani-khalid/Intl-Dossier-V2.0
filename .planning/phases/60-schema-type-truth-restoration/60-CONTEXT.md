# Phase 60: Schema & Type Truth Restoration - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning
**Source:** PRD Express Path (/tmp/intl-dossier-backlog-handoff-2026-06-10.md + reports/escalated-backlog-master-2026-06-10.md §P1)

<domain>
## Phase Boundary

Restore agreement between three sources of schema truth that have drifted apart:

1. **Live staging database** (Supabase project `zkrcjzdemdmwhearhfgg`) — the operational truth
2. **Committed migrations** (`supabase/migrations/`) — the reproducible truth
3. **Generated types** (`frontend/src/types/database.types.ts`) — the compile-time truth

Five inspection rounds (2026-06-08..10) found objects that exist in only one or two
of the three: views/RPCs the UI reads that aren't in repo migrations, migration-only
RPCs absent from generated types (likely never applied), tables absent from generated
types, and RPC SQL referencing columns that don't exist. This phase closes every
identified gap and adds a CI smoke test so the drift can't silently recur.

**Out of scope:** All functional/UX fixes (P3-P8 backlog phases), the P2 security
items (Phase 61), edge-function behavioral changes beyond schema-reference fixes.

</domain>

<decisions>
## Implementation Decisions

### Types regeneration

- Regenerate `frontend/src/types/database.types.ts` from staging via Supabase MCP `generate_typescript_types` (project_id `zkrcjzdemdmwhearhfgg`)
- If backend/shared workspaces carry copies, they must end up byte-identical (precedent: Phase 54)

### Missing canonical SQL → forward migrations

- Unified work layer: `unified_work_items` view + `get_unified_work_items`, `get_user_work_summary`, `get_user_productivity_metrics` RPCs [my-work #3]
- 4 SLA dashboard RPCs (`get_sla_dashboard_overview` et al.) — currently only in `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql`, absent from generated types [sla #2]
- `event_details` view [events #4]
- Capture live definitions with `pg_get_viewdef` / `pg_get_functiondef` when the live object is the truth; commit as dated forward migrations

### Dual data-library migrations

- `009_create_data_library_items.sql` vs `009_data_library.sql` conflict: **query staging FIRST** to decide which schema is live, then mark the loser superseded [data-library #1]

### Ungenerated tables

- `pending_role_approvals`, `position_delegations`, `word_assistant_logs`: determine live-vs-repo state, then generate-or-migrate so table, migration, and types all agree [approvals #6, wa #4]

### RPC SQL referencing absent columns

- `staff_profiles.full_name` used by SLA assignee/at-risk RPCs [sla #4]
- escalations-report referencing `assignments.organizational_unit_id`, `organizational_units.name`, `staff_profiles.full_name` [tq #5]
- Fix the SQL to reference real columns (verify live schema first); apply via MCP migration

### CI smoke test

- Every RPC (`.rpc('name')`) and table (`.from('name')`) referenced by an edge function must exist in generated `database.types.ts`; fails the build when an unknown name appears

### Process rules (locked, from handoff)

- Migrations applied via Supabase MCP `apply_migration` ONLY (also commit the SQL file to `supabase/migrations/`)
- VERIFY every DB/RPC claim against staging SQL before acting — round-1 WG claim was a false positive
- After every commit run `pnpm --filter intake-frontend build` directly (pre-commit hook does NOT block on failure)
- `pnpm exec` not `npx`; no `timeout` command on this Mac
- Commit convention: `fix(60-xx): ...` / `feat(60-xx): ...`, no AI attribution
- Do NOT re-fix bucket-A items (commits `68552968..33671c41`)

### Claude's Discretion

- Migration file naming/timestamps
- Smoke-test implementation (script language, CI wiring location)
- Whether a drifted object is fixed by applying repo SQL to staging or capturing live SQL into the repo — decided per-object by live verification

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backlog & findings

- `reports/escalated-backlog-master-2026-06-10.md` — P1 phase definition + rounds 3-5 escalations
- `reports/escalated-backlog-master-2026-06-09.md` — rounds 1-2 detail + Appendix A do-NOT-re-attempt false positives
- `reports/my-work-workflow-inspection-2026-06-10.md` — unified work view/RPC findings (#3)
- `reports/sla-monitoring-workflow-inspection-2026-06-10.md` — SLA RPC findings (#2, #4)
- `reports/events-workflow-inspection-2026-06-09.md` — event_details findings (#4)
- `reports/data-library-documents-workflow-inspection-2026-06-09.md` — dual-009 findings (#1-3)
- `reports/task-queue-escalations-workflow-inspection-2026-06-09.md` — escalations-report findings (#5)
- `reports/approvals-workflow-inspection-2026-06-10.md` — ungenerated tables findings (#6)

### Schema sources

- `frontend/src/types/database.types.ts` — current generated types (stale)
- `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql` — the 4 SLA dashboard RPCs
- `supabase/migrations/` — full migration history

</canonical_refs>

<specifics>
## Specific Ideas

- Phase 54 precedent: regenerated TS types committed byte-identical across workspaces
- The smoke test should parse `supabase/functions/**/index.ts` for `.from('x')` / `.rpc('y')` string literals and assert membership in the generated types' `Tables`/`Functions` keys

</specifics>

<deferred>
## Deferred Ideas

- Typing the Supabase client end-to-end (meta-pattern #4 in the master report) — bigger refactor, separate phase
- Contract tests per edge function (meta-pattern #2) — P3+ scope

</deferred>

---

_Phase: 60-schema-type-truth-restoration_
_Context gathered: 2026-06-10 via PRD Express Path_
