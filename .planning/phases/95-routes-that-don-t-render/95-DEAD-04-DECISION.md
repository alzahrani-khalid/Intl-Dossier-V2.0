# DEAD-04 — `/monitoring` keep-or-delete: **KEEP**, with the API moved out from under the prefix

**This is the phase record Phase 97 criterion 4 consumes by name.** The requirement's own text
demands only that the decision be RECORDED either way; this file is that record.

- **Decision:** branch (a) — **KEEP** the `/monitoring` SPA route; the Vite proxy stops claiming
  the bare prefix.
- **Ruled by:** `.tickmarkr/overseer/RULING-P95-01-PARK-MONITORING.md` (`RULING-P95-01`), decided
  2026-08-16 by the overseer under the operator's standing delegation. **The operator did not sign
  it**; no credential, tag or public remote was touched by the decision. Both branches were
  authorized by the requirement's own text.
- **Implemented by:** plan `95-04`. This record is transcribed from that plan's SUMMARY section
  **"DEAD-04 decision for the record"** — single-writer hand-off (D-17): 95-04 deliberately wrote
  neither this file nor the register note, and this plan (`95-09`) implemented no code.
- **Recorded:** 2026-08-16, by plan `95-09`, at `phase-95-base` = `a3d2d269a` (commit `2c8013208`).

## Basis for KEEP over DELETE

Per the ruling: `REQUIREMENTS.md:89`'s own parenthetical — "the Vite proxy no longer claims the
whole prefix" — names the keep-fix mechanism, so the register author anticipated this branch. A
wired, built dashboard exists (`frontend/src/routes/_protected/monitoring.tsx` mounts
`@/pages/monitoring/Dashboard`), and deletion would discard product to resolve a pathing conflict.
The backend consumer (`backend/src/api/contract/monitoring.ts`) is real, so the proxy entry could
not simply be deleted either — the collision is self-inflicted, because the Dashboard page itself
called `/monitoring/*` API paths.

## Mechanism — the planner's choice, decided against the mechanical enumeration

The ruling left the mechanism to the planner (move the API under `/api/monitoring`, **or** narrow
the proxy to exact sub-paths), to be decided against a mechanical enumeration of the Dashboard's
real calls. 95-04 chose to **move the API**:

1. **`backend/src/index.ts`** remounts `monitoringContractRouter` at **`/api/monitoring`**, still
   inside the surviving `NODE_ENV === 'development' || 'test'` guard, registered before
   `app.use('/api', apiRouter)` so it wins the path in dev/test. **Production exposure is
   unchanged** — in production the guard is false and `/api/monitoring` 404s from the real API
   router. `backend/src/api/index.ts` has no `monitoring` route, so nothing is shadowed either way.
2. **`frontend/vite.config.ts`** — the `'/monitoring'` proxy entry is **deleted**; the generic
   `'/api'` entry carries the moved calls.
3. **`frontend/src/pages/monitoring/Dashboard.tsx`** — both calls go through
   `apiGet(path, { baseUrl: 'express' })`, so they now send the session JWT. `/api/monitoring/alerts`
   (behind `requireAuthHeader`) had **never** worked from this page, because the old bare `fetch`
   sent no header.

**Rejected alternative — narrowing the proxy to exact sub-paths.** It fixes dev only (in
production those calls still hit the SPA fallback and JSON-parse-fail) and silently rots the
moment the Dashboard adds a call.

## Ruling condition 1 — enumeration 2/2 resolving

The caller population is **exactly 2**, enumerated mechanically rather than by hand (95-04
SUMMARY §"Condition 1a"):

```
$ command grep -rn "'/api/monitoring" frontend/src --include='*.ts' --include='*.tsx' | grep -v routeTree.gen
frontend/src/pages/monitoring/Dashboard.tsx:50:  apiGet<HealthResponse>('/api/monitoring/health', { baseUrl: 'express' })
frontend/src/pages/monitoring/Dashboard.tsx:61:  apiGet<Alert[]>('/api/monitoring/alerts',  { baseUrl: 'express' })
```

Both are shown resolving, twice over:

```
1) /api/monitoring/health via :5173  -> 200          (curl, live dev stack)
2) /api/monitoring/alerts (no token) -> 401          <- the proof of resolution: requireAuthHeader
                                                        is a presence check ON that router, so 401
                                                        means the request reached it
3) /monitoring content-type          -> text/html    (body instrument-tested: `<!doctype html>`)
in-app, authenticated (tests/e2e/95-monitoring-mounts.spec.ts): health[0]=200, alerts[0]=200
```

The residual `/monitoring` reference population after the change is **exactly one**, and it is a
nav link, not an API call — that single hit is itself the instrument test proving the sweep still
sees matches, so the zero on API calls is a real zero:

```
frontend/src/components/modern-nav/navigationData.ts:262:        path: '/monitoring',
```

## Ruling condition 2 — production carries no mirroring claim

Re-derived in 95-04 and again in `95-CLOSING-REGISTER.md` §1:

```
$ command grep -n "location" deploy/nginx/*.conf
  location /monitoring  -> 0   across all four conf files
  location /api/        -> 6   (instrument control — the same command DOES see locations)
```

**No nginx file was edited** and none needed editing: `location /api/`'s `proxy_pass http://backend;`
has no URI part, so nginx forwards the full original request URI and `/api/monitoring/health`
reaches the backend unchanged.

## Ruling condition 3 — what Phase 97 inherits

Branch (a) leaves P97 a **nav-entry decision**, exactly as the ruling anticipated:
`frontend/src/components/modern-nav/navigationData.ts:262` still links `/monitoring`. It was
**deliberately left untouched** by Phase 95 — it is P97's `NAV-*` scope, not this phase's.

The route itself now renders: `/monitoring` document requests reach the SPA
(`content-type: text/html`), `MonitoringDashboard` mounts, and each widget settles to data or its
own inline `QueryErrorState` (testIds `monitoring-health-error`, `monitoring-alerts-error`) —
the page previously had **no error branch at all**.

## Consumer disposition recorded with the decision (D-16)

`frontend/tests/unit/monitoring.dashboard.test.tsx` is **MOCKED → NON-ORACLE**. Left
byte-unchanged, green before and after; it asserts only the `h1`/`h2` headings, which render
whether the queries succeed, fail or hang. **It is never cited as evidence for criterion 4** — the
behavioural oracle is `tests/e2e/95-monitoring-mounts.spec.ts`, drilled red (`application/json`,
2 failed) and green (`2 passed`).

DECISION-RECORD-END
