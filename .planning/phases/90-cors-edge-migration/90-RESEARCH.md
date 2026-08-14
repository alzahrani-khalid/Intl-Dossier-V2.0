# Phase 90 — CORS Edge-Function Migration — RESEARCH

**Goal**: Every edge function leaves the deprecated wildcard `Access-Control-Allow-Origin: '*'`
(imported static `corsHeaders` OR a local `const corsHeaders = { '*' }` copy) and uses the
origin-validated helper from `supabase/functions/_shared/cors.ts`. Zero functional regression
from allowed origins. Final gate: repo-wide grep for the deprecated wildcard returns 0.

This is a **mechanical, identical** transformation applied ~271 times. This document pins the
EXACT target API, the three transformation shapes, the confirmed file partition, and the batch /
deploy structure so every plan applies the same edit.

---

## 1. Confirmed target API (`supabase/functions/_shared/cors.ts`)

Read directly from source. Exports:

- `getCorsHeaders(request: Request): Record<string,string>` — origin-validated. Returns the
  request's `origin` in `Access-Control-Allow-Origin` **only if** it is in `ALLOWED_ORIGINS`
  (env, comma-split) or a localhost default in dev; otherwise returns `Access-Control-Allow-Origin: 'null'`.
- `handleCorsPreflightRequest(request: Request): Response` — `204` with `getCorsHeaders(request)`.
- `corsHeaders` — **DEPRECATED** static object with `'Access-Control-Allow-Origin': '*'`. This is
  the pattern being removed.

`_shared/security.ts` already ships an equivalent origin-validated helper (line 213–217:
`'Access-Control-Allow-Origin': origin || '*'` guarded behind `isAllowedOrigin(origin)`), i.e. the
`origin || '*'` there is only reached for an already-allow-listed origin — it is NOT the wildcard
being removed. Do **not** touch `_shared/`.

### Canonical already-migrated reference: `supabase/functions/reactivate-user/index.ts`

```ts
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
// ...
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req) // FIRST statement in the handler
  // ...
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }
  // ...every `...corsHeaders` spread below is UNCHANGED — now origin-validated
})
```

**Key insight**: because `corsHeaders` is re-bound to a handler-local `const corsHeaders =
getCorsHeaders(req)`, every existing `...corsHeaders` spread and `{ headers: corsHeaders }` site
keeps working with **no edit**. The diff is tiny (import line + one inserted line + the OPTIONS
swap), independent of how many response sites the file has. This is why the migration is safe and
parseable.

---

## 2. The three transformation shapes

### Group A — import-static, handler-scope (170 files)

File imports `{ corsHeaders }` from `../_shared/cors.ts` and references it only inside the request
handler.

1. Change import to `import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'`
   (drop `corsHeaders`; keep any other named imports from that module).
