---
phase: 50-test-infrastructure-repair
plan: 10
subsystem: testing
tags: [vitest, react-testing-library, i18n, frontend]
requires:
  - phase: 50-test-infrastructure-repair
    provides: '50-01 and 50-09 setup/render harness repairs'
provides:
  - 'Six Wave-3 owned frontend default-runner tests passing'
  - 'Central Wave-3 setup.ts translation-map additions for 50-10 and 50-12 keys'
  - 'Discovery and post-run evidence for failing-file count drop'
affects: [phase-50, test-infrastructure, wave-3, plan-50-12, plan-50-13]
tech-stack:
  added: []
  patterns: [renderWithProviders test harness, global react-i18next map]
key-files:
  created:
    - .planning/phases/50-test-infrastructure-repair/50-10-DISCOVERY.md
    - .planning/phases/50-test-infrastructure-repair/50-10-SUMMARY.md
  modified:
    - frontend/tests/setup.ts
    - frontend/tests/component/AfterActionForm.test.tsx
    - frontend/tests/component/CommitmentList.test.tsx
    - frontend/tests/component/DecisionList.test.tsx
    - frontend/tests/component/TaskCard.test.tsx
    - frontend/tests/component/SLAIndicator.test.tsx
    - frontend/tests/unit/FormInput.test.tsx
key-decisions:
  - 'Kept 50-12 test/source files read-only; residual ForumsListPage failures remain because its per-file mock overrides setup.ts.'
  - 'Updated tests to current component contracts rather than changing production components.'
patterns-established:
  - 'Prefer setup.ts translation-map additions for canonical keys; update assertions only for markup/API drift.'
requirements-completed: [TEST-02]
duration: 26min
completed: 2026-05-14
---

# Phase 50 Plan 10: Wave-3 Test Repair Summary

**Wave-3 frontend test harness repairs closing six owned default-runner files and centralizing setup translation keys.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-05-14T10:48:32Z
- **Completed:** 2026-05-14T11:14:27Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Created `50-10-DISCOVERY.md` with the required default-runner baseline and confirmed the in-scope failing-file count was 6, below the <=8 ceiling.
- Repaired all six owned Wave-3 test files so they pass together under the frontend default runner.
- Extended `frontend/tests/setup.ts` with the 50-10 translation keys and the 50-12 read-only consumer keys for forums and monitoring.
- Preserved the default runner disposition for all owned files; no owned file was excluded or marked `queued-with-rationale`.

## Task Commits

Each task was committed atomically:

1. **Task 0: Discovery and ceiling check** - `ff284d10` (chore)
2. **Task 1: AfterActionForm, CommitmentList, DecisionList, TaskCard, and Wave-3 setup map** - `3236cffe` (fix)
3. **Task 2: SLAIndicator and FormInput provider/assertion repair** - `52672de7` (fix)
4. **Auto-fix: Preserve critical priority translation** - `3c320f56` (fix)

**Plan metadata:** committed separately after this summary file.

## Files Created/Modified

- `.planning/phases/50-test-infrastructure-repair/50-10-DISCOVERY.md` - Task 0 runner baseline, in-scope ceiling check, and 50-12 setup-key inventory.
- `.planning/phases/50-test-infrastructure-repair/50-10-SUMMARY.md` - Plan closeout, verification, dispositions, and handoff notes.
- `frontend/tests/setup.ts` - Global React i18n test map extended for 50-10 and 50-12 Wave-3 keys; `i18n.dir()` added for provider consumers.
- `frontend/tests/component/AfterActionForm.test.tsx` - Updated to current component output and accessible controls after 50-09 fixed ResizeObserver.
- `frontend/tests/component/CommitmentList.test.tsx` - Aligned assertions with current list behavior and setup translations.
- `frontend/tests/component/DecisionList.test.tsx` - Aligned assertions with current list behavior and setup translations.
- `frontend/tests/component/TaskCard.test.tsx` - Aligned status, priority, date, dossier, and SLA assertions with current component output.
- `frontend/tests/component/SLAIndicator.test.tsx` - Replaced stale test id/class/tooltip assumptions with current status and detailed-mode coverage.
- `frontend/tests/unit/FormInput.test.tsx` - Migrated from local i18n provider/mock to `renderWithProviders` and current lower-case component import path.

## Per-File Disposition

