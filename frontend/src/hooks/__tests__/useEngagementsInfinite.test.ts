/**
 * useEngagementsInfinite — Plan 40-02b unit test.
 *
 * Pins the contract:
 *   - calls `engagementsRepo.getEngagements({ page, limit, search })`
 *   - first page passes `page=1, limit=20, search=undefined`
 *   - getNextPageParam returns `allPages.length + 1` while page is full,
 *     and `undefined` once `data.length < limit`
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const getEngagementsMock = vi.fn()
const rpcMock = vi.fn()

vi.mock('@/domains/engagements', () => ({
  engagementsRepo: {
    getEngagements: (...args: unknown[]): unknown => getEngagementsMock(...args),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]): unknown => rpcMock(...args),
  },
}))

import { useEngagementsInfinite } from '../useEngagementsInfinite'

const createWrapper = (): { wrapper: React.FC<{ children: React.ReactNode }> } => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper }
}

const buildPage = (size: number): { data: Array<{ id: string }>; pagination: unknown } => ({
  data: Array.from({ length: size }, (_, i) => ({ id: `e${i}` })),
  pagination: { page: 1, limit: 20, total: size, totalPages: 1, has_more: false },
})

/**
 * Emulates the transport supabase-js actually uses, which is where the live "n / 0"
 * bug came from: with `head: true` the client issues a **GET** and serializes every
 * argument into the URL, so a `null` arrives at Postgres as the literal string
 * `"null"` — `p_engagement_types=null` 400s with `malformed array literal: "null"`.
 * A mock that just hands back `{ count }` regardless of the arguments cannot catch
 * that, which is exactly how it shipped. This one fails the same way the server does.
 */
const mockRpc = (rows: Array<{ id: string }>, total: number): void => {
  rpcMock.mockImplementation(
    (_fn: string, args: Record<string, unknown>, opts?: { head?: boolean }): Promise<unknown> => {
      if (opts?.head === true) {
        const nullArg = Object.entries(args).find(([, v]) => v === null || v === undefined)
        if (nullArg !== undefined) {
          // PostgREST/Postgres reject the URL-serialized "null" literal.
          return Promise.resolve({
            count: null,
            error: { message: `malformed array literal: "null" (arg ${nullArg[0]})` },
          })
        }
        return Promise.resolve({ count: total, error: null })
      }
      return Promise.resolve({ data: rows, error: null })
    },
  )
}

describe('useEngagementsInfinite — Plan 40-02b adapter', () => {
  beforeEach(() => {
    getEngagementsMock.mockReset()
    rpcMock.mockReset()
    mockRpc([], 0)
  })

  it('passes { page: 1, limit: 20, search: undefined } on initial fetch', async () => {
    getEngagementsMock.mockResolvedValueOnce(buildPage(20))
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useEngagementsInfinite(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(getEngagementsMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: undefined })
  })

  it('reports hasNextPage=true while the page is full and stops once a short page arrives', async () => {
    // First page = full (20), second page = short (5)
    getEngagementsMock.mockResolvedValueOnce(buildPage(20)).mockResolvedValueOnce(buildPage(5))

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useEngagementsInfinite({ limit: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // After first full page, hasNextPage should be true
    expect(result.current.hasNextPage).toBe(true)

    // Fetch next page → returns short page → hasNextPage flips to false
    await result.current.fetchNextPage()

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(false)
    })

    expect(getEngagementsMock).toHaveBeenNthCalledWith(2, {
      page: 2,
      limit: 20,
      search: undefined,
    })
    expect(result.current.data?.pages.length).toBe(2)
  })

  it('forwards the search term to engagementsRepo', async () => {
    getEngagementsMock.mockResolvedValueOnce(buildPage(3))
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useEngagementsInfinite({ search: 'unesco', limit: 20 }), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(getEngagementsMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: 'unesco' })
    // Short first page → no next page
    expect(result.current.hasNextPage).toBe(false)
  })

  // P87-08 review finding: the type-filtered path used a direct PostgREST query with an
  // invalid `dossier:id(...)` embed (400s) whose predicate diverged from the visible rows.
  // Both the rows AND the exact total must now come from search_engagements_advanced.
  it('serves a type bucket from the search RPC, bypassing the repo, with an exact total', async () => {
    mockRpc([{ id: 'e0' }], 7)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useEngagementsInfinite({ type: 'meeting', limit: 20 }), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Rows come from the RPC, not the repo / not a hand-rolled PostgREST query.
    expect(getEngagementsMock).not.toHaveBeenCalled()

    const rowCall = rpcMock.mock.calls.find((c) => (c[2] as { head?: boolean } | undefined) == null)
    expect(rowCall?.[0]).toBe('search_engagements_advanced')
    expect(rowCall?.[1]).toMatchObject({
      p_engagement_types: ['bilateral_meeting', 'consultation', 'working_group', 'roundtable'],
      p_limit: 20,
      p_offset: 0,
    })

    // The exact total is a head-count on the SAME predicate (same bucket array).
    const countCall = rpcMock.mock.calls.find(
      (c) => (c[2] as { head?: boolean } | undefined)?.head === true,
    )
    expect(countCall?.[1]).toMatchObject({
      p_engagement_types: ['bilateral_meeting', 'consultation', 'working_group', 'roundtable'],
    })
    await waitFor(() => {
      expect(result.current.total).toBe(7)
    })
  })

  // Live defect (87-10 render walk): the peek counter rendered "2 / 0" because the
  // head-count call passed `p_engagement_types: null` / `p_search_term: null`, which the
  // GET transport turns into the string "null" → 400 → count 0. Absent arguments must be
  // OMITTED so the RPC's own DEFAULT NULL applies.
  it('omits absent args from the head-count call so the exact total actually resolves', async () => {
    getEngagementsMock.mockResolvedValueOnce(buildPage(3))
    mockRpc([], 42)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useEngagementsInfinite({ limit: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.total).toBe(42)
    })

    const countCall = rpcMock.mock.calls.find(
      (c) => (c[2] as { head?: boolean } | undefined)?.head === true,
    )
    const countArgs = countCall?.[1] as Record<string, unknown>
    expect(countArgs).not.toHaveProperty('p_engagement_types')
    expect(countArgs).not.toHaveProperty('p_search_term')
    expect(Object.values(countArgs)).not.toContain(null)
  })

  it('sends the bucket array (never null) on the head-count call and maps count → total', async () => {
    mockRpc([{ id: 'e0' }], 7)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useEngagementsInfinite({ type: 'travel', limit: 20 }), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.total).toBe(7)
    })

    const countArgs = rpcMock.mock.calls.find(
      (c) => (c[2] as { head?: boolean } | undefined)?.head === true,
    )?.[1] as Record<string, unknown>
    expect(countArgs.p_engagement_types).toEqual(['mission', 'delegation', 'official_visit'])
    expect(Object.values(countArgs)).not.toContain(null)
  })
})
