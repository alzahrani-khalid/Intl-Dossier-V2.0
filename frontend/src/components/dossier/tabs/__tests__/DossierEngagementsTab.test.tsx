import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'
import enDossierShell from '@/i18n/en/dossier-shell.json'
import arDossierShell from '@/i18n/ar/dossier-shell.json'

// Echo translation keys, honouring defaultValue so the empty-state copy resolves
// to its English fallback without loading i18n resources. The three own-namespace
// section keys (dossier-shell, dot-form) are resolved from a small literal map so
// the headings render their English copy. language: 'en' → LTR.
const ownNamespaceStrings: Record<string, string> = {
  'empty.engagements.title': 'No engagements yet',
  'sections.hostedEngagements': 'Hosted engagements',
  'sections.participation': 'Participation',
  'sections.history': 'History',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      ownNamespaceStrings[key] ?? opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}))

// Map TanStack Router Link to a plain anchor so the tab renders without a
// RouterProvider (mirrors CreateDossierHub.test.tsx).
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/services/dossier-overview.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/dossier-overview.service')>(
    '@/services/dossier-overview.service',
  )
  return {
    ...actual,
    fetchDossierOverview: vi.fn(),
  }
})

// Per-table supabase mock: from(table) returns a self-returning chainable
// (select/eq/in) whose awaited terminal resolves the per-test configured
// { data, error } for that table. tableResults is reset in beforeEach.
const { tableResults } = vi.hoisted(() => ({
  tableResults: new Map<string, { data: unknown; error: unknown }>(),
}))

vi.mock('@/lib/supabase', () => {
  const makeChain = (table: string): Record<string, unknown> => {
    const result = tableResults.get(table) ?? { data: [], error: null }
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      // Thenable terminal: awaiting the chain resolves the configured result.
      then: (resolve: (value: { data: unknown; error: unknown }) => unknown) => resolve(result),
    }
    return chain
  }
  return {
    supabase: {
      from: (table: string): Record<string, unknown> => makeChain(table),
    },
  }
})

import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { DossierEngagementsTab } from '../DossierEngagementsTab'

const mockedFetch = vi.mocked(fetchDossierOverview)

// Cast a controlled partial through unknown so we only supply the sections the
// component reads, not every field of DossierOverviewResponse.
function makeResponse(partial: Record<string, unknown>): DossierOverviewResponse {
  return partial as unknown as DossierOverviewResponse
}

function setTable(table: string, data: unknown, error: unknown = null): void {
  tableResults.set(table, { data, error })
}

