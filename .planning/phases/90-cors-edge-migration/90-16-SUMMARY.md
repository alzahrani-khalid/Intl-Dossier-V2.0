---
phase: 90-cors-edge-migration
plan: 16
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten edge functions
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-16-SUMMARY.md
  modified:
    - supabase/functions/positions-versions-restore/index.ts
    - supabase/functions/quickswitcher-search/index.ts
    - supabase/functions/reports/index.ts
    - supabase/functions/resolve-dossier-context/index.ts
    - supabase/functions/retention-processor/index.ts
    - supabase/functions/revoke-delegation/index.ts
    - supabase/functions/sample-data/index.ts
    - supabase/functions/saved-searches/index.ts
    - supabase/functions/schedule-access-review/index.ts
    - supabase/functions/search-semantic/index.ts

key-decisions:
  - 'Nested existing response helpers in sample-data and saved-searches so they capture request-scoped headers without changing their bodies or callers.'

patterns-established:
  - 'Bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-02]

duration: 55 min
completed: 2026-07-13
---

# Phase 90 Plan 16: Group-A CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-07-13T09:42:24Z
- **Completed:** 2026-07-13T10:37:47Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound every existing response header spread to headers validated against the current request origin.
- Removed every wildcard/static CORS source from the chunk while preserving non-preflight response bodies and status codes.

## Task Commits

1. **Task 1: Migrate 10 edge functions to getCorsHeaders** - `8fe3ca86` (fix)

## Files Created/Modified

- `supabase/functions/positions-versions-restore/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/quickswitcher-search/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/reports/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/resolve-dossier-context/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/retention-processor/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/revoke-delegation/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/sample-data/index.ts` - Request-scoped validated CORS captured by existing response helpers.
- `supabase/functions/saved-searches/index.ts` - Request-scoped validated CORS captured by the existing JSON response helper.
- `supabase/functions/schedule-access-review/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/search-semantic/index.ts` - Request-scoped validated CORS and shared preflight.
- `.planning/phases/90-cors-edge-migration/90-16-SUMMARY.md` - Execution and verification record.

## Decisions Made

- `sample-data` and `saved-searches` use `corsHeaders` in module-scope response helpers despite the plan's Group-A classification. Moving the existing handler boundary below those helpers lets them capture the request-local binding with no response-body, status, or caller changes.

## Deviations from Plan

### Auto-fixed Issues

**1. Corrected two handler-scope misclassifications**

- **Found during:** Task 1 flow tracing.
- **Issue:** `sample-data` and `saved-searches` referenced static `corsHeaders` from response helpers outside the handler.
- **Fix:** Nested the unchanged helpers in the request handler so they close over `getCorsHeaders(req)`.
- **Files modified:** `supabase/functions/sample-data/index.ts`, `supabase/functions/saved-searches/index.ts`.
- **Verification:** Deno parsed both files; the mechanical diff and static CORS gates passed.
- **Committed in:** `8fe3ca86`.

**Total deviations:** 1 auto-fixed correctness issue affecting two scoped files.
**Impact on plan:** Required to remove the deprecated import without leaving helper responses unbound; no scope expansion.

## Verification

- PASS: all ten files have one validated helper import, one `getCorsHeaders(req)` binding, and one shared preflight call.
- PASS: zero deprecated static `_shared/cors.ts` imports remain.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain.
- PASS: every existing `corsHeaders` response use is bound to the request-local validated object.
- PASS: an allowlisted mechanical diff check confirms only CORS imports/bindings/preflight returns and the two helper-scope boundaries changed.
- PASS: `git diff --check` is clean.
- PASS: `deno check --no-config --no-lock` succeeds for six targets; all ten parse successfully.
- Runtime allowed/disallowed-origin smoke testing remains deferred to the batch-A orchestrator checkpoint as specified.

## Issues Encountered

- The full ten-file Deno check reports 75 pre-existing type errors in untouched legacy Supabase generic annotations and one unknown catch variable across `reports`, `retention-processor`, `sample-data`, and `saved-searches`. The six other targets type-check cleanly.
- The commit hook could not run the repository build or Knip because this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The commit completed and all dependency-free worker gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch A, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
