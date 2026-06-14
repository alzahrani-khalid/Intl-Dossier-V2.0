/**
 * useSignalDossierLinks — read a signal's linked dossier IDs (Phase 69, Wave 4).
 *
 * Reads the intelligence_event_dossiers junction under the caller's JWT (RLS-enforced,
 * never the service-role client). The junction SELECT policy gates on the parent
 * intelligence_event's tenant isolation + clearance (FK on event_id), so a non-cleared
 * caller receives an empty array — indistinguishable from a signal with no links (D-09).
 *
 * Used by EscalateSignalDialog to source the dossier_id list copied onto the escalated
 * task (D-11/SIGNAL-05). The query only runs when a signalId is present (dialog open).
 *
 * @module domains/signals/hooks/useSignalDossierLinks
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { signalKeys } from '../types/signal.types'

/**
 * Fetch the dossier UUIDs linked to a signal via the intelligence_event_dossiers junction.
 *
 * Returns an empty array when `signalId` is null (disabled query) or when the signal has
 * no clearance-visible links. Never throws on the empty case.
 */
export function useSignalDossierLinks(signalId: string | null): UseQueryResult<string[]> {
  return useQuery({
    queryKey: signalKeys.dossierLinks(signalId ?? ''),
    queryFn: async (): Promise<string[]> => {
      if (!signalId) return []

      const { data, error } = await supabase
        .from('intelligence_event_dossiers')
        .select('dossier_id')
        .eq('event_id', signalId)
      if (error) throw error

      return (data ?? []).map((row) => row.dossier_id)
    },
    enabled: signalId !== null,
    staleTime: 60_000,
  })
}
