/**
 * EngagementsListPage tests (Phase 40 LIST-04).
 *
 * Mocks `useEngagementsInfinite` so the page renders against a deterministic
 * page payload. Asserts the primitive is wired (search, 3 pills, week list,
 * load-more, GlobeSpinner during pagination, click-through navigation).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState, type ReactElement } from 'react'
import EngagementsListPage from '../EngagementsListPage'
import type { EngagementFilter } from '@/components/list-page'

const emptyStateSpy = vi.hoisted(() => vi.fn())

vi.mock('@/components/empty-states', () => ({
  ListEmptyState: (props: {
    entityType: string
    filtered?: boolean
    onCreate?: () => void
    onClearFilters?: () => void
  }): ReactElement => {
    emptyStateSpy(props)
    return <div data-testid="engagement-list-empty-state">Engagement empty state</div>
  },
}))

/**
 * Stateful harness: the page is now controlled (search + filter lifted to the
 * route's URL params in Phase 87-05). This mirrors the route wrapper's state so
 * the pill-filtering assertions below exercise the same behavior as production.
 */
function Harness(): ReactElement {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<EngagementFilter>('all')
  return (
    <EngagementsListPage
      search={search}
      filter={filter}
      onSearchChange={setSearch}
      onFilterChange={setFilter}
    />
  )
}

// react-i18next: project-wide pattern for per-file mock (prevents global afterActions-only map).
const i18nLanguageRef = { current: 'en' }
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: Record<string, unknown>) => string
    i18n: { language: string }
  } => ({
    i18n: { language: i18nLanguageRef.current },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts !== undefined &&
        opts !== null &&
        typeof opts === 'object' &&
        'defaultValue' in opts &&
        typeof opts.defaultValue === 'string'
      ) {
        return opts.defaultValue
      }
      return k
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

// Navigate spy.
const navigateSpy = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateSpy => navigateSpy,
}))

// useEngagementsInfinite — mutable mock so each test can adjust pages / flags.
type MockReturn = {
  data: { pages: Array<{ data: unknown[]; pagination: unknown }>; pageParams: number[] } | undefined
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  fetchNextPage: ReturnType<typeof vi.fn>
}
const mockReturn: MockReturn = {
  data: undefined,
  hasNextPage: false,
  isFetchingNextPage: false,
  isLoading: false,
  fetchNextPage: vi.fn(),
}
vi.mock('@/hooks/useEngagementsInfinite', () => ({
  useEngagementsInfinite: (): MockReturn => mockReturn,
}))

const samplePage = {
  data: [
    {
      id: 'e1',
      name_en: 'Geneva Summit',
      name_ar: 'قمة جنيف',
      engagement_type: 'summit',
      engagement_category: 'diplomatic',
      engagement_status: 'confirmed',
      start_date: '2026-04-20T10:00:00Z',
      end_date: '2026-04-20T12:00:00Z',
      is_virtual: false,
      participant_count: 4,
    },
    {
      id: 'e2',
      name_en: 'Paris Mission',
      name_ar: 'بعثة باريس',
      engagement_type: 'mission',
      engagement_category: 'diplomatic',
      engagement_status: 'planned',
      start_date: '2026-04-22T14:00:00Z',
      end_date: '2026-04-22T16:00:00Z',
      is_virtual: false,
      participant_count: 2,
    },
    {
      id: 'e3',
      name_en: 'Bilateral Call',
      name_ar: 'مكالمة ثنائية',
      engagement_type: 'bilateral_meeting',
      engagement_category: 'diplomatic',
      engagement_status: 'completed',
      start_date: '2026-04-15T09:00:00Z',
      end_date: '2026-04-15T10:00:00Z',
      is_virtual: true,
      participant_count: 2,
    },
  ],
  pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
}

beforeEach(() => {
  i18nLanguageRef.current = 'en'
  navigateSpy.mockReset()
  emptyStateSpy.mockClear()
  mockReturn.data = { pages: [samplePage], pageParams: [1] }
  mockReturn.hasNextPage = true
  mockReturn.isFetchingNextPage = false
  mockReturn.isLoading = false
  mockReturn.fetchNextPage = vi.fn()
})

