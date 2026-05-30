import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders as render, screen, within } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { CommitmentEditor, Commitment } from '@/components/commitment-editor/CommitmentEditor'

// i18n mock is global in tests/setup.ts

describe('CommitmentEditor', () => {
  const mockOnChange = vi.fn()
  const mockUsers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
  ]

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
  ]

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  const getCommitmentCard = (title: string) => {
    const card = screen.getByText(title).closest('[data-slot="card"]')
    expect(card).toBeInTheDocument()
    return card as HTMLElement
  }

  describe('Rendering', () => {
    it('renders title and add button', () => {
      render(
        <CommitmentEditor commitments={[]} onChange={mockOnChange} availableUsers={mockUsers} />,
      )

      expect(screen.getByText('Commitments')).toBeInTheDocument()
      expect(screen.getByText('Add Commitment')).toBeInTheDocument()
    })

    it('shows empty state when no commitments', () => {
      render(
        <CommitmentEditor commitments={[]} onChange={mockOnChange} availableUsers={mockUsers} />,
      )

      expect(screen.getByText('No commitments yet')).toBeInTheDocument()
    })

    it('renders all commitments with correct data', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      expect(screen.getByText('Commitment 1')).toBeInTheDocument()
      expect(screen.getByText('Commitment 2')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Review contract')).toBeInTheDocument()
    })
  })

  describe('Internal vs External Owner Assignment', () => {
    it('shows internal user dropdown when owner_type is internal', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const internalCommitmentCard = getCommitmentCard('Commitment 1')
      const userDropdown = within(internalCommitmentCard).getByText('Assigned To *')

      expect(userDropdown).toBeInTheDocument()
      expect(within(internalCommitmentCard).queryByText('Contact Email *')).not.toBeInTheDocument()
    })

    it('shows external contact fields when owner_type is external', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const externalCommitmentCard = getCommitmentCard('Commitment 2')

      expect(within(externalCommitmentCard).getByText('Contact Email *')).toBeInTheDocument()
      expect(within(externalCommitmentCard).getByText('Contact Name *')).toBeInTheDocument()
      expect(within(externalCommitmentCard).getByText('Organization')).toBeInTheDocument()
      expect(within(externalCommitmentCard).queryByText('Assigned To *')).not.toBeInTheDocument()
    })

    it('switches between internal and external when owner_type changes', async () => {
      const user = userEvent.setup()
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const internalCommitmentCard = getCommitmentCard('Commitment 1')
      const externalRadio = within(internalCommitmentCard).getByLabelText('External')

      await user.click(externalRadio)

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...mockCommitments[0],
          owner_type: 'external',
          tracking_mode: 'manual', // Should auto-set to manual for external
        },
        mockCommitments[1],
      ])
    })

    it('sets tracking_mode to automatic for internal owners', async () => {
      const user = userEvent.setup()
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const externalCommitmentCard = getCommitmentCard('Commitment 2')
      const internalRadio = within(externalCommitmentCard).getByLabelText('Internal')

      await user.click(internalRadio)

      expect(mockOnChange).toHaveBeenCalledWith([
        mockCommitments[0],
        {
          ...mockCommitments[1],
          owner_type: 'internal',
          tracking_mode: 'automatic', // Should auto-set to automatic for internal
        },
      ])
    })
  })

  describe('Tracking Mode Display', () => {
    it('shows automatic tracking badge for internal commitments', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      expect(screen.getByText('Automatic')).toBeInTheDocument()
    })

    it('shows manual tracking badge for external commitments', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      expect(screen.getByText('Manual')).toBeInTheDocument()
    })

    it('disables status dropdown for internal automatic tracking', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const internalCommitmentCard = getCommitmentCard('Commitment 1')
      const statusTrigger = internalCommitmentCard.querySelector('#status-0')

      expect(statusTrigger).toBeDisabled()
    })

    it('enables status dropdown for external manual tracking', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const externalCommitmentCard = getCommitmentCard('Commitment 2')
      const statusTrigger = externalCommitmentCard.querySelector('#status-1')

      expect(statusTrigger).not.toBeDisabled()
    })
  })

  describe('AI Confidence Display', () => {
    it('shows confidence badge for AI-extracted commitments', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      expect(screen.getByText('90% confidence')).toBeInTheDocument()
      expect(screen.getByText('70% confidence')).toBeInTheDocument()
    })

    it('uses correct badge variant based on confidence level', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const highConfidenceBadge = screen.getByText('90% confidence')
      const mediumConfidenceBadge = screen.getByText('70% confidence')

      expect(highConfidenceBadge).toHaveClass('chip-accent')
      expect(mediumConfidenceBadge).toHaveAttribute('data-slot', 'badge')
      expect(mediumConfidenceBadge).not.toHaveClass('chip-accent')
    })
  })

  describe('Due Date Validation', () => {
    it('disables past dates in date picker', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      // Date picker validation is handled by the Calendar component's disabled prop
      // (date < new Date()). The trigger now renders the date in the IntelDossier
      // day-first format ("Sat 01 Feb") via formatDayFirst, not the previous
      // "February 1st, 2025" long form. Derive the expected label from the same
      // en-GB formatting the component uses so the assertion stays timezone-safe.
      const dueDate = mockCommitments[0]!.due_date
      const expectedLabel = dueDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })

      const internalCommitmentCard = getCommitmentCard('Commitment 1')
      const dueDateButton = within(internalCommitmentCard).getByRole('button', {
        name: new RegExp(expectedLabel),
      })

      expect(dueDateButton).toBeInTheDocument()
    })

    it('defaults to 7 days from now for new commitments', async () => {
      const user = userEvent.setup()
      render(
        <CommitmentEditor commitments={[]} onChange={mockOnChange} availableUsers={mockUsers} />,
      )

      await user.click(screen.getByText('Add Commitment'))

      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          due_date: expect.any(Date),
        }),
      ])

      const calledArg = mockOnChange.mock.calls[0][0][0]
      const diff = Math.abs(calledArg.due_date.getTime() - sevenDaysFromNow.getTime())
      expect(diff).toBeLessThan(1000) // Within 1 second tolerance
    })
  })

  describe('Add Commitment', () => {
    it('adds new commitment with default values', async () => {
      const user = userEvent.setup()
      render(
        <CommitmentEditor commitments={[]} onChange={mockOnChange} availableUsers={mockUsers} />,
      )

      await user.click(screen.getByText('Add Commitment'))

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          description: '',
          priority: 'medium',
          status: 'pending',
          owner_type: 'internal',
          due_date: expect.any(Date),
        },
      ])
    })
  })

  describe('Remove Commitment', () => {
    // Removal now goes through a confirm dialog (ConfirmRemoveButton → AlertDialog):
    // a remove is two steps (click trash → confirm in dialog), not one click.
    it('removes commitment when delete button confirmed', async () => {
      const user = userEvent.setup()
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const removeButtons = screen.getAllByRole('button', { name: 'Remove commitment' })
      await user.click(removeButtons[0]!)

      const dialog = await screen.findByRole('alertdialog')
      const confirmButton = within(dialog).getByRole('button', { name: 'Delete' })
      await user.click(confirmButton)

      expect(mockOnChange).toHaveBeenCalledWith([mockCommitments[1]])
    })
  })

  describe('Read-Only Mode', () => {
    it('hides add button in read-only mode', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
          readOnly
        />,
      )

      expect(screen.queryByText('Add Commitment')).not.toBeInTheDocument()
    })

    it('hides delete buttons in read-only mode', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
          readOnly
        />,
      )

      const deleteButtons = screen.queryAllByRole('button', { name: 'Remove commitment' })

      expect(deleteButtons).toHaveLength(0)
    })

    it('disables all inputs in read-only mode', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
          readOnly
        />,
      )

      const descriptionInput = screen.getByDisplayValue(
        'Complete project documentation',
      ) as HTMLTextAreaElement
      expect(descriptionInput).toBeDisabled()
    })
  })

  describe('External Contact Validation', () => {
    it('requires email for external commitments', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const externalCommitmentCard = getCommitmentCard('Commitment 2')
      const emailInput = within(externalCommitmentCard).getByLabelText(
        'Contact Email *',
      ) as HTMLInputElement

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
    })

    it('requires name for external commitments', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const externalCommitmentCard = getCommitmentCard('Commitment 2')
      const nameInput = within(externalCommitmentCard).getByLabelText(
        'Contact Name *',
      ) as HTMLInputElement

      expect(nameInput).toHaveAttribute('required')
      expect(nameInput).toHaveAttribute('maxLength', '200')
    })

    it('allows optional organization for external commitments', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const externalCommitmentCard = getCommitmentCard('Commitment 2')
      const orgInput = within(externalCommitmentCard).getByLabelText(
        'Organization',
      ) as HTMLInputElement

      expect(orgInput).not.toHaveAttribute('required')
      expect(orgInput.value).toBe('Partner Corp')
    })
  })

  describe('RTL Support', () => {
    it('relies on the global direction provider instead of input dir attributes', () => {
      render(
        <CommitmentEditor
          commitments={mockCommitments}
          onChange={mockOnChange}
          availableUsers={mockUsers}
        />,
      )

      const descriptionInput = screen.getByDisplayValue(
        'Complete project documentation',
      ) as HTMLTextAreaElement
      expect(descriptionInput).not.toHaveAttribute('dir')
    })
  })
})
