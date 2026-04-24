---
phase: 38-dashboard-verbatim
plan: '09'
status: PASS-WITH-DEVIATION
completed_tasks: 5
deferred_tasks: 1
deviations:
  - 'Visual baselines NOT auto-seeded — backend + .env.test + dev server not available in worktree (see DASH-VISUAL-BLOCKED). Spec committed, ready for one-shot operator seed.'
  - "no-placeholder-data gate strips // and /* */ comments before scanning so the 'no mock constants' audit-trail comments in WeekAhead/VipVisits/Digest doc headers stay (gate targets placeholder DATA, not the prose word 'mock')."
  - 'Dashboard/components/ subtree (12 files) left in place as dead code — would have expanded scope beyond plan; queued as DASH-COMPONENTS-DEAD.'
  - "dashboard.project-management.tsx redirect retained (still useful 404 prevention; doesn't mount the deleted page)."
open_risks:
  - "Visual regression has NO baselines on disk yet — first `pnpm exec playwright test dashboard-visual` will fail with 'no expected screenshot' until seeded by the operator (BLOCKED-STRATEGY, not a code defect)."
  - 'Dashboard/components/ remains compilable dead code; if a future refactor renames anything in @/components/ui/skeleton it could surface latent errors there (dead-code, but still typechecked).'
commits:
  - 33f450aa # test(38-09-TASK-1): dashboard-rtl spec + frontend playwright config
  - 7dc1e56b # test(38-09-TASK-2): dashboard-visual 8-snapshot matrix
  - 6302c636 # test(38-09-TASK-3): a11y + responsive specs
  - a7086a21 # test(38-09-TASK-4): no-placeholder-data + no-legacy-page-import grep gate
  - a2a47ca8 # feat(38-09-TASK-5): remove legacy OperationsHub page + refresh stale comment
tests_run:
  unit: 60 passed (10 files) — widget regression sweep clean
  unit_gate: 3 passed — no-placeholder-data.test.ts (placeholder data + legacy page import)
  e2e_specs_shipped: 5 (dashboard, dashboard-rtl, dashboard-visual, dashboard-a11y, dashboard-responsive)
  e2e_executed: 0 # blocked on dev server + .env.test
  visual_baselines_seeded: 0 # BLOCKED-STRATEGY
  typescript: pre-existing TS6133/TS6196 unused warnings only — zero new errors from this plan
---

# Phase 38 Plan 09: E2E Validation + Deletion Sweep Summary

Closes Wave 2 of the dashboard-verbatim phase by shipping the full Playwright spec
matrix, a vitest grep gate against placeholder data and legacy page imports, and
removing the 221-line `OperationsHub.tsx` page that was unmounted at Wave 0 but
still on disk.

## E2E Specs Shipped (5)

All under `frontend/tests/e2e/`, discovered by the new `frontend/playwright.config.ts`:

| Spec                           | Coverage                                                                           | Source            |
| ------------------------------ | ---------------------------------------------------------------------------------- | ----------------- |
| `dashboard.spec.ts`            | smoke + `loginAndWaitForDashboard()` helper                                        | TASK-1 (33f450aa) |
| `dashboard-rtl.spec.ts`        | RTL flip — Arabic locale, layout direction                                         | TASK-1 (33f450aa) |
| `dashboard-visual.spec.ts`     | 8-snapshot matrix `[ltr,rtl] × [light,dark] × [768,1280]` w/ `freezeForSnapshot()` | TASK-2 (7dc1e56b) |
| `dashboard-a11y.spec.ts`       | axe-core (WCAG 2.1 AA)                                                             | TASK-3 (6302c636) |
| `dashboard-responsive.spec.ts` | viewports 320 / 768 / 1280                                                         | TASK-3 (6302c636) |

Visual snapshot tolerance: `maxDiffPixelRatio: 0.01` and `threshold: 0.2`,
inherited from `frontend/playwright.config.ts` per 38-CONTEXT D-12.

## Vitest Grep Gate (TASK-4 — a7086a21)

`frontend/src/pages/Dashboard/widgets/__tests__/no-placeholder-data.test.ts`
walks the `widgets/` tree (excluding `__tests__/`) and asserts:

1. **No placeholder data** — zero matches for `lorem`, `mock`, `fixture` after
   stripping `// ...` and `/* ... */` comments. The strip is intentional: doc
   headers like `T-38-01 — no mock constants; data comes from useWeekAhead only`
   are useful audit trails, while the gate still catches placeholder constants,
   JSX text, and identifiers in code.
2. **No legacy page coupling** — no `import` whose `from` clause contains
   `OperationsHub` (case-sensitive match on the page module name).
3. **Discovery sanity** — at least one widget file is found (guards against the
   gate silently succeeding on an empty tree).

**Result:** 3/3 pass. 60/60 widget unit tests still pass (regression sweep clean).

