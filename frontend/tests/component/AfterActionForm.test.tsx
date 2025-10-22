import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AfterActionForm, AfterActionFormData } from '@/components/after-action/AfterActionForm';

// Mock child components
vi.mock('@/components/after-action/DecisionList', () => ({
  DecisionList: ({ decisions, onChange }: any) => (
    <div data-testid="decision-list">
      <button onClick={() => onChange([...decisions, { description: 'New decision' }])}>
        Add Decision
      </button>
      <div>Decisions: {decisions.length}</div>
    </div>
  ),
}));

vi.mock('@/components/after-action/CommitmentList', () => ({
  CommitmentList: ({ commitments, onChange }: any) => (
    <div data-testid="commitment-list">
      <button onClick={() => onChange([...commitments, { description: 'New commitment' }])}>
        Add Commitment
      </button>
      <div>Commitments: {commitments.length}</div>
    </div>
  ),
}));

vi.mock('@/components/after-action/RiskList', () => ({
  RiskList: ({ risks, onChange }: any) => (
    <div data-testid="risk-list">
      <button onClick={() => onChange([...risks, { description: 'New risk' }])}>
        Add Risk
      </button>
      <div>Risks: {risks.length}</div>
    </div>
  ),
}));

vi.mock('@/components/FollowUpList', () => ({
  FollowUpList: ({ followUpActions, onChange }: any) => (
    <div data-testid="follow-up-list">
      <button onClick={() => onChange([...followUpActions, { description: 'New follow-up' }])}>
        Add Follow-up
      </button>
      <div>Follow-ups: {followUpActions.length}</div>
    </div>
  ),
}));

vi.mock('@/components/AttachmentUploader', () => ({
  AttachmentUploader: () => <div data-testid="attachment-uploader">Attachment Uploader</div>,
}));

vi.mock('@/components/AIExtractionButton', () => ({
  AIExtractionButton: ({ onExtract }: any) => (
    <button
      data-testid="ai-extraction-button"
      onClick={() =>
        onExtract({
          decisions: [{ description: 'AI Decision', ai_confidence: 0.8 }],
          commitments: [{ description: 'AI Commitment', ai_confidence: 0.9 }],
        })
      }
    >
      AI Extract
    </button>
  ),
}));

// i18n mock is global in tests/setup.ts

