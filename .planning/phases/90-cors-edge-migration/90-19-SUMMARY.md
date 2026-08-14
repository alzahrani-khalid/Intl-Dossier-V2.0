---
phase: 90-cors-edge-migration
plan: 19
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten Group-B edge functions
affects: [90-33-batch-b-deploy, CORS-03]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-19-SUMMARY.md
  modified:
    - supabase/functions/access-requests/index.ts
    - supabase/functions/analytic-graph/index.ts
    - supabase/functions/analytics-dashboard/index.ts
    - supabase/functions/availability-polling/index.ts
    - supabase/functions/calendar-conflicts/index.ts
    - supabase/functions/calendar-create/index.ts
    - supabase/functions/calendar-get/index.ts
    - supabase/functions/calendar-sync/index.ts
    - supabase/functions/calendar-update/index.ts
    - supabase/functions/citation-tracking/index.ts

key-decisions:
  - 'Nested existing response helpers in availability-polling, calendar-conflicts, and calendar-sync so they capture request-scoped headers without changing response bodies, statuses, or callers.'

patterns-established:
  - 'Bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-03]

duration: 5 min
completed: 2026-07-13
---

# Phase 90 Plan 19: Group-B CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-13T10:48:01Z
- **Completed:** 2026-07-13T10:52:49Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten local wildcard `corsHeaders` definitions with `getCorsHeaders(req)`.
- Routed every OPTIONS request through `handleCorsPreflightRequest(req)`.
- Preserved every non-preflight response body, status code, and existing `corsHeaders` spread.

## Task Commits

1. **Task 1: Migrate 10 Group-B functions to getCorsHeaders** - `9f2ce3b0` (fix)

## Files Created/Modified

- `supabase/functions/access-requests/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/analytic-graph/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/analytics-dashboard/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/availability-polling/index.ts` - Request-scoped validated CORS captured by existing response helpers.
- `supabase/functions/calendar-conflicts/index.ts` - Request-scoped validated CORS captured by existing response helpers.
- `supabase/functions/calendar-create/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/calendar-get/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/calendar-sync/index.ts` - Request-scoped validated CORS captured by existing response helpers.
- `supabase/functions/calendar-update/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/citation-tracking/index.ts` - Request-scoped validated CORS and shared preflight.
- `.planning/phases/90-cors-edge-migration/90-19-SUMMARY.md` - Execution and verification record.

## Decisions Made

- `availability-polling`, `calendar-conflicts`, and `calendar-sync` had module-scope response helpers despite the plan's handler-scope classification. Moving each existing handler boundary below its helper declarations preserves every response and lets the helpers capture the validated request-local headers.

## Deviations from Plan

### Auto-fixed Issues

**1. Corrected three handler-scope misclassifications**

- **Found during:** Task 1 flow tracing.
- **Issue:** Three functions referenced local wildcard `corsHeaders` from response helpers outside the request handler.
- **Fix:** Nested the unchanged helpers in the request handler so they close over `getCorsHeaders(req)`.
- **Files modified:** `supabase/functions/availability-polling/index.ts`, `supabase/functions/calendar-conflicts/index.ts`, `supabase/functions/calendar-sync/index.ts`.
- **Verification:** Deno parsed all ten targets; the mechanical diff and static CORS gates passed.
- **Committed in:** `9f2ce3b0`.

**Total deviations:** 1 auto-fixed correctness issue affecting three scoped files.
**Impact on plan:** Required to remove the wildcard source without leaving helper responses unbound; no scope expansion.

## Verification

- PASS: all ten files have exactly one validated helper import, one `getCorsHeaders(req)` binding, and one shared preflight call.
- PASS: zero deprecated static `_shared/cors.ts` imports remain.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain.
- PASS: every existing `corsHeaders` response use is bound to the request-local validated object.
- PASS: an allowlisted mechanical diff check found no non-CORS response body or status changes.
- PASS: `git diff --check` is clean.
- PASS: Deno parsed all ten files; full type-checking reached 11 pre-existing `TS18046` catch-variable errors whose source lines are unchanged at `HEAD`.
- Runtime allowed/disallowed-origin smoke testing remains deferred to the batch-B orchestrator checkpoint as specified.

## Issues Encountered

- The full Deno check reports 11 pre-existing `TS18046` errors for untyped catch variables across the legacy targets; none is on a changed source line.
- The commit hook could not run the repository build or Knip because this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The commit completed and all dependency-free worker gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-B orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch B, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
