# Phase 97: Reachability - Context

**Gathered:** 2026-08-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Nothing built is unreachable, and nothing in the route tree is unowned. Four success criteria
(`ROADMAP.md` §Phase 97), four requirements (`NAV-01..04`, register rows 543–546 at HEAD
`9c32c4db1` — the ROADMAP requirement line MATCHES the register this phase; the derivation
still runs and says so). This phase DELETES routes by design: every deletion has a recorded
decision row, and route-count-anchored gates must survive legitimate deletions.

**OUT of this phase (named, not assumed):** COPY-\* including the global English toast
(P98 owns `COPY-06`); Arabic naturalness / pixel RTL (P99 + operator parks); RLS/residue
(P100); CI (P101); `/delegations`, GATESTD-01, WRITER-ROUTE-01, INSERT-SYNC-01 (P102).
**EXCLUDED from deletion decisions:** `/delegations` (P102-owned) and the legal-holds region
(P100-owned) — their NAV-04 rows, if any, record "owned elsewhere, untouched" with the owner
named; a nav or deletion decision that repairs, removes, or re-homes them is a REJECT
(`ACCEPTANCE-P97-PLAN.md` condition 8).
**Intentional route shapes a reachability sweep must NOT "fix":** the `/engagements`
double-mount (intentional), `scenario-sandbox` and `responsive-demo` (kept deliberately),
demos removed / contacts retired (route-namespace memory).

</domain>

<decisions>
## Implementation Decisions

Numbering restarts per phase (P96 used `D-01..`). Decisions carried forward are marked
**[inherited]** with their origin. Per the overseer question policy (ORCH-BRIEF §2 rule 4),
every decision below is either determined by documents (cited) or parked
(`.tickmarkr/overseer/PARK-P97.md`). No parks were needed at discuss time.

### Scope and requirement mapping

- **D-01: The phase closes 4 requirements** — `NAV-01..04`, each mapped in plan frontmatter to
  the success criterion it serves, re-derivable by command against the register
  (`.planning/REQUIREMENTS.md` rows 543–546; definition lines 132–135). The ROADMAP line
  matches the register this phase — first time in four phases; the coverage derivation still
  runs by command and states the match rather than assuming it. **NAV-04's filed sub-item is IN
  SCOPE by name:** `frontend/src/services/auth.ts` (see D-07). A silent drop of any requirement,
  the sub-item, or a route is a REJECT (`ACCEPTANCE-P97-PLAN.md` condition 1, Branches).
- **D-02: Out-of-phase surfaces are named, not assumed** — the exclusion list in the Phase
  Boundary above is the record. Source: ORCH-BRIEF §3 OUT-of-scope + `ACCEPTANCE-P97-PLAN.md`
  condition 8 (intended-broken exclusions).

### NAV-01 — Elected Officials on all four exposure surfaces

- **D-03: All 8 declared dossier types — Elected Officials included — appear in the sidebar,
  the dossier hub type cards, `/dossiers/create`, and `/compare`** (criterion 1; current state
  7-of-8). Evidence already on disk (cite, do not rediscover): EO is represented as
  `person_subtype` — the type exists in data, the nav never surfaces it (project memory,
  Round-11 UAT). RESEARCH resolves how the 8th type is represented end-to-end (first-class
  `dossier_type` vs `person_subtype` filter) from the live schema + `DossierTypeSelector.tsx` /
  `getDossierRouteSegment` before the planner fixes the mechanism per surface. New nav labels
  land in BOTH locales same-commit, colon-form keys (condition 9) [inherited — P93 D-04,
  P94 D-10]. **No new nav entry points at a known-broken surface without that surface's state
  named in the entry's decision row** (condition 8) — the EO create path is verified working
  (or its state recorded) before `/dossiers/create` exposes it.

### NAV-02 — one source of truth for the /settings route-match predicate

- **D-04: The two disagreeing checks unify to ONE source of truth — never a second synced
  copy** (the STAGE_TO_STATUS agree-by-authorship lesson; condition 8). The disagreement is
  anchored: `frontend/src/components/layout/AppShell.tsx:125` hides the global sidebar by
  prefix (`pathname.startsWith('/settings')`) while
  `frontend/src/routes/_protected/settings.tsx:11-17` renders the settings nav by exact match
  (`pathname === '/settings'`), so `/settings/*` sub-pages get NO navigation at all
  (criterion 2). One shared route-match predicate consumed by both sites; where it lives is
  planner discretion. The whole tree is swept for further consumers of either predicate before
  the edit — a fix that names 1 site when more need it is the P-drift class [inherited —
  P95 D-07].

### NAV-03 — Digests tab + create affordances

