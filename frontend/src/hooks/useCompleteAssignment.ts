/**
 * useCompleteAssignment Hook
 *
 * TanStack Query mutation for marking assignments as complete.
 * Includes optimistic locking check and status update.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/complete
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export interface CompleteAssignmentRequest {
  assignment_id: string;
  completion_notes?: string;
}

export interface CompleteAssignmentResponse {
  assignment_id: string;
  status: string;
  completed_at: string;
  completed_by: string;
  sla_met: boolean;
}

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
