---
phase: 29-complex-type-wizards
plan: 01
subsystem: ui
tags: [react, typescript, vitest, rtl, tailwind, dossier-picker, multi-select, forms, combobox]

# Dependency graph
requires:
  - phase: 27-country-wizard
    provides: DossierPicker single-select component used by Forum/WG wizards
  - phase: 28-simple-type-wizards
    provides: Forum + WG single-select picker callers remain green
provides:
  - DossierPicker multi-select mode via opt-in `multiple` prop
  - Widened `filterByDossierType` accepting `DossierType | DossierType[]`
  - Inline chip row rendered below the combobox (horizontal scroll, RTL-aware)
  - Vitest suite covering both single- and multi-select behaviors
affects:
  [29-05-engagement-wizard, 29-complex-type-wizards, participants-step, engagement-participants]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Opt-in multi-select combobox (`multiple` flag switches source of truth to `values` + `onValuesChange`)'
    - 'Inline chip row with horizontal scroll (`flex flex-nowrap overflow-x-auto`) beneath combobox trigger'
    - 'Widened filter prop that accepts scalar OR array at the type layer, with runtime narrowing for the API call'

key-files:
  created:
    - frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx
  modified:
    - frontend/src/components/work-creation/DossierPicker.tsx

key-decisions:
  - 'Made `onChange` optional on `DossierPickerProps` to allow multi-select callers (Engagement wizard) to omit it without synthesizing a no-op; existing single-select callers still pass it unchanged.'
  - 'Popover stays OPEN after a multi-select pick (rapid multi-pick UX). Single-select still closes on select.'
  - '`filterByDossierType` array form passes only the FIRST element to the backend `autocompleteDossiers` call (per 29-RESEARCH §3.2 — backend supports a single type today). Recents list is filtered against the full array client-side.'
  - 'Pass-through UI primitive mocks (Popover/Command/Button/Badge) in the test file render CommandItems as plain buttons so selection paths can be driven with `userEvent.click` without wiring RTL-virtual-keyboard semantics.'

patterns-established:
  - 'DossierPicker multi-select contract: `multiple`, `values`, `onValuesChange(ids, dossiers)`, `selectedDossiers` — uniformly consumed by future participant-picker steps'
  - 'Chip row lives INSIDE DossierPicker in multi-select mode — step components never lay out chips themselves'
  - 'Vitest mock stack for DossierPicker: mock `@/services/search-api` (autocompleteDossiers), pass-through Command/Popover/Button/Badge, use `toBeTruthy()` / `toBeNull()` matchers (this project does NOT configure @testing-library/jest-dom)'

requirements-completed: [ENGM-04]

# Metrics
duration: ~15 min
completed: 2026-04-16
---

# Phase 29 Plan 01: DossierPicker Multi-Select Extension Summary

**Opt-in multi-select mode added to DossierPicker — `multiple` flag switches source of truth to `values`/`onValuesChange`/`selectedDossiers`, renders inline chip row beneath combobox, widened `filterByDossierType` accepts array form. Single-select path preserved verbatim. 8/8 Vitest cases green.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-16T21:19Z (approx)
- **Completed:** 2026-04-16T21:22Z (approx)
- **Tasks:** 2 (both auto, tdd-flagged)
- **Files modified:** 2 (1 modified + 1 created)

## Accomplishments

- Extended `DossierPickerProps` with four new optional fields (`multiple`, `values`, `onValuesChange`, `selectedDossiers`) without breaking any of the 3 existing single-select callers (ForumFields, WorkCreationPalette, EnhancedKanbanBoard).
- Widened `filterByDossierType` from `DossierType` to `DossierType | DossierType[]` — Engagement wizard can now pass `['country']` uniformly across its three participant-picker instances (type-level accommodation; backend still receives a single type via runtime narrowing).
- Added inline chip row beneath combobox: `flex flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden` with per-chip ✕ button (`min-h-6 min-w-6`), icon + localized name + remove control, RTL-aware via `ms-*`/`me-*`, `aria-live="polite"`.
- Rewrote `handleSelect` to branch on `isMulti`: dedupe against current `values`, append to arrays, keep popover OPEN for rapid multi-pick.
- Added `handleRemove(id)` callback fired from chip ✕ clicks.
- Widened both `Check`-indicator usages (search results + recents) to use `isSelected = isMulti ? values.includes(id) : value === id`.
- Widened recents filter so array form filters across the full type list.
- Created Vitest suite with 8 tests covering: 2 single-select regressions + 6 multi-select scenarios (chip render, ✕ remove, dedupe, array filter accepted, recents filtered by array, append new dossier).

