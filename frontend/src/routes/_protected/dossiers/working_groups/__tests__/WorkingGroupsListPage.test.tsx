import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkingGroupsListPage } from '../index'

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    i18n: { language: string }
    t: (k: string, opts?: Record<string, unknown>) => string
  } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (k === 'working-groups:title') return 'Working Groups'
      if (k === 'working-groups:subtitle') return 'Committees and task forces'
      if (k === 'working-groups:empty.title') return 'No working groups yet'
      if (k === 'working-groups:empty.description') return 'Working group dossiers will appear here.'
      if (k === 'working-groups:status.active') return 'Active'
      if (k === 'working-groups:status.completed') return 'Completed'
      if (k === 'working-groups:status.on_hold') return 'On hold'
      if (opts && typeof opts === 'object' && 'defaultValue' in opts && typeof opts.defaultValue === 'string') {
        return opts.defaultValue
      }
      return k
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: 'ltr',
    isRTL: false,
  }),
}))

vi.mock('@/hooks/useWorkingGroups', () => ({
  useWorkingGroups: (): {
    data: {
      data: Array<{
        id: string
        name_en: string
        name_ar: string
        status: 'active' | 'completed' | 'on_hold'
        updated_at: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
    isLoading: boolean
  } => ({
    data: {
      data: [
        {
          id: 'wg1',
          name_en: 'AI Ethics WG',
          name_ar: 'فريق أخلاقيات الذكاء الاصطناعي',
          status: 'active',
          updated_at: '2026-04-15T00:00:00Z',
        },
        {
          id: 'wg2',
          name_en: 'Trade Sanctions WG',
          name_ar: 'فريق العقوبات التجارية',
          status: 'on_hold',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    },
    isLoading: false,
  }),
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: ({ type }: { type: string }): React.ReactNode => (
    <span data-testid={`glyph-${type}`} aria-hidden="true" />
  ),
}))

describe('WorkingGroupsListPage', () => {
  it('renders the Working Groups title', () => {
    render(
      <WorkingGroupsListPage page={1} onItemNavigate={(): void => undefined} />,
    )
    expect(screen.getByText('Working Groups')).toBeTruthy()
  })

  it('renders one row per working group with correct status chips', () => {
    render(
      <WorkingGroupsListPage page={1} onItemNavigate={(): void => undefined} />,
    )

    const rows = screen.getAllByTestId('generic-list-page-row')
    expect(rows.length).toBe(2)

    // Active → chip-ok
    const activeRow = screen.getByText('AI Ethics WG').closest('[data-testid="generic-list-page-row"]')
    expect(activeRow).toBeTruthy()
    const activeChip = activeRow?.querySelector('[data-testid="generic-list-page-status"]')
    expect(activeChip?.className).toContain('chip-ok')

    // on_hold → chip-warn
    const onHoldRow = screen
      .getByText('Trade Sanctions WG')
      .closest('[data-testid="generic-list-page-row"]')
    expect(onHoldRow).toBeTruthy()
    const onHoldChip = onHoldRow?.querySelector('[data-testid="generic-list-page-status"]')
    expect(onHoldChip?.className).toContain('chip-warn')
  })

  it('renders glyph with type=working_group for each row', () => {
    render(
      <WorkingGroupsListPage page={1} onItemNavigate={(): void => undefined} />,
    )
    const glyphs = screen.getAllByTestId('glyph-working_group')
    expect(glyphs.length).toBe(2)
  })

  it('row click invokes onItemNavigate with the row id', () => {
    const onItemNavigate = vi.fn()
    render(<WorkingGroupsListPage page={1} onItemNavigate={onItemNavigate} />)

    const rows = screen.getAllByTestId('generic-list-page-row')
    fireEvent.click(rows[0])
    expect(onItemNavigate).toHaveBeenCalledTimes(1)
    expect(onItemNavigate).toHaveBeenCalledWith('wg1')
  })

  it('renders rows with min-h ≥44px (touch-target)', () => {
    render(<WorkingGroupsListPage page={1} onItemNavigate={(): void => undefined} />)
    const rows = screen.getAllByTestId('generic-list-page-row')
    rows.forEach((row) => {
      const minHeight = (row as HTMLElement).style.minHeight
      expect(minHeight === '44px' || minHeight === '44').toBeTruthy()
    })
  })
})
