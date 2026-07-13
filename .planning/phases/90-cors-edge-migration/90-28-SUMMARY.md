---
phase: 90-cors-edge-migration
plan: 28
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for six Group-C edge functions
affects: [90-34-batch-c-deploy, CORS-03]

tech-stack:
  added: []
  patterns:
    [
      request-scoped getCorsHeaders,
      shared CORS preflight handler,
      explicit module-helper CORS plumbing,
    ]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-28-SUMMARY.md
  modified:
    - supabase/functions/engagement-briefs/index.ts
    - supabase/functions/engagement-dossiers/index.ts
    - supabase/functions/engagement-recommendations/index.ts
    - supabase/functions/entity-duplicates/index.ts
    - supabase/functions/event-store/index.ts
    - supabase/functions/field-history/index.ts

key-decisions:
  - 'Kept CORS state request-local by threading headers through deep helper graphs and moving only small response factories into request scope.'

patterns-established:
  - 'Bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'
  - 'Pass validated headers explicitly to module-scope response helpers; never store request origins in mutable module state.'

requirements-completed: [CORS-03]

duration: 29 min
completed: 2026-07-13
---

# Phase 90 Plan 28: Group-C CORS Migration Summary

**Six module-helper edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-07-13T11:16:00Z
- **Completed:** 2026-07-13T11:44:49Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Replaced the deprecated static import or local wildcard definition in all six Group-C functions with `getCorsHeaders(req)`.
- Routed every OPTIONS request through `handleCorsPreflightRequest(req)`.
- Preserved all non-preflight response bodies and status codes while explicitly threading validated headers through module-scope helpers.

## Task Commits

1. **Task 1: Migrate six Group-C functions to getCorsHeaders** - `7e91c6af` (fix)

## Files Created/Modified

- `supabase/functions/engagement-briefs/index.ts` - Validated headers threaded through brief handlers and the shared error response.
- `supabase/functions/engagement-dossiers/index.ts` - Validated headers threaded through CRUD, participant, agenda, lifecycle, and intake helpers.
- `supabase/functions/engagement-recommendations/index.ts` - Request-scoped response factories use validated headers.
- `supabase/functions/entity-duplicates/index.ts` - Request-scoped error responses and direct responses use validated headers.
- `supabase/functions/event-store/index.ts` - Request-scoped error and success responses use validated headers.
- `supabase/functions/field-history/index.ts` - Validated headers passed to the three module-scope request handlers.
- `.planning/phases/90-cors-edge-migration/90-28-SUMMARY.md` - Execution and verification record.

## Decisions Made

- Passed request-local headers explicitly through large helper graphs and moved only the small response factories in three files into handler scope. This preserves concurrency safety without introducing mutable global request state.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- PASS: all six files import `getCorsHeaders` and `handleCorsPreflightRequest` from `_shared/cors.ts`.
- PASS: all six files bind `const corsHeaders = getCorsHeaders(req)` in the request handler.
- PASS: all six files delegate OPTIONS to `handleCorsPreflightRequest(req)`.
- PASS: zero deprecated static `corsHeaders` imports remain.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain.
- PASS: diff inspection confirms no non-preflight response body or status changed.
- PASS: `git diff --check` is clean.
- PARTIAL: `deno check --no-config --no-lock` parsed all six files, then reported 34 existing Supabase generic/schema typing errors unrelated to CORS.
- Runtime allowed/disallowed-origin smoke testing remains deferred to the batch-C orchestrator checkpoint as specified.

## Issues Encountered

- The commit hook could not run the repository build or Knip because this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The commit completed and all dependency-free worker gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-C orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch C, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
