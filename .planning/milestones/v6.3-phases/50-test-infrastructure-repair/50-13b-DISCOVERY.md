# Plan 50-13b Discovery (Task 0 snapshot)

Captured: 2026-05-14T22:14:38+03:00

Total cluster files: 7

## Sample Run

Command:

```bash
pnpm --filter intake-frontend exec vitest --run tests/component/BulkActionToolbar.test.tsx tests/component/AssignmentDetailsModal.test.tsx tests/component/EscalationDialog.test.tsx --reporter=default 2>&1 | tee /tmp/phase50-13b-discovery.log
```

Result:

- `tests/component/BulkActionToolbar.test.tsx`: 16 failed, 3 passed. Top-line signature: translated selection/action assertions failed while the component rendered raw `waitingQueue.bulkActions.*` keys.
- `tests/component/AssignmentDetailsModal.test.tsx`: 8 failed, 7 passed. Top-line signature: modal title/description and labels rendered raw `waitingQueue.assignmentDetails.*`, `waitingQueue.aging.*`, and `common.days` keys; the run also exposed stale assertions around truncated fallback work-item IDs and Radix overlay click behavior.
- `tests/component/EscalationDialog.test.tsx`: 17 failed, 5 passed. Top-line signature: dialog heading, recipient selector label, reason placeholder, and action buttons rendered raw `waitingQueue.escalation.*`, `waitingQueue.agingIndicator.days`, and `common.cancel` keys; the run also exposed stale prop wiring and focus-order assumptions.

Hypothesis: shared i18n-key fallthrough is present across the cluster. The tests use `renderWithProviders`, the global `react-i18next` mock resolves missing keys as raw keys, and the sampled DOM contains `waitingQueue.*` raw labels instead of translated text.

Follow-up note: the sampled signatures do not prove translation keys are the only issue. After the single-root translation fix, remaining failures should be handled by Task 2 per-file D-10 triage.

## Files

- `tests/component/AssignmentDetailsModal.test.tsx`
- `tests/component/BulkActionToolbar.test.tsx`
- `tests/component/ConflictDialog.test.tsx`
- `tests/component/ContributorsList.test.tsx`
- `tests/component/EscalationDialog.test.tsx`
- `tests/component/FilterPanel.test.tsx`
- `tests/component/ReminderButton.test.tsx`

## Missing Namespace Evidence

Extracted from the component implementations consumed by the seven tests:

### `waitingQueue.*`

- `waitingQueue.aging.danger`
- `waitingQueue.aging.ok`
- `waitingQueue.aging.warning`
- `waitingQueue.agingIndicator.days`
- `waitingQueue.assignmentDetails.assignedAt`
- `waitingQueue.assignmentDetails.assignee`
- `waitingQueue.assignmentDetails.daysWaiting`
- `waitingQueue.assignmentDetails.description`
- `waitingQueue.assignmentDetails.lastReminder`
- `waitingQueue.assignmentDetails.linkedItems`
- `waitingQueue.assignmentDetails.noReminderSent`
- `waitingQueue.assignmentDetails.statusAndPriority`
- `waitingQueue.assignmentDetails.taskActions`
- `waitingQueue.assignmentDetails.timeline`
- `waitingQueue.assignmentDetails.title`
- `waitingQueue.assignmentDetails.viewFullDetails`
- `waitingQueue.assignmentDetails.viewLinkedItems`
- `waitingQueue.assignmentDetails.viewTask`
- `waitingQueue.bulkActions.clear`
- `waitingQueue.bulkActions.clearSelection`
- `waitingQueue.bulkActions.maxItems`
- `waitingQueue.bulkActions.maxReached`
- `waitingQueue.bulkActions.selectedCount`
- `waitingQueue.bulkActions.sendReminders`
- `waitingQueue.bulkActions.sending`
- `waitingQueue.bulkActions.toolbar`
- `waitingQueue.escalation.error`
- `waitingQueue.escalation.escalate`
- `waitingQueue.escalation.escalateAssignment`
- `waitingQueue.escalation.escalating`
- `waitingQueue.escalation.immediateManager`
- `waitingQueue.escalation.reason`
- `waitingQueue.escalation.reasonHint`
- `waitingQueue.escalation.reasonRequired`
- `waitingQueue.escalation.selectRecipient`
- `waitingQueue.escalation.success`
- `waitingQueue.filters.active`
- `waitingQueue.filters.aging`
- `waitingQueue.filters.assignee`
- `waitingQueue.filters.clearAll`
- `waitingQueue.filters.openFilters`
- `waitingQueue.filters.priority`
- `waitingQueue.filters.showingResults`
- `waitingQueue.filters.title`
- `waitingQueue.filters.type`
- `waitingQueue.reminder.button.label`
- `waitingQueue.reminder.button.send`
- `waitingQueue.reminder.button.sending`
- `waitingQueue.reminder.button.sent`
- `waitingQueue.reminder.conflict.title`
- `waitingQueue.reminder.cooldown.title`
- `waitingQueue.reminder.error.title`
- `waitingQueue.reminder.noAssignee.title`
- `waitingQueue.reminder.notFound.title`
- `waitingQueue.reminder.rateLimit.title`
- `waitingQueue.reminder.success.title`

### `tasks.*`

- `tasks.conflict.cancelOption`
- `tasks.conflict.cancelOptionDescription`
- `tasks.conflict.conflictingFields`
- `tasks.conflict.description`
- `tasks.conflict.forceSave`
- `tasks.conflict.forceSaveOption`
- `tasks.conflict.forceSaveOptionDescription`
- `tasks.conflict.reload`
- `tasks.conflict.reloadOption`
- `tasks.conflict.reloadOptionDescription`
- `tasks.conflict.theirChange`
- `tasks.conflict.title`
- `tasks.conflict.yourChange`
- `tasks.noContributors`
- `tasks.removeContributor`

### `common.*`

- `common.cancel`
- `common.days`
- `common.unknown`

## Task 0 Verdict

Proceed to Task 1. The shared raw-key emission hypothesis holds, but Task 2 triage is expected for any stale assertions remaining after the translation map fix.
