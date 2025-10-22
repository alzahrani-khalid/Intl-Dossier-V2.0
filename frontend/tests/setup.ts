import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Global i18n mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Simple translation map for tests
      const translations: Record<string, string> = {
        'afterActions.decisions.title': 'Decisions',
        'afterActions.decisions.add': 'Add Decision',
        'afterActions.decisions.empty': 'No decisions yet',
        'afterActions.decisions.item': `Decision ${params?.number || 1}`,
        'afterActions.decisions.description': 'Description',
        'afterActions.decisions.descriptionPlaceholder': 'Enter decision description',
        'afterActions.decisions.rationale': 'Rationale',
        'afterActions.decisions.rationalePlaceholder': 'Enter rationale',
        'afterActions.decisions.decisionMaker': 'Decision Maker',
        'afterActions.decisions.decisionMakerPlaceholder': 'Enter decision maker name',
        'afterActions.decisions.decisionDate': 'Decision Date',
        'afterActions.confidence': `${params?.value || 0}% confidence`,
        'afterActions.commitments.title': 'Commitments',
        'afterActions.commitments.add': 'Add Commitment',
        'afterActions.commitments.empty': 'No commitments yet',
        'afterActions.commitments.item': `Commitment ${params?.number || 1}`,
        'afterActions.commitments.description': 'Description',
        'afterActions.commitments.descriptionPlaceholder': 'Enter commitment description',
        'afterActions.commitments.ownerType': 'Owner Type',
        'afterActions.commitments.internal': 'Internal',
        'afterActions.commitments.external': 'External',
        'afterActions.commitments.assignedTo': 'Assigned To',
        'afterActions.commitments.selectUser': 'Select user',
        'afterActions.commitments.contactEmail': 'Contact Email',
        'afterActions.commitments.emailPlaceholder': 'email@example.com',
        'afterActions.commitments.contactName': 'Contact Name',
        'afterActions.commitments.namePlaceholder': 'Enter contact name',
        'afterActions.commitments.organization': 'Organization',
        'afterActions.commitments.orgPlaceholder': 'Enter organization',
        'afterActions.commitments.priority': 'Priority',
        'afterActions.commitments.priorities.low': 'Low',
        'afterActions.commitments.priorities.medium': 'Medium',
        'afterActions.commitments.priorities.high': 'High',
        'afterActions.commitments.priorities.critical': 'Critical',
        'afterActions.commitments.status': 'Status',
        'afterActions.commitments.statuses.pending': 'Pending',
        'afterActions.commitments.statuses.in_progress': 'In Progress',
        'afterActions.commitments.statuses.completed': 'Completed',
        'afterActions.commitments.statuses.cancelled': 'Cancelled',
        'afterActions.commitments.statuses.overdue': 'Overdue',
        'afterActions.commitments.dueDate': 'Due Date',
        'afterActions.commitments.tracking.automatic': 'Automatic',
        'afterActions.commitments.tracking.manual': 'Manual',
        'afterActions.form.title': 'After-Action Record',
        'afterActions.form.basicInfo': 'Basic Information',
        'afterActions.form.attendees': 'Attendees',
        'afterActions.form.attendeesPlaceholder': 'Enter attendee names (comma-separated)',
        'afterActions.form.attendeesHelp': 'Enter names separated by commas',
        'afterActions.form.attendeesRequired': 'At least one attendee is required',
        'afterActions.form.attendeesMax': 'Maximum 100 attendees allowed',
        'afterActions.form.confidential': 'Mark as confidential',
        'afterActions.form.confidentialWarning': 'This record contains sensitive information',
        'afterActions.form.notes': 'Additional Notes',
        'afterActions.form.notesPlaceholder': 'Enter any additional notes',
        'afterActions.form.saveDraft': 'Save Draft',
        'afterActions.form.publish': 'Publish',
        'afterActions.form.saving': 'Saving...',
        'afterActions.form.publishing': 'Publishing...',
        'afterActions.form.publishRequirements': 'Add at least one attendee and one outcome (decision/commitment/risk/follow-up) to publish',
        'afterActions.form.saveFailed': 'Failed to save draft',
        'afterActions.form.publishFailed': 'Failed to publish',
        'common.selectDate': 'Select date',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
  Trans: ({ children }: any) => children,
}));

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any runtime request handlers we may add during the tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after the tests are finished
afterAll(() => server.close());