describe('AfterActionForm', () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnPublish = vi.fn().mockResolvedValue(undefined);
  const mockUsers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
  ];

  const defaultProps = {
    engagementId: 'eng-123',
    dossierId: 'dos-456',
    onSave: mockOnSave,
    availableUsers: mockUsers,
  };

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnPublish.mockClear();
  });

  describe('Rendering', () => {
    it('renders form with all sections', () => {
      render(<AfterActionForm {...defaultProps} />);

      expect(screen.getByText('After-Action Record')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByTestId('decision-list')).toBeInTheDocument();
      expect(screen.getByTestId('commitment-list')).toBeInTheDocument();
      expect(screen.getByTestId('risk-list')).toBeInTheDocument();
      expect(screen.getByTestId('follow-up-list')).toBeInTheDocument();
      expect(screen.getByTestId('attachment-uploader')).toBeInTheDocument();
    });

    it('shows AI extraction button when not read-only', () => {
      render(<AfterActionForm {...defaultProps} />);

      expect(screen.getByTestId('ai-extraction-button')).toBeInTheDocument();
    });

    it('hides AI extraction button in read-only mode', () => {
      render(<AfterActionForm {...defaultProps} readOnly />);

      expect(screen.queryByTestId('ai-extraction-button')).not.toBeInTheDocument();
    });

    it('shows save draft button when not read-only', () => {
      render(<AfterActionForm {...defaultProps} />);

      expect(screen.getByText('Save Draft')).toBeInTheDocument();
    });

    it('shows publish button when canPublish and onPublish provided', () => {
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    it('does not show publish button when canPublish is false', () => {
      render(<AfterActionForm {...defaultProps} canPublish={false} onPublish={mockOnPublish} />);

      expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    });
  });

  describe('Attendees Management', () => {
    it('parses comma-separated attendees correctly', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe, Jane Smith, Bob Johnson');

      expect(screen.getByText('(3/100)')).toBeInTheDocument();
    });

    it('trims whitespace from attendee names', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, '  John Doe  ,  Jane Smith  ');

      // Should be parsed as 2 attendees
      expect(screen.getByText('(2/100)')).toBeInTheDocument();
    });

    it('filters out empty names', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe, , Jane Smith,,');

      // Should be parsed as 2 attendees (empty strings filtered)
      expect(screen.getByText('(2/100)')).toBeInTheDocument();
    });

    it('validates attendees on publish', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Try to publish without attendees
      const publishButton = screen.getByText('Publish');
      await user.click(publishButton);

      expect(screen.getByText('At least one attendee is required')).toBeInTheDocument();
      expect(mockOnPublish).not.toHaveBeenCalled();
    });

    it('validates max 100 attendees on publish', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Create 101 attendees
      const attendees = Array.from({ length: 101 }, (_, i) => `Attendee ${i + 1}`).join(', ');
      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, attendees);

      // Try to publish
      const publishButton = screen.getByText('Publish');
      await user.click(publishButton);

      expect(screen.getByText('Maximum 100 attendees allowed')).toBeInTheDocument();
      expect(mockOnPublish).not.toHaveBeenCalled();
    });
  });

  describe('Confidential Flag', () => {
    it('toggles confidential flag', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /mark as confidential/i });
      await user.click(checkbox);

      expect(screen.getByText('This record contains sensitive information')).toBeInTheDocument();
      expect(screen.getAllByTestId('shield-icon')).toHaveLength(2); // One in title, one in warning
    });

    it('shows shield icon when confidential', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /mark as confidential/i });
      await user.click(checkbox);

      const shields = screen.getAllByTestId('shield-icon');
      expect(shields.length).toBeGreaterThan(0);
    });
  });

  describe('AI Extraction', () => {
    it('merges AI-extracted data with existing form data', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      // Add a manual decision first
      await user.click(screen.getByText('Add Decision'));
      expect(screen.getByText('Decisions: 1')).toBeInTheDocument();

      // Trigger AI extraction
      await user.click(screen.getByTestId('ai-extraction-button'));

      // Should now have 2 decisions (1 manual + 1 AI)
      await waitFor(() => {
        expect(screen.getByText('Decisions: 2')).toBeInTheDocument();
      });
    });

    it('filters out low-confidence AI suggestions', async () => {
      const user = userEvent.setup();

      // Mock AI extraction with low confidence
      vi.mocked(screen.getByTestId('ai-extraction-button')).onclick = () => {
        const onExtract = vi.fn();
        onExtract({
          decisions: [{ description: 'Low confidence', ai_confidence: 0.3 }],
        });
      };

      render(<AfterActionForm {...defaultProps} />);

      await user.click(screen.getByTestId('ai-extraction-button'));

      // Low confidence item should be filtered (threshold is 0.5)
      expect(screen.getByText('Decisions: 1')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires at least one attendee to publish', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Add a decision but no attendees
      await user.click(screen.getByText('Add Decision'));

      const publishButton = screen.getByText('Publish');
      expect(publishButton).toBeDisabled();
    });

    it('requires at least one outcome to publish', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Add attendees but no outcomes
      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe');

      const publishButton = screen.getByText('Publish');
      expect(publishButton).toBeDisabled();
    });

    it('enables publish when all validation passes', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Add attendees
      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe');

      // Add at least one outcome
      await user.click(screen.getByText('Add Decision'));

      await waitFor(() => {
        const publishButton = screen.getByText('Publish');
        expect(publishButton).not.toBeDisabled();
      });
    });

    it('shows validation message when form invalid', () => {
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      expect(
        screen.getByText('Add at least one attendee and one outcome (decision/commitment/risk/follow-up) to publish')
      ).toBeInTheDocument();
    });
  });

  describe('Save Draft', () => {
    it('calls onSave with form data when save draft clicked', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} />);

      // Add some data
      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe');

      const notesInput = screen.getByPlaceholderText('Enter any additional notes');
      await user.type(notesInput, 'Test notes');

      // Save draft
      const saveButton = screen.getByText('Save Draft');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            engagement_id: 'eng-123',
            dossier_id: 'dos-456',
            attendees: ['John Doe'],
            notes: 'Test notes',
            is_confidential: false,
          }),
          true // isDraft
        );
      });
    });

    it('shows loading state while saving', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<AfterActionForm {...defaultProps} />);

      const saveButton = screen.getByText('Save Draft');
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('shows error message on save failure', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValueOnce(new Error('Network error'));

      render(<AfterActionForm {...defaultProps} />);

      const saveButton = screen.getByText('Save Draft');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Publish', () => {
    it('calls onPublish with form data when publish clicked', async () => {
      const user = userEvent.setup();
      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Add valid data
      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe');
      await user.click(screen.getByText('Add Decision'));

      // Publish
      await waitFor(async () => {
        const publishButton = screen.getByText('Publish');
        await user.click(publishButton);
      });

      await waitFor(() => {
        expect(mockOnPublish).toHaveBeenCalledWith(
          expect.objectContaining({
            engagement_id: 'eng-123',
            dossier_id: 'dos-456',
            attendees: ['John Doe'],
            decisions: expect.arrayContaining([expect.objectContaining({ description: 'New decision' })]),
          })
        );
      });
    });

    it('shows loading state while publishing', async () => {
      const user = userEvent.setup();
      mockOnPublish.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<AfterActionForm {...defaultProps} canPublish onPublish={mockOnPublish} />);

      // Add valid data
      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)');
      await user.type(attendeesInput, 'John Doe');
      await user.click(screen.getByText('Add Decision'));

      await waitFor(async () => {
        const publishButton = screen.getByText('Publish');
        await user.click(publishButton);
      });

      expect(screen.getByText('Publishing...')).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode', () => {
    it('disables all inputs in read-only mode', () => {
      render(<AfterActionForm {...defaultProps} readOnly />);

      const attendeesInput = screen.getByPlaceholderText('Enter attendee names (comma-separated)') as HTMLInputElement;
      const notesInput = screen.getByPlaceholderText('Enter any additional notes') as HTMLTextAreaElement;
      const confidentialCheckbox = screen.getByRole('checkbox') as HTMLInputElement;

      expect(attendeesInput).toBeDisabled();
      expect(notesInput).toBeDisabled();
      expect(confidentialCheckbox).toBeDisabled();
    });

    it('hides action buttons in read-only mode', () => {
      render(<AfterActionForm {...defaultProps} readOnly />);

      expect(screen.queryByText('Save Draft')).not.toBeInTheDocument();
      expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('populates form with initial data', () => {
      const initialData: Partial<AfterActionFormData> = {
        id: 'aa-123',
        attendees: ['John Doe', 'Jane Smith'],
        is_confidential: true,
        notes: 'Initial notes',
        decisions: [{ description: 'Initial decision', decision_maker: 'Boss', decision_date: new Date() }],
        version: 1,
      };

      render(<AfterActionForm {...defaultProps} initialData={initialData} />);

      expect(screen.getByDisplayValue('John Doe, Jane Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Initial notes')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
      expect(screen.getByText('Decisions: 1')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('applies RTL direction to form', () => {
      vi.mock('react-i18next', () => ({
        useTranslation: () => ({
          t: (key: string) => key,
          i18n: {
            language: 'ar',
          },
        }),
      }));

      render(<AfterActionForm {...defaultProps} />);

      const form = screen.getByRole('form') || document.querySelector('form');
      expect(form).toHaveAttribute('dir', 'rtl');
    });
  });
});
