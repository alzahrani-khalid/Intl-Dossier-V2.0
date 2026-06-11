---
phase: 56-rls-closure-last-typed-shim-retirement
plan: 01
subsystem: security
tags:
  - rls
  - supabase
  - security
  - test-refactor
requires:
  - phase: 54-intelligence-engine-schema-groundwork
    provides: D-54-04 RLS audit carryover context
provides:
  - RLS audit split between org-scoped sensitive tables and global reference tables
  - public.countries policy reconciliation migration applied to staging
  - RLS-01 requirement wording aligned with globalReferenceTables projection
affects:
  - rls-audit
  - supabase-migrations
  - phase-56
tech-stack:
  added: []
  patterns:
    - Two-tier RLS audit for org-scoped tables and global reference data
    - Policy-only reconciliation migration for staging drift
key-files:
  created:
    - supabase/migrations/20260518000001_countries_rls_reconcile.sql
  modified:
    - tests/security/rls-audit.test.ts
    - .planning/REQUIREMENTS.md
key-decisions:
  - 'D-56-01/D-56-03: countries stays audited via globalReferenceTables instead of the org-scoped sensitiveTables list.'
  - 'D-56-02/D-56-04: staging policy drift is fixed through a committed migration applied via Supabase MCP.'
  - 'CTI drift repair: countries_select_active reads active state through public.dossiers.status because current staging has no public.countries.status column.'
patterns-established:
  - 'Global reference RLS tier: assert authenticated read, write policy presence, and no org_id/organization_id references.'
  - 'Schema-real sensitiveTables: keep explicit manual coverage only for tables that still carry org-scoped policy references; rely on get_tables_with_org_id for complete dynamic coverage.'
requirements-completed:
  - RLS-01
duration: 20 min
completed: 2026-05-18
---

# Phase 56 Plan 01: RLS Closure Summary

**Countries RLS audit closure with a globalReferenceTables tier and staging policy reconciliation for public.countries.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-05-18T10:12:00Z
- **Completed:** 2026-05-18T10:32:51Z
- **Tasks:** 5
- **Files modified:** 3

## Accomplishments

- Split `tests/security/rls-audit.test.ts` into `sensitiveTables` and `globalReferenceTables`, with `countries` asserted in the global reference tier.
- Added and applied `20260518000001_countries_rls_reconcile.sql` to staging project `zkrcjzdemdmwhearhfgg`.
- Verified live `pg_policy` now contains exactly `countries_delete_admin`, `countries_insert_editor`, `countries_select_active`, `countries_select_authenticated`, and `countries_update_editor`.
- Updated RLS-01 wording in `.planning/REQUIREMENTS.md` to match the implemented projection move.

## Task Commits

1. **Task 1: Refactor rls-audit tiers** - `dc1376cb` (`test(56-01)`)
2. **Task 2/3: Migration and MCP apply** - `2d39f110` (`fix(56-01)`)
3. **Task 4: Requirement wording** - `f8f77af6` (`docs(56-01)`)
4. **Task 5: RLS audit verification** - verification-only, no file commit

## Files Created/Modified

- `tests/security/rls-audit.test.ts` - Adds `globalReferenceTables`, asserts countries authenticated read and write policy commands, and keeps schema-real org-scoped manual coverage.
- `supabase/migrations/20260518000001_countries_rls_reconcile.sql` - Recreates the five expected countries policies and drops the drifted `countries_authenticated_read` policy.
- `.planning/REQUIREMENTS.md` - Updates RLS-01 from "removed from sensitiveTables" to "moved from sensitiveTables to globalReferenceTables".

## Decisions Made

- Kept the fix policy-only after staging proved `public.countries.status` no longer exists. The active-country predicate now uses `public.dossiers.status`, matching the current CTI schema without adding forbidden columns.
- Narrowed the manual `sensitiveTables` array to tables that live-probed as org-scoped (`persons`, `intelligence_event`, `intelligence_digest`, `dashboard_digest`). The dynamic `get_tables_with_org_id()` audit still covers the complete org-column surface and passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CTI countries schema lacked `public.countries.status`**

- **Found during:** Task 3 (MCP migration apply)
- **Issue:** Supabase rejected the first migration attempt with `column "status" does not exist`; staging uses the later CTI `countries` extension table where active state lives on `public.dossiers.status`.
- **Fix:** Kept the five required policy names/commands but changed `countries_select_active` to check the linked dossier row's `status = 'active'`.
- **Files modified:** `supabase/migrations/20260518000001_countries_rls_reconcile.sql`
- **Verification:** `apply_migration` returned success; follow-up `pg_policy` query returned exactly five expected policies with `polcmd` values `d/a/r/r/w`.
- **Committed in:** `2d39f110`

**2. [Rule 3 - Blocking] Hardcoded sensitiveTables list was stale after CTI migration**

- **Found during:** Task 5 (RLS audit verification)
- **Issue:** The new global reference test passed, but the old manual sensitive table list failed on `organizations`; live schema showed most old CTI extension tables no longer have `org_id`/`organization_id`.
- **Fix:** Kept explicit manual coverage for schema-real org-scoped tables and relied on the existing dynamic `get_tables_with_org_id()` test for complete coverage.
- **Files modified:** `tests/security/rls-audit.test.ts`
- **Verification:** Full `pnpm exec vitest run tests/security/rls-audit.test.ts --exclude='.claude/worktrees/**' --reporter=verbose` passed with 7/7 tests.
- **Committed in:** `dc1376cb`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes preserve the phase goal without schema changes or test skips. The migration is not byte-for-byte with the obsolete `021_countries_rls.sql` active-country predicate because the current staging schema makes that predicate invalid.

## Issues Encountered

- The plan's `pnpm --filter frontend type-check` command does not match this repo's package name; verification used the repo-valid `pnpm -C frontend type-check` form where needed.
- Commit hooks ran the cached full build and emitted pre-existing warnings from backend `PDFDocument` import shape, frontend CSS import ordering, bundle chunk size, and knip unused-code reporting. The commits succeeded.

## Verification Evidence

- Local shape checks passed: `globalReferenceTables` appeared at declaration and iteration, `'countries'` appeared exactly once, and no countries pre-existing/acknowledged-fail allowance exists under `tests/`.
- Supabase MCP `apply_migration` returned success for `20260518000001_countries_rls_reconcile`.
- Supabase MCP `execute_sql` returned five `public.countries` policies: `countries_delete_admin (d)`, `countries_insert_editor (a)`, `countries_select_active (r)`, `countries_select_authenticated (r)`, `countries_update_editor (w)`.
- RLS audit passed: `tests/security/rls-audit.test.ts` reported 1 file passed and 7 tests passed, including `global reference tables have authenticated-read policy and role-gated writes (D-56-03)`.

## User Setup Required

None - no manual service configuration required.

## Next Phase Readiness

Plan 56-02 can run. Per D-56-15, its verification should keep re-running the RLS audit first so TYPE-05 failures do not mask RLS regressions.

---

_Phase: 56-rls-closure-last-typed-shim-retirement_
_Completed: 2026-05-18_
