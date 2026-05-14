import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { AssignmentDetailsModal } from '@/components/waiting-queue/AssignmentDetailsModal'

const mockAssignment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  work_item_id: 'DOS-2024-001',
  work_item_type: 'dossier' as const,
  assignee_id: 'user-001',
  assignee_name: 'John Doe',
  assignee_email: 'john.doe@gastat.gov.sa',
  status: 'pending' as const,
  workflow_stage: 'todo' as const,
  assigned_at: '2024-01-01T10:00:00Z',
  priority: 'high' as const,
  last_reminder_sent_at: '2024-01-10T14:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  days_waiting: 14,
  work_item: {
    title_en: 'Dossier DOS-2024-001',
    title_ar: 'Dossier DOS-2024-001 AR',
    description: 'Policy dossier awaiting review',
  },
}

describe('AssignmentDetailsModal', () => {
  beforeEach(() => {
    localStorage.removeItem('id.locale')
  })

  it('renders assignment details when open', () => {
    render(<AssignmentDetailsModal assignment={mockAssignment} isOpen onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Dossier DOS-2024-001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john.doe@gastat.gov.sa')).toBeInTheDocument()
    expect(screen.getByTestId('assignment-status')).toHaveTextContent('pending')
    expect(screen.getByTestId('assignment-priority')).toHaveTextContent('high')
    expect(screen.getByTestId('days-waiting')).toHaveTextContent('14 days')
    expect(screen.getByText('Policy dossier awaiting review')).toBeInTheDocument()
  })

  it('does not render when closed or when no assignment is supplied', () => {
    const { rerender } = render(
      <AssignmentDetailsModal assignment={mockAssignment} isOpen={false} onClose={vi.fn()} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<AssignmentDetailsModal assignment={null} isOpen onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('marks a 14 day assignment as danger aging', () => {
    render(<AssignmentDetailsModal assignment={mockAssignment} isOpen onClose={vi.fn()} />)

    expect(screen.getByTestId('aging-badge')).toHaveAttribute('data-aging-level', 'danger')
  })

  it('shows reminder state for present and missing reminder timestamps', () => {
    const { rerender } = render(
      <AssignmentDetailsModal assignment={mockAssignment} isOpen onClose={vi.fn()} />,
    )

    expect(screen.getByText(/Jan.*10.*2024/i)).toBeInTheDocument()

    rerender(
      <AssignmentDetailsModal
        assignment={{ ...mockAssignment, last_reminder_sent_at: null }}
        isOpen
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('No reminder sent')).toBeInTheDocument()
  })

  it('calls onClose from the close button and Escape key', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AssignmentDetailsModal assignment={mockAssignment} isOpen onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('uses Arabic direction when the locale is Arabic', async () => {
    localStorage.setItem('id.locale', 'ar')

    render(<AssignmentDetailsModal assignment={mockAssignment} isOpen onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
    })
  })

  it('has accessible dialog labelling and responsive classes', () => {
    render(<AssignmentDetailsModal assignment={mockAssignment} isOpen onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby')
    expect(dialog.className).toMatch(/\bsm:/)
  })
})
