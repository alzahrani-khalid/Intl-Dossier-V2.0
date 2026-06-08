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

// WorkItemsSection now drills into detail views via the router + commitment
// drawer; this tab test renders without a RouterProvider, so stub both (mirrors
// OpenCommitmentsSection.test.tsx).
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useCommitmentDrawer', () => ({
  useCommitmentDrawer: () => ({
    open: false,
    commitmentId: null,
    openCommitment: vi.fn(),
    closeCommitment: vi.fn(),
  }),
}))

import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { DossierWorkItemsTab } from '../DossierWorkItemsTab'

const mockedFetch = vi.mocked(fetchDossierOverview)

function makeResponse(partial: Record<string, unknown>): DossierOverviewResponse {
  return partial as unknown as DossierOverviewResponse
}

function renderWithClient(ui: ReactElement): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('DossierWorkItemsTab', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('renders a work item title without throwing', async () => {
    mockedFetch.mockResolvedValue(
      makeResponse({
        work_items: {
          total_count: 1,
          status_breakdown: {
            pending: 1,
            in_progress: 0,
            review: 0,
            completed: 0,
            cancelled: 0,
            overdue: 0,
          },
          by_source: {
            tasks: [
              {
                id: 't1',
                source: 'task',
                title_en: 'Draft talking points',
                title_ar: null,
                description_en: null,
                description_ar: null,
                status: 'pending',
                priority: 'medium',
                deadline: null,
                assignee_id: null,
                assignee_name: null,
                inheritance_source: 'direct',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
              },
            ],
            commitments: [],
            intakes: [],
          },
          urgent_items: [],
          overdue_items: [],
        },
      }),
    )

    renderWithClient(<DossierWorkItemsTab dossierId="d1" />)

    expect(await screen.findByText('Draft talking points')).toBeTruthy()
  })
})
