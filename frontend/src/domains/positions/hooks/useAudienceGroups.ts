/**
 * Audience Groups Lookup Hook
 * @module domains/positions/hooks/useAudienceGroups
 *
 * Reads the `audience_groups` reference table directly via the supabase client.
 * RLS SELECT is intentionally open to authenticated users (reference data only —
 * display names; verified live, RESEARCH probe #8).
 *
 * Used by NewPositionDialog (Plan 64-03) to populate the audience-group checkboxes.
 * Default resolution (name-match against the all-staff group → fallback to first
 * row) lives in the dialog (D-06), NOT here.
 */

import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * A single `audience_groups` reference row.
 * @property id - UUID of the audience group
 * @property name_en - English display name
 * @property name_ar - Arabic display name
 */
export interface AudienceGroupRow {
  id: string
  name_en: string
  name_ar: string
}

/**
 * Hook to fetch the `audience_groups` lookup rows.
 *
 * Cache behavior:
 * - queryKey: ['audience-groups']
 * - staleTime: 30 minutes (lookup/reference data changes rarely)
 *
 * @returns A TanStack Query result whose `data` is the ordered list of audience groups
 */
export function useAudienceGroups(): UseQueryResult<AudienceGroupRow[], Error> {
  return useQuery({
    queryKey: ['audience-groups'],
    queryFn: async (): Promise<AudienceGroupRow[]> => {
      const { data, error } = await supabase
        .from('audience_groups')
        .select('id, name_en, name_ar')
        .order('name_en')

      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []) as AudienceGroupRow[]
    },
    staleTime: 30 * 60 * 1000, // 30 minutes — lookup data
  })
}