## Task Commits

1. **Task 1: Extend DossierPicker with multi-select mode + widened filter type** — `bf7a0dbf` (feat)
2. **Task 2: Extend DossierPicker Vitest suite with multi-select coverage** — `51368851` (test)

_Plan metadata commit added after this SUMMARY._

## Files Created/Modified

- `frontend/src/components/work-creation/DossierPicker.tsx` — **Modified.** +92 / −12. Added four optional props, `isMulti` derived flag, `handleRemove` callback, branched `handleSelect`, widened `filterByDossierType` type + API narrowing + recents filter, widened both `Check` indicators, added chip-row JSX.
- `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx` — **Created.** 323 lines. 8 tests across 2 describe blocks.

## Decisions Made

- **Relaxed `onChange` to optional.** The plan's spec for multi-select says `value` and `onChange` are ignored when `multiple={true}`. Rather than forcing multi-select callers to pass a no-op `onChange`, I made the prop optional and guarded call sites with `onChange?.(...)`. Confirmed the 3 existing single-select callers all pass `onChange` so this is a pure relaxation (no caller breakage). See [Deviations from Plan §1].
- **Chose pass-through mocks for UI primitives** over reusing the CountryDetailsStep mock stack verbatim — DossierPicker depends on Command/Popover/Badge which the step test file doesn't mock, and the test scenarios need clickable CommandItems (rendered as plain buttons here so `userEvent.click` drives `onSelect`).
- **Used `toBeTruthy()` / `toBeNull()` instead of `toBeInTheDocument()`.** The project does not register `@testing-library/jest-dom` in Vitest setup; following `CountryDetailsStep.test.tsx` precedent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 – Blocking] Made `onChange` optional on `DossierPickerProps`**

