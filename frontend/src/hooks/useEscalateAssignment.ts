/**
 * Escalate Assignment Hook
 * @module hooks/useEscalateAssignment
 * @feature 014-full-assignment-detail
 *
 * TanStack Query mutation for escalating assignments to supervisor with rate limiting.
 *
 * @description
 * This mutation escalates an assignment to the assignee's supervisor:
 * - Adds supervisor as observer with notification
 * - Enforces rate limiting (max 1 escalation per hour per assignment)
 * - Records escalation reason in timeline events
 * - Automatically invalidates assignment, my-assignments, and escalations queries
 * - Provides user feedback via toast notifications (i18n-aware)
 *
 * @example
 * const { mutate } = useEscalateAssignment();
 * mutate({
 *   assignment_id: 'uuid',
 *   reason: 'Need guidance on policy interpretation',
 * });
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/escalate
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

/**
 * Escalation request with reason
 */
export interface EscalateAssignmentRequest {
  assignment_id: string;
  reason: string;
}

/**
 * Escalation response with supervisor details
 */
export interface EscalationResponse {
  observer_id: string;
  supervisor_id: string;
  supervisor_name: string;
  escalated_at: string;
  notification_sent: boolean;
}

/**
 * Hook to escalate an assignment to supervisor
 *
 * @description
 * Escalates assignment to the assignee's supervisor by adding them as an observer
 * and sending a notification. Enforces rate limit of 1 escalation per hour.
 * On success, invalidates assignment, my-assignments, and escalations queries.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Basic usage
 * const { mutate, isPending } = useEscalateAssignment();
 * mutate({ assignment_id: 'uuid', reason: 'Need help' });
 *
 * @example
 * // Handle rate limit error
 * const { mutate, error } = useEscalateAssignment();
 * if (error?.message.includes('rate limit')) {
 *   // Show "Already escalated in the last hour" message
 * }
 */
export function useEscalateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<EscalationResponse, Error, EscalateAssignmentRequest>({
    mutationFn: async (request: EscalateAssignmentRequest) => {
      const { data, error } = await supabase.functions.invoke(
        `assignments-escalate`,
        {
          body: {
            assignment_id: request.assignment_id,
            reason: request.reason,
          },
        }
      );

      if (error) {
        // Handle rate limit error (1 escalation/hour)
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          throw new Error(t('assignments:escalate.error.rateLimit'));
        }

        throw new Error(error.message || 'Failed to escalate assignment');
      }

      return data as EscalationResponse;
    },

    onSuccess: (data, variables) => {
      // Invalidate assignment query to refetch observers
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });

      // Invalidate my-assignments query
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });

      // Invalidate escalations query
      queryClient.invalidateQueries({ queryKey: ['escalations'] });

      // Show success toast
      toast({
        title: t('assignments:escalate.success.title'),
        description: t('assignments:escalate.success.description', {
          supervisor: data.supervisor_name,
        }),
        variant: 'default',
      });
    },

    onError: (error, variables) => {
      // Show error toast
      toast({
        title: t('assignments:escalate.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },
  });
}
