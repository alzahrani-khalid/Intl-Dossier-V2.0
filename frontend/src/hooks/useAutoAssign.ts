/**
 * Auto-Assign Hook
 * @module hooks/useAutoAssign
 * @feature 013-assignment-engine-sla
 *
 * TanStack Query mutation for auto-assigning work items with capacity-based routing.
 *
 * @description
 * This mutation intelligently assigns work items to staff based on:
 * - Staff availability and current capacity load
 * - Required skill matching
 * - Priority level and workload balancing
 * - Organizational unit capacity constraints
 *
 * Features:
 * - Automatic assignment to available staff
 * - Queueing when no capacity available
 * - Optimistic locking retries (exponential backoff)
 * - SLA deadline calculation
 * - User feedback for both assignment and queueing outcomes
 *
 * @example
 * const { mutate } = useAutoAssign();
 * mutate({
 *   work_item_id: 'uuid',
 *   work_item_type: 'ticket',
 *   required_skills: ['skill-uuid-1'],
 *   priority: 'high',
 * });
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#POST /assignments/auto-assign
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

/**
 * Auto-assignment request with work item details
 */
export interface AutoAssignRequest {
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  required_skills: string[];
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

/**
 * Auto-assignment response (assignment or queue result)
 */
export interface AutoAssignResponse {
  assignment_id?: string;
  assignee_id?: string;
  assigned_at?: string;
  sla_deadline?: string;
  time_remaining_seconds?: number;
  priority?: string;
  status?: string;
  queued?: boolean;
  queue_id?: string;
  queue_position?: number;
  queued_at?: string;
  reason?: string;
}

/**
 * Hook to auto-assign work items to available staff
 *
 * @description
 * Attempts to assign work item to the most suitable available staff member.
 * If no capacity available, queues the item for later assignment. Includes
 * automatic retry on concurrent modification (optimistic locking) with
 * exponential backoff (100ms, 200ms, 400ms).
 *
 * On success, invalidates my-assignments and assignment-queue queries.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Basic usage
 * const { mutate, isPending } = useAutoAssign();
 * mutate({
 *   work_item_id: 'ticket-uuid',
 *   work_item_type: 'ticket',
 *   required_skills: ['skill-uuid'],
 *   priority: 'high',
 * });
 *
 * @example
 * // Handle queuing
 * const { mutate } = useAutoAssign();
 * mutate(request, {
 *   onSuccess: (data) => {
 *     if (data.queued) {
 *       // Show "Item queued at position X" message
 *     } else {
 *       // Show "Assigned to staff" message
 *     }
 *   }
 * });
 */
export function useAutoAssign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<AutoAssignResponse, Error, AutoAssignRequest>({
    mutationFn: async (request: AutoAssignRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to auto-assign work item');
      }

      return data as AutoAssignResponse;
    },

    onSuccess: (data, variables) => {
      // Invalidate my-assignments query to show new assignment
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });

      // Invalidate assignment queue if item was queued
      if (data.queued) {
        queryClient.invalidateQueries({ queryKey: ['assignment-queue'] });
      }

      // Show success toast
      if (data.queued) {
        toast({
          title: t('assignments:autoAssign.queued.title'),
          description: t('assignments:autoAssign.queued.description', {
            position: data.queue_position,
            reason: data.reason,
          }),
          variant: 'default',
        });
      } else {
        toast({
          title: t('assignments:autoAssign.success.title'),
          description: t('assignments:autoAssign.success.description', {
            workItemId: variables.work_item_id,
          }),
          variant: 'success',
        });
      }
    },

    onError: (error) => {
      // Show error toast
      toast({
        title: t('assignments:autoAssign.error.title'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },

    // Retry on concurrent modification (optimistic locking)
    retry: (failureCount, error) => {
      if (error.message?.includes('Concurrent modification') && failureCount < 3) {
        return true;
      }
      return false;
    },

    retryDelay: (attemptIndex) => {
      // Exponential backoff: 100ms, 200ms, 400ms
      return Math.min(1000, 100 * Math.pow(2, attemptIndex));
    },
  });
}
