# Phase 95: Routes That Don't Render - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

**Every route either renders its page or says why it can't, and the route tree has one owner per
slot.**

Five named route surfaces — `/search` (crashes), `/tasks/queue` (undeployed function),
`/scenario-sandbox` (500 indistinguishable from loading), `/monitoring` (proxy-shadowed),
positions/legislation detail (slot conflicts) — plus the report-generation path P94 left honest
but DEAD, plus two carried findings: the unenforced `notFound()` routing rule and the six false
casts in `useRetentionPolicies.ts`.

**Eight requirements, not five.** `ROADMAP.md` §Phase 95 listed only `DEAD-01..04, DEAD-08` until
2026-08-16; the REQUIREMENTS.md register table assigns EIGHT to this phase: `DEAD-01`, `DEAD-02`,
`DEAD-03`, `DEAD-04`, `DEAD-08`, `DEAD-09`, `NOTFOUND-COMPONENT-01`, `RETENTION-CAST-01`
(register rows 521–524, 528–529, 567, 571). The roadmap line was reconciled in commit `d165b3e53`
citing `.tickmarkr/overseer/ACCEPTANCE-P95-PLAN.md` condition 1 — register wins. This mirrors the
P94 house convention (`ba19751c6`).

**This phase does not** touch counts/charts (`DEAD-05/06/07`, `COUNT-*`, `TRIGSWEEP-01` — P96),
nav/reachability (`NAV-*` — P97), copy (`COPY-*` — P98), `EDGEPATH-01`/`DR-SUBPATH-01`/
`RLS-AUTHUSERS-01` (P100), `ORACLECAP-01`/`E2ECRED-01` (P101), or `DELEG-02`/`GATESTD-01`/
`GATESTD-03` (P102). **Intended-broken surfaces that stay off-limits:** `/delegations` (P102),
the legal-holds region (P100), `/analytics` (P96) — an opportunistic repair of any of these is a
REJECT of the leg (ORCH-BRIEF §3).

</domain>

<decisions>
## Implementation Decisions

Numbering restarts per phase (P94 used `D-01..D-34`). Decisions carried forward are marked
**[inherited]** with their origin.

### Scope and requirement mapping

- **D-01: The phase closes 8 requirements**, each mapped in plan frontmatter to the success
  criterion (or filed-finding close) it serves, re-derivable by command against the register.
  Source: `.planning/REQUIREMENTS.md` register rows 521–524, 528–529, 567, 571;
  `.tickmarkr/overseer/ACCEPTANCE-P95-PLAN.md` condition 1. A silent drop of any of the eight is
  a REJECT.
- **D-02: Out-of-phase surfaces are named, not assumed** — the list in the Phase Boundary above
  is the exclusion record. Source: ORCH-BRIEF §3 "OUT of this phase" + intended-broken register.

### DEAD-01 — /search

- **D-03: The fix is the data path that produces `undefined` before `.forEach`, not a guard at
  the crash site.** Both typed queries AND the page's own suggestion chips are inside the oracle
  population — criterion 1 names both. A `?.forEach` that renders an empty result set over a
  server error would be the confident-lie class; the fix must render results (or the P93 error
  state) truthfully.

### DEAD-02 — /tasks/queue

- **D-04: `assignments-queue` exists in-tree (`supabase/functions/assignments-queue/`) and the
  missing half is DEPLOYMENT.** A fixed function that is not redeployed has not been fixed
  [inherited — P94 `D-19`]. Deploy via Supabase CLI/MCP with deploy evidence per
  `scripts/probe-edge-auth.sh` pattern. P94's intended-broken register FORBADE this repair there;
  **Phase 95 is the owner — repairing it now is the mission, not a violation** (ORCH-BRIEF §3).

### DEAD-03 — /scenario-sandbox

- **D-05: The error state reuses the shared query-error component Phase 93 extracted** —
  `role="alert"`, bilingual, internal-string-free [inherited — P93 `D-03`/`D-04`/`D-08`]. A
  backend 500 must be visually distinct from "still loading"; new copy lands in BOTH locales
  under the i18n key-set-equality gate [inherited — P93 `D-04`, P94 `D-09`], colon-form keys only
  [inherited — P94 `D-10`].

### DEAD-04 — /monitoring

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

### DEAD-08 — one owner per slot

