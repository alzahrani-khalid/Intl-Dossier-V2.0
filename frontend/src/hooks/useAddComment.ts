/**
 * useAddComment Hook
 *
 * TanStack Query mutation for adding comments to assignments.
 * Includes optimistic update with temp comment, onError rollback, and invalidation on success.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/comments/create
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { AssignmentDetailResponse } from './useAssignmentDetail';

const supabase = createClient();

export interface AddCommentRequest {
  assignment_id: string;
  text: string;
}

export interface AddCommentResponse {
  comment_id: string;
  created_at: string;
  mentions: string[];
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<AddCommentResponse, Error, AddCommentRequest, { previous: AssignmentDetailResponse | undefined }>({
    mutationFn: async (request: AddCommentRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-comments-create', {
        method: 'POST',
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to add comment');
      }

      return data as AddCommentResponse;
    },

    onMutate: async (newComment) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['assignment', newComment.assignment_id] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<AssignmentDetailResponse>([
        'assignment',
        newComment.assignment_id,
      ]);

      // Optimistically add temp comment
      queryClient.setQueryData<AssignmentDetailResponse>(
        ['assignment', newComment.assignment_id],
        (old) => {
          if (!old) return old;

          const user = supabase.auth.getUser();
          const tempComment = {
            id: 'temp-' + Date.now(),
            assignment_id: newComment.assignment_id,
            user_id: '', // Will be populated from session
            text: newComment.text,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          return {
            ...old,
            comments: [...old.comments, tempComment],
          };
        }
      );

      // Return context for rollback
      return { previous };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previous) {
        queryClient.setQueryData(
          ['assignment', variables.assignment_id],
          context.previous
        );
      }

      // Show error toast
      toast({
        title: t('assignments:comments.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },

    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });
    },

    onSuccess: (data, variables) => {
      // Show success toast if mentions were created
      if (data.mentions && data.mentions.length > 0) {
        toast({
          title: t('assignments:comments.success.title'),
          description: t('assignments:comments.success.mentionsNotified', {
            count: data.mentions.length,
            users: data.mentions.join(', '),
          }),
          variant: 'default',
        });
      }
    },
  });
}
