/**
 * OverviewCardErrorStates — forced-error contract suite (OVRERR-01, this plan half).
 *
 * Covers the 8 shared/country/organization overview cards owned by plan 66-04:
 *   - 6 useDossierOverview consumers (data === null when no cached data)
 *   - SharedRecentActivityCard (useDossierActivityTimeline — activities=[] when none)
 *   - MoUStatusCard (inline useQuery — queryFn rejects)
 *
 * Contract (UI-SPEC §1, binding):
 *   state precedence: skeleton → ERROR (before empty) → empty → data
 *   error line: <p role="alert"> with the localized sectionError copy, no empty copy
 *   stale-while-error: cached data + isError → render data, NO error line
 *   empty ≠ error: empty data + no error → unchanged empty copy, NO alert
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

// --- Shared i18n echo: resolve keys to their English defaultValue --------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; count?: number }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}))

// --- useDossierOverview mock: mutable hoisted state read on every render --------
const overviewState = vi.hoisted(() => ({
  data: null as unknown,
  isLoading: false,
  isError: false,
}))
vi.mock('@/hooks/useDossierOverview', () => ({
  useDossierOverview: () => ({
    data: overviewState.data,
    isLoading: overviewState.isLoading,
    isError: overviewState.isError,
    error: null,
    refetch: vi.fn(),
  }),
}))

// --- usePersons mock (KeyRepresentativesCard reads org-affiliated persons) ------
const repsState = vi.hoisted(() => ({
  data: null as unknown,
  isLoading: false,
  isError: false,
}))
vi.mock('@/domains/persons/hooks/usePersons', () => ({
  usePersons: () => ({
    data: repsState.data,
    isLoading: repsState.isLoading,
    isError: repsState.isError,
  }),
}))

// --- useDossierActivityTimeline mock (SharedRecentActivityCard) -----------------
const timelineState = vi.hoisted(() => ({
  activities: [] as unknown[],
  isLoading: false,
  isError: false,
}))
vi.mock('@/hooks/useDossierActivityTimeline', () => ({
  useDossierActivityTimeline: () => ({
    activities: timelineState.activities,
    isLoading: timelineState.isLoading,
    isError: timelineState.isError,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    totalCount: timelineState.activities.length,
  }),
}))

// --- supabase mock (MoUStatusCard inline useQuery) -----------------------------
// The card's queryFn calls supabase.from(...).select(...).or(...).is(...) then
// `if (error) throw error`. The mock returns a chainable builder whose terminal
// awaited value carries { data: null, error } so the queryFn rejects.
const mouState = vi.hoisted(() => ({ shouldError: false }))
vi.mock('@/lib/supabase', () => {
  const makeBuilder = (): Record<string, unknown> => {
    const result = mouState.shouldError
      ? { data: null, error: { message: 'forced mou failure' } }
      : { data: [], error: null }
    const builder: Record<string, unknown> = {
      select: () => builder,
      or: () => builder,
      is: () => Promise.resolve(result),
    }
    return builder
  }
  return {
    supabase: {
      from: () => makeBuilder(),
    },
  }
})

import { SharedSummaryStatsCard } from '../SharedSummaryStatsCard'
import { BilateralSummaryCard } from '../BilateralSummaryCard'
import { KeyContactsCard } from '../KeyContactsCard'
import { EngagementsByStageCard } from '../EngagementsByStageCard'
import { KeyRepresentativesCard } from '../KeyRepresentativesCard'
import { MembershipStructureCard } from '../MembershipStructureCard'
import { MoUStatusCard } from '../MoUStatusCard'

const SECTION_ERROR = /failed to load this section/i

// Minimal nonzero overview fixture — only `stats` is read on the SummaryStats
// render path under test; the rest of the response is irrelevant to that branch.
const nonzeroStatsResponse = {
  stats: {
    related_dossiers_count: 3,
    documents_count: 0,
    work_items_count: 0,
    pending_work_items: 2,
    overdue_work_items: 0,
    calendar_events_count: 0,
    upcoming_events_count: 1,
    key_contacts_count: 0,
    recent_activities_count: 4,
    last_activity_date: null,
  },
} as unknown as DossierOverviewResponse

const allZeroStatsResponse = {
  stats: {
    related_dossiers_count: 0,
    documents_count: 0,
    work_items_count: 0,
    pending_work_items: 0,
    overdue_work_items: 0,
    calendar_events_count: 0,
    upcoming_events_count: 0,
    key_contacts_count: 0,
    recent_activities_count: 0,
    last_activity_date: null,
  },
} as unknown as DossierOverviewResponse

beforeEach(() => {
  overviewState.data = null
  overviewState.isLoading = false
  overviewState.isError = false
  timelineState.activities = []
  timelineState.isLoading = false
  timelineState.isError = false
  mouState.shouldError = false
  repsState.data = null
  repsState.isLoading = false
  repsState.isError = false
})

// --- Parameterized forced-error suite for the 6 useDossierOverview cards --------
const overviewCards: ReadonlyArray<{
  name: string
  Component: (props: { dossierId: string }) => React.ReactElement
  emptyCopy: RegExp
}> = [
  {
    name: 'SharedSummaryStatsCard',
    Component: SharedSummaryStatsCard,
    emptyCopy: /no data available/i,
  },
  {
    name: 'BilateralSummaryCard',
    Component: BilateralSummaryCard,
    emptyCopy: /no bilateral data available/i,
  },
  { name: 'KeyContactsCard', Component: KeyContactsCard, emptyCopy: /no contacts linked/i },
  {
    name: 'EngagementsByStageCard',
    Component: EngagementsByStageCard,
    emptyCopy: /no engagements linked/i,
  },
  {
    name: 'MembershipStructureCard',
    Component: MembershipStructureCard,
    emptyCopy: /no membership data available/i,
  },
]

describe('Overview card forced-error states (OVRERR-01)', () => {
  it.each(overviewCards)(
    '$name renders error state, not empty state, on section failure (OVRERR-01)',
    ({ Component, emptyCopy }) => {
      overviewState.isError = true
      overviewState.data = null

      render(<Component dossierId="d1" />)

      expect(screen.getByRole('alert').textContent).toMatch(SECTION_ERROR)
      expect(screen.queryByText(emptyCopy)).toBeNull()
    },
  )

  it('SharedSummaryStatsCard renders cached data, no error line, on background refetch failure (stale-while-error)', () => {
    overviewState.isError = true
    overviewState.data = nonzeroStatsResponse

    render(<SharedSummaryStatsCard dossierId="d1" />)

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(/linked dossiers/i)).toBeTruthy()
  })

  it('SharedSummaryStatsCard renders the empty line, not an alert, on genuinely all-zero stats (empty ≠ error)', () => {
    overviewState.isError = false
    overviewState.data = allZeroStatsResponse

    render(<SharedSummaryStatsCard dossierId="d1" />)

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(/no data available/i)).toBeTruthy()
  })
})

describe('KeyRepresentativesCard forced-error state (OVRERR-01)', () => {
  it('renders error state, not the empty copy, on persons-query failure', () => {
    repsState.isError = true
    repsState.data = null

    render(<KeyRepresentativesCard dossierId="d1" />)

    expect(screen.getByRole('alert').textContent).toMatch(SECTION_ERROR)
    expect(screen.queryByText(/no representatives linked/i)).toBeNull()
  })
})

describe('SharedRecentActivityCard forced-error state (OVRERR-01)', () => {
  it('renders error state, not the no-recent-activity empty copy, on section failure', () => {
    timelineState.isError = true
    timelineState.activities = []

    // Imported lazily to keep its activity-timeline barrel mock co-located.
    return import('../SharedRecentActivityCard').then(({ SharedRecentActivityCard }) => {
      render(<SharedRecentActivityCard dossierId="d1" />)
      expect(screen.getByRole('alert').textContent).toMatch(SECTION_ERROR)
      expect(screen.queryByText(/no recent activity/i)).toBeNull()
    })
  })
})

describe('MoUStatusCard forced-error state (OVRERR-01)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('renders error state, not the empty MoU copy, when its query rejects', async () => {
    mouState.shouldError = true

    render(
      <QueryClientProvider client={queryClient}>
        <MoUStatusCard dossierId="d1" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(SECTION_ERROR)
    })
    expect(screen.queryByText(/no mous recorded/i)).toBeNull()
  })
})
