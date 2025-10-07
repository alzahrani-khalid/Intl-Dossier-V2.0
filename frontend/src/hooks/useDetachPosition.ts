/**
 * TanStack Query Mutation Hook: useDetachPosition (T037)
 * Detaches a position from an engagement with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DetachPositionParams {
  engagementId: string;
  positionId: string;
}

async function detachPosition(params: DetachPositionParams): Promise<void> {
  const { engagementId, positionId } = params;

  // Delete engagement_position
  const { error } = await supabase
    .from('engagement_positions')
    .delete()
    .eq('engagement_id', engagementId)
    .eq('position_id', positionId);

  if (error) {
    throw new Error(`Failed to detach position: ${error.message}`);
  }
}

interface OptimisticContext {
  previousData: any;
}

export function useDetachPosition() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DetachPositionParams, OptimisticContext>({
    mutationFn: detachPosition,

    // Optimistic update
    onMutate: async (params) => {
      const { engagementId, positionId } = params;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['engagement-positions', engagementId],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({
        queryKey: ['engagement-positions', engagementId],
      });

      // Optimistically update by removing the position
      queryClient.setQueriesData(
        { queryKey: ['engagement-positions', engagementId] },
        (old: any) => {
          if (!old) return old;

          const filteredPositions = (old.positions || []).filter(
            (ep: any) => ep.position_id !== positionId
          );

          return {
            ...old,
            positions: filteredPositions,
            total: Math.max(0, (old.total || 0) - 1),
          };
        }
      );

      // Return context with snapshot
      return { previousData };
    },

    // On error, rollback
    onError: (err, params, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, params) => {
      queryClient.invalidateQueries({
        queryKey: ['engagement-positions', params.engagementId],
      });

      // Also invalidate position analytics
      queryClient.invalidateQueries({
        queryKey: ['position-analytics', params.positionId],
      });
    },
  });
}
