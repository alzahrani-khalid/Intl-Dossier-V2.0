---
phase: 95-routes-that-don-t-render
plan: 04
subsystem: infra
tags: [vite-proxy, express, tanstack-query, playwright, nginx, monitoring]

requires:
  - phase: 93-trust
    provides: QueryErrorState (the one shared query-error component, variant="inline")
provides:
  - /monitoring document requests reach the SPA route instead of the Vite proxy
  - monitoringContractRouter remounted at /api/monitoring inside the surviving NODE_ENV dev/test guard
  - both enumerated Dashboard callers authenticated via apiGet(..., { baseUrl: 'express' })
  - per-widget inline error states replacing a page with no error branch at all
  - tests/e2e/95-monitoring-mounts.spec.ts — the behavioural oracle for criterion 4
affects: [95-09 (writes the DEAD-04 phase record from this summary), 97 (nav-entry decision)]

tech-stack:
  added: []
  patterns:
    - 'dev/test-only contract routers mount UNDER /api so one proxy rule carries them in dev and prod'
    - 'per-widget isError → QueryErrorState variant="inline" with a distinct testId per region'

key-files:
  created:
    - tests/e2e/95-monitoring-mounts.spec.ts
  modified:
    - backend/src/index.ts
    - frontend/vite.config.ts
    - frontend/src/pages/monitoring/Dashboard.tsx

key-decisions:
  - 'DEAD-04 KEEP the SPA route per RULING-P95-01; mechanism = move the API under /api/monitoring rather than narrow the proxy (narrowing fixes dev only and rots on the next added call)'
  - 'The e2e INTERNAL_STRING regex narrows its bare `supabase` arm to leak-shaped tokens, because this page renders a monitored service literally named `supabase` as product data'

patterns-established:
  - 'Pattern 1: a dev/test-only router that a browser page consumes belongs under /api — the generic /api Vite proxy and nginx `location /api/` then both carry it with zero prod config edit'
  - 'Pattern 2: widget-scoped isError so one failed region never blanks its succeeded siblings'

requirements-completed: [DEAD-04]

duration: 30 min
completed: 2026-08-16
---

# Phase 95 Plan 04: /monitoring mount + caller resolution Summary

**The Vite proxy stopped claiming the bare `/monitoring` prefix, the contract router moved to `/api/monitoring`, and the Dashboard's two enumerated callers now resolve there with the session JWT they never sent — behind a Playwright oracle that drilled red on the pre-fix stack and green on the fixed one.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-08-16T19:37:00Z (approx., first plan read)
- **Completed:** 2026-08-16T20:06:49Z
- **Tasks:** 3
- **Files modified:** 3 modified + 1 created

## Accomplishments

- `/monitoring` document requests reach the SPA (`content-type: text/html`, `MonitoringDashboard` mounts). Before, the proxy answered them from the backend.
- Both enumerated API callers resolve at `/api/monitoring/*` **with** the `Authorization` header — `/api/monitoring/alerts` (`requireAuthHeader`) had **never** worked from this page, because the old bare `fetch` sent no header.
- The perpetual-loading lie is gone: each widget now settles to data or its own inline `QueryErrorState`. The page previously had **no error branch at all**.
- The dev/test `NODE_ENV` guard survived the remount — production exposes no new route.

## Task Commits

1. **Task 1: Remount at /api/monitoring, delete the proxy claim, authenticate the Dashboard calls** — `46457acb8` (fix)
2. **Task 2: Ruling conditions 2 (nginx) and 1 (resolution evidence)** — no files in scope; its deliverable is the evidence pasted below, carried by the SUMMARY commit
3. **Task 3: Behavioural oracle — 95-monitoring-mounts.spec.ts** — `fd11f2218` (test)

