# Phase 96: Real Numbers - Research

**Researched:** 2026-08-17
**Domain:** Data-truth repair — counts/charts/trends across React 19 + TanStack Query surfaces, Supabase RPCs/views/triggers on staging `zkrcjzdemdmwhearhfgg`
**Confidence:** HIGH (nearly every load-bearing claim derived live against staging or the deployed edge tier this session; derivation commands recorded verbatim)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Numbering restarts per phase (P95 used `D-01..D-20`). Decisions carried forward are marked
**[inherited]** with their origin. Per the overseer question policy (ORCH-BRIEF §2 rule 4),
every decision below is either determined by documents (cited) or parked
(`.tickmarkr/overseer/PARK-P96.md`).

#### Scope and requirement mapping

- **D-01: The phase closes 9 requirements**, each mapped in plan frontmatter to the success
  criterion (or filed-finding close) it serves, re-derivable by command against the register.
  Source: `.planning/REQUIREMENTS.md` register rows 530–540;
  `.tickmarkr/overseer/ACCEPTANCE-P96-PLAN.md` condition 1. Entry-specific close shapes are
  binding: `COUNT-03` closes by **VERIFY-not-build**; `TRIGSWEEP-01` closes by a
  **BEHAVIOUR-derived instrument** tested in both directions; `SANDBOX-500-01` closes on the
  **WORKING sandbox** (the honest error is P95's, done).
- **D-02: Out-of-phase surfaces are named, not assumed** — the exclusion list in the Phase
  Boundary is the record. Source: ORCH-BRIEF §3 "OUT of this phase" + the intended-broken
  register (of which only `/delegations` and legal-holds remain off-limits).

#### DEAD-05 — /analytics

- **D-03: Real data or HONESTLY DISABLED as a RECORDED decision branch — never a quiet stub.**
  No fabricated sparklines, donuts, or "Insights you'll gain" over a backend endpoint that does
  not exist (`REQUIREMENTS.md:91`; ACCEPTANCE condition 8). Which branch is taken is decided by
  RESEARCH feasibility (does a real data path exist within the current stack for each widget?)
  and the branch decision is RECORDED in the plan text as a decision branch, with the honest
  disable rendered as an explicit state (shared P93 error/empty component family — bilingual,
  `role="alert"` where an error), never a blank or a mock. If the disabled branch is taken, nav
  handling of the disabled route defers to P97 (reachability is its domain) and the record says
  so.

#### DEAD-06 — /custom-dashboard

- **D-04: The column is `calendar_entries.event_date`, NOT `start_datetime`** (verified **[V]**,
  `REQUIREMENTS.md:92`). The chart renders, and trend deltas are computed from COMPLETED
  requests — "0.0%" derived from an aborted request is the confident-lie class and is a
  forbidden shape (ACCEPTANCE condition 8).

#### DEAD-07 — calendar family

- **D-05: `/calendar` renders a grid (empty or not), `/calendar/new` mounts the create form,
  `/events` pads the month by the REAL weekday offset with working month navigation, and
  `/word-assistant`'s status badge reflects a LIVE probe** (`REQUIREMENTS.md:93`).
  **`calendar_entries` is canonical; `calendar_events` is a separate, empty forum model — do NOT
  consolidate them** (project memory; ACCEPTANCE condition 9 names this house rule).

#### COUNT-01 — one source of truth for work-item counts

- **D-06: The dashboard KPI, `/my-work` badge/footer/rows, `/commitments` tabs and the kanban
  board agree on the same number for the same work** (`REQUIREMENTS.md:102`). **The dashboard
  RPCs read `engagement_dossiers`, not `engagements`** (project memory;
  `supabase/migrations/20260330000001_operations_hub_rpcs.sql`) — every RPC's source table is
  verified before any count is trusted; **agreement between two surfaces sharing a wrong filter
  is not evidence** (ACCEPTANCE condition 4). The unification mechanism (shared hook/RPC vs
  per-surface filter reconciliation) is planner discretion, decided against a MECHANICALLY
  enumerated surface set — the agreement claim names which screens were compared and what falls
  outside (condition 4).

#### COUNT-02 — extension-row joins

- **D-07: Type-list queries left-join their extension tables (or the counters use the same
  join)** so a dossier without an extension row is never dropped from the list while the hub
  counts it (persons 16 vs 15 **[V]**, engagements 5 vs 3; `REQUIREMENTS.md:103`). SC5's fixture
  (a dossier WITHOUT an extension row) is synthetic, namespaced, and cleaned; **CHECK constraints
  are verified via `pg_constraint` before ANY seed insert** [inherited — project memory];
  `aa_commitments` has NO FK to dossiers — batched `.in('id', ids)`, never a join through a FK
  that does not exist [inherited — project memory].

#### COUNT-03 — status/workflow_stage sync: VERIFY, do not build

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

#### COUNT-04 — two notions of overdue

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

#### TRIGSWEEP-01 — the inherited instrument, re-derived from behaviour

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

#### SANDBOX-500-01 — the WORKING sandbox

- **D-12: Make the sandbox WORK; the honest error is P95's, done** (`REQUIREMENTS.md:98`).
  Starting point: `95-RESEARCH.md` Open Question 2 — the server error was recorded as a masked
  `FETCH_FAILED`, with a Supabase-MCP `to_regclass` derivation offered as the cause-derivation
  path. The cause is DERIVED before the fix is planned in detail. Any function change redeploys
  with probe evidence (`scripts/probe-edge-auth.sh`, which now prints `404-kind:
gateway|function` on any 404). **`tests/e2e/95-sandbox-error.spec.ts` is a C9b consumer whose
  natural arm changes meaning the day this works** — its `requestfailed` guard anticipates that
  (95-03-SUMMARY deviation 2); it is updated (or shown still-sound) in the SAME task that lands
  the fix.

#### The staff_profiles seed decision — named OUT (condition 9)

- **D-13: `staff_profiles` seeding is OUT of scope for Phase 96, named here so silence is not a
  finding** (`ACCEPTANCE-P96-PLAN.md` condition 9). Rationale: the unseen populated-queue render
  is `/tasks/queue`'s surface (`DEAD-02`, closed by P95); staging data seeding has a dedicated
  owner (`DATA-01`, Phase 102). Tripwire: research verifies that no Phase 96 criterion surface
  reads `staff_profiles` — if one does, this decision escalates to a park rather than being
  silently held.

#### Gates, oracles and derivations — standing law

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

### Deferred Ideas (OUT OF SCOPE)

- Out-of-phase by register assignment, listed so no plan folds them in: `NAV-*` → P97;
  `COPY-*` → P98; `AR-*` → P99; `EDGEPATH-01`, `DR-SUBPATH-01`, `RLS-AUTHUSERS-01`,
  `FUNC-GRANT-01` → P100; `E2ESTALE-01`, `ROOTALIAS-01`, `ORACLECAP-*`, `E2ECRED-01` → P101;
  `DELEG-02`, `GATESTD-01`, `GATESTD-03`, `P52FIXTURE-01`, `SEED-DELEG-01` → P102;
  `DATA-01` (staging data, incl. the `staff_profiles` seed per D-13) → P102.
- Intended-broken surfaces off-limits: `/delegations` (P102), legal-holds region (P100).
- Arabic naturalness + pixel RTL sign-off are OPERATOR parks — no plan claims either
  (ORCH-BRIEF §3).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID             | Description                                                                      | Research Support                                                                                                                                                                                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEAD-05        | `/analytics` shows real data or is honestly disabled                             | §Derivation 6 — **Branch A (real data) is FEASIBLE and recommended**: the deployed `analytics-dashboard` edge fn answers 200 AND every endpoint's numbers are proven table-derived by SOURCE READ of its RPC body (per-endpoint table map in §Derivation 6 — a 200 alone proves nothing, the DEAD-09 lesson); the frontend merely points at `baseUrl: 'express'` where no route exists |
| DEAD-06        | `/custom-dashboard` queries columns that exist, renders chart, real trend deltas | §Derivation 7 — the wrong column is pinned at `useWidgetDashboard.ts:591-593` (`start_datetime`; live columns verified `event_date`/`event_time`); trend fabrication pinned at `:281` and the `previousValue = value` fallbacks                                                                                                                                                        |
| DEAD-07        | Calendar family renders truthfully                                               | §Derivation 8 — `/calendar/new` unreachable (parent `calendar.tsx` has NO `<Outlet/>` — the DEAD-08 class); empty-month wizard replaces the grid; `/events` has NO weekday offset and NO month nav; word-assistant badge inits `true` and skips the probe in default `fallback` mode                                                                                                   |
| COUNT-01       | One source of truth for work-item counts                                         | §Derivation 5 — the surface set is mechanically enumerated with FIVE distinct data mechanisms and their filter seams; live same-clock disagreement proven (KPI 3 vs list 5)                                                                                                                                                                                                            |
| COUNT-02       | Extension-row joins never drop dossiers                                          | §Derivation 4 — live gaps re-derived (person 16/15, engagement 5/3, **organization 5/2, topic 2/1 — new, beyond register floors**); `dossiers_type_check` has 7 values (NO `elected_official`); fixture preconditions verified                                                                                                                                                         |
| COUNT-03       | status/workflow_stage sync VERIFIED                                              | §Derivation 3 — live trigger def captured; **invariant ALREADY BROKEN: 3 rows at `todo`/`completed`**; no INSERT-time sync; kanban RPC structurally starves its Done column; direct-status writers named                                                                                                                                                                               |
| COUNT-04       | Two notions of overdue unified                                                   | §Derivation 2 — INSERT gap confirmed structurally (BEFORE UPDATE only); 2 past-due `pending` + 8 `overdue` live; FOUR+ computed-overdue sites enumerated; audit-after-rewrite order confirmed                                                                                                                                                                                          |
| TRIGSWEEP-01   | Behaviour-derived trigger instrument                                             | §Derivation 1 — 212 BEFORE ROW triggers live; a THIRD syntactic form found (`SELECT … INTO NEW.x`, 2 triggers) and a FOURTH blindness demonstrated (same-line-after-BEGIN `=`); writers ≥194 — floors only; instrument design prescribed                                                                                                                                               |
| SANDBOX-500-01 | The WORKING sandbox                                                              | §Derivation 0 — **cause DERIVED AND PROVEN: 42P17 mutual RLS recursion** `scenarios` ↔ `scenario_collaborators`; the `to_regclass` hypothesis eliminated (all 5 tables + 3 RPCs exist); fix precedent in-repo (`20260816500001_p94_report_rls_recursion.sql`)                                                                                                                          |

</phase_requirements>

## Summary

This phase needed live derivations, not library research — and they are done. Every count on
the register was re-derived against staging `zkrcjzdemdmwhearhfgg` this session (2026-08-17),
read-only, and every register floor was confirmed or exceeded. The headline: **SANDBOX-500-01's
cause is no longer open** — it is a `42P17` infinite RLS recursion between
`scenarios_select_own_or_collaborated` (references `scenario_collaborators`) and
`scenario_collaborators_select` (references `scenarios` back), proven behaviorally through
PostgREST as an authenticated user and through the deployed function (500 `FETCH_FAILED`). The
repo already contains the exact fix precedent: `20260816500001_p94_report_rls_recursion.sql`
broke the identical `custom_reports ↔ report_shares` cycle with a single-row SECURITY DEFINER
owner check.

Second headline: **DEAD-05 resolves to Branch A (real data)**. The `/analytics` page fails
because its repository calls `apiGet('/analytics-dashboard', { baseUrl: 'express' })` and the
Express backend serves no such route — but the `analytics-dashboard` **edge function is
deployed and working**, answering 200 with real payloads from five live RPCs. The repair is a
repoint plus response-shape adaptation, not a build. Third: the count seams are wider than the
register knew — organization 5-vs-2 and topic 2-vs-1 extension gaps exist beyond the filed
persons/engagements pairs; the COUNT-03 invariant is already broken on staging (3 tasks at
`workflow_stage='todo'` with `status='completed'`); and the kanban RPC's own WHERE clause
excludes completed rows, structurally starving the Done column. TRIGSWEEP-01's behaviour rule
is vindicated twice over: this session found a third syntactic form (`SELECT … INTO NEW.x`, 2
triggers) invisible to both known regexes, and then a sharper statement-position regex STILL
missed 2 more writers (`NEW.updated_at = NOW()` on the same line as `BEGIN`) — found only by
reading the residual. No syntactic instrument survives contact; the plan's instrument must
classify by behaviour and be control-tested in both directions.

**Primary recommendation:** Plan the phase as (1) one migration wave (sandbox RLS recursion
break; COUNT-04 INSERT-gap trigger timing), (2) one data-path wave (analytics repoint,
custom-dashboard column + trend truth, calendar family renders, count unification against the
enumerated surface set), and (3) one instrument/verify wave (TRIGSWEEP-01 behaviour instrument,
COUNT-03 parity oracle + writer sweep, closing derivations) — every derivation command below is
recorded verbatim for re-run at execution time.

## Architectural Responsibility Map

| Capability                         | Primary Tier                                         | Secondary Tier                                | Rationale                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SANDBOX-500-01 RLS recursion break | Database (migration via Supabase MCP)                | Edge fn (redeploy only if source changes)     | The 42P17 lives in policy quals; the deployed fn source is correct as-is                                                                           |
| COUNT-04 INSERT gap                | Database (trigger timing migration)                  | —                                             | `commitment_overdue_check` is BEFORE UPDATE only; the fix is DDL                                                                                   |
| COUNT-04 overdue badge             | Browser/Client (WorkBoard card render)               | Data layer (unified signal)                   | UI-SPEC prescribes card-level badge; signal unification is a query-layer concern                                                                   |
| COUNT-03 verify                    | Database (catalog + parity oracle)                   | Client (STAGE_TO_STATUS parity, writer sweep) | Trigger exists; work is confirmation + finding breaking writers                                                                                    |
| COUNT-01 unification               | API/Data layer (RPCs + client queries)               | Browser (rendered numbers)                    | Five distinct count mechanisms must converge or state seams; pixels don't change                                                                   |
| COUNT-02 joins + fixture           | Database (fixture insert/clean) + Edge fn list paths | Client lists                                  | The canonical list path (`dossiers-list` → mv) is LEFT-joined and sound today; the divergent surfaces are extension-table-based readers            |
| DEAD-05 analytics repoint          | Browser data layer (`analytics.repository.ts`)       | Edge fn (already deployed, working)           | Change `baseUrl: 'express'` → edge + adapt response shape; remove sample/preview from DOM                                                          |
| DEAD-06 events widget + trends     | Browser data layer (`useWidgetDashboard.ts`)         | —                                             | Wrong column + fabricated deltas are both client-side                                                                                              |
| DEAD-07 calendar family            | Browser (routes + components)                        | —                                             | Outlet, grid-vs-wizard, offset/nav, probe-driven badge are all client renders                                                                      |
| TRIGSWEEP-01 instrument            | Database (catalog derivation)                        | Scripts (recorded, re-runnable)               | Population is `pg_trigger`/`pg_proc`; both-direction test needs synthetic triggers (execution-leg DDL, rolled back or migration-created + dropped) |

## Project Constraints (from CLAUDE.md)

- Migrations ONLY via Supabase MCP `apply_migration` (never ad-hoc DDL via `execute_sql`); staging is `zkrcjzdemdmwhearhfgg` eu-west-2. `supabase/CLAUDE.md`: timestamped migration names; idempotent DDL norm. [CITED: CLAUDE.md §Security, supabase/CLAUDE.md]
- RLS on every end-user-exposed table; clearance binds `profiles.user_id = auth.uid()` (profiles has NO `id`). [CITED: supabase/CLAUDE.md §RLS]
- `aa_commitments` five-value status lifecycle (`pending`,`in_progress`,`completed`,`cancelled`,`overdue`) is never renamed; map at query layer. `intake_tickets.urgency` legitimately uses `critical`. [CITED: CLAUDE.md §Work Management carve-outs]
- `calendar_entries` canonical; `calendar_events` separate empty forum model — no consolidation. [CITED: CLAUDE.md]
- Design: Linear dark tokens only, no raw hex (chart-palette carve-out excepted), logical properties only, `var(--row-h)`, radii 6/8/12, no emoji/marketing voice, `Tue 28 Apr` / `14:30 GST`. Read `frontend/DESIGN.md` then `frontend/src/design-system/CLAUDE.md` before UI edits. [CITED: CLAUDE.md §Visual Design]
- i18n: static bundle in `src/i18n/index.ts`; colon-form namespace addressing only; both locales same-commit. [CITED: frontend/CLAUDE.md §i18n]
- Data clients return result unions and never throw at the client-boundary per core rules; existing analytics repository deliberately throws via `apiGet` (D-01 comment in file) — match each surface's established shape, do not mix within one API. [CITED: ~/.claude/rules/core.md + frontend/src/domains/analytics/repositories/analytics.repository.ts:7]
- ESLint: explicit return types, no `any`, no floating promises, filename case per directory, physical-direction Tailwind classes are errors. [CITED: CLAUDE.md §Conventions, frontend/CLAUDE.md]
- Edge deploys via CLI/MCP with probe evidence (`scripts/probe-edge-auth.sh`). [CITED: CLAUDE.md, 96-CONTEXT.md]

## Standard Stack

**Zero new packages.** Every capability this phase needs is already installed and shipped:

### Core (all already in the repo — no installs)

| Library             | Where                                                                                                             | Purpose                            | Status                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| recharts            | `components/analytics/*`, `dashboard-widgets/*`                                                                   | All charts                         | [VERIFIED: codebase — UI-SPEC pins it; no new chart dep] |
| lucide-react        | shipped                                                                                                           | Icons (`BarChart3`, `AlertCircle`) | [VERIFIED: codebase]                                     |
| date-fns            | `UnifiedCalendar.tsx`, `EventsPage.tsx` (`startOfMonth`, `eachDayOfInterval`, `addMonths`, `subMonths`, `getDay`) | Month math + weekday offset        | [VERIFIED: codebase imports]                             |
| TanStack Query v5   | everywhere                                                                                                        | Server state                       | [VERIFIED: codebase]                                     |
| supabase-js v2      | everywhere                                                                                                        | PostgREST/RPC/functions            | [VERIFIED: codebase]                                     |
| Playwright + Vitest | root + frontend configs                                                                                           | Oracles                            | [VERIFIED: codebase — see Validation Architecture]       |

### Package Legitimacy Audit

Not applicable — **this phase installs zero external packages** (UI-SPEC: "no new chart dep",
"no components pulled"; composition is from shipped primitives). No audit table required; any
plan that introduces an install violates the UI-SPEC registry-safety section and must be
rejected by the plan-checker.

## Live Derivations (the phase's evidence base — commands recorded verbatim)

All SQL below was run READ-ONLY against staging `zkrcjzdemdmwhearhfgg` on 2026-08-17 via the
Supabase management query API (equivalently runnable via `mcp__supabase__execute_sql`). Deployed
behaviour was probed with a real authenticated user minted from `.env.test` creds (the
`probe-edge-auth.sh` protocol — no secrets echoed). **Every number is a FLOOR pinned to
2026-08-17; re-derive at execution time.**

### Derivation 0 — SANDBOX-500-01: the cause is 42P17 RLS recursion [VERIFIED: staging, behavioural]

The `to_regclass` hypothesis from `95-RESEARCH.md` Open Question 2 is ELIMINATED:

```sql
SELECT to_regclass('public.scenarios')             AS scenarios,             -- 'scenarios'  (exists)
       to_regclass('public.scenario_variables')    AS scenario_variables,    -- exists
       to_regclass('public.scenario_outcomes')     AS scenario_outcomes,     -- exists
       to_regclass('public.scenario_comparisons')  AS scenario_comparisons,  -- exists
       to_regclass('public.scenario_collaborators')AS scenario_collaborators;-- exists
-- get_scenario_full / clone_scenario / compare_scenarios: all present in pg_proc (count 1 each)
```

The real cause, from `pg_policy`:

```sql
SELECT polname, pg_get_expr(polqual, polrelid) FROM pg_policy
WHERE polrelid IN ('public.scenarios'::regclass, 'public.scenario_collaborators'::regclass);
```

- `scenarios_select_own_or_collaborated` (SELECT on `scenarios`):
  `created_by = auth.uid() OR EXISTS (SELECT 1 FROM scenario_collaborators WHERE …)`
- `scenario_collaborators_select` (SELECT on `scenario_collaborators`):
  `user_id = auth.uid() OR EXISTS (SELECT 1 FROM scenarios WHERE scenarios.created_by = auth.uid() …)`

Evaluating either applies the other's policy → infinite recursion. **Proven behaviorally**
(management-role catalog reads bypass RLS, so the proof ran as a real authenticated user):

```
GET {SUPABASE_URL}/rest/v1/scenarios?select=*&limit=1   (user JWT)
→ {"code":"42P17","message":"infinite recursion detected in policy for relation \"scenarios\""}

GET {SUPABASE_URL}/functions/v1/scenario-sandbox        (user JWT)
→ HTTP 500 {"error":{"code":"FETCH_FAILED", …}}         (the P95-recorded mask, reproduced)
```

Origin: `supabase/migrations/20260114300001_scenario_sandbox.sql` created both policies.
INSERT/UPDATE/DELETE policies on `scenario_collaborators` also EXISTS-over-`scenarios`, but
those directions do not recurse for SELECT; the SELECT↔SELECT pair is the cycle.

**Fix shape (planner):** mirror `supabase/migrations/20260816500001_p94_report_rls_recursion.sql`
exactly — a `SECURITY DEFINER STABLE` single-row owner check
(`is_scenario_owner(p_scenario_id uuid)` returning `created_by = auth.uid()`, pinned empty
`search_path`, GRANT EXECUTE to authenticated), substituted for the `EXISTS (SELECT 1 FROM
scenarios …)` clause in `scenario_collaborators`' policies (breaking ONE direction; row sets
unchanged by construction). Migration via Supabase MCP; the deployed fn needs NO source change
for this cause (the 500 originates in PostgREST), but any redeploy carries
`probe-edge-auth.sh` evidence. `tests/e2e/95-sandbox-error.spec.ts` (163 lines, 2 tests: CDP
`Network.setBlockedURLs` forced arm with `requestfailed` discrimination + natural arm asserting
"content or error, never spinner past budget") is updated-or-shown-sound in the SAME task
(D-12); once the fix lands, the natural arm's truthful outcome flips from error-state to
content.

