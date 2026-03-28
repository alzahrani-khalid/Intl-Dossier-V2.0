---
phase: 03-security-hardening
plan: 01
subsystem: auth
tags: [supabase-auth, jwt, rbac, middleware, express, vitest]

# Dependency graph
requires: []
provides:
  - Unified auth middleware (Supabase-first, JWT fallback)
  - RBAC middleware with hierarchical role checking (requireMinRole, requirePermission, requireClearance)
  - Single Express.Request.user type with organization_id from profiles table
  - Security test helpers and 20-test suite
affects: [03-02, 03-03, api-routes, rls-policies]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-first-auth, rbac-hierarchy, profile-based-org-isolation]

key-files:
  created:
    - backend/src/middleware/rbac.ts
    - tests/security/test-helpers.ts
    - tests/security/rbac.test.ts
    - tests/security/auth-edge-cases.test.ts
  modified:
    - backend/src/types/express.d.ts
    - backend/src/middleware/auth.ts
    - backend/src/middleware/supabase-auth.ts
    - backend/src/api/tasks.ts

key-decisions:
  - 'Supabase Auth as primary strategy with custom JWT as fallback for backward compat'
  - 'organization_id always from profiles table -- never hardcoded'
  - 'RBAC uses numeric hierarchy (viewer=20 to super_admin=100) for flexible min-role checks'
  - 'supabase-auth.ts converted to thin re-export layer instead of deleted, preserving all import paths'

patterns-established:
  - 'Auth middleware fetches user context from both users and profiles tables'
  - 'RBAC middleware separated from auth middleware for composability'
  - 'Security tests use mock factories from test-helpers.ts'

requirements-completed: [SEC-02, SEC-05, SEC-06]

# Metrics
duration: 16min
completed: 2026-03-24
---

# Phase 03 Plan 01: Auth Unification Summary

**Unified dual auth middleware into Supabase-first system with RBAC hierarchy, org isolation from profiles table, and 20-test security suite**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-24T01:09:03Z
- **Completed:** 2026-03-24T01:25:39Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Replaced dual conflicting auth middlewares (auth.ts + supabase-auth.ts) with single unified Supabase-first middleware
- Eliminated hardcoded DEFAULT_ORGANIZATION_ID; org_id now always fetched from profiles table
- Created RBAC middleware with hierarchical role checking (super_admin > admin > manager > editor > viewer)
- Built 20-test security suite covering auth edge cases and all RBAC functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Unify auth middleware and create RBAC with org isolation** - `d614bb65` (feat)
2. **Task 2: Create security test helpers and auth/RBAC test suite** - `5fa2f372` (test)

## Files Created/Modified

- `backend/src/types/express.d.ts` - Unified req.user type with strict role union and organization_id
- `backend/src/middleware/auth.ts` - Unified auth: Supabase-first with JWT fallback, profile lookup
- `backend/src/middleware/supabase-auth.ts` - Re-export layer for backward compatibility
- `backend/src/middleware/rbac.ts` - New RBAC middleware: requireMinRole, requirePermission, requireClearance
- `backend/src/api/tasks.ts` - Fixed tenantId to organization_id reference
- `tests/security/test-helpers.ts` - Mock factories for Express req/res/next and test org IDs
- `tests/security/rbac.test.ts` - 14 tests for role hierarchy, clearance, and permissions
- `tests/security/auth-edge-cases.test.ts` - 6 tests for missing/invalid/expired tokens and inactive users

## Decisions Made

- **Supabase-first auth**: Primary strategy validates tokens via `supabaseAdmin.auth.getUser()`. Custom JWT verification is fallback only for backward compatibility with existing sessions.
- **Profile-based org isolation**: `organization_id` is always fetched from the `profiles` table. Users without a profile entry get rejected with a clear error message.
- **Numeric role hierarchy**: RBAC uses numeric levels (viewer=20, editor=40, manager=60, admin=80, super_admin=100) enabling `requireMinRole()` checks instead of explicit role lists.
- **Re-export pattern for supabase-auth.ts**: Rather than deleting the file (which would break imports in ai.ts and other files), it re-exports from the unified auth module.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed tenantId reference in tasks.ts**

- **Found during:** Task 1 (auth unification)
- **Issue:** `backend/src/api/tasks.ts` referenced `req.user.tenantId` which no longer exists in the unified type
- **Fix:** Changed to `req.user?.organization_id`
- **Files modified:** `backend/src/api/tasks.ts`
- **Verification:** Build succeeds with no TypeScript errors
- **Committed in:** d614bb65 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential fix -- the old property name would cause a TypeScript error. No scope creep.

## Known Stubs

None -- all code paths are fully wired to real data sources.

## Issues Encountered

None -- execution proceeded smoothly.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Auth foundation unified and tested, ready for RLS policy audit (03-02) and input validation (03-03)
- All route files importing from `auth.ts` or `supabase-auth.ts` continue to work without changes
- RBAC middleware available for route-level role enforcement in future plans

---

_Phase: 03-security-hardening_
_Completed: 2026-03-24_

## Self-Check: PASSED

All 8 files verified present. Both task commits (d614bb65, 5fa2f372) verified in git log.
