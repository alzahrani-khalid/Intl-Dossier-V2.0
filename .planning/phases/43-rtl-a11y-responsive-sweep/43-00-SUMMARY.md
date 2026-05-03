---
phase: 43-rtl-a11y-responsive-sweep
plan: 00
subsystem: qa-infrastructure
tags: [qa, infra, eslint, ci, playwright, a11y, rtl, responsive]
requires:
  - .planning/phases/43-rtl-a11y-responsive-sweep/43-CONTEXT.md
  - .planning/phases/43-rtl-a11y-responsive-sweep/43-RESEARCH.md
  - frontend/tests/e2e/support/list-pages-auth.ts
provides:
  - frontend/tests/e2e/helpers/v6-routes.ts (V6_ROUTES, V6Route)
  - frontend/tests/e2e/helpers/qa-sweep.ts (BREAKPOINTS, runAxe, forEachBreakpoint, tabWalkAllInteractives, assertFocusOutlineVisible, settlePage)
  - frontend/tests/e2e/helpers/contrast.ts (computeContrastRatio, parseOklch)
  - frontend/package.json scripts (test:qa-sweep, docs:rtl-icons)
  - .github/workflows/e2e.yml (qa-sweep job)
affects:
  - Wave 1 plans 43-01..43-05 (sweep specs depend on these helpers)
  - Wave 2 plan 43-07 (consumes ESLint survivor count = 0)
tech-stack:
  added: [culori@4.0.2]
  patterns:
    - 'Per-impact axe filter (serious/critical) — matches Phase 38 dashboard-a11y precedent'
    - 'Typed route registry (V6_ROUTES) as single source of truth'
    - 'OKLCH-aware WCAG contrast probe via culori'
key-files:
  created:
    - frontend/tests/e2e/helpers/v6-routes.ts
    - frontend/tests/e2e/helpers/qa-sweep.ts
    - frontend/tests/e2e/helpers/contrast.ts
  modified:
    - frontend/eslint.config.js
    - frontend/package.json
    - .github/workflows/e2e.yml
    - pnpm-lock.yaml
decisions:
  - 'Filter axe violations by impact (serious/critical), not zero-on-all — preserves Phase 38–42 gate semantics'
  - 'Use culori for OKLCH parsing — already a transitive dep of HeroUI v3, no new conceptual surface'
  - 'qa-sweep CI job runs in parallel with e2e (no needs:) — independent gate, faster feedback'
  - 'Identity key for tab-walk = outerHTML.slice(0, 200) — stable per-sweep, narrow enough to disambiguate'
metrics:
  duration_minutes: ~11
  completed_date: 2026-05-03
  tasks_completed: 3
  files_created: 3
  files_modified: 4
  commits: 3
---

# Phase 43 Plan 00: Wave 0 QA-sweep infrastructure

Wave 0 infrastructure for Phase 43 cross-cutting QA sweeps — typed route
registry, shared helpers, OKLCH contrast probe, ESLint glob expansion to
the full v6.0 surface, package scripts, and CI job. Wave 1 specs can now
import from `helpers/v6-routes` + `helpers/qa-sweep` + `helpers/contrast`
without re-deriving paths or rebuilding axe wrappers.

## What Shipped

### Helpers (`frontend/tests/e2e/helpers/`, all new)

- **`v6-routes.ts`** (~108 lines) — typed `V6_ROUTES` array of 15
  routes with `{ name, path, requiresAuth, locales, hasMobileVariant }`.
  Path corrections per RESEARCH §3:
  - `dashboard` → `/dashboard` (NOT `/`)
  - `engagements` → `/engagements` (NOT `/dossiers/engagements` per
    Phase 40 G11 rewire)
