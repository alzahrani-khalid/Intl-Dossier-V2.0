/**
 * useToggleReaction Hook
 *
 * TanStack Query mutation for toggling emoji reactions on comments.
 * Includes optimistic update (add/remove reaction) and real-time sync.
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
