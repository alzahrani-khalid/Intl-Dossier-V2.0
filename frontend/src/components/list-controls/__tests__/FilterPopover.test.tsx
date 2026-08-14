/**
 * FilterPopover — Phase 87 F24 (AFF-02)
 *
 * Verifies the three load-bearing behaviors: facet counts are gated on open,
 * selecting an option applies immediately, and the trigger reflects the active count.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterPopover } from '../FilterPopover'
import type { ListControlsConfig } from '../useListControls'

function makeConfig(buildCountQuery?: (v: string) => Promise<number>): ListControlsConfig {
  return {
    filters: [
      {
        key: 'status',
        labelKey: 'Status',
        options: [
          { value: 'active', labelKey: 'Active' },
          { value: 'archived', labelKey: 'Archived' },
        ],
        buildCountQuery: buildCountQuery
          ? (value): Promise<number> => buildCountQuery(value)
          : undefined,
      },
    ],
  }
}

function newClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe('FilterPopover', () => {
  it('gates facet-count queries on the popover open state', async () => {
    const buildCountQuery = vi.fn(async () => 3)
    const config = makeConfig(buildCountQuery)
    const qc = newClient()

    const ui = (open: boolean): React.ReactElement => (
      <QueryClientProvider client={qc}>
        <FilterPopover
          config={config}
          surfaceKey="countries"
          activeFilters={{}}
          activeFilterCount={0}
          onFilterChange={vi.fn()}
          open={open}
          onOpenChange={() => {}}
        />
      </QueryClientProvider>
    )

    const { rerender } = render(ui(false))
    expect(buildCountQuery).not.toHaveBeenCalled()

    rerender(ui(true))
    await waitFor(() => expect(buildCountQuery).toHaveBeenCalled())
  })

  it('applies a filter immediately on option select', async () => {
    const config = makeConfig(async () => 5)
    const onFilterChange = vi.fn()
    const qc = newClient()

    render(
      <QueryClientProvider client={qc}>
        <FilterPopover
          config={config}
          surfaceKey="countries"
          activeFilters={{}}
          activeFilterCount={0}
          onFilterChange={onFilterChange}
          open
          onOpenChange={() => {}}
        />
      </QueryClientProvider>,
    )

    const option = await screen.findByRole('option', { name: /active/i })
    await userEvent.click(option)

    expect(onFilterChange).toHaveBeenCalledTimes(1)
    expect(onFilterChange).toHaveBeenCalledWith('status', 'active')
  })

  it('renders "Filter · 2" on the trigger when two filters are active', () => {
    const config = makeConfig()
    const qc = newClient()

    render(
      <QueryClientProvider client={qc}>
        <FilterPopover
          config={config}
          surfaceKey="countries"
          activeFilters={{ status: 'active' }}
          activeFilterCount={2}
          onFilterChange={vi.fn()}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Filter · 2')).toBeInTheDocument()
  })
})
