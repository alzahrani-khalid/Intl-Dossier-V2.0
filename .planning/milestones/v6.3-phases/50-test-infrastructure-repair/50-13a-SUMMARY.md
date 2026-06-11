---
phase: 50-test-infrastructure-repair
plan: 13a
subsystem: testing
tags: [vitest, route-harness, frontend, jsdom, msw]
requires:
  - phase: 50-test-infrastructure-repair
    provides: 'Plans 50-09 through 50-12 residual reduction'
provides:
  - 'Discovery artifact proving the Plan 50-13a <=8 scoped ceiling gate'
  - 'Six Plan 50-13a owned frontend default-runner files passing'
  - 'useCountryAutoFill REST Countries v3.1 fixture and runtime null guards'
  - 'Route test harness aligned to protected type-specific dossier routes'
  - 'Post-run residual count for Plan 50-13b inheritance'
affects: [phase-50, frontend-test-runner, plan-50-13b]
tech-stack:
  added: []
  patterns:
    - 'Keep protected route tests explicit about auth and shell providers.'
    - 'Use setup.ts for harmless shared jsdom browser API gaps.'
key-files:
  created:
    - .planning/phases/50-test-infrastructure-repair/50-13a-DISCOVERY.md
    - .planning/phases/50-test-infrastructure-repair/50-13a-SUMMARY.md
  modified:
    - frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts
    - frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts
    - frontend/tests/unit/analytics.cluster.test.tsx
    - frontend/src/hooks/__tests__/usePersonalCommitments.test.ts
    - frontend/src/lib/__tests__/api-client.test.ts
    - frontend/tests/setup.ts
    - frontend/src/components/__tests__/ConsistencyPanel.test.tsx
    - frontend/tests/unit/routes.test.tsx
key-decisions:
  - 'No split-to-integration disposition was used in 50-13a.'
  - 'Route tests were aligned to the current type-specific path contract instead of reviving stale /dossiers/:id?tab= assertions.'
  - 'Full default runner remains red only due to the Plan 50-13b component cluster.'
patterns-established:
  - 'Route unit tests mock heavyweight protected shell providers and assert route state directly.'
requirements-completed: [TEST-02]
duration: 76min
completed: 2026-05-14
---

# Phase 50 Plan 13a: Frontend Infrastructure Residual Repair Summary

**Six owned default-runner files now pass, reducing the frontend default-runner residual from 13 failed files to the 7-file Plan 50-13b component cluster.**

## Accomplishments

- Recorded `50-13a-DISCOVERY.md` with 6 in-scope failed files, within the <=8 ceiling.
- Repaired the must-fix `useCountryAutoFill` contract: REST Countries v3.1 fixture shape, lower-case mapped region assertion, capital assertion, and three runtime null guards.
- Wrapped the analytics cluster test in the app provider harness.
- Repaired the personal commitments hook test with a React Query wrapper and dossier lookup mock.
- Repaired API client tests by using MSW handlers instead of a competing global fetch mock.
- Restored the consistency panel test keys in `frontend/tests/setup.ts` and tightened ambiguous assertions.
- Rebuilt the protected route unit harness around the current type-specific dossier routes and protected shell dependencies.
- Added a shared jsdom `window.scrollTo` no-op because TanStack Router calls it during route navigation in tests.
- Confirmed every 50-13a-owned file passes in targeted verification and inside the post-run default runner.

## Task Commits

1. **Task 0: Discovery and ceiling check** - `fcc176b8`
2. **Task 1: useCountryAutoFill fixture and null guards** - `de104874`
3. **Task 2a: Analytics provider wrapper** - `0ff42112`
4. **Task 2b: Personal commitments hook provider and Supabase lookup mock** - `bba28dcb`
5. **Task 2c: API client MSW handler alignment** - `5e3fde62`
6. **Task 2d: Consistency panel translations and assertions** - `2997ed1d`
7. **Task 2e: Protected route harness repair** - `9c07a21b`

**Plan metadata:** committed separately after this summary file.

## Per-File Disposition

