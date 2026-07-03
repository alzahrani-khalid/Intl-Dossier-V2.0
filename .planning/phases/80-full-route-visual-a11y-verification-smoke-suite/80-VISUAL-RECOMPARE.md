# Phase 80-04 — VERIFY-01 Visual Re-Compare Ledger (Linear HEAD vs Phase-77 Pre-Token Baseline)

**Replayed:** 2026-07-03 (this Mac — `-chromium-darwin` platform)
**Gate:** VERIFY-01 — re-compare all 43 committed pre-token visual baselines (10 Playwright
specs, lineage `14191cb85`) against the Linear-migrated tree, preserving every diff for a
**mandatory human diff-triage checkpoint** (Task 3, `checkpoint:human-verify gate="blocking"`).
**Status:** Replay complete, diff evidence collected, baselines **byte-untouched**.
**AWAITING HUMAN DIFF TRIAGE (Task 3)** — the 43 Verdict cells below are intentionally
**BLANK**; only the human overseer fills them (intended-Linear | regression | dynamic
content, not theme). No verdict is executor-invented. `--update-snapshots` recapture
(Plan 80-05) is permitted **only after** these verdicts are approved.

This ledger mirrors the structure of `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md`
(§§1–7).

---

## 1. Environment + run parameters

| Field                 | Value                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference environment | This Mac (Phase-46/77-01 precedent); `pnpm dev` :5173 auto-booted by Playwright                                                                                                                   |
| Platform suffix       | `-chromium-darwin` (default-path PNGs); dashboard-widgets uses the bare-name `pathTemplate`                                                                                                       |
| Replay date           | 2026-07-03                                                                                                                                                                                        |
| HEAD SHA (replayed)   | `4b90866b4e851bbc4523dacec6aa9d5b197858ed` (`4b90866b4`) — `docs(80-03): complete VERIFY-02 fix-vs-record plan (a11y gate green)`                                                                 |
| Baseline lineage      | `14191cb85` — `test(77-01): commit VERIFY-01 pre-swap visual baseline + capture log` (Bureau / default-light; untouched since)                                                                    |
| `E2E_BASE_URL`        | **unset** (verified empty) — Playwright auto-started the local dev server, not a deployed app                                                                                                     |
| Theme pin             | every spec seeds `id.theme='light'` → Bureau-light **vs** Linear-light, like-for-like                                                                                                             |
| Playwright            | 1.60.0; config `frontend/playwright.config.ts` (`maxDiffPixelRatio` 0.01, 0.02 for widgets; `threshold` 0.2; `maxDiffPixels` 100; `animations: disabled`; `caret: hide`; `reducedMotion: reduce`) |
| Result                | **39 failed / 4 passed = 43** — 39 shots carry a diff for adjudication; 4 dashboard widgets fell within the 0.02 widget tolerance                                                                 |
| HTML report (primary) | `frontend/playwright-report/index.html` — open with `pnpm -C frontend exec playwright show-report`                                                                                                |
| Diff triads on disk   | `frontend/test-results/<test-dir>/{<snap>-expected,-actual,-diff}.png` (gitignored — regenerated each run; the HTML report is the durable triage surface)                                         |

**Verbatim replay command** (research §VERIFY-01 step 2 — `--retries=0`, **NO `--update-snapshots`**):

```bash
pnpm -C frontend exec playwright test \
  list-pages-visual.spec.ts dashboard-widgets-visual.spec.ts kanban-visual.spec.ts \
  tasks-tab-visual.spec.ts tasks-page-visual.spec.ts activity-page-visual.spec.ts \
  after-actions-page-visual.spec.ts briefs-page-visual.spec.ts settings-page-visual.spec.ts \
  dossier-drawer-visual.spec.ts --retries=0 --reporter=html
```

_(The executed run appended a `list` reporter — `--reporter=list,html` — purely for parseable
console counts; this changes no snapshot behavior and adds no `--update-snapshots`. The html
report is identical either way.)_

---

## 2. Staging seed refresh (Task 1 — ORCHESTRATOR via Supabase MCP)

