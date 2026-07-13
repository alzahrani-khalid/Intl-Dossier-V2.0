---
phase: 90-cors-edge-migration
plan: 36
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest helpers
provides:
  - Four harder Group-D edge functions using request-scoped, origin-validated CORS headers
affects: [90-34-batch-c-deploy-smoke, CORS-03]

tech-stack:
  added: []
  patterns:
    - Request-scoped getCorsHeaders(req) binding at the start of each edge handler
    - Explicit validated-header threading through module-scope response handlers
    - Shared handleCorsPreflightRequest(req) handling for OPTIONS requests

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-36-SUMMARY.md
  modified:
    - supabase/functions/ocr-extract/index.ts
    - supabase/functions/push-notification-send/index.ts
    - supabase/functions/scenario-sandbox/index.ts
    - supabase/functions/waiting-queue-escalation/index.ts

key-decisions:
  - Threaded one request-scoped CORS header object through module-scope response handlers instead of relying on mutable module state.
  - Preserved response bodies, status codes, and JSON content-type headers while replacing only CORS behavior.

patterns-established:
  - Every handler computes const corsHeaders = getCorsHeaders(req) before preflight handling.
  - OPTIONS requests use handleCorsPreflightRequest(req); module-scope response paths receive validated headers explicitly.

requirements-completed: [CORS-03]

duration: 17min
completed: 2026-07-13
---

# Phase 90 Plan 36: Harder Group-D CORS Migration Summary

**Four multi-site and module-scope edge functions now derive CORS headers from the validated request origin and use the shared preflight handler.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-13T11:46:00Z
- **Completed:** 2026-07-13T12:03:46Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- Removed all three inline wildcard CORS sites from `ocr-extract` and every wildcard site from the four-function chunk.
- Added exactly one `getCorsHeaders(req)` binding and one shared preflight path to every handler.
- Threaded validated headers through `scenario-sandbox` response helpers and all module-scope response handlers.
- Preserved non-CORS response bodies, status codes, and JSON content-type headers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 4 harder Group-D functions to getCorsHeaders** - `5ed90885` (fix)

**Plan metadata:** committed separately in the documentation closeout commit.

## Files Created/Modified

- `.planning/phases/90-cors-edge-migration/90-36-SUMMARY.md` - Plan outcome and verification evidence.
- `supabase/functions/ocr-extract/index.ts` - Replaces three inline wildcard sites with validated headers.
- `supabase/functions/push-notification-send/index.ts` - Reuses validated headers through its existing response header object.
- `supabase/functions/scenario-sandbox/index.ts` - Threads validated headers through module-scope helpers and handlers.
- `supabase/functions/waiting-queue-escalation/index.ts` - Threads validated headers through route response handlers.

## Decisions Made

- Passed `Record<string, string>` headers explicitly through module-scope functions, avoiding request-unsafe module state.
- Kept existing response construction and changed only CORS header composition and preflight handling.

## Deviations from Plan

None - plan executed within the exact file scope.

## Issues Encountered

- The repository pre-commit build could not run because this isolated worktree has no `node_modules` (`turbo` and `knip` were unavailable); the commit still completed and the dependency-free worker gates ran.
- `deno check --no-config --no-lock` passes for `scenario-sandbox`. The other three files report only pre-existing errors at unchanged lines: multipart file union handling in `ocr-extract`, unknown catch values in `push-notification-send` and `waiting-queue-escalation`, and an out-of-scope boolean return in `_shared/security.ts`.

## Verification

- PASS: all four files import and call `getCorsHeaders(req)`.
- PASS: all four files route OPTIONS through `handleCorsPreflightRequest(req)`.
- PASS: wildcard `Access-Control-Allow-Origin` grep returns 0 matches across the chunk.
- PASS: `ocr-extract` has all three former inline wildcard sites migrated.
- PASS: `scenario-sandbox` response helpers and module-scope handlers receive request-scoped validated headers.
- PASS: `deno check --no-config --no-lock supabase/functions/scenario-sandbox/index.ts`.
- PASS: `git diff --check`.
- PASS: scope inspection shows only the four edge functions and this summary were changed.
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
