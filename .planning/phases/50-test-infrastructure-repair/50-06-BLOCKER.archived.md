# Plan 50-06 Blocker

Captured: 2026-05-14

## Status

Plan 50-06 is blocked at Task 4 verification. Do not write `50-06-SUMMARY.md` or treat 50-06 as complete until the failed-file ceiling is reconciled.

## Completed Work

- `ef2fbcfe` archived superseded Plan 50-02 as `50-02-PLAN.archived.md`.
- `3ef2eecc` added `@testing-library/jest-dom` and registered the Vitest matcher import.
- `53ee68a6` stubbed Supabase env vars in `frontend/tests/setup.ts`.
- `7c74ba16` added `frontend/tests/utils/render.tsx`, migrated the nine planned files to `renderWithProviders`, and patched migrated per-file `react-i18next` mocks so they preserve actual exports required by `src/i18n/index.ts`.

## Blocking Verification

Command:

```sh
pnpm --filter intake-frontend exec vitest --run --reporter=default
```

Result captured in `/tmp/phase50-06-task4-full-after-mock-fix.log`:

```text
Test Files 30 failed | 126 passed | 4 skipped (160)
Tests 371 failed | 961 passed | 25 todo (1357)
```

Plan 50-06 Task 4 requires the frontend default runner to be at `<=15` failing files after CC-1/CC-2/CC-3/CC-4. Actual result is 30 failed files, so the plan's scope estimate is still invalid.

## Residual Failed Files

- `src/components/__tests__/ConsistencyPanel.test.tsx`
- `src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts`
- `src/hooks/__tests__/usePersonalCommitments.test.ts`
- `src/lib/__tests__/api-client.test.ts`
- `src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx`
- `src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx`
- `tests/a11y/wcag-compliance.test.ts`
- `tests/accessibility/entity-search.a11y.test.ts`
- `tests/accessibility/waiting-queue-a11y.test.tsx`
- `tests/component/AfterActionForm.test.tsx`
- `tests/component/AssignmentDetailsModal.test.tsx`
- `tests/component/BulkActionToolbar.test.tsx`
- `tests/component/CommitmentList.test.tsx`
- `tests/component/ConflictDialog.test.tsx`
- `tests/component/ContributorsList.test.tsx`
- `tests/component/DecisionList.test.tsx`
- `tests/component/EscalationDialog.test.tsx`
- `tests/component/FilterPanel.test.tsx`
- `tests/component/ReminderButton.test.tsx`
- `tests/component/SLAIndicator.test.tsx`
- `tests/component/TaskCard.test.tsx`
- `tests/performance/validation-speed.test.ts`
- `tests/unit/FormInput.test.tsx`
- `tests/unit/analytics.cluster.test.tsx`
- `tests/unit/components/ui/heroui-wrappers.test.tsx`
- `tests/unit/design-system/buildTokens.test.ts`
- `tests/unit/design-system/fouc-bootstrap.test.ts`
- `tests/unit/hooks/responsive.test.ts`
- `tests/unit/monitoring.dashboard.test.tsx`
- `tests/unit/routes.test.tsx`

## Required Routing

The current 50-06/50-07/50-08 split is not sufficient as written:

- 50-06 cannot meet its `<=15` failed-file gate.
- Even if 50-07 clears its four planned outliers, 50-08 would still start above its `<=12` discovery ceiling.

Route options:

1. Replan Phase 50 residual frontend test repair into smaller bounded plans.
2. Ratify an expanded 50-08 scope with a higher ceiling.
3. Split default-runner residuals into additional setup/provider plans before per-file drift triage.