The 3 deterministic `b0000002-*` `engagement_dossiers` fixture rows were re-refreshed to
today-anchored dates by the **orchestrator** via Supabase MCP against project
`zkrcjzdemdmwhearhfgg` (executors have no MCP — established project fact). Dates-only, no
schema/row changes. Verbatim proof reported by the orchestrator:

<!-- prettier-ignore-start -->

| Row id                                   | start_date            | end_date              | Bucket            |
| ---------------------------------------- | --------------------- | --------------------- | ----------------- |
| `b0000002-0000-0000-0000-000000000001`   | 2026-07-03 21:00:00+00 | 2026-07-03 23:00:00+00 | today             |
| `b0000002-0000-0000-0000-000000000002`   | 2026-07-04 10:00:00+00 | 2026-07-04 12:00:00+00 | tomorrow          |
| `b0000002-0000-0000-0000-000000000003`   | 2026-07-05 14:00:00+00 | 2026-07-07 16:00:00+00 | +2d / +4d (VIP)   |

<!-- prettier-ignore-end -->

- **SEED DATE: 2026-07-03**
- Source: orchestrator Supabase-MCP, project `zkrcjzdemdmwhearhfgg`.
- The executor performed **no** staging write and did **not** re-run the seed.

---

## 3. FROZEN_TIME realignment + seed/clock non-empty proof (Task 2)

`frontend/tests/e2e/dashboard-widgets-visual.spec.ts` — `FROZEN_TIME` realigned
`2026-07-02T12:00:00Z` → **`2026-07-03T12:00:00Z`** (the seed date at noon). The 77-01
coupling comment (the WeekAhead client-clock bucket vs server-side `get_upcoming_events`
`NOW()` filter) is preserved verbatim; the `pathTemplate` was **not** touched (77-01 §6
pinned the bare-name template deliberately).

**Why it must equal the seed date:** WeekAhead buckets events by the browser clock and
**drops** anything outside today/tomorrow/this_week/next_week, while the server filters by
real `NOW()`. They overlap only when the frozen clock shares the seed's date — otherwise the
widgets render empty and the capture crashes at the readiness wait (the 46-era fragility).

**Non-empty proof (seed 2026-07-03 ↔ clock 2026-07-03 held):**

- `visual week-ahead` **reached and failed the `toHaveScreenshot` comparison** (emitted
  `week-ahead-expected/-actual/-diff.png`) — it could only reach the screenshot step by first
  satisfying `await expect(widget.locator('.week-row').first()).toBeVisible()`. A readiness
  timeout on an empty widget produces **no** screenshot triad. ⇒ **WeekAhead rendered
  non-empty rows.** (Log: `Error: expect(locator).toHaveScreenshot(expected) failed`.)
- `visual vip-visits` **PASSED** within the 0.02 tolerance — it rendered `.vip-row` and
  screenshotted cleanly. ⇒ **VipVisits rendered non-empty rows.**

---

## 4. Replay result summary

- **Authoritative Playwright summary:** `39 failed`, `4 passed` (39.2s), **43 total in 10 files**.
- **Exit code 1 is the mechanism** (Bureau baseline vs Linear HEAD ⇒ mass diffs), not a harness fault.
- Per-spec diff-present tally (unique tests):

<!-- prettier-ignore-start -->

| Spec                        | Tests | Diff (fail) | Within-tolerance (pass) |
| --------------------------- | ----- | ----------- | ----------------------- |
| list-pages-visual           | 14    | 14          | 0                       |
| dashboard-widgets-visual    | 8     | 4           | 4 (digest, vip-visits, my-tasks, recent-dossiers) |
| kanban-visual               | 4     | 4           | 0                       |
| tasks-tab-visual            | 4     | 4           | 0                       |
| settings-page-visual        | 3     | 3           | 0                       |
| activity-page-visual        | 2     | 2           | 0                       |
| after-actions-page-visual   | 2     | 2           | 0                       |
| briefs-page-visual          | 2     | 2           | 0                       |
| tasks-page-visual           | 2     | 2           | 0                       |
| dossier-drawer-visual       | 2     | 2           | 0                       |
| **Total**                   | **43**| **39**      | **4**                   |

