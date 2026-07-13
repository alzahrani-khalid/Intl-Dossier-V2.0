---
phase: 90-cors-edge-migration
plan: 29
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest helpers
provides:
  - Six Group-C edge functions using request-scoped, origin-validated CORS headers
  - Request CORS threading through module-scope response helpers
affects: [90-34-batch-c-deploy-smoke, CORS-03]

tech-stack:
  added: []
  patterns:
    - Request-scoped getCorsHeaders(req) binding at the start of each edge handler
    - Bound or explicitly threaded CORS headers for module-scope response helpers

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-29-SUMMARY.md
  modified:
    - supabase/functions/field-permissions/index.ts
    - supabase/functions/geographic-visualization/index.ts
    - supabase/functions/mous/index.ts
    - supabase/functions/persons/index.ts
    - supabase/functions/relationship-health/index.ts
    - supabase/functions/slack-bot/index.ts

key-decisions:
  - Bound request-scoped headers once for high-call-count response helpers to keep response call sites unchanged.
  - Passed geographic response helpers and Slack CORS headers explicitly across module-scope boundaries.

patterns-established:
  - Every handler computes const corsHeaders = getCorsHeaders(req) before preflight handling.
  - OPTIONS requests use handleCorsPreflightRequest(req); all other response bodies and status expressions remain unchanged.

requirements-completed: [CORS-03]

duration: 12min
completed: 2026-07-13
---

# Phase 90 Plan 29: Group-C CORS Migration Summary

**Six module-scope edge functions now derive CORS headers from the validated request origin and thread them through every response path.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-13T11:31:00Z
- **Completed:** 2026-07-13T11:42:24Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Removed all deprecated static `corsHeaders` imports and both local wildcard CORS objects from the six-function chunk.
- Added exactly one `getCorsHeaders(req)` binding and one validated preflight path to every handler.
- Preserved existing response JSON and non-preflight status expressions while safely threading headers through module-scope helpers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 6 Group-C functions to getCorsHeaders** - `c64bbd5b` (fix)

**Plan metadata:** committed separately in the documentation closeout commit.

## Files Created/Modified

- `.planning/phases/90-cors-edge-migration/90-29-SUMMARY.md` - Plan outcome and verification evidence.
- `supabase/functions/field-permissions/index.ts` - Binds validated headers to shared success/error response helpers.
- `supabase/functions/geographic-visualization/index.ts` - Creates request-scoped response helpers and passes them to module handlers.
- `supabase/functions/mous/index.ts` - Moves the JSON response closure into request scope.
- `supabase/functions/persons/index.ts` - Binds validated headers to the module error helper.
- `supabase/functions/relationship-health/index.ts` - Binds validated headers to success/error helpers.
- `supabase/functions/slack-bot/index.ts` - Threads validated headers into slash-command and event helpers.

## Decisions Made

- Used native `Function.prototype.bind` for response helpers with many call sites, avoiding repetitive call-site edits.
- Kept geographic response construction behind one request-scoped helper pair and passed that pair to its four module handlers.
- Followed the canonical migrated preflight behavior from `reactivate-user`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The repository pre-commit build could not run because this isolated worktree has no `node_modules` (`turbo` and `knip` were unavailable). The plan's worker acceptance is static and remained fully runnable.
- `deno check --no-config` across all six files reports 40 pre-existing Supabase schema/type errors unrelated to CORS. The two files without baseline type debt (`field-permissions` and `mous`) pass Deno check, and no error points to the new CORS imports, bindings, or threading.

## Verification

- PASS: all six files import `getCorsHeaders` and contain exactly one `getCorsHeaders(req)` binding.
- PASS: wildcard `Access-Control-Allow-Origin: '*'` grep returns 0 matches.
- PASS: deprecated static `corsHeaders` import grep returns 0 matches.
- PASS: every handler routes OPTIONS through `handleCorsPreflightRequest(req)`.
- PASS: normalized `JSON.stringify` response expressions and non-preflight status expressions match `HEAD` before the migration.
- PASS: `git diff --check`.
- PASS: `deno check --no-config supabase/functions/field-permissions/index.ts supabase/functions/mous/index.ts`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for the orchestrator-owned batch-C deploy and allowed/disallowed-origin smoke checks in plan 90-34.
- No production deploy was attempted from the worker sandbox.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
