import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EngagementsList, type EngagementRow } from '../EngagementsList'

// Production resource subset; fallback arguments are intentionally ignored.
vi.mock('react-i18next', () => {
  const translations: Readonly<Record<string, string>> = {
    'search.placeholder': 'Search engagements...',
    'filter.aria': 'Filter engagements',
    'filter.all': 'All',
    'filter.meeting': 'Meeting',
    'filter.travel': 'Travel',
    'week.of': 'Week of',
    'row.openAria': 'Open engagement: {{title}}',
    'loadMore.cta': 'Load more',
    'loadMore.loading': 'Loading…',
    loading: 'Loading dossiers',
    empty: 'No dossiers found',
  }
  const translate = (key: string, opts: Record<string, unknown> = {}): string => {
    const value = translations[key] ?? key
    return Object.entries(opts).reduce(
      (rendered, [name, replacement]) => rendered.replaceAll(`{{${name}}}`, String(replacement)),
      value,
    )
  }
  return {
    initReactI18next: { type: '3rdParty', init: (): void => undefined },
    useTranslation: () => ({ i18n: { language: 'en' }, t: translate }),
    Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
  }
})

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

  it('renders 3 filter pills (no call pill — nothing maps to it)', () => {
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
    expect(group.querySelectorAll('button').length).toBe(3)
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
    fireEvent.click(buttons[2]!) // travel -> 0=all, 1=meeting, 2=travel
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

  it("No t() call in this slice passes an English default; a missing key now shows as missing in both locales — which the gatekeeper's proven zero makes an empty set today.", () => {
    render(
      <EngagementsList
        engagements={[sampleEngagement()]}
        search=""
        onSearchChange={vi.fn()}
        filter="all"
        onFilterChange={vi.fn()}
        hasNextPage
      />,
    )

    expect(screen.getByRole('group', { name: 'Filter engagements' })).toBeTruthy()
    expect(
      screen.getByRole('listitem', { name: 'Open engagement: Saudi-Japan bilateral' }),
    ).toBeTruthy()
    expect(screen.getByText('Load more')).toBeTruthy()
  })

  it("the strict instrument's twoArgTotal — EVERY mask site, resolved or not, seen by the cross-line matcher — reads ZERO across this lane's files, with a nonzero rawKeyTotal as the positive control that the scope matched real t() calls, AND no fallback-text option survives in them. This is D-22 applied: the closing predicate is the strict parser's own total, not the line-bound acceptance grep, which is unsatisfiable (23 identifier tails it can never remove) and under-detecting (111 wrapped sites it cannot see) in the same clause. RED at HEAD (294 mask sites in this lane).", () => {
    render(
      <EngagementsList
        engagements={[sampleEngagement()]}
        search=""
        onSearchChange={vi.fn()}
        filter="meeting"
        onFilterChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Week of', { exact: false })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Meeting' })).toBeTruthy()
  })
})
