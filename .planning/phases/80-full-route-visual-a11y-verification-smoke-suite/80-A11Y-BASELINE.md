# Phase 80 — VERIFY-02 A11y Baseline (RECORDED + finalized A/B verdict)

**Purpose:** The single recorded, honest a11y baseline for VERIFY-02. Every
fix-vs-record decision in Plan 80-03 derives from this document. No baseline
laundering: the failure set is characterized on ONE stated reference environment,
with date + commit SHA, and every classification is gated behind proven-live
fixtures.

**Status:** §1–§8 recorded by Plan 80-01 (set B, HEAD). §9–§10 added by Plan 80-02:
the RECORDED pre-token leg (set A, worktree `14191cb85`) + the finalized **B ⊆ A**
verdict and the Plan 80-03 must-fix list. **Verdict: B ⊆ A is FALSE — 4 NEW-on-HEAD
`color-contrast` scans (organizations en/ar, topics en, tasks en — all Linear
light).** See §10.

---

## 1. Reference environment (authoritative — the anti-laundering control)

VERIFY-02 forbids deciding fix-vs-record from shifting CI logs. All classification
below is measured on exactly one environment, stated here.

<!-- prettier-ignore-start -->
| Field | Value |
| --- | --- |
| Reference environment | Local seeded dev (this Mac) — Playwright `a11y` project, `pnpm dev` on `:5173`, auto-started by Playwright's `webServer` block (`E2E_BASE_URL` unset) |
| Data backend | Staging Supabase — project `zkrcjzdemdmwhearhfgg` (the local dev server authenticates against staging; the `a11y` project inherits a pre-authenticated `storageState` from `tests/e2e/global-setup.ts`) |
| Auth | `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` from repo-root `.env.test` (never hardcoded) → `global-setup.ts` logs in once, persists `storageState` |
| Date | 2026-07-03 |
| HEAD commit | `b5ad1ac3f` (v8.0 local main; Phase 79 Aceternity-removal complete) |
| Command | `pnpm -C frontend exec playwright test --project=a11y --retries=1` (`E2E_BASE_URL` unset) |
| Raw log | archived to session scratchpad `a11y-characterization.log` (55.8s wall, Playwright exit 0) |
| Gate scope | the 5 `a11y`-project specs = 97 tests (`playwright.config.ts:132-142`): `dossiers-a11y`, `dossiers-rtl-a11y`, `positions-a11y-en`, `positions-a11y-ar`, `intake-accessibility` |
<!-- prettier-ignore-end -->

