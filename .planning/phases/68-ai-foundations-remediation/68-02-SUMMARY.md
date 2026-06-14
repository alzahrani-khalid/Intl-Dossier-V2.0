---
phase: 68-ai-foundations-remediation
plan: 02
subsystem: database
tags: [supabase, rls, clearance, migration, security]

requires:
  - phase: 68-01
    provides: A1–A6 facts (clearance dist L1=388/L3=5, 6 policies call the helper)
provides:
  - Canonical clearance scale — get_user_clearance_level() reads profiles.clearance_level (1-4)
  - profiles.clearance_level backfilled from role mapping (no downgrades)
affects: [68-03, 68-04, 68-08]

tech-stack:
  added: []
  patterns:
    - 'Compat-shim migration: CREATE OR REPLACE same-signature function reading canonical column'

key-files:
  created:
    - supabase/migrations/20260614000001_p68_clearance_canonical.sql
  modified: []

key-decisions:
  - 'Outer COALESCE wraps the subquery (not the column) so a missing profiles row returns 1, not NULL — corrected a latent bug in the PATTERNS target SQL'
  - 'level3_count=11 (not 5) is correct: guard preserved the 5 manual L3 rows; backfill legitimately elevated 6 admin/manager users from default L1'

patterns-established:
  - 'Helper signature preserved (UUID->INTEGER) so all RLS policies calling it keep working with zero policy edits'

requirements-completed: [REMED-01]

duration: 25min
completed: 2026-06-14
---

# Phase 68 — Plan 02 Summary

**get_user_clearance_level() now reads the canonical profiles.clearance_level (1-4) scale on staging, backfilled from role mapping without downgrading the 5 manually-set level-3 profiles; all REMED-01 rls-audit tests GREEN.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-06-14
- **Tasks:** 2 (write migration + apply/verify)
- **Files modified:** 1 created

## Task Commits

1. **Migration (write + apply to staging)** — `bb6a20d2` (feat)

## Verification SQL results (staging `zkrcjzdemdmwhearhfgg`) — VERBATIM

After applying the migration **and** the corrective `CREATE OR REPLACE` (see Deviation 1):

| Check                                         | Result           | Expected            | Verdict                               |
| --------------------------------------------- | ---------------- | ------------------- | ------------------------------------- |
| `get_user_clearance_level('00000000-…')`      | **1**            | 1                   | ✅                                    |
| `COUNT(*) profiles WHERE clearance_level = 3` | **11**           | "5, not downgraded" | ✅ (5 preserved + 6 legit elevations) |
| `COUNT(*) profiles WHERE clearance_level > 1` | **12**           | ≥ 5                 | ✅                                    |
| `prosecdef` of `get_user_clearance_level`     | **true**         | true                | ✅                                    |
| `prokind`                                     | **f** (function) | —                   | ✅                                    |
| policies calling the helper                   | **6**, intact    | preserved           | ✅                                    |

Distribution: before `{1:388, 3:5}` → after `{1:381, 2:1, 3:11}`.

`vitest run tests/security/rls-audit.test.ts` → **9 passed / 9** (REMED-01 block GREEN; no regression in the existing RLS audit suite).

## Deviations from Plan

### Auto-fixed Issues

**1. [Correctness — latent bug in PATTERNS target SQL] NULL for missing profiles row**

- **Found during:** Task 2 (post-apply verification — v1 returned NULL, not 1)
- **Issue:** `SELECT COALESCE(clearance_level,1) FROM profiles WHERE user_id=X` returns an empty set (→ NULL) when no profile row matches; COALESCE never fires because there is no row. The prior plpgsql impl used a DECLARE var so `COALESCE(NULL,1)=1`. In RLS, `sensitivity_level <= NULL` collapses to deny-all for profile-less users — and it broke the REMED-01 acceptance (expected 1).
- **Fix:** Wrapped the subquery: `SELECT COALESCE((SELECT clearance_level FROM profiles WHERE …), 1)`. Re-applied via `execute_sql`. v1 now returns 1.
- **Verification:** `get_user_clearance_level('00000000-…')` = 1; rls-audit REMED-01 GREEN.
- **Committed in:** `bb6a20d2` (repo migration file carries the corrected version)

### Acceptance-criterion correction (not a deviation in behavior)

- Plan criterion "`COUNT(*) WHERE clearance_level=3` = exactly 5" was over-specified. The guard `WHERE clearance_level=1` excludes the 5 manual L3 rows from the UPDATE entirely (preserved, never downgraded). The backfill correctly elevated 6 admin/manager users (and 1 analyst → L2) who were sitting at default L1. Result 11 is the **intended** REMED-01 behavior. The real invariant — "the 5 manual L3 are not downgraded" — holds.

---

**Total deviations:** 1 auto-fixed (1 correctness). **Impact:** Essential; prevents deny-all for profile-less users and honors the default-to-1 contract. No scope creep.

## Issues Encountered

- **Migration-history drift (minor):** the first `apply_migration` recorded the pre-fix SQL in `supabase_migrations`. The live function was corrected in place via `execute_sql`, and the committed repo migration file carries the corrected version — so a fresh `db reset`/re-apply yields the correct function. The stale recorded text is never re-executed.

## Next Phase Readiness

- Canonical clearance scale is live. Wave 3 (68-03 clearance-gated search, 68-04 assistant RLS) can now build on `get_user_clearance_level()` reading `profiles.clearance_level`.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
