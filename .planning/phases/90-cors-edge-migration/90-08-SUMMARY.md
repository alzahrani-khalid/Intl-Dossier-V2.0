---
phase: 90-cors-edge-migration
plan: 08
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten Group-A edge functions
  - Request-scoped CORS propagation through data-retention response helpers
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-08-SUMMARY.md
  modified:
    - supabase/functions/data-retention/index.ts
    - supabase/functions/delegate-permissions/index.ts
    - supabase/functions/document-ocr-process/index.ts
    - supabase/functions/dossier-activity-timeline/index.ts
    - supabase/functions/dossier-field-assist/index.ts
    - supabase/functions/dossier-stats/index.ts
    - supabase/functions/dossier-unified-activity/index.ts
    - supabase/functions/dossiers-archive/index.ts
    - supabase/functions/dossiers-briefs-generate/index.ts
    - supabase/functions/dossiers-create/index.ts

key-decisions:
  - 'Thread request-scoped CORS headers through data-retention helpers because they are module-scoped.'

patterns-established:
  - 'Handler entry computes getCorsHeaders(req), and OPTIONS delegates to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-02]

duration: 10 min
completed: 2026-07-13
---

# Phase 90 Plan 08: Group-A CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-13T10:00:00Z
- **Completed:** 2026-07-13T10:10:05Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound validated headers once per request and preserved existing non-preflight response bodies, status codes, and header spreads.
- Removed every deprecated CORS source and legacy OPTIONS response in the chunk.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `a1732c7c` (fix)

## Files Created/Modified

- `supabase/functions/data-retention/index.ts` - Passes request-scoped validated CORS into module-scope response helpers.
- `supabase/functions/delegate-permissions/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/document-ocr-process/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossier-activity-timeline/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossier-field-assist/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossier-stats/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossier-unified-activity/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossiers-archive/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossiers-briefs-generate/index.ts` - Uses request-scoped validated CORS.
- `supabase/functions/dossiers-create/index.ts` - Uses request-scoped validated CORS.
- `.planning/phases/90-cors-edge-migration/90-08-SUMMARY.md` - Records execution and verification evidence.

## Decisions Made

- Passed `corsHeaders` into the four existing data-retention helpers because those helpers are module-scoped and cannot capture the handler-local binding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected data-retention handler-scope classification**

- **Found during:** Task 1
- **Issue:** `data-retention/index.ts` was classified as handler-scope, but four response helpers use `corsHeaders` outside the request handler.
- **Fix:** Passed the single request-scoped validated header object into each existing helper.
- **Files modified:** `supabase/functions/data-retention/index.ts`
- **Verification:** All four helper call sites receive the validated object; no deprecated import or wildcard remains.
- **Committed in:** `a1732c7c`

**Total deviations:** 1 auto-fixed bug. **Impact:** Required for correct origin validation; no scope expansion or response-body/status change.

## Verification

- Every scoped file imports and uses `getCorsHeaders`; the corrected missing-file check printed nothing.
- Wildcard `Access-Control-Allow-Origin` matches: `0`.
- Deprecated static `_shared/cors.ts` imports: `0`.
- Legacy OPTIONS `new Response(...)` sites: `0`.
- Validated imports, request-local bindings, and preflight helper calls: `10` each.
- Changed non-preflight response body/status lines: none.
- `git diff --check`: passed.

## Issues Encountered

- Default `deno check` auto-discovered a parent workspace configuration whose `shared/` member is absent in this isolated worktree. `deno check --no-config` reached `data-retention` but reported six existing Supabase type-inference errors on unchanged client/helper contracts.
- The commit hook attempted the repository build and Knip checks, but this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The plan's required worker-side static gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Ready for the batch-A deployment and allowed/disallowed-origin smoke checkpoint after merge.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
