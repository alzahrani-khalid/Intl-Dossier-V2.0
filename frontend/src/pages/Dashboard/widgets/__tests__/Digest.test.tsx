/**
 * Phase 38 plan 04 — Digest widget unit tests.
 *
 * Data source: `useActivityFeed` (Option A per human checkpoint 2026-04-25).
 * Field mapping (Rule-3 semantic compromise — see 38-04-SUMMARY.md):
 *   tag       ← entity_type (uppercased)
 *   headline  ← description_en | description_ar (by i18n language)
 *   source    ← actor_name  (actor, not publication — compromise)
 *   timestamp ← created_at
 *
 * Verifies: renders feed rows with tag/headline/source, refresh click triggers
 * GlobeSpinner overlay, button spin class toggles, RTL-safe class usage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'

vi.mock('@/hooks/useActivityFeed', () => ({
  useActivityFeed: vi.fn(),
}))

vi.mock('@/components/signature-visuals', () => ({
  GlobeSpinner: (p: { size: number }): ReactElement => (
    <span data-testid="globe-spinner" data-size={p.size} />
  ),
}))

import { useActivityFeed } from '@/hooks/useActivityFeed'
import { Digest } from '../Digest'

interface MockActivity {
  id: string
  action_type: string
  entity_type: string
  entity_id: string
  entity_name_en: string
  actor_id: string
  actor_name: string
  description_en: string
  description_ar?: string
  is_public: boolean
  visibility_scope: string
  created_at: string
}

function makeActivities(count: number): MockActivity[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `a-${i}`,
    action_type: 'create',
    entity_type: i % 2 === 0 ? 'engagement' : 'position',
    entity_id: `ent-${i}`,
    entity_name_en: `Entity ${i}`,
    actor_id: `u-${i}`,
    actor_name: i === 0 ? 'Reuters' : 'Al Sharq',
    description_en: `Headline ${i}`,
    description_ar: `عنوان ${i}`,
    is_public: true,
    visibility_scope: 'all',
    created_at: '2026-04-24T10:00:00Z',
  }))
}

function mockReturn(overrides: Partial<ReturnType<typeof useActivityFeed>> = {}): unknown {
  return {
    activities: makeActivities(2),
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    error: null,
    fetchNextPage: vi.fn(),
    refetch: vi.fn().mockResolvedValue(undefined),
    filters: {},
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(useActivityFeed).mockReset()
})

describe('Digest widget', () => {
  it('renders digest rows with tag, headline, and source', () => {
    vi.mocked(useActivityFeed).mockReturnValue(mockReturn() as never)
    const { container } = render(<Digest />)

    const rows = container.querySelectorAll('.digest-row, .digest-item')
    expect(rows.length).toBe(2)
    expect(screen.getByText('Headline 0')).toBeDefined()
    expect(screen.getByText('Headline 1')).toBeDefined()
    // source = actor_name
    expect(screen.getByText(/Reuters/)).toBeDefined()
    expect(screen.getByText(/Al Sharq/)).toBeDefined()
    // tag = entity_type uppercased
    expect(screen.getAllByText('ENGAGEMENT').length).toBeGreaterThan(0)
    expect(screen.getAllByText('POSITION').length).toBeGreaterThan(0)
  })

  it('shows empty state when no activities', () => {
    vi.mocked(useActivityFeed).mockReturnValue(mockReturn({ activities: [] }) as never)
    render(<Digest />)
    // digest.empty key: "No digest items"
    expect(screen.getByText('No digest items')).toBeDefined()
  })

  it('renders widget skeleton while loading', () => {
    vi.mocked(useActivityFeed).mockReturnValue(
      mockReturn({ activities: [], isLoading: true }) as never,
    )
    const { container } = render(<Digest />)
    expect(container.querySelector('[aria-busy="true"]')).toBeDefined()
  })

  it('renders error state when hook returns error', () => {
    vi.mocked(useActivityFeed).mockReturnValue(
      mockReturn({ activities: [], error: new Error('boom') }) as never,
    )
    render(<Digest />)
    expect(screen.getByText("Couldn't load widget")).toBeDefined()
  })

  it('refresh click shows GlobeSpinner overlay and button spin class', async () => {
    const refetch = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50)),
    )
    vi.mocked(useActivityFeed).mockReturnValue(mockReturn({ refetch }) as never)

    render(<Digest />)
    const refreshBtn = screen.getByRole('button', { name: /refresh/i })

    // Before click — no overlay, no spin
    expect(screen.queryByTestId('globe-spinner')).toBeNull()
    expect(refreshBtn.querySelector('.animate-spin')).toBeNull()

    fireEvent.click(refreshBtn)

    // Overlay appears + button spins
    await waitFor(() => {
      expect(screen.getByTestId('globe-spinner')).toBeDefined()
    })
    expect(refreshBtn.querySelector('.animate-spin')).not.toBeNull()
    expect(refetch).toHaveBeenCalledOnce()

    // Overlay resolves
    await waitFor(
      () => {
        expect(screen.queryByTestId('globe-spinner')).toBeNull()
      },
      { timeout: 500 },
    )
  })

  it('uses RTL-safe logical classes only (no ml-/mr-/pl-/pr-/text-left/text-right)', () => {
    vi.mocked(useActivityFeed).mockReturnValue(mockReturn() as never)
    const { container } = render(<Digest />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bml-\d/)
    expect(html).not.toMatch(/\bmr-\d/)
    expect(html).not.toMatch(/\bpl-\d/)
    expect(html).not.toMatch(/\bpr-\d/)
    expect(html).not.toMatch(/\btext-left\b/)
    expect(html).not.toMatch(/\btext-right\b/)
  })
})
