---
phase: 46
slug: visual-baseline-regeneration
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-08
---

# Phase 46 - Validation Strategy

## Test Infrastructure

| Property           | Value                                                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Playwright 1.58.2 visual regression                                                                                                                                                                                                                 |
| Config file        | `frontend/playwright.config.ts`                                                                                                                                                                                                                     |
| Quick run command  | `doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets`                                                                                                                                       |
| Full suite command | `doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets` and `doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts dossier-drawer-visual.spec.ts --project=chromium` |
| Estimated runtime  | 5-15 minutes depending on staging and browser setup                                                                                                                                                                                                 |

## Sampling Rate

- After each baseline-regeneration plan: rerun the same spec without
  `--update-snapshots`.
- Before Phase 46 verification: run all three visual targets without
  `--update-snapshots`.
- Manual review must happen after baseline files are generated and before final
  verification.
- Max feedback latency: one plan.

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                    | Threat Ref | Secure Behavior                                                           | Test Type | Automated Command                                                                                                                                                                                                                                                   | File Exists                | Status                                                                                                              |
| -------- | ---- | ---- | ------------------------------ | ---------- | ------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 46-01-01 | 01   | 1    | VIS-01                         | T-46-01    | Widget baselines are tied to stable locators, not fragile layout position | source    | `rg "dashboard-widget-kpi-strip                                                                                                                                                                                                                                     | chromium-dashboard-widgets | **snapshots**/dashboard-widgets" frontend/tests/e2e/dashboard-widgets-visual.spec.ts frontend/playwright.config.ts` | PASS | DONE |
| 46-01-02 | 01   | 1    | VIS-01, VIS-04                 | T-46-02    | Dashboard widget snapshots come from seeded staging data                  | visual    | `doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets`                                                                                                                                                       | PASS                       | DONE                                                                                                                |
| 46-02-01 | 02   | 1    | VIS-02, VIS-04                 | T-46-03    | List-page visual snapshots use the Phase 40 deterministic spec            | visual    | `doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium`                                                                                                                                                                 | PASS                       | DONE                                                                                                                |
| 46-03-01 | 03   | 1    | VIS-03, VIS-04                 | T-46-04    | Drawer snapshots reflect post-token-darkening contrast                    | visual    | `doppler run -- pnpm -C frontend exec playwright test dossier-drawer-visual.spec.ts --project=chromium`                                                                                                                                                             | PASS                       | DONE                                                                                                                |
| 46-04-01 | 04   | 2    | VIS-01, VIS-02, VIS-03, VIS-04 | T-46-05    | CI/no-update replay catches uncommitted or stale baselines                | visual    | `CI=true doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets` and `CI=true doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts dossier-drawer-visual.spec.ts --project=chromium` | PASS                       | IN PROGRESS                                                                                                         |

## Baseline Inventory And Human Review Log

Fill `Result` with `PASS`, `DEVIATION`, or `REJECTED`. If Playwright emits a
platform-specific filename different from the expected path below, replace the
path with the exact file that was committed.

