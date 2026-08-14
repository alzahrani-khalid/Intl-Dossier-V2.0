---
phase: 90-cors-edge-migration
plan: 07
subsystem: api
tags: [supabase, edge-functions, cors]

requires: []
provides:
  - Origin-validated CORS headers for ten Group-A edge functions
  - Request-scoped CORS propagation through compliance response helpers
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-07-SUMMARY.md
  modified:
    - supabase/functions/commitments-update-status/index.ts
    - supabase/functions/complete-access-review/index.ts
    - supabase/functions/compliance/index.ts
    - supabase/functions/contributors-add/index.ts
    - supabase/functions/contributors-remove/index.ts
    - supabase/functions/countries/index.ts
    - supabase/functions/create-user/index.ts
    - supabase/functions/data-export/index.ts
    - supabase/functions/data-import/index.ts
    - supabase/functions/data-library/index.ts

key-decisions:
  - 'Thread request-scoped CORS headers through compliance helpers because they are module-scoped.'

patterns-established:
  - 'Handler entry computes getCorsHeaders(req), and OPTIONS delegates to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-02]

duration: 4 min
completed: 2026-07-13
---

# Phase 90 Plan 07: Group-A CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-13T09:56:41Z
- **Completed:** 2026-07-13T10:00:33Z
- **Tasks:** 1
- **Files modified:** 10

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound validated headers once per request and preserved existing response bodies, status codes, and header spreads.
- Removed every wildcard CORS source and legacy OPTIONS response in the chunk.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `9e317290` (fix)

## Files Created/Modified

- `supabase/functions/commitments-update-status/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/complete-access-review/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/compliance/index.ts` - Passes request-scoped validated CORS into module-scope response helpers.
- `supabase/functions/contributors-add/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/contributors-remove/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/countries/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/create-user/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/data-export/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/data-import/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/data-library/index.ts` - Uses request-scoped validated CORS.

## Decisions Made

- Passed `corsHeaders` into the existing compliance helpers because those helpers are module-scoped and cannot capture the handler-local binding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected compliance handler-scope classification**

- **Found during:** Task 1
- **Issue:** `compliance/index.ts` was classified as Group A, but twelve response helpers use `corsHeaders` outside the request handler.
- **Fix:** Passed the single request-scoped validated header object into each existing helper.
- **Files modified:** `supabase/functions/compliance/index.ts`
- **Verification:** All helper call sites receive the validated object; no deprecated import or wildcard remains.
- **Committed in:** `9e317290`

**Total deviations:** 1 auto-fixed bug. **Impact:** Required for correct origin validation; no scope expansion or response-body/status change.

## Verification

- Every scoped file imports and uses `getCorsHeaders`; missing-file check printed nothing.
- Wildcard `Access-Control-Allow-Origin` matches: `0`.
- Deprecated static `_shared/cors.ts` imports: `0`.
- Legacy OPTIONS `new Response(...)` sites: `0`.
- Changed non-preflight response body/status lines: none.
- `git diff --check`: passed.

## Issues Encountered

- The commit hook attempted the repository build and knip checks, but this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The plan's required worker-side static gates all passed.

## User Setup Required

None - deployment and runtime smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Ready for the batch-A deployment and allowed/disallowed-origin smoke checkpoint after merge.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
