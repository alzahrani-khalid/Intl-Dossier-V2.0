# Phase 80: Full-Route Visual + A11y Verification & Smoke Suite - Research

**Researched:** 2026-07-03
**Domain:** Playwright visual regression + axe-core a11y verification + RTL smoke CI hardening (no new product features)
**Confidence:** HIGH (nearly every claim verified against the live repo, git history, or live GitHub CI runs)

## Summary

Phase 80 is a verification/CI-hardening phase with three deliverables: (1) VERIFY-01 — re-compare the 43 committed pre-token visual baselines (10 Playwright specs, commit `14191cb85`) against the Linear-migrated tree, with a **mandatory human diff-triage checkpoint**; (2) VERIFY-02 — an honest, recorded a11y baseline plus a 4-axis axe sweep, bringing the currently-red `Accessibility Tests (RTL + WCAG AA)` CI job to green via per-failure fix-vs-record decisions (no laundering); (3) FOUC-02 — RTL portal + Calendar/Pagination/Sidebar smokes wired into a **new, separate, green-from-birth CI job** that gates the build.

The infrastructure is in far better shape than the phase description implies. The visual harness is fully operational and was exercised end-to-end on this exact Mac one day ago (77-01 capture + replay, 43/43). The portal RTL assertions FOUC-02 needs **already exist** in `frontend/tests/e2e/direction-portals.spec.ts` (5 tests incl. the exact `inset-inline-end: 0px` + `rect.left === 0` Sheet-drawer edge proof) and `calendar-rtl.spec.ts` — they are simply wired into **no CI job**. The main genuine work is: the human-gated visual triage, the per-failure a11y ledger, ~3 new smoke tests (Popover, Pagination, Sidebar), one new ci.yml job, and the branch-protection required-check addition.

