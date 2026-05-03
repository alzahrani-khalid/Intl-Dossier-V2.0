---
phase: 43-rtl-a11y-responsive-sweep
plan: 01
subsystem: qa
tags: [qa, axe, a11y, playwright, sweep]
requires:
  - 43-00 (V6_ROUTES, runAxe, settlePage, loginForListPages)
provides:
  - Cross-cutting axe sweep × 15 routes × 2 locales = 30 tests
affects:
  - frontend/tests/e2e/ (new spec only, no edits to per-phase specs)
tech-stack:
  added: []
  patterns:
    - 'Wave 1 sweep pattern (per-phase specs untouched, cross-cutting layer added)'
    - 'Helpers-only delegation (no inline AxeBuilder)'
key-files:
  created:
    - frontend/tests/e2e/qa-sweep-axe.spec.ts
  modified: []
decisions:
  - 'No inline axe filter — delegated to runAxe() so the serious|critical gate stays single-sourced'
  - 'No test.describe.configure({ mode: parallel }) — inherit Playwright defaults per plan'
  - 'No custom timeouts — global expect.timeout from playwright.config.ts is sufficient'
metrics:
  duration: ~10 min
  tasks_completed: 1
  files_changed: 1
  commits: 1
completed: 2026-05-03T20:49:45Z
---

# Phase 43 Plan 01: qa-sweep-axe — Summary

One-liner: Cross-cutting axe-core WCAG 2A/2AA sweep wired against the v6.0 route registry — 15 routes × EN+AR = 30 hard-blocking a11y tests delegated to Wave 0 helpers.

## Objective Recap

QA-02 cross-cutting gate: catch a11y regressions per-phase specs miss by running a single axe sweep against every v6.0 route in both locales, with all filter/auth/skeleton-wait logic delegated to the Wave 0 helpers.

## Tasks Executed

| Task | Name                                                           | Commit     | Files                                     |
| ---- | -------------------------------------------------------------- | ---------- | ----------------------------------------- |
| 1    | Create qa-sweep-axe.spec.ts (15 routes × 2 locales = 30 tests) | `4c0db1ca` | `frontend/tests/e2e/qa-sweep-axe.spec.ts` |

## Verification

All plan-defined automated checks passed:

- `test -f frontend/tests/e2e/qa-sweep-axe.spec.ts` → exists
- `grep -q "import { V6_ROUTES } from './helpers/v6-routes'"` → present
- `grep -q "import { runAxe, settlePage } from './helpers/qa-sweep'"` → present
- `grep -q "import { loginForListPages } from './support/list-pages-auth'"` → present
- `grep -q "for (const route of V6_ROUTES)"` → present
- `grep -q "for (const locale of route.locales)"` → present
- `grep -q "await runAxe(page)"` → present
- `grep -q "await settlePage(page)"` → present
- No inline `AxeBuilder` → confirmed
- `pnpm -C frontend exec playwright test qa-sweep-axe.spec.ts --list` → **`Total: 30 tests in 1 file`**

## Test Enumeration (30 tests, alphabetised by route)

dashboard, kanban, calendar, countries, organizations, persons, forums, topics, working_groups, engagements, briefs, after_actions, tasks, activity, settings — each × `[en, ar]` = 30 independent `test()` blocks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `culori` dependency**

- **Found during:** Task 1 verification (`playwright test --list`)
- **Issue:** `qa-sweep.ts` (Wave 0) imports `helpers/contrast.ts`, which imports `culori` — but `culori` was declared in `frontend/package.json` (devDependency 4.0.2) without a corresponding `pnpm install` in the worktree environment, so the spec module graph failed to load with `Cannot find package 'culori'`.
- **Fix:** Ran `pnpm install` from `frontend/` in the main repo root; `culori 4.0.2` was added; symlinked `node_modules` from the main repo into the worktree (kept untracked, not committed) so the verify command could resolve the dependency tree. No code or package.json edits.
- **Files modified:** none (install only; symlinks are untracked)
- **Why this isn't a Wave 0 defect to file:** The package was correctly declared in `package.json`; the issue was environment-only (worktree had no `node_modules`). No further action required for the Wave 1 sweeps.

### Linter-touched

Pre-commit lint-staged + prettier reformatted the spec to compress the `test()` arrow body to a single physical line. Behaviour unchanged; all grep checks still pass against the post-format file.

## Threat Model Compliance

| Threat ID | Disposition | Outcome                                                                                                                                                                         |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-43-04   | accept      | Filter remains `serious \| critical` via `runAxe` — matches Phase 38–42 precedent. No change.                                                                                   |
| T-43-05   | mitigate    | Sweep uses existing `loginForListPages` which throws on missing `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` (Phase 40 AUTH-FIX). No new auth path. Plan 43-07 will execute the gate. |

## Authentication Gates

None encountered — verification used `--list` which does not boot Playwright sessions. Gate execution (Plan 43-07) will surface any auth env issues at run time.

## Self-Check: PASSED

- `frontend/tests/e2e/qa-sweep-axe.spec.ts` → present (`git ls-files` confirms)
- Commit `4c0db1ca` → present in `git log --oneline`
- 30 test enumeration → reproduced post-commit

## Notes for Downstream

- Wave 1 sibling sweeps (`qa-sweep-responsive`, `qa-sweep-keyboard`, `qa-sweep-focus-outline`, `qa-sweep-icon-screenshots`) follow the same import shape — `V6_ROUTES` + Wave 0 helpers + `loginForListPages`.
- Plan 43-07 is the gate runner — it executes this spec with real env credentials. Any actual a11y violations are remediated inside Phase 43, not deferred.
