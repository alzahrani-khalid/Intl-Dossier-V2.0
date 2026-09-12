/**
 * getDossierFirstSearch — envelope-adapter pins (DEAD-01, 95-01).
 *
 * `/search` answers `{data, count, limit, offset, query, took_ms, warnings, metadata}` — there is
 * no `dossiers` key — while the page's hook reads `data.dossiers.forEach(...)`. The fix is the
 * CONTRACT at this seam, and these tests are what hold it there:
 *
 *  - the real probed envelope maps to the real client contract;
 *  - a malformed envelope THROWS. It never becomes `{dossiers: []}` — an empty result set rendered
 *    over a body the client could not read is the confident lie this milestone kills, and the
 *    forbidden `?.forEach` / `|| []` fix shape cannot pass the malformed case below;
 *  - `related_work` is ASKED FOR. The two-request test is the ban on fabricating `related_work: []`
 *    for a question the server was never asked (D-03) — it fails if the second request disappears.
 *
 * The repository is real; only `@/lib/api-client` underneath it is mocked, per-URL, so the request
 * translation (page/pageSize → limit/offset) is asserted on the URL the repository actually built.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

import { apiGet } from '@/lib/api-client'
import { adaptSearchEnvelope, getDossierFirstSearch } from '../dossiers.repository'
import type { DossierSearchFilters } from '@/types/dossier-search.types'

/** Verbatim from the 2026-08-16 staging probe of `GET /functions/v1/search?q=UN`. */
const PROBED_ROW = {
  id: 'b0000001-0000-0000-0000-000000000002',
  type: 'organization',
  name_en: 'UN ESCWA',
  name_ar: 'الإسكوا',
  description_en: null,
  description_ar: null,
  status: 'active',
  sensitivity_level: 2,
  tags: ['handoff-demo'],
  created_at: '2026-04-30T09:37:38.857793+00:00',
  updated_at: '2026-06-12T08:30:37.103391+00:00',
  rank: 90,
  snippet: 'UN ESCWA',
}

const searchBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  data: [PROBED_ROW, { ...PROBED_ROW, id: 'b0000008-0000-0000-0000-000000000001', rank: 80 }],
  count: 2,
  limit: 20,
  offset: 0,
  query: { original: 'UN', normalized: 'UN', terms: ['UN'], tsquery: 'UN' },
  took_ms: 123,
  warnings: [],
  metadata: { has_more: false, next_offset: null },
  ...overrides,
})

/** Shape of the deployed `quickswitcher-search` 200 (fn source :78-90, response ~:470). */
const quickswitcherBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  dossiers: [],
  related_work: [
    {
      id: 'task-1',
      type: 'task',
      title_en: 'UN follow-up',
      title_ar: 'متابعة الأمم المتحدة',
      status: 'pending',
      priority: 'high',
      relevance_score: 0.82,
      matched_field: 'title_en',
      updated_at: '2026-06-12T08:30:37.103391+00:00',
    },
  ],
  query: { text: 'UN', normalized: 'un', language_detected: 'en' },
  took_ms: 45,
  cache_hit: false,
  ...overrides,
})

const DEFAULT_FILTERS: DossierSearchFilters = {
  types: 'all',
  status: 'all',
  myDossiersOnly: false,
  query: 'UN',
}

/** Routes each mocked request by URL, and records every URL the repository asked for. */
const answersPerUrl = (search: unknown, quickswitcher: unknown): string[] => {
  const calls: string[] = []
  vi.mocked(apiGet).mockImplementation((async (path: string) => {
    calls.push(path)
    if (path.includes('/quickswitcher-search')) return quickswitcher
    if (path.includes('/search?')) return search
    throw new Error(`unexpected request: ${path}`)
  }) as unknown as typeof apiGet)
  return calls
}

const MALFORMED = /malformed search envelope/

beforeEach(() => {
  vi.mocked(apiGet).mockReset()
})