<!-- prettier-ignore-end -->

**Note on artifact count:** the filesystem holds 41 `*-diff.png` files (= 39 unique failed
shots + 2 `-retry1` duplicates for the two `dossier-drawer-visual` tests, which self-configure
a retry). The authoritative per-test result remains 39 failed / 4 passed.

---

## 5. Per-shot diff inventory — HUMAN TRIAGE TABLE (Verdict column BLANK for Task 3)

43 rows (10 specs). `Diff?` = did the shot exceed the configured tolerance (⇒ needs a verdict).
`Artifact` = the on-disk `frontend/test-results/<dir>/` holding the `-expected/-actual/-diff`
triad for THIS run (also viewable side-by-side in the HTML report, indexed by test title).
**Verdict** (to be filled by the human): `intended-Linear` | `regression` | `dynamic content, not theme`.

<!-- prettier-ignore-start -->

| #  | Spec                       | Test (title)                                  | Snapshot                                   | Diff? | Artifact (test-results/ dir)                                               | Verdict |
| -- | -------------------------- | --------------------------------------------- | ------------------------------------------ | ----- | -------------------------------------------------------------------------- | ------- |
| 1  | list-pages-visual          | visual countries (en)                         | countries-en-chromium-darwin.png           | Y     | e2e-list-pages-visual-visual-countries-en--chromium/                       |         |
| 2  | list-pages-visual          | visual countries (ar)                         | countries-ar-chromium-darwin.png           | Y     | e2e-list-pages-visual-visual-countries-ar--chromium/                       |         |
| 3  | list-pages-visual          | visual organizations (en)                     | organizations-en-chromium-darwin.png       | Y     | e2e-list-pages-visual-visual-organizations-en--chromium/                   |         |
| 4  | list-pages-visual          | visual organizations (ar)                     | organizations-ar-chromium-darwin.png       | Y     | e2e-list-pages-visual-visual-organizations-ar--chromium/                   |         |
| 5  | list-pages-visual          | visual persons (en)                           | persons-en-chromium-darwin.png             | Y     | e2e-list-pages-visual-visual-persons-en--chromium/                         |         |
| 6  | list-pages-visual          | visual persons (ar)                           | persons-ar-chromium-darwin.png             | Y     | e2e-list-pages-visual-visual-persons-ar--chromium/                         |         |
| 7  | list-pages-visual          | visual forums (en)                            | forums-en-chromium-darwin.png              | Y     | e2e-list-pages-visual-visual-forums-en--chromium/                          |         |
| 8  | list-pages-visual          | visual forums (ar)                            | forums-ar-chromium-darwin.png              | Y     | e2e-list-pages-visual-visual-forums-ar--chromium/                          |         |
| 9  | list-pages-visual          | visual topics (en)                            | topics-en-chromium-darwin.png              | Y     | e2e-list-pages-visual-visual-topics-en--chromium/                          |         |
| 10 | list-pages-visual          | visual topics (ar)                            | topics-ar-chromium-darwin.png              | Y     | e2e-list-pages-visual-visual-topics-ar--chromium/                          |         |
| 11 | list-pages-visual          | visual working-groups (en)                    | working-groups-en-chromium-darwin.png      | Y     | e2e-list-pages-visual-visual-working-groups-en--chromium/                  |         |
| 12 | list-pages-visual          | visual working-groups (ar)                    | working-groups-ar-chromium-darwin.png      | Y     | e2e-list-pages-visual-visual-working-groups-ar--chromium/                  |         |
| 13 | list-pages-visual          | visual engagements (en)                        | engagements-en-chromium-darwin.png         | Y     | e2e-list-pages-visual-visual-engagements-en--chromium/                     |         |
| 14 | list-pages-visual          | visual engagements (ar)                        | engagements-ar-chromium-darwin.png         | Y     | e2e-list-pages-visual-visual-engagements-ar--chromium/                     |         |
| 15 | dashboard-widgets-visual   | visual kpi-strip                              | kpi-strip.png                              | Y     | e2e-dashboard-widgets-visual-visual-kpi-strip-chromium-dashboard-widgets/  |         |
| 16 | dashboard-widgets-visual   | visual week-ahead                             | week-ahead.png                             | Y     | e2e-dashboard-widgets-visual-visual-week-ahead-chromium-dashboard-widgets/ |         |
| 17 | dashboard-widgets-visual   | visual overdue-commitments                    | overdue-commitments.png                    | Y     | e2e-dashboard-widgets-visual-visual-overdue-commitments-chromium-dashboard-widgets/ |         |
| 18 | dashboard-widgets-visual   | visual digest                                 | digest.png                                 | N     | — (passed within 0.02 tolerance; no diff emitted)                          |         |
| 19 | dashboard-widgets-visual   | visual sla-health                             | sla-health.png                             | Y     | e2e-dashboard-widgets-visual-visual-sla-health-chromium-dashboard-widgets/ |         |
| 20 | dashboard-widgets-visual   | visual vip-visits                             | vip-visits.png                             | N     | — (passed within 0.02 tolerance; no diff emitted)                          |         |
| 21 | dashboard-widgets-visual   | visual my-tasks                               | my-tasks.png                               | N     | — (passed within 0.02 tolerance; no diff emitted)                          |         |
| 22 | dashboard-widgets-visual   | visual recent-dossiers                        | recent-dossiers.png                        | N     | — (passed within 0.02 tolerance; no diff emitted)                          |         |
| 23 | kanban-visual              | ltr @ 1280x800                                | kanban-ltr-1280-chromium-darwin.png        | Y     | e2e-kanban-visual-Phase-39-c99d1-ual-regression-ltr-1280x800-chromium/     |         |
| 24 | kanban-visual              | ltr @ 768x1024                                | kanban-ltr-768-chromium-darwin.png         | Y     | e2e-kanban-visual-Phase-39-d4d15-ual-regression-ltr-768x1024-chromium/     |         |
| 25 | kanban-visual              | rtl @ 1280x800                                | kanban-rtl-1280-chromium-darwin.png        | Y     | e2e-kanban-visual-Phase-39-449b0-ual-regression-rtl-1280x800-chromium/     |         |
| 26 | kanban-visual              | rtl @ 768x1024                                | kanban-rtl-768-chromium-darwin.png         | Y     | e2e-kanban-visual-Phase-39-de910-ual-regression-rtl-768x1024-chromium/     |         |
| 27 | tasks-tab-visual           | tasks-tab ltr @ 1280x800                       | tasks-tab-ltr-1280-chromium-darwin.png     | Y     | e2e-tasks-tab-visual-Phase-4c8df-sion-tasks-tab-ltr-1280x800-chromium/     |         |
| 28 | tasks-tab-visual           | tasks-tab ltr @ 768x1024                       | tasks-tab-ltr-768-chromium-darwin.png      | Y     | e2e-tasks-tab-visual-Phase-48755-sion-tasks-tab-ltr-768x1024-chromium/     |         |
| 29 | tasks-tab-visual           | tasks-tab rtl @ 1280x800                        | tasks-tab-rtl-1280-chromium-darwin.png     | Y     | e2e-tasks-tab-visual-Phase-9dc2b-sion-tasks-tab-rtl-1280x800-chromium/     |         |
| 30 | tasks-tab-visual           | tasks-tab rtl @ 768x1024                        | tasks-tab-rtl-768-chromium-darwin.png      | Y     | e2e-tasks-tab-visual-Phase-a5d7b-sion-tasks-tab-rtl-768x1024-chromium/     |         |
| 31 | settings-page-visual       | LTR baseline @ 1280                            | settings-page-en-chromium-darwin.png       | Y     | e2e-settings-page-visual-P-2203c-gs-visual-LTR-baseline-1280-chromium/     |         |
| 32 | settings-page-visual       | AR baseline @ 1280                             | settings-page-ar-chromium-darwin.png       | Y     | e2e-settings-page-visual-P-34880-ngs-visual-AR-baseline-1280-chromium/     |         |
| 33 | settings-page-visual       | mobile pill nav @ 768                          | settings-page-mobile-chromium-darwin.png   | Y     | e2e-settings-page-visual-P-34ccf--visual-mobile-pill-nav-768-chromium/     |         |
| 34 | activity-page-visual       | LTR baseline @ 1280                            | activity-page-en-chromium-darwin.png       | Y     | e2e-activity-page-visual-P-cacc9-ty-visual-LTR-baseline-1280-chromium/     |         |
| 35 | activity-page-visual       | AR baseline @ 1280                             | activity-page-ar-chromium-darwin.png       | Y     | e2e-activity-page-visual-P-397c0-ity-visual-AR-baseline-1280-chromium/     |         |
| 36 | after-actions-page-visual  | LTR baseline @ 1280                            | after-actions-page-en-chromium-darwin.png  | Y     | e2e-after-actions-page-vis-62f81-ns-visual-LTR-baseline-1280-chromium/     |         |
| 37 | after-actions-page-visual  | AR baseline @ 1280                             | after-actions-page-ar-chromium-darwin.png  | Y     | e2e-after-actions-page-vis-04c13-ons-visual-AR-baseline-1280-chromium/     |         |
| 38 | briefs-page-visual         | LTR baseline @ 1280                            | briefs-page-en-chromium-darwin.png         | Y     | e2e-briefs-page-visual-Pha-a487c-fs-visual-LTR-baseline-1280-chromium/     |         |
| 39 | briefs-page-visual         | AR baseline @ 1280                             | briefs-page-ar-chromium-darwin.png         | Y     | e2e-briefs-page-visual-Pha-10f33-efs-visual-AR-baseline-1280-chromium/     |         |
| 40 | tasks-page-visual          | LTR baseline @ 1280                            | tasks-page-en-chromium-darwin.png          | Y     | e2e-tasks-page-visual-Phas-05973-ks-visual-LTR-baseline-1280-chromium/     |         |
| 41 | tasks-page-visual          | AR baseline @ 1280                             | tasks-page-ar-chromium-darwin.png          | Y     | e2e-tasks-page-visual-Phas-ac4f6-sks-visual-AR-baseline-1280-chromium/     |         |
| 42 | dossier-drawer-visual      | LTR @ 1280×800 — drawer visual baseline        | dossier-drawer-ltr-1280-chromium-darwin.png | Y     | e2e-dossier-drawer-visual--4c19b-00-—-drawer-visual-baseline-chromium/     |         |
| 43 | dossier-drawer-visual      | AR @ 1280×800 — drawer baseline (RTL slide)    | dossier-drawer-ar-1280-chromium-darwin.png  | Y     | e2e-dossier-drawer-visual--51a57-seline-RTL-slide-direction--chromium/     |         |

