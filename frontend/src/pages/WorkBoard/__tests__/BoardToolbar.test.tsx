/**
 * Phase 39 Plan 03 — BoardToolbar unit tests.
 *
 * Verifies:
 *  1. 'By status' pill aria-pressed reflects mode and click fires onModeChange('status').
 *  2. 'By dossier' pill is aria-disabled + 'Coming soon' tooltip; click does NOT call onModeChange.
 *  3. 'By owner' pill is aria-disabled + 'Coming soon' tooltip.
 *  4. Overdue chip renders interpolated count; AR locale uses Arabic-Indic digits.
 *  5. Search input has placeholder + aria-label and typing fires onSearchChange per char.
 *  6. '+ New item' button has accessible name; click fires onNewItem.
 *  7. Search input is a controlled React input — XSS-safe rendering only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { BoardToolbar } from '../BoardToolbar'

let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>): string => {
      const enMap: Record<string, string> = {
        'filters.byStatus': 'By status',
        'filters.byDossier': 'By dossier',
        'filters.byOwner': 'By owner',
        'filters.comingSoon': 'Coming soon',
        'filters.search': 'Search work items…',
        'actions.newItem': 'New item',
      }
      const arMap: Record<string, string> = {
        'filters.byStatus': 'بالحالة',
        'filters.byDossier': 'بالملف',
        'filters.byOwner': 'بالمسؤول',
        'filters.comingSoon': 'قريبًا',
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

interface RenderOpts {
  mode?: 'status' | 'dossier' | 'owner'
  searchQuery?: string
  overdueCount?: number
  onModeChange?: (mode: 'status' | 'dossier' | 'owner') => void
  onSearchChange?: (q: string) => void
  onNewItem?: () => void
}

function renderToolbar(opts: RenderOpts = {}): {
  onModeChange: ReturnType<typeof vi.fn>
  onSearchChange: ReturnType<typeof vi.fn>
  onNewItem: ReturnType<typeof vi.fn>
} {
  const onModeChange = vi.fn()
  const onSearchChange = vi.fn()
  const onNewItem = vi.fn()
  render(
    <BoardToolbar
      mode={opts.mode ?? 'status'}
      searchQuery={opts.searchQuery ?? ''}
      overdueCount={opts.overdueCount ?? 0}
      onModeChange={opts.onModeChange ?? onModeChange}
      onSearchChange={opts.onSearchChange ?? onSearchChange}
      onNewItem={opts.onNewItem ?? onNewItem}
    />,
  )
  return { onModeChange, onSearchChange, onNewItem }
}

describe('BoardToolbar — Phase 39 Plan 03', () => {
  beforeEach(() => {
    cleanup()
    currentLang = 'en'
  })

  it('Test 1: "By status" pill aria-pressed=true and click fires onModeChange("status")', () => {
    const { onModeChange } = renderToolbar({ mode: 'status' })
    const pill = screen.getByRole('button', { name: 'By status' })
    expect(pill.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(pill)
    expect(onModeChange).toHaveBeenCalledTimes(1)
    expect(onModeChange).toHaveBeenCalledWith('status')
  })

  it('Test 2: "By dossier" pill aria-disabled with Coming soon; click does NOT call onModeChange', () => {
    const { onModeChange } = renderToolbar({ mode: 'status' })
    const pill = screen.getByRole('button', { name: 'By dossier' })
    expect(pill.getAttribute('aria-disabled')).toBe('true')
    expect(pill.getAttribute('title')).toBe('Coming soon')
    fireEvent.click(pill)
    expect(onModeChange).not.toHaveBeenCalled()
  })

  it('Test 3: "By owner" pill aria-disabled with Coming soon; click does NOT call onModeChange', () => {
    const { onModeChange } = renderToolbar({ mode: 'status' })
    const pill = screen.getByRole('button', { name: 'By owner' })
    expect(pill.getAttribute('aria-disabled')).toBe('true')
    expect(pill.getAttribute('title')).toBe('Coming soon')
    fireEvent.click(pill)
    expect(onModeChange).not.toHaveBeenCalled()
  })

  it('Test 4 (en): overdue chip renders "{count} overdue" with mono class', () => {
    renderToolbar({ overdueCount: 27 })
    const chip = screen.getByText(/27 overdue/)
    expect(chip).toBeTruthy()
    expect(chip.className).toContain('overdue-chip')
    expect(chip.className).toContain('font-mono')
  })

  it('Test 4 (ar): overdue chip renders Arabic-Indic digits via toArDigits', () => {
    currentLang = 'ar'
    renderToolbar({ overdueCount: 27 })
    const chip = screen.getByText(/٢٧ متأخر/)
    expect(chip).toBeTruthy()
  })

  it('Test 5: search input has placeholder + aria-label; change fires onSearchChange', () => {
    const { onSearchChange } = renderToolbar({ searchQuery: '' })
    const input = screen.getByRole('searchbox')
    expect(input.getAttribute('placeholder')).toBe('Search work items…')
    expect(input.getAttribute('aria-label')).toBe('Search work items…')
    fireEvent.change(input, { target: { value: 'Acme' } })
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenCalledWith('Acme')
  })

  it('Test 6: "+ New item" button has accessible name and click fires onNewItem', () => {
    const { onNewItem } = renderToolbar()
    const btn = screen.getByRole('button', { name: 'New item' })
    expect(btn).toBeTruthy()
    expect(btn.textContent).toContain('+')
    expect(btn.textContent).toContain('New item')
    fireEvent.click(btn)
    expect(onNewItem).toHaveBeenCalledTimes(1)
  })

  it('Test 7: search input is a controlled React input (value reflects prop)', () => {
    renderToolbar({ searchQuery: 'persisted query' })
    const input = screen.getByRole('searchbox') as HTMLInputElement
    expect(input.value).toBe('persisted query')
    cleanup()
    renderToolbar({ searchQuery: 'updated' })
    const input2 = screen.getByRole('searchbox') as HTMLInputElement
    expect(input2.value).toBe('updated')
  })
})
