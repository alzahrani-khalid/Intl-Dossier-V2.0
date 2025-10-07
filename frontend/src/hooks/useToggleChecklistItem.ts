/**
 * useToggleChecklistItem Hook
 *
 * TanStack Query mutation for toggling checklist item completion status.
 * Includes optimistic update (mark complete/incomplete) and progress recalculation.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/checklist/toggle-item
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { AssignmentDetailResponse } from './useAssignmentDetail';

const supabase = createClient();

export interface ToggleChecklistItemRequest {
  item_id: string;
  assignment_id: string;
  completed: boolean;
}

export interface ToggleChecklistItemResponse {
  item_id: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  progress_percentage: number;
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<ToggleChecklistItemResponse, Error, ToggleChecklistItemRequest, { previous: AssignmentDetailResponse | undefined }>({
    mutationFn: async (request: ToggleChecklistItemRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-checklist-toggle-item', {
        method: 'POST',
        body: {
          item_id: request.item_id,
          completed: request.completed,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to toggle checklist item');
      }

      return data as ToggleChecklistItemResponse;
    },

    onMutate: async (request) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['assignment', request.assignment_id],
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<AssignmentDetailResponse>([
        'assignment',
        request.assignment_id,
      ]);

      // Optimistically update checklist item
      queryClient.setQueryData<AssignmentDetailResponse>(
        ['assignment', request.assignment_id],
        (old) => {
          if (!old) return old;

          const updatedItems = old.checklist_items.map((item) => {
            if (item.id === request.item_id) {
              return {
                ...item,
                completed: request.completed,
                completed_at: request.completed ? new Date().toISOString() : null,
                completed_by: request.completed ? 'current-user-id' : null, // Will be replaced on refetch
              };
            }
            return item;
          });

          // Calculate new progress percentage
          const completedCount = updatedItems.filter((item) => item.completed).length;
          const totalCount = updatedItems.length;
          const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return {
            ...old,
            checklist_items: updatedItems,
            checklist_progress: progressPercentage,
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
        title: t('assignments:checklist.error.toggleItem'),
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
  });
}
