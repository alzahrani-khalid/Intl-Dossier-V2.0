/**
 * Phase 87 Plan 09 — BoardToolbar unit tests (Filter + Display popovers).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { BoardToolbar } from '../BoardToolbar'
import type {
  ListControlsConfig,
  UseListControlsReturn,
} from '@/components/list-controls/useListControls'

let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string | string[]) => ({
    t: (key: string, opts?: Record<string, unknown>): string => {
      if (ns === 'list-controls' || (Array.isArray(ns) && ns.includes('list-controls'))) {
        const lc: Record<string, string> = {
          'filter.trigger': 'Filter',
          'display.trigger': 'Display',
        }
        return lc[key] ?? key
      }
      const enMap: Record<string, string> = {
        'columnModes.label': 'Group by',
        'filters.search': 'Search work items…',
        'actions.newItem': 'New item',
      }
      const arMap: Record<string, string> = {
        'columnModes.label': 'تجميع حسب',
        'filters.search': 'بحث في عناصر العمل…',
        'actions.newItem': 'عنصر جديد',
      }
      if (key === 'overdueChip' && opts && 'count' in opts) {
        const count = String((opts as { count: string | number }).count)
        return currentLang === 'ar' ? `${count} متأخر` : `${count} overdue`
      }
      const map = currentLang === 'ar' ? arMap : enMap
      return map[key] ?? key
    },
    i18n: { language: currentLang },
  }),
}))

vi.mock('@/components/ui/ltr-isolate', () => ({
  LtrIsolate: ({ children }: { children: ReactNode }): ReactElement => (
    <div data-testid="ltr-isolate" dir="ltr">
      {children}
    </div>
  ),
}))

vi.mock('@/components/list-controls/FilterPopover', () => ({
  FilterPopover: (): ReactElement => <button type="button">Filter</button>,
}))

vi.mock('@/components/list-controls/DisplayPopover', () => ({
  DisplayPopover: (): ReactElement => <button type="button">Display</button>,
}))

const stubConfig: ListControlsConfig = {
  filters: [],
  grouping: [{ id: 'status', labelKey: 'unified-kanban:columnModes.status' }],
}

const stubControls: UseListControlsReturn = {
  filters: {},
  visibleProperties: [],
  activeFilterCount: 0,
  hasActiveFilters: false,
  filterChips: [],
  setFilter: vi.fn(),
  removeFilter: vi.fn(),
  clearAll: vi.fn(),
  setSort: vi.fn(),
  setDir: vi.fn(),
  toggleProperty: vi.fn(),
  setGroup: vi.fn(),
  resetDisplay: vi.fn(),
}

function renderToolbar(
  opts: {
    searchQuery?: string
    overdueCount?: number
    onSearchChange?: (q: string) => void
    onNewItem?: () => void
  } = {},
): {
  onSearchChange: ReturnType<typeof vi.fn>
  onNewItem: ReturnType<typeof vi.fn>
} {
  const onSearchChange = vi.fn()
  const onNewItem = vi.fn()
  render(
    <BoardToolbar
      config={stubConfig}
      controls={stubControls}
      searchQuery={opts.searchQuery ?? ''}
      overdueCount={opts.overdueCount ?? 0}
      onSearchChange={opts.onSearchChange ?? onSearchChange}
      onNewItem={opts.onNewItem ?? onNewItem}
    />,
  )
  return { onSearchChange, onNewItem }
}

describe('BoardToolbar — Phase 87 Plan 09', () => {
  beforeEach(() => {
    cleanup()
    currentLang = 'en'
  })

  it('renders Filter and Display popover triggers (no legacy pill row)', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Display' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'By status' })).toBeNull()
  })

  it('overdue chip renders interpolated count with mono class', () => {
    renderToolbar({ overdueCount: 27 })
    const chip = screen.getByText(/27 overdue/)
    expect(chip.className).toContain('overdue-chip')
    expect(chip.className).toContain('font-mono')
  })

  it('search input is controlled and fires onSearchChange', () => {
    const { onSearchChange } = renderToolbar({ searchQuery: '' })
    const input = screen.getByRole('searchbox')
    expect(input.getAttribute('placeholder')).toBe('Search work items…')
    fireEvent.change(input, { target: { value: 'Acme' } })
    expect(onSearchChange).toHaveBeenCalledWith('Acme')
  })

  it('+ New item button fires onNewItem', () => {
    const { onNewItem } = renderToolbar()
    fireEvent.click(screen.getByRole('button', { name: 'New item' }))
    expect(onNewItem).toHaveBeenCalledTimes(1)
  })
})
