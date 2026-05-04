---
phase: 43-rtl-a11y-responsive-sweep
plan: 14
subsystem: list-page-a11y
tags: [qa, gate, remediation, a11y, axe, aria, gap-closure]
gap_closure: true
requires: []
provides:
  - 'DossierTable.tsx with coherent role="list"/role="listitem" ARIA pattern (no half-grid)'
  - 'axe-core aria-required-children violation count on /countries × en/ar and /organizations × en/ar reduced from 4 → 0 (deferred-to-ci runtime confirmation)'
affects:
  - frontend/src/components/list-page/DossierTable.tsx
tech-stack:
  added: []
  patterns:
    - 'role="list" + role="listitem" semantic pattern for non-tabular item lists (replaces invalid half-grid pattern)'
key-files:
  created: []
  modified:
    - frontend/src/components/list-page/DossierTable.tsx
decisions:
  - 'Resolution path A from plan: drop role-grid pattern entirely (rather than wrap in role=rowgroup or maximalist gridcell additions). Smallest diff; semantically correct for a list of dossiers; preserves UAT recommendation.'
  - 'Phase B axe runtime sweep deferred-to-ci: no VITE_SUPABASE_URL in worktree shell, no .env.test present, so login at globalSetup cannot succeed. Static evidence in Phase A is the gate.'
  - 'frontend/src/components/ui/table.tsx left untouched (3 native role="rowgroup" attributes on <thead>/<tbody>/<tfoot> are valid HTML-table patterns; explicit-but-redundant; out of scope per plan Site A note).'
metrics:
  duration: '~3 minutes'
  completed: '2026-05-04'
  tasks_completed: 2
  files_changed: 1
  commits: 2 # task 1 commit + this SUMMARY commit
---

# Phase 43 Plan 14: Drop Invalid Role-Grid Pattern from DossierTable Summary

Surgical removal of an invalid ARIA half-grid pattern in `DossierTable.tsx` —
converting `role="table"` + `role="row"` + `role="columnheader"` (without a
parent `role="grid"`/`rowgroup`) into the semantically correct
`role="list"` + `role="listitem"` pattern, eliminating the axe-core
`aria-required-children` critical violation on `/countries` and
`/organizations` (4 prior failures across en/ar).

## Tasks Completed

| Task | Name                                                                            | Status | Commit         |
| ---- | ------------------------------------------------------------------------------- | ------ | -------------- |
| 1    | Convert DossierTable role-grid pattern to role-list                             | done   | `b9d12f5c`     |
| 2    | Verify Gap-2 closure via grep audit + best-effort axe sweep (verification-only) | done   | (this SUMMARY) |

## Diff Applied

`frontend/src/components/list-page/DossierTable.tsx` — 5 attribute changes
on a single file. Before/after grep counts (baseline → final):

| Pattern                 | Baseline | Final | Δ   |
| ----------------------- | -------- | ----- | --- |
| `role="row"`            | 2        | 0     | -2  |
| `role="columnheader"`   | 4        | 0     | -4  |
| `role="table"`          | 1        | 0     | -1  |
| `role="list"`           | 0        | 1     | +1  |
| `role="listitem"`       | 0        | 1     | +1  |
| `dossier-row`           | 3        | 3     | 0   |
| `icon-flip`             | 1        | 1     | 0   |
| `focus-visible:outline` | 1        | 1     | 0   |

Specific changes:

1. Line ~97: `<div role="table" aria-label={...}>` → `<div role="list" aria-label={...}>`
2. Line ~104: removed `role="row"` from desktop header div
3. Lines ~109/112/115/118: removed `role="columnheader"` from each of 4 header `<span>`s (text labels remain)
4. Line ~134: removed `role="row"` from body row `<button>`
5. Line ~134: added `role="listitem"` to body row `<button>`

The `dossier-row` className stayed everywhere (CSS grid layout intact via
`.dossier-row` rule in `frontend/src/styles/list-pages.css`). Click handler,
`type="button"`, focus-visible outline, hover state, ChevronRight + DossierGlyph
rendering, and i18n calls all byte-preserved.

Lockstep prettier post-edit re-flowed the four header `<span>` blocks onto single
lines (commit `b9d12f5c`); semantically identical, no behavior change. Final file
is 149 lines (baseline was 159; net -10 from removed attributes + prettier
single-line spans).

## Verification Results

### Phase A — static evidence (the gate)

