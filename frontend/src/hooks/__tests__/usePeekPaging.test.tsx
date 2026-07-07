/**
 * usePeekPaging — Wave-0 unit tests (Phase 87 plan 01 Task 2, F23 / AFF-01).
 *
 * Uses the REAL peekStore (a plain Zustand singleton) seeded via register/extendWindow
 * and a spy navigateToId — no router needed, which is exactly why navigateToId is injected.
 * Covers the 6 behavior lines: 1-based position/total/can-flags, in-window navigation,
 * cross-page neighbor fetch, prefetch-at-edge (fires exactly once), boundary no-ops, and
 * graceful fetch rejection.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePeekStore } from '@/store/peekStore'
import { usePeekPaging } from '../usePeekPaging'

beforeEach(() => {
  usePeekStore.getState().clear()
})

describe('usePeekPaging', () => {
  it('returns 1-based position, total, and canPrev/canNext from the registry', () => {
    usePeekStore
      .getState()
      .register({ ids: ['a', 'b', 'c'], type: 'country', total: 15, pageOffset: 0 })
    const navigate = vi.fn()
    const { result } = renderHook(() => usePeekPaging('b', navigate))
    expect(result.current.position).toBe(2) // global 0-based 1 → 1-based display 2
    expect(result.current.total).toBe(15)
    expect(result.current.canPrev).toBe(true)
    expect(result.current.canNext).toBe(true)
  })

  it('position is null when currentId is undefined or absent from the window', () => {
    usePeekStore.getState().register({ ids: ['a'], type: 'country', total: 1, pageOffset: 0 })
    const navigate = vi.fn()
    const { result: r1 } = renderHook(() => usePeekPaging(undefined, navigate))
    expect(r1.current.position).toBeNull()
    const { result: r2 } = renderHook(() => usePeekPaging('nope', navigate))
    expect(r2.current.position).toBeNull()
  })

  it('goNext navigates synchronously when the target is inside the loaded window', () => {
    usePeekStore
      .getState()
      .register({ ids: ['a', 'b', 'c', 'd', 'e'], type: 'country', total: 5, pageOffset: 0 })
    const navigate = vi.fn()
    const { result } = renderHook(() => usePeekPaging('a', navigate))
    act(() => result.current.goNext())
    expect(navigate).toHaveBeenCalledWith('b')
  })

  it('goNext fetches the neighbor page, extends the window, then navigates (cross-page)', async () => {
    const fetchPage = vi.fn(
      async (page: number): Promise<string[]> => (page === 2 ? ['c', 'd'] : []),
    )
    usePeekStore.getState().register({
      ids: ['a', 'b'],
      type: 'country',
      total: 4,
      pageOffset: 0,
      pageSize: 2,
      fetchPage,
    })
    const navigate = vi.fn()
    const { result } = renderHook(() => usePeekPaging('b', navigate))
    await act(async () => {
      result.current.goNext()
    })
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('c'))
    expect(fetchPage).toHaveBeenCalledWith(2)
    expect(usePeekStore.getState().ids).toEqual(['a', 'b', 'c', 'd'])
  })

  it('prefetches the neighbor page exactly once when within 2 rows of the loaded edge', async () => {
    const fetchPage = vi.fn(
      async (page: number): Promise<string[]> => (page === 2 ? ['f', 'g', 'h', 'i', 'j'] : []),
    )
    usePeekStore.getState().register({
      ids: ['a', 'b', 'c', 'd', 'e'],
      type: 'country',
      total: 20,
      pageOffset: 0,
      pageSize: 5,
      fetchPage,
    })
    const navigate = vi.fn()
    // 'd' = global pos 3, window end 5, within-2 (>=3) and more rows (5<20) → prefetch page 2
    const { rerender } = renderHook(({ id }: { id: string }) => usePeekPaging(id, navigate), {
      initialProps: { id: 'd' },
    })
    await waitFor(() => expect(usePeekStore.getState().ids.length).toBe(10))
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(2)
    // re-render onto 'e' — page 2 already loaded, no duplicate in-flight fetch
    rerender({ id: 'e' })
    await act(async () => {
      await Promise.resolve()
    })
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('goPrev at the first global row and goNext at the last global row are no-ops', () => {
    usePeekStore
      .getState()
      .register({ ids: ['a', 'b', 'c'], type: 'country', total: 3, pageOffset: 0 })
    const navigate = vi.fn()
    const { result: first } = renderHook(() => usePeekPaging('a', navigate))
    act(() => first.current.goPrev())
    expect(navigate).not.toHaveBeenCalled()
    const { result: last } = renderHook(() => usePeekPaging('c', navigate))
    act(() => last.current.goNext())
    expect(navigate).not.toHaveBeenCalled()
  })

  it('leaves the window unchanged and does not navigate when fetchPage rejects', async () => {
    const fetchPage = vi.fn(async (): Promise<string[]> => {
      throw new Error('network')
    })
    usePeekStore.getState().register({
      ids: ['a', 'b'],
      type: 'country',
      total: 4,
      pageOffset: 0,
      pageSize: 2,
      fetchPage,
    })
    const navigate = vi.fn()
    const { result } = renderHook(() => usePeekPaging('b', navigate))
    await act(async () => {
      result.current.goNext()
    })
    await waitFor(() => expect(fetchPage).toHaveBeenCalled())
    await act(async () => {
      await Promise.resolve()
    })
    expect(navigate).not.toHaveBeenCalled()
    expect(usePeekStore.getState().ids).toEqual(['a', 'b'])
  })
})