**Not derived this leg (needs RLS-scoped write or fix-first):** whether `scenarios` has any
rows visible to the test user post-fix (the working sandbox may render EMPTY-working — that is
a truthful render; the P95 empty/error vocabulary already covers it).

### Derivation 1 — TRIGSWEEP-01: the population, and two NEW instrument blindnesses [VERIFIED: staging catalog]

Enumeration (verbatim; `tgtype` bits: 1=ROW, 2=BEFORE, 4=INSERT, 8=DELETE, 16=UPDATE):

```sql
WITH before_row AS (
  SELECT t.tgname, c.relname, p.proname, l.lanname, p.prosrc
  FROM pg_trigger t
  JOIN pg_class c     ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p      ON p.oid = t.tgfoid
  JOIN pg_language l  ON l.oid = p.prolang
  WHERE NOT t.tgisinternal AND n.nspname = 'public'
    AND (t.tgtype & 2) = 2 AND (t.tgtype & 1) = 1)
SELECT count(*)                                                            AS total,      -- 212
       count(DISTINCT relname)                                             AS tables,     -- 181
       count(*) FILTER (WHERE lanname <> 'plpgsql')                        AS non_plpgsql,-- 0
       count(*) FILTER (WHERE prosrc ~* 'NEW\.[a-zA-Z_]+\s*:=')            AS colon_eq,   -- 29
       count(*) FILTER (WHERE prosrc !~* 'NEW\.[a-zA-Z_]+\s*:='
                          AND prosrc ~* '(^|;|\n)\s*NEW\.[a-zA-Z_]+\s*=[^=]') AS plain_eq, -- 162
       count(*) FILTER (WHERE prosrc ~* 'INTO\s+(STRICT\s+)?NEW\.')        AS into_new    -- 2
FROM before_row;
```

