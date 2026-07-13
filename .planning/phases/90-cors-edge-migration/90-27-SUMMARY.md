---
phase: 90-cors-edge-migration
plan: 27
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
  patterns: [request-scoped getCorsHeaders, response-boundary CORS overlay]

key-files:
  created:
    - .planning/phases/90-cors-edge-migration/90-27-SUMMARY.md
  modified:
    - supabase/functions/activity-feed/index.ts
    - supabase/functions/ai-interaction-logs/index.ts
    - supabase/functions/audit-logs-viewer/index.ts
    - supabase/functions/custom-reports/index.ts
    - supabase/functions/dossier-recommendations/index.ts
    - supabase/functions/dossier-relationships/index.ts

key-decisions:
  - 'Applied request-local CORS once at each serve boundary so module-scope responders remain concurrency-safe without per-call plumbing.'
  - 'Used Headers.set rather than object spread so case-normalized legacy header names are replaced instead of combined with the validated value.'
  - 'Preserved each legacy preflight body and status exactly while replacing only its header source.'

patterns-established:
  - 'A Group-C handler may return its unchanged Response to a thin serve boundary that replaces CORS headers while retaining body, status, and statusText.'

requirements-completed: [CORS-03]

duration: 20 min
completed: 2026-07-13
---

# Phase 90 Plan 27: Group-C CORS Migration Summary

**Six module-scope edge functions now apply origin-validated request-scoped CORS without changing response bodies or status codes.**

## Performance

- **Duration:** 20 min
- **Completed:** 2026-07-13
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Removed all local wildcard definitions and deprecated static `corsHeaders` imports from the six functions.
- Bound `getCorsHeaders(req)` at each `serve` boundary and overlaid those headers on every returned response.
- Preserved every existing response body, status, status text, content header, and preflight shape.
- Normalized headers with `Headers.set`, preventing a legacy wildcard and validated origin from being combined into one header value.

## Task Commits

1. **Task 1: Migrate six Group-C functions to request-scoped CORS** - `2a6ccb86` (fix)
2. **Task 1 follow-up: Replace normalized legacy headers instead of combining values** - `11b8c5f4` (fix)

## Files Created/Modified

- `supabase/functions/activity-feed/index.ts` - Removed the local wildcard and applied validated headers after module-scope responders return.
- `supabase/functions/ai-interaction-logs/index.ts` - Removed static utility imports and replaced utility-provided CORS at the response boundary.
- `supabase/functions/audit-logs-viewer/index.ts` - Removed static utility/export CORS and applied validated headers to JSON and export responses.
- `supabase/functions/custom-reports/index.ts` - Removed the local wildcard and applied validated headers after report handlers return.
- `supabase/functions/dossier-recommendations/index.ts` - Replaced the deprecated import and module-scope responder headers.
- `supabase/functions/dossier-relationships/index.ts` - Replaced the deprecated import and covered helper plus create responses.
- `.planning/phases/90-cors-edge-migration/90-27-SUMMARY.md` - Execution and verification record.

## Decisions Made

- Centralized request-specific header application at the existing `serve` boundary, avoiding mutable module state and repetitive plumbing through every Group-C helper.
- Retained the original OPTIONS bodies/statuses instead of routing them through a helper that would change those response bytes or codes.
- Removed the legacy `Access-Control-Max-Age` supplied by shared utility responses before applying restrictive disallowed-origin headers.

## Deviations from Plan

- Used `getCorsHeaders(req)` with a response-boundary overlay instead of `handleCorsPreflightRequest(req)` so the acceptance requirement for byte-identical bodies and statuses remains true.

## Verification

- PASS: all six files contain `getCorsHeaders(req)` and import `getCorsHeaders` from `_shared/cors.ts`.
- PASS: zero wildcard `Access-Control-Allow-Origin` values remain in the six-file chunk.
- PASS: zero deprecated static `corsHeaders` imports remain in the six-file chunk.
- PASS: every remaining `...corsHeaders` spread is bound to the request-local validated object.
- PASS: focused Deno runtime assertion proves the response overlay preserves body, status, and status text, replaces the wildcard with `null`, and removes stale max-age for a disallowed origin.
- PASS: the total six-file migration is 116 changed lines, within the phase's approximately 120-line cap.
- PASS: `git diff --check` is clean.
- Deno parsed all six targets with `--no-config`; full type-checking reports 53 pre-existing errors on unchanged legacy/shared lines.
- Runtime allowed/disallowed-origin deployment smoke remains deferred to the batch-C orchestrator checkpoint as specified.

## Issues Encountered

- Repository-aware Deno checking stops before source checking because the root workspace references a missing `shared/` member in this isolated worktree.
- The no-config Deno check reaches all targets but reports existing Supabase generic and `unknown` catch typing errors outside this CORS change.
- Commit hooks could not run the repository build or Knip because dependencies are absent (`turbo` and `knip` unavailable); both commits completed and all dependency-free gates passed.

## User Setup Required

None - deployment and runtime origin smoke testing belong to the batch-C orchestrator checkpoint.

## Next Phase Readiness

Ready for merge into batch C, followed by the orchestrator deployment and allowed/disallowed-origin smoke checkpoint.

## Self-Check: PASSED

---

_Phase: 90-cors-edge-migration_
_Completed: 2026-07-13_
