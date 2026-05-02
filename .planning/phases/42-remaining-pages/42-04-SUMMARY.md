---
phase: 42-remaining-pages
plan: 04
subsystem: testing-infra
tags:
  - phase-42
  - playwright
  - fixtures
  - wave-0
  - test-scaffolds
requirements:
  - PAGE-01
  - PAGE-02
  - PAGE-03
  - PAGE-04
  - PAGE-05
dependency_graph:
  requires:
    - 'frontend/tests/e2e/support/list-pages-auth.ts (loginForListPages — Phase 40-10)'
    - '@playwright/test (existing)'
    - '@axe-core/playwright (existing)'
  provides:
    - 'phase-42-fixtures.ts: setupPhase42Test / gotoPhase42Page / switchToArabic / PHASE_42_ROUTES'
    - '5 visual regression specs (briefs / after-actions / tasks / activity / settings)'
    - '5 functional E2E specs (one per page)'
    - '1 axe-core WCAG AA gate spec (10 scenarios)'
    - '1 touch-targets gate spec (5 scenarios)'
  affects:
    - 'Phase 42 Wave 1 plans 05-09 — un-skip per-page specs after each reskin'
    - 'Phase 42 Wave 2 plan 10 — generate visual baselines via --update-snapshots'
    - 'Phase 42 Wave 2 plan 11 — un-skip cross-page axe + touch-targets gates'
tech_stack:
  added: []
  patterns:
    - 'Phase 40-17 G7 determinism stack (clock freeze + transition suppression + ready marker + fonts.ready)'
    - 'test.skip enumerable scaffolds (suite green pre-Wave-1; flips to test() per reskin)'
    - 'axe-core scope via .include(".page") to avoid coupling Phase 42 gates to shell-level violations'
key_files:
  created:
    - frontend/tests/e2e/support/phase-42-fixtures.ts
    - frontend/tests/e2e/briefs-page-visual.spec.ts
    - frontend/tests/e2e/after-actions-page-visual.spec.ts
    - frontend/tests/e2e/tasks-page-visual.spec.ts
    - frontend/tests/e2e/activity-page-visual.spec.ts
    - frontend/tests/e2e/settings-page-visual.spec.ts
    - frontend/tests/e2e/briefs-page.spec.ts
    - frontend/tests/e2e/after-actions-page.spec.ts
    - frontend/tests/e2e/tasks-page.spec.ts
    - frontend/tests/e2e/activity-page.spec.ts
    - frontend/tests/e2e/settings-page.spec.ts
    - frontend/tests/e2e/page-42-axe.spec.ts
    - frontend/tests/e2e/touch-targets-42.spec.ts
  modified: []
decisions:
  - 'Re-export loginForListPages from phase-42-fixtures so Wave 1 specs only import a single module'
  - 'Use test.skip rather than test.fixme — preserves enumeration count in --list output'
  - 'Settings visual spec adds a 3rd test.skip for mobile @ 768 (per plan instructions)'
  - 'page-42-axe scopes via .include(".page") to match the page-content boundary, not the app shell'
metrics:
  completed_date: 2026-05-02
  duration_seconds: ~600
---

# Phase 42 Plan 04: Playwright Test Infrastructure Scaffolds Summary

Authored 13 Playwright spec scaffolds + 1 fixture helper that unblock the 5 Wave 1 page reskins (Briefs / After-actions / Tasks / Activity / Settings). All specs ship as `test.skip` so the suite stays green until each Wave 1 plan flips its page's specs to `test(...)` after the JSX lands. The determinism stack — frozen clock, suppressed transitions, `[data-loading="false"]` ready marker, `document.fonts.ready` wait — is reused verbatim from Phase 40-17 G7 so visual baselines drop in cleanly when Wave 2 plan 10 generates them.

## What Shipped

### Fixture helper

**`frontend/tests/e2e/support/phase-42-fixtures.ts`** exports:

- `PHASE_42_ROUTES` — canonical route map for the 5 pages
- `Phase42Route` type alias
- `FROZEN_TIME` (`2026-04-26T12:00:00Z`)
- `SUPPRESS_TRANSITIONS_CSS` (kills CSS animation residue)
- `gotoPhase42Page(page, route)` — navigate + ready-marker + fonts.ready + clock tick
- `setupPhase42Test({ page })` — clock freeze + init script + login (canonical `beforeEach`)
- `switchToArabic(page)` — locale toggle for AR baselines
- Re-exports `loginForListPages` from `list-pages-auth.ts`

### Visual regression scaffolds (5 files)

| File                              | Cases (all `test.skip`)                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| briefs-page-visual.spec.ts        | LTR @ 1280, AR @ 1280                                               |
| after-actions-page-visual.spec.ts | LTR @ 1280, AR @ 1280                                               |
| tasks-page-visual.spec.ts         | LTR @ 1280, AR @ 1280                                               |
| activity-page-visual.spec.ts      | LTR @ 1280, AR @ 1280                                               |
| settings-page-visual.spec.ts      | LTR @ 1280, AR @ 1280, **mobile @ 768** (per plan instructions)     |

