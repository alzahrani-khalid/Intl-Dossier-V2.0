/**
 * Comment Reaction Hooks
 * @module hooks/useToggleReaction
 *
 * TanStack Query mutation for toggling emoji reactions on assignment comments
 * with real-time synchronization.
 *
 * @description
 * This hook provides mutation for toggling emoji reactions on comments:
 * - Add reaction if user hasn't reacted with that emoji
 * - Remove reaction if user has already reacted with that emoji
 * - Real-time synchronization via Supabase Realtime
 * - Automatic cache invalidation
 * - Toast notifications on error
 *
 * Supported emojis: 👍 ✅ ❓ ❤️ 🎯 💡
 *
 * Note: Optimistic updates are handled by the real-time subscription system
 * rather than manual cache manipulation for better consistency.
 *
 * @example
 * // Toggle a reaction
 * const { mutate: toggleReaction } = useToggleReaction();
 * toggleReaction({
 *   comment_id: 'comment-uuid',
 *   emoji: '👍',
 *   assignment_id: 'assignment-uuid', // For cache invalidation
 * });
 *
 * @example
 * // Create reaction buttons
 * const { mutate } = useToggleReaction();
 * const emojis = ['👍', '✅', '❓', '❤️', '🎯', '💡'] as const;
 *
 * emojis.map(emoji => (
 *   <Button
 *     key={emoji}
 *     onClick={() => mutate({
 *       comment_id: comment.id,
 *       emoji,
 *       assignment_id: assignment.id,
 *     })}
 *   >
 *     {emoji}
 *   </Button>
 * ));
 *
 * @example
 * // Handle mutation state
 * const mutation = useToggleReaction();
 * <button
 *   onClick={() => mutation.mutate({ comment_id, emoji: '👍', assignment_id })}
 *   disabled={mutation.isPending}
 * >
 *   {mutation.isPending ? 'Updating...' : '👍'}
 * </button>
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/comments/reactions/toggle
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export interface ToggleReactionRequest {
  comment_id: string;
  emoji: '👍' | '✅' | '❓' | '❤️' | '🎯' | '💡';
  assignment_id: string; // For invalidation
}

export interface ToggleReactionResponse {
  action: 'added' | 'removed';
  emoji: string;
}

/**
 * Hook to toggle emoji reaction on a comment
 *
 * @description
 * Toggles an emoji reaction on a comment:
 * - If user hasn't reacted: adds the reaction
 * - If user has reacted: removes the reaction
 *
 * The mutation integrates with Supabase Realtime for instant UI updates.
 * Cache invalidation ensures consistency with server state.
 *
 * @returns TanStack Mutation for toggling reactions
 * @returns {Function} mutate - Trigger the mutation
 * @returns {Function} mutateAsync - Trigger with promise
 * @returns {boolean} isPending - Mutation in progress
 * @returns {boolean} isSuccess - Mutation succeeded
 * @returns {boolean} isError - Mutation failed
 * @returns {ToggleReactionResponse} data - Response with action ('added' | 'removed')
 * @returns {Error} error - Error object if mutation failed
 *
 * @example
 * // Basic usage
 * const { mutate } = useToggleReaction();
 * mutate({
 *   comment_id: 'comment-id',
 *   emoji: '👍',
 *   assignment_id: 'assignment-id',
 * });
 *
 * @example
 * // Check action result
 * const { mutateAsync } = useToggleReaction();
 * const result = await mutateAsync({ comment_id, emoji: '❤️', assignment_id });
 * if (result.action === 'added') {
 *   console.log('Reaction added');
 * } else {
 *   console.log('Reaction removed');
 * }
 *
 * @example
 * // With loading state
 * const mutation = useToggleReaction();
 * <button
 *   onClick={() => mutation.mutate({ comment_id, emoji: '🎯', assignment_id })}
 *   disabled={mutation.isPending}
 *   className={mutation.isPending ? 'opacity-50' : ''}
 * >
 *   🎯
 * </button>
 */
export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<ToggleReactionResponse, Error, ToggleReactionRequest>({
    mutationFn: async (request: ToggleReactionRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-comments-reactions-toggle', {
        method: 'POST',
        body: {
          comment_id: request.comment_id,
          emoji: request.emoji,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to toggle reaction');
      }

      return data as ToggleReactionResponse;
    },

    onMutate: async (request) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['assignment', request.assignment_id],
      });

      // Optimistic update handled by real-time subscription
      // No need to manually update query data here
    },

    onError: (error, variables) => {
      // Invalidate to refetch accurate state
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });

      // Show error toast
      toast({
        title: t('assignments:reactions.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },

    onSuccess: (data, variables) => {
      // Invalidate to ensure real-time sync
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });
    },
  });
}