- **D-07: Slot consolidation is a tree-wide operation, not a file rename.**
  `positions/$id.tsx` vs `positions/$positionId.tsx` vs the `positions/$id/` directory resolve to
  ONE owner per slot; `legislation.tsx` renders `<Outlet/>` so its detail child is reachable;
  positions `approvals`/`versions` children drive tab state (criterion 5's own text). Which param
  name survives is planner's discretion, but every inbound link and `useNavigate`/`Link` target
  in the whole tree is swept in the same edit — grep the whole tree first (the P-drift lesson:
  a plan that names 1 site when 5 need it). Shipped-phase test consumers are enumerated per C9b.

### DEAD-09 — report generation

- **D-08: Generation ships REAL work; the honest unavailable terminal state is the ONLY
  permitted fallback.** The rename-never-ships-alone law (`RULING-P94-04` §PARK-94-06) holds: no
  change may convert a visible failure into an invisible fabricated success. Candidate paths from
  P94 research — the custom-reports function flow, or Express `/report-builder/generate`
  (`backend/src/.../misc.repository.ts:125`) — the choice is research/planner discretion, judged
  on which path can return a REAL artifact url. The client pin
  (`frontend/src/pages/reports/__tests__/generate-entry.test.ts`) is a C9b consumer: it is
  updated in the SAME task that changes `generate-entry.ts` behaviour, or recorded as a named
  non-consumer. Any edge-function change redeploys with probe evidence [P94 `D-19`].

### NOTFOUND-COMPONENT-01 — enforce or retire, never drop

- **D-09: Default branch = ADD the lint/gate**, if research proves it expressible with a positive
  AND negative control (a rule that fires on a synthetic bare component-`notFound()` and stays
  silent on the loader form and on the two compliant call sites). If research finds it
  inexpressible or not worth it, the RETIRE decision goes to a park for ruling — the register
  entry's own text authorizes explicit retirement, but a silent drop is a REJECT
  (`ACCEPTANCE-P95-PLAN.md` condition 1).

### RETENTION-CAST-01 — the six false casts

- **D-10: Fix the six casts in `useRetentionPolicies.ts` to unwrap the real `{data:[...]}`
  envelope.** **FORBIDDEN FIX SHAPE: `Array.isArray(x) ? x : []`** — that renders "No Policies"
  over rows the server sent, the confident-lie class this milestone exists to kill (`93-09`
  pattern decision, REQUIREMENTS.md:336). The consumption-point repair in `data-retention.tsx`
  (`asRows`, commit `b71ad62b`) is a live consumer of the hook's current lying shape — it is
  reconciled in the same task, per C9. The count "six" is re-derived before the edit, not
  trusted (scout counted 11 cast-shaped lines in the file; the register says six false ones).

### Gates, oracles and derivations — standing law

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

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and grading

- `.planning/ROADMAP.md` §Phase 95 — goal, 8 requirements (as reconciled `d165b3e53`), 5 success
  criteria
- `.planning/REQUIREMENTS.md` §DEAD (`DEAD-01..04`, `DEAD-08`, `DEAD-09` incl. its scope note),
  §`NOTFOUND-COMPONENT-01` (~line 318), §`RETENTION-CAST-01` (~line 336)
- `.tickmarkr/overseer/ACCEPTANCE-P95-PLAN.md` — the 10 grading conditions this plan set is
  ruled against; conditions 1 (eight-not-five), 4 (route population), 8 (forbidden shapes) are
  new this phase
- `.tickmarkr/overseer/ORCH-BRIEF.md` §3 — pre-baked evidence per requirement; do not rediscover
- `.tickmarkr/overseer/PARK-P95.md` — `PARK-95-01` (DEAD-04 keep-or-delete), RULED
- `.tickmarkr/overseer/RULING-P95-01-PARK-MONITORING.md` — KEEP + narrow proxy; the three
  conditions the DEAD-04 plan carries

### Standing law inherited from Phases 92–94

- `.planning/GATE-STANDARD.md` — C1–C10 incl. C9a, C9b
- `scripts/gate-drill.mjs` — mechanical half; a green from it is NOT evidence a gate is sound
- `scripts/decision-coverage.mjs` — frontmatter `must_haves`/`truths`/`objective` + matching body
  headings ONLY; two-digit `D-NN` ids only
- `scripts/probe-edge-auth.sh` — deploy evidence pattern (stdout `fn -> status`)
- `.planning/phases/94-write-paths/94-CONTEXT.md` — the inherited-law block (D-23..D-29) and the
  relabel note on sub-lettered ids
- `.planning/phases/93-failure-visibility/93-CONTEXT.md` — shared error component, bilingual
  `role="alert"`, no server `error.message`

### House rules

- `CLAUDE.md` §Security / §Deployment — staging `zkrcjzdemdmwhearhfgg` eu-west-2; migrations via
  `apply_migration` only; user-facing errors never leak internals
- `frontend/DESIGN.md` then `frontend/src/design-system/CLAUDE.md` — Linear (dark) spec and the
  runtime token engine, in that order, before any UI edit

### The seams, pinned (scout 2026-08-16)

- `frontend/src/routes/_protected/search.tsx` — the crashing route (DEAD-01)
- `frontend/src/routes/_protected/tasks/queue.tsx` + `supabase/functions/assignments-queue/` —
  the undeployed pair (DEAD-02)
- `frontend/src/routes/_protected/scenario-sandbox.tsx` — DEAD-03
- `frontend/src/routes/_protected/monitoring.tsx` + `frontend/vite.config.ts:130-133` +
  `backend/src/api/contract/monitoring.ts` — the proxy shadow (DEAD-04)
- `frontend/src/routes/_protected/positions/` — `$id.tsx`, `$positionId.tsx`, `$id/`
  (`approvals.tsx`, `versions.tsx`) — the contested slots (DEAD-08)
- `frontend/src/routes/_protected/legislation.tsx` + `legislation/` — the missing `<Outlet/>`
  (DEAD-08)
- `supabase/functions/reports/index.ts:266-285` — the mock POST; `:258` the `type` guard
  (DEAD-09)
- `frontend/src/pages/reports/generate-entry.ts` +
  `frontend/src/pages/reports/__tests__/generate-entry.test.ts` — the honest-dead client and its
  pin (DEAD-09)
- `backend/src/.../misc.repository.ts:125` — the Express `/report-builder/generate` candidate
  (DEAD-09)
- `frontend/src/domains/audit/hooks/useRetentionPolicies.ts` (261 lines) +
  `frontend/src/pages/**/data-retention.tsx` (`asRows`, `b71ad62b`) — the six casts and their
  consumer (RETENTION-CAST-01)
- `DossierShell.tsx:144`, `WorkspaceShell.tsx`, `reports/$reportId.tsx:54` — the three current
  `notFound()` sites (two compliant component throws, one correct bare loader throw)
  (NOTFOUND-COMPONENT-01)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **The shared query-error component from Phase 93** — bilingual, `role="alert"`,
  internal-string-free. DEAD-03's error state and any new failure surface reuses it.
- **`scripts/probe-edge-auth.sh`** — proven deploy evidence for DEAD-02/DEAD-09 function deploys.
- **`frontend/src/routeTree.gen.ts`** — the generated route manifest; the mechanical source for
  every "every route" population derivation (D-12).
- **P93's i18n key-set-equality gate pattern** — for DEAD-03's both-locale copy.

### Established Patterns

- Result-shaped data clients (`{ ok: true, … } | { ok: false, error }`, never throw) —
  `~/.claude/rules/core.md`; whatever the search/retention fixes do must be consistent within
  their own API surface.
- Logical properties only (`ms-*`/`ps-*`/`text-start`) and `dir` handling for any markup added;
  Linear dark tokens only, no raw hex.
- i18n colon-form namespaces; dot-form resolves against the aliased default namespace and renders
  the raw key.

### Integration Points

- `assignments-queue` and any `reports` change are EDGE deploys, not just source edits — deploy
  evidence required (P94 `D-19`).
- The Vite proxy table (`vite.config.ts`) is the boundary DEAD-04 lives on; production
  reverse-proxy config under `deploy/` may mirror the same claim — researcher verifies.
- `@tanstack/react-router@1.170.8` file-route conventions govern the DEAD-08 consolidation; the
  route tree is regenerated (`routeTree.gen.ts`) and the regen is part of the same commit.

</code_context>

<specifics>
## Specific Ideas

- **DEAD-02 is a deployment gap wearing a rendering costume** — the function directory exists;
  research must establish whether the in-tree source is also broken or only undeployed.
- **The register's "six casts" and the scout's 11 cast-shaped lines disagree** — re-derive the
  cast population inside the task before editing (D-10).
- **DEAD-04 is the acceptance's own example of a route the SPA tree cannot see** — the route
  population derivation (D-12) must name the proxy table as a second population source.

</specifics>

<deferred>
## Deferred Ideas

- Out-of-phase by prior ruling, listed so no plan folds them in: `DEAD-05/06/07`, `COUNT-*`,
  `TRIGSWEEP-01` → P96; `NAV-*` → P97; `COPY-*` → P98; `EDGEPATH-01`, `DR-SUBPATH-01`,
  `RLS-AUTHUSERS-01` → P100; `ORACLECAP-01`, `E2ECRED-01` → P101; `DELEG-02`, `GATESTD-01`,
  `GATESTD-03` → P102.
- Intended-broken surfaces off-limits: `/delegations` (P102), legal-holds region (P100),
  `/analytics` (P96).
- Arabic naturalness + pixel RTL sign-off are OPERATOR parks — no plan claims either
  (ORCH-BRIEF §3).

</deferred>

---

_Phase: 95-routes-that-don-t-render_
_Context gathered: 2026-08-16_