- **Found during:** Task 1 (after adding multi-select props, the Engagement wizard's participant pickers would need to synthesize a dummy `onChange` to satisfy the old required signature).
- **Issue:** With `onChange: (id, dossier) => void` required, any multi-select caller would either be forced to pass an unused no-op handler or cast away type safety. Plan §\<behavior\> explicitly states `onChange` is "ignored" in multi-select — contradicting a required signature.
- **Fix:** Changed to `onChange?: (dossierId: string | null, dossier?: DossierOption) => void` and guarded the 2 call sites (`onChange?.(...)` in `handleSelect` single-path and `handleClear`). Verified via `git grep` that all 3 existing callers (`ForumFields`, `WorkCreationPalette`, `EnhancedKanbanBoard`) pass `onChange`, so no caller breaks.
- **Files modified:** `frontend/src/components/work-creation/DossierPicker.tsx`
- **Verification:** `pnpm type-check` shows zero errors in DossierPicker and its 3 callers; tests for single-select regression (Test 1) exercise `onChange` path and assert correct invocation.
- **Committed in:** `bf7a0dbf` (part of Task 1 commit)

**2. [Rule 1 – Bug] Jest-dom matchers not available — switched to Chai matchers**

- **Found during:** Task 2 verification (initial vitest run failed 3/8 with `Invalid Chai property: toBeInTheDocument`).
- **Issue:** Initial test file used `.toBeInTheDocument()` assuming `@testing-library/jest-dom` was registered. This project does not register it; existing test files (e.g. `CountryDetailsStep.test.tsx`) use `.toBeTruthy()` / `.toBeNull()`.
- **Fix:** Replaced `.toBeInTheDocument()` with `.toBeTruthy()` and `.not.toBeInTheDocument()` with `.toBeNull()`, matching the existing codebase pattern.
- **Files modified:** `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx`
- **Verification:** `pnpm vitest run src/components/work-creation/__tests__/DossierPicker.test.tsx` now passes 8/8.
- **Committed in:** `51368851` (Task 2 commit — fix applied before commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both deviations are localized and strictly backward-compatible. `onChange` relaxation is a pure superset of the existing contract. Matcher swap is a test-authoring detail with no runtime impact. No scope creep.

## Issues Encountered

- **Pre-existing project-wide type-check errors** (TS6133/TS6196 "declared but never read/used") in ~60 unrelated files (types/, utils/, etc.). These are NOT caused by this plan and were not touched. Scope boundary: left alone per executor contract. `pnpm type-check` still exits non-zero because of them — but a filtered check (`grep -E "DossierPicker|work-creation/__tests__"`) shows zero errors in our touched files and zero errors in DossierPicker's callers.

## Verification Evidence

### Must-have truths check

| Truth                                                                   | Status | Evidence                                                                                                                                                                                |
| ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing single-select callers work unchanged                           | PASS   | `pnpm type-check` shows zero errors in ForumFields / WorkCreationPalette / EnhancedKanbanBoard; Test "calls onChange(id, dossier) when a recent dossier CommandItem is selected" green. |
| Renders in multi-select when `multiple={true}`                          | PASS   | Test "renders one chip per selected dossier" green; 3 chips visible in DOM.                                                                                                             |
| Chips render beneath combobox, horizontally scrollable, RTL-aware       | PASS   | `grep overflow-x-auto DossierPicker.tsx` → match; chip row uses `ms-*`/`me-*` only; `aria-live="polite"`.                                                                               |
| `filterByDossierType` accepts scalar OR array w/o type errors           | PASS   | `grep "DossierType \| DossierType\[\]" DossierPicker.tsx` → match; Test "accepts filterByDossierType as an array" green.                                                                |
| ✕ on chip removes dossier and fires `onValuesChange` with remaining ids | PASS   | Test "calls onValuesChange with remaining ids when a chip ✕ is clicked" → assertion `onValuesChange([japan.id], [japan])` green.                                                        |

### Plan-level verification

| Command                                                                         | Result                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm vitest run src/components/work-creation/__tests__/DossierPicker.test.tsx` | **PASS** — 8/8 tests, 117 ms                                                                                                                                                                                                      |
| `pnpm type-check` (filtered to DossierPicker-related files)                     | **PASS** — 0 errors in `DossierPicker.tsx`, `__tests__/DossierPicker.test.tsx`, ForumFields, WorkCreationPalette, EnhancedKanbanBoard                                                                                             |
| grep acceptance criteria on `DossierPicker.tsx`                                 | **PASS** — `multiple?: boolean` (1), `values?: string[]` (1), `onValuesChange` (7), `selectedDossiers` (8), `DossierType \| DossierType[]` (1), `handleRemove` (2), `isMulti` (7), `overflow-x-auto` (1), RTL illegal classes (0) |
| grep acceptance criteria on test file                                           | **PASS** — `DossierPicker — multi-select` describe (1), `onValuesChange` (17, ≥5 required), `filterByDossierType={['country', 'organization']}` (3)                                                                               |

### Manual spot-check of single-select callers (from code grep)

- `frontend/src/components/dossier/wizard-steps/fields/ForumFields.tsx:31` — passes `value`, `onChange`, `filterByDossierType="organization"`. **Compatible.**
- `frontend/src/components/work-creation/WorkCreationPalette.tsx:273` — passes `value`, `onChange`, `selectedDossier`. **Compatible.**
- `frontend/src/components/unified-kanban/EnhancedKanbanBoard.tsx:501` — passes `value`, `onChange`, `filterByDossierType`, `placeholder`. **Compatible.**

## Self-Check: PASSED

- `[✓]` File `frontend/src/components/work-creation/DossierPicker.tsx` exists on disk
- `[✓]` File `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx` exists on disk
- `[✓]` Commit `bf7a0dbf` present: `git log --oneline | grep bf7a0dbf` → feat(29-01)
- `[✓]` Commit `51368851` present: `git log --oneline | grep 51368851` → test(29-01)
- `[✓]` All acceptance criteria from PLAN task 1 and task 2 re-verified green
- `[✓]` Plan-level verification (`vitest run` + filtered `type-check` + greps) all green
- `[✓]` All 5 must-have truths hold with recorded evidence

## User Setup Required

None — this is a pure frontend component extension with no new env vars, DB migrations, or external services.

## Next Phase Readiness

- **Plan 29-02 (Forum wizard)** — unaffected; uses DossierPicker single-select path which is unchanged.
- **Plan 29-03 (Working Group wizard)** — unaffected; same reason.
- **Plan 29-04 (Engagement details step)** — unaffected; no pickers in that step.
- **Plan 29-05 (Engagement wizard — Participants step)** — **UNBLOCKED.** Can now mount three `<DossierPicker multiple values={...} onValuesChange={...} filterByDossierType="country|organization|person" />` instances per the pattern in `29-PATTERNS.md §7`.

---

_Phase: 29-complex-type-wizards_
_Completed: 2026-04-16_