**Primary recommendation:** Run everything on the local seeded dev machine (Phase-46/77-01 precedent) as the reference environment; keep the new CI smoke job on the `ci.yml` local-dev-server pattern (like `test-a11y`), never the `e2e.yml` deployed-app pattern (that whole class is red — issue #31); zero new npm packages are needed.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Human visual-diff review is REQUIRED (autonomous:false checkpoint)**

- VERIFY-01 mandates that **every visual diff** against the Phase 77 pre-token baseline is either an **intended Linear change (human-reviewed)** or fixed — no unexplained regressions. The diff-triage review is a **human checkpoint** (same class as the 77-01 baseline capture): the planner must mark that task `autonomous:false`, and the overseer/user adjudicates intended-Linear vs regression. Do NOT auto-approve visual diffs.

**Visual re-compare (VERIFY-01)**

- Re-compare all baselined Playwright surfaces (EN+AR × dark+light, the ~15–20 route/widget specs baselined in Phase 77's 77-01 gate) against that captured pre-token baseline. Any coverage expansion beyond today's specs is called out explicitly, never silently assumed. The Phase 77 baseline is the authoritative reference (commit from the 77-01 approval).

**Axe-core a11y sweep (VERIFY-02)**

- Run axe-core across all four axes with **no new violations vs a RECORDED pre-migration baseline**. The a11y CI job is currently red on `main` (2 hard failures — engagement ARIA + intake landmark/h1 — plus 8 flaky specs, issue #31 class). These must be **fixed or explicitly recorded as the baseline** BEFORE comparison (no baseline laundering). Decide fix-vs-record per failure; record the decision.

**CI smoke gating (FOUC-02)**

- CI runs portal-animation RTL smoke tests (Popover/Tooltip/Dropdown/Sheet/dossier drawer open from the correct inline-start edge in AR) + Calendar/Pagination/Sidebar RTL smoke tests, and they **gate the build**. This first requires bringing the currently-red visual/a11y verification jobs to green, OR scoping the new smokes as a separate green-from-birth CI job (planner's choice — the separate-job path avoids coupling to the pre-existing red).

### Claude's Discretion

Fix-vs-record calls per a11y failure, separate-job vs fix-existing for the smoke gate, and test structure are the planner's/executor's discretion — provided no baseline is laundered and the human diff-review gate is preserved.

### Deferred Ideas (OUT OF SCOPE)

None — final verification phase; scope is fully prescribed by VERIFY-01/02 + FOUC-02. The human diff-review is retained as a checkpoint, not deferred.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                                                                               | Research Support                                                                                                                                                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VERIFY-01 | All Playwright-baselined surfaces (43 tests / 10 specs, EN+AR, theme-pinned light) re-compared post-migration against the 77-01 pre-token baseline; expansion called out, never assumed   | §VERIFY-01 below: baseline commit `14191cb85` located and verified untouched; replay mechanics, seed/clock realignment landmine, human-checkpoint order, and recapture-commit flow all specified                                                                                                      |
| VERIFY-02 | axe-core sweep passes on all 4 axes (dark/light × LTR/RTL) with no NEW violations vs a RECORDED pre-migration baseline; the red a11y CI job's failures fixed or explicitly recorded first | §VERIFY-02 below: live CI failure list extracted (9 hard / 5 flaky / 10 skipped / 73 passed), in-repo `test.fixme` recording precedent identified, pre-token worktree A/B method specified, 4-axis sweep vehicle (`qa-sweep-axe` + theme pin) specified                                               |
| FOUC-02   | Portal-animation (Popover/Tooltip/Dropdown/Sheet/dossier drawer) + Calendar/Pagination/Sidebar RTL smokes run in CI and gate the build                                                    | §FOUC-02 below: existing `direction-portals.spec.ts` (5 tests) + `calendar-rtl.spec.ts` cover most portals but are in NO CI job; 3 gaps (Popover/Pagination/Sidebar) identified with concrete assertion patterns; separate green-from-birth ci.yml job recommended; required-check reality documented |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives that bind this phase (root `/CLAUDE.md` + `frontend/CLAUDE.md`):

- **GSD workflow enforcement** — file changes go through GSD commands (this phase is planned work; fine).
- **If a11y "fix" decisions touch `frontend/src`:** all colors via `var(--*)` tokens (no raw hex, no Tailwind color literals); logical properties only (`ms-*`, `ps-*`, `text-start` — ESLint errors on physical); borders `1px solid var(--line)`; radii 6/8/12 tokens; no emoji/marketing voice in copy; ESLint per-directory filename case is CI-blocking.
- **Design source of truth is `frontend/DESIGN.md` (Linear)** — intended-Linear classification during diff review should reference it.
- **Supabase changes via Supabase MCP** (the dashboard-widgets seed re-refresh is a data-only UPDATE — orchestrator applies it; executors have no MCP).
- **Bundle Size Check is a REQUIRED CI gate** — Phase 80 adds test files + workflow YAML (not bundled), so risk is nil unless a11y fixes add src imports; keep fixes surgical.
- **i18n**: static-bundled in `src/i18n/index.ts`; unregistered namespaces silently fall back to EN in BOTH languages — relevant if any fix adds strings.
- **Pre-commit hook** runs `pnpm build` + lint-staged prettier on every commit (slow commits; `.planning` md tables can get churned — use prettier-ignore fences if needed).
- **Testing rules (user global)**: Playwright for E2E; screenshot key breakpoints; deterministic waits over timeouts (the existing harness already embodies this).

## Architectural Responsibility Map

| Capability                            | Primary Tier                                                | Secondary Tier                     | Rationale                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual baseline replay + recapture    | Local dev machine (Playwright + `pnpm dev` :5173)           | Staging Supabase (data)            | 77-01 precedent; the deployed-app CI job (`e2e.yml`) tests stale code and cannot represent v8.0 (local main is 142 commits ahead of origin) |
| Visual diff adjudication              | Human (checkpoint)                                          | Playwright HTML report artifacts   | Locked decision — `autonomous:false`                                                                                                        |
| A11y baseline recording               | Test specs (`test.fixme` + rationale) + phase evidence doc  | `.planning/phases/80-*/` ledger    | In-repo precedent (`TRACKED APP A11Y DEBT` comments); durable + diff-reviewable                                                             |
| 4-axis axe sweep                      | Playwright spec layer (`qa-sweep-axe` pattern)              | `helpers/qa-sweep.ts` (`runAxe`)   | Existing serious/critical gate helper; spec header forbids inline re-implementation                                                         |
| RTL portal/component smokes           | Playwright spec layer (frontend config, `chromium` project) | New `ci.yml` job                   | DOM/computed-style assertions (no screenshots → no platform-suffix trap)                                                                    |
| Build gating                          | GitHub branch protection (required status contexts)         | `ci.yml` job                       | Only required contexts actually block merges; workflow failure alone is advisory                                                            |
| Seed data refresh (dashboard widgets) | Supabase MCP (orchestrator/human)                           | `77-BASELINE-VALIDATION.md` §2 SQL | Executor agents have no MCP access (established project fact)                                                                               |

## Standard Stack

### Core (all already installed — zero new packages)

| Library                | Version (installed) | Registry latest | Purpose                                                  | Why Standard                                                                                                        |
| ---------------------- | ------------------- | --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@playwright/test`     | 1.60.0              | 1.61.1          | Visual replay (`toHaveScreenshot`), smokes, a11y project | Entire harness built on it; 43-baseline replay proven 2026-07-02 on this machine `[VERIFIED: pnpm list + npm view]` |
| `@axe-core/playwright` | 4.11.3              | 4.12.1          | `AxeBuilder` scans (gate + sweep)                        | Used by all 5 gated a11y specs + `helpers/qa-sweep.ts` `[VERIFIED: pnpm list + npm view]`                           |
| `jest-axe`             | 10.0.0              | —               | vitest-level axe (e.g. `SearchableSelect.a11y.test.tsx`) | Runs inside the REQUIRED `Tests (frontend)` check `[VERIFIED: pnpm list]`                                           |
| `vitest`               | 4.1.7               | —               | Unit suites (design-system, bootstrap parity tests)      | Existing `[VERIFIED: pnpm list]`                                                                                    |

**No version bumps are required or recommended** — Playwright snapshot rendering is version-sensitive; bumping mid-verification would invalidate the like-for-like comparison. Stay pinned. `[VERIFIED: installed versions run the 77-01 capture]`

### Installation

```bash
# Nothing. Do not install anything for this phase.
```

## Package Legitimacy Audit

**This phase installs no external packages.** All tooling (Playwright 1.60.0, @axe-core/playwright 4.11.3, jest-axe 10.0.0, vitest 4.1.7, chromium-1223/1228 browsers) is already installed and was exercised in Phases 43–79. slopcheck run: not applicable.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## The Harness Map (system architecture)

```
                         ┌─────────────────────────────────────────────────────┐
                         │  LOCAL REFERENCE ENV (this Mac — Phase-46/77-01)     │
                         │  pnpm dev :5173  ←── staging Supabase (data)         │
                         │  .env.test (TEST_USER_EMAIL/PASSWORD)                │
                         └──────────────────────┬──────────────────────────────┘
                                                │ frontend/playwright.config.ts
                    ┌───────────────────────────┼───────────────────────────────┐
                    ▼                           ▼                               ▼
        VERIFY-01 (visual)            VERIFY-02 (a11y)                FOUC-02 (RTL smokes)
   10 specs / 43 tests            --project=a11y (5 specs/97 tests)   direction-portals.spec.ts (5)
   *-visual.spec.ts               + qa-sweep-axe (15 routes × en/ar)  calendar-rtl.spec.ts (1)
        │ replay (no --update)         │ + theme axis (NEW)           + NEW popover/pagination/sidebar
        ▼                              ▼                                    │
   test-results/ diff PNGs        violation sets A(pre)/B(post)             ▼
   + HTML report                  via git worktree @14191cb85         NEW ci.yml job "RTL smokes"
        │                              │                              (local dev-server pattern,
        ▼                              ▼                               like test-a11y job)
   HUMAN TRIAGE (autonomous:false)  fix-vs-record ledger                    │
        │ approved                  (test.fixme + 80-A11Y-BASELINE.md)      ▼
        ▼                              │                              branch protection:
   --update-snapshots recapture        ▼                              add required context
   → commit Linear baselines      a11y CI job green                   (admin/human action)
```

CI workflows today `[VERIFIED: .github/workflows/ + gh api]`:

| Workflow | Job                                                                                   | Runs what                                                                                                                                                   | Env                                                            | Status on main                                                                                      | Required? |
| -------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------- |
| ci.yml   | Lint                                                                                  | eslint + `check-i18n-namespaces` + `check-duplicate-rtl.mjs` (SRTL-03) + `check-bootstrap-parity.mjs` (FOUC-01), each with positive-failure fixture asserts | static                                                         | green                                                                                               | **YES**   |
| ci.yml   | Bundle Size Check (size-limit)                                                        | build + size-limit                                                                                                                                          | static                                                         | green                                                                                               | **YES**   |
| ci.yml   | Tests (frontend/backend), type-check, Design Token Check, react-i18next Factory Check | vitest/tsc/eslint fixtures                                                                                                                                  | static                                                         | green                                                                                               | **YES**   |
| ci.yml   | Security Scan                                                                         | Trivy + upload-sarif                                                                                                                                        | static                                                         | **red on push events only** (Upload step; PASSES on pull_request events — verified run 28574274067) | **YES**   |
| ci.yml   | Accessibility Tests (RTL + WCAG AA)                                                   | `playwright test --project=a11y` in `frontend/`                                                                                                             | **local dev server** + staging Supabase (E2E_ANALYST creds)    | **red** — 9 failed / 5 flaky / 10 skipped / 73 passed (run 28574521475)                             | no        |
| ci.yml   | RTL + Responsive Tests                                                                | `dossier-rtl-mobile.spec.ts`                                                                                                                                | local dev server                                               | red                                                                                                 | no        |
| ci.yml   | E2E Tests                                                                             | root config `pnpm run test:e2e`                                                                                                                             | local + postgres service                                       | red                                                                                                 | no        |
| e2e.yml  | E2E shards / QA Sweep / **Visual Regression (Phase 46)**                              | root + frontend specs incl. `test:qa-sweep`; Visual Regression runs on **macos-latest** (darwin-named PNGs)                                                 | **E2E_BASE_URL = deployed app** (stale code — issue #31 class) | all red                                                                                             | no        |

**Required status contexts on main (verbatim, via `gh api repos/:owner/:repo/branches/main/protection`):** `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, `Design Token Check`, `react-i18next Factory Check`. **None of the visual/a11y/E2E jobs are required.** `[VERIFIED: gh api]`

---

## VERIFY-01 — Visual re-compare vs the Phase 77 baseline

### Concrete assets

- **Baseline commit:** `14191cb85` — `test(77-01): commit VERIFY-01 pre-swap visual baseline + capture log`. The 43 PNGs are **untouched since** (git log on all `*-snapshots/` dirs shows nothing newer) and sit in the working tree right now. `[VERIFIED: git log]`
- **Capture log:** `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` — §3 PNG inventory, §5 coverage statement, §6 deviations (FROZEN_TIME + pathTemplate fixes). The authoritative scope document.
- **The 10 baselined specs (43 tests, confirmed via `playwright test --list`):** `list-pages-visual` (14: 7 dossier/engagement list routes × en/ar), `dashboard-widgets-visual` (8 widgets, custom `pathTemplate` → `frontend/tests/e2e/__snapshots__/dashboard-widgets/`, own project `chromium-dashboard-widgets`, `maxDiffPixelRatio 0.02`), `kanban-visual` (4), `tasks-tab-visual` (4), `settings-page-visual` (3), `tasks-page-visual`/`activity-page-visual`/`after-actions-page-visual`/`briefs-page-visual` (2 each, en/ar), `dossier-drawer-visual` (2, ltr/ar `.drawer` element shots). All under `frontend/tests/e2e/`. `[VERIFIED: --list + git ls-files]`
- **Theme pinning:** every spec pins `id.theme='light'` via `addInitScript` (77-01 Task 1, commit `dfef0dd3`) — so the re-compare is **Bureau-light vs Linear-light, like-for-like**; the Phase-77 dark default cannot skew it. `[VERIFIED: spec source]`
- **Explicitly excluded (do NOT silently expand):** `calendar-visual.spec.ts` + `dashboard-visual.spec.ts` (0 committed PNGs — non-baselined stubs), `tests/visual/theme-visual.spec.ts` (stale legacy; not even discovered — frontend config `testMatch` only covers `e2e/**` + `accessibility/**`). `qa-sweep-focus-outline.spec.ts-snapshots/` holds **2 Linear PNGs already recaptured in 77-07** (commit `229a39c8a`; the 8 old direction-matrix shots were deleted — spec header says Phase 80 treats that surface as "structurally replaced (intended change)", pre-swap PNGs remain in git history). It is NOT part of this re-compare. `[VERIFIED: spec headers + git log]`
- **Thresholds:** `frontend/playwright.config.ts` `expect.toHaveScreenshot`: `maxDiffPixelRatio 0.01` (0.02 for widgets + per-shot overrides), `threshold 0.2`, `animations: 'disabled'`, `caret: 'hide'`, `maxDiffPixels: 100`; `reducedMotion: 'reduce'` project-wide.

### Recommended approach (ordered — order IS the anti-laundering control)

1. **Pre-flight (autonomous):** re-refresh the 3 deterministic `b0000002-*` `engagement_dossiers` rows on staging (dates-only SQL, verbatim in `77-BASELINE-VALIDATION.md` §2 — today-anchored `NOW()` intervals) **via Supabase MCP (orchestrator applies; executor cannot)**, and realign `FROZEN_TIME` in `dashboard-widgets-visual.spec.ts` (currently `2026-07-02T12:00:00Z`) to the run date. Without both, WeekAhead/VipVisits render empty or partially (server filters by real `NOW()`, client buckets by the frozen clock) and the capture fails — the exact 46-era fragility documented in STATE.md.
2. **Replay (autonomous):** with `E2E_BASE_URL` unset (Playwright auto-starts `pnpm dev` on :5173):
   ```bash
   pnpm -C frontend exec playwright test \
     list-pages-visual.spec.ts dashboard-widgets-visual.spec.ts kanban-visual.spec.ts \
     tasks-tab-visual.spec.ts tasks-page-visual.spec.ts activity-page-visual.spec.ts \
     after-actions-page-visual.spec.ts briefs-page-visual.spec.ts settings-page-visual.spec.ts \
     dossier-drawer-visual.spec.ts --retries=0 --reporter=html
   ```
   Expect **mass failures — that is the mechanism**: every failing shot emits `*-expected.png` / `*-actual.png` / `*-diff.png` under `frontend/test-results/` plus the HTML report with side-by-side viewers. Use `--retries=0` here (retries only churn diff artifacts; the shell-flake class is irrelevant when everything diffs anyway).
3. **Human triage (autonomous:false — MANDATED):** the user reviews the report/diff artifacts and classifies each of the 43 surfaces: `intended-Linear` vs `regression`. Record the ledger (per-shot verdict table) in a phase doc, e.g. `.planning/phases/80-.../80-VISUAL-RECOMPARE.md`, mirroring the 77-BASELINE-VALIDATION format. Date-string/dynamic-row diffs in dashboard-widgets are a third, pre-documented class: `dynamic content, not theme` (77-01 §1 used the same discipline).
4. **Fix regressions (autonomous, if any):** each `regression` verdict becomes a fix task; re-run the affected spec against the OLD baseline classifying again — or fold obvious token bugs back through the normal design-token rules.
5. **Recapture + commit (autonomous, AFTER approval):** `--update-snapshots` on the 10 specs, then replay clean (the 77-01 "replay proof" discipline: update-pass PNGs byte-stable under a no-update replay, `--retries=2` CI parity here), then commit the new Linear baseline PNGs + the triage ledger + realigned FROZEN_TIME as the new baseline lineage. The Bureau baselines remain recoverable at `14191cb85`.

### Landmines

- **Do not run `--update-snapshots` before the human review.** That is baseline laundering by definition — the diff evidence is destroyed. The replay→review→update order is the whole control.
- **dashboard-widgets seed/clock coupling:** re-refresh + FROZEN_TIME realignment produce **date-text diffs vs the baseline PNGs** (baseline shows Jul-2-relative dates). These are unavoidable; pre-brief the reviewer that widget date strings are the documented dynamic class. The alternative (not realigning) is worse: empty widgets → `.week-row` never appears → capture crashes (proven in 77-01).
- **`E2E_BASE_URL` must be unset locally.** If it leaks from the shell, tests hit whatever it points at instead of auto-starting dev.
- **The `Visual Regression (Phase 46)` job in `e2e.yml` cannot participate.** It runs the widget/list/drawer specs against `E2E_BASE_URL` = the deployed app — which is pre-Linear and thousands of commits stale (issue #31). It will remain red until a deploy catches up; explicitly out of Phase 80's scope to repair (document this in the ledger, don't chase it).
- **Snapshot platform suffix:** all default-path PNGs are `-chromium-darwin`-named; recapture must happen on this Mac (or another darwin machine). The dashboard-widgets set uses the bare-name `pathTemplate` (no suffix) — do not "fix" that; 77-01 §6 pinned it deliberately.
- **macOS runner note:** the e2e.yml visual job targets `macos-latest` precisely because of the darwin naming — any future CI-side recapture idea inherits that constraint. Not needed this phase.

### Task autonomy

| Step                                                  | autonomous                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Seed re-refresh + FROZEN_TIME realign                 | true (orchestrator applies SQL via MCP)                         |
| Replay + artifact collection                          | true                                                            |
| **Diff triage / intended-vs-regression adjudication** | **false (locked decision — checkpoint:human-verify, blocking)** |
| Regression fixes                                      | true                                                            |
| Recapture + baseline commit                           | true (but only reachable after the approved checkpoint)         |

---

## VERIFY-02 — axe-core sweep vs a RECORDED pre-migration baseline

### Concrete assets

- **CI job:** `ci.yml` → `test-a11y` ("Accessibility Tests (RTL + WCAG AA)") — runs `pnpm exec playwright test --project=a11y --reporter=html` in `frontend/`, **local dev server** (no `E2E_BASE_URL`) against staging Supabase with `TEST_USER_EMAIL=${{ secrets.E2E_ANALYST_EMAIL }}`. NOT a required check. `[VERIFIED: ci.yml]`
- **The `a11y` Playwright project** (`frontend/playwright.config.ts:132-142`) gates exactly 5 specs → **97 tests**: `tests/a11y/dossiers-a11y.spec.ts`, `dossiers-rtl-a11y.spec.ts`, `positions-a11y-en.spec.ts`, `positions-a11y-ar.spec.ts`, `intake-accessibility.spec.ts`. `[VERIFIED: config + --list]`
- **The 8 quarantined specs** (config comment, lines ~120-131): `editor-keyboard-nav`, `positions-keyboard-nav`, `positions-screen-reader-bilingual`, `screen-reader-en`, `screen-reader-ar`, `keyboard-navigation`, `color-contrast`, `wcag-aa-comprehensive-audit` — **these are the "8 flaky specs, issue #31 class"** from REQUIREMENTS: shared stale-login root cause + genuine app debt, deliberately out of the gate, with the repair recipe documented in the comment. They are already "recorded" by quarantine; re-including them is optional discretionary scope (the comment warns even stable `focus-indicators` flaked two `networkidle` waits when added — treat re-inclusion as risk, not free coverage).
- **Live CI reality on main** (run `28574521475`, 2026-07-02): **9 failed / 5 flaky / 10 skipped / 73 passed**. Failed: `dossiers-rtl-a11y` country/organization/**engagement**/forum `T074-*-aria` + organization/forum `T074-*-headings`; `intake-accessibility:54` keyboard-nav; `positions-a11y-ar:75` + `positions-a11y-en:74` keyboard-nav. Flaky (passed on retry — these do NOT fail the job): country headings, person ARIA, working_group ARIA+headings, `positions-a11y-en:98` **landmark/single-h1**. The 10 skips are existing `test.fixme` recorded debt. `[VERIFIED: gh run log]`
- **⚠ The REQUIREMENTS characterization ("2 hard: engagement ARIA + intake landmark/h1") is stale/environment-sensitive** — the live in-gate failure set is broader and shifts between runs (data-dependent DOM assertions + `networkidle` waits + staging data drift). Plan for **per-failure characterization on ONE reference environment (local seeded dev)**, not for a fixed count of 2.
- **What the failing assertions actually check** (`dossiers-rtl-a11y.spec.ts:227/288`): `main` landmark present, `<5` unlabeled buttons/links, `h1Count >= 1` — DOM-structural, against **real staging dossier IDs** from `frontend/tests/fixtures/dossier-fixtures.ts` (`testDossierIds`, e.g. engagement `b0000002-0000-0000-0000-000000000003`). A missing/renamed staging row turns a "pass" into a 404-page scan.
- **The established honest-recording mechanism:** `test.fixme(true, 'reason')` + a `// TRACKED APP A11Y DEBT: …` comment — already used 10× across `intake-accessibility` (heading-skip h1→h3, button-name/aria-prohibited-attr/target-size debt) and `positions-a11y-ar` (rich-text editor debt). **This is the "record as baseline" pattern; there is no separate allowlist file.** `[VERIFIED: grep]`
- **4-axis sweep vehicle:** `frontend/tests/e2e/qa-sweep-axe.spec.ts` — 15 routes (`helpers/v6-routes.ts` `V6_ROUTES`, single source of truth) × en/ar, `runAxe` from `helpers/qa-sweep.ts` (AxeBuilder, wcag2a/2aa/21a/21aa tags, serious/critical filter, scoped to `<main>`). Currently theme-implicit → post-77 it scans **dark only**. `[VERIFIED: spec + helper source]`
- **Theme pinning options (both proven in-repo):** `addInitScript` seeding `localStorage['id.theme']` (visual-spec pattern) or the `window.__design.setMode` hatch (DEV/test-gated in `DesignProvider.tsx:317`; used by `qa-sweep-focus-outline`).
- **Broken script (hygiene):** `frontend/package.json` `test:a11y: vitest run --config vitest.a11y.config.ts` — **that config file does not exist**; the script is dead. The real a11y gate is the Playwright project. Fix or delete the script while touching this area. `[VERIFIED: ls]`

### Recommended approach

1. **Characterize on the reference env (autonomous):** run `pnpm -C frontend exec playwright test --project=a11y` locally; list every hard failure with its assertion and root-cause class (app bug / test bug / data drift).
2. **Record the pre-migration baseline honestly (autonomous):** v8.0 is entirely local (main is 142 commits ahead of origin `[VERIFIED: git rev-list]`), so the pre-token tree is trivially checkable:
   ```bash
   git worktree add ../intl-pre-token 14191cb85
   cd ../intl-pre-token && pnpm install --frozen-lockfile
   # same-day, same staging DB → code is the only variable
   pnpm -C frontend exec playwright test --project=a11y --reporter=json > pre-token-a11y.json
   ```
   Run the SAME suite on HEAD. Violation/failure set A (pre) vs B (post): **"no new violations" = B ⊆ A per test/route/axis.** Commit both result summaries into `.planning/phases/80-.../80-A11Y-BASELINE.md` — that document IS the recorded baseline. (Fallback if the worktree A/B proves impractical: per-failure git/CI-history proof that each failure predates Phase 77 — e.g. the failure classes already appear in requirement text dated 2026-07-01, before 77 executed. Weaker; use only if needed.)
3. **Fix-vs-record per failure (autonomous, decisions logged):** for each in-gate hard failure, either fix the app/test or add `test.fixme(true, '80: recorded pre-migration baseline — <root cause>')` with a `TRACKED APP A11Y DEBT` comment, exactly matching the existing precedent. Classification hints already known:
   - `intake` heading-skip h1→h3: already fixme'd (real structural debt — leave recorded).
   - `positions-en/ar` + `intake` keyboard-nav "Tab lands on interactive": likely first-tab focus landing on a non-interactive wrapper — may be a small real fix (tabindex/skip-link) or a stale assertion; decide on local evidence.
   - `dossiers-rtl-a11y` engagement/forum/org ARIA + headings: verify the staging fixture rows still exist first (data drift mimics a11y failure); then unlabeled-button counts are usually icon-button `aria-label` gaps — genuine, small fixes.
   - Root `tests/e2e/ar-smoke/login.ar.spec.ts` (`/login?lang=ar` renders ltr, issue #31 item 3): **test bug, not app bug** — the i18n detector reads `?lng=` (i18next default `lookupQuerystring`; `src/i18n/index.ts:554` sets detector order but no custom querystring key). Out of the a11y gate but worth recording the classification since issue #31 flags it as "possible real RTL bug".
   - vitest `waiting-queue-a11y` T091-07: pre-existing local-only baseline failure (CI `Tests (frontend)` is green) — do not chase.
4. **4-axis sweep (autonomous):** extend `qa-sweep-axe.spec.ts` (or add a sibling `qa-sweep-axe-4axis.spec.ts`) with a theme dimension: 15 routes × {en, ar} × {light, dark} = 60 scans, `runAxe` unchanged. This is **required by VERIFY-02's "all four axes"** — an explicit, called-out extension, not silent expansion (the no-expansion clause binds VERIFY-01's visual baselines). Run it on the reference env for the baseline A/B; wiring it into CI is optional (it inherits qa-sweep's deployed-app red if put in e2e.yml — keep it local/new-job only).
5. **Green the a11y job (autonomous):** after fixes/records land, `--project=a11y` passes locally; the CI job follows on the next push (flaky-passes don't fail runs; CI `retries: 2`).

### Landmines

- **No laundering:** a `test.fixme` without a root-cause rationale, or bulk-fixme-ing everything to go green, violates the locked decision. Every record needs the comment + ledger entry.
- **Environment split-brain:** deciding fix-vs-record from CI logs while verifying on local (or vice versa) produces contradictory ledgers. One reference env (local), stated in the ledger.
- **Staging data drift:** `testDossierIds` rows are load-bearing. Verify each of the 6 IDs still resolves (simple authenticated fetch or MCP `select`) BEFORE classifying failures.
- **`best-practice` tag divergence:** `dossiers-rtl-a11y` includes the `best-practice` axe tag; `qa-sweep-axe`/`runAxe` does not. Don't "unify" — record deltas per-spec as-is.
- **Do not repair the 8 quarantined specs as a side quest** — that is the documented issue-#31-class swamp; the quarantine comment is the recorded disposition. Only touch if the planner explicitly budgets it.

### Task autonomy

All VERIFY-02 tasks can run **autonomous:true** (fix-vs-record is explicitly Claude's discretion) — provided the decisions ledger (`80-A11Y-BASELINE.md`) is committed evidence. If any fix requires ambiguous UX judgment (e.g. renaming a visible heading), flag it in the ledger rather than checkpointing.

---

## FOUC-02 — Portal + component RTL smokes gating CI

### Concrete assets (what already exists)

- **`frontend/tests/e2e/direction-portals.spec.ts`** — 5 tests (Phase 76, RTLB-01/02): topbar `<html>` dir+lang one-frame flip; dropdown portal open-before-toggle same-frame flip; **dropdown + Sheet dossier-drawer edge-correct in AR** — the exact pattern FOUC-02 asks for:
  ```ts
  // Case 3 (verbatim, proven green in Phase 76):
  const styles = await page.locator('.drawer').evaluate((el) => {
    const computed = getComputedStyle(el as HTMLElement)
    const rect = el.getBoundingClientRect()
    return { insetInlineEnd: computed.insetInlineEnd, rectLeft: rect.left, dir: computed.direction }
  })
  expect(styles.dir).toBe('rtl')
  expect(styles.insetInlineEnd).toBe('0px') // logical end → physical LEFT in RTL
  expect(Math.round(styles.rectLeft)).toBe(0)
  ```
  plus cold-load `?lng=ar` beats seeded `id.locale=en`, and Tooltip portal RTL. **Wired into NO CI job.** `[VERIFIED: spec source + workflow grep]`
- **`frontend/tests/e2e/calendar-rtl.spec.ts`** — 1 test: `/calendar` AR month grid (`.cal-dow` ×7 Arabic labels, `.cal-d` Arabic-Indic digits, zero Western digits). **Not in CI**, and **date-sensitive**: renders `CalendarEmptyWizard` when the CURRENT month has zero `calendar_entries`; kept green by 3 `SRTL-02 regression seed` rows dated July 2026 (76-SRTL02-VERIFICATION §1) — **goes red in August as-is**.
- **`76-SRTL02-VERIFICATION.md`** — the SRTL-02 human-approved evidence and the live-component mapping: pagination's **sole live consumer is `/users` (admin-gated)**; the live sidebar is the bespoke `layout/Sidebar.tsx` (shadcn `ui/sidebar.tsx` is NOT mounted); `ui/calendar.tsx` (react-day-picker) lives inside the **date-picker popovers of ~15 forms**, not `/calendar`.
- **Sheet slide classes are logical-paired** (`ui/sheet.tsx:39-44`): `end`/`start` positioning + `ltr:`/`rtl:` paired `slide-in-from-*` variants — so a resting-edge + `direction` assertion covers the "animates from the correct edge" guarantee deterministically (the project runs `reducedMotion: 'reduce'` and the smokes should assert position, never animation frames).
- **Already-gating guards to keep green:** `scripts/check-duplicate-rtl.mjs` (SRTL-03) + `scripts/check-bootstrap-parity.mjs` (FOUC-01) both run inside the REQUIRED `Lint` job with positive-failure fixture asserts. FOUC-02 adds to this family; it does not modify them. (Open P76 advisory LO-01 — empty-root guard for check-duplicate-rtl — is optional hygiene, not FOUC-02 scope.)

### Coverage gap analysis (requirement → existing → to build)

| FOUC-02 item                              | Existing automated coverage                                 | Gap to build                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dropdown opens inline-start-correct in AR | direction-portals Cases 2+3                                 | none — wire into CI                                                                                                                                                                                                                                                                                                                                                                                                |
| Sheet / dossier drawer edge in AR         | direction-portals Case 3 (`.drawer` inset assertion)        | none — wire into CI                                                                                                                                                                                                                                                                                                                                                                                                |
| Tooltip RTL                               | direction-portals Case 5                                    | none — wire into CI                                                                                                                                                                                                                                                                                                                                                                                                |
| **Popover RTL**                           | none                                                        | NEW test. Candidate surfaces (all `data-slot="popover-*"` via `ui/popover.tsx`): `SearchableSelect` (forms), date-picker popover in task/commitment forms (bonus: exercises the `ui/calendar.tsx` rdp chevron patch live), filter popovers (`waiting-queue/FilterPanel`, `audit-logs/AuditLogFilters`). Assert `[data-slot="popover-content"]` computed `direction === 'rtl'` + side/alignment sane vs trigger box |
| Calendar RTL                              | `calendar-rtl.spec.ts` (green locally, July-seed-dependent) | CI-proof it: freeze the clock (`page.clock.install`) to a fixed month and pin seed rows to that month (or make seed evergreen)                                                                                                                                                                                                                                                                                     |
| **Pagination RTL**                        | source-grep only (76 §2) + human PNG                        | NEW test on `/users`: prev/next chevrons carry `rtl:rotate-180`, controls laid out RTL. **Needs ADMIN creds** — CI analyst creds will fail the admin gate                                                                                                                                                                                                                                                          |
| **Sidebar RTL**                           | human PNG only                                              | NEW test on any authed route in AR: live `layout/Sidebar.tsx` rail sits at inline-start (right edge): `Math.round(box.x + box.width) === viewportWidth`                                                                                                                                                                                                                                                            |

### Recommended approach

1. **New spec `frontend/tests/e2e/rtl-component-smokes.spec.ts`** (Popover + Pagination + Sidebar; reuse `loginForListPages`, DOM/computed-style assertions ONLY — **no screenshots**, so no darwin/linux snapshot-suffix trap and it runs identically local + ubuntu CI).
2. **CI-proof `calendar-rtl.spec.ts`** (clock freeze + month-pinned seed), keeping the existing assertions byte-similar.
3. **New `ci.yml` job — the SEPARATE green-from-birth path (recommended, and CONTEXT prefers it):**
   ```yaml
   test-rtl-smokes:
     name: RTL Portal + Component Smokes
     runs-on: ubuntu-latest
     needs: [lint, type-check]
     env: # mirror test-a11y — local dev server against staging Supabase
       TEST_USER_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }} # admin: pagination /users gate
       TEST_USER_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
       VITE_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
     steps:
       # checkout / pnpm / node / install / playwright install chromium (copy test-a11y)
       - name: Run RTL smokes
         run: pnpm exec playwright test direction-portals.spec.ts calendar-rtl.spec.ts rtl-component-smokes.spec.ts --project=chromium --reporter=html
         working-directory: ./frontend
   ```
   Why this pattern: the `test-a11y` job PROVES the local-dev-server+staging-Supabase infrastructure works in CI today (97 tests execute; its redness is assertion-level, not infra-level). The `e2e.yml` deployed-app pattern is the red class (issue #31) — do not couple to it. All secrets already exist (`E2E_ADMIN_*` are set for e2e.yml). `[VERIFIED: ci.yml + e2e.yml env blocks]`
   Rationale vs "fix the existing red jobs first": repairing `Visual Regression (Phase 46)`/QA Sweep requires redeploying the droplet/deployed app (142 unpushed commits + deploy pipeline) — infra work far outside a verification phase. Call this out in the phase docs per CONTEXT ("prefer the separate green-from-birth job… call it out explicitly").
4. **Make it actually gate (human checkpoint):** a workflow job failing is advisory unless its context is in branch protection. After the job is proven green on a real push/PR run, add `RTL Portal + Component Smokes` to the required contexts. This is a repo-admin operation on a protected setting — make it a `checkpoint:human-verify` task where the user either clicks Settings → Branches → required checks, or approves running:
   ```bash
   gh api -X POST repos/:owner/:repo/branches/main/protection/required_status_checks/contexts \
     --input - <<< '["RTL Portal + Component Smokes"]'   # [ASSUMED: endpoint shape from training — verify with `gh api --help` first; GET of the same path verified working]
   ```
   Honesty requirement: if the user declines the branch-protection change, FOUC-02's "gate the build" is only partially met (job exists + red-blocks nothing) — record the decision either way.
5. **Sequencing note:** the new job can only be observed green on GitHub once v8.0 pushes (a PR run). Local proof first (`pnpm -C frontend exec playwright test …` green), then the PR run is the birth certificate, then the required-context addition.

### Landmines

- **CI creds are analyst by default** (`E2E_ANALYST_*` in test-a11y) — the pagination smoke on `/users` 403s under analyst. Use `E2E_ADMIN_*` for the smoke job (already a repo secret), or drop `/users` and find a non-admin paginated surface (none confirmed — the dossiers list uses a different pagination pattern per 76 §3).
- **`FIXTURE_DOSSIER_ID`** (country, `support/dossier-drawer-fixture.ts`) is load-bearing for direction-portals Cases 2/3/5 — verify it exists in staging before wiring the job (same data-drift check as VERIFY-02).
- **calendar-rtl August cliff:** without the clock-freeze fix the new job goes red on 2026-08-01 — a "green-from-birth" job that dies in 4 weeks. The clock freeze (`page.clock.install`, proven in visual specs) + a month-pinned seed makes it evergreen.
- **No `toHaveScreenshot` in the smoke job** — it runs on ubuntu; the repo's committed baselines are darwin-named. DOM/computed-style assertions only.
- **Do not put the smokes in `e2e.yml`** — its jobs all set `E2E_BASE_URL` to the stale deployed app.
- **Keep Bundle/parity/duplicate-rtl green:** the phase adds tests + YAML only; if any a11y fix touches src, the full required-check gauntlet applies (incl. the pre-commit `pnpm build` hook on every commit).

### Task autonomy

| Step                                            | autonomous                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| New smoke tests + calendar CI-proofing          | true                                                                                                         |
| New ci.yml job                                  | true                                                                                                         |
| Local + PR-run green proof                      | true                                                                                                         |
| **Branch-protection required-context addition** | **false (checkpoint:human-verify — repo-admin setting; also the moment the user confirms "gating" is real)** |

---

## Don't Hand-Roll

| Problem                         | Don't Build                  | Use Instead                                                                             | Why                                                                                                 |
| ------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Pixel comparison / diff imaging | any custom compare script    | `expect(page).toHaveScreenshot()` + existing config thresholds                          | Config already tuned over 4 phases (ratio/threshold/animations/caret); artifacts + HTML report free |
| axe scanning                    | inline AxeBuilder copies     | `runAxe` from `tests/e2e/helpers/qa-sweep.ts`                                           | Spec header explicitly forbids re-implementation; serious/critical filter is the established gate   |
| Login/session                   | new login flows per spec     | `loginForListPages` + `global-setup.ts` storageState                                    | Solved race-free auth (43-12); a11y project inherits it                                             |
| Route lists for sweeps          | ad-hoc route arrays          | `helpers/v6-routes.ts` `V6_ROUTES`                                                      | Declared single source of truth                                                                     |
| RTL edge assertions             | screenshot-based edge checks | direction-portals `readFrame` / inset-inline-end pattern                                | Deterministic, platform-independent, proven in Phase 76                                             |
| Determinism (clocks/animations) | sleeps/waits                 | `page.clock.install` + `addInitScript` transition-kill + `data-loading="false"` markers | The 40-17 determinism stack; all visual specs use it                                                |
| A11y debt recording             | new allowlist file format    | `test.fixme(true, 'reason')` + `TRACKED APP A11Y DEBT` comment + phase ledger doc       | 10 existing instances; diff-reviewable; zero new machinery                                          |

**Key insight:** this phase should produce almost no novel test _machinery_ — it produces verdicts, records, 3 small smoke tests, and one CI job, all riding infrastructure that four prior phases already hardened.

## Common Pitfalls

### Pitfall 1: Baseline laundering by tool default

**What goes wrong:** running `--update-snapshots` (or letting a helper do it) before the human review — diffs vanish, VERIFY-01's control is destroyed.
**How to avoid:** the replay task must not carry the flag; the recapture task is a separate task hard-ordered after the `autonomous:false` checkpoint.
**Warning signs:** git status showing modified PNGs before the checkpoint task ran.

### Pitfall 2: 46-era seed/clock fragility (dashboard-widgets)

**What goes wrong:** WeekAhead/VipVisits render empty (server filters by real `NOW()`, client buckets by `FROZEN_TIME`) → capture crashes or diffs are garbage.
**How to avoid:** re-run the §2 seed SQL (MCP) + realign `FROZEN_TIME` in the same task, before replay; pre-classify date-text diffs as dynamic-content for the reviewer.

### Pitfall 3: Treating a11y failure counts as stable facts

**What goes wrong:** planning "fix the 2 hard failures" when live CI shows 9 hard / 5 flaky and the set shifts run-to-run (data + timing sensitivity).
**How to avoid:** a characterization task on the local reference env produces the authoritative per-failure list; the ledger records env + date.

### Pitfall 4: Coupling new CI to the issue-#31 red class

**What goes wrong:** putting smokes in `e2e.yml` (deployed-app `E2E_BASE_URL`) → red-from-birth for reasons unrelated to RTL.
**How to avoid:** ci.yml local-dev-server pattern (test-a11y proves it works); explicitly document choosing the separate-job path.

### Pitfall 5: "Gating" theater

**What goes wrong:** declaring FOUC-02 done when the job exists but isn't a required context — failures then block nothing.
**How to avoid:** the branch-protection addition is its own checkpoint task with verification (`gh api …/protection` shows the new context).

### Pitfall 6: Time-bombed smokes

**What goes wrong:** calendar-rtl goes red in August (July-dated seed rows); dashboard FROZEN_TIME rots the same way.
**How to avoid:** clock-freeze + month-pinned seed for calendar; document the FROZEN_TIME↔seed coupling in the recapture commit.

### Pitfall 7: Cross-platform snapshot names

**What goes wrong:** a ubuntu CI job demands `-chromium-linux` PNGs that don't exist; or a linux recapture pollutes the darwin baseline set.
**How to avoid:** smokes assert DOM/computed style only; all screenshot work stays on darwin (this Mac).

### Pitfall 8: Scope bleed into the quarantined 8 / deployed-app repair / droplet deploy

**What goes wrong:** "bring CI green" inflates into repairing 8 quarantined specs, redeploying the droplet, or fixing Docker Build — none is a Phase 80 requirement.
**How to avoid:** the phase green-target is exactly: a11y gate job + the NEW smoke job; everything else red is recorded with disposition, not repaired.

## Runtime State Inventory

Not a rename/refactor phase — omitted. (The only "runtime state" touched is staging seed data, covered in VERIFY-01 pre-flight and FOUC-02 calendar seed.)

## Environment Availability

| Dependency                                                                                          | Required By                         | Available                                               | Version                                                       | Fallback                             |
| --------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| Playwright + chromium browsers                                                                      | all replay/smoke work               | ✓                                                       | 1.60.0 / chromium-1223+1228 in ~/Library/Caches/ms-playwright | —                                    |
| `.env.test` (TEST_USER creds)                                                                       | loginForListPages                   | ✓ (repo root, present)                                  | —                                                             | Doppler run per helper error message |
| Local dev server flow (`pnpm dev` :5173 auto-started by Playwright)                                 | all local runs                      | ✓ (proven 77-01 on this Mac, 2026-07-02)                | —                                                             | —                                    |
| Staging Supabase reachability + fixture rows (`testDossierIds`, `FIXTURE_DOSSIER_ID`, `b0000002-*`) | a11y + portals + widgets            | ✓ [ASSUMED — used 2026-07-02; **re-verify rows early**] | project `zkrcjzdemdmwhearhfgg`                                | re-seed via MCP                      |
| Supabase MCP (seed SQL)                                                                             | VERIFY-01 pre-flight, calendar seed | ✓ orchestrator-only (executors have none)               | —                                                             | orchestrator/human applies           |
| `gh` CLI authed (runs, logs, protection API)                                                        | CI verification + gating            | ✓ (used in this research)                               | —                                                             | GitHub UI                            |
| GitHub secrets `E2E_ADMIN_*`, `E2E_ANALYST_*`, `E2E_SUPABASE_*`                                     | new CI job                          | ✓ (already consumed by e2e.yml/ci.yml)                  | —                                                             | —                                    |
| Repo-admin rights for branch protection                                                             | FOUC-02 gating                      | ✓ (user is owner) — **human action**                    | —                                                             | none (checkpoint)                    |

**Missing dependencies with no fallback:** none.

## State of the Art

| Old Approach (this repo, pre-77)                 | Current Approach                                        | When Changed               | Impact on Phase 80                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bureau default-light, 4-direction matrix         | Linear single-direction, dark-canonical (light derived) | Phase 77 (2026-07-02)      | Visual specs pin `id.theme=light` → re-compare stays like-for-like; focus-outline matrix already collapsed to 2 Linear shots in 77-07                 |
| a11y specs manual-login (stale)                  | storageState from global-setup + `?lng=ar` querystring  | prod-quality sweeps (June) | The 5-gate/8-quarantine split; repair recipe documented in playwright.config comment                                                                  |
| Portal dir from render-time `document.dir` reads | single `DirectionProvider` owner + Radix context bridge | Phase 76                   | direction-portals.spec.ts asserts the new invariant — it IS the FOUC-02 core                                                                          |
| `github/codeql-action/upload-sarif@v2`           | v2 deprecated upstream                                  | 2025                       | Security Scan red on push events only; **passes on pull_request events (verified)** → v8.0 PR not blocked; optional hygiene bump to @v3, out of scope |

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Playwright 1.60.0 (`frontend/playwright.config.ts`) + vitest 4.1.7 (`frontend/vitest.config.ts`)                                                                                       |
| Config file        | `frontend/playwright.config.ts` (projects: `chromium`, `chromium-dashboard-widgets`, `chromium-no-auth`, `a11y`)                                                                       |
| Quick run command  | `pnpm -C frontend exec playwright test direction-portals.spec.ts --project=chromium` (~1-2 min with dev-server reuse)                                                                  |
| Full suite command | `pnpm -C frontend exec playwright test --project=a11y` + the 10-visual-spec replay + smoke specs (browser suites); `pnpm --filter intake-frontend test --run` (vitest, required check) |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                                  | Test Type                               | Automated Command                                                                                      | File Exists?                                        |
| --------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| VERIFY-01 | 43 baselined shots replay clean against the NEW committed Linear baselines after human-approved recapture | visual e2e                              | `pnpm -C frontend exec playwright test <10 visual specs> --retries=2` → 43/43 pass                     | ✅ specs exist; new PNGs land in the recapture task |
| VERIFY-01 | Triage ledger proves every diff classified (intended/regression/dynamic)                                  | manual-only (mandated human checkpoint) | n/a — evidence doc `80-VISUAL-RECOMPARE.md` committed                                                  | ❌ Wave doc                                         |
| VERIFY-02 | No new violations vs recorded baseline (B ⊆ A)                                                            | e2e A/B                                 | `--project=a11y` + 4-axis sweep on HEAD vs worktree `14191cb85`, same-day                              | ✅ gate specs exist; ❌ 4-axis extension (Wave 0)   |
| VERIFY-02 | a11y CI job green                                                                                         | CI                                      | `gh run view <run> --json jobs` → Accessibility job = success on next push/PR                          | ✅ job exists                                       |
| FOUC-02   | Dropdown/Sheet/drawer/Tooltip open inline-start-correct in AR                                             | e2e smoke                               | `pnpm -C frontend exec playwright test direction-portals.spec.ts --project=chromium` → 5/5             | ✅                                                  |
| FOUC-02   | Popover RTL + Pagination RTL + Sidebar RTL                                                                | e2e smoke                               | `… rtl-component-smokes.spec.ts` → pass                                                                | ❌ Wave 0                                           |
| FOUC-02   | Calendar AR grid evergreen                                                                                | e2e smoke                               | `… calendar-rtl.spec.ts` (clock-frozen) → pass                                                         | ✅ exists; ❌ CI-proofing edit                      |
| FOUC-02   | Smokes gate the build                                                                                     | CI + config                             | new job green on PR run AND `gh api repos/:owner/:repo/branches/main/protection` lists the new context | ❌ Wave 0 job + human checkpoint                    |

### Sampling Rate

- **Per task commit:** the touched spec file(s) only (e.g. `playwright test rtl-component-smokes.spec.ts`), plus `pnpm -C frontend type-check` (pre-commit hook builds anyway).
- **Per wave merge:** `--project=a11y` + the smoke trio locally.
- **Phase gate:** 43/43 visual replay green on new baselines + a11y project green + smoke job green on a real GitHub run + required-context verified + all 8 pre-existing required checks green.

### Wave 0 Gaps

- [ ] `frontend/tests/e2e/rtl-component-smokes.spec.ts` — covers FOUC-02 Popover/Pagination/Sidebar
- [ ] 4-axis theme extension to `qa-sweep-axe` (or sibling spec) — covers VERIFY-02 axes
- [ ] `ci.yml` `test-rtl-smokes` job — covers FOUC-02 gating
- [ ] `.planning/phases/80-.../80-VISUAL-RECOMPARE.md` + `80-A11Y-BASELINE.md` ledgers — the recorded-baseline evidence
- [ ] Framework install: none

## Security Domain

Verification phase — no new endpoints, inputs, or data paths. Applicable slice:

| ASVS Category       | Applies  | Standard Control                                                                                                                                                       |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication   | marginal | Test creds via env/secrets only (`loginForListPages` throws on missing env — never hardcode; reuse existing `E2E_*` GitHub secrets, create none)                       |
| V5 Input Validation | no       | no new inputs                                                                                                                                                          |
| V14 Configuration   | yes      | Branch-protection change is privileged → human checkpoint; new CI job reuses existing secrets with least scope (admin creds only in the smoke job that needs `/users`) |

| Pattern                                                                | STRIDE                 | Mitigation                                                                                                         |
| ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Secrets leakage via test artifacts (HTML reports/screenshots uploaded) | Information disclosure | Existing artifact uploads already carry this posture; do not add env-dumping steps; reports retain 30-90d as today |
| Baseline tampering (silent PNG regeneration)                           | Tampering              | Ordering control (replay→human→update) + ledger commits; Bureau lineage preserved at `14191cb85`                   |

## Assumptions Log

| #   | Claim                                                                                                               | Section                  | Risk if Wrong                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| A1  | `gh api -X POST …/required_status_checks/contexts` is the correct endpoint shape for adding a required check        | FOUC-02 step 4           | Low — fallback is the Settings UI (human is doing this step anyway); GET of the same path verified working |
| A2  | Staging fixture rows (`testDossierIds` ×6, `FIXTURE_DOSSIER_ID`, `b0000002-*`) still exist as of Phase 80 execution | VERIFY-02/FOUC-02        | Medium — failures get misclassified as a11y/RTL bugs; mitigated by the early data-verification task        |
| A3  | The pre-token worktree (`14191cb85`) installs + boots cleanly with today's pnpm store                               | VERIFY-02 step 2         | Low — same lockfile era; fallback is per-failure history-proof                                             |
| A4  | The in-gate a11y hard failures predate Phase 77 (nothing token/79-caused)                                           | VERIFY-02                | Medium — exactly what the A/B run exists to prove; do not assume it in the ledger                          |
| A5  | `E2E_ADMIN_*` secrets remain valid on staging (last verified via e2e.yml usage)                                     | FOUC-02 pagination smoke | Low — issue #31 shows creds were rotated 2026-05-28 and work; re-verify on first CI run                    |

## Open Questions

1. **Does "gate the build" get the branch-protection edit?** The job + green proof is autonomous; the required-context addition needs the user. If declined, FOUC-02 is delivered as "job exists, advisory" — the ledger must say so plainly. (Planner: model as checkpoint with explicit yes/no recording.)
2. **How much of the current 9-hard a11y set reproduces locally?** CI's staging-data + timing sensitivity means the local reference run may show fewer/different failures. The characterization task answers this before any fix-vs-record work is sized.
3. **Recapture timing vs further merges:** the Linear baselines captured in this phase become the new lineage; any subsequent visual change re-red-flags the replay. Phase 80 is last in v8.0, so capture at phase end — but note the v8.0 PR itself must not include post-capture visual changes.

## Sources

### Primary (HIGH confidence — live repo/CI verification)

- `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` — baseline inventory, seed SQL, replay proof, exclusions
- git history: `14191cb85` (baseline commit), `229a39c8a` (focus-outline linear-only), snapshot-dir logs (baselines untouched)
- `frontend/playwright.config.ts`, `frontend/tests/e2e/direction-portals.spec.ts`, `calendar-rtl.spec.ts`, `qa-sweep-axe.spec.ts`, `helpers/qa-sweep.ts`, `helpers/v6-routes.ts`, `tests/a11y/*.spec.ts`, `tests/fixtures/dossier-fixtures.ts`, `support/list-pages-auth.ts`, `ui/sheet.tsx`, `ui/popover.tsx`
- `.github/workflows/ci.yml` + `e2e.yml`; live runs `28574521475` (CI, job-level conclusions + a11y failure names from logs), `28574521483` (E2E), `28574274067` (PR-event Security Scan pass)
- `gh api repos/:owner/:repo/branches/main/protection` — the 8 required contexts
- GitHub issue #31 — deployed-app/stale-secret failure taxonomy
- `.planning/phases/76-*/76-SRTL02-VERIFICATION.md` — Calendar/Pagination/Sidebar live-component mapping
- `pnpm list` + local `playwright test --list` (97 a11y / 43 visual / 6 portal tests) + `~/Library/Caches/ms-playwright` browser inventory

### Secondary (MEDIUM)

- `npm view` registry versions (@playwright/test 1.61.1, @axe-core/playwright 4.12.1) — currency check only; no bumps recommended

### Tertiary (LOW / [ASSUMED])

- Branch-protection POST endpoint shape (A1); staging row liveness (A2)

## Metadata

**Confidence breakdown:**

- VERIFY-01 mechanics: HIGH — the identical workflow ran to completion on this machine 2026-07-02 (77-01)
- VERIFY-02 failure taxonomy: HIGH on what/where (live CI logs), MEDIUM on root causes (needs the local characterization task)
- FOUC-02 patterns: HIGH — assertion patterns are proven in-repo; CI job pattern mirrors a working job
- Gating mechanics: HIGH on required-check reality (gh api), LOW only on the exact POST call shape (human-mediated anyway)

**Research date:** 2026-07-03
**Valid until:** ~2026-07-17 (CI failure sets and staging data drift; re-verify the live-run numbers if planning slips past mid-July)
