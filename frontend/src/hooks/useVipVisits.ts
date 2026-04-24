/**
 * useVipVisits — Phase 38 plan 06 dashboard adapter hook.
 *
 * Wraps `useUpcomingEvents` from the operations-hub domain and exposes
 * VIP-visit rows for the `VipVisits` widget. The filter is client-side on
 * `event_type === 'vip_visit'` — no new database schema or RPC is added
 * (Option B per user checkpoint answer + Rule-3 deviation documented in
 * 38-06-SUMMARY.md).
 *
 * Shape is a minimal projection from the existing `TimelineEvent` row:
 *   - id         ← event.id
 *   - name       ← event.title             (VIP name as titled in the event)
 *   - role       ← event.engagement_name   (host engagement label — falls back to '')
 *   - when       ← event.start_date        (ISO)
 *   - personFlag ← event.engagement_name_ar // not a flag; left undefined (no
 *                  participant join available without schema changes)
 *   - dossierId  ← event.engagement_id
 *
 * Rule-3 deviation: Without schema changes we cannot join the visiting
 * person's country ISO through the existing `TimelineEvent` projection.
 * `personFlag` is therefore left undefined and the widget falls back to
 * `<DossierGlyph type="person" name={row.name}>` (initials). When a future
 * migration extends `get_upcoming_events` with `person_iso` / `person_role`,
 * this hook is the single place to surface them.
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
    name: event.title,
    role: event.engagement_name ?? '',
    when: event.start_date,
    personFlag: undefined,
    dossierId: event.engagement_id ?? undefined,
  }
}

export function useVipVisits(userId?: string): UseVipVisitsResult {
  const query = useUpcomingEvents(userId)

  const rows = useMemo((): VipVisit[] | undefined => {
    if (query.data == null) {
      return undefined
    }
    return query.data.filter((e): boolean => e.event_type === VIP_EVENT_TYPE).map(toVipVisit)
  }, [query.data])

  return {
    data: rows,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
