import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

// Echo translation keys, honouring defaultValue so the empty-state copy resolves
// to its English fallback without loading i18n resources. language: 'en' → LTR.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      key === 'empty.engagements.title' ? 'No engagements yet' : (opts?.defaultValue ?? key),
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

vi.mock('@/services/dossier-overview.service', () => ({
  fetchDossierOverview: vi.fn(),
}))

import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { DossierEngagementsTab } from '../DossierEngagementsTab'

const mockedFetch = vi.mocked(fetchDossierOverview)

// Cast a controlled partial through unknown so we only supply the sections the
// component reads, not every field of DossierOverviewResponse.
function makeResponse(partial: Record<string, unknown>): DossierOverviewResponse {
  return partial as unknown as DossierOverviewResponse
}

function renderWithClient(ui: ReactElement): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('DossierEngagementsTab', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
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
})
