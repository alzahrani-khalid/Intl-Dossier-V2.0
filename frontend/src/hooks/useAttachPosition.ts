/**
 * TanStack Query Mutation Hook: useAttachPosition (T036)
 * Attaches a position to an engagement with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EngagementPosition } from './useEngagementPositions';

export interface AttachPositionParams {
  engagementId: string;
  positionId: string;
  attachmentReason?: string;
  relevanceScore?: number;
}

export interface AttachPositionResult {
  id: string;
  engagement_id: string;
  position_id: string;
  attached_by: string;
  attached_at: string;
  attachment_reason?: string;
  relevance_score?: number;
}

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

interface OptimisticContext {
  previousData: any;
}

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
