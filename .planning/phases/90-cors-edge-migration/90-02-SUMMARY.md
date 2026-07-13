---
phase: 90-cors-edge-migration
plan: 02
subsystem: api
tags: [cors, supabase-edge-functions, origin-validation, security]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest shared helpers
provides:
  - Ten Group-A edge functions migrated from deprecated static wildcard CORS to request-scoped validated headers
affects: [90-32-batch-a-deploy-smoke]

tech-stack:
  added: []
  patterns:
    - Bind getCorsHeaders(req) as the first handler statement and delegate OPTIONS to handleCorsPreflightRequest(req)

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-02-SUMMARY.md
  modified:
    - supabase/functions/access-review-detail/index.ts
    - supabase/functions/advanced-search/index.ts
    - supabase/functions/after-actions-approve-edit/index.ts
    - supabase/functions/after-actions-create/index.ts
    - supabase/functions/after-actions-get/index.ts
    - supabase/functions/after-actions-list-all/index.ts
    - supabase/functions/after-actions-list/index.ts
    - supabase/functions/after-actions-publish/index.ts
    - supabase/functions/after-actions-reject-edit/index.ts
    - supabase/functions/after-actions-request-edit/index.ts

key-decisions:
  - Followed the canonical reactivate-user migration exactly and left every existing response header spread unchanged.

patterns-established:
  - Group-A handlers keep the existing corsHeaders variable name but bind it per request from the validated shared helper.

requirements-completed: [CORS-02]

duration: 6 min
completed: 2026-07-13
---

# Phase 90 Plan 02: Group-A CORS Migration Summary

**Ten edge functions now derive CORS headers from the request origin and use the shared validated preflight response.**

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Added one request-scoped `const corsHeaders = getCorsHeaders(req)` binding as the first handler statement in each function.
- Routed all ten OPTIONS branches through `handleCorsPreflightRequest(req)` while leaving non-preflight response bodies, status codes, and header spreads unchanged.

## Task Commit

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `0cdf2c13` (fix)

## Verification

- Required `grep -L "getCorsHeaders"` loop printed nothing.
- Validated shared imports: 10; handler-local bindings: 10; preflight helper calls: 10.
- Deprecated static `_shared/cors.ts` imports: 0.
- Wildcard `Access-Control-Allow-Origin: '*'` definitions in the scoped files: 0.
- `git diff --check` passed; the implementation commit changed only the planned CORS import, handler binding, and OPTIONS return sites (40 insertions, 20 deletions across 10 files).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The commit hook could not run the workspace build/knip commands because this isolated worktree has no `node_modules` (`turbo` and `knip` were unavailable). The plan's worker-side static acceptance gates all passed; deploy and runtime smoke remain assigned to plan 90-32.

## Next Phase Readiness

- This chunk is ready to merge into deploy batch A. Allowed/disallowed-origin runtime smoke remains at the orchestrator checkpoint as planned.

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
