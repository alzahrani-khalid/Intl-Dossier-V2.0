---
phase: 41
plan: 07
subsystem: dossier-drawer
tags: [drawer, wave-2, e2e, playwright, axe-core, visual-regression, verification]
requires:
  - frontend/tests/e2e/support/dossier-drawer-fixture.ts (Wave 0 — plan 41-01)
  - frontend/tests/e2e/support/list-pages-auth.ts (Phase 40 baseline helper)
  - frontend/playwright.config.ts (caret hide / reducedMotion reduce / maxDiffPixels 100)
  - .planning/phases/41-dossier-drawer/41-01..06 SUMMARYs (locked decisions feeding Wave 2)
provides:
  - 8 functional E2E specs covering D-13 cases 1-10
  - 1 visual regression spec — LTR + AR @ 1280×800 (baselines deferred to HUMAN-UAT)
  - 1 axe-core spec — zero serious/critical EN + AR
  - .planning/phases/41-dossier-drawer/41-VERIFICATION.md — canonical phase verdict (PENDING-HUMAN-SMOKE)
affects:
  - frontend/tests/e2e/* (10 new specs)
tech-stack:
  added: []
  patterns:
    - "Phase 40 visual-determinism stack (clock freeze + font readiness + data-loading=false marker)"
    - "Geometry-based RTL assertion (rectLeft/rectRight) instead of insetInlineStart (Sheet variant uses inset-inline-end which would be auto in both locales)"
    - "test.describe.configure({ retries: 1 }) per Phase 40 stability precedent"
    - "axe-core scoped via AxeBuilder.include('.drawer') to avoid coupling drawer regressions to pre-existing page-level violations"
key-files:
  created:
    - frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts
    - frontend/tests/e2e/dossier-drawer-trigger-calendar.spec.ts
    - frontend/tests/e2e/dossier-drawer-deeplink.spec.ts
    - frontend/tests/e2e/dossier-drawer-a11y.spec.ts
    - frontend/tests/e2e/dossier-drawer-mobile.spec.ts
    - frontend/tests/e2e/dossier-drawer-cta.spec.ts
    - frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts
    - frontend/tests/e2e/dossier-drawer-rtl.spec.ts
    - frontend/tests/e2e/dossier-drawer-visual.spec.ts
    - frontend/tests/e2e/dossier-drawer-axe.spec.ts
    - .planning/phases/41-dossier-drawer/41-VERIFICATION.md
  modified: []
decisions:
  - D-13 case 5 (RTL slide) asserted via physical-edge geometry (rectLeft===0 in RTL, rectRight===viewportWidth in LTR) rather than computed insetInlineStart, which is `auto` in both locales because Sheet side='right' uses inset-inline-end. Plan note explicitly called this out.
  - Visual baselines deferred to HUMAN-UAT (Phase 40 precedent) — sandboxed worktree has no dev server/.env.test to drive baseline generation.
  - Total JS size-limit overage observed (2.42 MB vs 815 KB) is pre-existing build-config drift unrelated to Phase 41 (drawer chunk gz delta ≈ 330 B, well below noise floor). Recorded as INFO per RESEARCH §15 / A6, NOT raised. Logged in 41-VERIFICATION.md as out-of-scope deferred item.
  - Open full dossier asserts URL `/dossiers/{segment}/{id}` (no `/overview` suffix) — that is what `getDossierDetailPath` actually returns; the plan template's `/dossiers/{type}/$id/overview` would have failed.
  - Brief stub click is exercised with `{ force: true }` because the button has `cursor: not-allowed` (decorative); we verify the URL did not change AND the dialog stayed open.
metrics:
  duration_minutes: 8
  completed: 2026-05-02
  tasks_completed: 3   # Tasks 1-3 complete; Task 4 (human checkpoint) pending sign-off
  files_created: 11
  files_modified: 0
  playwright_tests_enumerated: 16   # 12 functional + 2 visual + 2 axe
  ts_errors_introduced: 0
requirements_completed: [DRAWER-01, DRAWER-02, DRAWER-03]
---

# Phase 41 Plan 07: Wave 2 Phase Gate Summary

Wave 2 phase gate ships the 10 Playwright E2E specs (D-13 cases 1-10), the
2-baseline visual-regression spec (D-12), the axe-core zero-violations gate
(D-14), and the canonical 41-VERIFICATION.md.  Tasks 1-3 are complete and
committed.  Task 4 is a `checkpoint:human-verify` that requires the operator
to run the 10 staging smokes and finalize the verdict.

## What Got Built

### Task 1 — 10 D-13 case spec files (8 files, 12 tests)

**Commit:** `25154200`

8 functional E2E spec files, each carrying a top-level `// D-13 case N — <description>`
comment for every case it covers (the plan's grep-loop verifier confirms all
10 cases are referenced by name):

| File                                          | D-13 case(s) | Notes                                                                                                  |
| --------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| dossier-drawer-trigger-recent.spec.ts         | 1            | RecentDossiers click → drawer opens; asserts all 5 body section testids                                 |
| dossier-drawer-trigger-calendar.spec.ts       | 2            | Click event with `[data-dossier-id]` → drawer opens; URL has `?dossier=`                               |
| dossier-drawer-deeplink.spec.ts                | 3            | Direct visit to `/?dossier=...&dossierType=...` opens drawer; survives `page.reload()`                  |
| dossier-drawer-a11y.spec.ts                    | 4 + 7        | ESC closes drawer + clears search params; Tab + Shift+Tab focus trap (8 + 4 cycles)                    |
| dossier-drawer-mobile.spec.ts                  | 6            | 390×844 viewport: width matches viewport; box-shadow === 'none'; Tab cycle stays inside dialog          |
| dossier-drawer-cta.spec.ts                     | 8 + 9        | Open full dossier → `/dossiers/countries/<id>` (no `/overview` per `getDossierDetailPath`); Log engagement → `/dossiers/engagements/create`; Brief stub asserts `aria-disabled="true"` and no URL change |
| dossier-drawer-commitment-click.spec.ts        | 10           | Commitment row click → `/commitments?id=<uuid>`; drawer auto-closes (D-08 revised per RESEARCH §4)      |
| dossier-drawer-rtl.spec.ts                     | 5            | Geometry-based RTL assertion: AR drawer rectLeft===0, EN drawer rectRight===viewportWidth (Sheet's inline-end resolves to physical LEFT under RTL) |

All specs:
- `await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })` before navigation (Phase 40 visual-determinism layer)
- `await page.evaluate(() => document.fonts.ready)` post-navigation
- `await page.locator('.drawer-body[data-loading="false"]').waitFor(...)` before section assertions
- `test.describe.configure({ retries: 1 })` per Phase 40 stability precedent
- Uses `loginForListPages` from `support/list-pages-auth.ts` (Phase 40 baseline) and the Wave 0 `openDrawerForFixtureDossier` helper

`playwright test --list` enumerates **12 tests across 8 files**.

### Task 2 — Visual regression spec (LTR + AR @ 1280×800)

**Commit:** `5c26af7e`

`frontend/tests/e2e/dossier-drawer-visual.spec.ts` adds 2 baselines:
- `dossier-drawer-ltr-1280.png` — frozen clock, 1280×800
- `dossier-drawer-ar-1280.png` — same, AR locale

Both at `maxDiffPixelRatio: 0.02`.  Mobile (≤640px) is intentionally NOT a
visual snapshot — the DOM render assertion in `dossier-drawer-mobile.spec.ts`
covers it (Phase 38 D-13 / Phase 40 D-06 precedent).

`playwright test --list dossier-drawer-visual` enumerates **2 tests**.

**Baseline PNGs deferred to HUMAN-UAT** (Phase 40 [40-11] precedent — see
deviation log below).

### Task 3 — axe-core gate (EN + AR)

**Commit:** `5deba135`

`frontend/tests/e2e/dossier-drawer-axe.spec.ts` runs `AxeBuilder` scoped to
`.drawer` against the WCAG 2.0/2.1 AA tag set.  Filters violations down to
`impact in ('serious', 'critical')` and asserts the array is empty.

`playwright test --list dossier-drawer-axe` enumerates **2 tests** (EN + AR).

Per RESEARCH §15 / A6, **no per-component size-limit entry was added** for
the dossier-drawer chunk — the Total JS budget is the gate.  See deviation
log: Total JS overage observed is pre-existing, drawer's contribution is ≈ 0.

### Task 4 — Human checkpoint (PENDING)

`checkpoint:human-verify` — the operator runs the 10 smoke steps documented
in the plan against staging on a dev machine (where `pnpm dev` and `.env.test`
exist) and finalizes the verdict in `41-VERIFICATION.md`.  See plan Task 4
`<how-to-verify>` for the smoke script.

## Verification

| Check                                                                                      | Result                                                                  |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `playwright test --list dossier-drawer` enumerates                                         | 16 tests across 10 files (12 functional + 2 visual + 2 axe)              |
| Each D-13 case 1-10 referenced by name in spec comments                                    | All 10 PASS the grep-loop                                               |
| `pnpm size` Total JS budget                                                                | FAIL (pre-existing; not caused by Phase 41 — see deviation log)          |
| dossier-drawer chunk gz size (raw `useDossierDrawer-*.js`)                                  | ≈ 485 B raw / ~330 B gz (INFO only)                                     |
| Phase 41 surface TS errors delta                                                           | 0                                                                       |
| Logical-property violations on Phase 41 surface                                            | 0                                                                       |
| Visual PNG baselines committed                                                              | DEFERRED to HUMAN-UAT (Phase 40 precedent)                               |
| `41-VERIFICATION.md` exists                                                                | YES — verdict PENDING-HUMAN-SMOKE                                        |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `getDossierDetailPath` does not return an `/overview` suffix**

- **Found during:** Task 1 (`dossier-drawer-cta.spec.ts` D-13 case 8)
- **Issue:** Plan template asserted `/dossiers/{type}/$id/overview` for the Open-full-dossier CTA. Reading `frontend/src/lib/dossier-routes.ts` shows `getDossierDetailPath(id, type)` returns `/dossiers/{segment}/{id}` — no `/overview` segment, no `$id` placeholder. The CTA wires this helper directly (plan 41-02 SUMMARY confirms). Asserting the plan's literal would always fail.
- **Fix:** Spec asserts `/dossiers/countries/<FIXTURE_DOSSIER_ID>(?:[/?#]|$)` — what the helper actually produces.
- **Files modified:** `frontend/tests/e2e/dossier-drawer-cta.spec.ts`
- **Commit:** `25154200`

**2. [Rule 1 — Bug] Brief stub button has `cursor: not-allowed` so plain `.click()` would be intercepted**

- **Found during:** Task 1 (`dossier-drawer-cta.spec.ts` Brief stub assertion)
- **Issue:** Plan template had `await brief.click()`.  But `DrawerCtaRow` sets `style={{ cursor: 'not-allowed' }}` on the Brief stub button (D-05 visual treatment).  Playwright's actionability check for plain `click()` would fail/timeout because `not-allowed` is treated as an unstable cursor signal.
- **Fix:** Used `await brief.click({ force: true })` to bypass the actionability check, then verify (a) the URL did not change and (b) the dialog stayed open. The spec also asserts `aria-disabled="true"` independently of the click.
- **Files modified:** `frontend/tests/e2e/dossier-drawer-cta.spec.ts`
- **Commit:** `25154200`

**3. [Rule 3 — Blocking] Worktree node_modules absent**

- **Found during:** Task 1 verification (`playwright test --list`)
- **Issue:** `pnpm playwright …` failed with "Command 'playwright' not found" because the worktree was created without an install. `frontend/node_modules` did not exist.
- **Fix:** Symlinked `frontend/node_modules` to the parent repo's hoisted `node_modules`. Same workaround used by plan 41-06 (documented there). Verification calls then go through the parent repo's binary at `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/node_modules/.bin/playwright`.
- **Files modified:** none (workflow change only; symlinks not committed)

### Out-of-scope discoveries (logged, not fixed)

**Total JS size-limit overage (UNRELATED to Phase 41)**

- **Where:** `pnpm size` step from plan Task 3.
- **Reading:** Total JS at 2.42 MB gz vs 815 KB ceiling (overage 1.6 MB).
- **Phase 41 contribution:** ≈ 0 (drawer chunk is ~330 B gz — within bundler-hash noise floor).
- **Suspected root cause:** Vite build-config drift; `vendor-*.js` super-chunk at 651 KB gz dominates.
- **Action:** Recorded as INFO per RESEARCH §15 / A6.  Logged in `41-VERIFICATION.md` as OUT-OF-SCOPE deferred work for a future bundle-budget reconciliation plan.  **Did NOT raise the budget.**

### Plan vs. observed surface

- The plan's `<verify>` for Task 1 used a `grep -c "dossier-drawer-"` counting check that requires bash arithmetic; that's working as intended in this run (8 files matched).
- Task 2's `<done>` clause explicitly allows visual-baseline deferral when sandbox lacks dev server.  Followed Phase 40 precedent.
- Task 3's `<verify>` asserts 2 axe tests enumerate — 2 enumerated.

## Threat Model — Status

| Threat ID  | Mitigation                                                                                                          | Status     |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| T-41-07-01 | Visual baselines reference only the seeded fixture dossier (`seed-country-sa`) — no real-user PII.                  | MITIGATED  |
| T-41-07-02 | localStorage mutation in tests is isolated per Playwright context; no persistence across runs.                      | ACCEPTED   |
| T-41-07-03 | `E2E_DOSSIER_FIXTURE_ID` is non-secret and the default is the seeded fixture ID.                                    | ACCEPTED   |

## Known Stubs

None introduced by this plan.  The Brief and Follow CTAs remain stubs from
plan 41-02 (D-05); `dossier-drawer-cta.spec.ts` verifies their stub behavior
(URL does not change; `aria-disabled="true"` is present).

## Self-Check: PASSED

**Files exist:**

- FOUND: `frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-trigger-calendar.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-deeplink.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-a11y.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-mobile.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-cta.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-rtl.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-visual.spec.ts`
- FOUND: `frontend/tests/e2e/dossier-drawer-axe.spec.ts`
- FOUND: `.planning/phases/41-dossier-drawer/41-VERIFICATION.md`

**Commits exist (verified via `git log --oneline -5`):**

- FOUND: `25154200` (Task 1 — 8 functional specs)
- FOUND: `5c26af7e` (Task 2 — visual regression spec)
- FOUND: `5deba135` (Task 3 — axe-core gate)
