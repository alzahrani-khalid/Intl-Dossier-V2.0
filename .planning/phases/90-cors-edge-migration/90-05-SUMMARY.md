---
phase: 90-cors-edge-migration
plan: 05
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires: []
provides:
  - Request-origin-validated CORS headers for 10 assignment, attachment, and auth edge functions
  - Shared preflight handling through _shared/cors.ts
affects: [90-32, CORS-02, deploy-batch-a]

tech-stack:
  added: []
  patterns: [handler-local getCorsHeaders binding, shared CORS preflight handling]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-05-SUMMARY.md
  modified:
    - supabase/functions/assignments-queue/index.ts
    - supabase/functions/assignments-related-get/index.ts
    - supabase/functions/assignments-workflow-stage-update/index.ts
    - supabase/functions/attachments-delete/index.ts
    - supabase/functions/attachments-download/index.ts
    - supabase/functions/attachments-list/index.ts
    - supabase/functions/attachments-upload/index.ts
    - supabase/functions/attachments/index.ts
    - supabase/functions/auth-step-up-complete/index.ts
    - supabase/functions/auth-step-up-initiate/index.ts

key-decisions:
  - 'Applied the canonical Group-A migration without changing non-preflight response bodies or status codes.'

patterns-established:
  - 'Bind corsHeaders from getCorsHeaders(req) as the first handler statement.'
  - 'Delegate OPTIONS requests to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-02]

duration: 3min
completed: 2026-07-13
---

# Phase 90 Plan 05: Group-A Edge Function CORS Migration Summary

**Ten assignment, attachment, and auth edge functions now derive CORS headers from each request's validated origin and share the canonical preflight response.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-13T10:05:50Z
- **Completed:** 2026-07-13T10:08:48Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all 10 deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound every existing response-header spread to request-origin-validated headers.
- Removed each legacy `"ok"` preflight response in favor of the shared 204 preflight handler.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `3cf26ed9` (fix)

## Files Created/Modified

- `.planning/phases/90-cors-edge-migration/90-05-SUMMARY.md` - Execution and verification record.
- `supabase/functions/assignments-queue/index.ts` - Request-scoped CORS.
- `supabase/functions/assignments-related-get/index.ts` - Request-scoped CORS.
- `supabase/functions/assignments-workflow-stage-update/index.ts` - Request-scoped CORS.
- `supabase/functions/attachments-delete/index.ts` - Request-scoped CORS.
- `supabase/functions/attachments-download/index.ts` - Request-scoped CORS.
- `supabase/functions/attachments-list/index.ts` - Request-scoped CORS.
- `supabase/functions/attachments-upload/index.ts` - Request-scoped CORS.
- `supabase/functions/attachments/index.ts` - Request-scoped CORS.
- `supabase/functions/auth-step-up-complete/index.ts` - Request-scoped CORS.
- `supabase/functions/auth-step-up-initiate/index.ts` - Request-scoped CORS.

## Decisions Made

None - followed the plan's canonical Group-A transformation exactly.

## Verification

- Post-change gate confirmed all 10 files import/use `getCorsHeaders(req)` and delegate preflight handling.
- Scoped wildcard greps and the deprecated static-import grep each returned zero matches.
- Every file containing a `...corsHeaders` spread also contains its handler-local `getCorsHeaders(req)` binding.
- A normalized `HEAD^` comparison produced zero non-CORS drift across all 10 files; non-preflight response bodies and status codes are byte-identical.
- `git diff HEAD^ HEAD --check` passed.
- Runtime smoke remains assigned to the batch-A orchestrator deploy checkpoint by plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The commit hook could not run the repository build because this isolated worktree has no `node_modules` (`turbo` and `knip` were unavailable). The plan's worker-local static acceptance gates passed; installation and runtime smoke are outside this code-migration-only task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The 10 functions are ready to join CORS-02 deploy batch A.
- Allowed/disallowed-origin runtime smoke remains at the orchestrator checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
