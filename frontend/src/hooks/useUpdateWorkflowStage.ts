/**
 * Update Workflow Stage Hook
 * @module hooks/useUpdateWorkflowStage
 *
 * TanStack Query mutation for updating assignment workflow stage via kanban drag-and-drop
 * with optimistic updates for sub-100ms perceived latency.
 *
 * @description
 * This module provides a mutation hook for updating assignment workflow stages with:
 * - Optimistic updates for instant UI feedback (<100ms target)
 * - Automatic kanban board cache updates
 * - Assignment detail cache synchronization
 * - Rollback on error with toast notifications
 * - Multi-query invalidation on success for consistency
 *
 * Workflow stages: todo → in_progress → review → done
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#PATCH /assignments/{id}/workflow-stage
 *
 * @example
 * // Basic usage in kanban drag handler
 * const { mutate: updateStage } = useUpdateWorkflowStage();
 *
 * const handleDrop = (assignmentId: string, newStage: string) => {
 *   updateStage({
 *     assignment_id: assignmentId,
 *     workflow_stage: newStage,
 *     engagement_id: engagementId,
 *   });
 * };
 *
 * @example
 * // With error handling
 * const { mutate: updateStage, isPending } = useUpdateWorkflowStage();
 *
 * updateStage(
 *   {
 *     assignment_id: 'uuid-123',
 *     workflow_stage: 'in_progress',
 *     engagement_id: 'uuid-456',
 *   },
 *   {
 *     onSuccess: () => console.log('Stage updated'),
 *     onError: (error) => console.error('Failed:', error),
 *   }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Database } from '@/types/database';
import { EngagementKanbanResponse } from './useEngagementKanban';
import { AssignmentDetailResponse } from './useAssignmentDetail';

const supabase = createClient();

type EngagementWorkflowStage = Database['public']['Tables']['assignments']['Row']['workflow_stage'];

export interface UpdateWorkflowStageRequest {
  assignment_id: string;
  workflow_stage: EngagementWorkflowStage;
  engagement_id?: string | null; // For kanban invalidation
}

export interface UpdateWorkflowStageResponse {
  assignment_id: string;
  workflow_stage: EngagementWorkflowStage;
  updated_at: string;
}

interface OptimisticContext {
  previousKanban?: EngagementKanbanResponse;
  previousAssignment?: AssignmentDetailResponse;
}

/**
 * Hook to update assignment workflow stage with optimistic updates
 *
 * @description
 * Provides a mutation function that updates an assignment's workflow stage
 * with optimistic UI updates for instant feedback. Automatically handles:
 * - Optimistic kanban column updates (move card between columns)
 * - Optimistic assignment detail updates
 * - Rollback on error
 * - Cache invalidation on success
 * - Toast notifications for errors
 *
 * @returns TanStack Mutation with optimistic update support
 *
 * @example
 * const { mutate: updateStage } = useUpdateWorkflowStage();
 *
 * // Called from drag-and-drop handler
 * const onDragEnd = (result) => {
 *   updateStage({
 *     assignment_id: result.draggableId,
 *     workflow_stage: result.destination.droppableId,
 *     engagement_id: engagementId,
 *   });
 * };
 */
export function useUpdateWorkflowStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<UpdateWorkflowStageResponse, Error, UpdateWorkflowStageRequest, OptimisticContext>({
    mutationFn: async (request: UpdateWorkflowStageRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-workflow-stage-update', {
        method: 'PATCH',
        body: {
          id: request.assignment_id,
          workflow_stage: request.workflow_stage,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to update workflow stage');
      }

      return data as UpdateWorkflowStageResponse;
    },

    onMutate: async (request) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['engagement-kanban', request.engagement_id],
      });
      await queryClient.cancelQueries({
        queryKey: ['assignment', request.assignment_id],
      });

      // Snapshot previous values
      const previousKanban = request.engagement_id
        ? queryClient.getQueryData<EngagementKanbanResponse>([
            'engagement-kanban',
            request.engagement_id,
          ])
        : undefined;

      const previousAssignment = queryClient.getQueryData<AssignmentDetailResponse>([
        'assignment',
        request.assignment_id,
      ]);

      // Optimistically update kanban board
      if (previousKanban) {
        queryClient.setQueryData<EngagementKanbanResponse>(
          ['engagement-kanban', request.engagement_id],
          (old) => {
            if (!old) return old;

            // Find and move assignment to new column
            let assignmentToMove: any = null;
            const newColumns = { ...old.columns };

            // Find assignment in all columns
            for (const stage of ['todo', 'in_progress', 'review', 'done'] as const) {
              const columnAssignments = newColumns[stage].assignments;
              const index = columnAssignments.findIndex(
                (a) => a.id === request.assignment_id
              );

              if (index !== -1) {
                assignmentToMove = { ...columnAssignments[index] };
                // Remove from current column
                newColumns[stage].assignments = columnAssignments.filter(
                  (a) => a.id !== request.assignment_id
                );
                newColumns[stage].count = newColumns[stage].assignments.length;
                break;
              }
            }

            // Add to new column
            if (assignmentToMove) {
              assignmentToMove.workflow_stage = request.workflow_stage;
              newColumns[request.workflow_stage].assignments.push(assignmentToMove);
              newColumns[request.workflow_stage].count =
                newColumns[request.workflow_stage].assignments.length;
            }

            return {
              ...old,
              columns: newColumns,
            };
          }
        );
      }

      // Optimistically update assignment detail
      if (previousAssignment) {
        queryClient.setQueryData<AssignmentDetailResponse>(
          ['assignment', request.assignment_id],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              assignment: {
                ...old.assignment,
                workflow_stage: request.workflow_stage,
              },
            };
          }
        );
      }

      return { previousKanban, previousAssignment };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousKanban) {
        queryClient.setQueryData(
          ['engagement-kanban', variables.engagement_id],
          context.previousKanban
        );
      }

      if (context?.previousAssignment) {
        queryClient.setQueryData(
          ['assignment', variables.assignment_id],
          context.previousAssignment
        );
      }

      toast({
        title: t('assignments:workflowStage.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      if (variables.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: ['engagement-kanban', variables.engagement_id],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });
    },
  });
}
