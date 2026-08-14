---
phase: 90-cors-edge-migration
plan: 15
subsystem: edge-functions
tags: [supabase, cors, security]

requires: []
provides:
  - Origin-validated CORS headers for ten Group-A position edge functions
  - Shared preflight handling through _shared/cors.ts
affects: [90-32-batch-a-deploy-smoke]

tech-stack:
  added: []
  patterns:
    - Handler-local CORS headers derived from each request origin

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-15-SUMMARY.md
  modified:
    - supabase/functions/positions-emergency-correct/index.ts
    - supabase/functions/positions-get/index.ts
    - supabase/functions/positions-list/index.ts
    - supabase/functions/positions-publish/index.ts
    - supabase/functions/positions-request-revisions/index.ts
    - supabase/functions/positions-submit/index.ts
    - supabase/functions/positions-unpublish/index.ts
    - supabase/functions/positions-update/index.ts
    - supabase/functions/positions-versions-compare/index.ts
    - supabase/functions/positions-versions-list/index.ts

key-decisions:
  - 'Applied the canonical Group-A transformation without altering response payloads or non-preflight status paths.'

patterns-established:
  - 'Group-A CORS migration: bind getCorsHeaders(req) first in the handler and delegate OPTIONS to handleCorsPreflightRequest(req).'

requirements-completed: [CORS-02]

duration: 9 min
completed: 2026-07-13
---

# Phase 90 Plan 15: Group-A CORS Edge Migration Summary

**Ten position edge functions now derive CORS headers from the request origin and share validated preflight handling.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-13T10:22:00Z
- **Completed:** 2026-07-13T10:31:00Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments

- Replaced all ten deprecated static `corsHeaders` imports with `getCorsHeaders` and `handleCorsPreflightRequest`.
- Bound each existing `corsHeaders` response spread to `getCorsHeaders(req)` at handler scope.
- Removed every wildcard CORS source from the chunk while preserving all non-preflight response bodies and status paths.

## Task Commits

1. **Task 1: Migrate 10 Group-A functions to getCorsHeaders** - `7f2ef211` (fix)

**Plan metadata:** committed with this summary.

## Files Created/Modified

- `.planning/phases/90-cors-edge-migration/90-15-SUMMARY.md` - Plan outcome and verification evidence.
- `supabase/functions/positions-emergency-correct/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-get/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-list/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-publish/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-request-revisions/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-submit/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-unpublish/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-update/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-versions-compare/index.ts` - Origin-validated CORS binding and preflight.
- `supabase/functions/positions-versions-list/index.ts` - Origin-validated CORS binding and preflight.

## Decisions Made

None - followed the plan's canonical Group-A migration exactly.

## Verification

- PASS: all ten files import/use `getCorsHeaders`.
- PASS: zero `Access-Control-Allow-Origin` literals or wildcard values remain in the chunk.
- PASS: zero deprecated static `corsHeaders` imports remain.
- PASS: every file has exactly one handler-local binding and one shared preflight call.
- PASS: task commit scope contains exactly the ten allowed function files, with no deletions.
- PASS: each function has the surgical 4-addition/2-removal diff shape; `git diff --check` is clean.
- Runtime smoke is deferred to the batch-A orchestrator checkpoint as specified by the plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The commit hook could not run the repository build or Knip because this isolated worktree has no installed dependencies (`turbo` and `knip` were unavailable). The plan's dependency-free worker acceptance gates all passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for the Phase 90 batch-A orchestrator deploy and runtime smoke checkpoint.

## Self-Check: PASSED

- Required summary exists on disk.
- Task commit `7f2ef211` exists and contains exactly the ten scoped edge-function files.
- All plan acceptance and verification gates pass.

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
