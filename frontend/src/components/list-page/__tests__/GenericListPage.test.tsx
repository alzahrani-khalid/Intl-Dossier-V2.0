import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { GenericListPage, type GenericListPageItem } from '../GenericListPage'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
})

const renderUI = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

const sampleItems: GenericListPageItem[] = [
  { id: '1', primary: 'Alpha', secondary: 'sub-a', statusLabel: 'Active', statusChipClass: 'chip-info' },
  { id: '2', primary: 'Beta' },
]

describe('GenericListPage', () => {
  it('renders all items with primary/secondary text', () => {
    renderUI(<GenericListPage items={sampleItems} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('sub-a')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('fires onItemClick when row clicked', () => {
    const onItemClick = vi.fn()
    renderUI(<GenericListPage items={sampleItems} onItemClick={onItemClick} />)
    const rows = screen.getAllByTestId('generic-list-page-row')
    fireEvent.click(rows[0])
    expect(onItemClick).toHaveBeenCalledTimes(1)
    expect(onItemClick).toHaveBeenCalledWith(sampleItems[0])
  })

  it('shows skeleton when isLoading', () => {
    renderUI(<GenericListPage items={[]} isLoading />)
    expect(screen.getByTestId('generic-list-page-skeleton')).toBeInTheDocument()
  })

  it('renders empty state when items=[]', () => {
    renderUI(
      <GenericListPage
        items={[]}
        emptyState={<div data-testid="empty">Nothing here</div>}
      />,
    )
    expect(screen.getByTestId('empty')).toBeInTheDocument()
  })

  it('renders status chip with provided class', () => {
    renderUI(<GenericListPage items={sampleItems} />)
    const chip = screen.getByTestId('generic-list-page-status')
    expect(chip).toHaveTextContent('Active')
    expect(chip.className).toContain('chip-info')
  })
})