Total: **11 visual cases** (10 desktop + 1 settings-mobile). Wave 2 plan 10 generates the baselines via `--update-snapshots`.

### Functional E2E scaffolds (5 files)

| File                       | Cases (`test.skip`)                                          |
| -------------------------- | ------------------------------------------------------------ |
| briefs-page.spec.ts        | card grid render · card-click → BriefViewer · CTA → BriefGenerationPanel |
| after-actions-page.spec.ts | `.tbl` 6-col render · row click → `/after-actions/$id`       |
| tasks-page.spec.ts         | `.tasks-list` render · done-toggle no-nav · Assigned/Contributed tabs |
| activity-page.spec.ts      | `.act-list` 3-col grid · All/Following tabs                  |
| settings-page.spec.ts      | 240+1fr layout w/ active accent bar · ≤768px pill nav        |

### Cross-page gate scaffolds (2 files)

| File                       | Cases (`test.skip`)                                                  |
| -------------------------- | -------------------------------------------------------------------- |
| page-42-axe.spec.ts        | 5 pages × (LTR + AR) = **10 axe-core WCAG AA scenarios**             |
| touch-targets-42.spec.ts   | 5 pages × ≥44×44 boundingBox sample (5 scenarios)                    |

## Verification Evidence

**Playwright `--list` output (truncated to Phase 42 spec files):**

```
Total: 38 tests in 12 files
```

Breakdown by spec file:
- `briefs-page-visual.spec.ts` — 2 cases
- `briefs-page.spec.ts` — 3 cases
- `after-actions-page-visual.spec.ts` — 2 cases
- `after-actions-page.spec.ts` — 2 cases
- `tasks-page-visual.spec.ts` — 2 cases
- `tasks-page.spec.ts` — 3 cases
- `activity-page-visual.spec.ts` — 2 cases
- `activity-page.spec.ts` — 2 cases
- `settings-page-visual.spec.ts` — 3 cases
- `settings-page.spec.ts` — 2 cases
- `page-42-axe.spec.ts` — 10 cases
- `touch-targets-42.spec.ts` — 5 cases

= **38 enumerated cases across 12 spec files**, all currently `test.skip`. The 13th spec asset is the fixture helper (`support/phase-42-fixtures.ts`) which contains no `test()` calls, so Playwright treats it as a non-spec module — total file count from `git status` is **14**.

**TypeScript strict mode:** `npx tsc --noEmit` reports zero errors on the 13 new files (the fixture helper + 12 spec files).

**File-deletion check:** none — all changes are additive.

## Commits

| Hash       | Message                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `efdb51ce` | test(42-04): add phase-42 fixtures helper                                |
| `6a11a52e` | test(42-04): add 5 visual regression spec scaffolds                      |
| `dd274813` | test(42-04): add 5 functional + axe + touch-targets spec scaffolds       |

## Deviations from Plan

None — plan executed exactly as written. Each spec template was instantiated verbatim per the substitution table in plan task 2; functional spec contents matched the plan's per-page golden-path bullets.

## Threat Surface

No new threat surface introduced. The plan's `<threat_model>` already accepts the auth re-use (`loginForListPages` reuses `$TEST_USER_EMAIL`/`$TEST_USER_PASSWORD`) and notes that visual baselines are reviewed in Wave 2 plan 10's checkpoint — both unchanged here since no baselines are generated this plan.

## Known Stubs

All 38 cases ship as `test.skip`. This is the **intentional design**: each Wave 1 page reskin (plans 42-05..09) flips its page's specs to `test(...)` after the JSX lands; Wave 2 plans 42-10 / 42-11 finalize the cross-page baselines and gates. Plan 42-04 is explicitly a scaffolding plan, not an enabling plan. No follow-up wiring is needed; downstream plans own un-skipping the relevant cases.

## Self-Check: PASSED

**Files created (verified via `test -f`):**
- FOUND: frontend/tests/e2e/support/phase-42-fixtures.ts
- FOUND: frontend/tests/e2e/briefs-page-visual.spec.ts
- FOUND: frontend/tests/e2e/after-actions-page-visual.spec.ts
- FOUND: frontend/tests/e2e/tasks-page-visual.spec.ts
- FOUND: frontend/tests/e2e/activity-page-visual.spec.ts
- FOUND: frontend/tests/e2e/settings-page-visual.spec.ts
- FOUND: frontend/tests/e2e/briefs-page.spec.ts
- FOUND: frontend/tests/e2e/after-actions-page.spec.ts
- FOUND: frontend/tests/e2e/tasks-page.spec.ts
- FOUND: frontend/tests/e2e/activity-page.spec.ts
- FOUND: frontend/tests/e2e/settings-page.spec.ts
- FOUND: frontend/tests/e2e/page-42-axe.spec.ts
- FOUND: frontend/tests/e2e/touch-targets-42.spec.ts

**Commits (verified via `git log`):**
- FOUND: efdb51ce
- FOUND: 6a11a52e
- FOUND: dd274813
