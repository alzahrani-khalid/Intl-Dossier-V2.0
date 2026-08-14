import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DossierTable, type DossierTableRow } from '../DossierTable'
import { sensitivityChipClass } from '../sensitivity'

// Per-file react-i18next mock (project pattern — global mock has afterActions-only map).
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    i18n: { language: string }
    t: (k: string, opts?: Record<string, unknown>) => string
  } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts &&
        typeof opts === 'object' &&
        'defaultValue' in opts &&
        typeof opts.defaultValue === 'string'
      ) {
        return opts.defaultValue
      }
      return k
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

const sampleRow = (overrides: Partial<DossierTableRow> = {}): DossierTableRow => ({
  id: 'sa',
  type: 'country',
  iso: 'SA',
  name_en: 'Saudi Arabia',
  name_ar: 'المملكة العربية السعودية',
  engagement_count: 12,
  last_touch: '2026-04-01T00:00:00Z',
  sensitivity_level: 2,
  ...overrides,
})

describe('DossierTable', () => {
  it('renders rows with primary name and engagement count', () => {
    render(<DossierTable rows={[sampleRow()]} />)
    expect(screen.getByText('Saudi Arabia')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
  })

  it('fires onRowClick when row clicked', () => {
    const onClick = vi.fn()
    render(<DossierTable rows={[sampleRow()]} onRowClick={onClick} />)
    fireEvent.click(screen.getByText('Saudi Arabia').closest('button')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]?.id).toBe('sa')
  })

  it('exposes one accessible list with one listitem per row, each an interactive button', () => {
    render(<DossierTable rows={[sampleRow(), sampleRow({ id: 'eg', name_en: 'Egypt' })]} />)
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    // Each row is reachable as a button by its accessible name (no role conflict).
    expect(screen.getByRole('button', { name: 'Saudi Arabia' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Egypt' })).toBeTruthy()
  })

  it('activates a row via the keyboard (Enter on the focused button)', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<DossierTable rows={[sampleRow()]} onRowClick={onClick} />)
    const rowButton = screen.getByRole('button', { name: 'Saudi Arabia' })
    rowButton.focus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]?.id).toBe('sa')
  })

  it('renders skeleton when isLoading', () => {
    render(<DossierTable rows={[]} isLoading />)
    expect(screen.getByTestId('dossier-table-skeleton')).toBeTruthy()
  })

  it('renders custom emptyState when rows is empty', () => {
    render(<DossierTable rows={[]} emptyState={<div data-testid="empty">none</div>} />)
    expect(screen.getByTestId('empty')).toBeTruthy()
  })

  it('applies sensitivity chip class via sensitivityChipClass()', () => {
    const row = sampleRow({ sensitivity_level: 4 })
    render(<DossierTable rows={[row]} />)
    const chip = document.querySelector(`.${sensitivityChipClass(4)}`)
    expect(chip).not.toBeNull()
  })

  const optionalAutoCount = (el: Element): number => {
    // Read the computed --dossier-cols custom property; count optional `auto`
    // tracks (total autos minus the always-present glyph `auto`).
    const cols = (el as HTMLElement).style.getPropertyValue('--dossier-cols')
    const autos = (cols.match(/\bauto\b/g) ?? []).length
    return Math.max(0, autos - 1)
  }

  it('renders all optional columns (5-track template) when visibleColumns is absent', () => {
    render(<DossierTable rows={[sampleRow()]} />)
    // Desktop header carries the glyph placeholder + name + 3 optional columns = 5 cells.
    const header = document.querySelector('.dossier-row.label')
    expect(header).not.toBeNull()
    expect(header!.children).toHaveLength(5)
    // The template is computed onto --dossier-cols (3 optional autos → 5 tracks).
    expect(optionalAutoCount(header!)).toBe(3)
    // Engagement count + sensitivity chip both present.
    expect(screen.getByText('12')).toBeTruthy()
    expect(document.querySelector(`.${sensitivityChipClass(2)}`)).not.toBeNull()
  })

  it('renders only the requested optional columns (3-track template) with visibleColumns', () => {
    render(<DossierTable rows={[sampleRow()]} visibleColumns={['sensitivity']} />)
    const header = document.querySelector('.dossier-row.label')
    // glyph placeholder + name + sensitivity = 3 cells; engagements/last-touch hidden.
    expect(header!.children).toHaveLength(3)
    expect(optionalAutoCount(header!)).toBe(1)
    // Engagement count is no longer rendered; sensitivity chip still is.
    expect(screen.queryByText('12')).toBeNull()
    expect(document.querySelector(`.${sensitivityChipClass(2)}`)).not.toBeNull()
  })
})