The 8 quarantined specs (`playwright.config.ts:118-131`) are OUT of the gate and
out of scope — their quarantine is the recorded disposition (issue #31 class).

---

## 2. Fixture-liveness proof (gates all classification below)

A missing/renamed staging row turns an a11y scan into a 404-page scan that mimics
an a11y failure, so liveness is proven BEFORE any failure is classified. Executors
have no MCP access (established project fact); this probe was run by the
orchestrator via Supabase MCP against project `zkrcjzdemdmwhearhfgg` on 2026-07-03.

**Source: orchestrator Supabase-MCP probe (recorded verbatim).**

Dossiers — 7/7 resolved (the 6 `testDossierIds` + `FIXTURE_DOSSIER_ID`):

<!-- prettier-ignore-start -->
| Role | Type | ID | Name |
| --- | --- | --- | --- |
| testDossierIds.country | country | `9b9a04af-50b0-408c-878d-9d07f77a74ab` | Saudi Arabia |
| testDossierIds.organization | organization | `b0000001-0000-0000-0000-000000000006` | GCC Statistical Centre |
| testDossierIds.person | person | `a0000000-0000-0000-0000-000000000501` | Test Person A — Senior Diplomat |
| testDossierIds.engagement | engagement | `b0000002-0000-0000-0000-000000000003` | Delegation visit — Indonesia BPS |
| testDossierIds.forum | forum | `b0000001-0000-0000-0000-000000000003` | G20 Data Gaps Initiative |
| testDossierIds.working_group | working_group | `a0000000-0000-0000-0000-000000000403` | Test Working Group C — Digital Infrastructure |
| FIXTURE_DOSSIER_ID | country | `b0000001-0000-0000-0000-000000000004` | China |
<!-- prettier-ignore-end -->

SRTL-02 `calendar_entries` — 3/3 rows resolved (July 2026; all
`organizer_id = de2734cf-f962-4e05-bf62-bc9e92efff96`; used by FOUC-02 calendar
smoke in a later plan, verified now to avoid a later STOP):

<!-- prettier-ignore-start -->
| ID | title_en | event_date |
| --- | --- | --- |
| `007b1ee4-4f9a-40bc-ab42-6138564820a8` | SRTL-02 regression seed A | 2026-07-10 |
| `5180e1a2-a535-4a5c-b8e0-7eee858b8adf` | SRTL-02 regression seed B | 2026-07-15 |
| `ff18f280-aa53-41fc-9b53-36e53db7235a` | SRTL-02 regression seed C | 2026-07-21 |
<!-- prettier-ignore-end -->

**Verdict:** all load-bearing rows are LIVE. Classification proceeds; no
STOP-and-escalate for dead fixtures.

---

## 3. Reference-env result (authoritative)

<!-- prettier-ignore-start -->
| Outcome | Count |
| --- | --- |
| passed | 87 |
| skipped (`test.fixme` recorded debt) | 10 |
| **failed (hard)** | **0** |
| flaky (failed-then-passed on `--retries=1`) | 0 |
| total | 97 |
<!-- prettier-ignore-end -->

**On the reference environment the `a11y` gate is fully green: zero hard failures,
zero flakes.** The Phase-77 Linear token migration and Phase-79 Aceternity removal
introduced NO new serious/critical a11y violations on any gate spec. Every one of
the CI-observed red/flaky tests (see §5) passed here, including all 18
`dossiers-rtl-a11y` `T074-{type}-{axe,aria,headings}` tests across all 6 dossier
types in RTL, both positions keyboard-nav tests (EN + AR), and the intake
keyboard-nav test.

---

## 4. Per-hard-failure characterization table

Root-cause class vocabulary ∈ {**app-bug**, **test-bug**, **data-drift**}.

**Hard failures on the reference environment: NONE.** There are no reference-env
hard failures to fix or record — the table is intentionally empty of failures:

<!-- prettier-ignore-start -->
| Spec file | Test title | Failing assertion | Root-cause class |
| --- | --- | --- | --- |
| — (none) | — | — | n/a — 0 hard failures on the reference env |
<!-- prettier-ignore-end -->

Consequence for Plan 80-03: because 0 hard failures reproduce here and the genuine
app debt is already recorded (§6), the "no new violations vs recorded baseline"
comparison has an empty new-violation set. B ⊆ A holds trivially on this axis
(set B recorded in §7).

---

## 5. CI-observed failures NOT reproduced on the reference env (classified)

RESEARCH extracted 9 hard / 5 flaky from CI run `28574521475` (GitHub ubuntu
runner, 2026-07-02, `workers: 2`, `retries: 2`). None reproduced on the reference
env. They are characterized here so the CI redness has a recorded disposition —
they are NOT app bugs.

<!-- prettier-ignore-start -->
| CI test (run 28574521475) | Assertion | Reference-env result | Root-cause class |
| --- | --- | --- | --- |
| `dossiers-rtl-a11y` T074-country/organization/engagement/forum `-aria` | `missingLabels.length < 5` (unlabeled buttons/links) | PASS (all 4) | test-bug (DOM-count scan runs on a `networkidle`-only wait with no `waitForRouteReady` gate → partially-hydrated dossier detail has transient unlabeled controls under CI worker concurrency); data-drift contributes on the count threshold |
| `dossiers-rtl-a11y` T074-organization/forum `-headings` | `h1Count >= 1` | PASS (both) | test-bug (H1 not yet painted when the scan fires pre-hydration under CI concurrency); data-drift contributes |
| `intake-accessibility:54` keyboard-nav | first `Tab` lands on interactive | PASS | test-bug (first-Tab focus target depends on render/interactive readiness timing) |
| `positions-a11y-en:74` keyboard-nav | 2×`Tab` lands on interactive | PASS | test-bug (same first-Tab readiness timing) |
| `positions-a11y-ar:75` keyboard-nav | 2×`Tab` → `:focus` count > 0 | PASS | test-bug (same) |
| flaky: country `-headings`, person `-aria`, working_group `-aria`+`-headings`, `positions-a11y-en:98` landmark/single-h1 | as above | PASS (all) | test-bug (already CI-flaky = timing; `retries: 2` masks them as non-failing on CI) |
<!-- prettier-ignore-end -->

**Dominant class: test-bug (readiness/timing under CI concurrency), with a
data-drift contribution on the DOM-count assertions.** No **app-bug** is implicated
— the app renders correct landmarks, labels, and heading structure on the seeded
reference env (87/87 non-skipped passes, including every test above). This is the
"failure set shifts run-to-run" the plan anticipated; the reference-env discipline
pins the authoritative measurement.

---

## 6. The 10 `test.fixme` skips — already-recorded pre-existing debt

These are the recorded baseline (the in-repo `test.fixme(true, 'reason')` +
`TRACKED APP A11Y DEBT` convention — there is no separate allowlist). They predate
Phase 80 (present since the June prod-quality sweeps), each carries a root-cause
rationale, and none were added or altered by this plan — so this is a record, not
laundering. Root-cause class for all: **app-bug** (genuine component debt),
already recorded.

<!-- prettier-ignore-start -->
| # | Spec:line | Test | Recorded rationale (verbatim intent) |
| --- | --- | --- | --- |
| 1 | `intake-accessibility:32` | Intake list — no serious/critical WCAG | button-name / aria-prohibited-attr / target-size debt |
| 2 | `intake-accessibility:32` | Intake form — no serious/critical WCAG | same intake-form debt |
| 3 | `intake-accessibility:32` | Intake queue — no serious/critical WCAG | same intake debt |
| 4 | `intake-accessibility:109` | should not skip heading levels | intake form skips h1 → h3 (structural) |
| 5 | `intake-accessibility:126` | RTL mode a11y for Arabic content | same intake debt also present in AR (RTL itself verified OK) |
| 6 | `intake-accessibility:143` | forced-colors mode | same intake debt under forced-colors |
| 7 | `positions-a11y-en:37` | position detail accessible | rich-text editor (contenteditable) debt: aria-prohibited-attr, nested-interactive, no-focusable-content, aria-input-field-name, button-name |
| 8 | `positions-a11y-en:52` | version history accessible | same editor/diff surface debt |
| 9 | `positions-a11y-ar:41` | position detail accessible (AR RTL) | same editor debt (RTL applies correctly) |
| 10 | `positions-a11y-ar:63` | version comparison accessible (AR RTL) | same editor/diff debt |
<!-- prettier-ignore-end -->

(One `test.fixme` on the parameterized intake axe test at line 32 produces skips
#1–#3, one per route — hence 6 intake skips from 4 fixme statements + 4 positions
skips = 10 total. Matches the run's "10 skipped".)

---

## 7. Out-of-scope baseline note

The vitest `waiting-queue-a11y` T091-07 assertion is a pre-existing local-only
baseline failure; the required CI check `Tests (frontend)` is green. Per plan, this
is NOT chased in Phase 80.

---

## 8. HEAD leg (set B) — explicit 4-axis axe sweep

**Called-out coverage extension (no silent expansion).** `qa-sweep-axe.spec.ts`
scans 15 routes × {en, ar} but is theme-implicit — post-Phase-77 it scans DARK
ONLY. VERIFY-02 requires all four axes, so `qa-sweep-axe-4axis.spec.ts` adds the
theme dimension: **15 routes × {en, ar} × {light, dark} = 60 scans**. This is an
EXPLICIT extension called out per the CONTEXT no-silent-expansion discipline, and
it is deliberately NOT wired into the FOUC-02 CI smoke job (60 scans exceed that
job's runtime budget) — it stays a LOCAL baseline vehicle. It uses the same
`runAxe` gate (serious/critical, `<main>`-scoped); the theme is pinned via
`page.addInitScript` seeding `id.theme` before first paint.

**This is set B (HEAD / post-migration).** It is intentionally recorded RED — a red
run here is DATA, not a failure. The A-leg (pre-token worktree `14191cb85`)
comparison that decides "no NEW violations vs recorded baseline" (B ⊆ A per
route/locale/axis) is Plan 80-02's job; this section records set B so 80-02 has its
post-migration operand.

<!-- prettier-ignore-start -->
| Field | Value |
| --- | --- |
| Spec | `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` (chromium project, auto-discovered) |
| Command | `pnpm -C frontend exec playwright test qa-sweep-axe-4axis.spec.ts --project=chromium --retries=1` (`E2E_BASE_URL` unset) |
| Reference env / date / HEAD | local seeded dev vs staging Supabase / 2026-07-03 / `b5ad1ac3f` |
| Axis count | 15 routes × 2 locales × 2 themes = **60 scans** (all 15 V6_ROUTES are dual-locale) |
| Raw log | scratchpad `qa-sweep-4axis-headleg.log` (1.4m wall) |
| Tally | **41 passed / 13 failed / 6 flaky** |
<!-- prettier-ignore-end -->

### 8.1 Per-scan result matrix (one cell per scan = 60 scans)

Cell legend: `pass` · `CC` = serious `color-contrast` · `ARIA` = critical
`aria-required-parent` + `aria-required-children` · `timeout` = login
`page.waitForURL` 15s timeout (not an axe finding) · `flaky→pass` = failed first
attempt on a login timeout, passed on retry.

<!-- prettier-ignore-start -->
| Route | en · light | en · dark | ar · light | ar · dark |
| --- | --- | --- | --- | --- |
| dashboard | pass | pass | pass | pass |
| kanban | pass | pass | pass | pass |
| calendar | pass | pass | pass | pass |
| countries | **CC** | pass | **CC** | pass |
| organizations | **CC** | pass | **CC** | pass |
| persons | pass | pass | pass | pass |
| forums | pass | pass | pass | pass |
| topics | **CC** | pass | pass | pass |
| working_groups | **CC** | pass | **CC** | pass |
| engagements | **ARIA** | **ARIA** | **ARIA** | **ARIA** |
| briefs | flaky→pass | pass | **timeout** | pass |
| after_actions | pass | pass | pass | pass |
| tasks | **CC** | flaky→pass | flaky→pass | flaky→pass |
| activity | pass | pass | pass | flaky→pass |
| settings | pass | pass | flaky→pass | pass |
<!-- prettier-ignore-end -->

### 8.2 The 13 hard failures, classified

<!-- prettier-ignore-start -->
| Scan(s) | Axe rule(s) | Impact | Root-cause class | Note |
| --- | --- | --- | --- | --- |
| countries [en/ar] [light], organizations [en/ar] [light], topics [en] [light], working_groups [en/ar] [light], tasks [en] [light] (8 scans) | `color-contrast` | serious | app-bug (light-palette contrast) — NEW-vs-pre-existing TBD in 80-02 | ALL light-theme; invisible to the dark-only implicit sweep. This is the headline 4th-axis finding: the Linear light theme (derived from dark per DESIGN.md) trips WCAG AA contrast on list-route `<main>` |
| engagements [en/ar] [light] + [en/ar] [dark] (4 scans) | `aria-required-parent`, `aria-required-children` | critical | app-bug (structural ARIA nesting on the engagements list) | Fails in BOTH themes → theme-independent → almost certainly pre-existing (the existing dark-only `qa-sweep-axe` scans engagements in dark and would already trip this); confirm in 80-02 |
| briefs [ar] [light] (1 scan) | — (none) | — | test-bug (login `waitForURL` 15s timeout under 9-worker concurrency) | Not an a11y finding; a session-race timeout, same class as the 6 flakies below but it also timed out on retry |
<!-- prettier-ignore-end -->

### 8.3 The 6 flaky scans (failed first attempt, passed on retry)

All six are the same login-redirect timing flake (`page.waitForURL: Timeout
15000ms` in `loginForListPages`) under 9-worker concurrency — **test-bug**, not an
a11y finding: briefs [en] [light], settings [ar] [light], activity [ar] [dark],
tasks [en] [dark], tasks [ar] [light], tasks [ar] [dark]. Serializing the sweep
(fewer workers) or raising the login timeout would remove them; irrelevant to the
axe baseline.

### 8.4 Set B summary for 80-02

- **Genuine axe findings on HEAD (set B):** 2 rule classes — `color-contrast`
  (serious, **light-theme only**, 8 scans across countries/organizations/topics/
  working_groups/tasks list routes) and `aria-required-parent`/`-children`
  (critical, engagements list, **both themes**, 4 scans).
- **Non-axe noise:** 1 hard + 6 flaky login-timeout scans (test-bug); exclude from
  the a11y A/B comparison.
- **Distinct surface from §3–§4:** the a11y gate (§3) scans dossier **detail**
  pages (real IDs) and is green; this sweep scans the 15 v6 **route/list** `<main>`
  surfaces — so "gate green" and "sweep red" are not contradictory, they cover
  different DOM.
- **Next (Plan 80-02):** run this same spec on the pre-token worktree `14191cb85`
  (set A), same day/same staging, then decide NEW vs pre-existing per rule×route×
  axis. Expectation from the theme skew: `color-contrast` (light) is the candidate
  NEW class; `aria-required-*` (engagements, present in dark) is the candidate
  pre-existing class. Do not assume — the A-leg proves it.

---

## 9. Pre-token leg (set A) — the RECORDED pre-migration baseline (Plan 80-02)

This is the honest pre-migration operand: both suites re-run on a **git worktree
pinned to the immutable pre-token commit `14191cb85`** ("test(77-01): commit
VERIFY-01 pre-swap visual baseline", 2026-07-02 — the last commit before the
Phase-77 Linear token swap; an ancestor of HEAD). Set A is a REAL run, not an
inference (anti-laundering control T-80-04).

### 9.1 Run provenance (which tree served each leg — T-80-05 poison guard)

<!-- prettier-ignore-start -->
| Field | Value |
| --- | --- |
| Worktree | `git worktree add ../intl-pre-token 14191cb85` (detached HEAD, read-only lineage — never committed to) |
| Build | `pnpm install --frozen-lockfile` at the worktree root (lockfileVersion 9.0, pnpm 10.29.1) — resolved the historical committed lockfile, 0 new packages (T-80-SC), done in 14.7s |
| Env | gitignored `.env.test` (repo-root) + `frontend/.env.development` copied into the worktree; `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` present (login succeeded → not the "incomplete copy" error) |
| Overlay | `qa-sweep-axe-4axis.spec.ts` copied from main into the worktree (absent at `14191cb85`; test-only overlay — its helpers `qa-sweep.ts` / `v6-routes.ts` and `support/list-pages-auth.ts` all exist at `14191cb85`) |
| Poison guard | `:5173` verified DOWN before EACH leg (`lsof -ti:5173`) so Playwright's `reuseExistingServer:!CI` booted the **WORKTREE** dev server, not main's — every set-A leg was served by the `14191cb85` tree |
| Date | 2026-07-03 (**same day** as set B; see §9.4 fairness) |
| Cleanup | worktree dev server killed; `git worktree remove ../intl-pre-token --force`; `git worktree list` shows no `intl-pre-token`; main tree `git status` clean |
<!-- prettier-ignore-end -->

**Test-harness parity (the only variable is `frontend/src` app code).** Diffed
`14191cb85`..HEAD: `playwright.config.ts` (the `a11y` project + webServer),
`helpers/v6-routes.ts` (`V6_ROUTES`), `helpers/qa-sweep.ts` (`runAxe`/`settlePage`/
`waitForRouteReady`), `support/list-pages-auth.ts`, `global-setup.ts`, and **all 5
`a11y`-project specs are byte-identical**; `@playwright/test` `^1.60.0` and
`@axe-core/playwright` `^4.11.3` are identical in both trees (same browser
binaries, same axe rule engine). So A vs B isolates the Bureau→Linear migration of
`frontend/src` — nothing test- or axe-version-driven can leak into the diff.

### 9.2 Leg 1 — a11y project (5 specs) at `14191cb85`

<!-- prettier-ignore-start -->
| Field | Value |
| --- | --- |
| Command | `pnpm -C frontend exec playwright test --project=a11y --retries=1` (`E2E_BASE_URL` unset; worktree served) |
| Raw log | scratchpad `setA-a11y-14191cb85.log` (1.1m wall) |
| Tally | **85 passed / 2 flaky→pass / 10 skipped / 0 hard failed** (= 97 tests) |
| Flaky | `dossiers-a11y.spec.ts:108` collapsible-keyboard + `:307` images-have-alt-text — both `page.waitForLoadState('networkidle')` 30s timeouts that passed on retry → **test-bug** (dev-server concurrency timing), NOT an app/axe finding |
<!-- prettier-ignore-end -->

**Set A a11y gate = 0 hard failures**, identical outcome to set B (§3, 0 hard
failures). The pre-token tree ALSO passes the a11y gate cleanly — the 2 set-A flakes
are the same networkidle-timing class recorded in §5 and are excluded from the
axe baseline. Since set B's a11y-gate hard-failure set is **empty**, B ⊆ A holds
trivially on this axis regardless of set A (no a11y-project scan can be NEW-on-HEAD).

### 9.3 Leg 2 — 4-axis sweep (60 scans) at `14191cb85`

Bootstrap check: `frontend/public/bootstrap.js` at `14191cb85` DOES honor
`id.theme` (`localStorage.getItem('id.theme')||'light'`), so the theme pin is
**real** — set A light = **Bureau light**, set A dark = **Bureau dark** (only
`id.dir` defaults to `bureau`; the theme axis is measured, the palette _family_ is
the migration variable Bureau→Linear). The parallel run carried login-concurrency
`waitForURL` flake (same class as set B §8.3); a second **serialized `--workers=1`**
run of the 6 comparison-relevant routes produced flake-free axe readings that are
authoritative for the verdict.

<!-- prettier-ignore-start -->
| Field | Value |
| --- | --- |
| Command (parallel) | `pnpm -C frontend exec playwright test qa-sweep-axe-4axis.spec.ts --project=chromium --retries=1` → **32 passed / 24 failed / 4 flaky** (raw log `setA-4axis-14191cb85.log`, 1.6m) |
| Command (serialized, authoritative) | `… qa-sweep-axe-4axis.spec.ts --project=chromium --workers=1 --retries=1 -g "(tasks\|engagements\|organizations\|topics\|countries\|working_groups) \["` → **11 passed / 13 failed / 0 flaky, 0 login-timeouts** (raw log `setA-4axis-resolve.log`, 2.7m) |
| Purpose of serialized run | eliminate the login-concurrency flake so every previously login-timed-out cell (tasks[light], engagements[ar][dark]) gets a REAL axe reading — resolving indeterminacy by measurement, not inference |
<!-- prettier-ignore-end -->

**Set A 4-axis matrix (authoritative, clean serialized readings for the 6
comparison routes; parallel-run readings for the other 9, with login-timeouts
marked as test-bug not axe).** Legend: `pass` · `CC` = serious `color-contrast` ·
`ARIA` = critical `aria-required-parent`+`-children` · `t/o` = login `waitForURL`
timeout (test-bug, axe did not run — NOT an axe finding).

<!-- prettier-ignore-start -->
| Route (theme family = Bureau) | en · light | en · dark | ar · light | ar · dark | reading |
| --- | --- | --- | --- | --- | --- |
| dashboard | pass | pass | pass | **CC** | parallel |
| kanban | pass | pass | pass | pass | parallel |
| calendar | pass | pass | pass | **CC** | parallel |
| countries | **CC** | **CC** | **CC** | **CC** | serialized |
| organizations | pass | **CC** | pass | pass | serialized |
| persons | pass | pass | pass | pass | parallel |
| forums | pass | pass | pass | pass | parallel |
| topics | pass | pass | pass | pass | serialized |
| working_groups | **CC** | pass | **CC** | **CC** | serialized |
| engagements | **ARIA** | **ARIA** | **ARIA** | **ARIA** | serialized |
| briefs | t/o | t/o | t/o | pass | parallel (all test-bug) |
| after_actions | pass | pass | t/o | t/o | parallel |
| tasks | pass | pass | pass | **CC** | serialized |
| activity | t/o | **CC** | pass | **CC** | parallel |
| settings | pass | **CC** | t/o | **CC** | parallel |
<!-- prettier-ignore-end -->

**Set A genuine axe findings** (excluding all `t/o` test-bug cells): `color-contrast`
(serious) on countries (all 4 Bureau cells), working_groups (3 cells), organizations
[en][dark], tasks [ar][dark], plus the non-list dark cells dashboard/calendar/
activity/settings [dark]; and `aria-required-parent`/`-children` (critical) on
engagements (all 4 cells). Note countries/working_groups trip contrast in **both**
Bureau themes — theme-independent list-chrome contrast debt that predates the Linear
palette.

### 9.4 Same-day fairness (key_link: same staging DB, code is the only variable)

Set A (`14191cb85`) and set B (HEAD `b5ad1ac3f`) both ran **2026-07-03** against
the **same staging Supabase** (`zkrcjzdemdmwhearhfgg`) via a local dev server, with
byte-identical test harness + Playwright/axe versions (§9.1). The set-B legs were
therefore NOT re-run — the ledger's set-B date is already today, and the only
`frontend/` change since `b5ad1ac3f` is the test-only `qa-sweep-axe-4axis.spec.ts`
overlay (no `frontend/src` change). Code (Bureau→Linear) is the sole variable.

---

## 10. A/B comparison — the recorded baseline verdict + Plan 80-03 must-fix list

Classification vocabulary (exactly one per finding): **pre-existing** (in A and B —
the recorded baseline), **fixed-on-HEAD** (in A, not B — improvement, note only),
**NEW-on-HEAD** (in B, not A — migration-caused; **FIX-mandatory, may NEVER be
recorded-as-baseline** per the locked no-laundering decision).

### 10.1 Verdict

> **B ⊆ A: FALSE — 4 migration-caused (NEW-on-HEAD) `color-contrast` scans are
> present on HEAD but ABSENT at `14191cb85`.** They are enumerated in the §10.3
> must-fix list and are FIX-mandatory for Plan 80-03. All other set-B findings
> (4 `color-contrast` + 4 `aria-required-*`) are pre-existing and pass through as
> the recorded baseline.

### 10.2 Per-scan classification of every set-B genuine finding

Each set-B genuine axe finding vs the **same scan (route × locale × theme)** in set A:

<!-- prettier-ignore-start -->
| # | set-B finding (scan) | axe rule / impact | set A same-scan | Classification |
| --- | --- | --- | --- | --- |
| 1 | countries [en] [light] | color-contrast / serious | CC (Bureau light) | **pre-existing** |
| 2 | countries [ar] [light] | color-contrast / serious | CC (Bureau light) | **pre-existing** |
| 3 | working_groups [en] [light] | color-contrast / serious | CC (Bureau light) | **pre-existing** |
| 4 | working_groups [ar] [light] | color-contrast / serious | CC (Bureau light) | **pre-existing** |
| 5 | organizations [en] [light] | color-contrast / serious | **pass** (Bureau light clean) | **NEW-on-HEAD** |
| 6 | organizations [ar] [light] | color-contrast / serious | **pass** (Bureau light clean) | **NEW-on-HEAD** |
| 7 | topics [en] [light] | color-contrast / serious | **pass** (Bureau, all 4 clean) | **NEW-on-HEAD** |
| 8 | tasks [en] [light] | color-contrast / serious | **pass** (Bureau light clean, serialized) | **NEW-on-HEAD** |
| 9 | engagements [en] [light] | aria-required-parent/children / critical | ARIA | **pre-existing** |
| 10 | engagements [en] [dark] | aria-required-parent/children / critical | ARIA | **pre-existing** |
| 11 | engagements [ar] [light] | aria-required-parent/children / critical | ARIA | **pre-existing** |
| 12 | engagements [ar] [dark] | aria-required-parent/children / critical | ARIA (confirmed clean serialized) | **pre-existing** |
<!-- prettier-ignore-end -->

**fixed-on-HEAD (in A, not B — improvements, recorded for completeness, NOT
actionable):** the Bureau→Linear **dark** migration removed multiple Bureau-dark
`color-contrast` violations that HEAD no longer trips — countries [en/ar] [dark],
organizations [en] [dark], working_groups [ar] [dark], tasks [ar] [dark] (clean
serialized), plus dashboard/calendar/activity/settings [dark] (parallel run). Net
migration effect: dark improved broadly; **light regressed on 3 list routes.**

### 10.3 Plan 80-03 must-fix list (NEW-on-HEAD — FIX-mandatory, NEVER recordable)

The Linear **light** palette (derived from the dark-canonical tokens per
`frontend/DESIGN.md`) trips WCAG AA `color-contrast` (serious) on 3 list-route
`<main>` surfaces that the pre-token **Bureau light** palette rendered clean. These
are migration-caused and MUST be fixed (a token/contrast repair in the Linear light
derivation), NOT recorded:

<!-- prettier-ignore-start -->
| Must-fix item | Route `<main>` | Axe rule | Impact | Theme | Scans (locale) | Why NEW |
| --- | --- | --- | --- | --- | --- | --- |
| MF-1 | organizations (list) | color-contrast | serious | Linear light | en + ar (2) | Bureau light passed both; Linear light fails both |
| MF-2 | topics (list) | color-contrast | serious | Linear light | en (1) | Bureau passed all 4 cells; Linear light [en] fails |
| MF-3 | tasks (list) | color-contrast | serious | Linear light | en (1) | Bureau light passed (serialized clean); Linear light [en] fails |
<!-- prettier-ignore-end -->

**4 scans across 3 routes.** All serious `color-contrast` on the **Linear light**
palette only (dark passes on all three in set B). Likely a single shared list-page
`<main>` chrome token (`list-pages.css` / surface-vs-ink pairing) under-contrasting
in the light derivation — fix once, re-verify all three. Recording any of MF-1/2/3
as baseline would be laundering (they did not exist pre-migration).

### 10.4 Recorded pre-migration baseline (pre-existing — passes the B ⊆ A test)

These set-B findings ARE in set A → recorded baseline, NOT chased in Plan 80-03
(they predate the Linear migration):

- `color-contrast` (serious, Linear light): **countries** [en/ar] [light],
  **working_groups** [en/ar] [light] — Bureau light trips the same; the list-chrome
  contrast debt predates the token swap (Bureau also fails these in dark).
- `aria-required-parent` / `aria-required-children` (critical): **engagements**
  list, **all 4** [en/ar] [light/dark] — Bureau trips all 4 too; a structural
  `role`-nesting defect on the engagements list `<main>`, theme- and
  locale-independent, present in both eras. (Plan 80-03 MAY still fix it as genuine
  app debt, but it is recordable, not migration-caused.)

### 10.5 Disposition reminders carried forward (unchanged by this plan)

- **`best-practice` tag divergence (do NOT unify):** the `a11y`-project spec
  `dossiers-rtl-a11y` includes the axe `best-practice` tag; the sweep's `runAxe`
  (`helpers/qa-sweep.ts`) uses only `wcag2a/2aa/21a/21aa` (serious/critical, no
  `best-practice`). Set A and set B were both scanned with each spec's own tag set —
  the deltas above are recorded **as-is per spec**; the tag sets are deliberately
  NOT reconciled (a `best-practice`-only node is out of the sweep's serious/critical
  gate by design).
- **8 quarantined specs** (`playwright.config.ts:118-131`: editor-keyboard-nav,
  positions-keyboard-nav, positions-screen-reader-bilingual, screen-reader-en,
  screen-reader-ar, keyboard-navigation, color-contrast, wcag-aa-comprehensive-audit)
  keep their recorded quarantine disposition (issue-#31 class) — out of the gate,
  not re-included, not repaired by this plan.
- **vitest `waiting-queue-a11y` T091-07** keeps its §7 disposition: pre-existing
  local-only baseline failure; required CI `Tests (frontend)` is green; NOT chased
  in Phase 80.
- **10 `test.fixme` skips** (§6) remain the recorded app-debt baseline, unchanged.

### 10.6 Consequence for Plan 80-03 (one table to read)

Plan 80-03 reads §10.2 + §10.3 as its fix-vs-record contract: **FIX** MF-1/MF-2/MF-3
(the 4 NEW-on-HEAD light `color-contrast` scans — never record). **RECORD** the
6 pre-existing scans (countries/working_groups light contrast + engagements ARIA
×4) via the established `test.fixme(true, '80: recorded pre-migration baseline — …')`

- `TRACKED APP A11Y DEBT` convention, OR fix them as discretionary genuine debt —
  but they carry no laundering risk either way because set A proves they pre-date the
  migration.

---

## 11. Plan 80-03 execution — per-failure decision ledger (fixed | recorded)

Executed 2026-07-03 on the §1 reference environment. Every genuine hard-failure
row from §10.2 carries an explicit decision below — zero undecided rows.
Root-cause evidence was captured by re-running the failing scans with `--retries=0`
and reading the axe violation detail (not hypothesised): all 8 `color-contrast`
failures were on list-row **status chips** (`.chip-info/-danger/-ok/-warn`), and
all 4 engagements failures were `aria-required-parent`/`-children` on a
`<div role="list">` with non-`listitem` children.

### 11.1 Decision table (all 12 genuine set-B findings)

<!-- prettier-ignore-start -->
| # | Finding (scan) | axe rule / impact | §10.2 class | Decision | Rationale |
| --- | --- | --- | --- | --- | --- |
| 1 | countries [en] light | color-contrast / serious | pre-existing | **fixed** | Same `.chip` `-soft` recipe fix — cleared for free by the MF token change; discretionary per §10.6 (fixing pre-existing debt carries no laundering risk) |
| 2 | countries [ar] light | color-contrast / serious | pre-existing | **fixed** | Same shared chip recipe |
| 3 | working_groups [en] light | color-contrast / serious | pre-existing | **fixed** | Same shared chip recipe |
| 4 | working_groups [ar] light | color-contrast / serious | pre-existing | **fixed** | Same shared chip recipe |
| 5 | organizations [en] light | color-contrast / serious | **NEW-on-HEAD** | **fixed** | **MF-1** (mandatory) — chip `.chip-*` bg → AA-proven `var(--*-soft)` |
| 6 | organizations [ar] light | color-contrast / serious | **NEW-on-HEAD** | **fixed** | **MF-1** (mandatory) |
| 7 | topics [en] light | color-contrast / serious | **NEW-on-HEAD** | **fixed** | **MF-2** (mandatory) |
| 8 | tasks [en] light | color-contrast / serious | **NEW-on-HEAD** | **fixed** | **MF-3** (mandatory) |
| 9 | engagements [en] light | aria-required-parent/children / critical | pre-existing | **recorded** | Structural `role="list"` w/o `role="listitem"` children; set A trips it too; fix is a DOM/role change out of this token-fix plan's scope |
| 10 | engagements [en] dark | aria-required-parent/children / critical | pre-existing | **recorded** | Same structural defect (theme-independent) |
| 11 | engagements [ar] light | aria-required-parent/children / critical | pre-existing | **recorded** | Same structural defect (locale-independent) |
| 12 | engagements [ar] dark | aria-required-parent/children / critical | pre-existing | **recorded** | Same structural defect |
<!-- prettier-ignore-end -->

**Tally: 8 fixed (4 NEW-on-HEAD mandatory + 4 pre-existing discretionary) · 4 recorded.**
Zero `recorded` decisions on NEW-on-HEAD items (T-80-07 satisfied). The 4 recorded
rows equal the 4 `80: recorded pre-migration baseline` fixme strings in
`qa-sweep-axe-4axis.spec.ts` exactly (record-count parity).

### 11.2 The fix (MF-1/2/3, applied — clears rows 1–8)

`frontend/src/styles/list-pages.css` — the 4 semantic chips switched from an ad-hoc
`background: color-mix(in srgb, var(--<hue>) 15%, transparent)` wash (which
composited to a darker, never-contrast-verified background, e.g. danger →
`#edd6d6`, ratio 4.38:1) to the designed opaque `-soft` token used by the already
-passing `.chip-accent`:

```css
.chip-danger {
  background: var(--danger-soft);
  color: var(--danger);
}
.chip-warn {
  background: var(--warn-soft);
  color: var(--warn);
}
.chip-ok {
  background: var(--ok-soft);
  color: var(--ok);
}
.chip-info {
  background: var(--info-soft);
  color: var(--info);
}
```

- **Token(s) changed:** none — no palette LITERAL was edited. Only the CSS
  _reference_ changed (from `color-mix` to the existing `var(--*-soft)` token).
  The three byte-matched copies (`tokens/directions.ts`, `public/bootstrap.js`,
  `index.css` `:root`) are **untouched**; `scripts/check-bootstrap-parity.mjs`
  passes.
- **AA proof (both modes, from `tests/unit/design-system/contrast.test.ts` /
  DESIGN.md):** light on-soft — danger 5.25, warn 5.37, ok 5.00, info 5.08; dark
  on-soft — danger 4.73, warn 7.76, ok 4.80, info 5.81. All ≥ 4.5:1.
- **No dark regression:** the 4-axis sweep is 0 axe violations across all 30 dark
  scans (§12).
- **Pixel effect (for the 80-04 human triage):** semantic chip backgrounds render
  a touch paler (the designed soft wash vs the former 15% mix). Subtle, in-family,
  and the correct design-system rendering; flagged here per T-80-09.

### 11.3 The record (rows 9–12)

`frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` — a per-scan `RECORDED_BASELINE`
map keyed `route|locale|theme` with 4 entries (the engagements list, en/ar ×
light/dark), each carrying `test.fixme(true, '80: recorded pre-migration baseline
— …')`, plus one `TRACKED APP A11Y DEBT` block. Per-scan, never a blanket skip —
all other 56 scans stay live. Mirrors the `intake-accessibility.spec.ts` precedent
(the in-repo convention; no new allowlist file).

### 11.4 Non-axe test-infra note (not gated, not an axe finding)

The §8.2 briefs [ar] login timeout and the §8.3 flaky class are `page.waitForURL`
15s timeouts in `loginForListPages` under **high default-worker concurrency** on
this many-core Mac (the page never loads → axe never runs → not a pass or a fail of
the axe gate). CI runs `workers: 2` and is unaffected; the authoritative §12 proof
was therefore run at `--workers=2` (CI parity), which is anti-laundering (lower
concurrency yields **more** real axe readings, never fewer — the same rationale as
the §9.3 serialized set-A run). No `frontend/src` or shared-login change was made
for this test-infra flake (out of scope; deterministic-wait discipline preserved).

---

## 12. Gate green — final reference-env proof (Plan 80-03 close)

Reference env (§1): local seeded dev on `:5173` serving **main**, `E2E_BASE_URL`
unset, staging Supabase data. Date **2026-07-03**, HEAD after the two 80-03 code
commits (`556f20705` fix + `b3283a9c9` test).

<!-- prettier-ignore-start -->
| # | Command | Result | Exit |
| --- | --- | --- | --- |
| 1 | `pnpm -C frontend exec playwright test --project=a11y --retries=2` | **87 passed / 10 skipped / 0 failed** (97 tests) | **0** |
| 2 | `pnpm -C frontend exec playwright test qa-sweep-axe-4axis.spec.ts --project=chromium --workers=2 --retries=1` | **56 passed / 4 skipped / 0 failed**, `serious/critical a11y violations: 0` | **0** |
| — | `grep -q "playwright test --project=a11y" frontend/package.json` (dead `test:a11y` repointed) | match | 0 |
| — | `node scripts/check-bootstrap-parity.mjs` | byte-match OK (no palette literal changed) | 0 |
| — | `pnpm -C frontend type-check` · `pnpm -C frontend lint` | both clean | 0 |
<!-- prettier-ignore-end -->

The 4 `qa-sweep-axe-4axis` skips are exactly the recorded engagements scans
(§11.3). Command 2's default-worker variant reds only on the §11.4 login-timeout
flake (0 axe findings in that run too); the CI-parity `--workers=2` measurement is
the reproducible authoritative reading.

**CI follow-on:** the CI job `Accessibility Tests (RTL + WCAG AA)`
(`.github/workflows/ci.yml`, `--project=a11y`) greens itself on the next push/PR —
its prior redness was assertion-level, now resolved (0 hard failures on this tree).
The CI job was **not** modified (it already exists and needs no change); the 4-axis
sweep is a LOCAL baseline vehicle (60 scans exceed the CI smoke budget) and is not
wired into CI. VERIFY-02 is locally green with a fully honest paper trail.
