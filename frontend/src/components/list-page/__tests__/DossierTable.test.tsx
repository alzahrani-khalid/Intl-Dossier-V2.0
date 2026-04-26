import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DossierTable, type DossierTableRow } from '../DossierTable'
import { sensitivityChipClass } from '../sensitivity'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
})

const renderUI = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

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
    renderUI(<DossierTable rows={[sampleRow()]} />)
    expect(screen.getByText('Saudi Arabia')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('fires onRowClick when row clicked', () => {
    const onClick = vi.fn()
    renderUI(<DossierTable rows={[sampleRow()]} onRowClick={onClick} />)
    fireEvent.click(screen.getByText('Saudi Arabia').closest('button')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]?.id).toBe('sa')
  })

  it('renders skeleton when isLoading', () => {
    renderUI(<DossierTable rows={[]} isLoading />)
    expect(screen.getByTestId('dossier-table-skeleton')).toBeInTheDocument()
  })

  it('renders custom emptyState when rows is empty', () => {
    renderUI(<DossierTable rows={[]} emptyState={<div data-testid="empty">none</div>} />)
    expect(screen.getByTestId('empty')).toBeInTheDocument()
  })

  it('applies sensitivity chip class via sensitivityChipClass()', () => {
    const row = sampleRow({ sensitivity_level: 4 })
    renderUI(<DossierTable rows={[row]} />)
    const chip = document.querySelector(`.${sensitivityChipClass(4)}`)
    expect(chip).not.toBeNull()
  })
})
