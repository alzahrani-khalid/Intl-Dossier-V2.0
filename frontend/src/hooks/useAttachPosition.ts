/**
 * Attach Position Hook
 * @module hooks/useAttachPosition
 * @feature engagement-position-management
 *
 * TanStack Query mutation hook for attaching positions to engagements with optimistic
 * updates and automatic cache invalidation.
 *
 * @description
 * This module provides a React hook for attaching positions to engagements:
 * - Mutation hook for creating engagement-position relationships
 * - Optimistic UI updates for instant feedback (onMutate)
 * - Automatic rollback to previous state on error (onError)
 * - Duplicate attachment detection with user-friendly error messages
 * - Cache invalidation of engagement positions and analytics
 * - Optional attachment reason and relevance score tracking
 *
 * @example
 * // Attach a position to an engagement
 * const { mutate: attachPosition, isPending } = useAttachPosition();
 * attachPosition({
 *   engagementId: 'uuid-123',
 *   positionId: 'uuid-456',
 *   attachmentReason: 'Relevant to discussion topics',
 *   relevanceScore: 0.85,
 * });
 *
 * @example
 * // Handle duplicate attachment
 * const { mutate, error } = useAttachPosition();
 * if (error?.message.includes('POSITION_ALREADY_ATTACHED')) {
 *   return <Alert>This position is already attached</Alert>;
 * }
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EngagementPosition } from './useEngagementPositions';

/**
 * Parameters for attaching a position to an engagement
 */
export interface AttachPositionParams {
  /** Engagement UUID to attach to */
  engagementId: string;
  /** Position UUID to attach */
  positionId: string;
  /** Optional reason for the attachment */
  attachmentReason?: string;
  /** Optional relevance score (0.0 to 1.0) */
  relevanceScore?: number;
}

/**
 * Result of attaching a position
 */
export interface AttachPositionResult {
  /** Unique identifier (UUID) for the engagement-position link */
  id: string;
  /** Engagement UUID */
  engagement_id: string;
  /** Position UUID */
  position_id: string;
  /** UUID of user who attached the position */
  attached_by: string;
  /** ISO timestamp of when position was attached */
  attached_at: string;
  /** Reason for the attachment */
  attachment_reason?: string;
  /** Relevance score (0.0 to 1.0) */
  relevance_score?: number;
}

/**
 * Attach a position to an engagement via Supabase
 *
 * @private
 * @param params - Attachment parameters
 * @returns Promise resolving to attachment result
 * @throws Error if user not authenticated or attachment fails
 */
async function attachPosition(
  params: AttachPositionParams
): Promise<AttachPositionResult> {
  const { engagementId, positionId, attachmentReason, relevanceScore } = params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Insert engagement_position
  const { data, error } = await supabase
    .from('engagement_positions')
    .insert({
      engagement_id: engagementId,
      position_id: positionId,
      attached_by: user.id,
      attachment_reason: attachmentReason,
      relevance_score: relevanceScore,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('POSITION_ALREADY_ATTACHED: This position is already attached to the engagement');
    }
    throw new Error(`Failed to attach position: ${error.message}`);
  }

  return data as AttachPositionResult;
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
 * Hook to attach a position to an engagement
 *
 * @description
 * Creates a relationship between a position and an engagement with optimistic UI updates.
 * Implements TanStack Query's optimistic update pattern:
 * 1. Immediately updates the cache with the new attachment (onMutate)
 * 2. Rolls back to previous state if the mutation fails (onError)
 * 3. Refetches actual data from server on completion (onSettled)
 *
 * Detects duplicate attachments (unique constraint violations) and provides
 * user-friendly error messages. Automatically invalidates engagement-positions
 * and position-analytics queries on success.
 *
 * @returns TanStack Mutation result with mutate function accepting AttachPositionParams
 *
 * @example
 * const { mutate: attachPosition, isPending } = useAttachPosition();
 *
 * // Attach with reason and relevance
 * attachPosition({
 *   engagementId: 'engagement-uuid',
 *   positionId: 'position-uuid',
 *   attachmentReason: 'Directly relevant to main discussion topic',
 *   relevanceScore: 0.9,
 * });
 *
 * @example
 * // Simple attachment without metadata
 * const { mutate } = useAttachPosition();
 * mutate({
 *   engagementId: engagement.id,
 *   positionId: selectedPosition.id,
 * });
 *
 * @example
 * // Handle duplicate attachment error
 * const { mutate, error, isError } = useAttachPosition();
 *
 * const handleAttach = () => {
 *   mutate(
 *     { engagementId, positionId },
 *     {
 *       onSuccess: () => {
 *         toast.success('Position attached successfully');
 *       },
 *       onError: (err) => {
 *         if (err.message.includes('POSITION_ALREADY_ATTACHED')) {
 *           toast.error('This position is already attached to the engagement');
 *         } else {
 *           toast.error(`Failed to attach: ${err.message}`);
 *         }
 *       },
 *     }
 *   );
 * };
 *
 * @example
 * // Attach from suggestion with AI relevance score
 * const { mutate } = useAttachPosition();
 * const { suggestions } = usePositionSuggestions({ engagementId });
 *
 * const handleAcceptSuggestion = (suggestion) => {
 *   mutate({
 *     engagementId,
 *     positionId: suggestion.position_id,
 *     attachmentReason: 'AI-suggested position',
 *     relevanceScore: suggestion.relevance_score,
 *   });
 * };
 *
 * @example
 * // Attach with loading indicator
 * const { mutate, isPending } = useAttachPosition();
 *
 * return (
 *   <Button
 *     onClick={() => mutate({ engagementId, positionId })}
 *     disabled={isPending}
 *   >
 *     {isPending ? 'Attaching...' : 'Attach Position'}
 *   </Button>
 * );
 */
export function useAttachPosition() {
  const queryClient = useQueryClient();

  return useMutation<
    AttachPositionResult,
    Error,
    AttachPositionParams,
    OptimisticContext
  >({
    mutationFn: attachPosition,

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

      // Optimistically update to the new value
      queryClient.setQueriesData(
        { queryKey: ['engagement-positions', engagementId] },
        (old: any) => {
          if (!old) return old;

          // Create optimistic position entry
          const optimisticPosition: Partial<EngagementPosition> = {
            id: `temp-${Date.now()}`,
            engagement_id: engagementId,
            position_id: positionId,
            attached_at: new Date().toISOString(),
            attachment_reason: params.attachmentReason,
            relevance_score: params.relevanceScore,
          };

          return {
            ...old,
            positions: [...(old.positions || []), optimisticPosition],
            total: (old.total || 0) + 1,
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
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ['position-analytics', params.positionId],
        });
      }
    },
  });
}
