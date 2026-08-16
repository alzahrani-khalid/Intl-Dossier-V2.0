# Phase 95: Routes That Don't Render - Research

**Researched:** 2026-08-16
**Domain:** TanStack Router file-route repair, edge-function deploy/contract alignment, truthful state rendering
**Confidence:** HIGH (every root cause below was verified against the live tree at HEAD and/or the deployed staging project `zkrcjzdemdmwhearhfgg`; probes ran 2026-08-16)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Numbering restarts per phase (P94 used `D-01..D-34`). Decisions carried forward are marked
**[inherited]** with their origin.

#### Scope and requirement mapping

- **D-01: The phase closes 8 requirements**, each mapped in plan frontmatter to the success
  criterion (or filed-finding close) it serves, re-derivable by command against the register.
  Source: `.planning/REQUIREMENTS.md` register rows 521–524, 528–529, 567, 571;
  `.tickmarkr/overseer/ACCEPTANCE-P95-PLAN.md` condition 1. A silent drop of any of the eight is
  a REJECT.
- **D-02: Out-of-phase surfaces are named, not assumed** — the list in the Phase Boundary above
  is the exclusion record. Source: ORCH-BRIEF §3 "OUT of this phase" + intended-broken register.

#### DEAD-01 — /search

- **D-03: The fix is the data path that produces `undefined` before `.forEach`, not a guard at
  the crash site.** Both typed queries AND the page's own suggestion chips are inside the oracle
  population — criterion 1 names both. A `?.forEach` that renders an empty result set over a
  server error would be the confident-lie class; the fix must render results (or the P93 error
  state) truthfully.

#### DEAD-02 — /tasks/queue

- **D-04: `assignments-queue` exists in-tree (`supabase/functions/assignments-queue/`) and the
  missing half is DEPLOYMENT.** A fixed function that is not redeployed has not been fixed
  [inherited — P94 `D-19`]. Deploy via Supabase CLI/MCP with deploy evidence per
  `scripts/probe-edge-auth.sh` pattern. P94's intended-broken register FORBADE this repair there;
  **Phase 95 is the owner — repairing it now is the mission, not a violation** (ORCH-BRIEF §3).

#### DEAD-03 — /scenario-sandbox

- **D-05: The error state reuses the shared query-error component Phase 93 extracted** —
  `role="alert"`, bilingual, internal-string-free [inherited — P93 `D-03`/`D-04`/`D-08`]. A
  backend 500 must be visually distinct from "still loading"; new copy lands in BOTH locales
  under the i18n key-set-equality gate [inherited — P93 `D-04`, P94 `D-09`], colon-form keys only
  [inherited — P94 `D-10`].

#### DEAD-04 — /monitoring

- **D-06: RULED — KEEP the SPA route; the proxy stops claiming the bare `/monitoring` prefix**
  (`RULING-P95-01-PARK-MONITORING.md`, resolving `PARK-95-01`). The plan that closes DEAD-04
  carries all three attached conditions: (1) the Dashboard's own API calls are enumerated
  MECHANICALLY (from `Dashboard.tsx` and its hooks — a population, not a hand list; the page
  itself calls `/monitoring/*`, so the collision is self-inflicted) and each shown to resolve
  after the change — the mechanism choice (move API under `/api/monitoring` vs narrow the proxy
  to exact sub-paths) is the planner's, decided against that enumeration; (2) the production
  reverse proxy (`deploy/` nginx) is checked for a mirroring claim in the SAME plan; (3) the
  decision is recorded where Phase 97 will read it (phase record + register note), citing the
  ruling.

#### DEAD-08 — one owner per slot