describe('EngagementsListPage', () => {
  it('renders the Engagements title from ListPageShell', () => {
    render(<Harness />)
    expect(screen.getByRole('heading', { name: /Engagements/i, level: 1 })).toBeTruthy()
  })

  it('renders 3 filter pills (no call pill — nothing maps to it)', () => {
    render(<Harness />)
    const group = screen.getByRole('group', { name: /Filter engagements/i })
    expect(group.querySelectorAll('button').length).toBe(3)
  })

  it('renders engagement rows from the mock data', () => {
    render(<Harness />)
    expect(screen.getByText('Geneva Summit')).toBeTruthy()
    expect(screen.getByText('Paris Mission')).toBeTruthy()
    expect(screen.getByText('Bilateral Call')).toBeTruthy()
  })

  it('clicking the Travel pill filters to mission/delegation/official_visit only', () => {
    render(<Harness />)
    const group = screen.getByRole('group', { name: /Filter engagements/i })
    const buttons = group.querySelectorAll('button')
    // Order: 0=all, 1=meeting, 2=travel (call pill removed in round 7)
    fireEvent.click(buttons[2]!)
    expect(screen.queryByText('Geneva Summit')).toBeNull() // summit → 'event', filtered out
    expect(screen.queryByText('Bilateral Call')).toBeNull() // bilateral_meeting → 'meeting', filtered out
    expect(screen.getByText('Paris Mission')).toBeTruthy() // mission → 'travel'
  })

  it('clicking All restores all rows', () => {
    render(<Harness />)
    const group = screen.getByRole('group', { name: /Filter engagements/i })
    const buttons = group.querySelectorAll('button')
    fireEvent.click(buttons[2]!) // travel
    expect(screen.queryByText('Geneva Summit')).toBeNull()
    fireEvent.click(buttons[0]!) // all
    expect(screen.getByText('Geneva Summit')).toBeTruthy()
    expect(screen.getByText('Paris Mission')).toBeTruthy()
  })

  it('clicking a row navigates to /engagements/$engagementId/overview', () => {
    render(<Harness />)
    const button = screen.getByText('Geneva Summit').closest('button')
    expect(button).not.toBeNull()
    fireEvent.click(button!)
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy.mock.calls[0]?.[0]).toEqual({
      to: '/engagements/$engagementId/overview',
      params: { engagementId: 'e1' },
    })
  })

  it('shows the load-more CTA when hasNextPage is true', () => {
    render(<Harness />)
    expect(screen.getByText(/Load more/i)).toBeTruthy()
  })

  it('clicking load-more triggers fetchNextPage', () => {
    render(<Harness />)
    const cta = screen.getByText(/Load more/i)
    fireEvent.click(cta.closest('button')!)
    expect(mockReturn.fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('renders the GlobeSpinner + bilingual loading text in EN during isFetchingNextPage', () => {
    mockReturn.isFetchingNextPage = true
    render(<Harness />)
    // GlobeSpinner SVG carries `.globe-spinner` class.
    expect(document.querySelector('.globe-spinner')).not.toBeNull()
    // Loading… default value used by the primitive (translation key `engagements.loadMore.loading`).
    const loadingText = document.body.textContent ?? ''
    expect(loadingText.includes('Loading')).toBe(true)
  })

  it('uses Arabic title (name_ar) when i18n.language is ar', () => {
    i18nLanguageRef.current = 'ar'
    render(<Harness />)
    expect(screen.getByText('قمة جنيف')).toBeTruthy()
  })

  it('the engagements list page renders the same empty state under the same conditions as before, and its test file gains mock coverage for the now-static import while every assertion it already made remains intact', () => {
    mockReturn.data = { pages: [{ data: [], pagination: {} }], pageParams: [1] }
    mockReturn.hasNextPage = false

    render(<Harness />)

    expect(screen.getByTestId('engagement-list-empty-state')).toBeTruthy()
    expect(emptyStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'engagement',
        filtered: false,
      }),
    )
  })
})
