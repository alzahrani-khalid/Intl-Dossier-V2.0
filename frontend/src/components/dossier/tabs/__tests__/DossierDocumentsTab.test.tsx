import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/services/dossier-overview.service', () => ({
  fetchDossierOverview: vi.fn(),
}))

import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { DossierDocumentsTab } from '../DossierDocumentsTab'

const mockedFetch = vi.mocked(fetchDossierOverview)

function makeResponse(partial: Record<string, unknown>): DossierOverviewResponse {
  return partial as unknown as DossierOverviewResponse
}

function renderWithClient(ui: ReactElement): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('DossierDocumentsTab', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('renders a document title without throwing', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        documents: {
          total_count: 1,
          positions: [
            {
              id: 'p1',
              title_en: 'Climate Position',
              title_ar: null,
              document_type: 'position',
              file_name: null,
              file_path: null,
              mime_type: null,
              size_bytes: null,
              status: 'active',
              classification: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              created_by_name: null,
            },
          ],
          mous: [],
          briefs: [],
          attachments: [],
        },
      }),
    )

    renderWithClient(<DossierDocumentsTab dossierId="d1" dossierType="topic" />)

    expect(await screen.findByText('Climate Position')).toBeTruthy()
    // R14-01: topic is non-country/org so the MoU tab is hidden, and Briefs is
    // hidden for every type after the round-11 briefs-removal.
    expect(screen.queryByText(/MOUs \(/)).toBeNull()
    expect(screen.queryByText(/Briefs \(/)).toBeNull()
  })
})