describe('adaptSearchEnvelope', () => {
  it('maps the real probed envelope to the client contract', () => {
    const result = adaptSearchEnvelope(searchBody(), quickswitcherBody(), 20)

    expect(result.dossiers).toHaveLength(2)
    expect(result.dossiers_total).toBe(2)
    expect(result.has_more_dossiers).toBe(false)
    expect(result.dossiers[0]).toMatchObject({
      id: PROBED_ROW.id,
      type: 'organization',
      name_en: 'UN ESCWA',
      sensitivity_level: 2,
      relevance_score: 90, // the server's own `rank`, renamed — not invented
      updated_at: PROBED_ROW.updated_at,
    })
    // NOT INVENTED: `search` returns no per-dossier stats, so the adapter claims none.
    expect(result.dossiers[0].stats).toBeUndefined()

    expect(result.related_work).toHaveLength(1)
    expect(result.related_work_total).toBe(1)
    expect(result.related_work[0]).toMatchObject({
      id: 'task-1',
      type: 'task',
      matched_fields: ['title_en'], // the server's singular `matched_field`, widened not invented
    })
    expect(result.query).toEqual({ text: 'UN', normalized: 'UN', language_detected: 'en' })
    expect(result.took_ms).toBe(123)
    expect(result.page).toBe(1)
    expect(result.page_size).toBe(20)
  })

  it('carries metadata.has_more through to has_more_dossiers', () => {
    const result = adaptSearchEnvelope(
      searchBody({ count: 90, metadata: { has_more: true, next_offset: 20 } }),
      quickswitcherBody(),
      20,
    )

    expect(result.has_more_dossiers).toBe(true)
    expect(result.dossiers_total).toBe(90)
  })

  it('THROWS on a malformed envelope — never coerces to an empty result set', () => {
    // The old client contract, i.e. the body the page WISHED for: no `data` array.
    expect(() => adaptSearchEnvelope({ dossiers: [] }, quickswitcherBody(), 20)).toThrow(MALFORMED)
    expect(() => adaptSearchEnvelope({ data: 'not-an-array' }, quickswitcherBody(), 20)).toThrow(
      MALFORMED,
    )
    expect(() => adaptSearchEnvelope(undefined, quickswitcherBody(), 20)).toThrow(MALFORMED)
    // A count that is not a number would render as a blank/NaN total — also a malformed body.
    expect(() => adaptSearchEnvelope(searchBody({ count: null }), quickswitcherBody(), 20)).toThrow(
      MALFORMED,
    )
  })

  it('THROWS on a malformed related-work body rather than reporting "no related work"', () => {
    expect(() => adaptSearchEnvelope(searchBody(), { related_work: 'nope' }, 20)).toThrow(
      /malformed quickswitcher envelope/,
    )
  })
})

describe('getDossierFirstSearch', () => {
  it('translates page/pageSize into the limit/offset the server actually reads', async () => {
    const calls = answersPerUrl(searchBody(), quickswitcherBody())

    await getDossierFirstSearch('UN', DEFAULT_FILTERS, 3, 20)

    const searchUrl = calls.find((c) => c.includes('/search?')) ?? ''
    expect(searchUrl).toContain('q=UN')
    expect(searchUrl).toContain('limit=20')
    expect(searchUrl).toContain('offset=40')
    // The server ignores these three; sending them is noise, and `types` on default filters would
    // hit the fn's stale `validTypes` list and 400.
    expect(searchUrl).not.toContain('page=')
    expect(searchUrl).not.toContain('page_size=')
    expect(searchUrl).not.toContain('types=')
  })

  it('issues BOTH requests — related work is asked for, never fabricated', async () => {
    const calls = answersPerUrl(searchBody(), quickswitcherBody())

    const result = await getDossierFirstSearch('UN', DEFAULT_FILTERS, 1, 20)

    expect(calls).toHaveLength(2)
    expect(calls.filter((c) => c.includes('/search?'))).toHaveLength(1)
    expect(calls.filter((c) => c.includes('/quickswitcher-search'))).toHaveLength(1)
    expect(result.related_work).toHaveLength(1)
  })

  it('rejects when either request rejects — the page then renders its error state', async () => {
    vi.mocked(apiGet).mockImplementation((async (path: string) => {
      if (path.includes('/quickswitcher-search')) throw new Error('API error 500')
      return searchBody()
    }) as unknown as typeof apiGet)

    await expect(getDossierFirstSearch('UN', DEFAULT_FILTERS, 1, 20)).rejects.toThrow(/500/)
  })
})
