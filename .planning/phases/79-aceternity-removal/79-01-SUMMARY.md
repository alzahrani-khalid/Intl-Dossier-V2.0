---
phase: 79-aceternity-removal
plan: 01
subsystem: testing
tags: [react, vitest, jest-axe, cmdk, radix, a11y, aria, rtl]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit
    provides: Phase-75 SearchableSelect ARIA/keyboard/validation contract (the 12-attribute checklist + liveness evidence)
  - phase: 78
    provides: HeroUI v3.2.1 Button as the current SearchableSelect trigger primitive
provides:
  - Wave-0 a11y contract regression test for SearchableSelect against the CURRENT (pre-rebuild) component
  - Evidence-backed verdicts on three a11y hazards (T-79-01 / T-79-02 / T-79-03) that 79-04 branches on
affects: [79-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Isolated component a11y test rendering REAL cmdk + Radix Popover (no primitive mocks); document-scope axe for portaled popover content; region rule disabled for isolated renders'

key-files:
  created:
    - frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx
  modified: []

key-decisions:
  - 'Split the trigger contract into surviving attrs (green) vs. Phase-78-stripped attrs (it.skip T-79-02) rather than force a red baseline — captures the real current state truthfully'
  - "Added the plan's open-state axe test with document.body scope (Radix portals) + region rule disabled; it is the T-79-03 skip owned by 79-04"

patterns-established:
  - 'Owner-assigned it.skip: every skipped case names 79-04 as the unskip owner with a T-79-0N tag'

requirements-completed: [ACET-01]

# Metrics
duration: ~35min
completed: 2026-07-03
---

# Phase 79-01: Wave-0 SearchableSelect a11y contract baseline

**Evidence-backed Wave-0 regression test capturing the Phase-75 ARIA/keyboard/validation contract against the CURRENT SearchableSelect — 7 passing assertions + 2 owner-assigned skips that encode two pre-existing a11y regressions Phase 78 introduced.**

## Performance

- **Duration:** ~35 min (incl. stalled-worker recovery + evidence re-verification)
- **Completed:** 2026-07-03T11:30:00Z
- **Tasks:** 2 (write test; triage axe/verdicts)
- **Files modified:** 1

## Accomplishments

- Wave-0 a11y test file exercising the REAL cmdk + Radix Popover (no primitive mocks): trigger attrs, clear/required/alert attrs 9–12, bilingual `role="alert"` (EN + AR literal `هذا الحقل مطلوب`), keyboard open→search-focus→Arrow→Enter-select and Escape-returns-focus, and jest-axe on the closed selected+error state.
- All three T-79-0N hazards resolved from **actual vitest+jest-axe runs**, not assumption.
- `wave_0_complete` may now flip true in 79-VALIDATION.md.

## Task Commits

1. **Task 1 + 2 (single artifact): a11y contract test + evidence triage** — `305ffb09` (test)

**Note:** Tasks 1 and 2 both modify the one test file; committed as a single atomic artifact rather than split, since the triage is inseparable from the assertions.

## Files Created/Modified

- `frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` — 7 passing / 2 skipped; renders real cmdk + Radix.

## Decisions Made

- Located the trigger by `getByRole('button', { name: /assignee/i })` because the current trigger's runtime role is **button, not combobox** (see T-79-02). This is the honest current-state locator; 79-04's restore makes `getByRole('combobox')` resolve.

## T-79-0N verdicts (READ BY 79-04)

- **T-79-01 (nested-interactive on the clear affordance): NOT flagged.** Closed-state axe is clean; the clear `<span role="button">` carries no `tabindex`, so axe does not treat it as a nested focusable control. **79-04 may preserve the clear affordance verbatim** — no restructure required for this hazard. (This overturns the plan's tentative "likely flagged" expectation.)

- **T-79-02 (NEW, pre-existing regression): REAL.** Phase-78's HeroUI v3 React-Aria Button **strips `role="combobox"`, `aria-invalid`, and `aria-required` from the rendered DOM** — the JSX sets them (SearchableSelect ~lines 434/440/441) but React Aria drops unknown props. cmdk also overrides the CommandList `id` with its own, so the trigger's `aria-controls` points at a non-existent element. Encoded as `it.skip('T-79-02 …')`. **79-04 MUST restore role=combobox + aria-invalid + aria-required on the trigger AND wire aria-controls to the real listbox id, then unskip.**

- **T-79-03 (NEW, pre-existing regression): REAL.** The open Radix `PopoverContent` renders `role="dialog"` with **no accessible name** → SERIOUS axe `aria-dialog-name` (verified with document-scope axe; the co-reported `region` violation is landmark harness-noise and is disabled in the test). Encoded as `it.skip('T-79-03 …')`. **79-04 MUST give the popover an accessible name (or drop the dialog role), then unskip.**

## Deviations from Plan

### Scope discovery (material — affects 79-04)

The plan framed 79-01 as capturing a contract that "should already pass" against the current component, expecting only the T-79-01 question. **Reality: two Phase-75 contract attributes are already broken in the CURRENT component (T-79-02, T-79-03), caused by the Phase-78 primitive migration — not by anything in this phase.** This is fully within the plan's Task-2 protocol ("if a genuine pre-existing violation is confirmed, apply the skip-with-comment protocol and record it for 79-04"), so it was handled as owner-assigned skips rather than halting.

**Impact on 79-04:** its "surgical strip while preserving the contract" scope **expands** — preserving the Phase-75 contract now also means _restoring_ the ARIA the Phase-78 Button stripped and _naming_ the popover. Both are within ACET-01 ("rebuilt with its accessibility contract provably preserved").

## Issues Encountered

- The first executor (dispatched as a visible `claude -p` pane worker) **stalled at 0% CPU** after writing the test file (machine under heavy concurrent-Claude load — another execute-phase + several `--effort max` sessions). Recovered by killing it and finishing 79-01 via the workflow's sequential-inline fallback (the visible foreground orchestrator). The stalled worker's written header claims were **re-verified from live test runs** before trusting them — T-79-03 in particular was only provable with document-scope axe (the worker had dropped that test), so it was rebuilt and confirmed.

## Next Phase Readiness

- Wave 1 continues: 79-02 (delete 7 dead) → 79-03 (registry + residue). Then 79-04 rebuild, which now carries the **restore T-79-02 + fix T-79-03 + unskip both** obligations in addition to its stated strip work.

---

_Phase: 79-aceternity-removal_
_Completed: 2026-07-03_
