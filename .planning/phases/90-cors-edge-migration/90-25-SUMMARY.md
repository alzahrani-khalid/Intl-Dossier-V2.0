---
phase: 90-cors-edge-migration
plan: 25
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
  patterns:
    [request-scoped getCorsHeaders, shared CORS preflight handler, request-local response plumbing]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-25-SUMMARY.md
  modified:
    - supabase/functions/relationships-manage/index.ts
    - supabase/functions/scheduled-report-processor/index.ts
    - supabase/functions/search-suggestions/index.ts
    - supabase/functions/setup-mfa/index.ts
    - supabase/functions/sla-monitoring/index.ts
    - supabase/functions/smart-import-suggestions/index.ts
    - supabase/functions/sync-incremental/index.ts
    - supabase/functions/sync-pull/index.ts
    - supabase/functions/tag-hierarchy/index.ts
    - supabase/functions/tags-manage/index.ts

key-decisions:
  - 'Threaded validated headers through module-scope response helpers in three misclassified files rather than introducing unsafe mutable global request state.'

patterns-established:
  - 'Bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'
  - 'When response helpers live outside the handler, pass request-local headers or a request-local response callback explicitly.'

requirements-completed: [CORS-03]

duration: 12 min
completed: 2026-07-13
---

# Phase 90 Plan 25: Group-B CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-13T11:15:00Z
- **Completed:** 2026-07-13T11:27:28Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten local wildcard `corsHeaders` definitions with `getCorsHeaders(req)`.
- Routed every OPTIONS request through `handleCorsPreflightRequest(req)`.
- Preserved every non-preflight response body and status code, including module-scope response helpers.

## Task Commits

1. **Task 1a: Migrate handler-scoped Group-B functions** - `75fc22fc` (fix)
2. **Task 1b: Migrate helper-driven response paths** - `ee1314f6` (fix)

## Files Created/Modified

- `supabase/functions/relationships-manage/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/scheduled-report-processor/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/search-suggestions/index.ts` - Request-scoped validated CORS for the handler and response-producing helpers.
- `supabase/functions/setup-mfa/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/sla-monitoring/index.ts` - Validated headers threaded through module-scope response helpers.
- `supabase/functions/smart-import-suggestions/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/sync-incremental/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/sync-pull/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/tag-hierarchy/index.ts` - Request-local JSON response callback threaded through module-scope handlers.
- `supabase/functions/tags-manage/index.ts` - Request-scoped validated CORS and shared preflight.
- `.planning/phases/90-cors-edge-migration/90-25-SUMMARY.md` - Execution and verification record.

## Decisions Made

- `search-suggestions`, `sla-monitoring`, and `tag-hierarchy` had module-scope response helpers despite the Group-B handler-scope classification. Validated request context was passed explicitly so concurrent requests cannot leak origins through mutable global state.

## Deviations from Plan

### Auto-fixed Issues

**1. Corrected three handler-scope classification mismatches**

- **Found during:** Task 1 CORS reference tracing
- **Issue:** Three planned Group-B files referenced `corsHeaders` from module-scope response helpers, so deleting the wildcard global and adding only a handler-local binding would leave undefined references.
- **Fix:** Recomputed headers from the existing request in `search-suggestions`, threaded headers in `sla-monitoring`, and passed a request-local response callback in `tag-hierarchy`.
- **Files modified:** `supabase/functions/search-suggestions/index.ts`, `supabase/functions/sla-monitoring/index.ts`, `supabase/functions/tag-hierarchy/index.ts`
- **Verification:** Deno parsed all three files without CORS binding or signature errors; scoped grep gates passed.
- **Committed in:** `ee1314f6`

**Total deviations:** 1 auto-fixed correctness issue.
**Impact on plan:** Required CORS-only plumbing stayed within the declared file scope and preserved response payloads/statuses.

## Verification

- PASS: all ten files import `getCorsHeaders` and `handleCorsPreflightRequest` from `_shared/cors.ts`.
- PASS: all ten files bind `const corsHeaders = getCorsHeaders(req)` in the request handler.
- PASS: all ten files delegate OPTIONS to `handleCorsPreflightRequest(req)`.
- PASS: zero deprecated static `corsHeaders` imports remain.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain.
- PASS: diff inspection confirms no non-preflight response body or status changed.
- PASS: `git diff --check` is clean.
- PARTIAL: `deno check --no-config --no-lock` parsed the three helper-driven files, then reported 83 existing Supabase generic/schema typing errors unrelated to CORS.
- Runtime allowed/disallowed-origin smoke testing remains deferred to the batch-B orchestrator checkpoint as specified.

## Issues Encountered

- The commit hook could not run the repository build or Knip because this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). Both commits completed and the dependency-free worker gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-B orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch B, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