- **D-07: Slot consolidation is a tree-wide operation, not a file rename.**
  `positions/$id.tsx` vs `positions/$positionId.tsx` vs the `positions/$id/` directory resolve to
  ONE owner per slot; `legislation.tsx` renders `<Outlet/>` so its detail child is reachable;
  positions `approvals`/`versions` children drive tab state (criterion 5's own text). Which param
  name survives is planner's discretion, but every inbound link and `useNavigate`/`Link` target
  in the whole tree is swept in the same edit — grep the whole tree first (the P-drift lesson:
  a plan that names 1 site when 5 need it). Shipped-phase test consumers are enumerated per C9b.

#### DEAD-09 — report generation

- **D-08: Generation ships REAL work; the honest unavailable terminal state is the ONLY
  permitted fallback.** The rename-never-ships-alone law (`RULING-P94-04` §PARK-94-06) holds: no
  change may convert a visible failure into an invisible fabricated success. Candidate paths from
  P94 research — the custom-reports function flow, or Express `/report-builder/generate`
  (`backend/src/.../misc.repository.ts:125`) — the choice is research/planner discretion, judged
  on which path can return a REAL artifact url. The client pin
  (`frontend/src/pages/reports/__tests__/generate-entry.test.ts`) is a C9b consumer: it is
  updated in the SAME task that changes `generate-entry.ts` behaviour, or recorded as a named
  non-consumer. Any edge-function change redeploys with probe evidence [P94 `D-19`].

#### NOTFOUND-COMPONENT-01 — enforce or retire, never drop

- **D-09: Default branch = ADD the lint/gate**, if research proves it expressible with a positive
  AND negative control (a rule that fires on a synthetic bare component-`notFound()` and stays
  silent on the loader form and on the two compliant call sites). If research finds it
  inexpressible or not worth it, the RETIRE decision goes to a park for ruling — the register
  entry's own text authorizes explicit retirement, but a silent drop is a REJECT
  (`ACCEPTANCE-P95-PLAN.md` condition 1).

#### RETENTION-CAST-01 — the six false casts

- **D-10: Fix the six casts in `useRetentionPolicies.ts` to unwrap the real `{data:[...]}`
  envelope.** **FORBIDDEN FIX SHAPE: `Array.isArray(x) ? x : []`** — that renders "No Policies"
  over rows the server sent, the confident-lie class this milestone exists to kill (`93-09`
  pattern decision, REQUIREMENTS.md:336). The consumption-point repair in `data-retention.tsx`
  (`asRows`, commit `b71ad62b`) is a live consumer of the hook's current lying shape — it is
  reconciled in the same task, per C9. The count "six" is re-derived before the edit, not
  trusted (scout counted 11 cast-shaped lines in the file; the register says six false ones).

#### Gates, oracles and derivations — standing law

- **D-11: `.planning/GATE-STANDARD.md` C1–C10, incl. C9a and C9b, governs every gate from
  authoring** [inherited — P93 `D-17`, P94 `D-23`]. Both directions observed per gate via
  `scripts/gate-drill.mjs`; a gate whose done state cannot be constructed is labelled **UNPROVEN
  with what it needs**, never folded into a pass. `GATESTD-01` is worked around, never fixed
  mid-phase unruled.
- **D-12: Every closing derivation states its POPULATION DEFINITION and what falls outside it**
  [inherited — P93 `D-18`, P94 `D-24`]. **This phase's recurring population is "every route": it
  is derived mechanically from the generated route tree (`routeTree.gen.ts` or the router's own
  manifest), NEVER a hand list, and the derivation states what it cannot see — runtime-created
  routes and proxy-claimed prefixes (DEAD-04's mechanism IS a route the SPA tree does not own).**
  Source: `ACCEPTANCE-P95-PLAN.md` condition 4.
- **D-13: Behavioural criteria carry behavioural oracles** [inherited — P93 `D-19`, P94 `D-25`].
  All five criteria are render/behave claims; each plan says how its criterion is OBSERVED —
  spec, browser-harness CDP probe (claude-in-chrome/playwright-MCP do not attach), or explicitly
  manual-with-owner — not only grepped. An oracle that cannot run until execution is labelled as
  such; producers ordered before consumers. RLS denials read as empty 200s — assert
  `role="alert"` via DOM; forced errors via CDP `Network.setBlockedURLs`.
- **D-14: Playwright paths are FILTERS** [inherited — P94 `D-26`]: assert spec-file existence
  FIRST, hardcode the expected count, pass `--no-deps` for any project carrying `dependencies:`
  — including `--list` (GATE-STANDARD C6).
- **D-15: No oracle depends on the e2e `setup` project** [inherited — P93 `D-20`, P94 `D-27`].
  `E2ECRED-01` is unrotated; route around with `--no-deps` + inline auth (TEST_USER creds in
  `.env.test` work), or park.
- **D-16: C9b rows carry the mock-vs-real column from authoring** [inherited — P94 `D-28`]. A
  mocked consumer is a NON-ORACLE, never folded into the defence count.
- **D-17: No two writers share an output path** [inherited — P94 `D-29`]. The independent
  `gsd-verifier` artifact (`95-VERIFICATION-INDEPENDENT.md`, exec leg) is a path no plan may
  claim. Every spawned checker writes a disk artifact with a terminal marker — NOT-CHECKED beats
  silence.
- **D-18: Decision coverage is green mechanically with a falsification drill on disk** —
  `scripts/decision-coverage.mjs` exit 0, `uncovered: []`, seen RED before its green is trusted
  (`ACCEPTANCE-P95-PLAN.md` condition 2). Each plan carries one citation truth in frontmatter
  `truths:` (`- 'Decisions covered — D-NN: <short>; …'`). Sub-lettered decision ids are invisible
  to the extractor (`GATESTD-03`) — never use them.
- **D-19: DB/deploy house rules hold** [inherited]: deploys via Supabase CLI/MCP with
  `scripts/probe-edge-auth.sh` evidence; schema changes only via migration files through the
  Supabase MCP (none anticipated this phase); RLS binds `profiles.user_id = auth.uid()`.
- **D-20: Instrument facts** [inherited — ORCH-BRIEF §3]: `grep` here is a ugrep wrapper
  honouring `.gitignore` — recursive sweeps are blind to `.tickmarkr/` etc.; use
  `find | xargs grep`, explicit file args, or `command grep`; instrument-test EVERY zero against
  a known-present token. `timeout` does not exist on this Mac. `pnpm test` via Turbo needs
  `--continue`.

### Claude's Discretion

Technical shape is the researcher's and planner's, within the constraints above: which param
file survives the DEAD-08 consolidation, the internal shape of the `/search` data-path fix, the
DEAD-09 backend path choice (subject to D-08's real-artifact test), and the lint-rule mechanics
for D-09. None of these change what the user sees truthfully, so none is parked.

### Deferred Ideas (OUT OF SCOPE)

- Out-of-phase by prior ruling, listed so no plan folds them in: `DEAD-05/06/07`, `COUNT-*`,
  `TRIGSWEEP-01` → P96; `NAV-*` → P97; `COPY-*` → P98; `EDGEPATH-01`, `DR-SUBPATH-01`,
  `RLS-AUTHUSERS-01` → P100; `ORACLECAP-01`, `E2ECRED-01` → P101; `DELEG-02`, `GATESTD-01`,
  `GATESTD-03` → P102.
- Intended-broken surfaces off-limits: `/delegations` (P102), legal-holds region (P100),
  `/analytics` (P96).
- Arabic naturalness + pixel RTL sign-off are OPERATOR parks — no plan claims either
  (ORCH-BRIEF §3).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID                    | Description                                                                                    | Research Support                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEAD-01               | `/search` returns results for every query, incl. its own suggestion chips (no `forEach` crash) | §DEAD-01 findings: root cause is a client/server envelope mismatch, verified against the DEPLOYED `search` function; crash site + three fix candidates with recommendation       |
| DEAD-02               | `/tasks/queue` renders; `assignments-queue` is deployed                                        | §DEAD-02 findings: 404 on deployed staging confirmed by probe; in-tree source audited (auth OK, shape matches client); secondary client defect (GET+body invoke) documented      |
| DEAD-03               | `/scenario-sandbox` loads or shows an error; 500 never pixel-identical to loading              | §DEAD-03 findings: deployed fn returns 500 `FETCH_FAILED` (verified by probe); bespoke error branch at :312-323 mapped; retry-window math explains the loading-lookalike         |
| DEAD-04               | `/monitoring` resolves to the SPA route (keep + narrow proxy per RULING-P95-01)                | §DEAD-04 findings: exactly 2 API calls enumerated mechanically; nginx checked (NO `/monitoring` claim — derivation shown); mechanism recommendation with prod-path analysis      |
| DEAD-08               | One owner per slot; `legislation.tsx` renders `<Outlet/>`; approvals/versions drive tabs       | §DEAD-08 findings: full file/route-tree state at HEAD; complete inbound-link sweep (population stated); survivor recommendation; TanStack 1.170.8 conventions                    |
| DEAD-09               | Real report generation; honest unavailable is the only fallback                                | §DEAD-09 findings: all three candidates assessed against the live tree — one candidate is itself nonexistent (corrected seam); storage+signed-URL precedent identified           |
| NOTFOUND-COMPONENT-01 | Enforce (or explicitly retire) the component-`notFound({routeId})` rule                        | §NOTFOUND findings: pure esquery selector proven INSUFFICIENT; custom flat-config rule proven SUFFICIENT with positive+negative control design — D-09 default branch (ADD) holds |
| RETENTION-CAST-01     | Fix the six false casts to unwrap the `{data:[...]}` envelope                                  | §RETENTION findings: cast population re-derived = exactly 6 (`as Promise<T[]>` at :71,:129,:190,:205,:220,:228); server envelope verified in fn source; `asRows` consumer mapped |

</phase_requirements>

## Summary

Every one of the eight requirements was traced to a verified root cause this session — nothing
below is inferred from the register alone. Two requirements are deploy-shaped (DEAD-02: the
function is simply not deployed, probe-confirmed 404; DEAD-09: the deployed POST is a mock and
the "Express candidate" named in prior research does not exist anywhere in the tree). Three are
client/server contract mismatches (DEAD-01: the deployed `search` fn returns
`{data, count, metadata}` while the client destructures `.dossiers` — the `.forEach` crash is at
`useDossierFirstSearch.ts:109`; RETENTION-CAST-01: six `as Promise<T[]>` casts over a verified
`{data:[...]}` envelope; DEAD-03: the deployed fn 500s with `FETCH_FAILED` and the page's
bespoke error branch violates the P93 contract). Two are route-tree structure defects (DEAD-08:
both `$id.tsx` and `$positionId.tsx` register the same slot and neither parent renders
`<Outlet/>`; DEAD-04: the Vite proxy claims the whole `/monitoring` prefix while prod nginx
claims nothing — the monitoring contract router is dev/test-only scaffolding). One is a lint
question (NOTFOUND-COMPONENT-01) answered here: a pure `no-restricted-syntax` selector cannot
express "not inside a loader" (esquery has no ancestor negation), but a ~40-line custom rule in
the existing flat config can, with clean positive and negative controls — so D-09's default
branch (ADD the lint) holds.

No new packages are needed anywhere in this phase. Every fix composes from the shipped stack:
TanStack Router 1.170.8 file conventions, the P93 `QueryErrorState` component, the
`@/lib/api-client` helpers, the Supabase CLI (2.106.0, present), and the existing eslint flat
config.

**Primary recommendation:** structure plans per-requirement (they are nearly independent), gate
each edge-function change on a redeploy + `scripts/probe-edge-auth.sh` evidence line, and treat
the two "loading forever" surfaces (search-adjacent related-work and monitoring widgets) as
truthfulness obligations, not just pathing fixes.

## Architectural Responsibility Map

| Capability                  | Primary Tier                                  | Secondary Tier                                        | Rationale                                                                                      |
| --------------------------- | --------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| DEAD-01 search results      | Frontend repository/hook (`domains/dossiers`) | Edge fn `search` (if dossier_first branch ships)      | Envelope adaptation belongs at the repository seam; only a server change needs deploy evidence |
| DEAD-02 queue rendering     | Supabase Edge (`assignments-queue` deploy)    | Frontend hook (`useAssignmentQueue` transport fix)    | The missing half is deployment (D-04); the GET+body invoke defect is client-tier               |
| DEAD-03 sandbox error state | Frontend route component                      | Edge fn `scenario-sandbox` (500 root cause optional)  | Criterion 3 is satisfiable client-side; backend 500 diagnosis is DB-tier, optional             |
| DEAD-04 monitoring pathing  | Vite dev proxy + Express mount                | Frontend Dashboard fetches                            | The collision is a proxy-table claim; the calls must carry auth and move with the mount        |
| DEAD-08 slot ownership      | Frontend route files + generated tree         | —                                                     | Pure router-tier; regen is part of the same commit                                             |
| DEAD-09 report generation   | Supabase Edge (`reports` POST) + Storage      | Frontend `ReportsPage`/`generate-entry`               | Real artifact = server work + storage URL; client already maps url→completed honestly          |
| NOTFOUND-COMPONENT-01       | Lint config (root `eslint.config.mjs`)        | —                                                     | Zero pixels; enforcement only                                                                  |
| RETENTION-CAST-01           | Frontend hook (`domains/audit`)               | Frontend page (`data-retention.tsx` asRows reconcile) | Envelope unwrap at the hook; consumer reconciled same task (D-10, C9)                          |

## Standard Stack

### Core (all already installed — this phase adds NOTHING)

| Library                 | Version                                         | Purpose                                                              | Why Standard                                                                                                                      |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| @tanstack/react-router  | 1.170.8 (installed; `^1.170.7` in package.json) | File-based routing; DEAD-08 conventions                              | `[VERIFIED: node_modules package.json]` — matches CONTEXT's pinned version                                                        |
| @tanstack/router-plugin | ^1.168.10                                       | Regenerates `routeTree.gen.ts` via `TanStackRouterVite` on dev/build | `[VERIFIED: frontend/vite.config.ts:32-36]`; `routeFileIgnorePattern: '(**tests**                                                 | \\.test\\.)'` |
| @tanstack/react-query   | v5                                              | Query states driving loading/error truthfulness                      | Already the app-wide server-state layer                                                                                           |
| supabase CLI            | 2.106.0 (on PATH)                               | Edge function deploys (DEAD-02, DEAD-09, optionally DEAD-01/03)      | `[VERIFIED: supabase --version]`                                                                                                  |
| Vitest                  | 4.1.7                                           | Unit oracle runner (generate-entry pin verified green: 5/5 in 596ms) | `[VERIFIED: vitest run executed this session]`                                                                                    |
| Playwright              | root config, testDir `./tests/e2e`              | Behavioural e2e oracles                                              | `[VERIFIED: playwright.config.ts]` — every chromium project carries `dependencies: ['setup']` → `--no-deps` mandatory (D-14/D-15) |
| ESLint flat config      | root `eslint.config.mjs` (658 lines)            | NOTFOUND-COMPONENT-01 rule home                                      | `[VERIFIED: config read]` — already uses `no-restricted-syntax` selectors + inline plugin objects                                 |

### Supporting (shipped components/scripts to reuse)

| Asset                                                     | Location                                                         | Use                                                                                                                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `QueryErrorState`                                         | `frontend/src/components/error-states/QueryErrorState.tsx`       | DEAD-03 retrofit; any new failure surface. Props: `variant ('page'                                                                                                           | 'inline')`, `onRetry`, `isRetrying`, `message`(bilingual envelope),`testId` `[VERIFIED: source read]` |
| `scripts/probe-edge-auth.sh`                              | repo root scripts/                                               | Deploy evidence (`fn -> status` lines); works — used live this session                                                                                                       |
| `apiGet/apiPost`                                          | `frontend/src/lib/api-client.ts`                                 | House transport: edge base = `VITE_SUPABASE_URL/functions/v1`, express base = `VITE_API_URL                                                                                  |                                                                                                       | ''`(relative → Vite proxy). Throws`ApiError`with status`[VERIFIED: source read]` |
| Tabs primitive                                            | `frontend/src/components/ui/tabs.tsx` (re-export of heroui-tabs) | DEAD-08 URL-driven tabs — visual unchanged, only the `value` source changes (UI-SPEC §5)                                                                                     |
| pdf-generate storage pattern                              | `supabase/functions/pdf-generate/index.ts:383-397`               | DEAD-09 artifact precedent: `storage.from('private').upload(path, bytes, {contentType})` + `createSignedUrl(path, 86400)` `[VERIFIED: source read; fn deployed — probe 400]` |
| `scripts/gate-drill.mjs`, `scripts/decision-coverage.mjs` | scripts/                                                         | Standing-law instruments (D-11, D-18) `[VERIFIED: files exist]`                                                                                                              |

### Alternatives Considered

| Instead of                                           | Could Use                                            | Tradeoff                                                                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custom ESLint rule (NOTFOUND)                        | `no-restricted-syntax` esquery selector              | Selector CANNOT express "not inside loader property" — esquery has no ancestor-negation combinator. Selector-only = false positives on the correct loader form. Custom rule is required (see §NOTFOUND)        |
| Client envelope adapter (DEAD-01)                    | Server `dossier_first` implementation in `search` fn | Server branch is the complete fix (real related_work) but needs a deploy + junction-table query design; client adapter is smaller but must NOT fabricate `related_work: []` (see §DEAD-01)                     |
| `apiGet('/assignments-queue?...')` (DEAD-02 filters) | Keep `functions.invoke`                              | invoke with `method:'GET'` + `body` throws TypeError in browsers and never serializes query params — the filters can never reach the function via invoke `[VERIFIED: hook source + fn reads url.searchParams]` |

**Installation:** none. Zero new packages.

## Package Legitimacy Audit

**This phase installs no external packages.** Every recommendation above composes from
dependencies already present in `pnpm-lock.yaml` at HEAD. slopcheck was therefore not run; there
is nothing to audit. If a plan later introduces a package (it should not need to), it must run
the Package Legitimacy Gate before the install task is authored.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Per-Requirement Findings (verified evidence + prescriptive fix shapes)

### DEAD-01 — `/search` crashes on its own results

**Root cause (VERIFIED against both the in-tree source and the DEPLOYED artifact):**

- Route: `routes/_protected/search.tsx` → `DossierSearchPage` → `useDossierFirstSearch`
  (`frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts`; the `@/hooks/...` file is a
  compat re-export).
- Repository call: `getDossierFirstSearch` (`domains/dossiers/repositories/dossiers.repository.ts:133-156`)
  → `apiGet('/search?q=…&page=…&page_size=…&dossier_first=true')` → edge fn `search`.
- **The deployed `search` function's 200 envelope, probed live 2026-08-16 with `q=UN`:**
  top-level keys `['count','data','limit','metadata','offset','query','took_ms','warnings']` —
  **no `dossiers` key, no `related_work`, no `dossiers_total`**. `[VERIFIED: staging probe]`
  The in-tree source (`supabase/functions/search/index.ts:275-294`) matches the deployed shape.
- **Crash site:** `useDossierFirstSearch.ts:109` — `searchQuery.data.dossiers.forEach(...)`
  inside the `typeCounts` `useMemo`. `searchQuery.data` is truthy (the JSON parsed), `.dossiers`
  is `undefined` → `Cannot read properties of undefined (reading 'forEach')`. `[VERIFIED: source]`
- **Why chips crash too:** the suggestion chips (`DossierSearchPage.tsx:292-301`, hardcoded
  `['Saudi Arabia','UN','G20','climate']`) call `setQuery(suggestion)` — same query path, same
  crash. Both halves of criterion 1 share one root cause.
- **Server also ignores** `page`/`page_size`/`dossier_first` (uses `limit`/`offset`) and its
  `validTypes` list still contains `'theme'` (`search/index.ts:99`) — **stale**: the DB renamed
  `theme`→`topic` (`20250129000001_rename_theme_to_topic.sql`, `20251030000001`, `20260202100000`)
  and added `elected_official` (`20260118000001`). A `types=topic` filter 400s today.
  `[VERIFIED: fn source + migrations]`

**Fix candidates (internal shape = Claude's discretion per CONTEXT):**

1. **Repository adapter (smallest):** map the real envelope in `getDossierFirstSearch` —
   `data→dossiers`, `count→dossiers_total`, `metadata.has_more→has_more_dossiers`, translate
   `page/page_size→limit/offset` on the request. **Constraint: must NOT fabricate
   `related_work: []`** — that renders "no related work" for a question the server was never
   asked (the D-03 confident-lie shape, one step removed). Pair with (2) or (3) for related work.
2. **Real related work via `quickswitcher-search`:** this DEPLOYED function (probe: 400 without
   `q` = reached validation) already returns `{dossiers, related_work}` from real queries
   (`quickswitcher-search/index.ts:79-80`, response at ~:470). Limits: `q`/`limit(≤50)`/`lang`
   params only — no type/status filters, no pagination, no totals. Usable as the related-work
   source in a two-request repository. `[VERIFIED: fn source + probe]`
3. **Server `dossier_first` branch in `search` fn (complete fix):** implement the
   `DossierFirstSearchResponse` contract (dossiers + related_work via the junction tables),
   fix `validTypes` to the live enum in the same edit, deploy + probe evidence [D-19].
   Largest but makes the page work exactly as designed.

**Recommendation:** (1)+(2) if minimizing deploy surface, (3) if the planner wants the page's
full contract honored in one place. Either way the `isError` path must render `QueryErrorState`
(the page currently has NO error branch — `isError` is returned by the hook but never consumed
by `DossierSearchPage` `[VERIFIED: page source]`), and the empty state renders only over a
truthful zero-result response.

**Client type contract:** `frontend/src/types/dossier-search.types.ts:114-137`
(`DossierFirstSearchResponse`: `dossiers`, `dossiers_total`, `related_work`,
`related_work_total`, `has_more_dossiers`, `has_more_work`, …).

### DEAD-02 — `/tasks/queue` against a deployed `assignments-queue`

**Deployment status:** `assignments-queue -> 404` on deployed staging, probed 2026-08-16 via
`scripts/probe-edge-auth.sh` — **confirmed NOT deployed**. (`search -> 400`, `reports -> 200`,
`custom-reports -> 200`, `scenario-sandbox -> 500`, `quickswitcher-search -> 400`,
`pdf-generate -> 400` in the same run — all deployed.) `[VERIFIED: probe]`

**In-tree source audit (`supabase/functions/assignments-queue/index.ts`):**

- Auth: anon-key client with injected `Authorization` header + bare `getUser()` — the accepted
  pattern per `supabase/CLAUDE.md` (same as `tasks-get`); esm.sh `@supabase/supabase-js@2`
  (floating, bundled at deploy). Sound. `[VERIFIED: source]`
- CORS: `getCorsHeaders(req)` / `handleCorsPreflightRequest` from `_shared/cors.ts` — the
  origin-validated house pattern. Sound.
- Response shape `{items, total_count, page, page_size, total_pages}` — **byte-matches** the
  client's `QueueListResponse` (`frontend/src/hooks/useAssignmentQueue.ts:29-35`). Sound.
- Role gate: reads `staff_profiles (role, unit_id)` under the caller's RLS. No row → 404
  "User profile not found"; `role='staff'` → 403; supervisor scoped to unit; admin sees all.
  **Whether the test user has a staff_profiles row with supervisor/admin role is UNVERIFIED**
  (no DB access this session) — see Open Questions. `verify_jwt` defaults to true for unlisted
  functions (fine — client sends JWT).

**Secondary client defect (in-scope: it breaks the page's filters after deploy):**
`useAssignmentQueue.ts:56-59` calls `supabase.functions.invoke('assignments-queue', {method:'GET',
...(params && {body: …})})`. Two problems `[VERIFIED: source + fn reads url.searchParams]`:
(a) invoke never serializes `body` into a query string, and the function reads
`url.searchParams` — filters can never arrive; (b) a browser `fetch` with GET + body throws
`TypeError` — selecting any priority/type filter fails client-side before the network.
**Fix:** replace invoke with `apiGet(`/assignments-queue?${params}`)` (house pattern; api-client
already adds the JWT). Unfiltered initial load today sends no body, so the deploy alone makes
the default view render; the transport fix makes the filters truthful.

**Deploy command + evidence:**

```bash
supabase functions deploy assignments-queue --project-ref zkrcjzdemdmwhearhfgg
bash scripts/probe-edge-auth.sh assignments-queue   # expect NOT 404 (200/403/404-profile are all "deployed")
```

**Four-state contract** (UI-SPEC §3): the page `pages/AssignmentQueue.tsx` is already a P93
error-state surface; loading/error/empty/populated must be DOM-distinct after deploy.

**C9b:** `tests/e2e/93-tasks-queue-error.spec.ts` is a **NAMED NON-CONSUMER by its own header**
— it CDP-blocks the request precisely so it stays deterministic "before AND after that deploy"
`[VERIFIED: spec header read]`. It also documents the reusable oracle pattern: inline auth,
`--no-deps`, 15s retry-backoff timeout, internal-string regex.

### DEAD-03 — `/scenario-sandbox` 500 vs loading

**Live behavior (probed):** the `scenario-sandbox` fn IS deployed and GET returns
**500 `{error:{code:'FETCH_FAILED', message_en:'Failed to fetch scenarios', …}}`** — the DB
error from `listScenarios` (`scenario-sandbox/index.ts:141-161`, a plain
`from('scenarios').select('*')`) is swallowed into a generic 500 (good for leak prevention, bad
for diagnosis). Root cause of the 500 is server-side and UNDIAGNOSED (likely `scenarios` table
missing on staging or RLS) — see Open Questions; **criterion 3 does not require fixing it**
("loads OR shows an error"). `[VERIFIED: probe + fn source]`

**Why 500 reads as loading today:** `query-client.ts` retries non-4xx up to 3 times with
1s/2s/4s backoff → ~7s of spinner before `isError`; then the page's **bespoke** branch renders
(`routes/_protected/scenario-sandbox.tsx:312-323`): inline `Alert` with a **hardcoded English
"Retry" literal at :319** and legacy `text-primary`/`text-muted-foreground` classes — exactly
what the UI-SPEC replaces. `[VERIFIED: source]`

**Fix shape (locked by D-05 + UI-SPEC §1):** replace :312-323 with `QueryErrorState` variant A
wired to `refetch()`; loading only while `isLoading`; retry policy per the inherited contract
(no retry on 4xx — already the app default; cap 5xx retries at 2 via the query's own `retry`
option); section-scoped comparison failures use variant B. Copy: reuse
`common:errors.queryFailed.*` (exists both locales); any NEW key lands in
`src/i18n/{en,ar}/scenario-sandbox.json` same commit, colon-form. Namespace `scenario-sandbox`
is registered for both languages `[VERIFIED: src/i18n/index.ts:342,478]`.

**Route guard note:** the route carries `beforeLoad: devModeGuard` — in production builds
without `VITE_DEV_MODE` it redirects to `/dashboard` `[VERIFIED: lib/dev-mode-guard.ts]`. The
observable surface for oracles is the dev server / VITE_DEV_MODE build; state this in the
oracle's population definition.

**Data flow:** `useScenarios` (domains/misc/hooks/useScenarioSandbox.ts) →
`getScenarios` → `apiGet('/scenario-sandbox?…')`. The page consumes `scenariosData?.data || []`
— the fn's success envelope is `{data, pagination}` so the shape is compatible on success.
`useUpdateScenario`/`useDeleteScenario`/`useCloneScenario` are **stub mutations that resolve
`{success:true}` without a network call** (marked "Stub hooks" in source) — out of scope but do
not let a plan assert edit/delete truthfulness on this page.

### DEAD-04 — `/monitoring` (RULED: keep + narrow proxy)

**Condition 1 — mechanical enumeration (population + derivation):**
`MonitoringDashboard` is `frontend/src/pages/monitoring/Dashboard.tsx`, 90 lines, imports ONLY
`useQuery` — **it has no hooks files**. Derivation (run this session):

```bash
command grep -rn "'/monitoring" frontend/src --include='*.ts' --include='*.tsx' | command grep -v routeTree.gen
```

Result: **exactly 2 API calls** — `fetchJSON('/monitoring/health')` (:34, refetch 5s) and
`fetchJSON<Alert[]>('/monitoring/alerts')` (:40, refetch 10s), both via bare relative `fetch`
with **no Authorization header**. The only other hits are the nav entry
(`navigationData.ts:262`, a route link, P97's concern) and the route file itself.
**Population definition:** string-literal `'/monitoring` occurrences under `frontend/src`
excluding the generated tree; Dashboard.tsx has no imports that could hide further calls
(import list verified). `[VERIFIED: sweep + file read]`

**Condition 2 — production reverse proxy:** NO nginx config claims `/monitoring`. Derivation:
`command grep -n "location" deploy/nginx/*.conf` → locations are `/`, `/health`,
`/.well-known/acme-challenge/`, `/api/copilot/`, `/api/`, `/ws/` only (all four conf files).
Zero instrument-tested against the known-present token `location /api/`. `[VERIFIED: sweep]`

**The full collision picture (matters for the mechanism choice):**

- Dev: `vite.config.ts:130-133` proxies the WHOLE `/monitoring` prefix to the backend — the
  browser's document request for `/monitoring` never reaches the SPA (raw backend JSON/404).
- Backend: `backend/src/index.ts:85` mounts `monitoringContractRouter` at `/monitoring` — but
  **only inside `if (NODE_ENV === 'development' || 'test')`** — the router is contract-test
  scaffolding (in-memory `monitoringAlertsService`), deliberately never mounted in production
  (:78-90 comment). `/monitoring/health` is open; `/monitoring/alerts` requires a Bearer token
  (`requireAuthHeader` — presence-check only). `[VERIFIED: source]`
- Prod: nginx serves the SPA at `/monitoring` (route renders) but the Dashboard's two calls hit
  the SPA fallback → index.html → `res.json()` throws → **the page shows "Loading health..."
  forever** — Dashboard has NO error branch (`!health && <p>Loading…</p>`). The
  perpetual-loading lie exists in prod today regardless of the proxy fix.

**Mechanism recommendation (decided against the enumeration, as the ruling requires):**
**move the API under `/api/monitoring`** rather than narrowing the proxy:

1. `backend/src/index.ts:85` → mount at `/api/monitoring` (keep the dev/test guard).
2. Dashboard's two fetches → `/api/monitoring/health` and `/api/monitoring/alerts` via
   `apiGet(path, {baseUrl:'express'})` (adds the JWT the alerts route requires; relative in dev
   → generic `/api` Vite proxy; in prod nginx `location /api/` forwards the FULL path including
   `/api` to the backend — `proxy_pass http://backend` with no URI part `[VERIFIED:
nginx.prod.conf:133-138]` — so the same path works in both environments with zero nginx edit).
3. Delete the `'/monitoring'` entry from the Vite proxy table.
4. Add per-widget `isError` → inline error (variant B) so a prod backend-absent response renders
   truthfully instead of perpetual loading (UI-SPEC §4 requires this contract).
   Why not "narrow the proxy to exact sub-paths": it fixes dev only — prod calls to
   `/monitoring/health` would still hit the SPA fallback and JSON-parse-fail, and the exact-path
   proxy entries would silently rot if the Dashboard ever adds a call.

**Condition 3:** record the KEEP decision + mechanism in the phase record and as a register note
on DEAD-04 citing `RULING-P95-01-PARK-MONITORING.md` — P97 criterion 4 consumes it by name.

### DEAD-08 — one owner per slot

**State at HEAD `[VERIFIED: ls + routeTree.gen.ts + file reads]`:**

| File                                 | Route                      | Notes                                                                                                                    |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `positions.tsx`                      | `/positions` layout        | `component: () => <Outlet/>` ✓; also exports `PositionsLibraryPage` (list body)                                          |
| `positions/index.tsx`                | `/positions/`              | renders `PositionsLibraryPage`                                                                                           |
| `positions/$id.tsx` (254 ln)         | `/positions/$id`           | Detail/editor: local Tabs `defaultValue="editor"` with triggers editor/approvals/versions (:124-141). **No `<Outlet/>`** |
| `positions/$positionId.tsx` (304 ln) | `/positions/$positionId`   | Second detail page (T056 style, has `PositionAnalyticsCard`) — **competing dynamic slot**                                |
| `positions/$id/approvals.tsx`        | `/positions/$id/approvals` | Standalone full page (own header, Back link) — unreachable in render: parent has no Outlet                               |
| `positions/$id/versions.tsx`         | `/positions/$id/versions`  | Same — standalone, unreachable                                                                                           |
| `legislation.tsx` (85 ln)            | `/legislation`             | List page, **no `<Outlet/>`**                                                                                            |
| `legislation/$id.tsx`                | `/legislation/$id`         | Detail — unreachable in render for the same reason                                                                       |

`routeTree.gen.ts` registers BOTH `/positions/$id` (with children) and `/positions/$positionId`
(:1426-1427, :1482-1483). Two dynamic segments at one level rank equally — which file matches
`/positions/<uuid>` at runtime is rank-order-determined and must be treated as undefined
behavior; the consolidation removes the ambiguity rather than relying on the current winner.

**Complete inbound-link sweep (population: template-string `` `/positions/${...}` `` and
route-id `'/positions/$id'`/`'/positions/$positionId'` forms across `frontend/src`, excluding
routeTree.gen and the contested files themselves) `[VERIFIED: command-grep sweep this session]`:**

- Param-name-AGNOSTIC (build the URL directly; unaffected by which file survives):
  `useQuickSwitcherSearch.ts:95`, `LinkedItemsList.tsx:38`, `AssignmentDetailsModal.tsx:102,374`,
  `EntityLinkManager.tsx:197`, `DossierSearchPage.tsx:134`, `entityHistoryStore.ts:217`.
- Route-id `/positions/$id`: `NewPositionDialog.tsx:239`, `routes/_protected/approvals/index.tsx:96`,
  plus the two children's Back links (`$id/approvals.tsx:89`, `$id/versions.tsx:84`).
- Route-id `/positions/$positionId`: **exactly one** — `routes/_protected/positions.tsx:306`
  (`as any` cast currently hides the type conflict).
- Legislation `/legislation/$id`: `LegislationDetail.tsx:864`, `LegislationList.tsx:385,454`,
  `legislation.tsx:58` (create-success navigate), `legislation/$id.tsx` itself.

**Survivor recommendation: keep `$id`.** One repoint (`positions.tsx:306`, which also removes
two `as any` casts) vs four+; the children directory is already `$id/`; `$id.tsx` carries the
Tabs the UI-SPEC contract is written against. `$positionId.tsx` is deleted — note it uniquely
mounts `PositionAnalyticsCard`; dropping it is accepted (the file is dead-or-ambiguous today),
record as a named omission rather than silently.

**Target structure (TanStack Router 1.170.8 file conventions):**

- `positions/$id.tsx` becomes the slot LAYOUT: header + tab strip + `<Outlet/>`. A flat file
  plus a same-named directory is parent+children; children render only through the parent's
  `<Outlet/>`. `[CITED: tanstack.com/router/latest/docs/framework/react/routing/file-based-routing]`
- `positions/$id/index.tsx` = the default (editor) tab content at `/positions/$id`.
- `$id/approvals.tsx` / `$id/versions.tsx` are stripped to tab-panel content (their standalone
  headers/Back links do not survive — UI-SPEC: "the tab strip does not remount the page header").
- Tab value derives from the matched child (`useChildMatches`/`useMatchRoute` or matching on
  location), triggers navigate via `Link`/`useNavigate`; deep-link `/positions/:id/approvals`
  opens with `aria-selected="true"` on that trigger; browser back moves tab state.
- `legislation.tsx` becomes a layout rendering `<Outlet/>` (the criterion's own words); the list
  body moves to `legislation/index.tsx`; `validateSearch` stays on the layout so
  `/legislation?type=…` deep links keep working (child reads it via `getRouteApi`).
- `routeTree.gen.ts` is regenerated by the Vite plugin (dev/build) and committed **in the same
  commit** (CONTEXT integration note). Never hand-edit it.

**HeroUI gotcha for the tab rewiring:** HeroUI `Button` `filterDOMProps` drops aria attributes
when composing `asChild` → prefer driving the existing `Tabs` `value`/`onValueChange` (navigate
in the handler) over wrapping triggers in `Link asChild`. `[ASSUMED — from project memory of the
Phase 79 finding; verify the chosen composition renders `aria-selected` in the DOM before
pinning the oracle]`

**C9b sweep (all four test roots + colocated `src/**/**tests**`, instrument-tested against a
known-present token):** no shipped test names the contested route files. `tests/contract/positions-\*`use`positionId`as a variable name against edge functions (triage: non-consumers of the route
files).`frontend/tests/scenario-sandbox-verification.spec.ts`asserts h1/tabs on
scenario-sandbox (live-login spec; DEAD-03's retrofit keeps both visible — likely unaffected,
record as triaged).`[VERIFIED: sweep this session]`

### DEAD-09 — real report generation

**The mock (unchanged, verified):** `supabase/functions/reports/index.ts:266-285` — POST mints
`job_id`, `setTimeout(...console.log)`, answers `202 {job_id, status:'pending', …}`; no url, no
work. Deployed (`reports -> 200` GET probe). `:258` guard requires `type`+`format`.

**Candidate assessment (this corrects the prior research's seam):**

1. ~~"Express `/report-builder/generate` at `backend/src/.../misc.repository.ts:125`"~~ —
   **DOES NOT EXIST.** The file is FRONTEND: `frontend/src/domains/misc/repositories/misc.repository.ts:125`
   is `generateReport()` = `apiPost('/report-builder/generate')` → **edge** base → a
   `report-builder` function that is not in `supabase/functions/` and not in the backend Express
   tree (`command grep -rn "report-builder" backend/src` = 0 hits; zero instrument-tested).
   This candidate is itself a dead path (404 at the gateway). `[VERIFIED: file reads + sweeps]`
2. **`custom-reports` execute flow** — REAL but wrong-shaped: `POST /custom-reports/:id/execute`
   (`custom-reports/index.ts:357,710-840`) creates a `report_executions` row, runs the saved
   config's query, returns `{executionId, data, rowCount, executionTimeMs}` **inline — no
   artifact, no url**, and it executes saved `custom_reports` configs by id, not the
   ReportsPage's template ids. Usable as inspiration, not as the generate backend.
3. **Make the `reports` POST real (RECOMMENDED):** the fn's own GET branch already builds real
   summary data (counts over countries/organizations/mous/events/intelligence). The POST
   implements: gather data per `type` → serialize → upload to Storage → return
   `{url, status:'completed'}` (synchronous — drop the fake 202/job theater; the client makes
   one call). Artifact pattern is proven in the deployed `pdf-generate`:
   `storage.from('private').upload(filePath, bytes, {contentType}))` +
   `createSignedUrl(filePath, 86400)` (`pdf-generate/index.ts:383-397`). Bucket `'private'`
   exists on staging (pdf-generate is deployed against it). `[VERIFIED: source + probe]`

**Honest-format constraint:** the page offers pdf/excel/csv per template
(`ReportsPage.tsx` templates array). Real minimal generation is CSV/JSON; do not fabricate a
PDF byte-stream. Either restrict the offered formats to what is really produced, or return the
unavailable state for unsupported formats — `generate.unavailable` remains the terminal
fallback (D-08). New states pending/completed/failed use the UI-SPEC's three NEW
`report-builder:generate.*` keys (both locales, same commit; namespace registered
`[VERIFIED: i18n/index.ts:312,448]`).

**Client seam:** `ReportsPage.tsx:183-208` — mutation invokes `reports` with
`{type, format, parameters}`; `onSuccess` maps through `buildGeneratedReportEntry`
(`generate-entry.ts`) which already returns completed-only-with-url / else-unavailable. If the
server returns `{url}`, **the pure function may not need to change at all**; the pin
`generate-entry.test.ts` (5/5 green in 596ms, run this session) is updated in the SAME task if
`generate-entry.ts` behavior changes, else recorded as a named non-consumer with the reason
(D-08, D-16). Pending/failed rendering is page-level (mutation `isPending`/`isError`).

**Deploy evidence:** redeploy `reports` + probe line; construct the C1 green with a real POST
returning a fetchable url (largest constructible subset if staging data is thin).

### NOTFOUND-COMPONENT-01 — expressibility PROVEN; default branch (ADD) holds

**The three sites at HEAD `[VERIFIED: sweep]`:**

- `components/dossier/DossierShell.tsx:144` — `throw notFound({ routeId: rootRouteId })` (compliant component throw)
- `components/workspace/WorkspaceShell.tsx:136` — same (compliant)
- `routes/_protected/reports/$reportId.tsx:54` — bare `throw notFound()` inside the route
  **loader** (correct — the routeId mechanism applies only to component throws)

**Finding 1 — a pure `no-restricted-syntax` selector is INSUFFICIENT:** esquery (the selector
engine behind `no-restricted-syntax`) has no "not a descendant of X" combinator — `:not()`
accepts compound selectors but not ancestry relations. The bare-loader form and a bare-component
form are identical at the call site (`notFound()` with zero args); only ANCESTRY (inside a
`loader:`/`beforeLoad:` property of the route options vs. inside a component function)
distinguishes them, and both live in the same route files, so per-glob scoping cannot separate
them either. A selector-only rule would false-positive on `reports/$reportId.tsx:54` — failing
the negative control D-09 requires. `[VERIFIED: reasoning against esquery capabilities;
the control run at execution is the binding proof]`

**Finding 2 — a custom rule in the existing flat config is SUFFICIENT (~40 lines):** the root
`eslint.config.mjs` is flat-config and already defines inline plugin objects; a local rule
module (e.g. `scripts/eslint-rules/no-bare-component-notfound.mjs`, imported and registered as
`plugins: { local: { rules: {...} } }`) implements:

```
On CallExpression where callee.name === 'notFound':
  compliant := args.length > 0 && first arg is ObjectExpression containing Property key 'routeId'
  if compliant → OK
  walk node.parent chain:
    if ancestor is Property with key.name in {'loader','beforeLoad'} → OK (bare loader form)
    if ancestor is the createFileRoute options object without hitting loader/beforeLoad → REPORT
  else (component/helper file context) → REPORT
  message: "Component-thrown notFound() must pass { routeId } — a bare throw reaches the
            defaultErrorComponent, not the 404 page (NOTFOUND-COMPONENT-01)."
```

**Controls (both constructible pre-merge, satisfying D-09 and GATE-STANDARD C1):**

- Positive: a synthetic file with a bare `notFound()` inside a component → rule FIRES (red).
- Negative: lint the three existing sites → zero reports (loader form + two compliant throws).

Scope the rule to `frontend/src/**`; it runs inside the existing `pnpm lint` chain
(`eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}'` — CI-blocking).
Treat `notFound({ global: true })` (the deprecated spelling per the DossierShell comment) as
non-compliant; the rule demands `routeId`.

### RETENTION-CAST-01 — the six casts, re-derived

**Population re-derivation (D-10 requires this before the edit):**

```bash
command grep -n "as Promise<" frontend/src/domains/audit/hooks/useRetentionPolicies.ts
```

→ **exactly 6**: `:71` RetentionPolicy[], `:129` LegalHold[], `:190` RetentionStatistics[],
`:205` PendingRetentionAction[], `:220` ExpiringEntity[], `:228` RetentionExecutionLog[].
The register's "six" is correct. The scout's "11 cast-shaped lines" counted a different pattern
(the file has 31 lines matching `\bas\b`, mostly `as const` query keys) — reconciled, not a
conflict. `[VERIFIED: counts this session]`

**Server envelope, verified in fn source:** `data-retention/index.ts` answers
`{ data: [...] }` for the policies list and `{ data }` for singles (:254 and the list branch).
The endpoints are `/data-retention/policies|legal-holds|statistics|pending-actions|expiring|execution-log`
(`domains/audit/repositories/audit.repository.ts:70-142`). **Server-side today only
`/policies` works** — the second-to-last-segment parse (DR-SUBPATH-01, :119-124) reads every
other sub-path as a policy id → 404 "Policy not found". **That parse is P100's — do NOT fix it
here**; those queries reject → `ApiError(404)` → per-region error state, which is truthful.

**Fix shape:** each of the six `queryFn`s unwraps and VALIDATES the envelope — if `body.data`
is not an array, **throw** (renders the error state); never coerce to `[]` (forbidden shape,
D-10). The hooks then return honest `T[]`.

**Consumer reconciliation (same task, C9):** `routes/_protected/admin/data-retention.tsx` —
`asRows` (:156-164) currently tolerates both bare-array and envelope and silently returns `[]`
for anything else. Once the hooks return validated arrays, delete `asRows` and consume hook
data directly (the page's per-region `isError` rendering, added by 93-09, stays). The page is
the hook's ONLY consumer besides the compat re-export `frontend/src/hooks/useRetentionPolicies.ts`
`[VERIFIED: sweep]`. Frontend-only change — no deploy needed for this requirement.

**Oracle (from UI-SPEC):** with the `{data:[…N…]}` envelope mocked, the table renders N rows;
`{data:[]}` → empty state; bare-array or malformed body → error state, never empty.

## Route Population Derivation (D-12 — plans reuse this verbatim)

```bash
# POPULATION: every SPA route = keys of the generated FileRoutesByFullPath interface.
sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts \
  | command grep -oE "'[^']+':" | tr -d "':" | sort -u
# → 201 routes at HEAD (verified this session)
```

**What this derivation CANNOT see (stated as part of the rule):**

1. **Proxy-claimed prefixes** — the Vite dev proxy table (`frontend/vite.config.ts` server.proxy:
   `/api`, `/api/copilot`, `/ai`, `/analytics-dashboard`, `/organization-benchmarks`,
   `/notifications-center`, `/monitoring`) intercepts document requests BEFORE the SPA; DEAD-04
   is the proof instance. Second population source:
   `command grep -nE "^\s+'/[^']*': \{" frontend/vite.config.ts`.
2. **Production reverse-proxy claims** — `command grep -n "location" deploy/nginx/*.conf`.
3. **Runtime-created routes** — none exist (routing is exclusively file-based; the `?dossier=`
   quick-look deep links are search params, not routes).
4. Routes whose files are ignored by `routeFileIgnorePattern` (`__tests__`, `*.test.*`).

## Runtime State Inventory

> Included because DEAD-08 is a rename/refactor and two requirements ship deploys. After every
> file in the repo is updated, this is what still holds old state:

| Category                | Items Found                                                                                                                                                                                           | Action Required                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deployed edge functions | `assignments-queue` NOT deployed (404); `reports` deployed WITH the mock POST; `scenario-sandbox` deployed returning 500; `search` deployed with the `{data,…}` envelope + stale `'theme'` validTypes | Deploy `assignments-queue`; redeploy `reports` (and `search`/`scenario-sandbox` IF their sources change) — each with a probe evidence line (D-19). A source edit without redeploy has not shipped |
| Generated artifacts     | `frontend/src/routeTree.gen.ts` (git-tracked, ESLint-ignored)                                                                                                                                         | Regenerated by TanStackRouterVite on dev/build; the regen lands in the SAME commit as the DEAD-08 file moves. Never hand-edited                                                                   |
| Live service config     | Vite dev proxy table (`/monitoring` entry) — config, not code                                                                                                                                         | Deleted in the DEAD-04 plan; no external service holds it                                                                                                                                         |
| Stored data             | `report_executions` rows (custom-reports), Storage bucket `private`                                                                                                                                   | None — additive only; no migration anticipated (D-19)                                                                                                                                             |
| Secrets/env             | `.env.test` (probe creds — present, working), `ALLOWED_ORIGINS` Supabase secret (CORS)                                                                                                                | None — no renames touch key names. Never echo values                                                                                                                                              |
| OS-registered state     | None — verified: no schedulers/services reference the touched surfaces                                                                                                                                | None                                                                                                                                                                                              |
| Base tag                | `phase-94-base` = `3d63da95f` exists; `phase-95-base` NOT yet created                                                                                                                                 | Create + SSH-sign `phase-95-base` before execution so C7 scope diffs have their anchor                                                                                                            |

## Don't Hand-Roll

| Problem                            | Don't Build                                                | Use Instead                                                 | Why                                                                                                            |
| ---------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Error states                       | Bespoke Alert markup (the scenario-sandbox :312-323 class) | `QueryErrorState` variant A/B                               | The defect class P93 closed; bilingual, `role="alert"`, internal-string-free, test-ids pinned                  |
| Edge auth/CORS                     | New auth or CORS handling in touched fns                   | `_shared/cors.ts` + injected-header `getUser()` patterns    | House-audited; a bare `getUser()` on a plain anon client 401s on old supabase-js                               |
| Query-string transport to edge fns | `functions.invoke` with GET params                         | `apiGet('/fn?query')` from `@/lib/api-client`               | invoke never carries query strings; GET+body throws in browsers (the DEAD-02 filter defect; EDGEPATH's cousin) |
| Artifact URLs                      | Custom file serving                                        | Storage `upload` + `createSignedUrl` (pdf-generate pattern) | Deployed precedent; RLS-independent time-boxed access                                                          |
| Tab visuals                        | New tab component                                          | `components/ui/tabs.tsx` (heroui re-export)                 | UI-SPEC: the exact primitive IS the visual; only the state source changes                                      |
| Route manifest counts              | Hand lists of routes                                       | The FileRoutesByFullPath derivation above                   | D-12; hand lists are the population-blindness class                                                            |
| notFound enforcement               | Grep-based gate script                                     | The custom ESLint rule in the existing lint chain           | AST ancestry (loader vs component) is not grep-expressible; comments would trip greps (C8)                     |

**Key insight:** every "don't" above has a shipped, already-audited implementation in this
repo; the phase is repair-by-reuse, not construction.

## Common Pitfalls

### Pitfall 1: Fixing the crash site instead of the contract

**What goes wrong:** `?.forEach` or `|| []` at `useDossierFirstSearch.ts:109` renders an empty
result set over a live server response. **Why:** the crash is three layers from the cause.
**Avoid:** fix the repository/server contract; empty renders only over a truthful zero.
**Warning sign:** any diff touching only the `typeCounts` memo.

### Pitfall 2: Deploy amnesia

**What goes wrong:** an edge-fn source edit closes green without redeploy; staging still runs
the old artifact. **Avoid:** every fn-touching plan ends with `supabase functions deploy … --project-ref
zkrcjzdemdmwhearhfgg` + a probe line in the SUMMARY (D-19, P94 D-19 lineage).

### Pitfall 3: The generated tree in the wrong commit

**What goes wrong:** route files move but `routeTree.gen.ts` regen lands in a later commit —
intermediate commits have a tree that doesn't match the files (pre-commit build may also fail).
**Avoid:** regen (via `pnpm --filter frontend build` or dev-server touch) in the SAME commit.

### Pitfall 4: Instrument traps (D-20)

`grep` is a ugrep wrapper honoring .gitignore — use `command grep`/explicit paths and
instrument-test EVERY zero. `timeout` doesn't exist on this Mac. `pnpm test` (Turbo) needs
`--continue`. `npx` is broken — use `pnpm exec`. Vitest 4 has no `--reporter=basic` (verified
failing this session — use the default reporter in gate commands).

### Pitfall 5: Playwright project semantics (C6, D-14, D-15)

Every chromium project depends on `setup`, which throws without six E2E\_\* keys — all specs run
`--no-deps` + inline auth (TEST_USER creds in `.env.test`, verified working). Paths are FILTERS:
assert spec-file existence first, hardcode the expected count. CDP-blocked invokes surface with
no numeric status → full retry ladder → `isError` at ~7s: budget 15s timeouts
(93-tasks-queue-error.spec.ts documents the pattern).

### Pitfall 6: Testing the wrong deploy state

`tests/e2e/93-tasks-queue-error.spec.ts` deliberately CDP-forces its error so it is
deploy-agnostic. New Phase 95 "renders" oracles must NOT block the network — they assert the
natural state against the deployed function, which means they are execution-time oracles
(label them; producers before consumers, D-13).

### Pitfall 7: i18n dot-form leaks

New keys addressed colon-form only (`t('scenario-sandbox:…')`, `t('report-builder:generate.pending')`);
both locale files in the same commit; namespaces already registered (verified) so no
registration risk — but `pnpm lint` runs `check-i18n-namespaces.mjs` and will catch drift.

### Pitfall 8: RLS denials read as empty 200s

Never infer failure from emptiness — assert `role="alert"` via DOM (D-13). The retention
sub-path 404s and any staff_profiles gap on the queue all present as ERROR states, which is the
truthful render; do not "fix" them into empties.

## Code Examples

### Deployed `search` envelope (ground truth for the DEAD-01 adapter)

```jsonc
// GET /functions/v1/search?q=UN — probed 2026-08-16, staging zkrcjzdemdmwhearhfgg
{
  "data": [
    /* dossier rows with rank+snippet */
  ],
  "count": 2,
  "limit": 50,
  "offset": 0,
  "query": { "original": "UN", "normalized": "UN", "terms": ["UN"], "tsquery": "UN" },
  "took_ms": 123,
  "warnings": [],
  "metadata": { "has_more": false, "next_offset": null },
}
```

### Deploy evidence pattern (DEAD-02 / DEAD-09)

```bash
supabase functions deploy assignments-queue --project-ref zkrcjzdemdmwhearhfgg
bash scripts/probe-edge-auth.sh assignments-queue reports
# expected stdout lines: "assignments-queue -> <non-404>", "reports -> 200"
```

### Storage artifact pattern (DEAD-09; source: supabase/functions/pdf-generate/index.ts:383-397)

```ts
const filePath = `reports/${type}-${Date.now()}.${ext}`
const { error: upErr } = await supabase.storage
  .from('private')
  .upload(filePath, bytes, { contentType, cacheControl: '3600' })
if (upErr) throw new Error(`upload failed: ${upErr.message}`)
const { data: urlData, error: urlErr } = await supabase.storage
  .from('private')
  .createSignedUrl(filePath, 86400) // 24h
// respond { url: urlData.signedUrl, status: 'completed' } — a completed entry ALWAYS carries a url
```

### Envelope unwrap that cannot lie (RETENTION-CAST-01 — the permitted shape)

```ts
queryFn: async () => {
  const body = (await getRetentionPoliciesApi(searchParams)) as { data?: unknown }
  if (!Array.isArray(body?.data)) throw new Error('malformed retention envelope') // → error state
  return body.data as RetentionPolicy[]
}
// FORBIDDEN: Array.isArray(x) ? x : []  — renders "No Policies" over server-sent rows (D-10)
```

### Route population derivation (D-12)

```bash
sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts \
  | command grep -oE "'[^']+':" | tr -d "':" | sort -u | wc -l   # 201 at HEAD
```

### C9b consumer sweep (roots DERIVED, colocated **tests** included — the P95 correction)

```bash
ROOTS=$(find . -maxdepth 3 -type d -name tests -not -path '*/node_modules/*')
test -n "$ROOTS" || { echo "MISSING ROOTS"; exit 1; }
# ALSO sweep colocated tests — generate-entry.test.ts lives under src/**/__tests__ and is
# invisible to the four tests/ roots (verified miss this session):
command grep -rlE --include='*.test.*' --include='*.spec.*' "\b${id}\b" $ROOTS ./frontend/src
```

## State of the Art

| Old Approach                                                   | Current Approach                    | When Changed                                                   | Impact                                                                               |
| -------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `theme` dossier type                                           | `topic` (+`elected_official` added) | migrations 20250129/20251030/20260118                          | `search` fn validTypes is stale — filter path 400s on `topic`                        |
| `notFound({ global: true })`                                   | `notFound({ routeId })`             | TanStack Router (deprecated spelling per DossierShell comment) | The lint rule requires `routeId`, rejects both bare and `global` forms in components |
| Contract routers mounted bare (`/monitoring`, `/analytics`, …) | Real APIs under `/api/*`            | This phase moves ONLY `/monitoring`                            | Siblings (`/analytics` etc.) are P96+ concerns — do not sweep them here              |
| `Array.isArray(x) ? x : []` fallbacks                          | Validate-or-throw envelope unwraps  | 93-09 pattern decision                                         | The forbidden-shape list in ACCEPTANCE-P95 condition 8                               |

**Deprecated/outdated:** the `202 {job_id}` fake-async response of the reports mock — replaced
by a synchronous real response or the honest unavailable state; nothing keeps the job theater.

## Assumptions Log

| #   | Claim                                                                                                       | Section      | Risk if Wrong                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | esquery cannot express ancestor-negation ("not inside loader property") in `no-restricted-syntax` selectors | NOTFOUND     | LOW — if a selector CAN express it, the custom rule still works and is clearer; the controls decide at execution either way                                |
| A2  | HeroUI `filterDOMProps` drops aria on `asChild` composition (from Phase 79 memory)                          | DEAD-08 tabs | Oracle asserting `aria-selected` could red on a correct change — verify composition in-browser before pinning                                              |
| A3  | The scenario-sandbox 500 is a DB-side cause (table missing on staging or RLS) — the fn masks the real error | DEAD-03      | None for the criterion (error state suffices); diagnosis SQL in Open Questions if the planner wants the page to load                                       |
| A4  | TanStack 1.170.8 renders parent-without-`<Outlet/>` by silently not rendering the matched child             | DEAD-08      | The mechanism detail could differ (e.g. dev warning) but the observed defect (children unreachable) is register-filed; consolidation is correct regardless |
| A5  | Storage bucket `private` accepts new object paths for report artifacts (pdf-generate uses it today)         | DEAD-09      | If bucket policy blocks, create a `reports` bucket via MCP — small execution-time adjustment                                                               |

## Open Questions

1. **Does the test user have a `staff_profiles` row with supervisor/admin role?** (DEAD-02's
   natural post-deploy render depends on it: no row → 404 profile error state; `staff` → 403.)
   - Derivation at execution (Supabase MCP `execute_sql`):
     `SELECT sp.role, sp.unit_id FROM staff_profiles sp JOIN auth.users u ON u.id = sp.user_id WHERE u.email = '<TEST_USER_EMAIL>';`
     plus `SELECT count(*) FROM assignment_queue;` for the populated-vs-empty expectation.
   - Recommendation: the plan's oracle accepts populated OR truthful-empty OR truthful-403/404
     state — the criterion is "renders against a DEPLOYED function", not "renders rows".
2. **Why does `scenario-sandbox` 500?** Derivation:
   `SELECT to_regclass('public.scenarios');` and if present,
   `SELECT * FROM pg_policies WHERE tablename='scenarios';` via MCP. Optional for criterion 3.
3. **Which route currently wins `/positions/<uuid>` at runtime** ($id vs $positionId)? Only
   matters for describing the before-state in evidence; the consolidation removes the question.
   Observable in one browser-harness visit if a plan wants the baseline recorded.
4. **DEAD-01 related-work**: does the planner ship server `dossier_first` (option 3) or
   client-adapter + quickswitcher related-work (1+2)? Research recommends deciding on deploy
   appetite; both are truthful. The stale `validTypes` fix rides whichever server deploy happens
   (or is explicitly deferred with the filter documented as erroring truthfully).

## Environment Availability

| Dependency               | Required By          | Available              | Version                                                                   | Fallback                                      |
| ------------------------ | -------------------- | ---------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| supabase CLI             | DEAD-02/09 deploys   | ✓                      | 2.106.0                                                                   | Supabase MCP deploy                           |
| Node                     | build/regen/tests    | ✓                      | v24.19.0                                                                  | —                                             |
| pnpm                     | everything           | ✓                      | 10.29.1                                                                   | —                                             |
| Vitest                   | unit oracles         | ✓                      | 4.1.7 (ran green this session)                                            | —                                             |
| Playwright + root config | e2e oracles          | ✓                      | testDir `tests/e2e`; ALL chromium projects carry `dependencies:['setup']` | `--no-deps` + inline auth (mandatory, D-15)   |
| browser-harness          | CDP render evidence  | ✓                      | `~/.local/bin/browser-harness`                                            | none needed                                   |
| `.env.test` creds        | probes + inline auth | ✓                      | token mint succeeded this session                                         | —                                             |
| `timeout`                | —                    | ✗                      | —                                                                         | Do not use; loop+sleep or Playwright timeouts |
| `npx`                    | —                    | ✗ (broken on this Mac) | —                                                                         | `pnpm exec`                                   |
| agent-browser            | —                    | ✗                      | —                                                                         | browser-harness is the documented path        |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.7 (frontend unit, jsdom, include `**/*.test.{ts,tsx}` — colocated `__tests__` covered); Playwright (root config, testDir `./tests/e2e`) |
| Config file        | `frontend/vitest.config.ts`; `playwright.config.ts` (root)                                                                                         |
| Quick run command  | `cd frontend && pnpm exec vitest run <file>` (generate-entry pin: 596ms)                                                                           |
| Full suite command | `pnpm test --continue` (Turbo — `--continue` mandatory, D-20)                                                                                      |

### Phase Requirements → Test Map

| Req ID                | Behavior                                                                                                     | Test Type                                         | Automated Command                                                                                                                          | File Exists?                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| DEAD-01               | typed query + each chip render results; error → `role="alert"`                                               | e2e (natural, post-fix)                           | `pnpm exec playwright test tests/e2e/95-search-renders.spec.ts --project=chromium-en --no-deps`                                            | ❌ Wave 0                           |
| DEAD-01               | repository adapter maps the real envelope                                                                    | unit                                              | `cd frontend && pnpm exec vitest run src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts`                       | ❌ Wave 0                           |
| DEAD-02               | deployed fn answers non-404                                                                                  | probe                                             | `bash scripts/probe-edge-auth.sh assignments-queue`                                                                                        | ✅ (script) — deploy is the subject |
| DEAD-02               | queue page renders one of the four truthful states                                                           | e2e / CDP harness                                 | new `95-queue-renders.spec.ts` (inline auth, `--no-deps`, 15s budget)                                                                      | ❌ Wave 0                           |
| DEAD-03               | 500 renders `data-testid="query-error-state"`, never spinner                                                 | e2e (CDP `Network.setBlockedURLs` or natural 500) | new `95-sandbox-error.spec.ts` — pattern clone of `93-tasks-queue-error.spec.ts`                                                           | ❌ Wave 0                           |
| DEAD-04               | `/monitoring` responds HTML + mounts a known DOM node; both API calls resolve                                | e2e + curl content-type check                     | new `95-monitoring-mounts.spec.ts`; `curl -s -o /dev/null -w '%{content_type}' http://localhost:5173/monitoring`                           | ❌ Wave 0                           |
| DEAD-08               | `/positions/:id/approvals` deep-link → `aria-selected="true"`; back moves tabs; legislation detail reachable | e2e                                               | new `95-slots-tabs.spec.ts`                                                                                                                | ❌ Wave 0                           |
| DEAD-08               | one owner per slot in the generated tree                                                                     | static                                            | `! command grep -q "positionId" frontend/src/routeTree.gen.ts` after regen (positive-control the grep first)                               | gate, not spec                      |
| DEAD-09               | completed entry ⇒ real fetchable url; unavailable stays the fallback                                         | unit (pin) + probe                                | `cd frontend && pnpm exec vitest run src/pages/reports/__tests__/generate-entry.test.ts` (✅ exists, 5/5 green) + POST probe returning url | pin ✅; probe Wave 0                |
| NOTFOUND-COMPONENT-01 | rule fires on synthetic bare component throw; silent on 3 existing sites                                     | lint controls                                     | `pnpm exec eslint -c eslint.config.mjs <synthetic>` (expect exit 1) then the three sites (expect exit 0)                                   | ❌ Wave 0 (rule + fixture)          |
| RETENTION-CAST-01     | N-row envelope → N rows; `{data:[]}` → empty; malformed → error                                              | unit (hook, msw/mock) + e2e optional              | `cd frontend && pnpm exec vitest run src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts`                                       | ❌ Wave 0                           |

### Sampling Rate

- **Per task commit:** the touched unit file(s) via `pnpm exec vitest run <file>` (sub-second)
- **Per wave merge:** `pnpm --filter frontend test` + `pnpm lint` (lint carries the new NOTFOUND rule + i18n/namespace checks)
- **Phase gate:** `pnpm test --continue` green + the phase's e2e specs `--no-deps` + probe lines re-run before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/95-search-renders.spec.ts` — DEAD-01 (natural render; NOT CDP-blocked)
- [ ] `tests/e2e/95-queue-renders.spec.ts` — DEAD-02 (post-deploy natural state)
- [ ] `tests/e2e/95-sandbox-error.spec.ts` — DEAD-03 (clone the 93 CDP pattern)
- [ ] `tests/e2e/95-monitoring-mounts.spec.ts` — DEAD-04 (HTML content-type + DOM node + 2 calls resolve)
- [ ] `tests/e2e/95-slots-tabs.spec.ts` — DEAD-08 (deep-link + back + legislation detail)
- [ ] ESLint rule module + synthetic positive-control fixture — NOTFOUND-COMPONENT-01
- [ ] `useRetentionPolicies` unit test with mocked envelope — RETENTION-CAST-01
- [ ] Framework install: none — all runners present and verified working

Note: several oracles are **execution-time** (they need the deploy or the fix to exist before
their green direction is constructible) — label them per D-13/C1 (`NOT CONSTRUCTED: needs
deployed assignments-queue`) rather than faking a green.

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                                                                           |
| --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes            | Supabase JWT via `apiGet`/injected-header `getUser()`; the DEAD-04 alerts call MUST gain the Authorization header it lacks today; `verify_jwt` default-on for deployed fns |
| V3 Session Management | no (unchanged) | `_protected.tsx` beforeLoad session check — untouched                                                                                                                      |
| V4 Access Control     | yes            | assignments-queue role gate (staff_profiles) stays server-side; data-retention admin gate reads `public.users.role` (never user_metadata — house rule held)                |
| V5 Input Validation   | yes            | Existing fn-side validation retained (search q/type/status guards; reports type/format guard at :258); no new input surfaces                                               |
| V6 Cryptography       | no             | Nothing hand-rolled; signed URLs via Supabase Storage (time-boxed 24h)                                                                                                     |

### Known Threat Patterns for this stack

| Pattern                                      | STRIDE                 | Standard Mitigation                                                                                                                             |
| -------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Internal-string leakage in error UI          | Information Disclosure | `QueryErrorState` + P93 copy rule: no `error.message`, no PG codes/`supabase`/stack shapes in JSX; the UI-SPEC verification regex is the oracle |
| Secret echo in probes                        | Information Disclosure | `probe-edge-auth.sh` house rule: never echo JWT/password; probes report status codes only (held this session)                                   |
| Fail-open path parsing (`EDGEPATH-01` class) | Elevation/Tampering    | OUT OF SCOPE (P100) — but new client transport must use real URL paths (`apiGet`), never `functions.invoke` for path/query-dependent fns        |
| Fabricated success over failure              | Repudiation/Integrity  | D-08/D-10 forbidden shapes; completed-without-url never renders; `Array.isArray(x)?x:[]` banned                                                 |
| Signed-URL over-exposure                     | Information Disclosure | 24h expiry per the pdf-generate precedent; bucket `private`, not public URLs                                                                    |

## Sources

### Primary (HIGH confidence — verified this session)

- Live staging probes (`scripts/probe-edge-auth.sh` + one enveloped GET), project `zkrcjzdemdmwhearhfgg`, 2026-08-16: assignments-queue 404; search 400/200-envelope; reports 200; custom-reports 200; scenario-sandbox 500 FETCH_FAILED; quickswitcher-search 400; pdf-generate 400
- Source reads at HEAD: all seams pinned in 95-CONTEXT §canonical_refs, plus `useDossierFirstSearch.ts`, `dossiers.repository.ts`, `api-client.ts`, `useAssignmentQueue.ts`, `assignments-queue/index.ts`, `scenario-sandbox/index.ts`, `query-client.ts`, `Dashboard.tsx`, `backend/src/index.ts`, `deploy/nginx/*.conf`, `positions*`/`legislation*` route files, `routeTree.gen.ts`, `reports/index.ts`, `custom-reports/index.ts`, `pdf-generate/index.ts`, `generate-entry.ts` + test, `misc.repository.ts`, `useRetentionPolicies.ts`, `audit.repository.ts`, `data-retention/index.ts`, `data-retention.tsx`, `eslint.config.mjs`, `i18n/index.ts`, `vitest.config.ts`, `playwright.config.ts`, migrations (theme→topic, elected_official)
- Executed checks: vitest run of the generate-entry pin (5/5, 596ms); route-population derivation (201); all sweeps instrument-tested per D-20
- `.planning/GATE-STANDARD.md`, `95-CONTEXT.md`, `95-UI-SPEC.md`, `RULING-P95-01-PARK-MONITORING.md`, `REQUIREMENTS.md` register rows

### Secondary (MEDIUM confidence)

- TanStack Router file-based routing conventions (flat file + directory = parent/children; `<Outlet/>` renders children) — consistent with the repo's own working examples (`positions.tsx` layout) and the register's traced NOTFOUND behavior `[CITED: tanstack.com/router/latest/docs/framework/react/routing/file-based-routing]`

### Tertiary (LOW confidence, flagged for validation)

- A2 (HeroUI aria-drop on asChild) — project memory, re-verify in-browser
- A1 (esquery ancestor-negation absence) — training knowledge; the mandated controls decide it

## Metadata

**Confidence breakdown:**

- Root causes (all 8 requirements): HIGH — every one verified against source AND (where applicable) the deployed artifact
- Fix recommendations: HIGH for DEAD-02/03/04/08, RETENTION, NOTFOUND (mechanisms fully traced); MEDIUM for DEAD-01 related-work option choice and DEAD-09 format scope (planner discretion, both truthful)
- Pitfalls: HIGH — mostly re-verified live (vitest reporter, probe behavior, sweeps)

**Research date:** 2026-08-16
**Valid until:** 2026-09-15 for in-repo facts; deployed-function facts (probe results) are valid until the next deploy — re-probe at execution start.
