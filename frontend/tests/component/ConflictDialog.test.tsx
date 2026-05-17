import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import { ConflictDialog } from '@/components/tasks/ConflictDialog'

describe('ConflictDialog', () => {
  const serverData = {
    title: 'Server Title (Modified by User 2)',
    description: 'Server description updated by another user',
    priority: 'urgent' as const,
    status: 'review' as const,
    updated_at: '2025-01-19T12:00:00Z',
    updated_by: 'user-789',
  }

  const localChanges = {
    title: 'Local Title (Your Changes)',
    description: 'Your local description changes',
    priority: 'high' as const,
    status: 'in_progress' as const,
    updated_at: '2025-01-19T11:00:00Z',
    updated_by: 'user-456',
  }

  function renderDialog(props = {}) {
    return render(
      <ConflictDialog
        open
        onOpenChange={vi.fn()}
        onReload={vi.fn()}
        onForceOverwrite={vi.fn()}
        onCancel={vi.fn()}
        serverData={serverData as any}
        localChanges={localChanges as any}
        {...props}
      />,
    )
  }

  beforeEach(() => {
    localStorage.removeItem('id.locale')
    vi.clearAllMocks()
  })

  it('renders conflict copy and changed fields', () => {
    renderDialog()

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /conflict detected/i })).toBeInTheDocument()
    expect(screen.getByText('Conflicting Fields')).toBeInTheDocument()
    expect(screen.getByText(/Server Title/i)).toBeInTheDocument()
    expect(screen.getByText(/Local Title/i)).toBeInTheDocument()
    expect(screen.getByText('user-789')).toBeInTheDocument()
    expect(screen.getByText('2025-01-19T12:00:00Z')).toBeInTheDocument()
  })

  it('calls the three conflict-resolution actions and closes', () => {
    const onReload = vi.fn()
    const onForceOverwrite = vi.fn()
    const onCancel = vi.fn()
    const onOpenChange = vi.fn()

    renderDialog({ onReload, onForceOverwrite, onCancel, onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: /reload/i }))
    fireEvent.click(screen.getByRole('button', { name: /force save/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onReload).toHaveBeenCalledTimes(1)
    expect(onForceOverwrite).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not render when closed', () => {
    renderDialog({ open: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uses mobile-first action layout classes', () => {
    renderDialog()

    const footer = screen.getByRole('button', { name: /reload/i }).parentElement
    expect(footer).toHaveClass('flex-col', 'sm:flex-row')
  })

  it('uses Arabic direction when the locale is Arabic', async () => {
    localStorage.setItem('id.locale', 'ar')

    renderDialog()

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveAttribute('dir', 'rtl')
    })
  })

  it('keeps focusable controls inside the dialog', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog')
    const reload = screen.getByRole('button', { name: /reload/i })
    reload.focus()

    expect(dialog).toContainElement(document.activeElement)
  })
})
