---
phase: 43-rtl-a11y-responsive-sweep
plan: 05
subsystem: qa-tooling
tags: [qa, icons, screenshots, advisory, opt-in, e2e, playwright]

dependency-graph:
  requires:
    - 43-00 (Wave 0 infra: docs:rtl-icons script + test:qa-sweep exclusion)
  provides:
    - opt-in icon screenshot generator spec (22 tests, 11 fixtures × 2 directions)
    - PNG fixture pipeline from `pnpm -C frontend docs:rtl-icons` to `docs/rtl-icons/`
  affects:
    - Plan 43-06 (rtl-icons.md author) — consumes the regenerable PNG pairs
    - Plan 43-07 (rotate-180 → .icon-flip migration) — selectors assume migration has landed
    - Plan 43-08 (gate) — confirms spec is NOT in test:qa-sweep / CI

tech-stack:
  added: []
  patterns:
    - 'ESM-safe __dirname via fileURLToPath(import.meta.url) (frontend `"type": "module"`)'
    - 'Scoped /* eslint-disable no-restricted-syntax */ block for icon-identifier false positives'
    - 'Reuses Phase 40 loginForListPages helper for both en + ar locales'

key-files:
  created:
    - frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts
  modified: []

decisions:
  - 'Used fileURLToPath(import.meta.url) instead of __dirname — frontend package is "type": "module" (ESM), so __dirname is undefined in spec scope'
  - 'Scoped eslint-disable on iconFixtures block (not per-line) — readable, single comment explains the rule false-positives on icon component identifiers like `chevron-right-table`'
  - 'Did NOT generate or commit PNG fixtures (parallel_execution note + plan body) — fixture generation lives in Plan 43-07; this plan authors only the spec'

metrics:
  duration: ~10 min
  completed: 2026-05-03
  tasks: 1
  files_changed: 1
  commits: 2
---

# Phase 43 Plan 05: Opt-in icon screenshot generator Summary

Authored `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` — an opt-in
Playwright spec that captures LTR + RTL screenshot pairs of every documented
directional icon and writes them to `docs/rtl-icons/{name}-{ltr|rtl}.png`.

Per CONTEXT D-06 + D-10 the spec is **advisory, never a CI gate**. It is
invoked only via `pnpm -C frontend docs:rtl-icons` (script wired by Wave 0)
and is explicitly absent from the blocking `test:qa-sweep` script.

## Tasks Completed

| #   | Name                                                        | Commits                | Files                                                  |
| --- | ----------------------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| 1   | Create qa-sweep-icon-screenshots.spec.ts (advisory, opt-in) | `d028103f`, `268905ce` | `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` |

Two commits for Task 1: the first landed the spec; the second added the
scoped `no-restricted-syntax` eslint-disable after the pre-commit hook
flagged false positives on icon-identifier strings (see Deviations below).

## Key Decisions

- **ESM `__dirname`:** Frontend is `"type": "module"`, so the plan's literal
  `__dirname` reference fails at module load (matches the pre-existing repo
  bug noted in `kanban-filters.spec.ts`). Resolved via
  `fileURLToPath(import.meta.url)` so the spec lists and runs cleanly.
- **Scoped eslint-disable on iconFixtures:** The repo's
  `no-restricted-syntax` rule (`Literal[value=/\bright-/]`) targets Tailwind
  classes but matches any string containing `right-`, including icon
  identifiers like `chevron-right-table`. Wrapped only the iconFixtures array
  in `eslint-disable / eslint-enable` with a comment explaining the
  false positive — keeps fixture names readable and traceable to the icon
  components they document.
- **No PNG generation in this plan:** The parallel_execution note and the
  plan body both make this an authoring-only task. Plan 43-07 owns running
  `pnpm docs:rtl-icons` after the `rotate-180 → .icon-flip` migration lands.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] ESM scope: `__dirname` undefined**

- **Found during:** Task 1 verification (`playwright test --list`)
- **Issue:** Frontend `package.json` declares `"type": "module"`, so
  `__dirname` is not defined in the spec's module scope. Playwright failed
  to enumerate any tests with
  `ReferenceError: __dirname is not defined in ES module scope`.
- **Fix:** Imported `fileURLToPath` from `node:url` and reconstructed
  `__dirname` from `import.meta.url` before the `OUT_DIR` resolution.
- **Files modified:** `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts`
- **Commit:** `d028103f`

**2. [Rule 1 — Bug] ESLint `no-restricted-syntax` false positive on icon names**

- **Found during:** Task 1 commit (lint-staged pre-commit hook)
- **Issue:** The repo's RTL-safety rule fires on any string literal matching
  `\bright-` to catch Tailwind classes like `mr-4` / `right-0`. The icon
  fixture names (`chevron-right-table`, `arrow-right-vip`,
  `arrow-up-right-overdue`, `chevron-right-list`, `chevron-right-persons`)
  also match — 5 errors blocked the commit.
- **Fix:** Wrapped the `iconFixtures` array in a scoped
  `/* eslint-disable no-restricted-syntax */` ...
  `/* eslint-enable no-restricted-syntax */` pair with a comment explaining
  these are icon component identifiers, not Tailwind classes.
- **Files modified:** `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts`
- **Commit:** `268905ce`

## Verification

- File exists at `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` ✓
- 11 iconFixtures defined (chevron-right-table, chevron-right-list,
  arrow-right-vip, arrow-up-right-overdue, chevron-calendar-nav,
  chevron-right-persons, sparkline-polyline, chevron-after-actions,
  chevron-engagement-stage, chevron-breadcrumb-dossier, chevron-drawer-cta) ✓
- Output directory is `docs/rtl-icons/` (resolved via `path.resolve(__dirname,
'..', '..', '..', 'docs', 'rtl-icons')`) ✓
- 22 tests enumerate (`pnpm -C frontend exec playwright test
qa-sweep-icon-screenshots.spec.ts --list` →
  `Total: 22 tests in 1 file`) ✓
- Spec is NOT in `test:qa-sweep` script (verified —
  `test:qa-sweep` references only the 4 blocking specs) ✓
- Spec IS in `docs:rtl-icons` script (`playwright test
qa-sweep-icon-screenshots.spec.ts --update-snapshots --reporter=list`) ✓

## Threat Surface (per plan §threat_model)

- **T-43-12 (Tampering / accept):** iconFixtures selectors may miss when a
  card layout changes. Spec is advisory — failure means the operator
  refines selectors and re-runs. Not a CI gate. No mitigation work needed.
- **T-43-13 (Information disclosure / mitigate):** Screenshots are scoped
  to the icon's tightest wrapper (`target.screenshot({ path })`, not full
  page), and the test user is the seeded analyst account with synthetic
  data. Mitigation in place via the `target.screenshot` call shape.

No new threat surface introduced beyond the plan's register.

## Self-Check: PASSED

- File `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` — FOUND
- Commit `d028103f` (test 43-05 initial) — FOUND in `git log`
- Commit `268905ce` (test 43-05 lint fix) — FOUND in `git log`
