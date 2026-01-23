/**
 * Detach Position Hook
 * @module hooks/useDetachPosition
 * @feature engagement-position-management
 *
 * TanStack Query mutation hook for detaching positions from engagements with optimistic
 * updates and automatic cache invalidation.
 *
 * @description
 * This module provides a React hook for detaching positions from engagements:
 * - Mutation hook for removing engagement-position relationships
 * - Optimistic UI updates for instant feedback (onMutate)
 * - Automatic rollback to previous state on error (onError)
 * - Cache invalidation of engagement positions and analytics
 * - Snapshot and restore pattern for data consistency
 *
 * @example
 * // Detach a position from an engagement
 * const { mutate: detachPosition, isPending } = useDetachPosition();
 * detachPosition({
 *   engagementId: 'uuid-123',
 *   positionId: 'uuid-456',
 * });
 *
 * @example
 * // Detach with confirmation
 * const { mutate } = useDetachPosition();
 * const handleDetach = () => {
 *   if (confirm('Remove this position?')) {
 *     mutate({ engagementId, positionId });
 *   }
 * };
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Parameters for detaching a position from an engagement
 */
export interface DetachPositionParams {
  /** Engagement UUID to detach from */
  engagementId: string;
  /** Position UUID to detach */
  positionId: string;
}

/**
 * Detach a position from an engagement via Supabase
 *
 * @private
 * @param params - Detachment parameters
 * @returns Promise resolving when detachment is complete
 * @throws Error if detachment fails
 */
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

/**
 * Optimistic update context for rollback
 *
 * @private
 */
interface OptimisticContext {
  /** Snapshot of previous query data for rollback */
  previousData: any;
}

/**
 * Hook to detach a position from an engagement
 *
 * @description
 * Removes the relationship between a position and an engagement with optimistic UI updates.
 * Implements TanStack Query's optimistic update pattern:
 * 1. Immediately removes the attachment from cache (onMutate)
 * 2. Rolls back to previous state if the mutation fails (onError)
 * 3. Refetches actual data from server on completion (onSettled)
 *
 * Automatically invalidates engagement-positions and position-analytics queries
 * on success to reflect the removal across the application.
 *
 * @returns TanStack Mutation result with mutate function accepting DetachPositionParams
 *
 * @example
 * const { mutate: detachPosition, isPending } = useDetachPosition();
 *
 * // Detach a position
 * detachPosition({
 *   engagementId: 'engagement-uuid',
 *   positionId: 'position-uuid',
 * });
 *
 * @example
 * // Detach with confirmation dialog
 * const { mutate, isPending } = useDetachPosition();
 *
 * const handleDetach = () => {
 *   showConfirmDialog({
 *     title: 'Detach Position',
 *     message: 'Are you sure you want to remove this position from the engagement?',
 *     onConfirm: () => {
 *       mutate(
 *         { engagementId, positionId },
 *         {
 *           onSuccess: () => {
 *             toast.success('Position detached successfully');
 *           },
 *           onError: (error) => {
 *             toast.error(`Failed to detach: ${error.message}`);
 *           },
 *         }
 *       );
 *     },
 *   });
 * };
 *
 * @example
 * // Detach with loading indicator
 * const { mutate, isPending } = useDetachPosition();
 *
 * return (
 *   <Button
 *     variant="danger"
 *     onClick={() => mutate({ engagementId, positionId })}
 *     disabled={isPending}
 *   >
 *     {isPending ? 'Removing...' : 'Remove Position'}
 *   </Button>
 * );
 *
 * @example
 * // Detach from list with optimistic removal
 * const { mutate } = useDetachPosition();
 * const { data: positions } = useEngagementPositions(engagementId);
 *
 * const handleRemove = (positionId) => {
 *   mutate(
 *     { engagementId, positionId },
 *     {
 *       onSuccess: () => {
 *         // List will update optimistically before success
 *         console.log('Position removed from engagement');
 *       },
 *     }
 *   );
 * };
 *
 * @example
 * // Bulk detach with sequential operations
 * const { mutateAsync } = useDetachPosition();
 *
 * const handleBulkDetach = async (positionIds: string[]) => {
 *   for (const positionId of positionIds) {
 *     await mutateAsync({ engagementId, positionId });
 *   }
 *   toast.success(`${positionIds.length} positions detached`);
 * };
 */
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
