/**
 * useVipVisits — Phase 38 plan 06 dashboard adapter hook.
 *
 * Wraps `useUpcomingEvents` from the operations-hub domain and exposes VIP
 * visit rows for the `VipVisits` widget. Phase 45 recognizes engagement rows
 * with nullable person metadata from `get_upcoming_events`, while keeping
 * `event_type === 'vip_visit'` as a legacy fallback.
 *
 * Shape is a minimal projection from the existing `TimelineEvent` row:
 *   - id         ← event.id
 *   - name       ← event.person_name ?? event.title
 *   - nameAr     ← event.person_name_ar ?? event.title_ar
 *   - role       ← event.person_role ?? event.engagement_name ?? ''
 *   - when       ← event.start_date        (ISO)
 *   - personFlag ← event.person_iso
 *   - dossierId  ← event.person_id ?? event.engagement_id
 *
 * Mitigates: T-38-10 (no data-source discretion — hook filter is explicit
 * and unit-tested), T-38-01 (no mock constants leak through).
 */

import { useMemo } from 'react'
import { useUpcomingEvents } from '@/domains/operations-hub/hooks/useUpcomingEvents'
import type { TimelineEvent } from '@/domains/operations-hub/types/operations-hub.types'

export const VIP_EVENT_TYPE = 'vip_visit'

export interface VipVisit {
  id: string
  name: string
  nameAr?: string
  role: string
  when: string
  personFlag?: string
  dossierId?: string
}

export interface UseVipVisitsResult {
  data: VipVisit[] | undefined
  isLoading: boolean
  isError: boolean
}

function toVipVisit(event: TimelineEvent): VipVisit {
  return {
    id: event.id,
    name: event.person_name ?? event.title,
    nameAr: event.person_name_ar ?? event.title_ar ?? undefined,
    role: event.person_role ?? event.engagement_name ?? '',
    when: event.start_date,
    personFlag: event.person_iso ?? undefined,
    dossierId: event.person_id ?? event.engagement_id ?? undefined,
  }
}

function isVipVisitEvent(event: TimelineEvent): boolean {
  return (
    (event.person_id !== null && event.person_id !== undefined) ||
    event.event_type === VIP_EVENT_TYPE
  )
}

export function useVipVisits(userId?: string): UseVipVisitsResult {
  const query = useUpcomingEvents(userId)

  const rows = useMemo((): VipVisit[] | undefined => {
    if (query.data == null) {
      return undefined
    }
    return query.data.filter(isVipVisitEvent).map(toVipVisit)
  }, [query.data])

  return {
    data: rows,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
