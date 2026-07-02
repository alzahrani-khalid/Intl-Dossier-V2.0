---
phase: 75-ui-component-migration-audit
plan: 03
subsystem: ui
tags: [audit, aceternity, react-hook-form, zod, aria, rtl, forms, heroui, radix, cmdk]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit
    provides: 75-RESEARCH (liveness/ARIA ground truth), 75-CONTEXT (AUDIT-04 decision rules)
provides:
  - 75-AUDIT-aceternity-contracts.md — behavioral contracts for all 8 Aceternity-styled form components
  - Per-component 7-field contracts (Liveness, RHF wiring, Zod linkage, ARIA, Keyboard/focus, RTL, Animation-only)
  - UserPicker facade contract with 4 named live consumers
  - Phase 79 rescope-input evidence (7-of-8-dead) without rescoping Phase 79
affects: [79-aceternity-removal, 76-rtl-bridge, 77-tokens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Per-component contract capture led by fresh liveness evidence (symbol-grep, not barrel presence)'
    - 'Facade-contract capture: preserve the wrapper prop surface, internals free to be rebuilt'

key-files:
  created:
    - .planning/phases/75-ui-component-migration-audit/75-AUDIT-aceternity-contracts.md
  modified: []

key-decisions:
  - 'Recorded 7-of-8 components as dead code but deferred the rebuild-vs-delete decision to the user at Phase 79 planning (RESEARCH Open Question 1 resolution)'
  - 'Recorded fresh ARIA counts as authoritative where they drift from research (SmartInput 5 not 6; SearchableSelect 12 explicit + cmdk internals, not 13 literal)'
  - 'Flagged the missing error live-region (role=alert/aria-live) on the 5 simple components as a preserve-or-improve item for Phase 79, not preserve-as-is'

patterns-established:
  - 'Liveness authority = symbol-level grep; barrel presence is explicitly NOT liveness'
  - 'Contractual vs non-contractual split per field so Phase 79 knows exactly what it may drop (animations) vs must keep (validation/ARIA/keyboard)'

requirements-completed: [AUDIT-04]

# Metrics
duration: 12min
completed: 2026-07-02
---

# Phase 75 Plan 03: AUDIT-04 Aceternity Behavioral Contracts Summary

**Wrote behavioral contracts for all 8 Aceternity-styled form components — each led by fresh 2026-07-02 liveness evidence (7 of 8 dead, SearchableSelect live only via the UserPicker facade) — capturing RHF/Zod wiring, ARIA/error-announcement, keyboard-focus, and RTL, plus a Phase 79 rescope-input note that records the dead-code finding without rescoping Phase 79.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-02T10:37Z (approx)
- **Completed:** 2026-07-02T10:49Z
- **Tasks:** 3
- **Files modified:** 1 created (docs-only)

## Accomplishments

- Created `75-AUDIT-aceternity-contracts.md` (473 lines): header defining "Aceternity" as a `variant` prop + motion (not a library import), the motion-is-not-the-discriminator caveat, and a top summary table for all 8 components.
- Pasted the dated, re-runnable liveness loop: 7 of 8 components have 0 external call sites; the forms barrel is imported by nothing; SearchableSelect is transitively live via UserPicker's 4 production consumers (the 5th grep match is a `vi.doMock` test stub, noted as such).
- Wrote all 8 contracts with the fixed 7-field template, each ARIA field citing the actual attributes read from source (verified by grep), including the client-vs-server error precedence for FormFieldWithValidation and the full combobox pattern for SearchableSelect.
- Captured the UserPicker facade contract with all 4 consumers (binding style each) and the facade-preservation rule for Phase 79.
- Wrote the exact-heading "Phase 79 rescope input" section: 7-of-8-dead evidence, corrected the stale ValidationDemoPage claim (0 refs — deleted in PR #88/#89), and deferred the rebuild-vs-delete decision to the user.

## Task Commits

Each task was committed atomically:

1. **Task 1: Skeleton + liveness + 5 dead-component contracts** - `2bc00eee` (docs)
2. **Task 2: FormFieldWithValidation + SmartInput contracts** - `af7b62d2` (docs)
3. **Task 3: SearchableSelect + UserPicker facade + Phase 79 rescope input** - `0d4af142` (docs)

_Task 2's commit also folded in the markdown-render fix for Task 1 (see Deviations)._

## Files Created/Modified

- `.planning/phases/75-ui-component-migration-audit/75-AUDIT-aceternity-contracts.md` - AUDIT-04 deliverable: 8 behavioral contracts + UserPicker facade contract + Phase 79 rescope-input evidence, consumed by Phase 79.

## Decisions Made

- **Fresh evidence overrides research where it drifts.** SmartInput's ARIA count is recorded as 5 (research said 6); SearchableSelect as 12 explicit + cmdk-supplied internals (research said 13). Recorded the actuals with the discrepancy called out.
- **Documented, did not decide, the rescope.** Per RESEARCH Open Question 1, the 7-dead finding is recorded as Phase 79 planning input; the rebuild-vs-delete call stays with the user.
- **Recorded contract gaps as preserve-or-improve.** The 5 simple components announce errors via `aria-describedby` only (no `role="alert"`/`aria-live`); only FormFieldWithValidation, SmartInput, and SearchableSelect have live regions. Flagged the gap so Phase 79 closes rather than faithfully reproduces it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed markdown mangled by the prettier pre-commit hook**

- **Found during:** Task 1 (after the Task 1 commit; corrected within Task 2)
- **Issue:** The FormInputAceternity and FormRadioAceternity ARIA fields used escaped backticks nested inside inline-code spans (`` \`${name}\` ``). The prettier lint-staged hook reflowed those lines into malformed markdown (escaped `\*\*`, code spans glued to text), hurting readability of the delivered doc.
- **Fix:** Rewrote both ARIA fields to reference ids as plain text (`{name}-error`, `{name}-{option.value}`), removing all nested-backtick escapes. Re-verified with `grep` for escaped-backtick patterns → no matches remain.
- **Files modified:** `.planning/phases/75-ui-component-migration-audit/75-AUDIT-aceternity-contracts.md`
- **Verification:** No escaped-backtick patterns remain; prettier re-run on the Task 2/Task 3 commits produced no further mangling.
- **Committed in:** `af7b62d2` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 doc-rendering bug)
**Impact on plan:** Cosmetic/readability only; no change to the audit's factual content or scope. No scope creep.

## Issues Encountered

- The UserPicker liveness grep returned a 5th match (`CreateTaskCtas.test.tsx`). Inspection showed it only `vi.doMock`s UserPicker — a test stub, not a live consumer. Recorded the 4 production consumers and annotated the test-stub match explicitly so it isn't miscounted later.

## User Setup Required

None - docs-only audit, no external service configuration.

## Next Phase Readiness

- **Phase 79 (Aceternity Removal)** now has a concrete written baseline for ROADMAP criteria 1-2 (RHF/Zod + ARIA + keyboard-focus preservation) to verify against, plus the 7-of-8-dead evidence and the facade-preservation rule needed to make the rebuild-vs-delete decision at planning.
- **Open input for Phase 79 planning (user decision):** ROADMAP line 212 still says "8 form components rebuilt on HeroUI v3/Radix"; the audit records that 7 are dead so the user may choose to rebuild-only-the-live-path + delete the dead 7. The audit does not rescope Phase 79.

---

_Phase: 75-ui-component-migration-audit_
_Completed: 2026-07-02_
