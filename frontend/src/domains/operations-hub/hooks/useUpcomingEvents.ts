/**
 * Upcoming Events Hook
 * Phase 10: Operations Hub Dashboard
 *
 * TanStack Query hook for the Timeline zone.
 * staleTime: 5min (medium-sensitivity per D-19).
 * Includes day-grouping utility for Today/Tomorrow/This Week/Next Week.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isToday, isTomorrow, isThisWeek, addWeeks, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns'
import type { TimelineEvent, GroupedEvents } from '../types/operations-hub.types'
import { getUpcomingEvents } from '../repositories/operations-hub.repository'
import { operationsHubKeys } from './useAttentionItems'

// ============================================================================
// Day Grouping Utility
// ============================================================================

/**
 * Groups timeline events into day buckets: today, tomorrow, this_week, next_week.
 */
export function groupEventsByDay(events: TimelineEvent[]): GroupedEvents {
  const grouped: GroupedEvents = {
    today: [],
    tomorrow: [],
    this_week: [],
    next_week: [],
  }

  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1))
  const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1))

  for (const event of events) {
    const date = new Date(event.start_date)

    if (isToday(date)) {
      grouped.today.push(event)
    } else if (isTomorrow(date)) {
      grouped.tomorrow.push(event)
    } else if (isThisWeek(date)) {
      grouped.this_week.push(event)
    } else if (isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })) {
      grouped.next_week.push(event)
    }
  }

  return grouped
}

// ============================================================================
// useUpcomingEvents Hook
// ============================================================================

/**
 * Fetches upcoming events within the next 14 days.
 * Medium-sensitivity — 5min staleTime per D-19.
 */
export function useUpcomingEvents(userId?: string): ReturnType<typeof useQuery<TimelineEvent[], Error>> {
  return useQuery<TimelineEvent[], Error>({
    queryKey: operationsHubKeys.timeline(userId),
    queryFn: () => getUpcomingEvents(userId ?? null),
    staleTime: 5 * 60_000, // 5 minutes per D-19
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: true,
  })
}

// ============================================================================
// useGroupedEvents Hook
// ============================================================================

/**
 * Wrapper that fetches upcoming events and returns them grouped by day.
 */
export function useGroupedEvents(userId?: string): {
  data: GroupedEvents | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
} {
  const query = useUpcomingEvents(userId)

  const grouped = useMemo(() => {
    if (query.data == null) return undefined
    return groupEventsByDay(query.data)
  }, [query.data])

  return {
    data: grouped,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
