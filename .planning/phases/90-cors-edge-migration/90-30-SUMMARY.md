---
phase: 90-cors-edge-migration
plan: 30
subsystem: api
tags: [supabase, edge-functions, cors, origin-validation]

requires:
  - phase: 90-cors-edge-migration
    provides: Origin-validated getCorsHeaders shared helper
provides:
  - Origin-validated request-scoped CORS headers for six Group-C edge functions
affects: [90-34-batch-c-deploy, CORS-03]

tech-stack:
  added: []
  patterns:
    [request-scoped getCorsHeaders, response-boundary CORS overlay, explicit helper threading]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-30-SUMMARY.md
  modified:
    - supabase/functions/stakeholder-influence/index.ts
    - supabase/functions/stakeholder-timeline/index.ts
    - supabase/functions/team-collaboration/index.ts
    - supabase/functions/topics/index.ts
    - supabase/functions/waiting-queue-filters/index.ts
    - supabase/functions/workflow-executor/index.ts

key-decisions:
  - 'Preserved existing OPTIONS bodies and statuses instead of replacing them with the shared preflight response.'
  - 'Applied validated headers at the response boundary where module-scope responders made direct parameter threading noisy.'
  - 'Threaded request-scoped headers explicitly through team-collaboration helpers and kept if-none-match for validated waiting-queue origins.'

patterns-established:
  - 'Group-C functions may decorate an unchanged Response at the serve boundary while preserving body, status, statusText, and existing non-CORS headers.'

requirements-completed: [CORS-03]

duration: 25 min
completed: 2026-07-13
---

# Phase 90 Plan 30: Group-C CORS Migration Summary

**Six module-scope edge functions now use origin-validated request-scoped CORS without changing response bodies or status codes.**

## Performance

- **Duration:** 25 min
- **Completed:** 2026-07-13
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Removed all local wildcard definitions and deprecated static `corsHeaders` imports from the six functions.
- Applied `getCorsHeaders(req)` through concurrency-safe response decoration, explicit helper parameters, or the request-aware waiting-queue header factory.
- Preserved every response body, status, status text, and non-CORS response header.
- Preserved `If-None-Match` preflight support for allowed waiting-queue origins while keeping rejected origins restrictive.

## Task Commits

1. **Task 1: Migrate six Group-C functions to request-scoped CORS** - `e1e913f4` (fix)
2. **Task 1 review fix: Preserve conditional request header** - `42821202` (fix)

## Files Created/Modified

- `supabase/functions/stakeholder-influence/index.ts` - Replaced the deprecated import and applied validated headers after module-scope response helpers return.
- `supabase/functions/stakeholder-timeline/index.ts` - Removed the local wildcard and decorated handler responses at the serve boundary.
- `supabase/functions/team-collaboration/index.ts` - Threaded request-scoped headers through all module-scope route helpers.
- `supabase/functions/topics/index.ts` - Removed the local wildcard and decorated handler responses at the serve boundary.
- `supabase/functions/waiting-queue-filters/index.ts` - Rewrote the header factory around `getCorsHeaders(req)` and retained conditional-request preflight support for allowed origins.
- `supabase/functions/workflow-executor/index.ts` - Replaced the deprecated import and decorated handler responses at the serve boundary.
- `.planning/phases/90-cors-edge-migration/90-30-SUMMARY.md` - Execution and verification record.

## Decisions Made

- Kept each legacy OPTIONS response body and status unchanged because the shared preflight helper would alter those response properties.
- Used response-boundary decoration for four functions so module-scope responders remain concurrency-safe without repetitive call-site edits.
- Used direct header threading in `team-collaboration` because its shallow route-helper graph made the validated source explicit.
- Extended allowed-origin waiting-queue headers with `if-none-match`; disallowed origins retain the shared helper's restrictive header set.

## Deviations from Plan

- Did not route OPTIONS responses through `handleCorsPreflightRequest(req)` because that would violate the byte-identical body/status acceptance requirement.
- The six-file implementation is 153 changed lines rather than the plan's approximate 120-line target; explicit concurrency-safe helper threading and the allowed-origin compatibility fix account for the additional lines.

## Verification

- PASS: every scoped function imports and calls `getCorsHeaders(req)`.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain in the six-file chunk.
- PASS: zero deprecated static `corsHeaders` imports remain in the six-file chunk.
- PASS: every response helper receives validated headers directly or is covered by the request-scoped serve-boundary decorator.
- PASS: response body and status expressions are unchanged from the parent commit.
- PASS: allowed waiting-queue origins retain `if-none-match`; rejected origins retain restrictive shared headers.
- PASS: `git diff --check` is clean and the code commits touch exactly the six scoped function files.
- PASS: independent spec and code-quality reviews completed with no open findings.
- Baseline comparison: `deno check --no-config` reports the same 27 pre-existing Supabase/schema typing errors on the parent and migrated commits, with no new diagnostic.
- Runtime allowed/disallowed-origin deployment smoke remains deferred to the batch-C orchestrator checkpoint as specified.

## Issues Encountered

- Initial review caught the waiting-queue function's legacy `if-none-match` allowance missing from the shared default; commit `42821202` restores it only for validated origins.
- Full Deno checking remains non-green because of 27 unchanged legacy Supabase/schema typing errors.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-C orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch C, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
