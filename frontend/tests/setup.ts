import '@testing-library/jest-dom/vitest'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// jsdom polyfill: ResizeObserver (used by @radix-ui/react-use-size + signature-visuals)
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}

// jsdom polyfill: matchMedia (used by useResponsive + Tailwind breakpoint hooks)
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// jsdom defines scrollTo as a not-implemented stub, so replace it with a no-op.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    configurable: true,
    value: vi.fn(),
  })
}

// Global i18n mock
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, paramsOrDefault?: any, options?: any) => {
        const params =
          paramsOrDefault && typeof paramsOrDefault === 'object' ? paramsOrDefault : options
        const defaultValue =
          typeof paramsOrDefault === 'string'
            ? paramsOrDefault
            : (paramsOrDefault?.defaultValue ?? options?.defaultValue)

        // Simple translation map for tests
        const translations: Record<string, string> = {
          'afterActions.ai.extractButton': 'AI Extract',
          'afterActions.commitments.add': 'Add Commitment',
          'afterActions.commitments.assignedTo': 'Assigned To',
          'afterActions.commitments.contactEmail': 'Contact Email',
          'afterActions.commitments.contactName': 'Contact Name',
          'afterActions.commitments.description': 'Description',
          'afterActions.commitments.descriptionPlaceholder': 'Enter commitment description',
          'afterActions.commitments.dueDate': 'Due Date',
          'afterActions.commitments.emailPlaceholder': 'email@example.com',
          'afterActions.commitments.empty': 'No commitments yet',
          'afterActions.commitments.external': 'External',
          'afterActions.commitments.internal': 'Internal',
          'afterActions.commitments.item': `Commitment ${params?.number || 1}`,
          'afterActions.commitments.namePlaceholder': 'Enter contact name',
          'afterActions.commitments.organization': 'Organization',
          'afterActions.commitments.orgPlaceholder': 'Enter organization',
          'afterActions.commitments.ownerType': 'Owner Type',
          'afterActions.commitments.priorities.critical': 'Critical',
          'afterActions.commitments.priorities.high': 'High',
          'afterActions.commitments.priorities.low': 'Low',
          'afterActions.commitments.priorities.medium': 'Medium',
          'afterActions.commitments.priorities.urgent': 'Urgent',
          'afterActions.commitments.priority': 'Priority',
          'afterActions.commitments.selectUser': 'Select user',
          'afterActions.commitments.status': 'Status',
          'afterActions.commitments.statuses.cancelled': 'Cancelled',
          'afterActions.commitments.statuses.completed': 'Completed',
          'afterActions.commitments.statuses.in_progress': 'In Progress',
          'afterActions.commitments.statuses.overdue': 'Overdue',
          'afterActions.commitments.statuses.pending': 'Pending',
          'afterActions.commitments.title': 'Commitments',
          'afterActions.commitments.tracking.automatic': 'Automatic',
          'afterActions.commitments.tracking.manual': 'Manual',
          'afterActions.confidence': `${params?.value || 0}% confidence`,
          'afterActions.decisions.add': 'Add Decision',
          'afterActions.decisions.decisionDate': 'Decision Date',
          'afterActions.decisions.decisionMaker': 'Decision Maker',
          'afterActions.decisions.decisionMakerPlaceholder': 'Enter decision maker name',
          'afterActions.decisions.description': 'Description',
          'afterActions.decisions.descriptionPlaceholder': 'Enter decision description',
          'afterActions.decisions.empty': 'No decisions yet',
          'afterActions.decisions.item': `Decision ${params?.number || 1}`,
          'afterActions.decisions.rationale': 'Rationale',
          'afterActions.decisions.rationalePlaceholder': 'Enter rationale',
          'afterActions.decisions.title': 'Decisions',
          'afterActions.form.attendees': 'Attendees',
          'afterActions.form.attendeesHelp': 'Enter names separated by commas',
          'afterActions.form.attendeesMax': 'Maximum 100 attendees allowed',
          'afterActions.form.attendeesPlaceholder': 'Enter attendee names (comma-separated)',
          'afterActions.form.attendeesRequired': 'At least one attendee is required',
          'afterActions.form.basicInfo': 'Basic Information',
          'afterActions.form.confidential': 'Mark as confidential',
          'afterActions.form.confidentialWarning': 'This record contains sensitive information',
          'afterActions.form.notes': 'Additional Notes',
          'afterActions.form.notesPlaceholder': 'Enter any additional notes',
          'afterActions.form.publishFailed': 'Failed to publish',
          'afterActions.form.publishing': 'Publishing...',
          'afterActions.form.publish': 'Publish',
          'afterActions.form.publishRequirements':
            'Add at least one attendee and one outcome (decision/commitment/risk/follow-up) to publish',
          'afterActions.form.saveDraft': 'Save Draft',
          'afterActions.form.saveFailed': 'Failed to save draft',
          'afterActions.form.saving': 'Saving...',
          'afterActions.form.title': 'After-Action Record',
          'common.cancel': 'Cancel',
          'common.days': 'days',
          'common.selectDate': 'Select date',
          'common.unknown': 'Unknown',
          'consistency.actions.accept': 'Accept Risk',
          'consistency.actions.escalate': 'Escalate to Admin',
          'consistency.actions.modify': 'Modify Position',
          'consistency.actions.viewPosition': 'View Conflicting Position',
          'consistency.aiAvailable': 'Available',
          'consistency.aiUnavailable': 'Unavailable',
          'consistency.automaticOnSubmit': 'Automatic on Submit',
          'consistency.checkedAt': 'Checked At',
          'consistency.checkTrigger': 'Check Trigger',
          'consistency.conflict.affectedSections': 'Affected Sections',
          'consistency.conflict.suggestedResolution': 'Suggested Resolution',
          'consistency.conflictTypes.ambiguity': 'Ambiguity',
          'consistency.conflictTypes.contradiction': 'Contradiction',
          'consistency.conflictTypes.overlap': 'Overlap',
          'consistency.conflictsFound': 'Conflicts Found',
          'consistency.conflictsFoundDescription':
            'Review and resolve conflicts before proceeding.',
          'consistency.emptyState.description':
            'Run a consistency check to identify potential conflicts.',
          'consistency.emptyState.title': 'No Consistency Check Available',
          'consistency.manual': 'Manual',
          'consistency.noConflicts': 'No conflicts detected',
          'consistency.noConflictsDescription': 'No inconsistencies were found for this position.',
          'consistency.score': 'Consistency Score',
          'consistency.scoreLabels.critical': 'Critical',
          'consistency.scoreLabels.excellent': 'Excellent',
          'consistency.scoreLabels.fair': 'Fair',
          'consistency.scoreLabels.good': 'Good',
          'consistency.scoreLabels.poor': 'Poor',
          'consistency.severityLevels.high': 'High',
          'consistency.severityLevels.low': 'Low',
          'consistency.severityLevels.medium': 'Medium',
          'consistency.title': 'Consistency',
          created: 'Created',
          due: 'Due',
          'forums:empty.description': 'Forum dossiers will appear here.',
          'forums:empty.title': 'No forums yet',
          'forums:pageSubtitle': 'International forums, conferences, and multilateral meetings',
          'forums:pageTitle': 'Forums',
          'list-pages:search.placeholder': 'Search',
          'monitoring.headings.alerts': 'Alerts',
          'monitoring.headings.dashboard': 'Monitoring Dashboard',
          'monitoring.headings.health': 'Health',
          'priority.high': 'High',
          'priority.low': 'Low',
          'priority.medium': 'Medium',
          'priority.urgent': 'Urgent',
          'status.cancelled': 'Cancelled',
          'status.completed': 'Completed',
          'status.in_progress': 'In Progress',
          'status.pending': 'Pending',
          'status.review': 'Review',
          'tasks.conflict.cancelOption': 'Cancel',
          'tasks.conflict.cancelOptionDescription':
            'Discard your local changes and close the dialog.',
          'tasks.conflict.conflictingFields': 'Conflicting Fields',
          'tasks.conflict.description': 'This task was modified by another user.',
          'tasks.conflict.forceSave': 'Force Save',
          'tasks.conflict.forceSaveOption': 'Force Save',
          'tasks.conflict.forceSaveOptionDescription':
            'Overwrite the server version with your changes.',
          'tasks.conflict.reload': 'Reload',
          'tasks.conflict.reloadOption': 'Reload',
          'tasks.conflict.reloadOptionDescription':
            'Reload the latest server version and review changes.',
          'tasks.conflict.theirChange': 'Their Change',
          'tasks.conflict.title': 'Conflict Detected',
          'tasks.conflict.yourChange': 'Your Change',
          'tasks.noContributors': 'No contributors yet',
          'tasks.removeContributor': 'Remove contributor',
          'tasks.sla.approaching': 'Approaching',
          'tasks.sla.breached': 'Breached',
          'tasks.sla.completed_late': 'Completed late',
          'tasks.sla.completed_on_time': 'Completed on time',
          'tasks.sla.deadline': 'Deadline',
          'tasks.sla.progress': 'Progress',
          'tasks.sla.safe': 'Safe',
          'tasks.sla.warning': 'Warning',
          'waitingQueue.aging.danger': 'Overdue',
          'waitingQueue.aging.ok': 'Recent',
          'waitingQueue.aging.warning': 'Needs Attention',
          'waitingQueue.agingIndicator.days': 'days',
          'waitingQueue.assignmentDetails.assignedAt': 'Assigned At',
          'waitingQueue.assignmentDetails.assignee': 'Assignee',
          'waitingQueue.assignmentDetails.daysWaiting': 'Days Waiting',
          'waitingQueue.assignmentDetails.lastReminder': 'Last Reminder',
          'waitingQueue.assignmentDetails.linkedItems': 'Linked Items',
          'waitingQueue.assignmentDetails.noReminderSent': 'No reminder sent',
          'waitingQueue.assignmentDetails.statusAndPriority': 'Status & Priority',
          'waitingQueue.assignmentDetails.taskActions': 'Task',
          'waitingQueue.assignmentDetails.timeline': 'Timeline',
          'waitingQueue.assignmentDetails.viewFullDetails': 'View Full Details',
          'waitingQueue.assignmentDetails.viewLinkedItems': 'View Linked Items',
          'waitingQueue.assignmentDetails.viewTask': 'View Task',
          'waitingQueue.assignmentDetails.workItemNotAvailable':
            'The work item for this assignment is not available.',
          'waitingQueue.bulkActions.clear': 'Clear Selection',
          'waitingQueue.bulkActions.clearSelection': 'Clear Selection',
          'waitingQueue.bulkActions.maxItems': `Max ${params?.max ?? 100} items`,
          'waitingQueue.bulkActions.maxReached': 'Maximum selection reached',
          'waitingQueue.bulkActions.selectedCount': `${params?.count ?? 0} items selected`,
          'waitingQueue.bulkActions.sendReminders': 'Send Reminders',
          'waitingQueue.bulkActions.sending': 'Sending...',
          'waitingQueue.bulkActions.toolbar': 'Bulk actions',
          'waitingQueue.escalation.escalate': 'Escalate',
          'waitingQueue.escalation.escalateAssignment': 'Escalate Assignment',
          'waitingQueue.escalation.escalating': 'Escalating...',
          'waitingQueue.escalation.error': 'Failed to escalate assignment',
          'waitingQueue.escalation.immediateManager': 'Immediate Manager',
          'waitingQueue.escalation.reason': 'Reason',
          'waitingQueue.escalation.reasonHint': 'Explain why escalation is needed',
          'waitingQueue.escalation.reasonRequired': 'Please provide a reason for escalation',
          'waitingQueue.escalation.selectRecipient': 'Select Recipient',
          'waitingQueue.escalation.success': 'Assignment escalated successfully',
          'waitingQueue.filters.active': 'filters applied',
          'waitingQueue.filters.aging': 'Aging',
          'waitingQueue.filters.assignee': 'Assignee',
          'waitingQueue.filters.clearAll': 'Clear Filters',
          'waitingQueue.filters.openFilters': 'Open filters',
          'waitingQueue.filters.priority': 'Priority',
          'waitingQueue.filters.priorities.high': 'High',
          'waitingQueue.filters.priorities.low': 'Low',
          'waitingQueue.filters.priorities.medium': 'Medium',
          'waitingQueue.filters.priorities.urgent': 'Urgent',
          'waitingQueue.filters.agingBuckets.0-2.label': '0-2 days',
          'waitingQueue.filters.agingBuckets.3-6.label': '3-6 days',
          'waitingQueue.filters.agingBuckets.7+.label': '7+ days',
          'waitingQueue.filters.showingResults': `Showing ${params?.count ?? 0} results`,
          'waitingQueue.filters.title': 'Filters',
          'waitingQueue.filters.type': 'Type',
          'waitingQueue.filters.types.dossier': 'Dossier',
          'waitingQueue.filters.types.position': 'Position',
          'waitingQueue.filters.types.task': 'Task',
          'waitingQueue.filters.types.ticket': 'Ticket',
          'waitingQueue.reminder.button.label': 'Send follow-up reminder',
          'waitingQueue.reminder.button.send': 'Follow Up',
          'waitingQueue.reminder.button.sending': 'Sending...',
          'waitingQueue.reminder.button.sent': 'Sent!',
          'waitingQueue.reminder.conflict.title': 'Assignment Changed',
          'waitingQueue.reminder.cooldown.title': 'Cooldown Active',
          'waitingQueue.reminder.error.title': 'Failed to Send Reminder',
          'waitingQueue.reminder.noAssignee.title': 'No Assignee',
          'waitingQueue.reminder.notFound.title': 'Assignment Not Found',
          'waitingQueue.reminder.rateLimit.title': 'Rate Limit Exceeded',
          'waitingQueue.reminder.success.title': 'Reminder Sent',
          'validation.required': 'Required',
          'work_item.dossier': 'Dossier',
        }
        const normalizedKey = key.replace(':', '.')
        const resolved = translations[key] ?? translations[normalizedKey] ?? defaultValue ?? key

        return String(resolved).replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
          if (params && typeof params === 'object' && params[name] != null) {
            return String(params[name])
          }
          return ''
        })
      },
      i18n: {
        get language() {
          return localStorage.getItem('id.locale') === 'ar' ? 'ar' : 'en'
        },
        changeLanguage: vi.fn().mockResolvedValue(undefined),
        dir: vi.fn(() => (localStorage.getItem('id.locale') === 'ar' ? 'rtl' : 'ltr')),
      },
    }),
    Trans: ({ children }: any) => children,
  }
})

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any runtime request handlers we may add during the tests
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up after the tests are finished
afterAll(() => server.close())
