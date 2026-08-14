---
phase: 90-cors-edge-migration
plan: 06
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Ten Group-A edge functions using request-scoped origin-validated CORS headers
  - Shared-helper OPTIONS handling across the plan 90-06 chunk
affects: [90-32-batch-a-deploy, cors-edge-functions]

tech-stack:
  added: []
  patterns:
    - Bind getCorsHeaders(req) as the first handler statement and reuse existing corsHeaders spreads

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-06-SUMMARY.md
  modified:
    - supabase/functions/auth-verify-step-up/index.ts
    - supabase/functions/bot-notification-dispatcher/index.ts
    - supabase/functions/briefing-books/index.ts
    - supabase/functions/briefing-pack-job-status/index.ts
    - supabase/functions/briefing-packs-generate/index.ts
    - supabase/functions/briefing-packs-list/index.ts
    - supabase/functions/calculate-health-score/index.ts
    - supabase/functions/capacity-check/index.ts
    - supabase/functions/certify-user-access/index.ts
    - supabase/functions/collaborative-editing/index.ts

key-decisions:
  - Followed the canonical Group-A migration exactly without changing non-preflight response bodies or status codes.

patterns-established:
  - Group-A handlers import getCorsHeaders and handleCorsPreflightRequest, bind request-scoped headers first, and route OPTIONS through the shared helper.

requirements-completed: [CORS-02]

duration: 20 min
completed: 2026-07-13
---

# Phase 90 Plan 06: Group-A CORS Migration Summary

**Ten Group-A edge functions now derive CORS headers from the request origin and use the shared preflight responder.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-13T09:42:24Z
- **Completed:** 2026-07-13T10:02:28Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound origin-validated headers as the first statement in every request handler while preserving every existing non-preflight response-header spread.
- Removed wildcard CORS values from the chunk and routed all ten OPTIONS branches through the shared preflight helper.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `a390cbff` (fix)

## Files Created/Modified

- `supabase/functions/auth-verify-step-up/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/bot-notification-dispatcher/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/briefing-books/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/briefing-pack-job-status/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/briefing-packs-generate/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/briefing-packs-list/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/calculate-health-score/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/capacity-check/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/certify-user-access/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `supabase/functions/collaborative-editing/index.ts` - Uses request-scoped CORS headers and shared preflight handling.
- `.planning/phases/90-cors-edge-migration/90-06-SUMMARY.md` - Records implementation and verification evidence.

## Decisions Made

None - followed the plan's canonical Group-A transformation exactly.

## Verification

- Plan `grep -L "getCorsHeaders"` loop printed nothing for all ten files.
- Per-file counts found exactly one `getCorsHeaders(req)` binding and one `handleCorsPreflightRequest(req)` call in every file.
- Deprecated static-import grep returned `0`.
- Wildcard `Access-Control-Allow-Origin: '*'` grep returned `0`.
- `git diff --check` passed.
- A word-diff confirmed the source commit contains only the CORS imports, handler-local bindings, and mandated OPTIONS helper substitutions; all non-preflight response bodies and status codes are unchanged.
- Independent spec-compliance and code-quality reviews found no issues.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The commit hook could not run the workspace build or Knip because this isolated worktree has no installed `turbo`, `knip`, or `node_modules`; the commit completed and the plan's worker-side static gates passed.

## User Setup Required

None - deployment and runtime origin smoke tests remain assigned to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Plan 90-06 is ready to merge into batch A for the plan 90-32 staging deploy and allowed/disallowed-origin smoke tests.

## Self-Check: PASSED

- All eleven changed paths are allowlisted by the task scope.
- All ten handlers satisfy the required helper, deprecated-import, and wildcard gates.

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
