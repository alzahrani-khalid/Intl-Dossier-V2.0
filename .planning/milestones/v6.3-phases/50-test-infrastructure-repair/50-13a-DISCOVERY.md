---
phase: 50-test-infrastructure-repair
plan: 13a
status: discovery-passed
captured: 2026-05-14T18:52:19Z
head: 83f369b5
runner: pnpm --filter intake-frontend exec vitest --run --reporter=default
log: /tmp/phase50-13a-discovery.log
---

# Plan 50-13a Discovery

Task 0 re-ran the frontend default runner after Plans 50-09, 50-10, 50-11, and 50-12.

Result:

- Test Files: 13 failed | 141 passed | 4 skipped (158)
- Tests: 147 failed | 1177 passed | 25 todo (1349)
- Exit code: 1

## Ceiling Check

Plan 50-13a excludes the 7 `tests/component/` files owned by Plan 50-13b. The scoped 50-13a failing-file count is 6, which is within the <=8 plan ceiling.

Verdict: PASS - proceed with Plan 50-13a Tasks 1 and 2.

## 50-13a In-Scope Failing Files

1. `src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts`
   - 3 tests | 2 failed.
   - Signature: fixture still provides stale `code` / `code3` fields; implementation writes `undefined` to `iso_code_2` and `iso_code_3`.
2. `src/lib/__tests__/api-client.test.ts`
   - 6 tests | 6 failed.
   - Signature: MSW rejects unhandled `functions/v1/*` and `/api/health` requests under `onUnhandledRequest: 'error'`.
3. `src/hooks/__tests__/usePersonalCommitments.test.ts`
   - 6 tests | 4 failed.
   - Signature: hook now calls React Query directly for dossier lookup and the test lacks `QueryClientProvider`.
4. `tests/unit/analytics.cluster.test.tsx`
   - 1 test | 1 failed.
   - Signature: `useLanguage must be used within a LanguageProvider`.
5. `tests/unit/routes.test.tsx`
   - 14 tests | 13 failed.
   - Signature: route assertions time out; stderr also reports `indexedDB is not defined` during offline-queue module evaluation and warns that `vi.mock("../../src/hooks/useDossier")` is not top-level.
6. `src/components/__tests__/ConsistencyPanel.test.tsx`
   - 17 tests | 9 failed.
   - Signature: raw `consistency.*` translation keys render; several assertions still expect translated labels such as `Modify Position` and `View Conflicting Position`.

## Out Of Scope For 50-13a

The following failing files are intentionally excluded from the 50-13a ceiling and are owned by Plan 50-13b:

1. `tests/component/AssignmentDetailsModal.test.tsx`
2. `tests/component/BulkActionToolbar.test.tsx`
3. `tests/component/ConflictDialog.test.tsx`
4. `tests/component/ContributorsList.test.tsx`
5. `tests/component/EscalationDialog.test.tsx`
6. `tests/component/FilterPanel.test.tsx`
7. `tests/component/ReminderButton.test.tsx`

Shared signature: missing `waitingQueue.*`, `tasks.*`, and adjacent component translation-map keys in `frontend/tests/setup.ts` cause raw i18n keys to render instead of expected English copy.
