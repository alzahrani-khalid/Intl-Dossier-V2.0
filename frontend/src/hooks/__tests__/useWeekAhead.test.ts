/**
 * useWeekAhead — Phase 38 adapter hook unit test.
 *
 * Pins the contract that the WeekAhead widget consumes:
 *   - calls `useUpcomingEvents(userId)` once
 *   - transforms its events array via `groupEventsByDay` (memoised)
 *   - returns `{ data, isLoading, isError }` with `data` typed as `GroupedEvents`
 *
 * Mocks the operations-hub hook so the test runs without a network or
 * QueryClientProvider — adapter logic is pure transform.
 */

import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const useUpcomingEventsMock = vi.fn()
const groupEventsByDayMock = vi.fn()

vi.mock('@/domains/operations-hub/hooks/useUpcomingEvents', () => ({
  useUpcomingEvents: (userId?: string) => useUpcomingEventsMock(userId),
  groupEventsByDay: (events: unknown[]) => groupEventsByDayMock(events),
}))

import { useWeekAhead } from '../useWeekAhead'

describe('useWeekAhead — Phase 38 adapter (T-38-02)', () => {
  beforeEach(() => {
    useUpcomingEventsMock.mockReset()
    groupEventsByDayMock.mockReset()
  })

  it('passes userId to useUpcomingEvents and returns grouped data when query resolves', () => {
    const events = [{ id: 'e1' }, { id: 'e2' }]
    const grouped = { today: [events[0]], tomorrow: [events[1]], this_week: [], next_week: [] }
    useUpcomingEventsMock.mockReturnValue({ data: events, isLoading: false, isError: false })
    groupEventsByDayMock.mockReturnValue(grouped)

    const { result } = renderHook(() => useWeekAhead('user-123'))

    expect(useUpcomingEventsMock).toHaveBeenCalledWith('user-123')
    expect(groupEventsByDayMock).toHaveBeenCalledWith(events)
    expect(result.current.data).toEqual(grouped)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('returns undefined data while loading and forwards isLoading', () => {
    useUpcomingEventsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false })

    const { result } = renderHook(() => useWeekAhead())

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(groupEventsByDayMock).not.toHaveBeenCalled()
  })

  it('forwards isError when the underlying query fails', () => {
    useUpcomingEventsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    const { result } = renderHook(() => useWeekAhead('user-9'))

    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})
