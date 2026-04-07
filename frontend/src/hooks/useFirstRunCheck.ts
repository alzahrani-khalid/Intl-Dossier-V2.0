import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Phase 17 — first-run detection hook.
 *
 * Wraps `check_first_run()` (installed by migration 20260407000003) and maps
 * the snake_case payload to a camelCase shape consumed by the dashboard. The
 * query is intentionally fetched once per session: an empty database does not
 * become non-empty during a session without the user actively populating it,
 * and a populated database does not become empty either. Cache settings:
 *   - staleTime: Infinity → never automatically refetch
 *   - gcTime:    Infinity → never garbage-collect from cache
 */

export interface FirstRunStatus {
  isEmpty: boolean
  canSeed: boolean
}

interface CheckFirstRunPayload {
  is_empty: boolean
  can_seed: boolean
}

export interface UseFirstRunCheckResult {
  data: FirstRunStatus | undefined
  isLoading: boolean
  isError: boolean
}

export const useFirstRunCheck = (): UseFirstRunCheckResult => {
  const query = useQuery<FirstRunStatus, Error>({
    queryKey: ['first-run-check'],
    queryFn: async (): Promise<FirstRunStatus> => {
      const { data, error } = await supabase.rpc('check_first_run')
      if (error) {
        throw new Error(error.message)
      }
      const payload = data as unknown as CheckFirstRunPayload
      return {
        isEmpty: payload.is_empty === true,
        canSeed: payload.can_seed === true,
      }
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    // First-run detection is fire-and-forget — if the RPC fails (auth, network)
    // we silently skip the modal rather than retry-pestering the user.
    retry: false,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

export default useFirstRunCheck