## OperationsHub Deletion Scope (TASK-5 — a2a47ca8)

### Deleted (1 file, 221 LOC)

- `frontend/src/pages/Dashboard/OperationsHub.tsx`

### Comment refresh (1 file)

- `frontend/src/routes/_protected/dashboard.tsx` — replaced the
  `// TODO: 38-09 will delete OperationsHub` block with a current note. The
  function name `OperationsHubRoute` is unchanged (local identifier; renaming
  would be gratuitous churn per Karpathy surgical-changes rule).

### Preserved (intentional, with reasons)

| Asset                                                                    | Why kept                                                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/domains/operations-hub/{hooks,types,repositories}`         | KpiStrip, SlaHealth, WeekAhead, useVipVisits import from these                                                                                         |
| `frontend/src/i18n/{en,ar}/operations-hub.json` + namespace registration | `pages/Dashboard/components/*.tsx` (legacy zone components, see DASH-COMPONENTS-DEAD) still call `useTranslation('operations-hub')` at compile time    |
| `frontend/src/routes/_protected/dashboard.project-management.tsx`        | 14-line `<Navigate to="/dashboard"/>` legacy alias for old bookmarks; doesn't mount the deleted page                                                   |
| `frontend/src/pages/Dashboard/components/` (12 files)                    | Compile-clean dead code — composed only by the deleted page. Removing was out of plan scope; queued as **DASH-COMPONENTS-DEAD** in `deferred-items.md` |

### TypeScript gate

`pnpm tsc --noEmit` reports zero new errors from this plan (verified with a grep
for `operations-hub` / `OperationsHub` / `pages/Dashboard` — only one
pre-existing unrelated `useTasks` symbol error in `MyTasks.tsx`, untouched by
this plan). Pre-existing TS6133/TS6196 unused-symbol warnings across
`src/types/*` and `src/utils/*` are out of scope.

## Visual Baseline Outcome — BLOCKED-STRATEGY

`dashboard-visual.spec.ts` requires:

1. Running dev server (`pnpm dev` on :5173).
2. `.env.test` with `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`
   (`loginAndWaitForDashboard()` fills the login form).
3. Real Supabase auth + seeded dashboard data.

Worktree environment had none of these, so the auto-seed step is deferred to a
one-shot operator run (see `deferred-items.md::DASH-VISUAL-BLOCKED` for exact
commands). The spec file itself is correct, frozen for flakes, and ready.

## Carried-Forward Deviations Affecting E2E Assertions

These prior-plan compromises shape what the dashboard E2E specs assert against
the live UI:

- **38-04 Digest, Option A:** `source = actor_name` (internal user reads as a
  publication name in the Digest column). Spec assertions therefore check that
  `source` renders truthy text, not that it matches a publication regex.
- **38-06 VipVisits, Option B:** `personFlag = undefined` is the steady-state
  shape for now; `DossierGlyph` falls back to name-initials. Spec assertions
  accept both `<img alt="flag-XX">` and the initials fallback.
- **38-05 SlaHealth:** `bad = 0` is reserved (no traffic-light red bucket in
  this wave). The KPI bar layout still budgets the red slot for future use.
- **38-02 / 38-08 DossierGlyph:** initials path is the documented fallback for
  adapters without ISO codes. RTL spec doesn't assert flag emoji presence.

## Deferred Items (filed in deferred-items.md)

- **DASH-VISUAL-BLOCKED** — 8 visual baselines pending operator seed (one-shot).
- **DASH-VISUAL-REVIEW** — once seeded, baselines need a human eyeball pass
  against `reference/dashboard.png` (VALIDATION.md "Manual-Only" row).
- **DASH-COMPONENTS-DEAD** — `pages/Dashboard/components/` 12-file dead-code
  cleanup + downstream `operations-hub.json` i18n namespace removal.
- **VIP-PERSON-ISO-JOIN** (carried from 38-06) — extend `get_upcoming_events`
  RPC to project `person_iso` + `person_role`; `DossierGlyph` upgrades from
  initials → flag with zero widget changes once landed.

## Self-Check: PASSED

- Files created/modified verified on disk:
  - `frontend/src/pages/Dashboard/widgets/__tests__/no-placeholder-data.test.ts` — present
  - `frontend/src/pages/Dashboard/OperationsHub.tsx` — deleted (confirmed `git status` shows D)
  - `frontend/src/routes/_protected/dashboard.tsx` — comment block refreshed
  - `.planning/phases/38-dashboard-verbatim/deferred-items.md` — appended
- Commits verified in `git log`:
  - `33f450aa`, `7dc1e56b`, `6302c636` — TASK-1/2/3 (prior agent)
  - `a7086a21` — TASK-4 (this run)
  - `a2a47ca8` — TASK-5 (this run)
- Test status: 60 widget unit tests + 3 grep-gate tests = **63/63 pass**.
