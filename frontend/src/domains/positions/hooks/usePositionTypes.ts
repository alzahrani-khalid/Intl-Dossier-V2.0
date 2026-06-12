/**
 * Position Types Lookup Hook
 * @module domains/positions/hooks/usePositionTypes
 *
 * Reads the `position_types` reference table directly via the supabase client.
 * RLS SELECT is intentionally open to authenticated users (reference data only —
 * names + approval-stage counts; verified live, RESEARCH probe #7).
 *
 * Used by NewPositionDialog (Plan 64-03) to populate the position-type picker.
 * Default resolution (name-match against the standard type → fallback to first
 * row) lives in the dialog (D-05), NOT here.
 */

import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * A single `position_types` reference row.
 * @property id - UUID of the position type
 * @property name_en - English display name
 * @property name_ar - Arabic display name
 * @property approval_stages - Number of approval stages this type requires
 */
export interface PositionTypeRow {
  id: string
  name_en: string
  name_ar: string
  approval_stages: number
}

/**
 * Hook to fetch the `position_types` lookup rows.
 *
 * Cache behavior:
 * - queryKey: ['position-types']
 * - staleTime: 30 minutes (lookup/reference data changes rarely)
 *
 * @returns A TanStack Query result whose `data` is the ordered list of position types
 */
export function usePositionTypes(): UseQueryResult<PositionTypeRow[], Error> {
  return useQuery({
    queryKey: ['position-types'],
    queryFn: async (): Promise<PositionTypeRow[]> => {
      const { data, error } = await supabase
        .from('position_types')
        .select('id, name_en, name_ar, approval_stages')
        .order('name_en')

      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []) as PositionTypeRow[]
    },
    staleTime: 30 * 60 * 1000, // 30 minutes — lookup data
  })
}
