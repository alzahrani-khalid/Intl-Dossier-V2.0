---
phase: 90-cors-edge-migration
plan: 21
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten Group-B document and dossier edge functions
affects: [90-33-batch-b-deploy, CORS-03]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-21-SUMMARY.md
  modified:
    - supabase/functions/document-content-search/index.ts
    - supabase/functions/document-preview/index.ts
    - supabase/functions/document-templates/index.ts
    - supabase/functions/document-versions/index.ts
    - supabase/functions/documents-create/index.ts
    - supabase/functions/documents-delete/index.ts
    - supabase/functions/documents-get/index.ts
    - supabase/functions/dossier-dashboard/index.ts
    - supabase/functions/dossiers-get/index.ts
    - supabase/functions/dossiers-relationships-create/index.ts

key-decisions:
  - 'Kept every existing response header spread unchanged by rebinding corsHeaders at the start of each request handler.'

patterns-established:
  - 'Bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-03]

duration: 8 min
completed: 2026-07-13
---

# Phase 90 Plan 21: Group-B CORS Migration Summary

**Ten document and dossier edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-13T10:55:00Z
- **Completed:** 2026-07-13T11:03:01Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten local wildcard `corsHeaders` definitions with `getCorsHeaders(req)`.
- Routed every OPTIONS request through `handleCorsPreflightRequest(req)`.
- Preserved every non-preflight response body, status code, and existing `corsHeaders` spread.

## Task Commits

1. **Task 1: Migrate 10 Group-B functions to getCorsHeaders** - `33e88d60` (fix)

## Files Created/Modified

- `supabase/functions/document-content-search/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/document-preview/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/document-templates/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/document-versions/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/documents-create/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/documents-delete/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/documents-get/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/dossier-dashboard/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/dossiers-get/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/dossiers-relationships-create/index.ts` - Request-scoped validated CORS and shared preflight.
- `.planning/phases/90-cors-edge-migration/90-21-SUMMARY.md` - Execution and verification record.

## Decisions Made

- Used the canonical handler-local binding from the plan because every legacy `corsHeaders` use in this chunk was already inside its request handler.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- PASS: all ten files have exactly one validated helper import, one `getCorsHeaders(req)` binding, and one shared preflight call.
- PASS: zero deprecated static `_shared/cors.ts` imports remain.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain.
- PASS: every existing `corsHeaders` response use is bound to the request-local validated object.
- PASS: a changed-line allowlist found no non-CORS response body or status changes.
- PASS: `git diff --check` is clean.
- Runtime allowed/disallowed-origin smoke testing remains deferred to the batch-B orchestrator checkpoint as specified.

## Issues Encountered

- The commit hook could not run the repository build or Knip because this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The commit completed and all dependency-free worker gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-B orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch B, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