Content re-verified at `HEAD=fd11f2218a02121c3b862699714f7bb2a59fd5db` after sibling-lane traffic (one sibling recorded an amend that clobbered another lane's commit, so this was checked rather than assumed):

```
$ git merge-base --is-ancestor 46457acb8 HEAD   → YES ancestor of HEAD
backend remount:        1
proxy entry population: 6
/monitoring proxy key:  0
apiGet express calls:   3
QueryErrorState refs:   4
spec @covers line:      // @covers DEAD-04
```

## Files Created/Modified

- `backend/src/index.ts` — `monitoringContractRouter` mounts at `/api/monitoring`, still inside `if (NODE_ENV === 'development' || 'test')`, registered before `app.use('/api', apiRouter)` so it wins the path in dev/test and 404s from the real API router in prod.
- `frontend/vite.config.ts` — the `'/monitoring'` proxy entry deleted; the generic `'/api'` entry carries the moved calls.
- `frontend/src/pages/monitoring/Dashboard.tsx` — both calls via `apiGet(path, { baseUrl: 'express' })`; per-widget `isError` → `QueryErrorState variant="inline"` (testIds `monitoring-health-error`, `monitoring-alerts-error`); local `fetchJSON` helper deleted as orphaned.
- `tests/e2e/95-monitoring-mounts.spec.ts` — NEW, 2 tests, `--no-deps`, inline auth, natural network.

## RULING-P95-01 condition evidence

### Condition 1a — mechanical enumeration, post-change

```
$ command grep -rn "'/monitoring" frontend/src --include='*.ts' --include='*.tsx' | command grep -v routeTree.gen
frontend/src/components/modern-nav/navigationData.ts:262:        path: '/monitoring',
```

Residual population is **exactly the nav entry** (a route link — P97's concern). Zero API-call hits. The `navigationData` hit is itself the instrument test: the sweep demonstrably still sees matches, so the zero on API calls is a real zero, not a broken command.

Instrument test that the same sweep can see the **moved** calls (2/2, unchanged population size):

```
$ command grep -rn "'/api/monitoring" frontend/src --include='*.ts' --include='*.tsx' | command grep -v routeTree.gen
frontend/src/pages/monitoring/Dashboard.tsx:50:    queryFn: () => apiGet<HealthResponse>('/api/monitoring/health', { baseUrl: 'express' }),
frontend/src/pages/monitoring/Dashboard.tsx:61:    queryFn: () => apiGet<Alert[]>('/api/monitoring/alerts', { baseUrl: 'express' }),
```

### Condition 1b — derived proxy-entry population, pre/post (the sibling-untouched proof)

```
$ command grep -cE "^\s+'/[^']*': \{" frontend/vite.config.ts
7      # at HEAD 2c8013208, pre-edit  (matches the orchestrator's leg-start premise)
6      # post-edit
$ command grep -cF "'/monitoring':" frontend/vite.config.ts  → 0
$ command grep -cF "'/api':"        frontend/vite.config.ts  → 1   (positive pin, instrument-tests the read)
```

Surviving entries, post-edit — exactly the six siblings, none touched:

```
102:      '/api/copilot': {
110:      '/api': {
114:      '/ai': {
118:      '/analytics-dashboard': {
122:      '/organization-benchmarks': {
126:      '/notifications-center': {
```

### Condition 1c — the two callers shown to resolve (curl, run at execution against the live dev stack)

GATE LABEL honoured: this half was `UNPROVEN` pre-execution (needs a running dev stack). It was run, never faked. See Deviation 1 — the stack had to be repaired first.

```
1) /api/monitoring/health via :5173  -> 200                 (expect 200)
2) /api/monitoring/alerts (no token) -> 401                 (expect 401)
3) /monitoring content-type          -> text/html           (expect text/html)
```

Line 2's 401 is the proof of resolution: `requireAuthHeader` is a presence-check on the backend router, so a 401 means the request reached that router. The in-app **authenticated** 200 is asserted by the Task 3 spec (observed: `health[0]=200`, `alerts[0]=200`).

Instrument test on line 3 — the body really is the SPA document, not a coincidental content-type:

```
$ curl -s http://localhost:5173/monitoring | head -c 60
<!doctype html>
<html lang="en">
  <head>
```

### Condition 2 — production reverse proxy (re-derived in this plan)

```
$ command grep -n "location" deploy/nginx/*.conf
deploy/nginx/nginx.conf:67:        location /.well-known/acme-challenge/ {
deploy/nginx/nginx.conf:78:        location /health {
deploy/nginx/nginx.conf:85:        # /api/ location so the more-specific prefix wins. Trailing slash on
deploy/nginx/nginx.conf:91:        location /api/copilot/ {
deploy/nginx/nginx.conf:109:        location /api/ {
deploy/nginx/nginx.conf:126:        location /ws/ {
deploy/nginx/nginx.conf:139:        location / {
deploy/nginx/nginx.conf:168:    #     # ... same location blocks as above ...
deploy/nginx/nginx.initial.conf:33:        location /.well-known/acme-challenge/ {
deploy/nginx/nginx.initial.conf:38:        location /health {
deploy/nginx/nginx.initial.conf:45:        location /api/ {
deploy/nginx/nginx.initial.conf:55:        location /ws/ {
deploy/nginx/nginx.initial.conf:65:        location / {
deploy/nginx/nginx.newapp.example.conf:67:        location /health {
deploy/nginx/nginx.newapp.example.conf:74:        location /api/ {
deploy/nginx/nginx.newapp.example.conf:91:        location /ws/ {
deploy/nginx/nginx.newapp.example.conf:103:        location / {
deploy/nginx/nginx.prod.conf:67:        location /.well-known/acme-challenge/ {
deploy/nginx/nginx.prod.conf:72:        location / {
deploy/nginx/nginx.prod.conf:102:        location /health {
deploy/nginx/nginx.prod.conf:109:        # /api/ location so the more-specific prefix wins. Trailing slash on
deploy/nginx/nginx.prod.conf:115:        location /api/copilot/ {
deploy/nginx/nginx.prod.conf:133:        location /api/ {
deploy/nginx/nginx.prod.conf:150:        location /ws/ {
deploy/nginx/nginx.prod.conf:163:        location / {
```

**Zero `/monitoring` location claims** across all four conf files. The zero is instrument-tested against the known-present `location /api/`, which appears in all four. **No nginx file was edited** — none needed editing, and none was touched.

The zero-edit claim rests on `proxy_pass` having no URI part, re-verified here (`nginx.prod.conf:133-136`):

```
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend;
```

No URI part → nginx forwards the full original request URI, so `/api/monitoring/health` reaches the backend as `/api/monitoring/health`.

## DEAD-04 decision for the record

_(Condition 3 hand-off. Plan 95-09 writes the physical phase-record file `95-DEAD-04-DECISION.md` and the `REQUIREMENTS.md` register note FROM this section — single-writer rule, D-17. This plan deliberately did not touch either path.)_

- **Decision: KEEP** the `/monitoring` SPA route, per **`RULING-P95-01-PARK-MONITORING.md`** (branch (a): keep the SPA route; the proxy stops claiming the bare `/monitoring` prefix). Ruled 2026-08-16 by the overseer under the operator's standing delegation; the operator did not sign it.
- **Mechanism** (the planner's choice, decided against the mechanical enumeration as the ruling requires): the **API moved to `/api/monitoring`** — `backend/src/index.ts` remounts `monitoringContractRouter` there inside the surviving `NODE_ENV` dev/test guard — the **Vite `/monitoring` proxy entry was deleted**, and the **Dashboard's calls are now authenticated** through `apiGet(path, { baseUrl: 'express' })`.
  - Rejected alternative: narrowing the proxy to exact sub-paths. It fixes dev only (in prod those calls still hit the SPA fallback and JSON-parse-fail) and silently rots the moment the Dashboard adds a call.
- **Enumeration: 2/2 resolving.** The caller population is exactly 2 (`/api/monitoring/health`, `/api/monitoring/alerts`), enumerated mechanically rather than by hand; both are shown resolving by the curl evidence and by the e2e (`200`/`200` observed in-app).
- **Production carries no mirroring claim** — zero `/monitoring` locations in `deploy/nginx/*.conf`, and zero nginx edits were required.
- **What Phase 97 inherits:** branch (a) leaves P97 a **nav-entry decision** — `frontend/src/components/modern-nav/navigationData.ts:262` (`path: '/monitoring'`) is the sole residual reference and is out of scope here.
- **Production exposure is unchanged:** the router remains dev/test-only. In production the guard is false and `/api/monitoring` 404s from the real API router.

## C9b consumer disposition — `frontend/tests/unit/monitoring.dashboard.test.tsx`

**MOCKED → NON-ORACLE (D-16). Disposition: UNAFFECTED — left byte-unchanged; green before and after.**

Observed: `pnpm exec vitest run tests/unit/monitoring.dashboard.test.tsx` → **exit 0**, `Test Files 1 passed (1) / Tests 1 passed (1)`, 53–72 ms.

**Why it stayed green** (the plan predicted a likely red, so the seams that carried it are named explicitly):

1. **The stub's URL dispatch survives the prefix change by substring.** It dispatches on `String(url).includes('/monitoring/health')`, and the new path `'/api/monitoring/health'` **contains** that substring. The stub keeps feeding the queries at the new path without knowing the path changed.
2. **`getAuthHeaders()` resolves without blocking.** `apiGet` awaits `supabase.auth.getSession()`; the client is `persistSession: true`, so with no session in the jsdom storage shim it returns `session: null` from storage with no network round-trip (the test settles in ~53 ms, and MSW's `onUnhandledRequest: 'error'` raised nothing). The request goes out with `Bearer undefined` — harmless here, since `vi.stubGlobal('fetch', …)` answers it regardless.

**It is NEVER cited for criterion 4.** It asserts only the `h1`/`h2` headings, which render whether the queries succeed, fail, or hang — it would stay green against a completely broken page. The behavioural oracle is Task 3's spec.

## Gate observations (every gate run, exit observed directly)

| Gate                                 | Direction             | Observation                                                                     |
| ------------------------------------ | --------------------- | ------------------------------------------------------------------------------- |
| Task 1 `<automated>`                 | **RED (pre-work)**    | exit **1** at `HEAD 2c8013208` — no `/api/monitoring` mount, proxy population 7 |
| Task 1 `<automated>`                 | **GREEN (post-work)** | exit **0**, vitest `1 passed`                                                   |
| Task 2 `<automated>` (nginx)         | GREEN                 | exit **0**                                                                      |
| Task 3 `<automated>` (e2e)           | **RED (drilled)**     | exit **1**, `2 failed` — see below                                              |
| Task 3 `<automated>` (e2e)           | **GREEN**             | exit **0**, `2 passed (3.6s)`                                                   |
| Plan `<verification>` re-run at HEAD | GREEN                 | V1 exit **0**, V2 exit **0**, V3 exit **0**                                     |

**Task 3 red drill (the `UNPROVEN` green-direction label, both directions drilled at execution).**
Run in isolation so no sibling lane was disturbed: a temporary, untracked config
(`frontend/vite.config.dead04-red-drill.mts`, deleted afterwards — verified absent) re-added the
deleted proxy entry on a **separate port 5299**, and the committed spec ran against it via
`E2E_BASE_URL`. `frontend/vite.config.ts` was never made dirty.

```
RED-stack /monitoring content-type -> application/json; charset=utf-8
✘ 1 … the /monitoring document request reaches the SPA, never raw backend JSON (2.3s)
    Expected pattern: /^text\/html/
    Received string:  "application/json; charset=utf-8"
✘ 2 … both enumerated API callers resolve in-app and every widget settles (17.4s)
2 failed
```

Two independent pre-work reds were also observed on the real stack before the fix, at the same
measurement Test 1 makes: `text/plain; charset=UTF-8` (backend 404) and, once the real backend was
up but Vite still held the old config, `application/json; charset=utf-8`. Never HTML.

## Decisions Made

- **Mechanism: move the API, do not narrow the proxy.** Narrowing is dev-only and rots on the next added call; moving works in dev (generic `/api` Vite entry) and prod (nginx `location /api/`, `proxy_pass` with no URI part) with zero nginx edit.
- **Mount order in `backend/src/index.ts`:** `/api/monitoring` is registered inside the dev/test guard at :83-90, i.e. **before** `app.use('/api', apiRouter)` at :93. Express matches in registration order, so the contract router wins the path in dev/test, while in production the guard is false and the path 404s from the real API router. `backend/src/api/index.ts` has no `monitoring` route, so there is no shadowing either way.
- **Distinct `testId` per inline error** (`monitoring-health-error` / `monitoring-alerts-error`) instead of the component's shared `query-error-inline` default — two widgets can fail at once, and duplicate testids would make the spec's locators ambiguous.
- **No visual redesign.** The page keeps its existing plain markup per the plan; only the error branches were added, via the token-bound shared component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The dev stack served no Express backend at all**

- **Found during:** Task 2 (the curl evidence half, labelled `UNPROVEN — needs the running dev stack`)
- **Issue:** Two independent faults. (a) A stale `agent-runtime` process (PID 14622, started 14:15) was bound to **:5001** — the Express backend's port, and the Vite proxy target — answering `{"status":"ok","service":"agent-runtime"}` on `/health`. Every backend `tsx watch` in the tree had therefore failed to bind. (b) With :5001 freed, the backend still refused to boot: `Error: Missing Supabase environment variables` — `backend/.env` carries only the three `VAPID_*` keys, and the root `.env` is empty.
- **Fix:** Killed the stale agent-runtime tree (PIDs 14604 + 14622) and started the Express backend with `NODE_ENV=development PORT=5001`, injecting `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` from the root `.env.test` into that process's environment only. Values were never echoed, never written to any file, and nothing was committed. Verified: `/health` → `{"status":"ok","environment":"development"}` (so the dev/test-guarded contract routers are mounted).
- **Files modified:** none — process/environment only.
- **Verification:** the three Task 2 curl lines returned 200 / 401 / text/html.
- **Committed in:** n/a (no repo change).

**2. [Rule 3 - Blocking] The :5173 Vite server was still serving its pre-edit proxy table**

- **Found during:** Task 2 (curl line 3 returned `application/json` after the proxy entry was already committed)
- **Issue:** The running dev server (PID 52305, started 19:37 — before the edit) had not restarted on the `vite.config.ts` change, so it still proxied `/monitoring`. A `touch` on the config did not trigger its restart-on-config-change either. The committed fix was correct while the live server contradicted it.
- **Fix:** Restarted the frontend dev server (`pnpm -C frontend dev`). Ready in 492 ms; the blip to sibling lanes was a few seconds, and the restart was required for **any** lane to test the committed config.
- **Files modified:** none — process only.
- **Verification:** `/monitoring` → `text/html` and the served body is `<!doctype html>`; `:5173` re-verified healthy after the red drill too.
- **Committed in:** n/a (no repo change).

**3. [Rule 1 - Bug] The spec's own `INTERNAL_STRING` regex false-positived on product data**

- **Found during:** Task 3 (first full run: test 1 passed, test 2 failed only on this assertion)
- **Issue:** The regex was derived from `93-tasks-queue-error.spec.ts`, whose bare `supabase` arm is sound there. On **this** page it is not: the health widget renders the monitored services by name and one of them is literally named `supabase` (`supabase: healthy (29 ms)`). The assertion flagged intended product data as a leaked internal. Everything the test actually guards had already passed — both callers observed at 200/200, both widgets settled.
- **Fix:** Narrowed that one arm to leak-shaped tokens (`supabase\.co|supabase-js|SupabaseClient`); every other arm unchanged. The reason is documented in the spec itself so a later reader does not "restore" the bare word.
- **Files modified:** `tests/e2e/95-monitoring-mounts.spec.ts`
- **Verification:** instrument-tested in **both** directions before re-running — 9 leak strings (`42501`, `42703`, `42P01`, `permission denied for table x`, `https://abc.supabase.co/rest/v1`, `supabase-js@2`, `SupabaseClient error`, `FunctionsHttpError`, `FunctionsFetchError`) all MATCH; the 3 legitimate rendered strings (`supabase: healthy (29 ms)`, `Overall: healthy`, `No alerts configured`) are all clean. `INSTRUMENT_TEST=PASS`, exit 0. Gate then green.
- **Committed in:** `fd11f2218` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 3 blocking — both environment-only, no repo change; 1 Rule 1 bug in this plan's own new test).
**Impact on plan:** No scope creep and no plan mechanism changed. Two deviations were dev-stack repairs needed to run gates the plan itself labelled `UNPROVEN — needs the running dev stack`; the third corrected an over-broad assertion in this plan's own new spec, and the correction was instrument-tested rather than assumed.

## Issues Encountered

- **The Task 1 gate caught my own doc comment.** The first version of the `Dashboard.tsx` header comment quoted the old literal (`fetch('/monitoring/...')`), which re-armed both the `'/monitoring/`-count conjunct and the repo-wide enumeration conjunct. The gate went red, the comment was reworded, and the gate went green. Recording it because it is evidence the enumeration gate is load-bearing rather than decorative — it fails on a **comment**, not just on a call.
- **`git show "$SHA:frontend/..."` silently returned zeros** under zsh: `:f` is parsed as a zsh parameter-expansion modifier, so the path was mangled and the counts read 0. Re-run with `${SHA}:path` braces, the real counts appeared. Every zero in this summary was instrument-tested for exactly this reason.
- **Standing environment condition, not resolved in-repo:** `backend/.env` has no Supabase credentials, so `pnpm dev` cannot start the Express backend on a fresh checkout — it throws `Missing Supabase environment variables` before binding. This plan worked around it per-process. Any sibling lane needing the Express backend will hit the same wall; the durable fix is an operator-side `backend/.env` (or a documented `.env.test` sourcing step), which is out of this plan's write set and was **not** committed — no credentials belong in the repo.

## User Setup Required

None - no external service configuration required by this plan. See the standing environment condition above for the operator-side `backend/.env` gap.

## Next Phase Readiness

- **Criterion 4 holds behaviourally**, with an oracle that has been drilled in both directions: `tests/e2e/95-monitoring-mounts.spec.ts`.
- **95-09 must write** `95-DEAD-04-DECISION.md` and the `REQUIREMENTS.md` register note from the `DEAD-04 decision for the record` section above. This plan deliberately did not write either file (single-writer, D-17).
- **Phase 97 inherits one residual reference:** the nav entry at `frontend/src/components/modern-nav/navigationData.ts:262`. Branch (a) leaves that a nav-entry decision, as the ruling anticipated.
- **Untouched by design:** `/delegations` (P102), the legal-holds region (P100), `/analytics` (P96), and every sibling Vite proxy entry.

## Self-Check: PASSED

- Every task's `<acceptance_criteria>` re-verified by running the criterion's own command; exits observed directly (`$?`), never through a pipe.
- Plan `<verification>` block re-run at `HEAD=fd11f2218`: V1 exit 0, V2 exit 0, V3 exit 0.
- `git log --oneline --all --grep="95-04"` → 2 commits (`46457acb8`, `fd11f2218`), both reachable from HEAD.
- Every `<automated>` block was run **byte-identical** to the accepted plan. Zero gate edits.
- Commits used explicit pathspecs only. No operator harness-sync file and no other plan's file was staged or touched.

## BLOCKED

None. No task was blocked; no gate was unrunnable or wrong. The two dev-stack faults in Deviations 1 and 2 were repaired at execution and their gates then ran for real — they are recorded as deviations, not blockers, because nothing was left unverified.

---

_Phase: 95-routes-that-don-t-render_
_Completed: 2026-08-16_

SUMMARY-END
