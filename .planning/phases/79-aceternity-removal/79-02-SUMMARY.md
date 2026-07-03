---
phase: 79-aceternity-removal
plan: 02
subsystem: ui
tags: [react, forms, dead-code, aceternity, barrel-exports, i18n]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit
    provides: Liveness evidence proving 7 Aceternity form components are dead (0 external call sites)
provides:
  - The 7 dead Aceternity form components + orphaned useFieldValidation hook removed from the tree
  - forms/index.ts barrel pruned of all Aceternity export blocks (0 aceternity refs)
affects: [79-03, 79-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Deletion gate: re-run the per-name liveness grep at delete-time before git rm; delete orphans your own change creates (Karpathy surgical rule)'

key-files:
  created: []
  modified:
    - frontend/src/components/forms/index.ts
  deleted:
    - frontend/src/components/forms/FormInputAceternity.tsx
    - frontend/src/components/forms/FormTextareaAceternity.tsx
    - frontend/src/components/forms/FormSelectAceternity.tsx
    - frontend/src/components/forms/FormCheckboxAceternity.tsx
    - frontend/src/components/forms/FormRadioAceternity.tsx
    - frontend/src/components/forms/FormFieldWithValidation.tsx
    - frontend/src/components/forms/SmartInput.tsx
    - frontend/src/hooks/useFieldValidation.ts

key-decisions:
  - "Also removed the now-orphaned '// Real-time validation components' and '// Smart input …' section comments (surgical cleanup of comments left dangling by the export-block removal)"

patterns-established:
  - "Whole-repo lint = the project's `pnpm lint` script (scoped to frontend/src/**), NOT raw `eslint .` (which surfaces ~205 pre-existing out-of-scope errors in tests/storybook/scripts/trash)"

requirements-completed: [ACET-01]

# Metrics
duration: ~20min
completed: 2026-07-03
---

# Phase 79-02: Delete 7 dead Aceternity form components + orphan hook

**2,142 lines of dead code removed — the 7 Aceternity form components (0 external call sites each) + their orphaned useFieldValidation hook + their barrel export blocks — with the live SearchableSelect path, the shared smart-input i18n namespace, and the Aceternity import-ban all provably untouched.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-03T11:45:00Z
- **Tasks:** 2
- **Files modified:** 1 edited, 8 deleted

## Accomplishments

- Delete-7 half of ACET-01 complete: 7 components (1,913 lines) + orphan hook (229 lines) gone.
- Barrel `forms/index.ts` pruned by name — 0 `aceternity` references remain, `SearchableSelect`/`SelectOption`/`OptionGroup` exports retained.
- Liveness re-proven at delete-time: 0 external importers for all 7; `useFieldValidation`'s only importer was `FormFieldWithValidation` (deleted first).

## Task Commits

1. **Task 1: delete 7 components + prune barrel** — `31e1a6d05` (refactor)
2. **Task 2: delete orphaned useFieldValidation hook** — `09a1998bf` (refactor)

## Files Created/Modified

- `frontend/src/components/forms/index.ts` — pruned 3 export blocks (5 Aceternity + FormFieldWithValidation + SmartInput) and their section comments.
- Deleted: 7 `forms/*Aceternity*` / `FormFieldWithValidation` / `SmartInput` + `hooks/useFieldValidation.ts`.

## Decisions Made

- None beyond the surgical comment cleanup noted in frontmatter — followed the plan as specified.

## Deviations from Plan

None — plan executed as written. Liveness gate, barrel prune, i18n-namespace preservation, and out-of-scope retention (`ValidationIndicator.tsx`, `validation-rules.ts`) all per plan.

## Issues Encountered

- **Pre-existing whole-repo lint red baseline (not this plan):** raw `eslint .` reports ~205 errors, but ALL are outside the project's real lint scope — the `pnpm lint` script targets `frontend/src/**/*.{ts,tsx}` only. `pnpm lint` (eslint + i18n-namespace + duplicate-rtl + bootstrap-parity) exits **0** after this change.
- **Pre-existing full-suite test failure (not this plan):** `tests/accessibility/waiting-queue-a11y.test.tsx > T091-07: RTL Keyboard Navigation` fails asserting `<html dir>` is `rtl` (receives `ltr`). It **fails in isolation** (none of this plan's deleted files are loaded when running that file alone) → deterministic pre-existing bug, structurally independent of an Aceternity-forms deletion. Full suite otherwise: **1438 passed / 2 skipped / 25 todo**, tsc clean.

## Pre-existing dead code left in place (per scope)

- `frontend/src/components/forms/ValidationIndicator.tsx` — not in the user's delete list; retained (has live consumers via `validation-rules.ts`). Flagged as pre-existing dead-ish code per the Karpathy surgical-change rule; NOT deleted this phase.

## Next Phase Readiness

- 79-03 (registry + residue purge) can proceed; barrel is already `aceternity`-free.
- 79-04 rebuild unaffected (SearchableSelect + UserPicker path untouched here).

---

_Phase: 79-aceternity-removal_
_Completed: 2026-07-03_
