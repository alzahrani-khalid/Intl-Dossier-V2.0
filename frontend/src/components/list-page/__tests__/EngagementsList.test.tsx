import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EngagementsList, type EngagementRow } from '../EngagementsList'

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


const sampleEngagement = (overrides: Partial<EngagementRow> = {}): EngagementRow => ({
  id: 'e1',
  title_en: 'Saudi-Japan bilateral',
  title_ar: 'لقاء ثنائي سعودي ياباني',
  starts_at: '2026-04-22T10:00:00Z',
  type: 'meeting',
  location: 'Riyadh',
  ...overrides,
})

describe('EngagementsList', () => {
  it('renders engagement titles grouped by week', () => {
    render(
      <EngagementsList
        engagements={[sampleEngagement()]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Saudi-Japan bilateral')).toBeTruthy()
    // Week heading present (uses ISO key like "2026-W17")
    expect(screen.getByText(/Week of/i)).toBeTruthy()
  })

  it('renders 4 filter pills', () => {
    render(
      <EngagementsList
        engagements={[]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={vi.fn()}
      />,
    )
    const group = screen.getByRole('group', { name: /Filter engagements/i })
    expect(group.querySelectorAll('button').length).toBe(4)
  })

  it('marks the active filter via aria-pressed', () => {
    render(
      <EngagementsList
        engagements={[]}
        search=""
        onSearchChange={vi.fn()}
        filter="travel"
        onFilterChange={vi.fn()}
      />,
    )
    const pressed = document.querySelectorAll('[aria-pressed="true"]')
    expect(pressed.length).toBe(1)
  })

  it('fires onFilterChange when a pill is clicked', () => {
    const onFilter = vi.fn()
    render(
      <EngagementsList
        engagements={[]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={onFilter}
      />,
    )
    const group = screen.getByRole('group', { name: /Filter engagements/i })
    const buttons = group.querySelectorAll('button')
    fireEvent.click(buttons[2]!) // call -> 0=all, 1=meeting, 2=call
    expect(onFilter).toHaveBeenCalled()
  })

  it('shows GlobeSpinner load-more during isFetchingNextPage', () => {
    render(
      <EngagementsList
        engagements={[sampleEngagement()]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={vi.fn()}
        hasNextPage
        isFetchingNextPage
      />,
    )
    expect(document.querySelector('.globe-spinner')).not.toBeNull()
  })

  it('renders skeleton when isLoading', () => {
    render(
      <EngagementsList
        engagements={[]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={vi.fn()}
        isLoading
      />,
    )
    expect(screen.getByTestId('engagements-list-skeleton')).toBeTruthy()
  })

  it('fires onEngagementClick with the row', () => {
    const onClick = vi.fn()
    render(
      <EngagementsList
        engagements={[sampleEngagement()]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={vi.fn()}
        onEngagementClick={onClick}
      />,
    )
    fireEvent.click(screen.getByText('Saudi-Japan bilateral').closest('button')!)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0]?.id).toBe('e1')
  })
})
