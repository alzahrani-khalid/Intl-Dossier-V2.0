import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import FilterPanel from '@/components/waiting-queue/FilterPanel'

describe('FilterPanel', () => {
  beforeEach(() => {
    localStorage.removeItem('id.locale')
    vi.clearAllMocks()
  })

  function renderFilterPanel(props = {}) {
    return render(
      <FilterPanel
        filters={{}}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        isOpen
        onOpenChange={vi.fn()}
        {...props}
      />,
    )
  }

  it('renders the popover trigger and all filter sections', () => {
    renderFilterPanel()

    expect(screen.getByRole('button', { name: /open filters/i })).toHaveTextContent('Filters')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Aging')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Assignee')).toBeInTheDocument()
  })

  it('calls onFiltersChange with array values and resets page on priority changes', async () => {
    const onFiltersChange = vi.fn()
    renderFilterPanel({ onFiltersChange })

    fireEvent.click(screen.getByRole('checkbox', { name: /high/i }))

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({ priority: ['high'], page: 1 })
    })
  })

  it('calls onFiltersChange for aging and type filters', async () => {
    const onFiltersChange = vi.fn()
    renderFilterPanel({ onFiltersChange })

    fireEvent.click(screen.getByRole('checkbox', { name: /7\+ days/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /dossier/i }))

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({ aging: ['7+'], page: 1 })
      expect(onFiltersChange).toHaveBeenCalledWith({ type: ['dossier'], page: 1 })
    })
  })

  it('derives active filter count and clears filters', async () => {
    const onClearFilters = vi.fn()
    renderFilterPanel({
      filters: { priority: ['high'], aging: ['7+'] },
      onClearFilters,
    })

    expect(screen.getByRole('button', { name: /open filters/i })).toHaveTextContent(
      '2 filters applied',
    )
    expect(screen.getByRole('status')).toHaveTextContent('2 filters applied')

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))

    await waitFor(() => {
      expect(onClearFilters).toHaveBeenCalledTimes(1)
    })
  })

  it('reflects selected filters and disables controls while applying', () => {
    renderFilterPanel({
      filters: { priority: ['high'] },
      isApplying: true,
    })

    const highPriority = screen.getByRole('checkbox', { name: /high/i })
    expect(highPriority).toHaveAttribute('data-state', 'checked')
    expect(highPriority).toBeDisabled()
  })

  it('shows result count, empty guidance, and loading skeletons', () => {
    const { rerender } = renderFilterPanel({ resultCount: 15 })

    expect(screen.getByText('Showing 15 results')).toBeInTheDocument()

    rerender(
      <FilterPanel
        filters={{}}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        isOpen
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/select filters to narrow down results/i)).toBeInTheDocument()

    rerender(
      <FilterPanel
        filters={{}}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        isOpen
        onOpenChange={vi.fn()}
        isLoading
      />,
    )
    expect(screen.getAllByTestId('filter-skeleton').length).toBeGreaterThan(0)
  })

  it('keeps checkbox touch targets at 48px through the wrapper', () => {
    renderFilterPanel()

    const highPriority = screen.getByRole('checkbox', { name: /high/i })
    expect(highPriority.parentElement).toHaveClass('min-h-12', 'min-w-12')
  })

  it('uses Arabic direction when the locale is Arabic', async () => {
    localStorage.setItem('id.locale', 'ar')

    renderFilterPanel()

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
    })
  })
})