| Check          | Command                                                                                                                | Expected                                          | Actual                                                                                                 | Pass                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| A.1 (filtered) | `grep -rn 'role="row"' frontend/src/ --include="*.tsx" --include="*.ts" \| grep -v 'components/ui/table.tsx' \| wc -l` | 0                                                 | 0                                                                                                      | ✓                   |
| A.1 (full)     | `grep -rn 'role="row"' frontend/src/`                                                                                  | only `components/ui/table.tsx:65` (native `<tr>`) | only `components/ui/table.tsx:65`                                                                      | ✓                   |
| A.2            | `grep -rn 'role="grid"\|role="rowgroup"' frontend/src/`                                                                | only patterns on native HTML table elements       | 3 hits in `components/ui/table.tsx` (`<thead>`, `<tbody>`, `<tfoot>` — all native, all rowgroup-valid) | ✓ (clarified below) |
| A.3            | `tsc --noEmit` (DossierTable-specific)                                                                                 | 0 errors in DossierTable.tsx                      | 0 errors in DossierTable.tsx                                                                           | ✓                   |
| A.4            | GenericListPage.test.tsx                                                                                               | 6 tests pass                                      | 6 tests pass (837ms)                                                                                   | ✓                   |

**Acceptance-criteria clarification on A.2:** the plan asserts `role="grid"\|role="rowgroup" wc -l == 0`, but `components/ui/table.tsx` lines 40/44/54 carry `role="rowgroup"` on **native** `<thead>`/`<tbody>`/`<tfoot>` elements. These are explicit-but-redundant and ARIA-valid (rowgroup is the implicit role of those native elements). They do NOT form a half-grid: the corresponding `role="row"` at `table.tsx:65` is on a native `<tr>` whose parent is one of those rowgroups. This is a complete, native-HTML-table grid pattern, not a half-grid, and is out of scope per the plan's Site A note. The intent of the A.2 check ("confirm no half-grid pattern surfaces remain") is satisfied: the only `role="row"` remaining in the codebase is inside a complete native-table structure that axe will not flag.

### Phase B — runtime axe sweep

**Outcome:** deferred-to-ci.

The worktree shell has no `VITE_SUPABASE_URL` and no `.env.test` file, so the
Playwright `globalSetup` (which performs the auth login) cannot succeed in
this environment. Per the plan's explicit "(b) login fails (missing
VITE_SUPABASE_URL): record `deferred-to-ci`" branch, the runtime axe sweep is
deferred to CI. The static-evidence chain in Phase A is the gate this plan
relies on.

CI will re-run `pnpm -C frontend test:qa-sweep -- qa-sweep-axe.spec.ts` with
`/countries` + `/organizations` in env-loaded environments. Expected runtime
result: `aria-required-children` violation count drops from 4 → 0 across
en/ar, since the only invalid `role="row"` site (the body `<button>` at
`DossierTable.tsx:131`) has been removed.

### Untouched files (regression guard)

- `frontend/src/components/ui/table.tsx` — byte-unchanged (the native-`<tr>` `role="row"` is out of scope)
- `frontend/tests/e2e/qa-sweep-axe.spec.ts` — byte-unchanged
- `frontend/tests/e2e/helpers/qa-sweep.ts` — byte-unchanged

## Screen-Reader Announcement Change

Per plan threat-model T-43-14-01 (`mitigate`): the role swap changes the
announced semantics from "row 3 of 50" to "list item 3 of 50". This is the
semantically correct match for a list of dossiers (no real grid; styled list
of clickable cards). Live SR audit deferred to UAT-3 (already enumerated in
`43-VERIFICATION.md` human verification).

T-43-14-02 (`accept`): removing `role="columnheader"` from header spans
means screen readers no longer announce them as "column header". Trade is
favorable — keeping the role triggers axe `aria-required-parent` violations
because the parent is no longer a grid.

## Deviations from Plan

None — plan executed exactly as written, with one documented clarification
on Phase A.2's acceptance threshold (the 3 `role="rowgroup"` hits in
`components/ui/table.tsx` are valid native-HTML-table semantics, not the
half-grid pattern the check is meant to catch). No source-code deviations.

## Self-Check: PASSED

- File `frontend/src/components/list-page/DossierTable.tsx` exists and contains the role="list" + role="listitem" pattern (verified via grep above)
- Commit `b9d12f5c` exists in git log
- Sweep spec helpers `frontend/tests/e2e/qa-sweep-axe.spec.ts` and `frontend/tests/e2e/helpers/qa-sweep.ts` byte-unchanged (`git diff` returns empty)
- `frontend/src/components/ui/table.tsx` byte-unchanged (`git diff` returns empty)
- GenericListPage.test.tsx — 6 tests pass

## Closes

Gap-2 from `43-HUMAN-UAT.md` (axe sweep — 4 fails, CRITICAL severity).
Requirement: QA-02 (a11y).
