import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { useReminderAction } from '@/hooks/useWaitingQueueActions'
import { useToast } from '@/hooks/useToast'
import { ReminderButton } from '@/components/waiting-queue/ReminderButton'

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

vi.mock('@/hooks/useWaitingQueueActions', () => ({
  useReminderAction: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  })),
}))

describe('ReminderButton', () => {
  const assignmentId = '123e4567-e89b-12d3-a456-426614174000'
  const assigneeId = 'user-001'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders follow-up reminder copy with touch-friendly sizing', () => {
    render(<ReminderButton assignmentId={assignmentId} assigneeId={assigneeId} />)

    const button = screen.getByRole('button', { name: /follow-up reminder/i })
    expect(button).toHaveTextContent(/follow up/i)
    expect(button).toHaveClass('min-h-11', 'min-w-11')
    expect(button.className).not.toMatch(/ml-|mr-|pl-|pr-/)
  })

  it('calls the reminder mutation with the assignment payload', async () => {
    const mutate = vi.fn()
    vi.mocked(useReminderAction).mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ReminderButton assignmentId={assignmentId} assigneeId={assigneeId} />)

    await user.click(screen.getByRole('button', { name: /follow-up reminder/i }))

    expect(mutate).toHaveBeenCalledWith({ assignmentId }, expect.any(Object))
  })

  it('shows pending state to visual and assistive users', () => {
    vi.mocked(useReminderAction).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isSuccess: false,
      isError: false,
      error: null,
    })

    render(<ReminderButton assignmentId={assignmentId} assigneeId={assigneeId} />)

    const button = screen.getByRole('button', { name: /follow-up reminder/i })
    expect(button).toBeDisabled()
    expect(screen.getByText(/sending/i)).toBeInTheDocument()
  })

  it('prevents reminders when the assignment has no assignee', () => {
    render(<ReminderButton assignmentId={assignmentId} assigneeId={null} />)

    expect(screen.getByRole('button', { name: /follow-up reminder/i })).toBeDisabled()
  })

  it('shows a success toast when the mutation succeeds', async () => {
    const toast = vi.fn()
    vi.mocked(useToast).mockReturnValue({ toast })
    vi.mocked(useReminderAction).mockReturnValue({
      mutate: vi.fn((_, { onSuccess }) => onSuccess?.()),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    })

    const user = userEvent.setup()
    render(<ReminderButton assignmentId={assignmentId} assigneeId={assigneeId} />)

    await user.click(screen.getByRole('button', { name: /follow-up reminder/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Reminder Sent',
          variant: 'default',
        }),
      )
    })
  })

  it.each([
    ['COOLDOWN_ACTIVE', /cooldown/i, { hours_remaining: 12 }],
    ['RATE_LIMIT_EXCEEDED', /rate limit/i, undefined],
    ['NO_ASSIGNEE', /no assignee/i, undefined],
    ['ASSIGNMENT_NOT_FOUND', /not found/i, undefined],
    ['VERSION_CONFLICT', /changed/i, undefined],
    ['UNKNOWN_ERROR', /failed/i, undefined],
  ])('maps %s errors to destructive toasts', async (code, title, details) => {
    const toast = vi.fn()
    vi.mocked(useToast).mockReturnValue({ toast })
    vi.mocked(useReminderAction).mockReturnValue({
      mutate: vi.fn((_, { onError }) => onError?.({ code, details })),
      isPending: false,
      isSuccess: false,
      isError: true,
      error: { code },
    })

    const user = userEvent.setup()
    render(<ReminderButton assignmentId={assignmentId} assigneeId={assigneeId} />)

    await user.click(screen.getByRole('button', { name: /follow-up reminder/i }))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(title),
          variant: 'destructive',
        }),
      )
    })
  })
})
