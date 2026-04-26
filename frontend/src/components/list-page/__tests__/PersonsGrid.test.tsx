import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { PersonsGrid, type PersonCard } from '../PersonsGrid'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
})

const renderUI = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

const samplePerson = (overrides: Partial<PersonCard> = {}): PersonCard => ({
  id: 'p1',
  name_en: 'Khalid Al-Zahrani',
  name_ar: 'خالد الزهراني',
  role: 'Director',
  organization: 'GASTAT',
  is_vip: false,
  ...overrides,
})

describe('PersonsGrid', () => {
  it('renders persons with name and meta', () => {
    renderUI(<PersonsGrid persons={[samplePerson()]} />)
    expect(screen.getByText('Khalid Al-Zahrani')).toBeInTheDocument()
    expect(screen.getByText('Director · GASTAT')).toBeInTheDocument()
  })

  it('shows VIP chip when is_vip true', () => {
    renderUI(<PersonsGrid persons={[samplePerson({ is_vip: true })]} />)
    expect(screen.getByTestId('vip-chip')).toBeInTheDocument()
  })

  it('does not show VIP chip when is_vip false', () => {
    renderUI(<PersonsGrid persons={[samplePerson({ is_vip: false })]} />)
    expect(screen.queryByTestId('vip-chip')).toBeNull()
  })

  it('fires onPersonClick with the person', () => {
    const onClick = vi.fn()
    renderUI(<PersonsGrid persons={[samplePerson()]} onPersonClick={onClick} />)
    fireEvent.click(screen.getByText('Khalid Al-Zahrani').closest('button')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]?.id).toBe('p1')
  })

  it('uses 1/2/3 column responsive grid classes', () => {
    const { container } = renderUI(<PersonsGrid persons={[samplePerson()]} />)
    const grid = container.querySelector('[role="list"]')
    expect(grid?.className).toMatch(/grid-cols-1/)
    expect(grid?.className).toMatch(/sm:grid-cols-2/)
    expect(grid?.className).toMatch(/md:grid-cols-3/)
  })

  it('renders skeleton when isLoading', () => {
    renderUI(<PersonsGrid persons={[]} isLoading />)
    expect(screen.getByTestId('persons-grid-skeleton')).toBeInTheDocument()
  })

  it('renders custom emptyState when persons is empty', () => {
    renderUI(<PersonsGrid persons={[]} emptyState={<div data-testid="empty">none</div>} />)
    expect(screen.getByTestId('empty')).toBeInTheDocument()
  })
})