<!-- prettier-ignore-end -->

---

## 6. Reviewer pre-brief (read before triaging §5)

- **Intended-Linear palette changes are EXPECTED on every surface.** The entire point of
  v8.0 (Phases 75–79) was to replace the Bureau palette/type/radii with the Linear design
  system (`frontend/DESIGN.md`). A recolored surface that matches the Linear spec is
  `intended-Linear`, not a regression. The baseline is Bureau-light; HEAD is Linear-light.
- **Third class — `dynamic content, not theme`** (the 77-01 §1 discipline): the
  dashboard-widgets that show **date strings / row data** differ because the seed + frozen
  clock were realigned to **today (2026-07-03)**, whereas the baseline PNGs were captured
  2026-07-02. WeekAhead / VipVisits / digest date text will differ purely from the today-shift
  — classify those as dynamic content, not a theme regression. (Realigning is mandatory; the
  alternative is empty widgets → capture crash.)
- **The one a11y-driven visual change on a baselined surface:** the semantic **status chips**
  on the list-pages surfaces pale slightly — Plan 80-03 commit `556f20705` moved them to the
  AA-proven `--status-N-soft` washes (`frontend/src/styles/list-pages.css`) to satisfy
  VERIFY-02 color-contrast MF-1/2/3. Expect a subtle chip-background lightening on the
  `list-pages-visual` shots (rows 1–14); this is an **intended** accessibility fix, not damage.
