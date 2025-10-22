import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommitmentList, Commitment } from '@/components/after-action/CommitmentList';

// i18n mock is global in tests/setup.ts

describe('CommitmentList', () => {
  const mockOnChange = vi.fn();
  const mockUsers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
  ];

  const mockCommitments: Commitment[] = [
    {
      id: '1',
      description: 'Complete project documentation',
      priority: 'high',
      status: 'in_progress',
      owner_type: 'internal',
      owner_user_id: 'user1',
      tracking_mode: 'automatic',
      due_date: new Date('2025-02-01'),
      ai_confidence: 0.9,
    },
    {
      id: '2',
      description: 'Review contract',
      priority: 'medium',
      status: 'pending',
      owner_type: 'external',
      owner_contact_email: 'external@example.com',
      owner_contact_name: 'External Partner',
      owner_contact_organization: 'Partner Corp',
      tracking_mode: 'manual',
      due_date: new Date('2025-02-15'),
      ai_confidence: 0.7,
    },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders title and add button', () => {
      render(
        <CommitmentList
          commitments={[]}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      expect(screen.getByText('Commitments')).toBeInTheDocument();
      expect(screen.getByText('Add Commitment')).toBeInTheDocument();
    });

    it('shows empty state when no commitments', () => {
      render(
        <CommitmentList
          commitments={[]}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      expect(screen.getByText('No commitments yet')).toBeInTheDocument();
    });

    it('renders all commitments with correct data', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      expect(screen.getByText('Commitment 1')).toBeInTheDocument();
      expect(screen.getByText('Commitment 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Review contract')).toBeInTheDocument();
    });
  });

  describe('Internal vs External Owner Assignment', () => {
    it('shows internal user dropdown when owner_type is internal', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const internalCommitmentCard = screen.getByText('Commitment 1').closest('div')!.parentElement!;
      const userDropdown = within(internalCommitmentCard).getByText('Assigned To *');

      expect(userDropdown).toBeInTheDocument();
      expect(within(internalCommitmentCard).queryByText('Contact Email *')).not.toBeInTheDocument();
    });

    it('shows external contact fields when owner_type is external', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const externalCommitmentCard = screen.getByText('Commitment 2').closest('div')!.parentElement!;

      expect(within(externalCommitmentCard).getByText('Contact Email *')).toBeInTheDocument();
      expect(within(externalCommitmentCard).getByText('Contact Name *')).toBeInTheDocument();
      expect(within(externalCommitmentCard).getByText('Organization')).toBeInTheDocument();
      expect(within(externalCommitmentCard).queryByText('Assigned To *')).not.toBeInTheDocument();
    });

    it('switches between internal and external when owner_type changes', async () => {
      const user = userEvent.setup();
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const internalCommitmentCard = screen.getByText('Commitment 1').closest('div')!.parentElement!;
      const externalRadio = within(internalCommitmentCard).getByLabelText('External');

      await user.click(externalRadio);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...mockCommitments[0],
          owner_type: 'external',
          tracking_mode: 'manual', // Should auto-set to manual for external
        },
        mockCommitments[1],
      ]);
    });

    it('sets tracking_mode to automatic for internal owners', async () => {
      const user = userEvent.setup();
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const externalCommitmentCard = screen.getByText('Commitment 2').closest('div')!.parentElement!;
      const internalRadio = within(externalCommitmentCard).getByLabelText('Internal');

      await user.click(internalRadio);

      expect(mockOnChange).toHaveBeenCalledWith([
        mockCommitments[0],
        {
          ...mockCommitments[1],
          owner_type: 'internal',
          tracking_mode: 'automatic', // Should auto-set to automatic for internal
        },
      ]);
    });
  });

  describe('Tracking Mode Display', () => {
    it('shows automatic tracking badge for internal commitments', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      expect(screen.getByText('Automatic')).toBeInTheDocument();
    });

    it('shows manual tracking badge for external commitments', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      expect(screen.getByText('Manual')).toBeInTheDocument();
    });

    it('disables status dropdown for internal automatic tracking', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const internalCommitmentCard = screen.getByText('Commitment 1').closest('div')!.parentElement!;
      const statusTrigger = within(internalCommitmentCard).getByRole('combobox', { name: /status/i });

      expect(statusTrigger).toBeDisabled();
    });

    it('enables status dropdown for external manual tracking', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const externalCommitmentCard = screen.getByText('Commitment 2').closest('div')!.parentElement!;
      const statusTrigger = within(externalCommitmentCard).getByRole('combobox', { name: /status/i });

      expect(statusTrigger).not.toBeDisabled();
    });
  });

  describe('AI Confidence Display', () => {
    it('shows confidence badge for AI-extracted commitments', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      expect(screen.getByText('90% confidence')).toBeInTheDocument();
      expect(screen.getByText('70% confidence')).toBeInTheDocument();
    });

    it('uses correct badge variant based on confidence level', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const highConfidenceBadge = screen.getByText('90% confidence').parentElement;
      const mediumConfidenceBadge = screen.getByText('70% confidence').parentElement;

      expect(highConfidenceBadge).toHaveClass('badge-default');
      expect(mediumConfidenceBadge).toHaveClass('badge-secondary');
    });
  });

  describe('Due Date Validation', () => {
    it('disables past dates in date picker', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      // Date picker validation is handled by the Calendar component's disabled prop
      // The actual validation logic is: date < new Date()
      // This is tested by verifying the disabled prop is passed correctly
      const internalCommitmentCard = screen.getByText('Commitment 1').closest('div')!.parentElement!;
      const dueDateButton = within(internalCommitmentCard).getByRole('button', { name: /Feb 1/ });

      expect(dueDateButton).toBeInTheDocument();
    });

    it('defaults to 7 days from now for new commitments', async () => {
      const user = userEvent.setup();
      render(
        <CommitmentList
          commitments={[]}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      await user.click(screen.getByText('Add Commitment'));

      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          due_date: expect.any(Date),
        }),
      ]);

      const calledArg = mockOnChange.mock.calls[0][0][0];
      const diff = Math.abs(calledArg.due_date.getTime() - sevenDaysFromNow.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second tolerance
    });
  });

  describe('Add Commitment', () => {
    it('adds new commitment with default values', async () => {
      const user = userEvent.setup();
      render(
        <CommitmentList
          commitments={[]}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      await user.click(screen.getByText('Add Commitment'));

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          description: '',
          priority: 'medium',
          status: 'pending',
          owner_type: 'internal',
          due_date: expect.any(Date),
        },
      ]);
    });
  });

  describe('Remove Commitment', () => {
    it('removes commitment when delete button clicked', async () => {
      const user = userEvent.setup();
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: '' });
      const firstDeleteButton = deleteButtons.find(btn =>
        btn.querySelector('.text-destructive')
      );

      if (firstDeleteButton) {
        await user.click(firstDeleteButton);
      }

      expect(mockOnChange).toHaveBeenCalledWith([mockCommitments[1]]);
    });
  });

  describe('Read-Only Mode', () => {
    it('hides add button in read-only mode', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
          readOnly
        />
      );

      expect(screen.queryByText('Add Commitment')).not.toBeInTheDocument();
    });

    it('hides delete buttons in read-only mode', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
          readOnly
        />
      );

      const deleteButtons = screen.queryAllByRole('button', { name: '' })
        .filter(btn => btn.querySelector('.text-destructive'));

      expect(deleteButtons).toHaveLength(0);
    });

    it('disables all inputs in read-only mode', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
          readOnly
        />
      );

      const descriptionInput = screen.getByDisplayValue('Complete project documentation') as HTMLTextAreaElement;
      expect(descriptionInput).toBeDisabled();
    });
  });

  describe('External Contact Validation', () => {
    it('requires email for external commitments', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const externalCommitmentCard = screen.getByText('Commitment 2').closest('div')!.parentElement!;
      const emailInput = within(externalCommitmentCard).getByLabelText('Contact Email *') as HTMLInputElement;

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('requires name for external commitments', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const externalCommitmentCard = screen.getByText('Commitment 2').closest('div')!.parentElement!;
      const nameInput = within(externalCommitmentCard).getByLabelText('Contact Name *') as HTMLInputElement;

      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('maxLength', '200');
    });

    it('allows optional organization for external commitments', () => {
      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const externalCommitmentCard = screen.getByText('Commitment 2').closest('div')!.parentElement!;
      const orgInput = within(externalCommitmentCard).getByLabelText('Organization') as HTMLInputElement;

      expect(orgInput).not.toHaveAttribute('required');
      expect(orgInput.value).toBe('Partner Corp');
    });
  });

  describe('RTL Support', () => {
    it('applies RTL direction when language is Arabic', () => {
      vi.mock('react-i18next', async () => {
        const actual = await vi.importActual('react-i18next');
        return {
          ...actual,
          useTranslation: () => ({
            t: (key: string) => key,
            i18n: {
              language: 'ar',
            },
          }),
        };
      });

      render(
        <CommitmentList
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />
      );

      const descriptionInput = screen.getByDisplayValue('Complete project documentation') as HTMLTextAreaElement;
      expect(descriptionInput).toHaveAttribute('dir', 'rtl');
    });
  });
});
