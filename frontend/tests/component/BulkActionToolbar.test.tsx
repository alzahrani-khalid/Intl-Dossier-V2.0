import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, renderWithProviders as render, screen } from '@tests/utils/render'
import { BulkActionToolbar } from '@/components/waiting-queue/BulkActionToolbar'

describe('BulkActionToolbar', () => {
  const onSendReminders = vi.fn()
  const onClearSelection = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderToolbar(selectedCount = 3, isProcessing = false) {
    return render(
      <BulkActionToolbar
        selectedCount={selectedCount}
        onSendReminders={onSendReminders}
        onClearSelection={onClearSelection}
        isProcessing={isProcessing}
      />,
    )
  }

  it('renders the selected count and bulk actions', () => {
    renderToolbar(5)

    expect(screen.getByRole('toolbar', { name: /bulk actions/i })).toBeInTheDocument()
    expect(screen.getByText('5 items selected')).toBeInTheDocument()
    expect(screen.getByText('Max 100 items')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reminders/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument()
  })

  it('does not render when nothing is selected', () => {
    renderToolbar(0)

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
  })

  it('calls the bulk action handlers', () => {
    renderToolbar(3)

    fireEvent.click(screen.getByRole('button', { name: /send reminders/i }))
    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }))

    expect(onSendReminders).toHaveBeenCalledTimes(1)
    expect(onClearSelection).toHaveBeenCalledTimes(1)
  })

  it('disables actions and shows progress copy while processing', () => {
    renderToolbar(3, true)

    expect(screen.getByRole('button', { name: /send reminders/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeDisabled()
    expect(screen.getByText('Sending...')).toBeInTheDocument()
  })

  it('shows the max-selection warning at the cap', () => {
    renderToolbar(100)

    expect(screen.getByText('Maximum selection reached')).toBeInTheDocument()
  })

  it('keeps mobile-first and RTL-safe class names on the toolbar', () => {
    renderToolbar(2)

    const toolbar = screen.getByRole('toolbar', { name: /bulk actions/i })
    expect(toolbar).toHaveClass('flex-col', 'gap-2', 'p-4')
    expect(toolbar.className).not.toMatch(/\bml-|\bmr-|\bpl-|\bpr-/)
    expect(screen.getByText('Clear Selection')).toHaveClass('ms-2')
  })
})
