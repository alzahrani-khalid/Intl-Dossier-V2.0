# Phase 96: Real Numbers - Context

**Gathered:** 2026-08-17
**Status:** Ready for planning

<domain>
## Phase Boundary

**Every count, chart and trend on screen comes from real data and agrees with every other
surface.**

Three dead data surfaces — `/analytics` (fabricated visuals over a missing backend),
`/custom-dashboard` (queries a column that does not exist), the calendar family
(`/calendar`, `/calendar/new`, `/events`, `/word-assistant`) — plus four count-truth
requirements (one source of truth for work-item counts; extension-row joins; the
`status`/`workflow_stage` sync VERIFIED not built; the two-notions-of-overdue seam), plus two
inherited instruments-as-requirements: the BEFORE-trigger sweep re-derived from behaviour
(`TRIGSWEEP-01`) and the WORKING scenario sandbox (`SANDBOX-500-01`).

**Nine requirements, not six.** `ROADMAP.md` §Phase 96 listed only
`DEAD-05/06/07, COUNT-01..03` until 2026-08-17; the REQUIREMENTS.md register table assigns NINE
to this phase: `DEAD-05`, `DEAD-06`, `DEAD-07`, `COUNT-01`, `COUNT-02`, `COUNT-03`, `COUNT-04`,
`TRIGSWEEP-01`, `SANDBOX-500-01` (register rows 530–540 at pre-leg HEAD `00861519d`). The
roadmap line was reconciled in commit `e0fe78a5d` citing
`.tickmarkr/overseer/ACCEPTANCE-P96-PLAN.md` condition 1 — register wins, third phase running.
A silent drop of any of the nine is a REJECT.

**This phase does not** touch nav/reachability (`NAV-*` — P97), copy (`COPY-*` — P98), Arabic
coverage (`AR-*` — P99), RLS/client-residue (`EDGEPATH-01`, `DR-SUBPATH-01`, `RLS-AUTHUSERS-01`,
`FUNC-GRANT-01` — P100), CI/oracle-capacity/credentials (`E2ESTALE-01`, `ROOTALIAS-01`,
`ORACLECAP-*`, `E2ECRED-01` — P101), or `/delegations` + `GATESTD-*` (P102).
**Intended-broken surfaces that stay off-limits:** `/delegations` (P102), the legal-holds region
(P100). **`/analytics` is NOT off-limits — P96 owns it**; it sat on the intended-broken register
owned by this phase, and repairing it now is the mission (ORCH-BRIEF §3).

</domain>

<decisions>
## Implementation Decisions

Numbering restarts per phase (P95 used `D-01..D-20`). Decisions carried forward are marked
**[inherited]** with their origin. Per the overseer question policy (ORCH-BRIEF §2 rule 4),
every decision below is either determined by documents (cited) or parked
(`.tickmarkr/overseer/PARK-P96.md`).

### Scope and requirement mapping

