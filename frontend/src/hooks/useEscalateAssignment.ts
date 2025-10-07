/**
 * useEscalateAssignment Hook
 *
 * TanStack Query mutation for escalating assignments to supervisor.
 * Adds supervisor as observer and triggers notification.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/escalate
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export interface EscalateAssignmentRequest {
  assignment_id: string;
  reason: string;
}

export interface EscalationResponse {
  observer_id: string;
  supervisor_id: string;
  supervisor_name: string;
  escalated_at: string;
  notification_sent: boolean;
}

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
