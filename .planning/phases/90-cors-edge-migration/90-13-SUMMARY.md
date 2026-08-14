---
phase: 90-cors-edge-migration
plan: 13
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten Group-A edge functions
  - Request-scoped CORS propagation through MoU notification and notification-center response helpers
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-13-SUMMARY.md
  modified:
    - supabase/functions/intelligence-get/index.ts
    - supabase/functions/intelligence-refresh-v2/index.ts
    - supabase/functions/intelligence-refresh/index.ts
    - supabase/functions/intelligence/index.ts
    - supabase/functions/mou-notifications/index.ts
    - supabase/functions/mou-renewals/index.ts
    - supabase/functions/my-delegations/index.ts
    - supabase/functions/notifications-center/index.ts
    - supabase/functions/notifications-digest/index.ts
    - supabase/functions/organizations/index.ts

key-decisions:
  - Thread request-scoped CORS headers through mou-notifications and notifications-center helpers because they are module-scoped.

patterns-established:
  - Handler entry computes getCorsHeaders(req), and OPTIONS delegates to handleCorsPreflightRequest(req).

requirements-completed: [CORS-02]

duration: 15 min
completed: 2026-07-13
---

# Phase 90 Plan 13: Group-A CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-13T10:15:00Z
- **Completed:** 2026-07-13T10:30:00Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound validated headers once per request while preserving every existing non-preflight response body, status code, and header spread.
- Removed every wildcard CORS source and routed all ten OPTIONS branches through the shared preflight helper.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `2e37624b` (fix)

## Decisions Made

- Passed `corsHeaders` into the existing `mou-notifications` and `notifications-center` helpers because those helpers are module-scoped and cannot capture the handler-local binding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected two handler-scope classifications**

- **Found during:** Task 1
- **Issue:** `mou-notifications/index.ts` and `notifications-center/index.ts` were classified as handler-scope, but their response helpers use `corsHeaders` outside the request handler.
- **Fix:** Passed the single request-scoped validated header object into each existing helper.
- **Files modified:** `supabase/functions/mou-notifications/index.ts`, `supabase/functions/notifications-center/index.ts`
- **Verification:** Every helper call receives the validated object; no deprecated import, wildcard, unbound spread, changed response body, or changed non-preflight status remains.
- **Committed in:** `2e37624b`

**Total deviations:** 1 auto-fixed bug. **Impact:** Required for correct origin validation; no scope expansion or non-preflight response contract change.

## Verification

- All ten files contain `getCorsHeaders`, `const corsHeaders = getCorsHeaders(req)`, and `handleCorsPreflightRequest(req)`.
- Required `grep -L "getCorsHeaders"` loop printed nothing.
- Wildcard `Access-Control-Allow-Origin` matches: `0`.
- Deprecated static `_shared/cors.ts` imports: `0`.
- Every `...corsHeaders` spread is backed by a request-local validated binding.
- Changed non-preflight response body/status lines: none.
- `git diff --check`: passed.

## Issues Encountered

- Default `deno check` could not start because the repository workspace configuration references a missing `shared/package.json`. `deno check --no-config` reached all ten files but reported 76 unrelated existing strict/generic diagnostics; it reported no undefined `corsHeaders` or wrong-argument-count diagnostic.
- The commit hook attempted the workspace build and Knip checks, but this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The commit completed and all plan-required worker-side static gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Ready for the batch-A deployment and allowed/disallowed-origin smoke checkpoint after merge.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