Live results 2026-08-17: **212 BEFORE ROW triggers across 181 tables, all plpgsql** (zero
C-language — the moddatetime/tsvector class is absent here, but the instrument must still
handle `lanname <> 'plpgsql'` as automatic-writer-suspect, else a future extension trigger is
invisible). Union of the three syntactic classes: **192**. Residual 20 inspected by eye:

- **A THIRD FORM, previously invisible to both known regexes:** `SELECT … INTO NEW.x` —
  `calculate_stage_duration_trigger` (`assignment_stage_history`) is INTO-only;
  `set_inline_comment_thread_root_trigger` (`document_inline_comments`) is INTO + `:=`.
- **A FOURTH BLINDNESS, demonstrated against this session's own sharper regex:** the
  statement-position `plain_eq` pattern (anchored on `^`, `;`, `\n`) MISSED
  `document_templates_updated_at_trigger` and `templated_documents_updated_at_trigger`, whose
  bodies are `BEGIN NEW.updated_at = NOW(); …` on ONE line — assignment directly after
  `BEGIN`/`THEN`/`ELSE`/`LOOP` with no preceding `;`/newline. Found only by reading the
  residual. **This is the tenth instance of the syntactic-undercount class, produced by the
  instrument built to fix the ninth.**
- True non-writers in the residual (≈18): 8× `validate_dossier_type` guards, circular-delegation
  and role/clearance guards, attachment-limit guards, version-snapshot immutability, audit-
  deletion guard, and two triggers that write OTHER rows via UPDATE
  (`ensure_single_default_view`, `tr_enforce_single_default_layout`) — side-effecting but not
  NEW-writers (the instrument's classification must not confuse the two).

**Floor: ≥194 NEW-writing BEFORE ROW triggers of 212** (192 union + 2 residual writers).
Register's ≈193 confirmed as a floor and exceeded. ORCH-BRIEF's named meaningful rewrites
(`staff_profiles.version`, `assignments._version`, `entity_comments.*`,
`organization_leadership.is_current`, `legislations.version`,
`intelligence_sources.next_scan_at`) all fall inside the plain-`=` class — the plan's
derivation must list them explicitly in its output.

**Instrument prescription (Claude's discretion, exercised):** classify by behaviour, not one
regex — (a) enumerate ALL BEFORE ROW triggers from `pg_trigger` (the population is closed and
mechanical); (b) classify each function: non-plpgsql → writer-suspect by language; plpgsql →
match the UNION of all four known forms (`:=`, statement-`=` INCLUDING after
`BEGIN|THEN|ELSE|LOOP` on the same line, `INTO [STRICT] NEW.x`, whole-record `NEW :=`), and
**every residual trigger is listed and hand-classified in the derivation output** — the
residual is part of the deliverable, never silently assumed non-writing; (c) both-direction
control test: one synthetic BEFORE trigger that writes `NEW.` (must be caught) and one that
only RAISEs (must not) — synthetic DDL is execution-leg work in a migration-created-and-dropped
pair or a rolled-back transaction via MCP (this research leg was read-only and did NOT run the
control; the count above is therefore labelled instrument-untested-in-both-directions until the
plan's drill runs it). Output states population definition: _public-schema, non-internal,
BEFORE, FOR EACH ROW; falls outside: AFTER/INSTEAD OF triggers, statement-level triggers,
non-public schemas, and triggers whose functions write OTHER rows._

### Derivation 2 — COUNT-04: INSERT gap + the overdue-notion census [VERIFIED: staging]

```sql
SELECT tgname, pg_get_triggerdef(t.oid) FROM pg_trigger t
WHERE t.tgrelid = 'public.aa_commitments'::regclass AND NOT t.tgisinternal ORDER BY tgname;
-- commitment_overdue_check  BEFORE UPDATE            ← never fires on INSERT (structural proof)
-- commitment_status_audit   BEFORE UPDATE OF status WHEN (old.status IS DISTINCT FROM new.status)
-- set_aa_commitments_updated_at BEFORE UPDATE
-- sync_commitment_dossier_link  AFTER INSERT OR UPDATE OF dossier_id
SELECT status, count(*), count(*) FILTER (WHERE due_date < CURRENT_DATE) AS past_due
FROM aa_commitments GROUP BY status;
-- overdue: 8 (all past_due) | pending: 2 (all past_due)   ← the register's "two rows", live
```

Alphabetical fire order confirmed from the names themselves: `commitment_overdue_check` <
`commitment_status_audit` — the audit reads the REWRITTEN `NEW.status` (D-08's rule that
`commitment_status_history` is never user-intent evidence is structurally confirmed).

**The computed-overdue census — FOUR+ independent computations of "overdue", enumerated:**

| #   | Site                                        | Formula                                                                                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Stored: `aa_commitments.status='overdue'`   | trigger `check_commitment_overdue()` on UPDATE                                                                         | Bidirectional (ELSIF reverts); INSERT-blind                                                                                                                                                                                                                                                                                                                                                                                            |
| 2   | `unified_work_items` view, commitments arm  | `status NOT IN ('completed','cancelled') AND due_date < CURRENT_DATE`                                                  | Also `WHERE owner_user_id IS NOT NULL` — external-owner commitments fall out of the view entirely                                                                                                                                                                                                                                                                                                                                      |
| 3   | `get_unified_work_kanban` RPC (each arm)    | commitments: same as #2; tasks: `sla_deadline < NOW() AND status NOT IN (…)`; intake: **flat `submitted_at + 3 days`** | Intake seam: the view uses urgency-scaled SLA (24/48/72h/7d); the kanban RPC hardcodes 3 days — the SAME ticket can be overdue on one surface and not the other                                                                                                                                                                                                                                                                        |
| 4   | `useWidgetDashboard.ts` `fetchTasks` (:638) | `deadline < now && status !== 'completed'`                                                                             | Does not exclude `cancelled`                                                                                                                                                                                                                                                                                                                                                                                                           |
| 5   | `PersonalCommitmentsDashboard.tsx` (:47-52) | `due_date < today AND status NOT IN (completed,cancelled)`                                                             | `/commitments` tab count                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6   | `get_commitment_fulfillment` RPC            | `COUNT(*) FILTER (WHERE status IN ('pending','in_progress') AND due_date < NOW())` [VERIFIED: prosrc]                  | **Blind to stored `overdue` entirely** — its filter never includes `status='overdue'`, so it reports 2 (the INSERT-gap rows only) against stored 8. Worse: the COUNT-04 INSERT-gap fix would silently drive this bucket to 0 forever (rows move to a status it never counts). Branch A MUST fix this bucket in the same change (count `status='overdue'` OR the unified signal), else DEAD-05 ships a chart the COUNT-04 fix falsifies |

`WorkBoard.tsx` current pins (line numbers drifted from CONTEXT as UI-SPEC warned — seam is the
symbol): `STAGE_TO_STATUS` at `:83-89`, `resolveBoardStage` at `:105-117`, `overdueCount` at
`:244-247` (`visibleItems.filter((it) => it.is_overdue)`). [VERIFIED: codebase 2026-08-17]

**Fix shape:** the INSERT gap is a migration re-timing `commitment_overdue_check` to
`BEFORE INSERT OR UPDATE` (function body already handles the condition; verify the ELSIF branch
is INSERT-safe — `OLD` is not referenced in the function per the register's quoted body, but
the plan re-reads `check_commitment_overdue()`'s full prosrc before writing the migration).
Unification per RULING-P96-01 condition 3: the close STATES which notion wins on which surface;
badge + chip derive from ONE signal (D-16 same-clock oracle: chip count == badged-card count in
one DOM snapshot).

### Derivation 3 — COUNT-03: VERIFY-not-build, and the invariant is already broken [VERIFIED: staging]

```sql
SELECT tgname, pg_get_triggerdef(t.oid), p.prosrc FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.tasks'::regclass AND NOT t.tgisinternal;
```

Live: `trg_sync_task_status` BEFORE UPDATE on `tasks` → `sync_task_status_from_workflow_stage()`
with the exact CASE the register quotes (todo→pending, in_progress→in_progress, review→review,
done→completed + `completed_at := NOW()` when null, cancelled→cancelled; only when
`workflow_stage` IS DISTINCT FROM OLD). **Tasks have NO INSERT-time sync** (only
`set_task_sla_deadline` fires BEFORE INSERT) — same INSERT-gap class as COUNT-04.

**The invariant is already violated on staging:**

```sql
SELECT workflow_stage, status, count(*) FROM tasks GROUP BY 1,2 ORDER BY 1,2;
-- in_progress | in_progress | 2
-- todo        | pending     | 4
-- todo        | completed   | 3   ← BROKEN: completed tasks that never left Todo
```

The trigger is one-directional (stage→status). A writer that updates `status` WITHOUT touching
`workflow_stage` leaves stage stale — these 3 rows are the register's "kanban Done column can
fill" defect made flesh: they are completed, still bucketed Todo. **Candidate status-direct
writers (the plan's sweep population, enumerated by grep this session):**
`supabase/functions/tasks-update/index.ts:212`, `backend/src/services/tasks.service.ts:371`,
`supabase/functions/assignments-my-assignments/index.ts:122`, plus
`frontend/src/services/tasks-api.ts` (:483/:501 are soft-delete only — clean). The kanban drag
path (`useUnifiedKanban.ts:398-426`) writes BOTH `status` AND `workflow_stage` client-side (a
benign dual-write today: the trigger derives the same value — the D-82 parity point).

**A second structural finding the verify must state:** `get_unified_work_kanban` filters
`status NOT IN ('completed','cancelled')` in its tasks AND commitments arms while its
column_key CASE maps `completed→'done'` — the mapping is dead code and the **Done column is
structurally starved** (a task reaching stage done/status completed vanishes from the board
query entirely; only invariant-VIOLATING rows could ever render in Done). The planner decides:
either the Done column shows recently-completed work (filter change) or the board is a
working-set board and Done starvation is stated in the COUNT-03 close — either way SC5's "lands
in kanban Done" oracle must be written against the decided semantics, not assumed.

Parity oracle (D-08): client `STAGE_TO_STATUS` (`WorkBoard.tsx:83-89`) vs live CASE — compare
cell-for-cell via a catalog read of `prosrc` against the exported TS map (unit test with the
five pairs hardcoded; a drift in either side fails it).

### Derivation 4 — COUNT-02: fixture preconditions + the real gaps [VERIFIED: staging]

```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.dossiers'::regclass AND contype = 'c';
```

- `dossiers_type_check`: **7 values** — `country`, `organization`, `forum`, `engagement`,
  `topic`, `working_group`, `person`. **`elected_official` is NOT a dossier type in the live
  DB** (it is a person subtype — project memory confirmed). SC5's fixture must use one of the 7.
- `dossiers_name_en_check` / `dossiers_name_ar_check`: non-empty text.
- `dossiers_status_check`: active/inactive/archived/deleted. `dossiers_sensitivity_level_check`: 1–4.
- NOT NULL without defaults: `type`, `name_en`, `name_ar` only (id/status/sensitivity/timestamps/
  is*seed_data all default). **Minimal fixture insert: `(type, name_en, name_ar)` — insertable
  and cleanable.** The `validate*\*\_type` triggers live on the EXTENSION tables (they validate
  extension→dossier, not the reverse) — inserting a dossier with no extension row trips nothing.

Live per-type gaps (hub=dossiers count vs extension rows), 2026-08-17:

| type                            | dossiers  | extension table                     | rows      | gap                                                                                                 |
| ------------------------------- | --------- | ----------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| person                          | 16        | persons                             | 15        | 1 (register [V] confirmed)                                                                          |
| engagement                      | 5         | engagement_dossiers                 | 3         | 2 (register confirmed) — NOTE `engagements` ALSO exists with 5 rows; two competing extension models |
| organization                    | 5         | organizations                       | 2         | **3 — NEW, beyond register**                                                                        |
| topic                           | 2         | topics                              | 1         | **1 — NEW, beyond register**                                                                        |
| country / forum / working_group | 5 / 5 / 6 | countries / forums / working_groups | 5 / 5 / 6 | 0                                                                                                   |

**The canonical list path is SOUND today:** `dossiers-list` edge fn → RPC
`list_dossiers_optimized` → `dossier_list_mv` (materialized view, **LEFT-joined**, currently
complete: 16/16 person, 5/5 engagement — behaviourally confirmed:
`GET /functions/v1/dossiers-list?type=person&limit=100` → 16 rows / total 16). Zero `!inner`
embeds exist in `frontend/src` (grep instrument control-tested against a planted token). The
dropping surfaces are therefore the EXTENSION-TABLE-BASED readers (e.g.,
`DossierEngagementsTab`, `useCountries.ts:132`, `useOrganizations.ts:106` read
`engagement_dossiers`; the dashboard KPI's engagement count — see Derivation 5) and any
stale-mv window: `dossier_list_mv` has refresh machinery (`refresh_dossier_list_mv`,
`queue_dossier_list_mv_refresh`, `refresh_dossier_list_mv_force` in pg_proc) but **no pg_cron
job references it** — the refresh trigger path must be identified in-plan before trusting list
freshness (a dossier created after the last refresh is invisible to the list while the hub
counts it — the same defect class through a different mechanism).

### Derivation 5 — COUNT-01: the mechanically enumerated surface set and its five mechanisms [VERIFIED: staging + codebase]

**The surface set (the agreement claim's population — what's compared, what falls outside):**

| Surface                                    | Route                                                                     | Data mechanism                                                                                                                                          | Source relations + filter seams                                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard KPI strip                        | `/dashboard` (`pages/Dashboard/widgets/KpiStrip.tsx`)                     | RPC `get_dashboard_stats` (`domains/operations-hub/repositories/operations-hub.repository.ts:97`)                                                       | `engagement_dossiers ⋈ dossiers` (active, lifecycle≠closed) for engagements; `unified_work_items` (`status NOT IN completed/cancelled/closed/converted`, optional `assigned_to`) for active work; `intake_tickets` (external_deadline ≤48h) for deadlines; `engagement_dossiers ∪ calendar_entries.event_date` for upcoming |
| /my-work badge/footer/rows                 | `/my-work` (`MyWorkDashboard.tsx` via `useMyWorkDashboard`)               | edge fn `unified-work-list` → RPCs `get_user_work_summary` (reads view `user_work_summary`), `get_unified_work_items` (reads view `unified_work_items`) | View seams: commitments arm `WHERE owner_user_id IS NOT NULL`; tasks arm `is_deleted=false AND assignee_id IS NOT NULL`; intake deadline urgency-scaled                                                                                                                                                                     |
| /commitments tabs                          | `/commitments` (`PersonalCommitmentsDashboard.tsx:33-69`)                 | THREE direct `aa_commitments` head-count queries                                                                                                        | active = `status IN (pending,in_progress)` — **excludes stored `overdue` (8 rows fall out of "active" while the board shows them)**; overdue computed (`due_date < today`, not-completed/cancelled); completed                                                                                                              |
| Kanban board + toolbar chip                | `/kanban` (`WorkBoard.tsx`; route `_protected/kanban.tsx` lazy-mounts it) | RPCs `get_unified_work_kanban` + `get_kanban_column_counts` (`useUnifiedKanban.ts:189,224`) — hand-rolled unions, NOT the view                          | `status NOT IN (completed,cancelled)` all arms; intake SLA flat 3 days; chip count computed client-side `:244-247`                                                                                                                                                                                                          |
| (feeder) custom-dashboard KPI/task widgets | `/custom-dashboard`                                                       | direct `unified_work_items` selects (`useWidgetDashboard.ts`)                                                                                           | falls OUTSIDE the SC4 agreement set per ROADMAP wording, but shares the view — state it as outside                                                                                                                                                                                                                          |

**Live same-clock disagreement, proven in one query batch (2026-08-17):**

```sql
SELECT (SELECT COUNT(*) FROM engagement_dossiers ed JOIN dossiers d ON d.id = ed.id
        WHERE d.status='active' AND ed.lifecycle_stage != 'closed')  AS kpi_active_engagements, -- 3
       (SELECT count(*) FROM dossiers WHERE type='engagement' AND status='active') AS list_count; -- 5
```

Dashboard says 3 engagements; the engagements list renders 5 — both "correct" for their own
filter; the seam is exactly ACCEPTANCE condition 4's class. The unification mechanism is
planner discretion (D-06); research observation: FIVE mechanisms (1 RPC over view+joins, 1 edge
fn over 2 RPCs incl. a second view `user_work_summary`, 3 direct table counts, 2 hand-rolled
union RPCs, direct view selects) currently exist for "the same work" — a shared-derivation
approach (all counts through `unified_work_items`-family relations with per-surface filters
STATED) is the smallest change that makes agreement checkable; a full single-RPC rewrite is not
required by any decision and would widen the diff.

### Derivation 6 — DEAD-05: Branch A (real data) is FEASIBLE — recommended [VERIFIED: deployed staging]

The break: `frontend/src/domains/analytics/repositories/analytics.repository.ts:16` calls
`apiGet('/analytics-dashboard?…', { baseUrl: 'express' })`. The Express backend has **zero**
routes matching `analytics-dashboard` or `organization-benchmarks` (grep over `backend/src`,
instrument-tested). Every page load therefore errors → the page's shipped `QueryErrorState` —
and the "Show sample data" affordance + `AnalyticsPreviewOverlay` present fabricated visuals.

The repair path EXISTS deployed:

```
scripts/probe-edge-auth.sh analytics-dashboard   → analytics-dashboard -> 200
GET /functions/v1/analytics-dashboard?endpoint=summary      → real JSON (totalActiveWork: 11, overdueItems: 11)
GET …?endpoint=engagements|relationships|commitments|workload → all 200 with real (sparse) series
```

`supabase/functions/analytics-dashboard/index.ts` serves `?endpoint=summary|engagements|
relationships|commitments|workload` (+ optional `startDate`/`endDate`), each backed by a live
RPC (`get_analytics_summary`, `get_engagement_metrics`, `get_relationship_health_trends`,
`get_commitment_fulfillment`, `get_workload_distribution` — all present in pg_proc). Payloads
are `{success: true, data: {…}}` with camelCase fields, ONE endpoint per call — the page
adapter (`AnalyticsDashboardPage.tsx:74-107`) expects a SINGLE object with all five sections,
so the repoint needs a shape adaptation (5 parallel queries or a repository aggregator; planner
discretion). **A 200 with a plausible body is NOT evidence of a real data path** (the DEAD-09 reports
mock answered 202 with a minted job_id for months). Each endpoint was therefore classified by
SOURCE READ — the function source plus each RPC's full `prosrc` pulled from `pg_proc` — with
the base tables it reads enumerated (CTE names excluded) and a literal-return scan run
(`RETURN [QUERY] SELECT <literal>` heads: **zero in all five bodies**):

| Endpoint      | RPC                              | Base tables read [VERIFIED: prosrc 2026-08-17]                                        | Live rows       | Classification                                                                                                                                                                                                                          |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| summary       | `get_analytics_summary`          | `aa_commitments`, `assignments`, `dossier_interactions`, `relationship_health_scores` | 10 / 14 / 0 / 0 | REAL — table-derived                                                                                                                                                                                                                    |
| engagements   | `get_engagement_metrics`         | `dossier_interactions` (+`generate_series` date spine)                                | **0**           | REAL but EMPTY-backed — zeros are real empty-table zeros; NOTE the population seam: analytics "engagements" = `dossier_interactions`, NOT `engagement_dossiers` — a different population than the dashboard KPI, stated per condition 4 |
| relationships | `get_relationship_health_trends` | `relationship_health_scores`                                                          | **0**           | REAL but EMPTY-backed — same class                                                                                                                                                                                                      |
| commitments   | `get_commitment_fulfillment`     | `aa_commitments` (+`generate_series`)                                                 | 10              | REAL — but its overdue bucket is blind to stored `overdue` (Derivation 2 row 6); MUST be fixed with Branch A                                                                                                                            |
| workload      | `get_workload_distribution`      | `assignments`, `users`                                                                | 14 / —          | REAL — but counts `assignments`, another distinct work population vs `unified_work_items`; stated as a seam, outside the SC4 agreement set                                                                                              |

**What the probe alone cannot see, stated explicitly:** (a) in-function fabrication — excluded
here by the source read (zero literal returns, every number traced to a FROM/JOIN on a live
relation); (b) empty-table zeros indistinguishable from mock zeros — LIVE for the engagements
and relationships endpoints (`dossier_interactions`=0, `relationship_health_scores`=0): their
zero-filled series are truthful empty renders TODAY, and no oracle may treat a zero series as
proof the path works — the Branch A oracle must distinguish table-derived-zero from
fabricated-zero by fixture (insert a namespaced row, see it appear) or by source citation, never
by the payload alone; (c) semantic drift — a table-derived number can still count the wrong
population (rows 2, 4, 5 above), which is condition 4's seam-stating duty, not a mock.
Additional caveat: server responses embed hex colors (`#10B981`) — the frontend maps to the
chart-palette carve-out tokens, never adopts server colors (frontend/CLAUDE.md).

**Recorded branch decision for the plan (D-03): Branch A — real data**, via repoint to the
deployed edge fn. `generateSample*` (`components/analytics/sample-data.ts`) and
`AnalyticsPreviewOverlay` stop rendering on the route (delete vs unreference is planner
discretion; the oracle is DOM-absence of `preview.insightsYouWillGain`'s resolution and sample
output — UI-SPEC's branch-invariant oracle). Summary-card deltas follow the DEAD-06 trend rule.
The `analytics:disabled.*` keys are NOT added (Branch B unused — UI-SPEC: keys land only for
the branch that ships). If a widget's RPC turns out broken at execution, that widget alone takes
the region-scoped honest-disable state per UI-SPEC Branch B — the branch decision is per-widget
recorded, not all-or-nothing.

### Derivation 7 — DEAD-06: the dead column and the fabricated deltas, pinned [VERIFIED: staging + codebase]

- **The dead query:** `frontend/src/hooks/useWidgetDashboard.ts:587-606` (`fetchEvents`) selects
  `start_datetime` from `calendar_entries` and filters/orders on it. Live columns (verified):
  `event_date` (date) + `event_time` (time) + `all_day` — **`start_datetime` does not exist**;
  the query 42703s on every EventsWidget render. Fix: select/filter/order on `event_date` (+
  `event_time` for intra-day order), map to the widget's `startDate`.
- **The fabricated trends:** `useWidgetDashboard.ts` KPI fetch — `:281`
  `trendPercentage = previousValue > 0 ? … : 0` renders "0.0%"/neutral whenever the comparison
  is missing; `:195/:213/:244/:273` coalesce `previous.count || value` (a missing comparison
  becomes a 0% delta); `:224/:255` hardcode `previousValue = value` ("No historical comparison
  for overdue") — a permanent fabricated-neutral trend. D-04 fix shape: the hook returns
  `trend: null` (or omits) unless the comparison request SETTLED successfully with a real prior
  count; `KpiWidget` omits the trend row entirely on null (UI-SPEC: absent row, no placeholder,
  no em-dash). CDP oracle per UI-SPEC: comparison blocked (narrowed `functions/v1`… — note
  these are PostgREST reads, so the block pattern targets `/rest/v1/` for this widget; narrow
  to the specific table path, not a broad pattern) → row ABSENT; unblocked → real signed
  percentage.
- Chart widgets (`completion-trend`, `intake-volume-trend`, …) read `unified_work_items` /
  `intake_tickets` directly — live relations; the chart itself renders once EventsWidget's
  42703 stops failing its region. Errors already propagate (throws at `:597/:628` — the P93
  retrofit); the remaining lie is the trend row, not swallowed errors.

### Derivation 8 — DEAD-07: four surfaces, four distinct mechanisms [VERIFIED: codebase + staging + probes]

- **`/calendar/new` cannot mount — the DEAD-08 class recurring.** `routes/_protected/calendar.tsx`
  is the parent of `routes/_protected/calendar/new.tsx` in the generated tree
  (`ProtectedCalendarRouteWithChildren`), and CalendarPage renders **no `<Outlet/>`** (grep
  confirmed; instrument-tested against `legislation.tsx`, which P95 fixed the same way).
  Navigating to `/calendar/new` renders the parent only. Fix precedent: P95's DEAD-08
  legislation Outlet.
- **`/calendar` renders a wizard instead of a grid when the month is empty.**
  `UnifiedCalendar.tsx:124` computes `isCalendarEmpty = events.length === 0` from the
  CURRENT-MONTH query window (the comment claims "no events at all" — false), and `:181-190`
  replaces the entire grid with `CalendarEmptyWizard`. Live data: `calendar_entries` has 9 rows,
  all around April 2026 — so today's month renders the wizard, violating D-05's "grid, empty or
  not". `calendar-get` edge fn is deployed and returns the rows (probed 200). Fix shape: the
  grid always renders; the wizard (if kept) becomes non-replacing (planner discretion); error
  path should reuse the shared `QueryErrorState` per the inherited vocabulary (current `:149-155`
  is a bare Card with `text-destructive`).
- **`/events`: no weekday offset, no month navigation.** `pages/events/EventsPage.tsx:40-55`
  renders `eachDayOfInterval({start: monthStart, end: monthEnd})` straight into `grid-cols-7`
  — day 1 always sits under Sunday. No `addMonths`/`subMonths`/chevron exists anywhere in the
  file (grep). Fix: pad by `getDay(monthStart)` leading cells (RTL-mirrored per UI-SPEC), add
  prev/next with `icon-flip`. Data source is the `event_details` VIEW (exists live; columns
  include `start_datetime`; built over the `calendar_events` family which has **0 rows**) —
  per D-05 do NOT consolidate; the grid renders truthfully empty with correct chrome.
- **`/word-assistant`: the badge never probes in the shipped default.**
  `WordAssistantPage.tsx:57` `useState(true)` — the badge asserts "connected" before anything
  settles; `:88` `assistantMode = VITE_WORD_ASSISTANT_MODE || 'fallback'` and `:127` — in
  `fallback` mode (the default everywhere; the env var is set in NO env file, grep-verified)
  the probe is SKIPPED and `isConnected` is forced `true`. The `word-assistant` edge fn IS
  deployed (probe → 405 on GET = function answering, not a gateway 404; it accepts POST).
  **Probe target (discretion, exercised):** the existing `supabase.functions.invoke('word-assistant',
{body: {action: 'check_grammar', text: 'health check'}})` POST is the right live probe — run
  it regardless of mode on mount, with the UI-SPEC three-state pill (`wordAssistant.checking`
  NEW key both locales, initial state = checking, settle from the probe result only). CDP
  oracle per UI-SPEC: block the probe URL → settles disconnected; never connected without a 2xx.

### D-13 tripwire — PASS [VERIFIED: codebase grep, instrument-tested]

Zero `staff_profiles` reads across every Phase 96 criterion surface (analytics, custom-dashboard,
events, word-assistant, WorkBoard, my-work, Dashboard widgets, commitments components, calendar
components, the count hooks/services/domains, and the pinned routes). Instrument control: the
same grep finds `staff_profiles` in `frontend/src/types/database.types.ts` (generated types —
not a read). D-13 holds; no escalation to a park.

## Architecture Patterns

### System Architecture Diagram

```
                          ┌────────────────────────── COUNT-01 surface set ──────────────────────────┐
                          │                                                                          │
  /dashboard KpiStrip ────┼─ rpc get_dashboard_stats ──► engagement_dossiers ⋈ dossiers              │
                          │                          ├─► unified_work_items (VIEW) ◄─┐               │
  /my-work ───────────────┼─ edge unified-work-list ─┤─► get_user_work_summary ──► user_work_summary │
                          │                          └─► get_unified_work_items ──► unified_work_items
  /commitments tabs ──────┼─ 3× direct counts ──────────► aa_commitments  ◄── trg commitment_overdue_check (BEFORE UPDATE only ← INSERT GAP)
                          │                                       ▲
  /kanban WorkBoard ──────┼─ rpc get_unified_work_kanban ─► tasks ┴ aa_commitments ∪ intake_tickets  (own union, own filters)
                          │                                  ▲
                          │                    trg trg_sync_task_status (BEFORE UPDATE only; stage→status one-way)
                          └──────────────────────────────────────────────────────────────────────────┘

  /analytics ── analytics.repository ──✗ express (no route) ─── FIX: repoint ──► edge analytics-dashboard (DEPLOYED, 200)
                                                                                   └─► 5 RPCs (live)
  /custom-dashboard ── useWidgetDashboard ──► unified_work_items + calendar_entries (✗ start_datetime → event_date)
  /calendar ── calendar-get (deployed) ──► calendar_entries (9 rows)   /calendar/new ✗ no <Outlet/>
  /events ── event_details VIEW (calendar_events family, 0 rows — separate model, keep)
  /scenario-sandbox ── edge scenario-sandbox ── PostgREST ──✗ 42P17: scenarios policy ↔ scenario_collaborators policy
                                                             FIX: SECURITY DEFINER is_scenario_owner breaks one direction
```

### Pattern 1: RLS recursion break via single-row SECURITY DEFINER predicate

**What:** Replace the EXISTS-over-the-other-table clause in ONE direction with a
`SECURITY DEFINER STABLE` boolean function reading a single row, pinned empty search_path.
**When:** SANDBOX-500-01 migration.
**Source:** `supabase/migrations/20260816500001_p94_report_rls_recursion.sql` (in-repo precedent
with two-sided row-set proof protocol `scripts/probe-report-rls.mjs`). [CITED: repo]

### Pattern 2: Verify-not-build for DB-enforced invariants

**What:** COUNT-03 confirms `trg_sync_task_status` by catalog read + parity unit test against
`STAGE_TO_STATUS`, then sweeps status-direct writers; it writes NO new sync (client or DB).
The one legitimate DB change class in this phase is TRIGGER TIMING (INSERT gaps), via migration.

### Pattern 3: Truthful-absence rendering

**What:** A value that was not computed renders as ABSENT, never as a neutral-looking number.
Trend rows omit; count widgets on failed queries show the error contract, never `0`
(UI-SPEC Loading→Error transition, binding).

### Pattern 4: Same-clock agreement oracles

**What:** Every COUNT agreement is one DOM snapshot or one SQL batch
(`SELECT (…) AS a, (…) AS b` in a single statement — the Derivation 5 shape); cross-time
comparisons state their seam. [CITED: ACCEPTANCE condition 7 / D-16]

### Anti-Patterns to Avoid

- **Client-side re-implementation of a DB trigger** (forbidden shape, condition 8).
- **Consolidating `calendar_entries`/`calendar_events`** or renaming `aa_commitments` statuses.
- **Trusting `commitment_status_history` as user intent** (audit fires after the rewrite).
- **A new kanban Overdue column or drag change** — the parked fork, ruled KEEP REFUSAL.
- **Broad CDP block patterns** (blanks the SPA — narrow to the exact URL; 95-03 lesson).
- **Adopting server-sent hex colors in charts** — map to the chart-palette carve-out tokens.
- **`.select('…extension!inner(…)')` embeds** when fixing COUNT-02 — the repo has zero today
  (verified); do not introduce the drop mechanism while fixing it.

## Don't Hand-Roll

| Problem                         | Don't Build                               | Use Instead                                                                      | Why                                           |
| ------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| Sandbox 500                     | A new scenario endpoint / client fallback | The RLS migration (Pattern 1) — the deployed fn is correct                       | Cause is in policy quals, proven              |
| Analytics backend               | An Express route or new fn                | Deployed `analytics-dashboard` edge fn                                           | Already serves all 5 endpoints with real data |
| Month math                      | Custom weekday/offset arithmetic          | `date-fns` `getDay`/`addMonths`/`subMonths` (already imported in the same files) | Locale/edge cases; already the house library  |
| Error/empty/disabled states     | New components                            | `QueryErrorState` + P93 family, UI-SPEC honest-disable spec                      | Inherited vocabulary is binding               |
| Consumer sweeps                 | Inline shell                              | `scripts/c9b-sweep.sh` ONLY (D-19)                                               | Fail-closed, control-self-testing             |
| Deploy evidence                 | Manual curls                              | `scripts/probe-edge-auth.sh` (404-kind classification)                           | The inherited instrument                      |
| Gate drills / decision coverage | Ad-hoc checks                             | `scripts/gate-drill.mjs`, `scripts/decision-coverage.mjs`                        | Standing law D-14/D-21                        |

**Key insight:** every fix in this phase repoints, re-times, or truth-guards something that
already exists; the only genuinely new artifacts are one badge, one pill state, the TRIGSWEEP
instrument, and two migrations.

## Common Pitfalls

### Pitfall 1: Fixing the sandbox policy in the wrong direction

**What goes wrong:** Replacing the `scenarios` policy's collaborator clause (instead of the
`scenario_collaborators` policies' scenarios clause) with a definer that reads
`scenario_collaborators` — the cycle survives through the other evaluation path, or the visible
row set widens.
**How to avoid:** Mirror the P94 migration exactly: the DEFINER replaces the EXISTS on the
_collaborators_ side; `scenarios`' own policy is untouched; prove row-set invariance two-sided
(owner sees own+collaborated; collaborator sees exactly theirs; stranger sees none).
**Warning signs:** Any migration touching `scenarios_select_own_or_collaborated`.

### Pitfall 2: Believing a syntactic trigger regex — including this file's

**What goes wrong:** The union regex above counts 192; reading the residual found 2 more. A
plan that pastes the regex and reports its number repeats the ninth/tenth undercount.
**How to avoid:** The residual list is a deliverable; every residual trigger is hand-classified
in the derivation output; the both-direction control runs before the count is filed.

### Pitfall 3: The INSERT-gap migration re-fires history

**What goes wrong:** Re-timing `commitment_overdue_check` to BEFORE INSERT OR UPDATE, plus a
data migration flipping the 2 pending rows, writes `commitment_status_history` rows via
`commitment_status_audit` (UPDATE path) — oracles that count history rows get confused, and the
audit records the coerced value (by design).
**How to avoid:** The plan states whether existing past-due `pending` rows are migrated by
UPDATE (trigger coerces, history records coercion — fine and truthful) or left to the next
touch; the COUNT-04 close states it either way.

### Pitfall 4: SC5's "lands in kanban Done" oracle vs the starved Done column

**What goes wrong:** The oracle drags a task to Done, then asserts it renders in the Done
column — but `get_unified_work_kanban` excludes completed rows; the card vanishes instead.
Written naively, the oracle can never pass (or passes only against invariant-violating rows).
**How to avoid:** Decide the Done-column semantics FIRST (Derivation 3), then write the oracle
against the decided behaviour.

### Pitfall 5: Playwright/e2e infrastructure traps (inherited, live)

Paths are FILTERS — assert spec existence first, hardcode counts, `--no-deps` (all three
non-setup projects carry `dependencies: ['setup']` — verified in `playwright.config.ts`); no
oracle depends on the `setup` project (D-18; inline auth with `.env.test` creds works — proven
again this session by the probe protocol); single app instance at `:5173` (CORS).

### Pitfall 6: The mv freshness trap in COUNT-02 oracles

**What goes wrong:** The SC5 fixture dossier is inserted, and the list oracle reads
`dossiers-list` → `dossier_list_mv` — which may not include the new row until refreshed; the
oracle fails against a sound fix (or a stale-pass hides a broken one).
**How to avoid:** The oracle either calls `refresh_dossier_list_mv_force()` (service-role,
execution leg) after the insert or targets the fallback/direct path; either way the mv-refresh
mechanism is identified and stated in the derivation.

### Pitfall 7: prettier + frontmatter, zsh splitting, ugrep, no `timeout` (D-23)

All inherited instrument facts hold — verified live this session that the repo `grep` honors
.gitignore (`command grep` used throughout; every zero above was instrument-tested).

## Code Examples

### The sandbox fix shape (mirror of the in-repo precedent)

```sql
-- Source: supabase/migrations/20260816500001_p94_report_rls_recursion.sql (adapt names)
CREATE OR REPLACE FUNCTION public.is_scenario_owner(p_scenario_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$ SELECT s.created_by = auth.uid() FROM public.scenarios s WHERE s.id = p_scenario_id $$;
GRANT EXECUTE ON FUNCTION public.is_scenario_owner(uuid) TO authenticated;
-- Then re-create scenario_collaborators' 3 policies with the EXISTS-over-scenarios clause
-- (and ONLY that clause) replaced by is_scenario_owner(scenario_id); preserve all else verbatim.
```

### The behaviour-classified trigger derivation (re-runnable via Supabase MCP)

```sql
-- Population: public-schema, non-internal, BEFORE, FOR EACH ROW (see Derivation 1 for the CTE).
-- Classifier = union of ALL FOUR known forms; residual is LISTED, never assumed:
SELECT tgname, relname, proname,
  CASE WHEN lanname <> 'plpgsql' THEN 'writer-suspect (non-plpgsql)'
       WHEN prosrc ~* 'NEW\.[a-zA-Z_]+\s*:='                                   THEN 'writer (:=)'
       WHEN prosrc ~* '(^|;|\n|\mBEGIN\M|\mTHEN\M|\mELSE\M|\mLOOP\M)\s*NEW\.[a-zA-Z_]+\s*=[^=]'
                                                                               THEN 'writer (=)'
       WHEN prosrc ~* 'INTO\s+(STRICT\s+)?NEW\.'                               THEN 'writer (INTO)'
       WHEN prosrc ~* '(^|;|\n)\s*NEW\s*:?=\s'                                 THEN 'writer (record)'
       ELSE 'RESIDUAL — hand-classify' END AS class
FROM ( /* Derivation 1 CTE */ before_row ) x ORDER BY class, relname;
```

### The same-clock agreement oracle shape

```sql
-- One statement, one clock — condition 7 compliant by construction:
SELECT (SELECT count(*) FROM unified_work_items WHERE assigned_to = $1
         AND status NOT IN ('completed','cancelled','closed','converted')) AS my_work_active,
       (SELECT total_active FROM user_work_summary WHERE user_id = $1)      AS summary_active;
```

### The DEAD-06 column fix target

```typescript
// useWidgetDashboard.ts fetchEvents — event_date/event_time are the live columns [VERIFIED]
.from('calendar_entries')
.select('id, title_en, title_ar, entry_type, event_date, event_time, all_day, description_en, description_ar')
.gte('event_date', now.toISOString().slice(0, 10))
.order('event_date', { ascending: true })
.order('event_time', { ascending: true, nullsFirst: false })
```

## State of the Art

| Old Approach (shipped)                                | Current Approach (this phase)                                                | Why                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------- | ------------------------------------------ | ---- |
| `/analytics` → express base (dead) + sample-data mode | Deployed edge fn, per-endpoint queries, no fabricated visuals                | Derivation 6               |
| Trend = `previous.count                               |                                                                              | value` → 0.0%              | Absent trend row unless comparison settled | D-04 |
| Overdue = 6 independent formulas                      | One signal, seams stated, INSERT gap closed                                  | D-09 / RULING-P96-01       |
| Trigger population by regex                           | Behaviour classification + hand-classified residual + both-direction control | D-11, tenth-instance proof |

**Deprecated/outdated within this scope:** `AnalyticsPreviewOverlay` + `generateSample*` (stop
rendering, Branch A); the `useWidgetDashboard` `start_datetime` query; `isConnected=true`
initial badge state.

## Assumptions Log

| #   | Claim                                                                                                                                                                        | Section      | Risk if Wrong                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `check_commitment_overdue()`'s body is INSERT-safe (no `OLD` reference), so re-timing to `BEFORE INSERT OR UPDATE` needs no body change                                      | Derivation 2 | Migration errors or silently skips on INSERT — plan re-reads full prosrc before authoring [ASSUMED — register quotes the body but full prosrc not pulled this session]                                                                   |
| A2  | The `unified-work-list`/`get_unified_work_items` path is what renders /my-work's badge-18/footer-21/rows-11 discrepancy (pagination/summary-vs-rows seam inside one surface) | Derivation 5 | The named defect's exact intra-surface mechanism differs; the enumeration table still holds — plan pins it when writing the SC4 oracle [ASSUMED — cross-surface seams verified; intra-surface footer mechanics not traced to line level] |
| A3  | `dossier_list_mv` freshness is maintained by some non-cron trigger/queue path (`queue_dossier_list_mv_refresh` exists)                                                       | Derivation 4 | Lists silently stale; COUNT-02 oracle flakes — Pitfall 6 mitigates either way                                                                                                                                                            |
| A4  | The register's historical "persons 16 vs 15 [V]" dropping surface was either a since-refreshed mv state or an extension-table-based reader                                   | Derivation 4 | None material: today's gaps are re-derived live and the fix rule (D-07) is surface-general                                                                                                                                               |

## Open Questions

1. **Does the authenticated test user see any `scenarios` rows post-fix?**
   - What we know: RLS scopes to own/collaborated rows; row count unqueried under user identity
     (research leg had no RLS-scoped read path once 42P17 blocks it — chicken-and-egg).
   - Recommendation: after the migration, the probe re-runs; an empty-but-200 sandbox is a
     truthful WORKING state (the P95 vocabulary covers empty). If SC demands visible data, a
     namespaced fixture scenario (CHECKs verified first) is the same pattern as SC5's.
2. **Done-column semantics for SC5's "lands in kanban Done"** (Derivation 3, Pitfall 4).
   - Planner discretion, but it must be DECIDED in the plan text and the oracle written to it.
3. **[RESOLVED in-session — no longer open]** `get_commitment_fulfillment`'s bucket formula was
   pulled from `pg_proc`: overdue = `status IN ('pending','in_progress') AND due_date < NOW()` —
   blind to stored `overdue` (Derivation 2 row 6, Derivation 6 table). The bucket fix is part of
   DEAD-05 Branch A's close and must land WITH or BEFORE the COUNT-04 INSERT-gap fix (which
   would otherwise zero this chart's overdue series silently).

## Environment Availability

| Dependency                             | Required By                         | Available                                         | Version/Evidence                                                                                                                    | Fallback                         |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Supabase MCP (or CLI, authed + linked) | migrations, catalog derivations     | ✓                                                 | CLI 2.106.0, project linked; management-API query path proven this session                                                          | `scripts/…` + psql not needed    |
| Deployed edge tier                     | probes, repoint                     | ✓                                                 | analytics-dashboard 200, unified-work-list 200, calendar-get 200, word-assistant 405 (deployed), scenario-sandbox 500 (the defect)  | —                                |
| `.env.test` TEST_USER creds            | behavioural probes, e2e inline auth | ✓                                                 | login proven this session (D-18 route-around works)                                                                                 | —                                |
| Playwright + configs                   | e2e oracles                         | ✓                                                 | root `playwright.config.ts` (projects: setup, chromium-en, chromium-ar-smoke, chromium-mobile — all non-setup carry `dependencies`) | `--no-deps` mandatory            |
| Vitest                                 | unit oracles                        | ✓                                                 | root + `frontend/vitest.config.ts`                                                                                                  | —                                |
| browser-harness CDP Chrome             | render evidence                     | ✓ (project memory — not re-verified this session) | BU_CDP_URL protocol                                                                                                                 | [ASSUMED] re-verify at execution |
| `timeout` CLI                          | —                                   | ✗                                                 | does not exist on this Mac (D-23)                                                                                                   | Playwright/node-side budgets     |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (root + frontend workspaces) for unit; Playwright for e2e (root `playwright.config.ts`)                                                                                                    |
| Config file        | `vitest.config.ts`, `frontend/vitest.config.ts`, `playwright.config.ts`                                                                                                                           |
| Quick run command  | `pnpm --filter frontend exec vitest run <file> --reporter=basic` (per-file); Playwright: `pnpm exec playwright test tests/e2e/<spec> --project=chromium-en --no-deps`                             |
| Full suite command | `pnpm test -- --continue` (Turbo — `--continue` mandatory, D-23); e2e CI shape: `pnpm test:e2e:ci` (NOTE: carries `setup` dependency — phase oracles use `--no-deps` + inline auth instead, D-18) |

### Phase Requirements → Test Map

| Req ID         | Behavior                                                                                    | Test Type                                         | Automated Command                                                                                                                                                                                 | File Exists?                                |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| SANDBOX-500-01 | `/scenario-sandbox` renders content; error state remains failure branch                     | e2e (CDP) + probe                                 | `pnpm exec playwright test tests/e2e/95-sandbox-error.spec.ts --project=chromium-en --no-deps` (updated same-task per D-12) + `bash scripts/probe-edge-auth.sh scenario-sandbox` (expect non-500) | ✅ exists — MUST be updated in the fix task |
| COUNT-03       | STAGE_TO_STATUS parity with live CASE; zero stage/status divergent rows post-writer-fix     | unit + SQL oracle                                 | new `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts` + recorded SQL (Derivation 3 GROUP BY)                                                                                   | ❌ Wave 0                                   |
| COUNT-04       | INSERT of past-due row carries `overdue`; chip == badged cards same-clock                   | SQL + e2e DOM count                               | recorded SQL + new spec `tests/e2e/96-overdue-badge.spec.ts` (data-testid per UI-SPEC)                                                                                                            | ❌ Wave 0                                   |
| COUNT-01       | Enumerated surfaces agree same-clock                                                        | e2e single-DOM snapshot + one-statement SQL batch | new `tests/e2e/96-count-agreement.spec.ts`                                                                                                                                                        | ❌ Wave 0                                   |
| COUNT-02       | Fixture dossier (no extension row) renders in list AND hub count                            | e2e + SQL fixture                                 | new spec + fixture insert/clean via MCP (CHECKs verified — Derivation 4)                                                                                                                          | ❌ Wave 0                                   |
| DEAD-05        | No sample/preview strings in DOM; real charts render                                        | e2e (existing WorkBoard test pattern)             | new `tests/e2e/96-analytics-real.spec.ts` (branch-invariant oracle per UI-SPEC)                                                                                                                   | ❌ Wave 0                                   |
| DEAD-06        | EventsWidget renders rows; trend row ABSENT under blocked comparison                        | e2e CDP (narrowed block)                          | new `tests/e2e/96-custom-dashboard-truth.spec.ts`                                                                                                                                                 | ❌ Wave 0                                   |
| DEAD-07        | Grid renders empty month; /calendar/new mounts form; /events offset+nav; badge three-state  | e2e                                               | new `tests/e2e/96-calendar-family.spec.ts`                                                                                                                                                        | ❌ Wave 0                                   |
| TRIGSWEEP-01   | Instrument catches synthetic writer, ignores synthetic non-writer; residual hand-classified | script + both-direction drill                     | recorded SQL (Code Examples) + drill artifact on disk                                                                                                                                             | ❌ Wave 0 (script + drill)                  |

Existing unit anchors to keep green: `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx`
(`:546` already asserts chip == filter count — extend, don't duplicate), `KCard.test.tsx`
(overdue class), `BoardColumn.test.tsx`.

### Sampling Rate

- **Per task commit:** the touched surface's vitest file(s) + the task's own spec with `--no-deps`
- **Per wave merge:** `pnpm test -- --continue` + the phase's e2e specs (`--project=chromium-en --no-deps`, spec existence asserted first, counts hardcoded)
- **Phase gate:** full suite green + all 9 requirement oracles + `scripts/gate-drill.mjs` both directions before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/96-*.spec.ts` family (6 specs above) — covers COUNT-01/02/04, DEAD-05/06/07
- [ ] `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts` — COUNT-03
- [ ] TRIGSWEEP instrument script + both-direction drill artifact — TRIGSWEEP-01
- [ ] Framework install: none needed

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies              | Standard Control                                                                                                                                                                                                                                                 |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no (no auth changes) | inherited `_protected` gate + edge `verify_jwt`                                                                                                                                                                                                                  |
| V3 Session Management | no                   | inherited Supabase Auth                                                                                                                                                                                                                                          |
| V4 Access Control     | **yes**              | The SANDBOX-500-01 RLS migration must NOT widen row visibility — SECURITY DEFINER returns a boolean owner check only, single-row scope, pinned search_path, two-sided row-set proof (the P94 protocol). Any new RPC/policy binds `profiles.user_id = auth.uid()` |
| V5 Input Validation   | yes                  | No user input paths added; fixture inserts validated against `pg_constraint` first; search params already quoted (`quotePostgrestValue` precedent in EventsPage)                                                                                                 |
| V6 Cryptography       | no                   | —                                                                                                                                                                                                                                                                |

### Known Threat Patterns for this stack

| Pattern                                     | STRIDE                | Standard Mitigation                                                                                                                                                                                           |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS policy recursion / silent gate collapse | DoS / Info disclosure | Definer-boolean pattern; never bare `profiles.id` (no such column); re-derive `pg_policy` live after migration                                                                                                |
| Error-detail leakage to UI                  | Info disclosure       | P93 rule holds: no `error.message` in JSX; the sandbox fn's `CREATE_FAILED` paths already interpolate `error.message` into responses — do not extend that pattern; UI renders only the shared error component |
| Overly-broad SECURITY DEFINER               | Elevation             | Single-row, boolean-only, `SET search_path = ''`, COMMENT documenting scope (precedent)                                                                                                                       |
| Test-credential leakage                     | Info disclosure       | `.env.test` values never echoed (probe protocol); E2ECRED-01 rotation is P101's, routed around                                                                                                                |

## Sources

### Primary (HIGH confidence)

- Live staging catalog + data queries, `zkrcjzdemdmwhearhfgg`, 2026-08-17 (every SQL block above, re-runnable via `mcp__supabase__execute_sql`)
- Deployed-tier behavioural probes: PostgREST as authenticated user; `scripts/probe-edge-auth.sh`; direct edge-fn GETs with user JWT
- Repo at `milestone/v10.0-trust` (pins: `analytics.repository.ts:16`, `useWidgetDashboard.ts:281,591-593`, `WorkBoard.tsx:83-89,105-117,244-247`, `UnifiedCalendar.tsx:124,181-190`, `EventsPage.tsx:40-55,262-271`, `WordAssistantPage.tsx:57,88,127,251-263`, `routes/_protected/calendar.tsx` (no Outlet), `useUnifiedKanban.ts:189,224,398-426`, `PersonalCommitmentsDashboard.tsx:33-69`, `supabase/functions/{scenario-sandbox,analytics-dashboard,dossiers-list,unified-work-list}/index.ts`, `supabase/migrations/{20260114300001_scenario_sandbox.sql,20260816500001_p94_report_rls_recursion.sql,20260330000001_operations_hub_rpcs.sql}`)
- Full `prosrc` pulls from `pg_proc` for: `get_dashboard_stats`, `get_user_work_summary`, `get_unified_work_kanban`, `list_dossiers_optimized`, and all five analytics RPCs (`get_analytics_summary`, `get_engagement_metrics`, `get_relationship_health_trends`, `get_commitment_fulfillment`, `get_workload_distribution`) — base-table enumeration + literal-return scan, 2026-08-17
- `.planning/phases/96-real-numbers/96-CONTEXT.md`, `96-UI-SPEC.md`; `.planning/REQUIREMENTS.md` rows 80–157; `.planning/ROADMAP.md` §Phase 96; `.tickmarkr/overseer/{ORCH-BRIEF.md,ACCEPTANCE-P96-PLAN.md}`

### Secondary (MEDIUM confidence)

- Project memory entries (dashboard-RPC table reads, calendar split, CHECK-before-seed, EO=person_subtype) — each re-verified live where load-bearing

### Tertiary (LOW confidence)

- None — no WebSearch was needed; the domain is this repo + this staging DB

## Metadata

**Confidence breakdown:**

- SANDBOX-500-01 cause: HIGH — behaviourally proven twice (PostgREST 42P17 + fn 500)
- TRIGSWEEP population: HIGH for the enumeration; the COUNT is deliberately a floor (instrument untested-in-both-directions until the plan's drill)
- COUNT seams: HIGH — live same-clock derivations
- DEAD-05/06/07 mechanisms: HIGH — pinned to lines and probed deployments
- Intra-surface /my-work footer mechanics: MEDIUM (A2)

**Research date:** 2026-08-17
**Valid until:** live counts are floors pinned to this date — re-derive at execution (staging data moves); code pins valid until the named files change

RESEARCH-END