- **D-05: The engagement Digests tab appears in the tab bar, and every list page exposes a
  create affordance** (criterion 3). The population is **the 8 list pages** — the plan
  enumerates all 8 and names which one already has the affordance (currently 7 of 8 have
  none; ORCH-BRIEF §3). Affordances follow the `.btn-primary` / `.btn-ghost` recipes and the
  closest-existing-component law (condition 9; `frontend/DESIGN.md`); no new button variants.
  A create affordance whose target create flow is known-broken names that state in the
  decision record rather than silently linking to it (condition 8).

### NAV-04 — per-route decision table, single-writer

- **D-06: Every route with no inbound link is resolved — the 9 admin routes + `/monitoring`
  each get a nav entry or are deleted, with the decision RECORDED PER ROUTE in a SINGLE-WRITER
  table** in the closing plan's own file; decision + why per row; NOT-CHECKED beats silence
  (condition 6). **`/monitoring`'s route KEEP is already ruled** —
  `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md` (`RULING-P95-01`) is
  this row's named input; its row decides ONLY the nav entry
  (`frontend/src/components/modern-nav/navigationData.ts:262` already links it — deliberately
  left by P95 as P97 scope). Per-route decisions are made in-plan against derived evidence
  (renders? inbound links? consumers? owner?); a route whose disposal is genuinely
  underdetermined by evidence is PARKED per policy, not guessed. The register counts 9 admin
  routes — the plan derives the admin-route population mechanically from `routeTree.gen.ts`
  and reconciles against that count, stating any delta rather than trusting either number.
- **D-07: `frontend/src/services/auth.ts` resolves DELETE-or-OWN with the why recorded**
  (condition 1). Filed basis: `RULING-P92-06` (recorded at `.tickmarkr/overseer/DECISIONS.md`
  §D-7) — dead module, ZERO importers, carrying a SECOND zustand store on the live
  `'auth-storage'` key plus a module-level `onAuthStateChange` that never registers. P92
  verified it dead and deliberately left it. **Deletion happens only after the zero-importer
  derivation is RE-RUN at execution and instrument-tested against a known-imported control**
  (condition 8; `grep` here is a ugrep wrapper honoring .gitignore — instrument-test every
  zero [inherited — project memory]).

### Gate authorship and populations

- **D-08: Route-count-anchored gates survive legitimate deletions** — this phase deletes
  routes by design, so any gate pinning a route count derives it at run time or states the
  expected delta; a frozen count is the moving-number class (condition 3). Deletions
  regenerate `routeTree.gen.ts` — P95's 202 route count is expected to shift, and the gates
  say so.
- **D-09: Two populations rule this phase, each per closing derivation** (condition 4): the
  ROUTE population (mechanical from `frontend/src/routeTree.gen.ts`, blind spots stated) and
  the **INBOUND-LINK population** — an instrument over the link/navigation vocabulary
  (`Link to=`, `navigate(`, nav-data structures, redirects, sidebar/menu configs), blind spots
  STATED (computed/template hrefs, runtime-built paths), residual HAND-CLASSIFIED as part of
  the deliverable. "No inbound link" is a ZERO claim — every such zero is instrument-tested
  against a known-linked control. The TRIGSWEEP lesson binds: syntactic sweeps under-count
  behaviour classes; the instrument is the union of known forms plus a suspect list, and its
  count is a FLOOR [inherited — P96 TRIGSWEEP-01].
- **D-10: Reachability criteria are click-through claims** — a nav entry OBSERVED to reach its
  page (browser-harness CDP / e2e), not merely present in a data structure; each of the four
  criteria says how it is observed; execution-blocked oracles labelled with
  producer-before-consumer ordering; Playwright spec paths are FILTERS — assert existence
  first, hardcode counts (condition 7) [inherited — project memory].
- **D-11: Every gate meets `GATE-STANDARD-P92.md` via `scripts/gate-drill.mjs` in BOTH
  directions or is UNPROVEN-labelled** (GATESTD-01 → P102 workaround); zero vacuous guards;
  post-close mutations name which closed gates' subjects they change (condition 3, standing
  law). C9a swept; C9b mock-vs-real via `scripts/c9b-sweep.sh` ONLY (condition 5).

### House rules

