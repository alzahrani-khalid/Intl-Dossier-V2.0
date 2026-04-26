import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DossierTable, type DossierTableRow } from '../DossierTable'
import { sensitivityChipClass } from '../sensitivity'

// Per-file react-i18next mock (project pattern — global mock has afterActions-only map).
vi.mock('react-i18next', () => ({
  useTranslation: (): { i18n: { language: string }; t: (k: string, opts?: Record<string, unknown>) => string } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (opts && typeof opts === 'object' && 'defaultValue' in opts && typeof opts.defaultValue === 'string') {
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
})
