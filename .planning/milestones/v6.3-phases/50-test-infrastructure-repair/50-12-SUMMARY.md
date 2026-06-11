---
phase: 50-test-infrastructure-repair
plan: 12
subsystem: testing
tags: [vitest, design-system, dashboard, routing, frontend]
requires:
  - phase: 50-test-infrastructure-repair
    provides: '50-09 jsdom polyfills and 50-10 setup translation keys'
provides:
  - 'Discovery artifact proving the 7-file <=8 ceiling gate'
  - 'Seven Plan 50-12 owned frontend default-runner files passing'
  - 'Post-run residual count for Plan 50-13 inheritance'
affects: [phase-50, frontend-test-runner, plan-50-13]
tech-stack:
  added: []
  patterns:
    - 'Update stale assertions to current component and token contracts after D-09/D-10 review.'
    - 'Keep setup.ts read-only when a prior wave owns shared translation setup.'
key-files:
  created:
    - .planning/phases/50-test-infrastructure-repair/50-12-DISCOVERY.md
    - .planning/phases/50-test-infrastructure-repair/50-12-SUMMARY.md
  modified:
    - frontend/tests/unit/design-system/buildTokens.test.ts
    - frontend/tests/unit/design-system/fouc-bootstrap.test.ts
    - frontend/tests/unit/components/ui/heroui-wrappers.test.tsx
    - frontend/tests/unit/hooks/responsive.test.ts
    - frontend/src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx
    - frontend/src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx
    - frontend/tests/unit/monitoring.dashboard.test.tsx
key-decisions:
  - 'All seven scoped failures were TEST WRONG / Case II assertion drift; no product source files were changed.'
  - 'PCH-50R-01 honored: frontend/tests/setup.ts was read only and left unchanged.'
  - 'The full default runner remains red only due to residual out-of-scope files.'
patterns-established:
  - 'For generated/bootstrap literal drift guards, loosen scrape shape only when byte-match literals still agree with the canonical source.'
requirements-completed: [TEST-02]
duration: 24min
completed: 2026-05-14
---

# Phase 50 Plan 12: Design, Route, and Dashboard Test Repair Summary

**Seven owned default-runner test files now pass, reducing the frontend default-runner residual from 20 failed files to 13.**

## Accomplishments

- Recorded `50-12-DISCOVERY.md` with a 7-file in-scope failure count, within the <=8 ceiling.
- Repaired the design-system cluster: `buildTokens`, `fouc-bootstrap`, and HeroUI wrapper assertions.
- Repaired the hook/dashboard/route cluster: `useResponsive`, `KpiStrip`, `ForumsListPage`, and monitoring dashboard assertions.
- Confirmed `frontend/tests/setup.ts` stayed unchanged; 50-12 consumed the 50-10 setup keys without editing shared setup.
- Confirmed every 50-12-owned file passes both in a targeted combined run and inside the post-run default runner.

## Task Commits

1. **Task 0: Discovery and ceiling check** - `5c575db1`
2. **Task 1: Design-system assertion repair** - `aa145a03`
3. **Task 2: Route and dashboard assertion repair** - `a93fdaaa`

**Plan metadata:** committed separately after this summary file.

## Per-File Disposition