function renderWithClient(ui: ReactElement): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('DossierEngagementsTab', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
    tableResults.clear()
    // Generic branch resolves empty unless a test overrides it.
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: { by_dossier_type: { engagement: [] } },
        calendar_events: { past: [] },
      }),
    )
  })

  it('lists related engagement dossiers and past calendar events', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: {
          by_dossier_type: {
            engagement: [
              {
                id: 'e1',
                name_en: 'Bilateral Summit',
                name_ar: 'قمة ثنائية',
                type: 'engagement',
                relationship_type: 'related_to',
                created_at: '2026-03-01T00:00:00Z',
              },
            ],
          },
        },
        calendar_events: {
          past: [
            {
              id: 'c1',
              title_en: 'Past Consultation',
              title_ar: 'مشاورة سابقة',
              event_type: 'meeting',
              start_datetime: '2026-02-01T00:00:00Z',
            },
          ],
        },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    expect(await screen.findByText('Bilateral Summit')).toBeTruthy()
    expect(await screen.findByText('Past Consultation')).toBeTruthy()
  })

  it('renders the empty state when both lists are absent', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: { by_dossier_type: { engagement: [] } },
        calendar_events: { past: [] },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    expect(await screen.findByText('No engagements yet')).toBeTruthy()
  })

  it('renders the hosted engagements section for an organization dossier', async () => {
    setTable('engagement_dossiers', [
      { id: 'e1', engagement_type: 'bilateral_meeting', start_date: '2026-05-01' },
    ])
    setTable('dossiers', [
      { id: 'e1', name_en: 'OECD Summit', name_ar: 'قمة', created_at: '2026-04-01T00:00:00Z' },
    ])

    renderWithClient(<DossierEngagementsTab dossierId="org1" dossierType="organization" />)

    expect(await screen.findByText('Hosted engagements')).toBeTruthy()
    expect(await screen.findByText('OECD Summit')).toBeTruthy()
    expect(await screen.findByText('bilateral_meeting')).toBeTruthy()
  })

  it('renders the participation section for a person dossier', async () => {
    setTable('engagement_participants', [{ engagement_id: 'e1', role: 'delegate' }])
    setTable('engagement_dossiers', [
      { id: 'e1', engagement_type: 'summit', start_date: '2026-05-01' },
    ])
    setTable('dossiers', [
      { id: 'e1', name_en: 'G20 Meeting', name_ar: 'اجتماع', created_at: '2026-04-01T00:00:00Z' },
    ])

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    expect(await screen.findByText('Participation')).toBeTruthy()
    expect(await screen.findByText('G20 Meeting')).toBeTruthy()
    expect(await screen.findByText('delegate')).toBeTruthy()
  })

  it('omits the participation section entirely when there are zero rows', async () => {
    setTable('engagement_participants', [])

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    // Generic empty state still renders; participation must be fully absent.
    expect(await screen.findByText('No engagements yet')).toBeTruthy()
    expect(screen.queryByText('Participation')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders an error line (not an empty state) when a per-type branch fails', async () => {
    setTable('engagement_participants', null, { message: 'forced' })

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    // Heading present, error alert present, empty-state copy ABSENT.
    expect(await screen.findByText('Participation')).toBeTruthy()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Failed to load this section')
    expect(screen.queryByText('No engagements yet')).toBeNull()
  })

  it('renders the error line instead of the empty copy when the generic branch fails', async () => {
    mockedFetch.mockRejectedValue(new Error('generic forced'))

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Failed to load this section')
    expect(screen.queryByText('No engagements yet')).toBeNull()
  })

  it('shows the History sub-heading when a per-type section AND generic entries both render', async () => {
    setTable('engagement_participants', [{ engagement_id: 'e1', role: 'speaker' }])
    setTable('engagement_dossiers', [
      { id: 'e1', engagement_type: 'summit', start_date: '2026-05-01' },
    ])
    setTable('dossiers', [
      { id: 'e1', name_en: 'G20 Meeting', name_ar: 'اجتماع', created_at: '2026-04-01T00:00:00Z' },
    ])
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: {
          by_dossier_type: {
            engagement: [
              {
                id: 'g1',
                name_en: 'Generic Engagement',
                name_ar: 'عام',
                type: 'engagement',
                relationship_type: 'related_to',
                created_at: '2026-03-01T00:00:00Z',
              },
            ],
          },
        },
        calendar_events: { past: [] },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="p1" dossierType="person" />)

    expect(await screen.findByText('Participation')).toBeTruthy()
    expect(await screen.findByText('History')).toBeTruthy()
  })

  it('omits the History sub-heading when only the generic timeline renders', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        related_dossiers: {
          by_dossier_type: {
            engagement: [
              {
                id: 'g1',
                name_en: 'Generic Engagement',
                name_ar: 'عام',
                type: 'engagement',
                relationship_type: 'related_to',
                created_at: '2026-03-01T00:00:00Z',
              },
            ],
          },
        },
        calendar_events: { past: [] },
      }),
    )

    renderWithClient(<DossierEngagementsTab dossierId="d1" />)

    expect(await screen.findByText('Generic Engagement')).toBeTruthy()
    expect(screen.queryByText('History')).toBeNull()
  })

  it('ships the three section keys in both en and ar dossier-shell.json', () => {
    const en = enDossierShell as { sections?: Record<string, string> }
    const ar = arDossierShell as { sections?: Record<string, string> }

    for (const key of ['hostedEngagements', 'participation', 'history'] as const) {
      expect(en.sections?.[key]).toBeTruthy()
      expect(ar.sections?.[key]).toBeTruthy()
    }
    expect(ar.sections?.hostedEngagements).toBe('المشاركات المستضافة')
  })
})
