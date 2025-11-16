/**
 * useHealthScore Hook
 * Feature: 030-health-commitment
 *
 * TanStack Query hook for on-demand health score calculation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateHealthScore, type HealthScoreResponse } from '@/services/dossier-stats.service';

export interface UseHealthScoreOptions {
  /**
   * Callback when health score calculation succeeds
   */
  onSuccess?: (data: HealthScoreResponse) => void;
  /**
   * Callback when health score calculation fails
   */
  onError?: (error: Error) => void;
}

/**
 * Hook to trigger on-demand health score calculation
 *
 * Features:
 * - Mutation-based (triggered manually)
 * - Automatically invalidates dossierStats query cache on success
 * - Optional callbacks for success/error handling
 *
 * @param options - Hook options
 * @returns TanStack Mutation result
 */
export function useHealthScore(options?: UseHealthScoreOptions) {
  const queryClient = useQueryClient();

  return useMutation<
    HealthScoreResponse,
    Error,
    { dossierId: string; forceRecalculation?: boolean }
  >({
    mutationFn: ({ dossierId, forceRecalculation }) =>
      calculateHealthScore(dossierId, forceRecalculation),
    onSuccess: (data, variables) => {
      // Invalidate dossierStats cache to refetch with new health score
      queryClient.invalidateQueries({
        queryKey: ['dossierStats', variables.dossierId],
      });

      // Call user-provided onSuccess callback
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      // Call user-provided onError callback
      options?.onError?.(error);
    },
  });
}