| Requirement | Surface            | Baseline file                                                                                            | Handoff reference                        | Result | Reviewer notes                                                                             |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| VIS-01      | KpiStrip           | `frontend/tests/e2e/__snapshots__/dashboard-widgets/kpi-strip.png`                                       | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | WeekAhead          | `frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png`                                      | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | OverdueCommitments | `frontend/tests/e2e/__snapshots__/dashboard-widgets/overdue-commitments.png`                             | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | Digest             | `frontend/tests/e2e/__snapshots__/dashboard-widgets/digest.png`                                          | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | SlaHealth          | `frontend/tests/e2e/__snapshots__/dashboard-widgets/sla-health.png`                                      | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | VipVisits          | `frontend/tests/e2e/__snapshots__/dashboard-widgets/vip-visits.png`                                      | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | MyTasks            | `frontend/tests/e2e/__snapshots__/dashboard-widgets/my-tasks.png`                                        | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-01      | RecentDossiers     | `frontend/tests/e2e/__snapshots__/dashboard-widgets/recent-dossiers.png`                                 | `reference/dashboard.png`                | PASS   | Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible. |
| VIS-02      | Countries EN       | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/countries-en-chromium-darwin.png`                | `reference/countries.png`                | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Countries AR       | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/countries-ar-chromium-darwin.png`                | `reference/countries.png`                | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Organizations EN   | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/organizations-en-chromium-darwin.png`            | `reference/organizations.png`            | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Organizations AR   | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/organizations-ar-chromium-darwin.png`            | `reference/organizations.png`            | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Persons EN         | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/persons-en-chromium-darwin.png`                  | `reference/dashboard.png` card aesthetic | PASS   | Matches dashboard card aesthetic; locale and direction checked.                            |
| VIS-02      | Persons AR         | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/persons-ar-chromium-darwin.png`                  | `reference/dashboard.png` card aesthetic | PASS   | Matches dashboard card aesthetic; locale and direction checked.                            |
| VIS-02      | Forums EN          | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/forums-en-chromium-darwin.png`                   | `reference/forums.png`                   | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Forums AR          | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/forums-ar-chromium-darwin.png`                   | `reference/forums.png`                   | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Topics EN          | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/topics-en-chromium-darwin.png`                   | `reference/forums.png` row parity        | PASS   | Matches forums row parity; locale and direction checked.                                   |
| VIS-02      | Topics AR          | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/topics-ar-chromium-darwin.png`                   | `reference/forums.png` row parity        | PASS   | Matches forums row parity; locale and direction checked.                                   |
| VIS-02      | Working Groups EN  | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/working-groups-en-chromium-darwin.png`           | `reference/forums.png` row parity        | PASS   | Matches forums row parity; locale and direction checked.                                   |
| VIS-02      | Working Groups AR  | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/working-groups-ar-chromium-darwin.png`           | `reference/forums.png` row parity        | PASS   | Matches forums row parity; locale and direction checked.                                   |
| VIS-02      | Engagements EN     | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/engagements-en-chromium-darwin.png`              | `reference/engagements.png`              | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-02      | Engagements AR     | `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/engagements-ar-chromium-darwin.png`              | `reference/engagements.png`              | PASS   | Matches named handoff reference; locale and direction checked.                             |
| VIS-03      | Dossier Drawer LTR | `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/dossier-drawer-ltr-1280-chromium-darwin.png` | drawer handoff source                    | PASS   | Matches drawer handoff contract after token darkening; direction checked.                  |
| VIS-03      | Dossier Drawer AR  | `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/dossier-drawer-ar-1280-chromium-darwin.png`  | drawer handoff source                    | PASS   | Matches drawer handoff contract after token darkening; direction checked.                  |

## Manual-Only Verifications

| Behavior                | Requirement | Why Manual                                       | Test Instructions                                                                                                                  |
| ----------------------- | ----------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard widget parity | VIS-01      | First widget-level baselines need human approval | Compare each widget PNG against `reference/dashboard.png`; confirm Digest source is a publication and VipVisits uses country flags |
| List-page parity        | VIS-02      | Page aesthetics require human comparison         | Compare 14 list baselines to the listed handoff references; confirm AR flow and Tajawal render                                     |
| Drawer parity           | VIS-03      | Token-darkening effect is visual                 | Compare both drawer PNGs after token darkening; confirm contrast, slide side, and card/body spacing                                |
| Evidence completeness   | VIS-04      | Human sign-off is the phase deliverable          | Ensure every row above has a non-pending Result and reviewer note                                                                  |

## Validation Sign-Off

- [ ] 8 dashboard widget baselines generated and committed.
- [ ] 14 list-page baselines regenerated and committed.
- [ ] 2 drawer baselines regenerated and committed.
- [ ] All 24 baseline rows have human review results.
- [ ] No-update Playwright replay passes.
- [ ] Focused CI visual job or equivalent `CI=true` replay passes.
- [ ] `nyquist_compliant: true` set in frontmatter.
