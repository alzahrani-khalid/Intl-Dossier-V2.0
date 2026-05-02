/**
 * useAfterActionsAll — Plan 42-01 unit test.
 *
 * Pins the contract for the cross-dossier after-actions hook:
 *   - invokes `supabase.functions.invoke('after-actions-list-all', { body: { ...options } })`
 *     (NOT `'after-actions-list'`)
 *   - cache key is `['after-actions', 'all', options]`
 *     (NOT `['after-actions', dossierId, options]`)
 *   - returns `{ data: AfterActionRecordWithJoins[], total: number }` shape
 *   - has no `enabled: !!dossierId` guard (always enabled)
 *   - surfaces errors from `supabase.functions.invoke` via `error`
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useAfterActionsAll } from '../useAfterAction'

const createWrapper = (): { wrapper: React.FC<{ children: React.ReactNode }> } => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper }
}

describe('useAfterActionsAll — Plan 42-01', () => {
  beforeEach(() => {
    vi.mocked(supabase.functions.invoke).mockReset()
  })

  it('invokes after-actions-list-all (not after-actions-list)', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { data: [], total: 0 },
      error: null,
    } as never)
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAfterActionsAll(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(supabase.functions.invoke).toHaveBeenCalledWith('after-actions-list-all', { body: {} })
  })

  it('returns the joined record shape', async () => {
    const fixture = {
      data: [
        {
          id: 'r1',
          engagement: {
            id: 'e1',
            title_en: 'X',
            title_ar: 'س',
            engagement_date: '2026-04-28',
          },
          dossier: { id: 'd1', name_en: 'Y', name_ar: 'ي' },
          decisions: [{ id: '1' }],
          commitments: [{ id: '2' }],
        },
      ],
      total: 1,
    }
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: fixture,
      error: null,
    } as never)
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAfterActionsAll(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data[0].engagement?.title_en).toBe('X')
    expect(result.current.data?.data[0].dossier?.name_en).toBe('Y')
    expect(result.current.data?.total).toBe(1)
  })

  it('passes status / limit / offset options through to the function body', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { data: [], total: 0 },
      error: null,
    } as never)
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAfterActionsAll({ status: 'published', limit: 50, offset: 0 }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(supabase.functions.invoke).toHaveBeenCalledWith('after-actions-list-all', {
      body: { status: 'published', limit: 50, offset: 0 },
    })
  })

  it('surfaces errors from supabase.functions.invoke', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    } as never)
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAfterActionsAll(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect((result.current.error as { message?: string } | null)?.message).toBe('boom')
  })

  it('uses cache key ["after-actions","all",options] (de-dupes identical hooks)', async () => {
    // Cache key is internal — verify by mounting twice with same options on a
    // shared QueryClient and confirming invoke fires exactly once.
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { data: [], total: 0 },
      error: null,
    } as never)
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const sharedWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    const { result: r1 } = renderHook(() => useAfterActionsAll({ status: 'published' }), {
      wrapper: sharedWrapper,
    })
    await waitFor(() => {
      expect(r1.current.isSuccess).toBe(true)
    })
    const { result: r2 } = renderHook(() => useAfterActionsAll({ status: 'published' }), {
      wrapper: sharedWrapper,
    })
    await waitFor(() => {
      expect(r2.current.isSuccess).toBe(true)
    })

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1)
  })
})
