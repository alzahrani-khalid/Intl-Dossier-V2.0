import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ListPageShell } from '../ListPageShell'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
})

const renderShell = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('ListPageShell', () => {
  it('renders the title', () => {
    renderShell(<ListPageShell title="Countries" />)
    expect(screen.getByRole('heading', { name: 'Countries' })).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    renderShell(<ListPageShell title="Countries" subtitle="All nations" />)
    expect(screen.getByText('All nations')).toBeInTheDocument()
  })

  it('shows skeleton when isLoading', () => {
    renderShell(<ListPageShell title="Countries" isLoading />)
    expect(screen.getByTestId('list-page-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when isEmpty', () => {
    renderShell(
      <ListPageShell
        title="Countries"
        isEmpty
        emptyState={<div data-testid="empty-state">No data</div>}
      />,
    )
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('renders children when not loading and not empty', () => {
    renderShell(
      <ListPageShell title="Countries">
        <div data-testid="content">Row 1</div>
      </ListPageShell>,
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders toolbar when provided', () => {
    renderShell(
      <ListPageShell title="Countries" toolbar={<div data-testid="toolbar">Search</div>} />,
    )
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
  })
})