- **The 4 "passed" dashboard widgets (rows 18, 20, 21, 22)** fell **within** the 0.02 widget
  `maxDiffPixelRatio` tolerance — they are **not** necessarily byte-identical to the Bureau
  baseline; they simply changed less than the 2% gate threshold (small colored-pixel surface
  relative to whitespace). No triad was emitted and no verdict row is required, but they are
  listed for completeness so the coverage is provably the full 43.

---

## 7. Coverage statement — EXPLICIT, no silent expansion (VERIFY-01)

- **Scope is exactly the 10 baselined specs / 43 tests** captured in the 77-01 gate — the
  same matrix, replayed like-for-like (Bureau-light baseline vs Linear-light HEAD, EN+AR
  wherever a spec already does both). **No coverage was expanded.**
- **Four exclusions, restated verbatim (unchanged from 77-01 §5 — never silently added):**
  1. **`calendar-visual.spec.ts`** — non-baselined stub, **0 committed PNGs**; excluded.
  2. **`dashboard-visual.spec.ts`** — non-baselined stub, **0 committed PNGs**; excluded
     (capturing it would newly baseline dark shots, contradicting "dark only via qa-sweep").
  3. **`tests/visual/theme-visual.spec.ts`** — stale legacy (dead `gastat`/`blue-sky`
     themes), outside the frontend config `testMatch` (`e2e/**` + `accessibility/**`); excluded.
  4. **`qa-sweep-focus-outline.spec.ts`** — structurally replaced; already recaptured
     **Linear** in 77-07 commit `229a39c8a` (2 Linear PNGs; the 8 old direction-matrix shots
     were deleted). **Not part of this re-compare.**
