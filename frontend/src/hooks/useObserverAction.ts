/**
 * useObserverAction Hook
 *
 * TanStack Query mutation for observer actions on assignments.
 * Supports accept (become assignee), reassign (to other user), or continue observing.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/observer-action
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export interface ObserverActionRequest {
  assignment_id: string;
  action: 'accept' | 'reassign' | 'observe';
  reassign_to_id?: string; // Required if action is 'reassign'
}

export interface ObserverActionResponse {
  assignment_id: string;
  action: string;
  new_assignee_id?: string;
  new_assignee_name?: string;
  observer_removed: boolean;
}

export function useObserverAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<ObserverActionResponse, Error, ObserverActionRequest>({
    mutationFn: async (request: ObserverActionRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-observer-action', {
        method: 'POST',
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to perform observer action');
      }

      return data as ObserverActionResponse;
    },

    onSuccess: (data, variables) => {
      // Invalidate assignment query to refetch assignee and observers
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });

      // Invalidate my-assignments if observer accepted the assignment
      if (variables.action === 'accept') {
        queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      }

      // Show success toast based on action
      let title = '';
      let description = '';

      switch (variables.action) {
        case 'accept':
          title = t('assignments:observer.accept.success.title');
          description = t('assignments:observer.accept.success.description');
          break;
        case 'reassign':
          title = t('assignments:observer.reassign.success.title');
          description = t('assignments:observer.reassign.success.description', {
            assignee: data.new_assignee_name,
          });
          break;
        case 'observe':
          title = t('assignments:observer.observe.success.title');
          description = t('assignments:observer.observe.success.description');
          break;
      }

      toast({
        title,
        description,
        variant: 'default',
      });
    },

    onError: (error) => {
      toast({
        title: t('assignments:observer.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },
  });
}
