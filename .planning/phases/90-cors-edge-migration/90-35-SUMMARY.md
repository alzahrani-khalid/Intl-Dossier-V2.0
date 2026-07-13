---
phase: 90-cors-edge-migration
plan: 35
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest helpers
provides:
  - Four Group-D edge functions using request-scoped, origin-validated CORS headers
affects: [90-34-batch-c-deploy-smoke, CORS-03]

tech-stack:
  added: []
  patterns:
    - Request-scoped getCorsHeaders(req) binding at the start of each edge handler
    - Shared handleCorsPreflightRequest(req) handling for OPTIONS requests

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-35-SUMMARY.md
  modified:
    - supabase/functions/activate-account/index.ts
    - supabase/functions/initiate-password-reset/index.ts
    - supabase/functions/reset-password/index.ts
    - supabase/functions/push-device-register/index.ts

key-decisions:
  - Preserved each function's JSON Content-Type by spreading validated CORS headers into the existing response header object.

patterns-established:
  - Every handler computes const corsHeaders = getCorsHeaders(req) before preflight handling.
  - OPTIONS requests use handleCorsPreflightRequest(req); non-preflight response bodies and status codes remain unchanged.

requirements-completed: [CORS-03]

duration: 2min
completed: 2026-07-13
---

# Phase 90 Plan 35: Group-D CORS Migration Summary

**Four inline-wildcard edge functions now derive CORS headers from the validated request origin and use the shared preflight handler.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-13T11:49:31Z
- **Completed:** 2026-07-13T11:51:38Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- Removed every inline wildcard `Access-Control-Allow-Origin` header from the four-function chunk.
- Added exactly one `getCorsHeaders(req)` binding and one validated preflight path to every handler.
- Preserved all non-preflight response bodies, status codes, and JSON content-type headers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 4 Group-D inline-wildcard functions to getCorsHeaders** - `f5b413c9` (fix)

**Plan metadata:** committed separately in the documentation closeout commit.

## Files Created/Modified

- `.planning/phases/90-cors-edge-migration/90-35-SUMMARY.md` - Plan outcome and verification evidence.
- `supabase/functions/activate-account/index.ts` - Uses validated request-scoped CORS headers.
- `supabase/functions/initiate-password-reset/index.ts` - Uses validated request-scoped CORS headers.
- `supabase/functions/reset-password/index.ts` - Uses validated request-scoped CORS headers.
- `supabase/functions/push-device-register/index.ts` - Uses validated request-scoped CORS headers.

## Decisions Made

- Kept each existing `headers` variable and replaced only its inline CORS fields with `...corsHeaders`, minimizing response-site changes while preserving `Content-Type`.
- Followed the canonical migrated preflight behavior from `reactivate-user`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The repository pre-commit build could not run because this isolated worktree has no `node_modules` (`turbo` and `knip` were unavailable). The plan's dependency-free worker gates remained fully runnable.
- `deno check --no-config --no-lock` passes for the three password/account functions. `push-device-register` reports three pre-existing type errors at unchanged lines 243 and 269, unrelated to CORS.

## Verification

- PASS: all four files import `getCorsHeaders` and `handleCorsPreflightRequest` from `_shared/cors.ts`.
- PASS: all four files contain exactly one `const corsHeaders = getCorsHeaders(req)` binding.
- PASS: all four files route OPTIONS through `handleCorsPreflightRequest(req)`.
- PASS: wildcard `Access-Control-Allow-Origin` grep returns 0 matches.
- PASS: diff inspection confirms non-preflight response bodies and status codes are unchanged.
- PASS: `git diff --check`.
- PASS: `deno check --no-config --no-lock` for `activate-account`, `initiate-password-reset`, and `reset-password`.
- Runtime allowed/disallowed-origin smoke testing remains deferred to the batch-C orchestrator checkpoint as specified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for the orchestrator-owned batch-C deploy and allowed/disallowed-origin smoke checks in plan 90-34.
- No deployment was attempted from the worker sandbox.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
