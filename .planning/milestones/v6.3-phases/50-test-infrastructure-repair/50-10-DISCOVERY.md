# Plan 50-10 Discovery

Captured: 2026-05-14T10:47:19Z

## Runner Snapshot

Command:

```sh
pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-10-discovery.log
```

Result:

```text
Test Files 26 failed | 128 passed | 4 skipped (158)
Tests 304 failed | 1046 passed | 25 todo (1375)
```

Pre-plan failing files total: 26

## Ceiling Check

In-scope failing files: 6

The plan-owned failing-file count is <=8, so Task 0 may proceed.

## In-Scope Files

- `frontend/tests/component/AfterActionForm.test.tsx`: 25 failed / 28 total - first failure: `Unable to find an element with the text: After-Action Record`; 50-09's ResizeObserver polyfill removed the prior `ResizeObserver is not defined` signature.
- `frontend/tests/component/CommitmentList.test.tsx`: 20 failed / 24 total - first failure: `Unable to find an element with the text: Commitments`.
- `frontend/tests/component/DecisionList.test.tsx`: 14 failed / 21 total - first failure cluster begins at `renders title and add button`; captured failures are assertion drift against rendered i18n keys.
- `frontend/tests/component/TaskCard.test.tsx`: 15 failed / 32 total - first failure cluster begins at `should display SLA indicator when deadline exists`; captured failures are mixed SLA text/class and current markup drift.
- `frontend/tests/component/SLAIndicator.test.tsx`: 27 failed / 34 total - first failure cluster begins at `displays safe status for future deadline`; captured failures are SLA text/class assertion drift.
- `frontend/tests/unit/FormInput.test.tsx`: 22 failed / 22 total - first failure cluster begins at `should render form input with label`; file still uses the old local i18n provider/mock pattern.

## Out-of-Scope Auto-Closed by 50-09

- None of the six plan-owned files auto-closed.
- `AfterActionForm.test.tsx` did shrink from the archived 28 failures to 25 failures because 50-09's global `ResizeObserver` polyfill removed the infrastructure error.

## 50-12 Cohort Keys Absent From setup.ts

These are absent from `frontend/tests/setup.ts` and will be added in Task 1.

- `forums:pageTitle` - absent; route renders `t('forums:pageTitle')`; canonical value from `frontend/src/i18n/en/forums.json` is `Forums`.
- `forums:pageSubtitle` - absent; route renders `t('forums:pageSubtitle')`; canonical value from `frontend/src/i18n/en/forums.json` is `International forums, conferences, and multilateral meetings`.
- `forums:empty.title` - absent; route renders `t('forums:empty.title')`; `frontend/public/locales/en/forums.json` contains `No forums yet`.
- `forums:empty.description` - absent; route renders `t('forums:empty.description')`; `frontend/public/locales/en/forums.json` contains `Forum dossiers will appear here.`
- `list-pages:search.placeholder` - absent; route renders `t('list-pages:search.placeholder', { defaultValue: 'Search' })`; use implementation fallback value `Search`.
- `monitoring.headings.dashboard` - absent; no monitoring locale bundle exists; derived from `frontend/src/pages/monitoring/Dashboard.tsx` literal `Monitoring Dashboard`.
- `monitoring.headings.health` - absent; no monitoring locale bundle exists; derived from `frontend/src/pages/monitoring/Dashboard.tsx` literal `Health`.
- `monitoring.headings.alerts` - absent; no monitoring locale bundle exists; derived from `frontend/src/pages/monitoring/Dashboard.tsx` literal `Alerts`.
