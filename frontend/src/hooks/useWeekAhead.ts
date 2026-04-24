/**
 * useWeekAhead — Phase 38 dashboard adapter hook.
 *
 * Wraps `useUpcomingEvents` from the operations-hub domain and exposes a
 * day-grouped view (today / tomorrow / this_week / next_week) for the
 * `WeekAhead` widget. The grouping is memoised so consumers get a stable
 * reference between renders when the underlying query result is unchanged.
 *
 * Mitigates: T-38-02 (adapter contract pinned + unit-tested before widget
 * plans consume the shape).
 */

import { useMemo } from 'react'
import {
  useUpcomingEvents,
  groupEventsByDay,
} from '@/domains/operations-hub/hooks/useUpcomingEvents'
import type { GroupedEvents } from '@/domains/operations-hub/types/operations-hub.types'

export interface UseWeekAheadResult {
  data: GroupedEvents | undefined
  isLoading: boolean
  isError: boolean
}

export function useWeekAhead(userId?: string): UseWeekAheadResult {
  const query = useUpcomingEvents(userId)

  const grouped = useMemo((): GroupedEvents | undefined => {
    if (query.data == null) {
      return undefined
    }
    return groupEventsByDay(query.data)
  }, [query.data])

  return {
    data: grouped,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
