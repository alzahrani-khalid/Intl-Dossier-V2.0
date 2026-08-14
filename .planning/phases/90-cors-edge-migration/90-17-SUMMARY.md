---
phase: 90-cors-edge-migration
plan: 17
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Origin-validated request-scoped CORS headers for ten Group-A edge functions
  - Request-scoped CORS propagation through search-template and batch-translation helpers
affects: [90-32-batch-a-deploy, CORS-02]

tech-stack:
  added: []
  patterns: [request-scoped getCorsHeaders, shared CORS preflight handler]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-17-SUMMARY.md
  modified:
    - supabase/functions/search-suggest/index.ts
    - supabase/functions/search-templates/index.ts
    - supabase/functions/search/index.ts
    - supabase/functions/semantic-search-unified/index.ts
    - supabase/functions/staff-availability/index.ts
    - supabase/functions/tasks-create/index.ts
    - supabase/functions/tasks-update/index.ts
    - supabase/functions/teams-bot/index.ts
    - supabase/functions/themes/index.ts
    - supabase/functions/translate-content/index.ts

key-decisions:
  - Thread the request-scoped headers through search-template helpers and derive them from the existing Request parameter in the batch-translation helper because both files had module-scope consumers.

patterns-established:
  - Handler entry computes getCorsHeaders(req), and OPTIONS delegates to handleCorsPreflightRequest(req).

requirements-completed: [CORS-02]

duration: 10 min
completed: 2026-07-13
---

# Phase 90 Plan 17: Group-A CORS Migration Summary

**Ten edge functions now use origin-validated request-scoped CORS headers and the shared preflight handler.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-13T10:29:00Z
- **Completed:** 2026-07-13T10:39:38Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound validated headers to every response path, including the module-scope helpers in `search-templates` and `translate-content`.
- Removed every wildcard CORS source and routed all ten OPTIONS branches through the shared preflight helper.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `ec9ee401` (fix)

## Decisions Made

- Passed the handler-local `corsHeaders` object into all five `search-templates` route helpers.
- Recomputed validated headers in `handleBatchTranslation(req, ...)`, which already receives the request, avoiding a new parameter solely for CORS.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected two handler-scope classifications**

- **Found during:** Task 1
- **Issue:** `search-templates/index.ts` and `translate-content/index.ts` were classified as handler-scope, but module-scope helpers also spread `corsHeaders`.
- **Fix:** Passed the request-scoped object into the search-template helpers and derived it from the existing request parameter in the batch-translation helper.
- **Files modified:** `supabase/functions/search-templates/index.ts`, `supabase/functions/translate-content/index.ts`
- **Verification:** No deprecated import, wildcard, unbound spread, changed non-preflight response body, or changed non-preflight status remains.
- **Committed in:** `ec9ee401`

**Total deviations:** 1 auto-fixed bug. **Impact:** Required for correct origin validation; no scope expansion or non-preflight response contract change.

## Verification

- Required `grep -L "getCorsHeaders"` loop printed nothing.
- Wildcard `Access-Control-Allow-Origin` matches: `0` for single- and double-quoted forms.
- Deprecated static `_shared/cors.ts` imports: `0`.
- Legacy OPTIONS `new Response(...)` sites: `0`.
- Validated imports, handler-local bindings, and shared preflight calls: `10` each.
- Every `...corsHeaders` spread is backed by a validated request-derived binding.
- Changed non-preflight response body/status lines: none.
- `git diff --check`: passed.

## Issues Encountered

- Repository-aware Deno commands could not start because the workspace configuration references a missing `shared/package.json`.
- `deno fmt --check --no-config` parsed all ten files but reported their existing whole-file formatting as nonconformant; applying it would violate the surgical-diff requirement.
- `deno check --no-config` reached all ten files and reported 32 existing Supabase generic/API diagnostics on untouched logic; it reported no undefined `corsHeaders` or wrong-argument-count diagnostic from this migration.
- The commit hook attempted the workspace build and Knip checks, but dependencies are absent in this isolated worktree (`turbo` and `knip` were unavailable). The commit completed and all plan-required static gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-A orchestrator checkpoint.

## Next Phase Readiness

- Ready for the batch-A deployment and allowed/disallowed-origin smoke checkpoint after merge.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
