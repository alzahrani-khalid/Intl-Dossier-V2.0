---
phase: 50-test-infrastructure-repair
plan: 11
subsystem: testing
tags: [vitest, accessibility, playwright, jsdom, wcag]

requires:
  - phase: 50-test-infrastructure-repair
    provides: '50-01 vitest include/exclude baseline and 50-09 jsdom polyfills'
provides:
  - 'Discovery artifact proving the 4-file <=8 ceiling gate'
  - 'Playwright-style entity-search a11y test removed from Vitest collection'
  - 'WCAG compliance and waiting queue accessibility tests green under Vitest'
  - 'Validation-speed test moved out of the default runner into integration scope'
affects: [frontend-test-runner, accessibility-tests, integration-test-split]

tech-stack:
  added: []
  patterns:
    - 'Rename Playwright-style default-runner files to .spec.ts so Vitest excludes them.'
    - 'Convert JSX-bearing Vitest files from .ts to .tsx instead of broad runner changes.'
    - 'Repair accessibility tests against the current LanguageProvider and waiting queue component exports.'

key-files:
  created:
    - .planning/phases/50-test-infrastructure-repair/50-11-DISCOVERY.md
    - .planning/phases/50-test-infrastructure-repair/50-11-SUMMARY.md
  modified:
    - frontend/playwright.config.ts
    - frontend/vitest.config.ts
    - frontend/tests/a11y/wcag-compliance.test.tsx
    - frontend/tests/accessibility/waiting-queue-a11y.test.tsx
    - frontend/tests/accessibility/entity-search.a11y.spec.ts
    - frontend/tests/performance/validation-speed.test.tsx
  deleted:
    - frontend/tests/accessibility/entity-search.a11y.test.ts
    - frontend/tests/a11y/wcag-compliance.test.ts
    - frontend/tests/performance/validation-speed.test.ts

key-decisions:
  - 'Used the default CC-5 disposition for entity-search: rename to .spec.ts and keep Playwright ownership.'
  - 'Repaired wcag-compliance by converting the file to .tsx because the failures were JSX parser drift, not product drift.'
  - 'Split validation-speed out of the default runner with an explicit Vitest exclude entry.'
  - 'Repaired waiting-queue-a11y against current component exports and LanguageProvider instead of deferring it.'

patterns-established:
  - 'Default-runner accessibility tests that render JSX must use .tsx.'
  - 'Waiting queue test harnesses should wrap with LanguageProvider plus QueryClientProvider.'
  - 'No queued-with-rationale disposition is used for default-runner files.'

requirements-completed: [TEST-02]

duration: 28min
completed: 2026-05-14
---

# Phase 50 Plan 11: A11y and Performance Outlier Repair Summary

**Four outlier files were removed from the frontend default-runner failure set through concrete repair, rename, or integration split.**

## Accomplishments

- Recorded the required discovery snapshot in `50-11-DISCOVERY.md`: 4 scoped failing files, within the <=8 ceiling.
- Renamed `entity-search.a11y.test.ts` to `entity-search.a11y.spec.ts` and kept Playwright collection aligned.
- Converted `wcag-compliance.test.ts` to `.tsx`; the file now runs as a real Vitest suite.
- Split `validation-speed.test.tsx` to the integration runner by excluding it from the default Vitest config.
- Repaired `waiting-queue-a11y.test.tsx`; its 30 tests now pass under Vitest.

## Task Commits

1. **Task 0: Discovery and ceiling check** - `5fc364a6`
2. **Task 1: Rename Playwright a11y spec** - `30680449`
3. **Task 2: Repair WCAG compliance collection** - `b5896386`
4. **Task 3: Split validation-speed to integration runner** - `4b1c003a`
5. **Task 4: Repair waiting queue a11y harness** - `56f65859`

## Verification

- `pnpm --filter intake-frontend exec vitest --run --reporter=default tests/a11y tests/accessibility tests/performance` - Passed.
  - `Test Files 2 passed (2)`
  - `Tests 48 passed (48)`
- `pnpm --filter intake-frontend exec vitest --run tests/accessibility/waiting-queue-a11y.test.tsx --reporter=default` - Passed.
  - `Test Files 1 passed (1)`
  - `Tests 30 passed (30)`
- Commit hook on `56f65859` ran `turbo run build` successfully for backend and frontend.

## Deviations from Plan

### Auto-fixed Issues

**1. Waiting queue repair required current provider/export alignment**

- **Found during:** Task 4
- **Issue:** The stale test used deleted/default import shapes and an obsolete i18n provider wrapper.
- **Fix:** Reconciled the test with named waiting queue exports, `LanguageProvider`, and current prop shapes.
- **Files modified:** `frontend/tests/accessibility/waiting-queue-a11y.test.tsx`
- **Verification:** 30/30 waiting queue accessibility tests passed.
- **Committed in:** `56f65859`

**2. Summary rescue from hung parallel executor**

- **Found during:** Orchestrator reconciliation
- **Issue:** The parallel executor produced `50-09-SUMMARY.md` without a completion signal. During the follow-up amend, the summary was committed alongside the final 50-11 waiting queue repair.
- **Fix:** Kept the summary artifact because it is valid and committed; this 50-11 summary records the cross-plan commit shape explicitly.
- **Files modified:** `.planning/phases/50-test-infrastructure-repair/50-09-SUMMARY.md`
- **Committed in:** `56f65859`

---

**Total deviations:** 2 auto-fixed issues.
**Impact on plan:** No scope was deferred; default-runner files were fixed, renamed to Playwright, or split to integration.

## Issues Encountered

- The executor session did not return a final completion signal after committing code. The orchestrator used filesystem and git spot-checks, then completed this summary directly.
- Existing React act warnings and Radix dialog warnings remain in test stderr, but they do not fail the repaired suites.
- MSW warns about unhandled validation/metrics requests in `wcag-compliance.test.tsx`; the suite still passes and this plan did not broaden into network mock policy.

## Known Stubs

None.

## Threat Flags

None. This plan changes test files and test-runner classification only.

## User Setup Required

None.

## Next Phase Readiness

Plan 50-10 can proceed with centralized translation-map repairs. Plan 50-12 can consume the Wave 2 polyfill and a11y cleanup baseline.

## Self-Check: PASSED

- `50-11-DISCOVERY.md` and `50-11-SUMMARY.md` exist.
- Required plan commits are reachable in git history.
- Scoped Vitest run for `tests/a11y tests/accessibility tests/performance` exits 0.
- No `queued-with-rationale` disposition was used.

---

_Phase: 50-test-infrastructure-repair_
_Completed: 2026-05-14_
