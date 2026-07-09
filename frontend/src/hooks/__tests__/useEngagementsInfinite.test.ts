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

/** head-count call → `{ count }`; row call → `{ data }`. */
const mockRpc = (rows: Array<{ id: string }>, total: number): void => {
  rpcMock.mockImplementation(
    (_fn: string, _args: unknown, opts?: { head?: boolean }): Promise<unknown> =>
      opts?.head === true
        ? Promise.resolve({ count: total, error: null })
        : Promise.resolve({ data: rows, error: null }),
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

  it('counts the unbucketed stream through the same RPC with a null type array', async () => {
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
    expect(countCall?.[1]).toMatchObject({ p_engagement_types: null })
  })
})
