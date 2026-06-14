/**
 * useSignals — read_signals RPC wrapper (Phase 69, Wave 2).
 *
 * TanStack Query hook over the SECURITY INVOKER `read_signals` RPC. The RPC runs
 * under the caller's JWT, so clearance gating (sensitivity_level <= clearance_level)
 * is enforced at the DB layer — non-cleared callers receive an empty result that is
 * indistinguishable from a zero-signal state (D-09). Never call this with
 * supabaseAdmin; the @/lib/supabase client passes the active session automatically.
 *
 * @module domains/signals/hooks/useSignals
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Signal, type SignalFilters, signalKeys } from '../types/signal.types'

/**
 * Read signals via the clearance-gated read_signals RPC.
 *
 * - Global queue mode: omit `dossierId` (passes p_dossier_id: null).
 * - Per-dossier mode: pass `dossierId` to scope via the intelligence_event_dossiers junction.
 * - `staleTime` is 60s, mirroring IntakeQueue.tsx.
 */
export function useSignals(filters: SignalFilters = {}): UseQueryResult<Signal[]> {
  return useQuery({
    queryKey: signalKeys.list(filters),
    queryFn: async (): Promise<Signal[]> => {
      const { data, error } = await supabase.rpc('read_signals', {
        p_dossier_id: filters.dossierId ?? null,
        p_status: filters.status ?? null,
        p_since: filters.since ?? null,
        p_limit: filters.limit ?? 50,
      })
      if (error) throw error
      return (data as Signal[]) ?? []
    },
    staleTime: 60_000,
  })
}
