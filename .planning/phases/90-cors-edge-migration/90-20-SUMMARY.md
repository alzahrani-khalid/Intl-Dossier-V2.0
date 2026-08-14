---
phase: 90-cors-edge-migration
plan: 20
status: complete
requirements: [CORS-03]
---

# 90-20 Summary: Group-B chunk 2/8 CORS migration

Migrated 9 Group-B (local-wildcard handler-scope) edge functions off the
deprecated wildcard CORS onto the origin-validated `_shared/cors.ts` helper.
Code-migration only — deploy + smoke happens at the batch-B orchestrator
checkpoint.

## Files migrated

| Function | Notes |
| --- | --- |
| content-expiration-processor | handler-scope only |
| content-expiration | corsHeaders threaded into handleGet/handlePost/handlePut |
| contextual-suggestions | handler-scope only |
| cqrs-commands | handler-scope only |
| cqrs-queries | handler-scope only |
| deliverables | corsHeaders threaded into all 10 module-level helpers |
| detect-overdue-commitments | handler-scope only |
| document-annotations | handler-scope only |
| document-classification | handler-scope only |

## Transformation applied (identical, per 90-RESEARCH.md section 2.B)

- Deleted the local `const corsHeaders = { 'Access-Control-Allow-Origin': '*', ... }` block
- Added `import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'`
- Inserted `const corsHeaders = getCorsHeaders(req)` as the first handler statement
- Replaced the OPTIONS preflight with `return handleCorsPreflightRequest(req)`
- Left every `...corsHeaders` spread unchanged

Two files (`deliverables`, `content-expiration`) referenced `corsHeaders`
inside module-level helper functions; the per-request headers are threaded
through as a `corsHeaders: Record<string, string>` parameter — the same
pattern already merged in `data-retention` and `compliance`.

## Verification

- Every file in the chunk matches `getCorsHeaders(` (grep -L prints nothing)
- Zero `Access-Control-Allow-Origin` literals remain in the chunk (wildcard gone)
- Zero deprecated static `corsHeaders` imports from `_shared/cors.ts`
- Every `...corsHeaders` spread is bound to the validated object
- `deno check` on all 9 files: only pre-existing errors (untyped `catch`
  `error`, supabase-js generic mismatches on untouched lines); nothing new

## Deviations

None. Runtime smoke (allowed origin unchanged / disallowed origin → `null`)
is deferred to the batch-B deploy checkpoint per plan.