2. Insert `const corsHeaders = getCorsHeaders(req)` as the first statement inside the handler
   (use the handler's actual request param name — usually `req`).
3. Replace the OPTIONS preflight body `return new Response(null, { headers: corsHeaders })` (or
   `'ok'` variant) with `return handleCorsPreflightRequest(req)`.
4. Leave every `...corsHeaders` spread untouched.

≈ 3 changed lines / file.

### Group B — local wildcard def, handler-scope (75 files)

File declares its own `const corsHeaders = { 'Access-Control-Allow-Origin': '*', ... }` at module
scope and references it only inside the handler.

1. **Delete** the local `const corsHeaders = { ... }` block.
2. Add `import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'`.
3. Insert `const corsHeaders = getCorsHeaders(req)` as first statement in the handler.
4. Swap the OPTIONS preflight to `return handleCorsPreflightRequest(req)`.

≈ 7–9 changed lines / file.

### Group C — module-scope usage (26 files) — CAREFUL

`corsHeaders` is referenced **outside** the request handler's lexical scope: from a module-scope
helper (`function errorResponse(...) { headers: { ...corsHeaders } }`), or the file defines a
`function corsHeaders(extra)` factory (e.g. `waiting-queue-filters`). The handler-local re-bind
trick alone does NOT cover these references.

Per file:

1. Change/add the import to `getCorsHeaders` (+ `handleCorsPreflightRequest`).
2. Compute `const corsHeaders = getCorsHeaders(req)` in the handler AND thread the origin-validated
   headers into every module-scope helper that used the old `corsHeaders` — add a `cors:
Record<string,string>` parameter to the helper and pass `corsHeaders` at each call, OR move the
   helper inside the handler. For a `function corsHeaders(extra)` factory, rewrite its body to
   spread `getCorsHeaders(req)` (thread `req`).
3. Delete any local wildcard `const corsHeaders = { '*' }` if present.
4. No `...corsHeaders` reference may remain bound to the deleted static/ wildcard source.

≈ 10–25 changed lines / file. These are the hardest and get smaller plan chunks.

### Group D — inline hard-coded wildcard, no `corsHeaders` variable (8 files) — added post-plan-check

The FOURTH shape, missed by the initial variable-based partition and surfaced by the plan-checker:
the file hard-codes `'Access-Control-Allow-Origin': '*'` **inline** in one or more response header
objects, with NO `corsHeaders` variable and NO `_shared/cors` import. The variable-scan in §3
(which keyed on a `corsHeaders` reference) did not see these — but the final repo-wide grep gate
(90-34) does, so they MUST be covered or the phase dead-ends at its own gate.

Per file: add `import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'`;
add `const corsHeaders = getCorsHeaders(req)` at the top of the handler; replace every inline
`{ 'Access-Control-Allow-Origin': '*', ... }` object with `...corsHeaders` (preserving non-CORS
headers); route OPTIONS through `handleCorsPreflightRequest(req)`. `ocr-extract` has 3 inline
sites; `scenario-sandbox` inlines inside MODULE-SCOPE helpers (`createErrorResponse` /
`createSuccessResponse`) and must thread the validated headers in per §2.C.

The 8 Group-D files: activate-account, initiate-password-reset, reset-password,
push-device-register (handler-scope, plan 90-35); ocr-extract, push-notification-send,
scenario-sandbox, waiting-queue-escalation (multi-site / module-scope, plan 90-36).

---

## 3. Confirmed partition (scripted over `supabase/functions/**`, `_shared` excluded)

| Group                                                   | Count   | Shape | Plans             | Deploy batch    |
| ------------------------------------------------------- | ------- | ----- | ----------------- | --------------- |
| A (import-static, handler-scope)                        | 169     | §2.A  | 90-02..18         | **A** (CORS-02) |
| B (local-wildcard, handler-scope)                       | 75      | §2.B  | 90-19..26         | **B** (CORS-03) |
| C (module-scope)                                        | 26      | §2.C  | 90-27..31         | **C** (CORS-03) |
| D (inline hard-coded wildcard)                          | 8       | §2.D  | 90-35, 90-36      | **C** (CORS-03) |
| already-migrated (`reactivate-user`, `deactivate-user`) | 2       | —     | skip (no-op)      | —               |
| **Total to migrate**                                    | **278** |       | 90-02..31, 35, 36 |                 |

A ≈ the roadmap's "~171 handler-scope" (CORS-02). B + C + D = 109 ≈ the roadmap's "~101 module-scope
incl local copies" (CORS-03), the +8 being the inline shape the roadmap estimate didn't separate
out. Verified: union of `files_modified` across the 32 migration plans = **278 files, zero gaps,
zero duplicates** against the repo-wide need set (any file with an inline wildcard value OR a static
`corsHeaders` import). `deactivate-user`/`reactivate-user` already use `getCorsHeaders` and are
excluded. Exact per-plan file lists are enumerated in each PLAN's `files_modified`.

### Group C files (all 26, careful handling)

activity-feed, ai-interaction-logs, audit-logs-viewer, custom-reports, dossier-recommendations,
dossier-relationships, engagement-briefs, engagement-dossiers, engagement-recommendations,
entity-duplicates, event-store, field-history, field-permissions, geographic-visualization, mous,
persons, relationship-health, slack-bot, stakeholder-influence, stakeholder-timeline,
team-collaboration, topics, waiting-queue-filters, workflow-executor, workflow-rules, working-groups.

---

## 4. Batch / plan structure (operator-bound)

**Hard cap (operator ruling 2026-07-13)**: each PLAN.md's merged diff ≤ ~10 files and ≤ ~120
changed lines — the fable acceptance judge produces unparseable output on large diffs. With the
tiny per-file diffs above the binding limit is the **10-file cap**, so plans chunk at 10 files (A/B)
or 6 files (C, heavier diffs).

- **90-01 — CORS-01 secret verification** (orchestrator / manual, gates all deploys). READ-ONLY:
  confirm `ALLOWED_ORIGINS` present + correct in staging AND prod via Supabase MCP. No code, no
  deploy. Deploy checkpoints depend on it.
- **90-02 … 90-18 — Group A migration** (17 worker plans, ≤10 files each). Deploy batch A.
- **90-19 … 90-26 — Group B migration** (8 worker plans, ≤10 files each). Deploy batch B.
- **90-27 … 90-31 — Group C migration** (5 worker plans, ≤6 files each). Deploy batch C.
- **90-35 / 90-36 — Group D migration** (2 worker plans, 4 files each — inline-wildcard, added
  post-plan-check). Deploy batch C.
- **90-32 / 90-33 / 90-34 — Deploy + smoke checkpoints** for batches A / B / C (orchestrator-only,
  Supabase MCP). Batch C (90-34) deploys Groups C **and** D (34 functions) and runs the final
  repo-wide grep gate (0 matches). **Staging only** — no prod deploy in this phase.

**36 plans total.** Migration plans 90-02..31, 35, 36 (32 plans, 278 files); orchestrator
checkpoints 90-01 (secret verify) + 90-32/33/34 (deploy+smoke).

### Worker vs orchestrator split (operator-bound)

Worker worktrees are sandboxed with **no Supabase creds/network** → they CANNOT deploy. Every
migration plan is **CODE-MIGRATION ONLY** and worker-verifiable by grep/static checks (no deploy in
acceptance). `supabase functions deploy` + smoke is an **orchestrator** step modeled as the
checkpoint plans 90-32..34, never a `<task type="auto">`.

### Worker acceptance checks (no deploy, no network)

Per migrated file the worker verifies:

- `grep -L getCorsHeaders <file>` is empty (every file now imports/uses the validated helper).
- No deprecated wildcard remains: `grep -n "Access-Control-Allow-Origin': '\*'" <file>` = 0.
- No deprecated static import remains: the `corsHeaders` name is no longer imported from
  `_shared/cors.ts` (only `getCorsHeaders` / `handleCorsPreflightRequest`).

Type-safety + runtime smoke (allowed-origin request succeeds unchanged; disallowed origin gets
`null`) run at the orchestrator deploy checkpoints.

---

## 5. Pitfalls

1. **Group C module-scope references** — the #1 correctness trap. A naive handler-local re-bind
   leaves `errorResponse()` / factory helpers referencing a now-undefined or still-wildcard
   `corsHeaders`. Thread the validated headers in (§2.C). This is why C is its own batch with
   smaller chunks.
2. **Multi-line import blocks** — `audit-logs-viewer`, `ai-interaction-logs` import `corsHeaders`
   inside a `{ ... }` block spanning lines; edit the block, don't assume a one-line import.
3. **Handler param name** — not always `req` (`request`, `_req`). Use the actual param in
   `getCorsHeaders(<param>)`.
4. **Do not touch `_shared/`** — `security.ts`'s `origin || '*'` is guarded and correct.
5. **No prod deploy** — CORS-01 only READS the prod secret; prod ship is a later operator step.