- **`qa-sweep.ts`** (~141 lines) — exports:
  - `BREAKPOINTS` (320, 640, 768, 1024, 1536 — D-03 set; 1280 stays
    owned by per-phase visual baselines)
  - `runAxe(page, options?)` — `wcag2a/wcag2aa/wcag21a/wcag21aa` tags;
    filter by `impact === 'serious' || 'critical'`; matches Phase 38
    `dashboard-a11y.spec.ts` precedent verbatim per orchestrator Q2
  - `forEachBreakpoint(page, fn)` — sets viewport, awaits 50 ms
    paint settle
  - `tabWalkAllInteractives(page)` — returns `{ count, reached }`;
    selector excludes `disabled`, `aria-disabled="true"`, hidden
    inputs, `tabindex="-1"`; identity = `outerHTML.slice(0, 200)`
  - `assertFocusOutlineVisible(page, selector)` — focuses element,
    asserts non-transparent outline + ≥3:1 contrast vs parent bg;
    returns the resolved values for caller to log/baseline
  - `settlePage(page)` — verbatim RESEARCH §10 pattern (drop
    `data-loading="true"`, await `domcontentloaded`, sleep 150 ms)
- **`contrast.ts`** (~36 lines) — `computeContrastRatio(fg, bg)` and
  `parseOklch(input)` via `culori`. Handles `oklch()`, `rgb()`,
  `rgba()`, named colors. Used by `assertFocusOutlineVisible`.

### ESLint glob expansion (`frontend/eslint.config.js`)

Phase 40 reinforcement block (lines 142–165) renamed to
**"Phase 40 + Phase 43"** and expanded from 5 globs to **15 globs**
covering the full v6.0 surface:

| Phase     | Globs added                                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 38        | `routes/_protected/dashboard.tsx`, `pages/Dashboard/**`                                                                                                                                                              |
| 39        | `routes/_protected/{kanban,calendar}.tsx`, `components/unified-kanban/**`, `components/calendar/{UnifiedCalendar,CalendarMonthGrid,CalendarEventPill,WeekListMobile}.tsx`                                            |
| 41        | `components/dossier/DossierDrawer/**`, `components/dossier/DossierShell.tsx`                                                                                                                                         |
| 42        | `routes/_protected/{briefs,activity,settings}.tsx`, `routes/_protected/{after-actions,tasks}/index.tsx`, `pages/{Briefs,activity,settings}/**`, `pages/MyTasks.tsx`, `components/{briefs,activity,after-actions}/**` |
| 40 (kept) | `components/list-page/**`, dossier list routes, persons/engagements routes, list-page hooks (plus `dossiers/engagements/index.tsx` legacy alias)                                                                     |

Rule message updated to `'v6.0 surface (Phase 38–42): physical RTL
classes are forbidden…'`.

**ESLint survivor count introduced by the glob expansion: 0.**
`pnpm -C frontend lint` reports 52 errors total (all pre-existing:
`@typescript-eslint/no-explicit-any`, `react-hooks/rules-of-hooks`,
`unused-imports/no-unused-imports`, `no-restricted-imports`,
`no-useless-escape`) and **zero `no-restricted-syntax` errors against
the expanded globs**. Plan 43-07 has no logical-properties survivors to
fix from this expansion. Pre-existing `any`-type errors are out of
scope per Karpathy "Surgical Changes" rule and per the plan's scope
boundary (Phase 43 is QA enforcement, not refactor).

### Package scripts + culori dep (`frontend/package.json`)

```json
"test:qa-sweep": "playwright test qa-sweep-axe.spec.ts qa-sweep-responsive.spec.ts qa-sweep-keyboard.spec.ts qa-sweep-focus-outline.spec.ts --reporter=list",
"docs:rtl-icons": "playwright test qa-sweep-icon-screenshots.spec.ts --update-snapshots --reporter=list"
```

`culori@4.0.2` added as devDep (installed under
`frontend/node_modules/culori`, resolved via pnpm; lockfile updated).

`pnpm -C frontend test:qa-sweep` exit code: **1** with
`Error: No tests found.` — the expected Wave 0 sentinel; confirms the
script wires correctly to Playwright. Wave 1 specs will turn this
green. Reproducible via the local invocation above.

### CI gate (`.github/workflows/e2e.yml`)

New `qa-sweep` job placed between the existing `e2e:` matrix and the
`merge-reports:` collator. Runs in parallel with `e2e:` (no `needs:`),
hard-fails on any sweep regression per D-10. Uploads
`qa-sweep-failures` artifact (90-day retention) on failure containing
zip traces, screenshots, and webm recordings under `frontend/test-results/`.

