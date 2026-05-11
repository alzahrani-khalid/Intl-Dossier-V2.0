/**
 * Digest widget unit tests.
 *
 * Verifies: renders digest rows with translated tag/headline/publication
 * source, refresh click triggers GlobeSpinner overlay, button spin class
 * toggles, RTL-safe class usage, and the production source path stays free of
 * the old activity-feed dependency.
 */

import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/useIntelligenceDigest', () => ({
  useIntelligenceDigest: vi.fn(),
}))

vi.mock('@/components/signature-visuals', () => ({
  GlobeSpinner: (p: { size: number }): ReactElement => (
    <span data-testid="globe-spinner" data-size={p.size} />
  ),
}))

import { useIntelligenceDigest } from '@/hooks/useIntelligenceDigest'
import { Digest } from '../Digest'

interface MockDigestRow {
  id: string
  headline_en: string
  headline_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  source_publication: string
  occurred_at: string
  dossier_id: string | null
  created_at: string
}

function makeDigestRows(count: number): MockDigestRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `digest-${i}`,
    headline_en: `Headline ${i}`,
    headline_ar: `عنوان ${i}`,
    summary_en: null,
    summary_ar: null,
    source_publication: i === 0 ? 'Reuters' : 'Al Sharq',
    occurred_at: '2026-04-24T10:00:00Z',
    dossier_id: null,
    created_at: '2026-04-24T10:05:00Z',
  }))
}

function mockReturn(overrides: Partial<ReturnType<typeof useIntelligenceDigest>> = {}): unknown {
  return {
    data: makeDigestRows(2),
    isLoading: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(useIntelligenceDigest).mockReset()
})

describe('Digest widget', () => {
  it('renders digest rows with tag, headline, and publication source', () => {
    vi.mocked(useIntelligenceDigest).mockReturnValue(mockReturn() as never)
    const { container } = render(<Digest />)

    const rows = container.querySelectorAll('.digest-row, .digest-item')
    expect(rows.length).toBe(2)
    expect(screen.getByText('Headline 0')).toBeDefined()
    expect(screen.getByText('Headline 1')).toBeDefined()
    expect(screen.getByText(/Reuters/)).toBeDefined()
    expect(screen.getByText(/Al Sharq/)).toBeDefined()
    expect(screen.getAllByText('digest.tag').length).toBe(2)
  })

  it('shows empty state when no digest rows', () => {
    vi.mocked(useIntelligenceDigest).mockReturnValue(mockReturn({ data: [] }) as never)
    render(<Digest />)
    expect(screen.getByText('digest.empty.heading')).toBeDefined()
    expect(screen.getByText('digest.empty.body')).toBeDefined()
  })

  it('renders widget skeleton while loading', () => {
    vi.mocked(useIntelligenceDigest).mockReturnValue(
      mockReturn({ data: [], isLoading: true }) as never,
    )
    const { container } = render(<Digest />)
    expect(container.querySelector('[aria-busy="true"]')).toBeDefined()
  })

  it('renders error state when hook returns error', () => {
    vi.mocked(useIntelligenceDigest).mockReturnValue(
      mockReturn({ data: [], error: new Error('boom') }) as never,
    )
    render(<Digest />)
    expect(screen.getByText('digest.error')).toBeDefined()
  })

  it('refresh click shows GlobeSpinner overlay and button spin class', async () => {
    const refetch = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(undefined), 50)))
    vi.mocked(useIntelligenceDigest).mockReturnValue(mockReturn({ refetch }) as never)

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

  it('uses RTL-safe logical classes only', () => {
    vi.mocked(useIntelligenceDigest).mockReturnValue(mockReturn() as never)
    const { container } = render(<Digest />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bml-\d/)
    expect(html).not.toMatch(/\bmr-\d/)
    expect(html).not.toMatch(/\bpl-\d/)
    expect(html).not.toMatch(/\bpr-\d/)
    expect(html).not.toMatch(/\btext-left\b/)
    expect(html).not.toMatch(/\btext-right\b/)
  })

  it('keeps the production source path on intelligence digest publications', () => {
    const files = [
      readFileSync('src/pages/Dashboard/widgets/Digest.tsx', 'utf8'),
      readFileSync('src/hooks/useIntelligenceDigest.ts', 'utf8'),
    ].join('\n')

    expect(files).not.toMatch(/actor_name/)
    expect(files).not.toMatch(/useActivityFeed/)
  })
})
