---
phase: 46
phase_name: visual-baseline-regeneration
status: clean
depth: standard
files_reviewed: 14
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
reviewed_at: 2026-05-08
---

# Phase 46 Code Review

## Scope

Reviewed the Phase 46 source/config diff from `06f4ba0c^..HEAD`, excluding planning docs and PNG baselines.

- `.github/workflows/e2e.yml`
- `frontend/playwright.config.ts`
- `frontend/src/pages/Dashboard/index.tsx`
- `frontend/src/pages/Dashboard/widgets/Digest.tsx`
- `frontend/src/pages/Dashboard/widgets/KpiStrip.tsx`
- `frontend/src/pages/Dashboard/widgets/MyTasks.tsx`
- `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx`
- `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx`
- `frontend/src/pages/Dashboard/widgets/SlaHealth.tsx`
- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx`
- `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx`
- `frontend/src/pages/engagements/EngagementsListPage.tsx`
- `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`
- `frontend/tests/e2e/list-pages-visual.spec.ts`

## Findings

No critical, warning, or info findings.

## Residual Risk

- The visual CI job depends on the same Doppler/GitHub secrets as the existing E2E jobs.
- Repo-wide `pnpm test` remains blocked by local Supabase test environment availability; this predates Phase 46 and is recorded in the plan summary.

## Review Notes

- Dashboard widget `data-testid` additions are inert and do not alter component behavior.
- `Digest` is now rendered in the dashboard grid, which is required for the committed digest visual baseline.
- List visual locale seeding now occurs before route initialization, preventing AR snapshots from booting in the EN/LTR app state.
- Engagements now forwards `isLoading` to `ListPageShell`, aligning readiness markers with actual row loading.
- The focused CI job runs no-update visual replay commands and leaves the existing sharded E2E/report jobs intact.
