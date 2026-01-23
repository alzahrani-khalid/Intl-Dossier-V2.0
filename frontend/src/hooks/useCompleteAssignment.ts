/**
 * Complete Assignment Hook
 * @module hooks/useCompleteAssignment
 * @feature 014-full-assignment-detail
 *
 * TanStack Query mutation for marking assignments as complete with SLA validation.
 *
 * @description
 * This mutation handles assignment completion with:
 * - Optimistic locking conflict detection (409 Conflict)
 * - SLA met/breached status calculation
 * - Automatic cache invalidation for assignment and my-assignments queries
 * - User feedback via toast notifications (i18n-aware)
 * - Completion notes/summary capture
 *
 * @example
 * const { mutate, isPending } = useCompleteAssignment();
 * mutate({
 *   assignment_id: 'uuid',
 *   completion_notes: 'Completed successfully',
 * });
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/complete
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

/**
 * Assignment completion request
 */
export interface CompleteAssignmentRequest {
  assignment_id: string;
  completion_notes?: string;
}

/**
 * Assignment completion response with SLA status
 */
export interface CompleteAssignmentResponse {
  assignment_id: string;
  status: string;
  completed_at: string;
  completed_by: string;
  sla_met: boolean;
}

/**
 * Hook to mark an assignment as complete
 *
 * @description
 * Completes an assignment with automatic SLA validation and cache updates.
 * Handles optimistic locking conflicts and shows appropriate user feedback.
 * On success, invalidates assignment detail and my-assignments queries.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Basic usage
 * const { mutate, isPending } = useCompleteAssignment();
 * mutate({ assignment_id: 'uuid', completion_notes: 'Done' });
 *
 * @example
 * // With loading state
 * const { mutate, isPending, isError, error } = useCompleteAssignment();
 * const handleComplete = () => mutate({ assignment_id: id });
 */
export function useCompleteAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<CompleteAssignmentResponse, Error, CompleteAssignmentRequest>({
    mutationFn: async (request: CompleteAssignmentRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-complete', {
        method: 'POST',
        body: request,
      });

      if (error) {
        // Handle optimistic locking conflict (409 Conflict)
        if (error.message?.includes('conflict') || error.message?.includes('409')) {
          throw new Error(t('assignments:complete.error.conflict'));
        }

        throw new Error(error.message || 'Failed to complete assignment');
      }

      return data as CompleteAssignmentResponse;
    },

    onSuccess: (data, variables) => {
      // Invalidate assignment query
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });

      // Invalidate my-assignments query (assignment should be removed from active list)
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });

      // Show success toast
      toast({
        title: t('assignments:complete.success.title'),
        description: data.sla_met
          ? t('assignments:complete.success.slaMet')
          : t('assignments:complete.success.slaBreached'),
        variant: data.sla_met ? 'default' : 'destructive',
      });
    },

    onError: (error) => {
      toast({
        title: t('assignments:complete.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },
  });
}
