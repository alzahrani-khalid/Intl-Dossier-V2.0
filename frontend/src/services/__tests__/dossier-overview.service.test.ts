/**
 * dossier-overview.service — OVRERR-01 forced-error suite (66-01, 66-VALIDATION rows 1 & 4).
 *
 * Contract under test: fail-the-query. Every section fetcher in
 * dossier-overview.service.ts must REJECT with DossierOverviewAPIError when its
 * Supabase query returns an error, instead of console.error-and-continue. These
 * tests are RED against the pre-OVRERR-01 swallow behavior and GREEN after Task 2.
 *
 * Pure service tests: fetchDossierOverview is called directly (no QueryClient,
 * no retry delays). The supabase mock is a self-returning thenable proxy keyed
 * by table name — one builder satisfies every chain shape (.eq().single(),
 * awaited .eq(), .in().limit(), .gte().lte().order(), etc.).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Per-table result map, mutated per test. Declared via vi.hoisted so it is
// initialised before the hoisted vi.mock factories run.
const tableResults = vi.hoisted(() => ({
  map: {} as Record<string, { data: unknown; error: unknown }>,
}))

// A chainable, awaitable builder: every method returns the same proxy, and
// awaiting it (or calling .single()/.maybeSingle()) resolves the configured
// { data, error } for the table this builder was created for.
const makeBuilder = vi.hoisted(() => {
  return (table: string): unknown => {
    const resolve = (): { data: unknown; error: unknown } =>
      tableResults.map[table] ?? { data: [], error: null }

    const builder: Record<string, unknown> = {
      then: (onFulfilled: (value: { data: unknown; error: unknown }) => unknown): unknown =>
        Promise.resolve(resolve()).then(onFulfilled),
      single: (): Promise<{ data: unknown; error: unknown }> => Promise.resolve(resolve()),
      maybeSingle: (): Promise<{ data: unknown; error: unknown }> => Promise.resolve(resolve()),
    }
    // Every other chain method (select, eq, in, is, gte, lte, order, limit, ...)
    // returns the builder so chains of any shape terminate at then/single.
    const proxy = new Proxy(builder, {
      get(target, prop: string): unknown {
        if (prop in target) return target[prop]
        return (): unknown => proxy
      },
    })
    return proxy
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string): unknown => makeBuilder(table),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}))

// Activity timeline is fetched via the unified-activity service (an edge call),
// not via supabase.from — mock it directly so the timeline test can force a
// rejection and the happy-path sections can resolve.
const unifiedActivityMock = vi.hoisted(() => ({ fn: vi.fn() }))
vi.mock('@/services/unified-dossier-activity.service', () => ({
  fetchUnifiedDossierActivities: (...args: unknown[]): unknown => unifiedActivityMock.fn(...args),
  UnifiedActivityAPIError: class UnifiedActivityAPIError extends Error {
    code: string
    status: number
    constructor(message: string, status: number, code: string) {
      super(message)
      this.name = 'UnifiedActivityAPIError'
      this.code = code
      this.status = status
    }
  },
}))

import { fetchDossierOverview, DossierOverviewAPIError } from '../dossier-overview.service'

// Minimal core row so fetchDossierCore succeeds when we are testing other sections.
const CORE_ROW = {
  id: 'd1',
  name_en: 'Test',
  name_ar: 'اختبار',
  type: 'country',
  status: 'active',
  description_en: null,
  description_ar: null,
  sensitivity_level: 1,
  tags: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  metadata: null,
}

const FORCED_ERROR = { message: 'forced', code: '42703' }

beforeEach(() => {
  tableResults.map = {}
  unifiedActivityMock.fn.mockReset()
  // Default: the unified-activity edge call succeeds (empty result).
  unifiedActivityMock.fn.mockResolvedValue({
    activities: [],
    next_cursor: null,
    has_more: false,
    total_estimate: 0,
    filters_applied: { activity_types: null, date_from: null, date_to: null },
  })
})

describe('OVRERR-01 — fail-the-query across overview section fetchers', () => {
  it('fetchRelatedDossiers rejects on PostgREST error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      dossier_relationships: { data: null, error: FORCED_ERROR },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['related_dossiers'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchDocuments rejects on position-links error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      position_dossier_links: { data: null, error: FORCED_ERROR },
      mous: { data: [], error: null },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['documents'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchDocuments rejects on MoU query error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      position_dossier_links: { data: [], error: null },
      mous: { data: null, error: FORCED_ERROR },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['documents'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchWorkItems rejects on links error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      work_item_dossiers: { data: null, error: FORCED_ERROR },
      aa_commitments: { data: [], error: null },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['work_items'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchWorkItems rejects on tasks error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      work_item_dossiers: {
        data: [{ work_item_type: 'task', work_item_id: 't1', inheritance_source: 'direct' }],
        error: null,
      },
      tasks: { data: null, error: FORCED_ERROR },
      aa_commitments: { data: [], error: null },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['work_items'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchCalendarEvents rejects on calendar_entries error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      calendar_entries: { data: null, error: FORCED_ERROR },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['calendar_events'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchKeyContacts rejects on key_contacts error (OVRERR-01)', async () => {
    tableResults.map = {
      dossiers: { data: CORE_ROW, error: null },
      key_contacts: { data: null, error: FORCED_ERROR },
    }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['key_contacts'] }),
    ).rejects.toBeInstanceOf(DossierOverviewAPIError)
  })

  it('fetchActivityTimeline no longer swallows: a unified-activity rejection propagates (OVRERR-01)', async () => {
    tableResults.map = { dossiers: { data: CORE_ROW, error: null } }
    unifiedActivityMock.fn.mockRejectedValue(new Error('activity edge failed'))
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: ['activity_timeline'] }),
    ).rejects.toBeTruthy()
  })

  it('regression pin: a dossiers (core) error rejects with code DOSSIER_FETCH_FAILED', async () => {
    tableResults.map = { dossiers: { data: null, error: FORCED_ERROR } }
    await expect(
      fetchDossierOverview({ dossier_id: 'd1', include_sections: [] }),
    ).rejects.toMatchObject({ code: 'DOSSIER_FETCH_FAILED' })
  })
})

describe('OVRERR-01 — overview.sectionError EN↔AR parity (66-VALIDATION row 4)', () => {
  it('both locales define overview.sectionError with non-empty values', async () => {
    const en = (await import('@/i18n/en/dossier.json')).default as {
      overview: { sectionError?: string }
    }
    const ar = (await import('@/i18n/ar/dossier.json')).default as {
      overview: { sectionError?: string }
    }
    expect(en.overview.sectionError).toBeTruthy()
    expect(ar.overview.sectionError).toBeTruthy()
    expect(en.overview.sectionError).toMatch(/^Failed to load this section/)
    expect(ar.overview.sectionError?.startsWith('تعذر')).toBe(true)
  })
})
