/**
 * Engagement Calendar Entries Hook
 * @module hooks/useEngagementCalendarEntries
 * @phase 65-engagement-positions-tab-legacy-reconciliation (plan 65-05)
 *
 * Reads user-created `calendar_entries` rows anchored to an engagement dossier
 * (the rows that the workspace "Add event" CTA writes). Powers the CalendarTab
 * "Scheduled events" reader so the re-enabled Add event CTAs (UI-SPEC §2 #6/#7)
 * are honest: a created entry renders in-tab without reload.
 *
 * @description
 * Direct PostgREST SELECT on `calendar_entries` filtered `dossier_id = engagementId`
 * (an engagement's `engagementId` IS a `dossiers.id`). The SELECT RLS policy
 * (quick 260604-lmy: owner/attendee + dossier clearance) is the enforcement
 * point — this uses the standard anon supabase client (the same one every
 * other reader uses), never a privileged client and never an edge function.
 *
 * The query key `['engagement-calendar-entries', engagementId]` matches the key
 * that `EventDialog` invalidates on success (landed in plan 65-04), so a
 * workspace-created event refetches into this reader immediately.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * A user-created calendar entry scoped to an engagement dossier.
 */
export interface EngagementCalendarEntry {
  id: string
  title_en: string
  title_ar: string | null
  event_date: string
  event_time: string | null
  all_day: boolean
  entry_type: string
}

/**
 * Return type of the useEngagementCalendarEntries hook.
 */
export interface UseEngagementCalendarEntriesResult {
  entries: EngagementCalendarEntry[]
  isLoading: boolean
  error: Error | null
}

/**
 * Fetch the scheduled calendar entries for an engagement dossier.
 *
 * @param engagementId - The engagement dossier id (a `dossiers.id`).
 * @returns entries (ascending by `event_date`), loading flag, and error.
 */
export function useEngagementCalendarEntries(
  engagementId: string,
): UseEngagementCalendarEntriesResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['engagement-calendar-entries', engagementId],
    queryFn: async (): Promise<EngagementCalendarEntry[]> => {
      const { data: rows, error: queryError } = await supabase
        .from('calendar_entries')
        .select('id, title_en, title_ar, event_date, event_time, all_day, entry_type')
        .eq('dossier_id', engagementId)
        .order('event_date', { ascending: true })

      if (queryError) {
        throw new Error(queryError.message)
      }

      return (rows ?? []) as EngagementCalendarEntry[]
    },
    enabled: engagementId !== '',
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  return {
    entries: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
