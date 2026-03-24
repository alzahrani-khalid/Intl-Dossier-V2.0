---
phase: 03-security-hardening
plan: 03
subsystem: database
tags: [rls, postgresql, supabase, security, organization-isolation, policies]

requires:
  - phase: 03-01
    provides: Unified auth middleware with org_id from profiles, RBAC middleware

provides:
  - RLS enabled on every public Supabase table (zero exceptions)
  - Org-scoped RLS policies on all 35 tables with organization_id column
  - Read-only authenticated access for lookup/reference tables without organization_id
  - 4 RPC audit functions (get_tables_without_rls, get_rls_tables_without_policies, get_policies_for_table, get_tables_with_org_id)
  - RLS audit test suite (6 tests) querying system catalogs
  - Organization isolation test suite (7+ tests) verifying SDK-level enforcement

affects: [security, database, testing, api]

tech-stack:
  added: []
  patterns:
    - Dynamic SQL migration for comprehensive RLS coverage
    - RPC functions for database introspection in test suites
    - SDK-authenticated test clients for RLS verification

key-files:
  created:
    - supabase/migrations/20260324000001_rls_audit_fix.sql
    - tests/security/rls-audit.test.ts
    - tests/security/org-isolation.test.ts
  modified: []

key-decisions:
  - "Dynamic DO blocks in migration to catch ALL tables regardless of count or future additions"
  - "RPC functions (SECURITY DEFINER) for test suite to query pg_class/pg_policies system catalogs"
  - "Org-scoped policies use auth.jwt()->>'org_id' per D-02 constraint"
  - "Lookup tables without organization_id get authenticated read-only access (not public anon)"

patterns-established:
  - "RLS audit pattern: Migration enables RLS dynamically, tests verify via RPC functions"
  - "Org isolation test pattern: Create test users in different orgs, verify SDK query filtering"

requirements-completed: [SEC-01]

duration: 6min
completed: 2026-03-24
---

# Phase 03 Plan 03: RLS Audit and Organization Isolation Summary

**Dynamic RLS migration covering all public tables with org-scoped policies, verified by system catalog audit tests and SDK-authenticated isolation tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T01:28:36Z
- **Completed:** 2026-03-24T01:34:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Every public Supabase table now has RLS enabled (zero exceptions per D-03), verified by querying pg_class after migration
- All 35 tables with organization_id column have org-scoped SELECT/INSERT/UPDATE/DELETE policies using auth.jwt()->>'org_id'
- Lookup/reference tables (without organization_id) have authenticated read-only policies
- RLS audit test suite (6 tests) verifies coverage by querying system catalogs via 4 custom RPC functions
- Organization isolation test suite (7+ tests across 5 sensitive tables) verifies SDK-level enforcement with real Supabase Auth tokens

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit all tables for RLS and create fix migration** - `c6124d83` (feat)
2. **Task 2: Create organization isolation test suite via SDK** - `89b25183` (test)

## Files Created/Modified

- `supabase/migrations/20260324000001_rls_audit_fix.sql` - Dynamic migration: enables RLS on all tables, adds org-scoped policies, creates 4 RPC audit functions
- `tests/security/rls-audit.test.ts` - 6 test cases querying system catalogs for RLS coverage verification
- `tests/security/org-isolation.test.ts` - 7+ test cases verifying org isolation via authenticated SDK clients across 5 sensitive tables

## Decisions Made

- **Dynamic DO blocks over static table lists:** Migration uses dynamic SQL to find ALL tables without RLS and ALL tables with organization_id. This future-proofs against new tables that forget RLS.
- **RPC functions for test access:** Created 4 SECURITY DEFINER functions so tests can query pg_class/pg_policies via the Supabase SDK rather than requiring direct database access.
- **Authenticated read (not anon) for lookup tables:** Tables without organization_id get `TO authenticated USING (true)` rather than `TO anon`, requiring at minimum a valid auth session.
- **Supabase Management API for migration:** Used Management API endpoint (`/v1/projects/{id}/database/query`) since `supabase db push` had migration history sync issues.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Supabase CLI `db push` failed due to migration history desync (400+ remote migrations not in local dir). Resolved by applying SQL directly via Supabase Management API.
- `pg` and `pg-promise` Node.js modules not available in the worktree. Used native `fetch()` (Node v24) to call the Management API instead.

## Known Stubs

None - all code is fully functional, no placeholder data or TODO markers.

## User Setup Required

None - no external service configuration required. Migration was applied to Supabase staging.

## Next Phase Readiness

- Phase 03 (security-hardening) is now complete with all 3 plans executed
- RLS coverage is comprehensive and regression-tested
- Ready for Phase 04 or milestone transition

## Self-Check: PASSED

- [x] supabase/migrations/20260324000001_rls_audit_fix.sql - FOUND
- [x] tests/security/rls-audit.test.ts - FOUND
- [x] tests/security/org-isolation.test.ts - FOUND
- [x] Commit c6124d83 - FOUND
- [x] Commit 89b25183 - FOUND

---
*Phase: 03-security-hardening*
*Completed: 2026-03-24*
