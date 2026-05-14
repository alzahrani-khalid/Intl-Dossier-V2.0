import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { EscalationDialog } from '@/components/waiting-queue/EscalationDialog'

describe('EscalationDialog', () => {
  const assignment = {
    id: 'test-assignment-id',
    work_item_id: 'test-work-item',
    work_item_type: 'dossier',
    assignee_id: 'test-assignee',
    assignee_name: 'Test Assignee',
    status: 'pending',
    workflow_stage: 'review',
    assigned_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    days_waiting: 8,
  }

  const escalationPath = [
    {
      user_id: 'manager-id-1',
      full_name: 'Team Lead',
      position_title: 'Team Lead',
      department: 'Analytics',
    },
    {
      user_id: 'manager-id-2',
      full_name: 'Division Manager',
      position_title: 'Division Manager',
      department: 'Analytics',
    },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    assignment,
    escalationPath,
    onEscalate: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    localStorage.removeItem('id.locale')
    vi.clearAllMocks()
  })

  it('renders assignment details and the default escalation recipient', () => {
    render(<EscalationDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Escalate Assignment')).toBeInTheDocument()
    expect(screen.getByText('test-work-item')).toBeInTheDocument()
    expect(screen.getByText(/Test Assignee/)).toBeInTheDocument()
    expect(screen.getByText('Team Lead')).toBeInTheDocument()
    expect(screen.getByText(/Analytics/)).toBeInTheDocument()
    expect(screen.getByText('8 days')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<EscalationDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('requires a reason before escalation can be submitted', async () => {
    const user = userEvent.setup()
    const onEscalate = vi.fn()
    render(<EscalationDialog {...defaultProps} onEscalate={onEscalate} />)

    const escalateButton = screen.getByRole('button', { name: /^escalate$/i })
    expect(escalateButton).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText(/why are you escalating/i),
      'Assignment overdue for 8 days',
    )
    await user.click(escalateButton)

    expect(onEscalate).toHaveBeenCalledWith({
      assignmentId: assignment.id,
      recipientId: escalationPath[0].user_id,
      reason: 'Assignment overdue for 8 days',
    })
  })

  it('closes from the cancel and close controls', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<EscalationDialog {...defaultProps} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('shows loading state and exposes accessible labels', () => {
    render(<EscalationDialog {...defaultProps} isLoading />)

    expect(screen.getByRole('button', { name: /escalating/i })).toBeDisabled()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby')
  })

  it('uses responsive, logical, touch-friendly dialog classes', () => {
    render(<EscalationDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('ps-4', 'pe-4', 'sm:ps-6', 'sm:pe-6')
    expect(dialog.className).not.toMatch(/\bpl-|\bpr-/)
    expect(screen.getByRole('button', { name: /^escalate$/i })).toHaveClass('h-11', 'min-w-11')
  })

  it('uses Arabic direction when the locale is Arabic', async () => {
    localStorage.setItem('id.locale', 'ar')

    render(<EscalationDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
    })
  })

  it('disables escalation and explains when no escalation path exists', () => {
    render(<EscalationDialog {...defaultProps} escalationPath={[]} />)

    expect(screen.getByText(/No manager configured for Test Assignee/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^escalate$/i })).toBeDisabled()
  })
})
