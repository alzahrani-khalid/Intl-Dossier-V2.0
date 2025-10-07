/**
 * useAddChecklistItem Hook
 *
 * TanStack Query mutation for adding individual checklist items to assignments.
 * Includes optimistic update and sequence calculation.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/checklist/create-item
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { AssignmentDetailResponse } from './useAssignmentDetail';

const supabase = createClient();

export interface AddChecklistItemRequest {
  assignment_id: string;
  text: string;
}

export interface AddChecklistItemResponse {
  item_id: string;
  sequence: number;
  created_at: string;
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<AddChecklistItemResponse, Error, AddChecklistItemRequest, { previous: AssignmentDetailResponse | undefined }>({
    mutationFn: async (request: AddChecklistItemRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-checklist-create-item', {
        method: 'POST',
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to add checklist item');
      }

      return data as AddChecklistItemResponse;
    },

    onMutate: async (newItem) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['assignment', newItem.assignment_id],
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<AssignmentDetailResponse>([
        'assignment',
        newItem.assignment_id,
      ]);

      // Optimistically add item
      queryClient.setQueryData<AssignmentDetailResponse>(
        ['assignment', newItem.assignment_id],
        (old) => {
          if (!old) return old;

          // Calculate next sequence
          const maxSequence = Math.max(
            0,
            ...old.checklist_items.map((item) => item.sequence || 0)
          );

          const tempItem = {
            id: 'temp-' + Date.now(),
            assignment_id: newItem.assignment_id,
            text: newItem.text,
            completed: false,
            completed_at: null,
            completed_by: null,
            sequence: maxSequence + 1,
            created_at: new Date().toISOString(),
          };

          return {
            ...old,
            checklist_items: [...old.checklist_items, tempItem],
          };
        }
      );

      return { previous };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          ['assignment', variables.assignment_id],
          context.previous
        );
      }

      toast({
        title: t('assignments:checklist.error.addItem'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });
    },

    onSuccess: () => {
      toast({
        title: t('assignments:checklist.success.addItem'),
        variant: 'default',
      });
    },
  });
}
