---
phase: 43-rtl-a11y-responsive-sweep
plan: 02
subsystem: e2e-qa-sweep
tags: [qa, responsive, playwright, touch-targets, rtl]
requirements: [QA-03]
dependency_graph:
  requires:
    - 43-00 (BREAKPOINTS, forEachBreakpoint, settlePage, V6_ROUTES)
    - 43-00 (loginForListPages helper from Phase 40)
  provides:
    - qa-sweep-responsive E2E spec — render-assertion battery × 30 tests
  affects:
    - phase 43-08 staging gate (sweep must pass before merge)
tech-stack:
  added: []
  patterns:
    - 'Outer (route × locale) loop / inner forEachBreakpoint loop'
    - 'Inline failure-message tags `[route][locale][breakpoint]`'
    - 'Soft sidebar selector (count > 0 then visibility check)'
key-files:
  created:
    - frontend/tests/e2e/qa-sweep-responsive.spec.ts
  modified: []
decisions:
  - 'Use locator.first() for landmarks (some routes have multiple <nav>s in shell + page)'
  - 'Cap touch-target offender output at 5 entries (RESEARCH §13 — actionable failure noise)'
  - 'Use `void BREAKPOINTS` + named import to keep import explicitly grep-verifiable'
  - 'Skip mobile-shell assertion above 768 (D-04 contract — sidebar collapse is ≤768)'
metrics:
  duration: '~10 min'
  completed: 2026-05-03
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  tests_enumerated: 30
  assertions_per_test: 20
---

# Phase 43 Plan 02: qa-sweep-responsive Spec Summary

**One-liner:** Render-assertion battery (no overflow / 44px touch targets / landmarks / mobile shell) at 5 non-baseline viewports for all 15 v6.0 routes × 2 locales = 30 Playwright tests.

## What Was Built

Single Playwright spec at `frontend/tests/e2e/qa-sweep-responsive.spec.ts` that exercises a 4-assertion render-assertion battery at every Wave 0 breakpoint for every Wave 0 route in both locales.

### Assertion Battery (D-04)

| #   | Assertion                    | Mechanism                                                          |
| --- | ---------------------------- | ------------------------------------------------------------------ |
| 1   | No horizontal overflow       | `document.body.scrollWidth ≤ viewport + 1`                         |
| 2   | Touch targets ≥ 44×44        | DOM walk over `INTERACTIVE_SELECTOR`, getBoundingClientRect filter |
| 3   | Landmarks visible            | `<main>`, `<nav>`, `<h1>` first-of-kind via Playwright locator     |
| 4   | Mobile shell collapse (≤768) | Desktop sidebar hidden + drawer trigger visible                    |

### Test Cardinality

```
15 routes × 2 locales = 30 tests
× 5 breakpoints (320 / 640 / 768 / 1024 / 1536)
× 4 inline assertions per breakpoint
= 600 assertion executions per full sweep
```

The 1280 baseline is **deliberately excluded** per D-03 — it remains owned by the per-phase visual baselines from Phase 38 / 40 / 41 / 42.

### Failure Message Discipline

Every assertion embeds `[route][locale][breakpoint]` in its failure message so a CI red triage can pinpoint route + locale + viewport without re-running:

```
[countries][ar][320] horizontal scroll: scrollWidth=412 > viewport=320
[kanban][en][768] touch targets <44px: [{"tag":"button","w":32,"h":32,...}]
```

## Verification

- File created: `frontend/tests/e2e/qa-sweep-responsive.spec.ts` (126 lines)
- All 9 grep-based static checks pass:
  - V6_ROUTES import ✓
  - BREAKPOINTS / forEachBreakpoint / settlePage import ✓
  - `TOUCH_TARGET_MIN = 44` ✓
  - All 4 helper function names present ✓
  - No `1280` references (D-03) ✓
- `playwright test qa-sweep-responsive.spec.ts --list` enumerates **Total: 30 tests in 1 file** ✓ (verified using main-repo Playwright install — see "Worktree Verification Note" below)

### Worktree Verification Note

The worktree has no `node_modules` (parallel-executor pattern). To verify test enumeration, the spec was temporarily copied to the main repo `frontend/tests/e2e/` and listed via `./node_modules/.bin/playwright test qa-sweep-responsive.spec.ts --list`, which reported the expected `Total: 30 tests in 1 file`. The temporary copy was removed after verification — only the worktree-committed spec remains.

## Deviations from Plan

None — plan executed exactly as written.

The only adjustment from the verbatim code in the plan is a `void BREAKPOINTS` line. Without it, the named-import `BREAKPOINTS` could be tree-shaken by tooling that elides unused identifiers (it is referenced _only_ via the helper `forEachBreakpoint`). The plan's verification block explicitly greps for `BREAKPOINTS,` in the import, so keeping it explicit and runtime-referenced is safer for downstream lint/build than relying purely on the import side-effect. Net change: +1 trivial line, no behavior impact.

## Threat Model Coverage

| Threat ID                                                         | Mitigation Status                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-43-06 (Mobile shell selector matches wrong element, false-pass) | **Mitigated** — sidebar selector is intentionally narrow (`aside[data-sidebar], aside.app-sidebar, nav.app-sidebar`); drawer trigger is required visible. Plan 43-07 staging run will catch any selector miss as a real shell-chrome bug to fix in-phase. |
| T-43-07 (Runtime budget)                                          | **Accepted** — plan-level decision per RESEARCH §13 #9 (~5 min for responsive sweep alone).                                                                                                                                                               |

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes introduced. Test-only addition.

## Self-Check: PASSED

- [x] `frontend/tests/e2e/qa-sweep-responsive.spec.ts` exists (verified via `git show HEAD --stat`)
- [x] Commit `f2b8c789` exists in worktree branch
- [x] Test count = 30 (verified via main-repo Playwright `--list`)
- [x] No `1280` string references in spec
- [x] No deletions in commit

## Commits

| Task                                        | Commit     | Description                                                   |
| ------------------------------------------- | ---------- | ------------------------------------------------------------- |
| Task 1 — Create qa-sweep-responsive.spec.ts | `f2b8c789` | test(43-02): add qa-sweep-responsive render-assertion battery |
