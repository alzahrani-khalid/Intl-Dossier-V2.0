import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenericListPage, type GenericListPageItem } from '../GenericListPage'

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


const sampleItems: GenericListPageItem[] = [
  { id: '1', primary: 'Alpha', secondary: 'sub-a', statusLabel: 'Active', statusChipClass: 'chip-info' },
  { id: '2', primary: 'Beta' },
]

describe('GenericListPage', () => {
  it('renders all items with primary/secondary text', () => {
    render(<GenericListPage items={sampleItems} />)
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('sub-a')).toBeTruthy()
    expect(screen.getByText('Beta')).toBeTruthy()
  })

  it('fires onItemClick when row clicked', () => {
    const onItemClick = vi.fn()
    render(<GenericListPage items={sampleItems} onItemClick={onItemClick} />)
    const rows = screen.getAllByTestId('generic-list-page-row')
    fireEvent.click(rows[0])
    expect(onItemClick).toHaveBeenCalledTimes(1)
    expect(onItemClick).toHaveBeenCalledWith(sampleItems[0])
  })

  it('shows skeleton when isLoading', () => {
    render(<GenericListPage items={[]} isLoading />)
    expect(screen.getByTestId('generic-list-page-skeleton')).toBeTruthy()
  })

  it('renders empty state when items=[]', () => {
    render(
      <GenericListPage
        items={[]}
        emptyState={<div data-testid="empty">Nothing here</div>}
      />,
    )
    expect(screen.getByTestId('empty')).toBeTruthy()
  })

  it('renders status chip with provided class', () => {
    render(<GenericListPage items={sampleItems} />)
    const chip = screen.getByTestId('generic-list-page-status')
    expect(chip.textContent).toContain('Active')
    expect(chip.className).toContain('chip-info')
  })
})
