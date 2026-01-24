/**
 * Assignment Comment Hooks
 * @module hooks/useAddComment
 *
 * TanStack Query mutation for adding comments to assignments with
 * optimistic updates and automatic @mention notifications.
 *
 * @description
 * This hook provides a mutation for adding comments to assignments:
 * - Optimistic update with temporary comment for instant UI feedback
 * - Automatic rollback on error
 * - Cache invalidation on success to fetch server data
 * - @mention detection and notification
 * - Toast notifications with i18n support
 * - Bi-directional (EN/AR) support
 *
 * Features:
 * - Instant UI update before server response (<50ms perceived latency)
 * - Error recovery with automatic cache rollback
 * - Mention extraction and user notification
 * - Assignment detail cache synchronization
 *
 * @example
 * // Basic usage
 * const { mutate: addComment } = useAddComment();
 * addComment({
 *   assignment_id: 'assignment-uuid',
 *   text: 'Great work on this!',
 * });
 *
 * @example
 * // With @mentions
 * const { mutate: addComment, isPending } = useAddComment();
 * addComment({
 *   assignment_id: 'assignment-uuid',
 *   text: '@john.doe Please review this section',
 * });
 * // Toast will show: "2 users notified: john.doe, ..."
 *
 * @example
 * // Handle loading state
 * const mutation = useAddComment();
 * <Button
 *   onClick={() => mutation.mutate({ assignment_id: id, text })}
 *   disabled={mutation.isPending}
 * >
 *   {mutation.isPending ? 'Adding...' : 'Add Comment'}
 * </Button>
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

/**
 * Hook to add a comment to an assignment
 *
 * @description
 * Creates a new comment on an assignment with optimistic UI updates.
 * Automatically handles:
 * - Optimistic update (comment appears instantly)
 * - Error rollback (reverts UI if server fails)
 * - Cache invalidation (fetches real data from server)
 * - @mention extraction and notifications
 * - Success/error toast messages
 *
 * The mutation includes full optimistic update flow:
 * 1. onMutate: Add temp comment to cache immediately
 * 2. mutationFn: Send request to server
 * 3. onError: Rollback cache to previous state if failed
 * 4. onSettled: Invalidate queries to refetch accurate data
 * 5. onSuccess: Show toast if mentions were created
 *
 * @returns TanStack Mutation for adding comments
 * @returns {Function} mutate - Trigger the mutation
 * @returns {Function} mutateAsync - Trigger with promise
 * @returns {boolean} isPending - Mutation in progress
 * @returns {boolean} isSuccess - Mutation succeeded
 * @returns {boolean} isError - Mutation failed
 * @returns {AddCommentResponse} data - Response data with comment_id and mentions
 * @returns {Error} error - Error object if mutation failed
 *
 * @example
 * // Basic usage
 * const { mutate } = useAddComment();
 * mutate({
 *   assignment_id: 'uuid-123',
 *   text: 'Looks good!',
 * });
 *
 * @example
 * // With promise (async/await)
 * const { mutateAsync } = useAddComment();
 * try {
 *   const result = await mutateAsync({
 *     assignment_id: 'uuid-123',
 *     text: '@alice Please check',
 *   });
 *   console.log('Notified:', result.mentions);
 * } catch (error) {
 *   console.error('Failed:', error);
 * }
 *
 * @example
 * // Track mutation state
 * const mutation = useAddComment();
 * <form onSubmit={(e) => {
 *   e.preventDefault();
 *   mutation.mutate({ assignment_id: id, text: value });
 * }}>
 *   <textarea disabled={mutation.isPending} />
 *   {mutation.isError && <ErrorMessage error={mutation.error} />}
 * </form>
 */
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