| File                                                                               | Verdict              | Commit     | Rationale                                                                                                                                              |
| ---------------------------------------------------------------------------------- | -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/tests/unit/design-system/buildTokens.test.ts`                            | TEST WRONG           | `aa145a03` | Plan 41 darkened the light `--sla-bad` token to `oklch(46% 0.18 25)` for contrast; the test still expected the older `54%/0.2` value.                  |
| `frontend/tests/unit/design-system/fouc-bootstrap.test.ts`                         | Case II / TEST WRONG | `aa145a03` | Bootstrap palette literals still matched canonical directions; the scrape regex was too strict for compact objects with additional first-paint fields. |
| `frontend/tests/unit/components/ui/heroui-wrappers.test.tsx`                       | TEST WRONG           | `aa145a03` | The wrappers now expose semantic local classes (`btn-danger`, `data-slot="badge"`) rather than the stale assertions.                                   |
| `frontend/tests/unit/hooks/responsive.test.ts`                                     | TEST WRONG           | `a93fdaaa` | The hook exposes `alias`, `up`, `down`, `between`, and `containerQueries`; stale tests imported removed helpers and old field names.                   |
| `frontend/src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx`                 | TEST WRONG           | `a93fdaaa` | The widget intentionally renders design-fixture deltas and isolates the numeral child, not the whole value container.                                  |
| `frontend/src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx` | TEST WRONG           | `a93fdaaa` | Its per-file i18n mock still mapped old `forums:title` keys instead of current `forums:pageTitle` keys.                                                |
| `frontend/tests/unit/monitoring.dashboard.test.tsx`                                | TEST WRONG           | `a93fdaaa` | A broad text query matched both the `Health` heading and loaded `healthy` status text; role-specific heading assertions match the page contract.       |

## Verification

- `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-12-discovery.log` - expected failure baseline captured: `Test Files 20 failed | 134 passed | 4 skipped (158)`, `Tests 181 failed | 1149 passed | 25 todo (1355)`.
- `pnpm --filter intake-frontend exec vitest --run --reporter=default tests/unit/design-system/buildTokens.test.ts tests/unit/design-system/fouc-bootstrap.test.ts tests/unit/components/ui/heroui-wrappers.test.tsx` - passed: 3 files, 120 tests.
- `pnpm --filter intake-frontend exec vitest --run --reporter=default tests/unit/hooks/responsive.test.ts src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx tests/unit/monitoring.dashboard.test.tsx` - passed: 4 files, 19 tests.
- `pnpm --filter intake-frontend exec vitest --run --reporter=default tests/unit/design-system/buildTokens.test.ts tests/unit/design-system/fouc-bootstrap.test.ts tests/unit/components/ui/heroui-wrappers.test.tsx tests/unit/hooks/responsive.test.ts src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx tests/unit/monitoring.dashboard.test.tsx` - passed: 7 files, 139 tests.
- `set -o pipefail; pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-12-final-default.log` - expected failure from out-of-scope files only: `Test Files 13 failed | 141 passed | 4 skipped (158)`, `Tests 147 failed | 1177 passed | 25 todo (1349)`.
- Normal commit hooks passed for both repair commits; hook output retained existing build warnings and knip findings outside this plan's ownership.

## Pre/Post Failing Counts

| Runner               | Failed test files | Owned files failing | Outcome                                                  |
| -------------------- | ----------------: | ------------------: | -------------------------------------------------------- |
| Task 0 baseline      |                20 |                   7 | Discovery gate passed; owned count <=8.                  |
| Final default runner |                13 |                   0 | Seven owned files closed; residual routed to Plan 50-13. |

## Residual Files for Plan 50-13

The final default-runner failures are outside Plan 50-12 ownership:

- `src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts`
- `src/lib/__tests__/api-client.test.ts`
- `src/hooks/__tests__/usePersonalCommitments.test.ts`
- `tests/unit/analytics.cluster.test.tsx`
- `src/components/__tests__/ConsistencyPanel.test.tsx`
- `tests/component/BulkActionToolbar.test.tsx`
- `tests/component/AssignmentDetailsModal.test.tsx`
- `tests/component/EscalationDialog.test.tsx`
- `tests/component/ContributorsList.test.tsx`
- `tests/component/ConflictDialog.test.tsx`
- `tests/component/ReminderButton.test.tsx`
- `tests/component/FilterPanel.test.tsx`
- `tests/unit/routes.test.tsx`

## Deviations from Plan

None. No `queued-with-rationale` disposition was used, and no product-source implementation file required changes.

## Issues Encountered

- The full default runner still exits 1 because 13 out-of-scope files remain red. This is expected Phase 50 residual work and should be handled by Plan 50-13.
- Vitest emitted existing jsdom warnings such as `Window.scrollTo()` not implemented, Radix dialog warnings, MSW unhandled request diagnostics, and React `act(...)` warnings in out-of-scope suites.

## Known Stubs

None introduced.

## Threat Flags

None. Changes were limited to test files.

## User Setup Required

None.

## Next Phase Readiness

Plan 50-13 can proceed with a 13-file default-runner residual. Plan 50-12-owned files pass in targeted verification and in the full default-runner post-run.

## Self-Check: PASSED

- `50-12-DISCOVERY.md` and `50-12-SUMMARY.md` exist.
- Required plan commits are reachable in git history.
- Seven scoped test files pass together.
- `frontend/tests/setup.ts` was not modified.
- No `queued-with-rationale` disposition was used.

---

_Phase: 50-test-infrastructure-repair_
_Completed: 2026-05-14_
