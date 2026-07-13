---
phase: 90-cors-edge-migration
plan: 14
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten Group-A edge functions
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-14-SUMMARY.md
  modified:
    - supabase/functions/pdf-generate/index.ts
    - supabase/functions/position-analytics-get/index.ts
    - supabase/functions/position-analytics-top/index.ts
    - supabase/functions/position-suggestions-get/index.ts
    - supabase/functions/position-suggestions-update/index.ts
    - supabase/functions/positions-approve/index.ts
    - supabase/functions/positions-consistency-check/index.ts
    - supabase/functions/positions-consistency-reconcile/index.ts
    - supabase/functions/positions-create/index.ts
    - supabase/functions/positions-delegate/index.ts

key-decisions:
  - 'None - followed the mechanical Group-A migration plan as specified.'

patterns-established:
  - 'Handler entry computes getCorsHeaders(req), and OPTIONS delegates to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-02]

duration: 5 min
completed: 2026-07-13
---

# Phase 90 Plan 14: Group-A CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-13T10:24:03Z
- **Completed:** 2026-07-13T10:29:01Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound validated headers once per request while preserving every existing non-preflight response body, status code, and header spread.
- Routed all ten OPTIONS branches through the shared preflight helper with no wildcard CORS source remaining.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `1c8c3fca` (fix)

## Files Created/Modified

- `supabase/functions/pdf-generate/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/position-analytics-get/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/position-analytics-top/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/position-suggestions-get/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/position-suggestions-update/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/positions-approve/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/positions-consistency-check/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/positions-consistency-reconcile/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/positions-create/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/positions-delegate/index.ts` - Uses request-scoped validated CORS.
- `.planning/phases/90-cors-edge-migration/90-14-SUMMARY.md` - Records execution and verification evidence.

## Decisions Made

None - followed the plan's canonical Group-A transformation exactly.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Missing `getCorsHeaders` files: `0`.
- Wildcard `Access-Control-Allow-Origin` matches: `0`.
- Deprecated static `_shared/cors.ts` imports: `0`.
- Validated imports, request-local bindings, and shared preflight calls: `10` each.
- Legacy OPTIONS `new Response(...)` sites: `0`.
- All ten files containing `...corsHeaders` also contain the request-local validated binding.
- Mechanical comparison against the parent commit confirms only imports, handler-local bindings, and preflight returns changed; all non-preflight response bodies and status codes are byte-identical.
- `deno check --no-config` passed for six targets; the four remaining targets reached type checking and reported only pre-existing unknown-catch-variable errors on untouched lines.
- `git diff --check HEAD^ HEAD`: passed.

## Issues Encountered

- The repository-aware Deno check could not load a pre-existing missing `shared/package.json`; `--no-config` bypassed that workspace issue.
- The all-target `deno check --no-config` reported four pre-existing `TS18046` errors in untouched catch blocks. Six targets type-checked cleanly, and all required worker-side static gates passed.
- The commit hook attempted the repository build and Knip checks, but this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The hook completed and the plan's required static gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Ready for the batch-A deployment and allowed/disallowed-origin smoke checkpoint after merge.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
