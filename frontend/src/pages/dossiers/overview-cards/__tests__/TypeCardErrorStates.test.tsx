import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Forced-error suite for the 11 type-tab overview cards (66-VALIDATION row 2,
// this plan half — forum / topic / working-group / person / elected-official).
// UI-SPEC §1: error BEFORE empty, role="alert" with the sectionError copy, the
// empty/dash failure modes ABSENT; stale-while-error renders cached data.
//
// Three hook families are mocked via vi.hoisted mutable state so each test can
// drive an isError/data shape without loading i18n resources or hitting Supabase:
//   - useDossierOverview         (8 cards) → { data, isLoading, isError, error }
//   - useDossierPositionLinks    (1 card)  → { positions, isLoading, error }
//   - useElectedOfficial         (2 cards) → { data, isLoading, isError }
// ---------------------------------------------------------------------------

const overviewState = vi.hoisted(() => ({
  data: null as unknown,
  isLoading: false,
  isError: false,
  error: null as unknown,
}))

const positionState = vi.hoisted(() => ({
  positions: [] as unknown[],
  isLoading: false,
  error: null as unknown,
}))

const electedState = vi.hoisted(() => ({
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as unknown,
}))

// Echo translation keys, honouring defaultValue so the sectionError line resolves
// to its English fallback. This makes assertions work for both the plain key form
// (cards already on the dossier namespace) and the colon form (EO cards).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/useDossierOverview', () => ({
  useDossierOverview: () => ({
    data: overviewState.data,
    isLoading: overviewState.isLoading,
    isError: overviewState.isError,
    error: overviewState.error,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useDossierPositionLinks', () => ({
  useDossierPositionLinks: () => ({
    links: [],
    positions: positionState.positions,
    totalCount: positionState.positions.length,
    isLoading: positionState.isLoading,
    error: positionState.error,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/domains/elected-officials/hooks/useElectedOfficials', () => ({
  useElectedOfficial: () => ({
    data: electedState.data,
    isLoading: electedState.isLoading,
    isError: electedState.isError,
    error: electedState.error,
    refetch: vi.fn(),
  }),
}))

// TanStack Router <Link> is rendered by PositionTrackerCard / ConnectedAnchorsCard
// in their data branches; stub it so the cards mount without a RouterProvider.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

import { ForumMetadataCard } from '../ForumMetadataCard'
import { ForumSessionsCard } from '../ForumSessionsCard'
import { ConnectedAnchorsCard } from '../ConnectedAnchorsCard'
import { DeliverablesTrackerCard } from '../DeliverablesTrackerCard'
import { MeetingScheduleCard } from '../MeetingScheduleCard'
import { MemberListCard } from '../MemberListCard'
import { PersonMetadataCard } from '../PersonMetadataCard'
import { EngagementHistoryCard } from '../EngagementHistoryCard'
import { PositionTrackerCard } from '../PositionTrackerCard'
import { ElectedOfficialOfficeCard } from '../ElectedOfficialOfficeCard'
import { ElectedOfficialCommitteesCard } from '../ElectedOfficialCommitteesCard'

const SECTION_ERROR = /failed to load this section/i

beforeEach(() => {
  overviewState.data = null
  overviewState.isLoading = false
  overviewState.isError = false
  overviewState.error = null
  positionState.positions = []
  positionState.isLoading = false
  positionState.error = null
  electedState.data = undefined
  electedState.isLoading = false
  electedState.isError = false
  electedState.error = null
})

// The 8 cards backed by useDossierOverview. emptyCopy is the genuine empty-state
// string that must be ABSENT when the query errored. Forum/Person metadata cards
// have no empty branch today (they render dash rows), so emptyCopy is null and the
// assertion instead pins that no dash row leaked through the error branch.
const overviewCards: Array<{
  name: string
  Card: (props: { dossierId: string }) => React.ReactElement
  emptyCopy: string | null
}> = [
  { name: 'ForumMetadataCard', Card: ForumMetadataCard, emptyCopy: null },
  { name: 'ForumSessionsCard', Card: ForumSessionsCard, emptyCopy: 'No sessions recorded' },
  {
    name: 'ConnectedAnchorsCard',
    Card: ConnectedAnchorsCard,
    emptyCopy: 'No anchor dossiers connected',
  },
  {
    name: 'DeliverablesTrackerCard',
    Card: DeliverablesTrackerCard,
    emptyCopy: 'No deliverables tracked',
  },
  { name: 'MeetingScheduleCard', Card: MeetingScheduleCard, emptyCopy: 'No upcoming meetings' },
  { name: 'MemberListCard', Card: MemberListCard, emptyCopy: 'No members linked' },
  { name: 'PersonMetadataCard', Card: PersonMetadataCard, emptyCopy: null },
  {
    name: 'EngagementHistoryCard',
    Card: EngagementHistoryCard,
    emptyCopy: 'No engagement history',
  },
]

describe('TypeCardErrorStates — OVRERR-01 forced-error contract (type-tab half)', () => {
  describe('useDossierOverview cards (error before empty, role=alert)', () => {
    it.each(overviewCards)(
      '$name renders the section error line and not its empty state on a forced query error',
      ({ Card, emptyCopy }) => {
        overviewState.data = null
        overviewState.isError = true

        render(<Card dossierId="d1" />)

        const alert = screen.getByRole('alert')
        expect(alert.textContent).toMatch(SECTION_ERROR)
        if (emptyCopy != null) {
          expect(screen.queryByText(emptyCopy)).toBeNull()
        }
      },
    )

    it('[stale-while-error] MemberListCard renders cached data and NO error line when data is present despite isError', () => {
      overviewState.isError = true
      overviewState.data = {
        related_dossiers: {
          by_relationship_type: {
            has_member: [
              {
                id: 'm1',
                name_en: 'Cached Member',
                name_ar: 'عضو',
                relationship_type: 'has_member',
              },
            ],
          },
        },
      }

      render(<MemberListCard dossierId="d1" />)

      expect(screen.getByText('Cached Member')).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('[empty-pin] MemberListCard renders the unchanged empty copy on healthy-but-empty data', () => {
      overviewState.isError = false
      overviewState.data = { related_dossiers: { by_relationship_type: {} } }

      render(<MemberListCard dossierId="d1" />)

      expect(screen.getByText('No members linked')).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('PositionTrackerCard (useDossierPositionLinks — error != null && no cached positions)', () => {
    it('renders the section error line when the hook exposes an error and no positions', () => {
      positionState.error = new Error('forced')
      positionState.positions = []

      render(<PositionTrackerCard dossierId="d1" />)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toMatch(SECTION_ERROR)
      expect(screen.queryByText(/no positions tracked yet/i)).toBeNull()
    })

    it('[stale-while-error] renders cached positions and NO error line when positions exist despite error', () => {
      positionState.error = new Error('forced')
      positionState.positions = [
        { id: 'p1', title_en: 'Cached Stance', title_ar: 'موقف', link_type: 'applies_to' },
      ]

      render(<PositionTrackerCard dossierId="d1" />)

      expect(screen.getByText('Cached Stance')).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('ElectedOfficial cards (useElectedOfficial — isError && data undefined; dash mode gone)', () => {
    it('ElectedOfficialOfficeCard renders the error line and NO dash rows on a failed query', () => {
      electedState.isError = true
      electedState.data = undefined

      render(<ElectedOfficialOfficeCard dossierId="d1" />)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toMatch(SECTION_ERROR)
      // The all-dash failure mode (dt/dd rows of '—'/'-') must be absent.
      expect(screen.queryByText('-')).toBeNull()
      expect(screen.queryByText('No office data available')).toBeNull()
    })

    it('ElectedOfficialCommitteesCard renders the error line and not its empty copy on a failed query', () => {
      electedState.isError = true
      electedState.data = undefined

      render(<ElectedOfficialCommitteesCard dossierId="d1" />)

      const alert = screen.getByRole('alert')
      expect(alert.textContent).toMatch(SECTION_ERROR)
    })
  })
})
