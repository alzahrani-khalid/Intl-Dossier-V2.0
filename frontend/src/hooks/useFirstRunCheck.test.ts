import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useFirstRunCheck } from './useFirstRunCheck'

const rpcMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}))

const makeWrapper = (): {
  wrapper: (props: { children: ReactNode }) => ReactNode
  queryClient: QueryClient
} => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, queryClient }
}

describe('useFirstRunCheck', () => {
  beforeEach((): void => {
    rpcMock.mockReset()
  })

  it('maps snake_case is_empty/can_seed → camelCase isEmpty/canSeed', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { is_empty: true, can_seed: true },
      error: null,
    })
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useFirstRunCheck(), { wrapper })

    await waitFor((): void => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual({ isEmpty: true, canSeed: true })
    })
    expect(rpcMock).toHaveBeenCalledWith('check_first_run')
  })

  it('returns isEmpty=false, canSeed=false when populated DB and non-admin caller', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { is_empty: false, can_seed: false },
      error: null,
    })
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useFirstRunCheck(), { wrapper })

    await waitFor((): void => {
      expect(result.current.data).toEqual({ isEmpty: false, canSeed: false })
    })
  })

  it('exposes isError when the rpc returns an error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'denied' } })
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useFirstRunCheck(), { wrapper })

    await waitFor((): void => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })

  it('does not refetch on remount because staleTime is Infinity', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { is_empty: true, can_seed: false },
      error: null,
    })
    const { wrapper } = makeWrapper()

    const first = renderHook(() => useFirstRunCheck(), { wrapper })
    await waitFor((): void => {
      expect(first.result.current.data?.isEmpty).toBe(true)
    })
    expect(rpcMock).toHaveBeenCalledTimes(1)

    // Second hook instance shares the same QueryClient — should hit cache
    renderHook(() => useFirstRunCheck(), { wrapper })
    expect(rpcMock).toHaveBeenCalledTimes(1)
  })
})