Env mapping: `TEST_USER_EMAIL` ← `secrets.E2E_ANALYST_EMAIL`,
`TEST_USER_PASSWORD` ← `secrets.E2E_ANALYST_PASSWORD` —
`loginForListPages` reads those exact env names per RESEARCH §4.

YAML structure validated: 3 top-level jobs (`e2e`, `qa-sweep`,
`merge-reports`).

## Verification

| Check                                                     | Result                           |
| --------------------------------------------------------- | -------------------------------- |
| 3 helper files exist                                      | PASS                             |
| `V6_ROUTES` has 15 entries                                | PASS (15 `name:` lines)          |
| `dashboard` path = `/dashboard` (not `/`)                 | PASS                             |
| `engagements` path = `/engagements` (not `/dossiers/...`) | PASS                             |
| Helpers type-check under strict TS                        | PASS (zero errors in helpers/\*) |
| ESLint config loads (no parser errors)                    | PASS                             |
| `pnpm lint` introduces zero `no-restricted-syntax` errors | PASS (0 survivors)               |
| `test:qa-sweep` + `docs:rtl-icons` scripts present        | PASS                             |
| `culori` listed in devDeps + installed                    | PASS                             |
| `qa-sweep` job exists in `e2e.yml`                        | PASS                             |
| Workflow YAML structure valid                             | PASS (3 jobs detected)           |
| `test:qa-sweep` exits non-zero with "No tests found"      | PASS (expected Wave 0 sentinel)  |

## Commits

| Hash       | Type  | Subject                                                |
| ---------- | ----- | ------------------------------------------------------ |
| `9e8a547d` | test  | add V6_ROUTES registry + qa-sweep + contrast helpers   |
| `7bb240b3` | chore | expand ESLint logical-properties glob to v6.0 surface  |
| `7316d211` | ci    | add test:qa-sweep + docs:rtl-icons scripts and CI gate |

## Deviations from Plan

None — plan executed exactly as written. The pre-commit hook
(lint-staged + prettier) reformatted `qa-sweep.ts` slightly during
Task 1's commit (joined a wrapped argument list onto one line); this
is purely cosmetic, semantically equivalent to the planned source, and
within the project's prettier config. No deviations to functional
behavior, exports, types, or acceptance criteria.

## Wave 1 Handoff Notes

Wave 1 sweep specs should:

1. `import { V6_ROUTES } from './helpers/v6-routes'` (path is
   `frontend/tests/e2e/helpers/v6-routes.ts`)
2. `import { runAxe, forEachBreakpoint, tabWalkAllInteractives, assertFocusOutlineVisible, settlePage, BREAKPOINTS } from './helpers/qa-sweep'`
3. `import { loginForListPages } from './support/list-pages-auth'` —
   reuse verbatim, do NOT recreate
4. Auth env: `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` (CI maps from
   `E2E_ANALYST_*`)
5. The 1280 breakpoint is intentionally OUT of `BREAKPOINTS` — owned
   by per-phase visual specs (D-03)
6. `runAxe` already filters by `impact: serious|critical` — sweep
   callers do NOT need to add their own filter

## Self-Check: PASSED

- `[x]` `frontend/tests/e2e/helpers/v6-routes.ts` exists
- `[x]` `frontend/tests/e2e/helpers/qa-sweep.ts` exists
- `[x]` `frontend/tests/e2e/helpers/contrast.ts` exists
- `[x]` `frontend/eslint.config.js` updated (Phase 40 + Phase 43 block, 15 globs)
- `[x]` `frontend/package.json` has `test:qa-sweep` + `docs:rtl-icons` + `culori` devDep
- `[x]` `frontend/node_modules/culori` installed
- `[x]` `.github/workflows/e2e.yml` has `qa-sweep` job with `Phase 43 — blocking gate` step name
- `[x]` Commit `9e8a547d` present in `git log`
- `[x]` Commit `7bb240b3` present in `git log`
- `[x]` Commit `7316d211` present in `git log`