- **D-01: The phase closes 9 requirements**, each mapped in plan frontmatter to the success
  criterion (or filed-finding close) it serves, re-derivable by command against the register.
  Source: `.planning/REQUIREMENTS.md` register rows 530–540;
  `.tickmarkr/overseer/ACCEPTANCE-P96-PLAN.md` condition 1. Entry-specific close shapes are
  binding: `COUNT-03` closes by **VERIFY-not-build**; `TRIGSWEEP-01` closes by a
  **BEHAVIOUR-derived instrument** tested in both directions; `SANDBOX-500-01` closes on the
  **WORKING sandbox** (the honest error is P95's, done).
- **D-02: Out-of-phase surfaces are named, not assumed** — the exclusion list in the Phase
  Boundary above is the record. Source: ORCH-BRIEF §3 "OUT of this phase" + the intended-broken
  register (of which only `/delegations` and legal-holds remain off-limits).

### DEAD-05 — /analytics

- **D-03: Real data or HONESTLY DISABLED as a RECORDED decision branch — never a quiet stub.**
  No fabricated sparklines, donuts, or "Insights you'll gain" over a backend endpoint that does
  not exist (`REQUIREMENTS.md:91`; ACCEPTANCE condition 8). Which branch is taken is decided by
  RESEARCH feasibility (does a real data path exist within the current stack for each widget?)
  and the branch decision is RECORDED in the plan text as a decision branch, with the honest
  disable rendered as an explicit state (shared P93 error/empty component family — bilingual,
  `role="alert"` where an error), never a blank or a mock. If the disabled branch is taken, nav
  handling of the disabled route defers to P97 (reachability is its domain) and the record says
  so.

### DEAD-06 — /custom-dashboard

- **D-04: The column is `calendar_entries.event_date`, NOT `start_datetime`** (verified **[V]**,
  `REQUIREMENTS.md:92`). The chart renders, and trend deltas are computed from COMPLETED
  requests — "0.0%" derived from an aborted request is the confident-lie class and is a
  forbidden shape (ACCEPTANCE condition 8).

### DEAD-07 — calendar family

- **D-05: `/calendar` renders a grid (empty or not), `/calendar/new` mounts the create form,
  `/events` pads the month by the REAL weekday offset with working month navigation, and
  `/word-assistant`'s status badge reflects a LIVE probe** (`REQUIREMENTS.md:93`).
  **`calendar_entries` is canonical; `calendar_events` is a separate, empty forum model — do NOT
  consolidate them** (project memory; ACCEPTANCE condition 9 names this house rule).

### COUNT-01 — one source of truth for work-item counts

- **D-06: The dashboard KPI, `/my-work` badge/footer/rows, `/commitments` tabs and the kanban
  board agree on the same number for the same work** (`REQUIREMENTS.md:102`). **The dashboard
  RPCs read `engagement_dossiers`, not `engagements`** (project memory;
  `supabase/migrations/20260330000001_operations_hub_rpcs.sql`) — every RPC's source table is
  verified before any count is trusted; **agreement between two surfaces sharing a wrong filter
  is not evidence** (ACCEPTANCE condition 4). The unification mechanism (shared hook/RPC vs
  per-surface filter reconciliation) is planner discretion, decided against a MECHANICALLY
  enumerated surface set — the agreement claim names which screens were compared and what falls
  outside (condition 4).

### COUNT-02 — extension-row joins

- **D-07: Type-list queries left-join their extension tables (or the counters use the same
  join)** so a dossier without an extension row is never dropped from the list while the hub
  counts it (persons 16 vs 15 **[V]**, engagements 5 vs 3; `REQUIREMENTS.md:103`). SC5's fixture
  (a dossier WITHOUT an extension row) is synthetic, namespaced, and cleaned; **CHECK constraints
  are verified via `pg_constraint` before ANY seed insert** [inherited — project memory];
  `aa_commitments` has NO FK to dossiers — batched `.in('id', ids)`, never a join through a FK
  that does not exist [inherited — project memory].

### COUNT-03 — status/workflow_stage sync: VERIFY, do not build

- **D-08: The sync trigger EXISTS — `trg_sync_task_status` (BEFORE UPDATE on `tasks`) already
  derives `status` from `workflow_stage`, `done` also stamping `completed_at`**
  (`REQUIREMENTS.md:104-107`; `.tickmarkr/overseer/P94-TRIGGER-SWEEP.md`). The work is
  CONFIRMING the invariant and finding surfaces that break it — a client-side re-implementation
  of what the DB trigger enforces is a forbidden shape (ACCEPTANCE conditions 1 and 8).
  `WorkBoard.tsx:78-84`'s `STAGE_TO_STATUS` is an independent TS copy of the same mapping —
  the two agree by AUTHORSHIP, not by construction, so the verify includes a parity oracle
  between them (D-82 parity-oracle context). Known gap the verify must cover: the trigger is
  BEFORE **UPDATE** only and never fires on INSERT (see D-09).
  **`commitment_status_history` records what the DB decided, never what the user asked** —
  BEFORE triggers fire alphabetically, so `commitment_overdue_check` rewrites before
  `commitment_status_audit` reads; the history table is never treated as user-intent evidence
  (ACCEPTANCE condition 8).

### COUNT-04 — two notions of overdue

- **D-09: One fact, one notion, or the seam stated** (`REQUIREMENTS.md:109-117`). The two
  signals: stored `aa_commitments.status='overdue'` (trigger `commitment_overdue_check`,
  bidirectional — its `ELSIF` reverts `overdue → in_progress` when the due date is extended;
  the trigger is CORRECT and STAYS) vs computed `it.is_overdue` counted at
  `WorkBoard.tsx:232-235`. Phase 96 owns: rendering `overdue` expressively (badge or column),
  unifying the two signals, and **the INSERT gap** — the trigger never fires on INSERT, which is
  why two past-due rows sit at `pending` (`REQUIREMENTS.md:128`). Any trigger-timing change is a
  migration through the Supabase MCP, never ad-hoc DDL (condition 9).
- **D-10: The refusal-interaction revisit is PARKED — `PARK-96-01`**
  (`.tickmarkr/overseer/PARK-P96.md`). `RULING-P94-03` explicitly left open whether refusal is
  still the right interaction once `overdue` is renderable; that is a genuine product fork and
  is not auto-answered. Plans are authored to the no-change branch (keep P94's refusal); a later
  ruling for allow-and-reflect is a post-close mutation and must NAME which closed gates'
  subjects it changes (condition 3).

  > **RULED 2026-08-17, same day — (a) KEEP REFUSAL** (`RULING-P96-01-PARK-REFUSAL.md`,
  > resolving `PARK-96-01`). Three conditions bind the plans: (1) branch (a) exactly as
  > authored — no mutation-path change; (2) any future revisit toward allow-and-reflect is a
  > post-close mutation naming which closed gates' subjects it changes; (3) **COUNT-04's close
  > states which overdue notion wins on which surface** (the unification's own record), so the
  > kept refusal reads as a decision, not a leftover. Decisive basis: branch (b) destroys the
  > record of intent — `commitment_status_history` reads `NEW.status` AFTER the overdue rewrite.

### TRIGSWEEP-01 — the inherited instrument, re-derived from behaviour

- **D-11: The trigger population derives from BEHAVIOUR — every `BEFORE` trigger that writes a
  `NEW.` column HOWEVER EXPRESSED — never from syntax** (`REQUIREMENTS.md:119-128`; the P94
  instrument matched only `:=` and saw 15% of its class — 29/25 honest for its rule, +164
  plain-`=` across 157 tables ≈ 193). **193 is a FLOOR, never a total.** The instrument is
  tested in BOTH directions (a synthetic trigger it must catch; a non-writing trigger it must
  not) before any count is believed — ninth instance of syntactic-form under-counting a
  behaviour class (ACCEPTANCE condition 4). Meaningful missed rewrites the derivation must
  surface include `staff_profiles.version`, `assignments._version`, `entity_comments.*`,
  `organization_leadership.is_current`, `legislations.version`,
  `intelligence_sources.next_scan_at` (ORCH-BRIEF §3).

### SANDBOX-500-01 — the WORKING sandbox

- **D-12: Make the sandbox WORK; the honest error is P95's, done** (`REQUIREMENTS.md:98`).
  Starting point: `95-RESEARCH.md` Open Question 2 — the server error was recorded as a masked
  `FETCH_FAILED`, with a Supabase-MCP `to_regclass` derivation offered as the cause-derivation
  path. The cause is DERIVED before the fix is planned in detail. Any function change redeploys
  with probe evidence (`scripts/probe-edge-auth.sh`, which now prints `404-kind:
gateway|function` on any 404). **`tests/e2e/95-sandbox-error.spec.ts` is a C9b consumer whose
  natural arm changes meaning the day this works** — its `requestfailed` guard anticipates that
  (95-03-SUMMARY deviation 2); it is updated (or shown still-sound) in the SAME task that lands
  the fix.

### The staff_profiles seed decision — named OUT (condition 9)

- **D-13: `staff_profiles` seeding is OUT of scope for Phase 96, named here so silence is not a
  finding** (`ACCEPTANCE-P96-PLAN.md` condition 9). Rationale: the unseen populated-queue render
  is `/tasks/queue`'s surface (`DEAD-02`, closed by P95); staging data seeding has a dedicated
  owner (`DATA-01`, Phase 102). Tripwire: research verifies that no Phase 96 criterion surface
  reads `staff_profiles` — if one does, this decision escalates to a park rather than being
  silently held.

### Gates, oracles and derivations — standing law

- **D-14: `.planning/GATE-STANDARD.md` C1–C10, incl. C9a and C9b, governs every gate from
  authoring** [inherited — P93 `D-17`, P94 `D-23`, P95 `D-11`]. Both directions observed per
  gate via `scripts/gate-drill.mjs`; a gate whose done state cannot be constructed is labelled
  **UNPROVEN with what it needs**, never folded into a pass. Zero vacuous guards. `GATESTD-01`
  is worked around, never fixed unruled. **New, the P95 law (condition 3): any plan that
  anticipates a post-close mutation NAMES which closed gates' subjects it changes.**
- **D-15: Every closing derivation states its POPULATION DEFINITION and what falls outside it**
  [inherited — P93 `D-18`, P94 `D-24`, P95 `D-12`]. This phase's recurring populations
  (condition 4): an **agreement claim names its surface set** (which screens were compared, what
  falls outside); **trigger populations derive from behaviour, not syntax**; **count derivations
  state their filter seams** (which table, which filter, who else reads a different one).
- **D-16: Behavioural criteria carry behavioural oracles, and agreement oracles are
  CONTEMPORANEOUS** [inherited + new this phase — condition 7]: two counts captured at different
  times can disagree without a defect — same-clock observation or the seam stated.
  Data-dependent oracles state their fixtures explicitly. Render evidence via browser-harness
  CDP (claude-in-chrome/playwright-MCP do not attach); RLS denials read as empty 200s — assert
  `role="alert"` via DOM; forced errors via CDP `Network.setBlockedURLs` with the block pattern
  NARROWED to the `functions/v1` URL (the 95-03 lesson: a broad pattern blanks the SPA).
  Oracles that cannot run until execution are labelled; producer before consumer.
- **D-17: Playwright paths are FILTERS** [inherited — P94 `D-26`, P95 `D-14`]: assert spec-file
  existence FIRST, hardcode the expected count (never list-derive), pass `--no-deps` for any
  project carrying `dependencies:` — including `--list` (GATE-STANDARD C6).
- **D-18: No oracle depends on the e2e `setup` project** [inherited — P93 `D-20`, P95 `D-15`].
  `E2ECRED-01` is unrotated — route around (inline auth; `.env.test` TEST_USER creds work), or
  park. **Single-origin CORS: only `:5173` authenticates — behavioural oracles run against a
  single app instance** (ORACLECAP filing; ACCEPTANCE condition 9).
- **D-19: C9a swept; C9b mock-vs-real from the start; consumer sweeps run ONLY through
  `scripts/c9b-sweep.sh`** — the inherited fail-closed instrument, control-tested before any
  zero is believed; never inline shell (condition 5). A mocked consumer is a NON-ORACLE, never
  folded into a defence count [inherited — P94 `D-28`, P95 `D-16`].
- **D-20: No two writers share an output path** [inherited — P94 `D-29`, P95 `D-17`]. The
  independent `gsd-verifier` artifact **`96-VERIFICATION-INDEPENDENT.md` is reserved — no plan
  may claim it** (condition 6, and the exec acceptance names it). Every spawned checker writes a
  disk artifact with a terminal marker — NOT-CHECKED beats silence.
- **D-21: Decision coverage is green mechanically with a falsification drill on disk** —
  `scripts/decision-coverage.mjs` exit 0, `uncovered: []`, seen RED before its green is trusted
  (condition 2). Each plan carries one citation truth in frontmatter `truths:`. Sub-lettered
  decision ids are invisible to the extractor (`GATESTD-03`) — never use them. Step-13e gap
  noise scans the whole register — only Phase 96's 9 IDs matter.
- **D-22: DB/deploy house rules hold** [inherited]: schema/trigger changes only via migration
  files through the Supabase MCP (staging `zkrcjzdemdmwhearhfgg`); RLS binds
  `profiles.user_id = auth.uid()` (profiles has NO `id` column); **`aa_commitments`' five-value
  status lifecycle (incl. `overdue`) is never renamed — mapped at the query/mutation layer**;
  new copy lands in BOTH locales same-commit, colon-form namespaces only (condition 9).
- **D-23: Instrument facts** [inherited — ORCH-BRIEF §3]: `grep` here is a ugrep wrapper
  honouring `.gitignore` — recursive sweeps are blind to `.tickmarkr/` etc.; use explicit file
  args or `command grep`; **instrument-test EVERY zero against a known-present token**. **zsh
  does NOT word-split unquoted expansions** (3 live instances in P95) — every loop over a list
  uses `read -r`/arrays or a bash shebang. `timeout` does not exist on this Mac. Exit codes
  captured directly, never through a pipe. `pnpm test` via Turbo needs `--continue`. prettier
  mangles md tables (`<!-- prettier-ignore -->`) and re-wraps frontmatter block-sequences —
  machine-readable frontmatter is verified to PARSE after any hook run.

### Claude's Discretion

Technical shape is the researcher's and planner's, within the constraints above: the COUNT-01
unification mechanism (against the enumerated surface set), the DEAD-05 branch (research
feasibility decides, recorded either way per D-03), the internal shape of the DEAD-06 chart and
DEAD-07 fixes, the word-assistant probe target (research derives what the badge fronts), the
sandbox repair shape (after the cause derivation), and the TRIGSWEEP-01 instrument
implementation (subject to behaviour-derivation + both-direction testing). None of these change
what the user sees truthfully, so none is parked.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and grading

- `.planning/ROADMAP.md` §Phase 96 — goal, 9 requirements (as reconciled `e0fe78a5d`), 5
  success criteria
- `.planning/REQUIREMENTS.md` — `DEAD-05/06/07` (~:91-93), `SANDBOX-500-01` (~:98, incl. the
  95-03 CDP-oracle note), `COUNT-01..03` (~:102-107), `COUNT-04` (~:109-117), `TRIGSWEEP-01`
  (~:119-128, incl. the `RULING-P94-03` split and the `trg_sync_task_status` verify-not-build
  note)
- `.tickmarkr/overseer/ACCEPTANCE-P96-PLAN.md` — the 10 grading conditions; conditions 1
  (entry-specific close shapes), 3 (post-close-mutation naming law), 7
  (contemporaneous-agreement rule) are new this phase
- `.tickmarkr/overseer/ORCH-BRIEF.md` §3 — pre-baked evidence per requirement; cite, do not
  rediscover
- `.tickmarkr/overseer/PARK-P96.md` — `PARK-96-01` (COUNT-04 refusal interaction), **RULED**
- `.tickmarkr/overseer/RULING-P96-01-PARK-REFUSAL.md` — (a) KEEP REFUSAL; the three binding
  conditions, incl. COUNT-04's close stating which notion wins on which surface

### The inherited instruments and their provenance

- `.planning/GATE-STANDARD.md` — C1–C10 incl. C9a, C9b
- `scripts/gate-drill.mjs` — mechanical half; a green from it is NOT evidence a gate is sound
- `scripts/decision-coverage.mjs` — frontmatter `must_haves`/`truths`/`objective` scan; two-digit
  `D-NN` ids only
- `scripts/c9b-sweep.sh` — the ONLY permitted C9b consumer-sweep entry point (fail-closed,
  control-self-testing; P95-09 Task 0)
- `scripts/probe-edge-auth.sh` — deploy evidence (`fn -> status`; `404-kind: gateway|function`
  on any 404)
- `.tickmarkr/overseer/P94-TRIGGER-SWEEP.md` — the P94 sweep TRIGSWEEP-01 inherits (the
  instrument AND its boundary)
- `.planning/phases/94-write-paths/94-VERIFICATION-INDEPENDENT.md` §6.1 — the negative control
  that measured the 15% blindness
- `.planning/phases/95-routes-that-don-t-render/95-RESEARCH.md` Open Question 2 — the sandbox
  `FETCH_FAILED` mask + `to_regclass` derivation path
- `tests/e2e/95-sandbox-error.spec.ts` + 95-03-SUMMARY deviation 2 — the C9b consumer whose
  natural arm changes meaning when the sandbox works

### Standing law inherited from Phases 92–95

- `.planning/phases/95-routes-that-don-t-render/95-CONTEXT.md` — the inherited-law block
  (D-11..D-20) this phase's D-14..D-23 carries forward
- `.planning/phases/93-failure-visibility/93-CONTEXT.md` — shared error component, bilingual
  `role="alert"`, no server `error.message`

### House rules

- `CLAUDE.md` §Work Management Terminology (the `aa_commitments` five-value carve-out,
  `calendar_entries` vs `calendar_events`), §Security / §Deployment — staging
  `zkrcjzdemdmwhearhfgg` eu-west-2; migrations via `apply_migration` only
- `frontend/DESIGN.md` then `frontend/src/design-system/CLAUDE.md` — Linear (dark) spec and the
  runtime token engine, in that order, before any UI edit

### The seams, pinned (scout 2026-08-17)

- `frontend/src/routes/_protected/analytics.tsx` — DEAD-05
- `frontend/src/routes/_protected/custom-dashboard.tsx` — DEAD-06
- `frontend/src/routes/_protected/calendar.tsx`, `calendar/new.tsx`, `events.tsx`,
  `word-assistant.tsx` — DEAD-07
- `frontend/src/pages/WorkBoard/WorkBoard.tsx` — `:78-84` `STAGE_TO_STATUS` (COUNT-03 parity),
  `:232-235` computed overdue (COUNT-04)
- `frontend/src/routes/_protected/my-work.tsx` + `frontend/src/pages/my-work/MyWorkDashboard.tsx`,
  `frontend/src/routes/_protected/commitments.tsx`, `frontend/src/routes/_protected/dashboard.tsx`
  — the COUNT-01 surface set (enumeration re-derived mechanically at research)
- `supabase/migrations/20260330000001_operations_hub_rpcs.sql` — `get_dashboard_stats` + the
  `engagement_dossiers` reads (COUNT-01's filter seam)
- `supabase/functions/scenario-sandbox/` — SANDBOX-500-01

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **The shared query-error component family from Phase 93** — bilingual, `role="alert"`,
  internal-string-free; DEAD-05's honest-disable branch and any new failure surface reuses it.
- **The P95 sandbox error state** (`tests/e2e/95-sandbox-error.spec.ts` + the shared
  `query-error-state`) — SANDBOX-500-01 builds on top of it, not around it.
- **`scripts/probe-edge-auth.sh` / `c9b-sweep.sh` / `gate-drill.mjs` /
  `decision-coverage.mjs`** — the inherited instrument set; plans consume, never reinvent.
- **P93's i18n key-set-equality gate pattern** — for any both-locale copy this phase adds.

### Established Patterns

- Result-shaped data clients (`{ ok: true, … } | { ok: false, error }`, never throw) —
  count/chart data paths stay consistent within their own API surface.
- Logical properties only (`ms-*`/`ps-*`/`text-start`); Linear dark tokens only, no raw hex —
  any badge/column COUNT-04 adds follows `frontend/DESIGN.md`.
- i18n colon-form namespaces; dot-form renders the raw key.
- `Intl.NumberFormat('ar')` renders Latin digits BY POLICY (`lib/format-locale`) — not a defect;
  no count fix "repairs" it.

### Integration Points

- Dashboard KPI RPCs live in migrations (`operations_hub_rpcs.sql` and successors) — count
  changes may need a migration through the Supabase MCP, never ad-hoc DDL.
- `scenario-sandbox` and any function change are EDGE deploys with probe evidence, not just
  source edits.
- Any `tasks`/`aa_commitments` trigger change (the COUNT-04 INSERT gap) is a migration file;
  `pg_get_constraintdef` / `pg_trigger` derivations run through the Supabase MCP against
  staging.

</code_context>

<specifics>

## Specific Ideas

- **Agreement is a moment, not a property** — every "these surfaces agree" oracle is same-clock
  or states its seam (condition 7). A screenshot of two screens taken minutes apart proves
  nothing on a live staging DB.
- **The register's counts are all FLOORS** — 193 triggers, persons 16 vs 15, two past-due rows
  at `pending`: every one is re-derived at execution time, never trusted from the entry text.
- **The dashboard-RPC filter seam is the phase's own goal sentence in miniature** — two surfaces
  can agree because both are wrong the same way; verification must trace each count to its
  table, not to its neighbour.

</specifics>

<deferred>

## Deferred Ideas

- Out-of-phase by register assignment, listed so no plan folds them in: `NAV-*` → P97;
  `COPY-*` → P98; `AR-*` → P99; `EDGEPATH-01`, `DR-SUBPATH-01`, `RLS-AUTHUSERS-01`,
  `FUNC-GRANT-01` → P100; `E2ESTALE-01`, `ROOTALIAS-01`, `ORACLECAP-*`, `E2ECRED-01` → P101;
  `DELEG-02`, `GATESTD-01`, `GATESTD-03`, `P52FIXTURE-01`, `SEED-DELEG-01` → P102;
  `DATA-01` (staging data, incl. the `staff_profiles` seed per D-13) → P102.
- Intended-broken surfaces off-limits: `/delegations` (P102), legal-holds region (P100).
- Arabic naturalness + pixel RTL sign-off are OPERATOR parks — no plan claims either
  (ORCH-BRIEF §3).

</deferred>

---

_Phase: 96-real-numbers_
_Context gathered: 2026-08-17_