- **Baseline PNGs remain byte-identical to their `14191cb85` lineage** — see §9.

---

## 8. Interim change attribution (14191cb85 → 4b90866b4)

Beyond the whole Phase-77/79 **Linear migration** (the intended palette/type/radii change on
every surface), the only src-mutating changes between the baseline lineage and this replay
that can touch a baselined surface are the Plan 80-03 a11y fixes:

<!-- prettier-ignore-start -->

| Commit       | Date       | Subject                                                                                   | Pixel impact on baselined surfaces                                        |
| ------------ | ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `556f20705`  | 2026-07-03 | fix(80-03): semantic chips use AA-proven -soft washes (VERIFY-02 MF-1/2/3 color-contrast)  | **Yes** — `frontend/src/styles/list-pages.css`; status-chip wash paling on rows 1–14 (see §6) |
| `b3283a9c9`  | 2026-07-03 | test(80-03): record engagements aria-required-* pre-migration baseline; repoint dead test:a11y | **None** — test spec + `package.json` script only; no rendered pixels     |

<!-- prettier-ignore-end -->

This makes every diff cause fully attributable: Linear migration (intended, everywhere) +
the `556f20705` chip-contrast fix (intended, list-pages) + today-shift dynamic content
(dashboard-widgets).

---

## 9. Anti-laundering control status (T-80-10)

- **Tripwire:** `git status --porcelain -- 'frontend/tests/e2e/*-snapshots' 'frontend/tests/e2e/__snapshots__'`
  → **EMPTY**. Zero baseline PNGs modified by the replay. **PASS.**
- The replay carried `--retries=0` and **no `--update-snapshots`** — diff evidence is
  preserved, not destroyed.
- The only working-tree source change is the `FROZEN_TIME` realignment in
  `dashboard-widgets-visual.spec.ts` (§3). No PNG under either snapshot root changed.
- Recapture (`--update-snapshots`) is deferred to **Plan 80-05** and is reachable **only after**
  the Task-3 verdicts below are approved. The Bureau lineage stays recoverable at `14191cb85`.

---

## 10. Human triage record (Task 3 — TO BE COMPLETED BY THE HUMAN)

> This section is intentionally left for the human diff-triage checkpoint. The executor did
> **not** adjudicate any diff. Fill each Verdict cell in §5, then complete the block below.

**Regressions to fix (for Plan 80-05):** _(to be extracted from the `regression` verdicts — may be empty)_

- …

**Approval line:** _(reviewer name — date — "triage complete: all 43 surfaces adjudicated")_

- Reviewer:
- Date:
- Statement:
