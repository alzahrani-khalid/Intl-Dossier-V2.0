/**
 * Phase 38 plan 06 — useVipVisits unit tests.
 *
 * Covers:
 *   - filters out non-VIP events
 *   - maps TimelineEvent → VipVisit shape
 *   - propagates isLoading / isError
 *   - returns undefined when upstream data is undefined
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/domains/operations-hub/hooks/useUpcomingEvents', () => ({
  useUpcomingEvents: vi.fn(),
}))

import { useUpcomingEvents } from '@/domains/operations-hub/hooks/useUpcomingEvents'
import { useVipVisits, VIP_EVENT_TYPE } from '../useVipVisits'

interface MakeEventOpts {
  id: string
  event_type: string
  title?: string
  engagement_name?: string | null
  engagement_id?: string | null
}

function makeEvent({
  id,
  event_type,
  title = 'Visit',
  engagement_name = 'Saudi Arabia',
  engagement_id = 'eng-1',
}: MakeEventOpts): unknown {
  return {
    id,
    title,
    title_ar: null,
    start_date: '2026-05-01T09:00:00Z',
    end_date: null,
    event_type,
    engagement_id,
    engagement_name,
    engagement_name_ar: null,
    lifecycle_stage: 'scheduled',
  }
}

beforeEach((): void => {
  vi.mocked(useUpcomingEvents).mockReset()
})

describe('useVipVisits', (): void => {
  it('filters events to only vip_visit type', (): void => {
    vi.mocked(useUpcomingEvents).mockReturnValue({
      data: [
        makeEvent({ id: 'a', event_type: 'meeting' }),
        makeEvent({ id: 'b', event_type: VIP_EVENT_TYPE }),
        makeEvent({ id: 'c', event_type: 'deadline' }),
        makeEvent({ id: 'd', event_type: VIP_EVENT_TYPE }),
      ],
      isLoading: false,
      isError: false,
    } as never)

    const { result } = renderHook(() => useVipVisits('u1'))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.map((v) => v.id)).toEqual(['b', 'd'])
  })

  it('maps TimelineEvent → VipVisit shape', (): void => {
    vi.mocked(useUpcomingEvents).mockReturnValue({
      data: [
        makeEvent({
          id: 'v1',
          event_type: VIP_EVENT_TYPE,
          title: 'Amb. Al-Sayed',
          engagement_name: 'G20 Bilateral',
          engagement_id: 'eng-42',
        }),
      ],
      isLoading: false,
      isError: false,
    } as never)

    const { result } = renderHook(() => useVipVisits('u1'))
    const row = result.current.data?.[0]
    expect(row).toBeDefined()
    expect(row?.id).toBe('v1')
    expect(row?.name).toBe('Amb. Al-Sayed')
    expect(row?.role).toBe('G20 Bilateral')
    expect(row?.when).toBe('2026-05-01T09:00:00Z')
    expect(row?.dossierId).toBe('eng-42')
    expect(row?.personFlag).toBeUndefined()
  })

  it('defaults role to empty string when engagement_name is null', (): void => {
    vi.mocked(useUpcomingEvents).mockReturnValue({
      data: [
        makeEvent({
          id: 'v2',
          event_type: VIP_EVENT_TYPE,
          title: 'Visitor',
          engagement_name: null,
        }),
      ],
      isLoading: false,
      isError: false,
    } as never)

    const { result } = renderHook(() => useVipVisits('u1'))
    expect(result.current.data?.[0]?.role).toBe('')
  })

  it('returns undefined data when upstream data is undefined', (): void => {
    vi.mocked(useUpcomingEvents).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never)

    const { result } = renderHook(() => useVipVisits('u1'))
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('propagates isError', (): void => {
    vi.mocked(useUpcomingEvents).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never)

    const { result } = renderHook(() => useVipVisits('u1'))
    expect(result.current.isError).toBe(true)
  })

  it('returns empty array when no VIP visits present', (): void => {
    vi.mocked(useUpcomingEvents).mockReturnValue({
      data: [
        makeEvent({ id: 'a', event_type: 'meeting' }),
        makeEvent({ id: 'b', event_type: 'deadline' }),
      ],
      isLoading: false,
      isError: false,
    } as never)

    const { result } = renderHook(() => useVipVisits('u1'))
    expect(result.current.data).toEqual([])
  })
})
