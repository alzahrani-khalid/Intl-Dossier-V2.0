---
phase: 90-cors-edge-migration
plan: 24
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
    - .planning/phases/90-cors-edge-migration/90-24-SUMMARY.md
  modified:
    - supabase/functions/populate-countries-v2/index.ts
    - supabase/functions/populate-countries/index.ts
    - supabase/functions/positions-dossiers-create/index.ts
    - supabase/functions/positions-dossiers-delete/index.ts
    - supabase/functions/positions-dossiers-get/index.ts
    - supabase/functions/progressive-disclosure/index.ts
    - supabase/functions/queue-processor/index.ts
    - supabase/functions/recurring-events/index.ts
    - supabase/functions/refresh-commitment-stats/index.ts
    - supabase/functions/relationship-suggestions/index.ts

key-decisions:
  - 'Applied the plan transformation directly because all ten corsHeaders uses are inside handlers with the req parameter.'

patterns-established:
  - 'Bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-03]

duration: 8 min
completed: 2026-07-13
---

# Phase 90 Plan 24: Group-B CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-13T11:07:00Z
- **Completed:** 2026-07-13T11:15:23Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten local wildcard `corsHeaders` definitions with `getCorsHeaders(req)`.
- Routed every OPTIONS request through `handleCorsPreflightRequest(req)`.
- Preserved every non-preflight response body, status code, and existing `corsHeaders` spread.

## Task Commits

1. **Task 1: Migrate 10 Group-B functions to getCorsHeaders** - `dad7d997` (fix)

## Files Created/Modified

- `supabase/functions/populate-countries-v2/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/populate-countries/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/positions-dossiers-create/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/positions-dossiers-delete/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/positions-dossiers-get/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/progressive-disclosure/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/queue-processor/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/recurring-events/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/refresh-commitment-stats/index.ts` - Request-scoped validated CORS and shared preflight.
- `supabase/functions/relationship-suggestions/index.ts` - Request-scoped validated CORS and shared preflight.
- `.planning/phases/90-cors-edge-migration/90-24-SUMMARY.md` - Execution and verification record.

## Decisions Made

- All ten targets matched the Group-B handler-scope shape, so the existing shared helper was used without adding abstractions or changing response sites.

## Deviations from Plan

None.

## Verification

- PASS: all ten files have exactly one validated helper import, one `getCorsHeaders(req)` binding, and one shared preflight call.
- PASS: zero deprecated static `_shared/cors.ts` imports remain.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain.
- PASS: every existing `corsHeaders` response spread is bound to the request-local validated object.
- PASS: diff inspection confirms no non-preflight response body or status line changed.
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
