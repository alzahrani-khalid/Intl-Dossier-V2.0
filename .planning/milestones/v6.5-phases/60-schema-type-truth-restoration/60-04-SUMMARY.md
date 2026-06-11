---
phase: 60-schema-type-truth-restoration
plan: 04
subsystem: database
tags: [supabase, migrations, rls, postgres, approvals, delegations, word-assistant]

# Dependency graph
requires:
  - phase: 60-schema-type-truth-restoration
    provides: live-staging-verified ground truth (60-RESEARCH.md) for the 3 missing tables + edge-fn write shapes
provides:
  - pending_role_approvals table live on staging (approval_status enum + indexes + safe updated_at trigger + expire helper + owner-scoped RLS; admin-role-apply trigger omitted)
  - position_delegations table live on staging (matches positions-delegate edge-fn insert shape + owner-scoped RLS)
  - word_assistant_logs table live on staging (matches word-assistant edge-fn insert shape + owner-scoped RLS)
affects: [60-05 type-regeneration, 61-role-source-unification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Corrective-migration comment header naming the broken object + PG error code + omitted-by-design objects'
    - 'Owner-scoped RLS (SELECT/INSERT TO authenticated, USING/WITH CHECK col = auth.uid())'
    - 'REVOKE ALL ... FROM anon after CREATE TABLE to neutralise the pg_default_acl ALL-grant on this staging DB (60-03 finding)'

key-files:
  created:
    - supabase/migrations/20260610000004_create_pending_role_approvals.sql
    - supabase/migrations/20260610000005_create_delegation_and_word_assistant_tables.sql
  modified: []

key-decisions:
  - 'Quoted "current_role" identifier — it is a PostgreSQL reserved word (read-only built-in); the unquoted form in source migration 20251011214943 is a second reason that migration could never apply (42601), beyond the missing enum/session-table/trigger deps.'
  - 'Omitted the admin-role-apply function + trigger entirely (mutates auth roles, depends on a missing session table) — deferred to Phase 61 per plan.'
  - 'Kept the positions(id) FK on position_delegations — positions.id verified present live.'
  - 'Added REVOKE ALL FROM anon on all 3 tables (60-03 pg_default_acl finding); verified anon has zero grants post-apply.'

patterns-established:
  - 'Pattern 1: missing-table migrations created from the live-verified edge-fn write shape, RLS-owner-scoped, anon-revoked'
  - 'Pattern 2: guarded enum creation via DO/IF NOT EXISTS pg_type check for safe re-apply'

requirements-completed: [P1]

# Metrics
duration: 18 min
completed: 2026-06-10
---

# Phase 60 Plan 04: Missing-Table Restoration Summary

**Created pending_role_approvals (with guarded approval_status enum, omitting the auth-role-mutating trigger), position_delegations, and word_assistant_logs as owner-scoped RLS tables live on staging, closing the "missing table" drift for approvals #6 and word-assistant #4.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 2
- **Files created:** 2 migrations

## Accomplishments

- `pending_role_approvals` live: `approval_status` enum (guarded), table verbatim from source (both CHECK constraints, `"current_role"` quoted), 3 indexes, the safe `update_approvals_updated_at` trigger, the safe `expire_pending_approvals()` helper, owner-scoped RLS. The `apply_admin_role_approval()` function + `trigger_apply_admin_role` trigger (mutate auth roles, depend on a missing session table) were OMITTED — verified absent live (Phase 61 scope).
- `position_delegations` live: matches the `positions-delegate` edge-fn insert shape (`position_id` FK→positions, `delegator_id`, `delegate_id`, `reason`, `expires_at`, `status` default 'active'), lookup index on `(position_id, delegate_id, status)`, owner-scoped RLS.
- `word_assistant_logs` live: matches the `word-assistant` edge-fn insert shape (`user_id`, `action`, `input_text`, `output_text`, `session_id`), index on `(user_id, created_at)`, owner-scoped RLS.
- All 3 tables RLS-enabled (6 policies total); `anon` has zero privileges on all 3 (pg_default_acl ALL-grant neutralised via REVOKE).

## Task Commits

1. **Task 1: pending_role_approvals migration** - `61a6b706` (feat)
2. **Task 2: position_delegations + word_assistant_logs migration** - `39d319c9` (feat)

Both migrations applied to staging (project `zkrcjzdemdmwhearhfgg`) via Supabase MCP `apply_migration`.

## Files Created/Modified

- `supabase/migrations/20260610000004_create_pending_role_approvals.sql` - guarded approval_status enum + table + indexes + safe updated_at trigger + expire helper + owner-scoped RLS; admin-role-apply trigger omitted.
- `supabase/migrations/20260610000005_create_delegation_and_word_assistant_tables.sql` - position_delegations + word_assistant_logs tables + owner-scoped RLS.

## MCP Probe Results (verbatim)

Pre-apply dependency probe (per process rule "VERIFY every dependency"):

```
approval_status_enum=null (MISSING), user_role_enum=1 (EXISTS),
user_sessions_tbl=null (MISSING), positions_id_col=1 (EXISTS → FK kept),
pra_tbl=null, pd_tbl=null, wal_tbl=null (all 3 targets MISSING)
```

Probe (a) — 3 tables live:

```
[{"detail":"pending_role_approvals"},{"detail":"position_delegations"},{"detail":"word_assistant_logs"}]  (3 rows)
```

Probe (b) — approval_status enum exists:

```
[{"detail":"approval_status"}]  (1 row)
```

Probe (c) — RLS enabled on all three:

```
[{"relname":"pending_role_approvals","relrowsecurity":true},
 {"relname":"position_delegations","relrowsecurity":true},
 {"relname":"word_assistant_logs","relrowsecurity":true}]
```

Probe (d) — policy count per table (6 total ≥ 5):

```
[{"tablename":"pending_role_approvals","policy_count":2},
 {"tablename":"position_delegations","policy_count":2},
 {"tablename":"word_assistant_logs","policy_count":2}]
```

Security probe — anon grants on the three tables (60-03 finding):

```
[]   (anon has NO privileges on any of the 3)
```

Omitted-by-design probe (live):

```
apply_admin_fn_count=0, apply_admin_trigger_count=0,
pra_user_trigger_count=1 (only the safe updated_at trigger), expire_fn_count=1
```

## Decisions Made

- **Reserved-word fix (deviation, see below):** `current_role` is a PostgreSQL reserved word; quoted it as `"current_role"`. The source migration 20251011214943 shipped it unquoted — a second blocker (42601) on top of the missing enum/session-table/trigger deps.
- **Kept positions(id) FK** on `position_delegations` (positions.id verified present live — no FK omission needed).
- **anon REVOKE** applied to all 3 tables per the 60-03 `pg_default_acl` finding; verified zero anon grants post-apply.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Quoted reserved-word column `"current_role"`**

- **Found during:** Task 2 (BLOCKING apply of migration 0004)
- **Issue:** The first MCP apply of migration 0004 failed with `42601: syntax error at or near "current_role"`. `current_role` is a PostgreSQL reserved word (read-only built-in) and cannot be used as a bare column identifier. The plan instructed copying the table "verbatim from the original," but the original (20251011214943) shipped it unquoted, which is precisely why it could never apply.
- **Fix:** Quoted the identifier as `"current_role"` in the column definition and its `COMMENT ON COLUMN`. Documented inline in the migration header.
- **Files modified:** supabase/migrations/20260610000004_create_pending_role_approvals.sql
- **Verification:** Re-applied via MCP → `{"success":true}`; table live with `"current_role"` column.
- **Committed in:** `61a6b706` (Task 1 commit — see note below)

**Commit-history note (process, not a code deviation):** During the reserved-word fix an interim `git commit --amend` folded the Task 1 fix into the wrong (Task 2) commit. This was corrected with a `git reset --soft` back to the 60-03 HEAD (`54768ef9`) and re-committing two clean atomic commits: `61a6b706` (migration 0004 only) and `39d319c9` (migration 0005 only). No code was lost; the two final commits are one-file-each and atomic. The pre-existing unrelated `M frontend/src/routeTree.gen.ts` working-tree change was never staged or committed.

---

**Total deviations:** 1 auto-fixed (1 bug — reserved-word column).
**Impact on plan:** Necessary for the migration to apply at all. No scope change; the table shape is otherwise identical to the source.

## Issues Encountered

- First MCP apply of migration 0004 failed on the unquoted `current_role` reserved word (resolved — see Deviations).
- Interim `git commit --amend` mis-targeted a commit; corrected via soft reset + clean re-commit (see commit-history note).

## Next Phase Readiness

- All three tables are live on staging and ready for TypeScript type regeneration in plan 60-05 (they will appear under `Tables:` in `database.types.ts`, and `approval_status` under `Enums:`).
- The admin-role-apply mechanics (auth-role mutation + session termination) remain deferred to Phase 61 role-source unification — no path in this plan writes auth roles.

## Self-Check: PASSED

- Both migration files exist on disk with the asserted CREATE statements + owner-scoped RLS. ✅
- `git log --grep="60-04"` returns the two task commits (`61a6b706`, `39d319c9`). ✅
- Acceptance criteria re-run: Task 1 greps (apply_admin_role_approval=0, user_sessions=0, UPDATE auth.users=0, guarded enum, 1× ENABLE RLS, auth.uid policies) PASS; Task 2 greps (both CREATE TABLE, all 6+5 columns, 2× ENABLE RLS, 4 auth.uid policies, 2 anon REVOKE) PASS. ✅
- MCP probes (a)-(d) + security probe + omitted-object probe all PASS. ✅
- `pnpm --filter intake-frontend build` → `✓ built` after each commit. ✅

---

_Phase: 60-schema-type-truth-restoration_
_Completed: 2026-06-10_
