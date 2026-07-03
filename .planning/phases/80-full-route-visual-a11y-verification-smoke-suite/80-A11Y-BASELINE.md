# Phase 80-01 — VERIFY-02 A11y Baseline (recorded characterization)

**Purpose:** The single recorded, honest a11y baseline for VERIFY-02. Every
fix-vs-record decision in Plan 80-03 derives from this document. No baseline
laundering: the failure set is characterized on ONE stated reference environment,
with date + commit SHA, and every classification is gated behind proven-live
fixtures.

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

## 8. HEAD leg (set B) — 4-axis axe sweep

_Recorded by Task 2 below (spec `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts`)._
