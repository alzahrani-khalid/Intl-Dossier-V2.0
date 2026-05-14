---
phase: 50-test-infrastructure-repair
plan: 13
status: halted
discovered: 2026-05-14T18:09:40Z
head: 64ec6bb4
runner: pnpm --filter intake-frontend exec vitest --run --reporter=default
log: /tmp/phase50-13-live-discovery.log
---

# Plan 50-13 Discovery Halt

Plan 50-13 Task 0 requires a hard halt when the frontend default runner reports more than 8 failing files.

Live discovery on 2026-05-14T18:09:40Z reported:

- Test Files: 13 failed | 141 passed | 4 skipped (158)
- Tests: 147 failed | 1177 passed | 25 todo (1349)
- Exit code: 1

Because 13 failing files exceeds the Plan 50-13 ceiling of <=8, execution stopped before source changes.

## Failing Files

1. `src/components/__tests__/ConsistencyPanel.test.tsx`
2. `src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts`
3. `src/hooks/__tests__/usePersonalCommitments.test.ts`
4. `src/lib/__tests__/api-client.test.ts`
5. `tests/component/AssignmentDetailsModal.test.tsx`
6. `tests/component/BulkActionToolbar.test.tsx`
7. `tests/component/ConflictDialog.test.tsx`
8. `tests/component/ContributorsList.test.tsx`
9. `tests/component/EscalationDialog.test.tsx`
10. `tests/component/FilterPanel.test.tsx`
11. `tests/component/ReminderButton.test.tsx`
12. `tests/unit/analytics.cluster.test.tsx`
13. `tests/unit/routes.test.tsx`

## Required Operator Decision

Choose one corrective route before resuming execution:

1. Ratify Plan 50-13 scope expansion to cover all 13 files.
2. Split the residual into smaller follow-up plans, such as 50-13a for the six originally scoped files and 50-13b for the seven component assertion-drift files.
3. Explicitly move selected files out of the default runner with `split-to-integration` dispositions and corresponding audit/CI updates.

Do not bypass the ceiling gate without one of these decisions.
