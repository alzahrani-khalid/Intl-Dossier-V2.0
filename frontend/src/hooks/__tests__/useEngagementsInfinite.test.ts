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

vi.mock('@/domains/engagements', () => ({
  engagementsRepo: {
    getEngagements: (...args: unknown[]): unknown => getEngagementsMock(...args),
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

describe('useEngagementsInfinite — Plan 40-02b adapter', () => {
  beforeEach(() => {
    getEngagementsMock.mockReset()
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
    getEngagementsMock
      .mockResolvedValueOnce(buildPage(20))
      .mockResolvedValueOnce(buildPage(5))

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
    const { result } = renderHook(
      () => useEngagementsInfinite({ search: 'unesco', limit: 20 }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(getEngagementsMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: 'unesco' })
    // Short first page → no next page
    expect(result.current.hasNextPage).toBe(false)
  })
})