| File                                                                                | Verdict                        | Commit                 | Rationale                                                                                                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts`                | IMPL HARDENING                 | `de104874`             | Runtime guards now prevent nullish `cca2`, `cca3`, or `region` values from being written into the form while preserving the REST contract.      |
| `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` | TEST WRONG                     | `de104874`             | Test fixture now matches REST Countries v3.1 fields and asserts the mapped `asia` value plus capital auto-fill.                                 |
| `frontend/tests/unit/analytics.cluster.test.tsx`                                    | TEST HARNESS                   | `0ff42112`             | The test rendered a provider-dependent component with raw RTL `render`; `renderWithProviders` supplies the missing language provider.           |
| `frontend/src/hooks/__tests__/usePersonalCommitments.test.ts`                       | TEST HARNESS                   | `bba28dcb`             | The hook needs React Query context and the dossier lookup path mocked before the commitment query can settle.                                   |
| `frontend/src/lib/__tests__/api-client.test.ts`                                     | TEST HARNESS                   | `5e3fde62`             | The suite's global fetch mock bypassed the shared MSW server contract; explicit MSW handlers now drive the request/response assertions.         |
| `frontend/src/components/__tests__/ConsistencyPanel.test.tsx`                       | I18N / ASSERTION DRIFT         | `2997ed1d`             | Missing consistency translation keys exposed raw labels, and broad date/overlap text queries were ambiguous under current rendering.            |
| `frontend/tests/unit/routes.test.tsx`                                               | ROUTE CONTRACT / HARNESS DRIFT | `9c07a21b`             | The route suite targeted stale generic dossier URLs and imported heavyweight shell providers; it now asserts current type-specific path routes. |
| `frontend/tests/setup.ts`                                                           | SHARED TEST ENV SUPPORT        | `2997ed1d`, `9c07a21b` | Added only the consistency translations and the jsdom `window.scrollTo` no-op needed by current tests.                                          |

## Verification

- `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-13a-discovery.log` - expected failure baseline captured: `Test Files 13 failed | 141 passed | 4 skipped (158)`, `Tests 147 failed | 1177 passed | 25 todo (1349)`.
- `pnpm --filter intake-frontend exec vitest --run src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts --reporter=default` - passed: 1 file, 3 tests.
- `pnpm --filter intake-frontend exec vitest --run tests/unit/analytics.cluster.test.tsx --reporter=default` - passed: 1 file, 1 test.
- `pnpm --filter intake-frontend exec vitest --run src/hooks/__tests__/usePersonalCommitments.test.ts --reporter=default` - passed: 1 file, 6 tests.
- `pnpm --filter intake-frontend exec vitest --run src/lib/__tests__/api-client.test.ts --reporter=default` - passed: 1 file, 6 tests.
- `pnpm --filter intake-frontend exec vitest --run src/components/__tests__/ConsistencyPanel.test.tsx --reporter=default` - passed: 1 file, 17 tests.
- `pnpm --filter intake-frontend exec vitest --run tests/unit/routes.test.tsx --reporter=default` - passed: 1 file, 14 tests.
- `pnpm --filter intake-frontend exec vitest --run src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts tests/unit/analytics.cluster.test.tsx src/hooks/__tests__/usePersonalCommitments.test.ts src/lib/__tests__/api-client.test.ts src/components/__tests__/ConsistencyPanel.test.tsx tests/unit/routes.test.tsx --reporter=default` - passed: 6 files, 47 tests.
- `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-13a-post.log` - expected failure from out-of-scope Plan 50-13b files only: `Test Files 7 failed | 147 passed | 4 skipped (158)`, `Tests 112 failed | 1212 passed | 25 todo (1349)`.
- Normal commit hooks passed for every repair commit; hook output retained existing build warnings and knip findings outside this plan's ownership.

## Pre/Post Failing Counts

| Runner               | Failed test files | Owned files failing | Outcome                                                 |
| -------------------- | ----------------: | ------------------: | ------------------------------------------------------- |
| Task 0 baseline      |                13 |                   6 | Discovery gate passed; owned count <=8.                 |
| Final default runner |                 7 |                   0 | Six owned files closed; residual routed to Plan 50-13b. |

## Residual Files for Plan 50-13b

The final default-runner failures are outside Plan 50-13a ownership:

- `tests/component/AssignmentDetailsModal.test.tsx`
- `tests/component/BulkActionToolbar.test.tsx`
- `tests/component/ConflictDialog.test.tsx`
- `tests/component/ContributorsList.test.tsx`
- `tests/component/EscalationDialog.test.tsx`
- `tests/component/FilterPanel.test.tsx`
- `tests/component/ReminderButton.test.tsx`

## Deviations from Plan

- `frontend/vitest.config.ts` was not modified because no file needed a `split-to-integration` disposition.
- `frontend/tests/setup.ts` received a `window.scrollTo` jsdom no-op rather than an indexedDB polyfill. The final route harness did not need indexedDB once heavyweight shell imports were mocked out.

## Issues Encountered

- The full default runner still exits 1 because seven out-of-scope files remain red. This is expected Plan 50-13b work.
- Vitest emitted existing warnings from the residual component cluster, including canvas/Radix/MSW/React `act(...)` diagnostics. These remain in 50-13b scope.

## Known Stubs

None introduced. The route test uses explicit test harness mocks for protected shell dependencies.

## Threat Flags

None. Product-source changes were limited to the `useCountryAutoFill` runtime guards specified by the plan.

## User Setup Required

None.

## Next Phase Readiness

Plan 50-13b can proceed with a 7-file default-runner residual. Plan 50-13a-owned files pass in targeted verification and in the full default-runner post-run.

## Self-Check: PASSED

- `50-13a-DISCOVERY.md` and `50-13a-SUMMARY.md` exist.
- Required plan commits are reachable in git history.
- Six scoped test files pass together.
- No `split-to-integration` or `queued-with-rationale` disposition was used.
- Full default-runner residual is exactly the 7-file Plan 50-13b component cluster.

---

_Phase: 50-test-infrastructure-repair_
_Completed: 2026-05-14_