- **D-12:** New nav labels in BOTH locales same-commit, colon-form; chrome via design tokens
  with the closest-existing-component law (sidebar patterns); **NO visual baselines
  committed** (the operator's four-point calendar sign-off precedent stands); no plan waits on
  E2ECRED-01; single-instance behavioural testing — single-origin CORS, `:5173` only
  (condition 9) [inherited — P95/P96].
- **D-13:** Every plan carries at least one citation truth (`truths:`) so the mechanical
  decision-coverage gate passes with `uncovered: []` and a falsification drill lands on disk
  (condition 2) [inherited — project memory: the gate scans plan truths only].

### Claude's Discretion

- Where the shared `/settings` route-match predicate lives and its exact API.
- The NAV-01 mechanism per surface, once research resolves the EO representation.
- The per-route decision table's column layout (decision + why + owner are mandatory content).
- Which nav section/group the surviving admin routes join, subject to the design rules.
- Plan/wave decomposition.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract and inputs

- `.planning/ROADMAP.md` §Phase 97 — goal + 4 success criteria (lines 477–490)
- `.planning/REQUIREMENTS.md` — NAV-01..04 definitions (lines 132–135) + register rows 543–546
- `.tickmarkr/overseer/ACCEPTANCE-P97-PLAN.md` — the 10 pre-committed plan-acceptance
  conditions; conditions 3 (deletion-safe gates), 4 (INBOUND-LINK population), 8
  (intended-broken deletion exclusions) are new this phase
- `.tickmarkr/overseer/ORCH-BRIEF.md` — mission, pre-baked evidence, environment facts
- `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md` — the `/monitoring`
  KEEP record (`RULING-P95-01`); NAV-04's `/monitoring` row consumes it by name
- `.tickmarkr/overseer/DECISIONS.md` §D-7 — `RULING-P92-06`, the `services/auth.ts` filing

### Gate and instrument law

- `.tickmarkr/overseer/GATE-STANDARD-P92.md` — what a proven gate is
- `scripts/gate-drill.mjs` — both-direction gate drill instrument
- `scripts/c9b-sweep.sh` — the ONLY C9b instrument
- `scripts/probe-edge-auth.sh` — prints `404-kind` (gateway vs function)

### Design truth (UI work)

- `frontend/DESIGN.md` — Linear spec: tokens, type, radii, recipes
- `frontend/src/design-system/CLAUDE.md` — runtime token engine

</canonical_refs>

<code_context>

## Existing Code Insights

### Anchored evidence (verified on disk at discuss time)

- `frontend/src/components/layout/AppShell.tsx:125` — `isSettingsRoute =
pathname.startsWith('/settings')` hides the global sidebar (F18/D-85-03 comment).
- `frontend/src/routes/_protected/settings.tsx:11-17` — exact-match check
  (`matches[last].pathname === '/settings'`) gates the settings page vs `<Outlet/>`.
- `frontend/src/components/modern-nav/navigationData.ts:262` — the sole `/monitoring`
  inbound link (P95's residual population of exactly one).
- `frontend/src/services/auth.ts` — exists, 18.4 KB, zero importers (per RULING-P92-06;
  re-derive at execution).
- `frontend/src/routes/_protected/admin/` — 8 route files today (`ai-settings`, `ai-usage`,
  `approvals`, `data-retention`, `field-permissions`, `index`, `preview-layouts`, `system`);
  the register says 9 admin routes — the plan reconciles the mechanical derivation against
  that count and states the delta.
- `frontend/src/components/Dossier/DossierTypeSelector.tsx` — exists; NAV-01 mechanism input.

### Reusable Assets

- `frontend/src/components/modern-nav/` — navigationData + IconRail: the nav registration
  surface for new entries.
- `@/lib/dossier-routes` `getDossierRouteSegment`, `@/lib/dossier-type-guards`
  `isValidDossierType` — dossier type plumbing for NAV-01.
- Shared P93 query-error/empty component family — any surface newly exposed must fail
  honestly, not blank.

### Established Patterns

- Single-writer output files; explicit-pathspec commits; `.planning/`-only commits auto-skip
  the build hook; prettier re-wraps frontmatter block-sequences — verify machine-readable
  frontmatter PARSES after every hook run (P95 empty-map incident).
- zsh does not word-split unquoted expansions; `timeout` does not exist here; ABSOLUTE PATHS
  in every command whose cwd was not just set.

### Integration Points

- `frontend/src/routeTree.gen.ts` — regenerates on route deletion; route-population
  derivations and count gates anchor here at run time.
- Sidebar + hub type cards + `/dossiers/create` + `/compare` — the four NAV-01 exposure
  surfaces.

</code_context>

<specifics>
## Specific Ideas

- The per-route decision table row format from the acceptance: route | decision (nav entry /
  delete / owned-elsewhere-untouched / NOT-CHECKED) | why | named owner where applicable.
- Exec-leg worker pattern is pre-decided (ORCH-BRIEF §3): visible panes, `claude -p` with
  digit-anchored sentinels — plan structure should keep plans independently executable in
  that shape.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Out-of-scope surfaces are recorded in the
Phase Boundary exclusion list, each with its owning phase.)

</deferred>

---

_Phase: 97-reachability_
_Context gathered: 2026-08-17_
