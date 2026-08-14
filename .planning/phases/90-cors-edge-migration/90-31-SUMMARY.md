---
phase: 90-cors-edge-migration
plan: 31
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders and handleCorsPreflightRequest helpers
provides:
  - Two Group-C edge functions using request-scoped, origin-validated CORS headers
  - Request-scoped CORS threading through module-scope response helpers
affects: [90-34-batch-c-deploy-smoke, CORS-03]

tech-stack:
  added: []
  patterns:
    - Response-helper factory for module handlers
    - Function.prototype.bind for high-call-count handler-local response helpers

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-31-SUMMARY.md
  modified:
    - supabase/functions/workflow-rules/index.ts
    - supabase/functions/working-groups/index.ts

key-decisions:
  - Passed one request-scoped response-helper pair through workflow rule route handlers.
  - Bound working-group response helpers once per request to avoid repetitive call-site edits.

patterns-established:
  - Each handler computes getCorsHeaders(req) before preflight handling.
  - OPTIONS requests use handleCorsPreflightRequest(req); non-preflight response bodies and statuses remain unchanged.

requirements-completed: [CORS-03]

duration: 10min
completed: 2026-07-13
---

# Phase 90 Plan 31: Group-C CORS Migration Summary

**Workflow rules and working groups now use request-scoped, origin-validated CORS headers on every response path.**

## Accomplishments

- Removed the deprecated static CORS import and local wildcard CORS object from the two-function chunk.
- Added one `getCorsHeaders(req)` binding and validated preflight path to each handler.
- Preserved existing non-preflight response bodies and status expressions while threading headers through module-scope helpers.

## Task Commits

1. **Task 1: Migrate 2 Group-C functions to getCorsHeaders** - `8aad9111` (fix)

## Decisions Made

- Reused the established Group-C response-helper factory for workflow rule module handlers.
- Used native `Function.prototype.bind` for working-group response helpers with many call sites.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The repository pre-commit build could not run because this isolated worktree has no `node_modules`; `turbo` and `knip` were unavailable. The commit completed and the worker acceptance checks remained runnable.
- Root Deno commands cannot load the incomplete `shared` workspace member. `deno check --no-config` reports the same 20 Supabase schema/generic errors before and after this migration, with no new type-check error count.

## Verification

- PASS: both files import and call `getCorsHeaders(req)`.
- PASS: wildcard `Access-Control-Allow-Origin: '*'` grep returns 0 matches.
- PASS: deprecated static `corsHeaders` import grep returns 0 matches.
- PASS: both handlers route OPTIONS through `handleCorsPreflightRequest(req)`.
- PASS: non-preflight response body and status expressions are unchanged.
- PASS: `git diff --check`.
- BASELINE-PARITY: `deno check --no-config` reports 20 existing errors on both `HEAD^` and the migrated files.

## Next Phase Readiness

- Ready for the orchestrator-owned batch-C deploy and allowed/disallowed-origin smoke checks in plan 90-34.
- No deployment was attempted from the worker sandbox.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
