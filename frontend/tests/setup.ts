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

// Global i18n mock
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: any) => {
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
          'common.selectDate': 'Select date',
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
        }
        return translations[key] ?? key
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn().mockResolvedValue(undefined),
        dir: vi.fn(() => document.documentElement.dir || 'ltr'),
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
