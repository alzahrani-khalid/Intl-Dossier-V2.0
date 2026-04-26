import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PersonsGrid, type PersonCard } from '../PersonsGrid'

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
    render(<PersonsGrid persons={[samplePerson()]} />)
    expect(screen.getByText('Khalid Al-Zahrani')).toBeTruthy()
    expect(screen.getByText('Director · GASTAT')).toBeTruthy()
  })

  it('shows VIP chip when is_vip true', () => {
    render(<PersonsGrid persons={[samplePerson({ is_vip: true })]} />)
    expect(screen.getByTestId('vip-chip')).toBeTruthy()
  })

  it('does not show VIP chip when is_vip false', () => {
    render(<PersonsGrid persons={[samplePerson({ is_vip: false })]} />)
    expect(screen.queryByTestId('vip-chip')).toBeNull()
  })

  it('fires onPersonClick with the person', () => {
    const onClick = vi.fn()
    render(<PersonsGrid persons={[samplePerson()]} onPersonClick={onClick} />)
    fireEvent.click(screen.getByText('Khalid Al-Zahrani').closest('button')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]?.id).toBe('p1')
  })

  it('uses 1/2/3 column responsive grid classes', () => {
    const { container } = render(<PersonsGrid persons={[samplePerson()]} />)
    const grid = container.querySelector('[role="list"]')
    expect(grid?.className).toMatch(/grid-cols-1/)
    expect(grid?.className).toMatch(/sm:grid-cols-2/)
    expect(grid?.className).toMatch(/md:grid-cols-3/)
  })

  it('renders skeleton when isLoading', () => {
    render(<PersonsGrid persons={[]} isLoading />)
    expect(screen.getByTestId('persons-grid-skeleton')).toBeTruthy()
  })

  it('renders custom emptyState when persons is empty', () => {
    render(<PersonsGrid persons={[]} emptyState={<div data-testid="empty">none</div>} />)
    expect(screen.getByTestId('empty')).toBeTruthy()
  })
})
