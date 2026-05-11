import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListPageShell } from '../ListPageShell'

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


describe('ListPageShell', () => {
  it('renders the title', () => {
    render(<ListPageShell title="Countries" />)
    expect(screen.getByRole('heading', { name: 'Countries' })).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    render(<ListPageShell title="Countries" subtitle="All nations" />)
    expect(screen.getByText('All nations')).toBeTruthy()
  })

  it('shows skeleton when isLoading', () => {
    render(<ListPageShell title="Countries" isLoading />)
    expect(screen.getByTestId('list-page-skeleton')).toBeTruthy()
  })

  it('shows empty state when isEmpty', () => {
    render(
      <ListPageShell
        title="Countries"
        isEmpty
        emptyState={<div data-testid="empty-state">No data</div>}
      />,
    )
    expect(screen.getByTestId('empty-state')).toBeTruthy()
  })

  it('renders children when not loading and not empty', () => {
    render(
      <ListPageShell title="Countries">
        <div data-testid="content">Row 1</div>
      </ListPageShell>,
    )
    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('renders toolbar when provided', () => {
    render(
      <ListPageShell title="Countries" toolbar={<div data-testid="toolbar">Search</div>} />,
    )
    expect(screen.getByTestId('toolbar')).toBeTruthy()
  })
})
