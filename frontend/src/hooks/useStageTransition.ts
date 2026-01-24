/**
 * Stage Transition Hook
 * @module hooks/useStageTransition
 *
 * TanStack Query mutation hook for triggering assignment workflow stage transitions
 * with user attribution and validation.
 *
 * @description
 * This module provides a mutation hook for workflow stage transitions with:
 * - User attribution tracking (triggered_by_user_id)
 * - Server-side validation of stage transitions
 * - Automatic kanban query invalidation on success
 * - Session-based authentication
 * - Error handling with detailed validation messages
 *
 * @example
 * // Basic usage
 * const { mutate: transitionStage } = useStageTransition();
 *
 * const moveToInProgress = () => {
 *   transitionStage({
 *     assignmentId: 'uuid-123',
 *     newStage: 'in_progress',
 *     userId: currentUser.id,
 *   });
 * };
 *
 * @example
 * // With error handling
 * const { mutate, isPending, error } = useStageTransition();
 *
 * const handleTransition = () => {
 *   mutate(
 *     {
 *       assignmentId: assignment.id,
 *       newStage: 'review',
 *       userId: user.id,
 *     },
 *     {
 *       onSuccess: () => toast.success('Moved to review'),
 *       onError: (err) => toast.error(err.message),
 *     }
 *   );
 * };
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface StageTransitionParams {
  assignmentId: string;
  newStage: string;
  userId: string;
}

/**
 * Hook to transition an assignment to a new workflow stage
 *
 * @description
 * Triggers a workflow stage transition with user attribution. The server
 * validates the transition is allowed and updates the stage. Automatically
 * invalidates kanban queries to refresh the board.
 *
 * @returns TanStack Mutation with mutate function accepting StageTransitionParams
 *
 * @example
 * const { mutate: transitionStage, isPending } = useStageTransition();
 *
 * const handleMoveToReview = () => {
 *   if (!currentUser) return;
 *
 *   transitionStage({
 *     assignmentId: assignment.id,
 *     newStage: 'review',
 *     userId: currentUser.id,
 *   }, {
 *     onSuccess: () => {
 *       toast.success('Assignment moved to review');
 *     },
 *     onError: (error) => {
 *       toast.error(`Transition failed: ${error.message}`);
 *     },
 *   });
 * };
 */
export function useStageTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, newStage, userId }: StageTransitionParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assignments-workflow-stage-update/${assignmentId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_stage: newStage,
            triggered_by_user_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.validation_error || data.error || 'Failed to update stage');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate Kanban queries to refresh the board
      queryClient.invalidateQueries({ queryKey: ['engagement-kanban'] });
    },
  });
}