| File                                                | Verdict                    | Keys added to setup.ts                                                                      | Commit                             | Git archaeology one-liner                                                                                                          |
| --------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/tests/setup.ts`                           | TEST WRONG support harness | All keys listed below                                                                       | `3236cffe`, `52672de7`, `3c320f56` | The global `t()` fallback renders keys unless the test map covers canonical strings; setup owns Wave-3 map additions.              |
| `frontend/tests/component/AfterActionForm.test.tsx` | TEST WRONG                 | `afterActions.ai.extractButton`, `afterActions.form.*`, existing after-action keys retained | `3236cffe`                         | 50-09 removed the ResizeObserver blocker; remaining failures were stale text/control assertions against current form markup.       |
| `frontend/tests/component/CommitmentList.test.tsx`  | TEST WRONG                 | `afterActions.commitments.*`                                                                | `3236cffe`                         | Component renders translated commitment labels; tests were still asserting English without setup coverage and some stale controls. |
| `frontend/tests/component/DecisionList.test.tsx`    | TEST WRONG                 | `afterActions.decisions.*`                                                                  | `3236cffe`                         | Component contract stayed list/form rendering; assertion details drifted from current translated controls.                         |
| `frontend/tests/component/TaskCard.test.tsx`        | TEST WRONG                 | `created`, `due`, `priority.*`, `status.*`, `tasks.sla.*`, `work_item.dossier`              | `3236cffe`                         | Current task card output uses shared status/priority/SLA translations and changed markup rather than the old asserted strings.     |
| `frontend/tests/component/SLAIndicator.test.tsx`    | TEST WRONG                 | `tasks.sla.*`                                                                               | `52672de7`                         | Current SLAIndicator exposes role/status and detailed-mode text, not the stale test ids, class names, or tooltip contract.         |
| `frontend/tests/unit/FormInput.test.tsx`            | TEST WRONG                 | `validation.required`; `i18n.dir()` support added                                           | `52672de7`                         | FormInput test still used the pre-provider local i18n mock and stale component casing import path.                                 |

## Translation Map Entries

### 50-10 Own-Cohort Keys

```ts
'afterActions.ai.extractButton': 'AI Extract',
'afterActions.commitments.priorities.urgent': 'Urgent',
created: 'Created',
due: 'Due',
'priority.high': 'High',
'priority.low': 'Low',
'priority.medium': 'Medium',
'priority.urgent': 'Urgent',
'status.cancelled': 'Cancelled',
'status.completed': 'Completed',
'status.in_progress': 'In Progress',
'status.pending': 'Pending',
'status.review': 'Review',
'tasks.sla.approaching': 'Approaching',
'tasks.sla.breached': 'Breached',
'tasks.sla.completed_late': 'Completed late',
'tasks.sla.completed_on_time': 'Completed on time',
'tasks.sla.deadline': 'Deadline',
'tasks.sla.progress': 'Progress',
'tasks.sla.safe': 'Safe',
'tasks.sla.warning': 'Warning',
'validation.required': 'Required',
'work_item.dossier': 'Dossier',
```

Pre-existing after-action form, commitment, and decision keys were retained and reordered in the same setup map. The pre-existing `afterActions.commitments.priorities.critical` key was restored in `3c320f56` after diff review.

### 50-12 Cross-Cohort Keys (PCH-50R-01)

```ts
'forums:empty.description': 'Forum dossiers will appear here.',
'forums:empty.title': 'No forums yet',
'forums:pageSubtitle': 'International forums, conferences, and multilateral meetings',
'forums:pageTitle': 'Forums',
'list-pages:search.placeholder': 'Search',
'monitoring.headings.alerts': 'Alerts',
'monitoring.headings.dashboard': 'Monitoring Dashboard',
'monitoring.headings.health': 'Health',
```

## Verification

- `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-10-discovery.log` - baseline captured: `Test Files 26 failed | 128 passed | 4 skipped (158)`, `Tests 304 failed | 1046 passed | 25 todo (1375)`.
- `pnpm --filter intake-frontend exec vitest --run tests/component/AfterActionForm.test.tsx tests/component/CommitmentList.test.tsx tests/component/DecisionList.test.tsx tests/component/TaskCard.test.tsx` - passed: 4 files, 105 tests.
- `pnpm --filter intake-frontend exec vitest --run tests/component/SLAIndicator.test.tsx tests/unit/FormInput.test.tsx` - passed: 2 files, 36 tests.
- `pnpm --filter intake-frontend exec vitest --run tests/component/AfterActionForm.test.tsx tests/component/CommitmentList.test.tsx tests/component/DecisionList.test.tsx tests/component/TaskCard.test.tsx tests/component/SLAIndicator.test.tsx tests/unit/FormInput.test.tsx` - passed: 6 files, 141 tests.
- `pnpm --filter intake-frontend exec eslint --no-warn-ignored tests/setup.ts tests/component/AfterActionForm.test.tsx tests/component/CommitmentList.test.tsx tests/component/DecisionList.test.tsx tests/component/TaskCard.test.tsx tests/component/SLAIndicator.test.tsx tests/unit/FormInput.test.tsx` - passed with exit 0.
- `rg -n "forums:pageTitle|forums:pageSubtitle|monitoring\\.headings\\.(dashboard|health|alerts)" frontend/tests/setup.ts` - all required 50-12 setup keys present.
- `rg -n "queued-with-rationale" frontend/tests/setup.ts frontend/tests/component/AfterActionForm.test.tsx frontend/tests/component/CommitmentList.test.tsx frontend/tests/component/DecisionList.test.tsx frontend/tests/component/TaskCard.test.tsx frontend/tests/component/SLAIndicator.test.tsx frontend/tests/unit/FormInput.test.tsx || true` - no matches.
- `pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-10-final-default-after-critical.log` - final default runner still exits 1 due out-of-scope files, but failed files dropped from 26 to 20 and all six Plan 50-10 files passed in the full run.
- Normal commit hooks passed for all commits; hook output retained existing build warnings and knip findings outside this plan's ownership.

## Pre/Post Failing Counts

| Runner               | Failed test files | Owned files failing | Outcome                                  |
| -------------------- | ----------------: | ------------------: | ---------------------------------------- |
| Task 0 baseline      |                26 |                   6 | Discovery gate passed; owned count <=8.  |
| Final default runner |                20 |                   0 | Required >=6 failing-file drop achieved. |

## Decisions Made

- Kept all 50-12-owned test/source files read-only. The required setup keys were added centrally, but `ForumsListPage.test.tsx` still has a local `react-i18next` mock that overrides the global setup map and remains a 50-12/50-13 handoff.
- Treated all owned test failures as TEST WRONG after D-10 archaeology because the production component contracts were current and the stale assertions/provider mocks were the failing surface.
- Skipped `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` updates because the operator explicitly kept those files outside this executor's ownership.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored critical priority setup translation**

- **Found during:** Closeout diff scan after Task 2.
- **Issue:** `afterActions.commitments.priorities.critical` had been dropped from the setup map while adding Wave-3 keys.
- **Fix:** Restored the pre-existing translation entry in `frontend/tests/setup.ts`.
- **Files modified:** `frontend/tests/setup.ts`
- **Verification:** Six-file owned suite passed; owned-file ESLint passed; normal commit hook passed.
- **Committed in:** `3c320f56`

---

**Total deviations:** 1 auto-fixed Rule 1 bug.
**Impact on plan:** The auto-fix preserved existing setup map behavior and did not expand scope beyond Plan 50-10 ownership.

## Issues Encountered

- The final frontend default runner still fails 20 files outside Plan 50-10. This is expected residual Phase 50 work and does not block the Plan 50-10 success criteria.
- `src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx` still fails out of scope because its per-file `react-i18next` mock maps old `forums:title` and `forums:subtitle` keys. Plan 50-10 added the required global setup keys, but did not edit the 50-12-owned test.
- Monitoring dashboard failures remain out of scope for this executor.

## Known Stubs

None. Stub scan found only intentional test placeholder text in `FormInput.test.tsx` and the translation-key name `list-pages:search.placeholder`; neither is a runtime UI stub introduced by this plan.

## Threat Flags

None. Changes were limited to tests and test setup; no new network endpoints, auth paths, file access patterns, or schema trust boundaries were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 50-12 can consume the setup map keys added here without modifying `frontend/tests/setup.ts`. Plan 50-13 should inherit a reduced frontend default-runner residual of 20 failing files, with all six Plan 50-10-owned files closed.

---

_Phase: 50-test-infrastructure-repair_
_Completed: 2026-05-14_
