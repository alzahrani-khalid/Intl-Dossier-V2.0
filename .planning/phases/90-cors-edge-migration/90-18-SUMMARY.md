---
phase: 90-cors-edge-migration
plan: 18
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for the final ten Group-A edge functions
  - Request-scoped CORS propagation to all private response helpers
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-18-SUMMARY.md
  modified:
    - supabase/functions/unified-work-list/index.ts
    - supabase/functions/user-permissions/index.ts
    - supabase/functions/validate-delegation/index.ts
    - supabase/functions/view-preferences/index.ts
    - supabase/functions/waiting-queue-reminder/index.ts
    - supabase/functions/watchlist/index.ts
    - supabase/functions/webhook-delivery/index.ts
    - supabase/functions/webhooks/index.ts
    - supabase/functions/word-assistant/index.ts
    - supabase/functions/work-item-dossiers/index.ts

key-decisions:
  - Keep private response helpers inside their sole request callback where needed so every unchanged corsHeaders spread closes over validated request headers.

patterns-established:
  - Handler entry computes getCorsHeaders(req), and OPTIONS delegates to handleCorsPreflightRequest(req).

requirements-completed: [CORS-02]

duration: 10 min
completed: 2026-07-13
---

# Phase 90 Plan 18: Group-A CORS Migration Summary

**The final ten Group-A edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-07-13T10:56:57Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound validated request headers to every response path without changing non-preflight response bodies or status codes.
- Removed every wildcard CORS source and routed all ten OPTIONS branches through the shared preflight helper.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `eb546a67` (fix)

## Decisions Made

- Kept the private helpers in `view-preferences`, `watchlist`, `webhooks`, and `work-item-dossiers` within their sole request callback so their existing `corsHeaders` spreads use the handler-local validated object without signature or call-site churn.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected four handler-scope classifications**

- **Found during:** Task 1
- **Issue:** Four files were classified as handler-scope, but private helpers below the callback also spread the deprecated module import.
- **Fix:** Extended each callback's lexical scope over its private helpers so all existing spreads bind to the request-derived object.
- **Files modified:** `supabase/functions/view-preferences/index.ts`, `supabase/functions/watchlist/index.ts`, `supabase/functions/webhooks/index.ts`, `supabase/functions/work-item-dossiers/index.ts`
- **Verification:** No deprecated import, wildcard, unbound spread, changed non-preflight response body, or changed non-preflight status remains.
- **Committed in:** `eb546a67`

**Total deviations:** 1 auto-fixed bug. **Impact:** Required for correct origin validation; no file-scope expansion or response-contract change.

## Verification

- Required `grep -L "getCorsHeaders"` loop printed nothing.
- Wildcard `Access-Control-Allow-Origin` matches: `0` for single- and double-quoted forms.
- Deprecated static `_shared/cors.ts` imports: `0`.
- Validated imports, handler-local bindings, and shared preflight calls: `10` each.
- Changed source lines were limited to CORS imports, handler bindings, OPTIONS delegation, and private-helper lexical closure placement.
- `git diff --check`: passed.
- `deno check --no-config` parsed all ten files and reported no undefined `corsHeaders` or migration argument errors; it remains red on 75 existing diagnostics in untouched Supabase typing and shared code.
- The commit hook attempted the workspace build and Knip checks, but dependencies are absent in this isolated worktree (`turbo` and `knip` were unavailable). The commit completed and all plan-required static gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Ready for the batch-A deployment and allowed/disallowed-origin smoke checkpoint after merge.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
