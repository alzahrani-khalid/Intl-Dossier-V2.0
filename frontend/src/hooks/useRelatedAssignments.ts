/**
 * Related Assignments Hook
 * @module hooks/useRelatedAssignments
 * @feature 014-full-assignment-detail
 *
 * TanStack Query hook with Realtime subscriptions for related (sibling) assignments.
 *
 * @description
 * This hook fetches assignments that share a common context (engagement or dossier)
 * with real-time updates:
 * - Related assignments from the same engagement
 * - Related assignments for the same dossier
 * - Overall progress tracking across related assignments
 * - Real-time subscriptions for sibling assignment changes
 *
 * Useful for showing collaborative work progress and team coordination.
 *
 * @example
 * // Fetch related assignments
 * const { data } = useRelatedAssignments('assignment-uuid');
 * if (data?.context_type === 'engagement') {
 *   // Show engagement progress percentage
 * }
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#GET /assignments/related/{id}
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Database } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

type Assignment = Database['public']['Tables']['assignments']['Row'];

/**
 * Sibling assignment with basic details
 */
export interface RelatedAssignment {
  id: string;
  work_item_type: string;
  work_item_id: string;
  work_item_title?: string;
  assignee_id: string;
  assignee_name?: string;
  status: string;
  workflow_stage: string;
  priority: string;
  assigned_at: string;
}

/**
 * Related assignments response with progress tracking
 */
export interface RelatedAssignmentsResponse {
  context_type: 'engagement' | 'dossier' | 'none';
  context_id: string | null;
  context_title?: string;
  related_assignments: RelatedAssignment[];
  total_count: number;
  completed_count: number;
  progress_percentage: number;
}

/**
 * Hook to fetch related assignments with real-time updates
 *
 * @description
 * Fetches assignments sharing the same context (engagement or dossier) and subscribes
 * to real-time updates. Automatically detects context type and sets up appropriate
 * Realtime channel subscriptions. Cleanup happens on unmount.
 *
 * @param assignmentId - The UUID of the reference assignment
 * @returns TanStack Query result with RelatedAssignmentsResponse data
 *
 * @example
 * // Basic usage
 * const { data, isLoading } = useRelatedAssignments('assignment-uuid');
 * if (data) {
 *   // Display data.related_assignments, data.progress_percentage
 * }
 *
 * @example
 * // Show engagement progress
 * const { data } = useRelatedAssignments('assignment-uuid');
 * if (data?.context_type === 'engagement') {
 *   const progress = `${data.completed_count}/${data.total_count} (${data.progress_percentage}%)`;
 * }
 */
export function useRelatedAssignments(assignmentId: string) {
  const queryClient = useQueryClient();

  const query = useQuery<RelatedAssignmentsResponse, Error>({
    queryKey: ['related-assignments', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('assignments-related-get', {
        method: 'GET',
        body: { id: assignmentId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch related assignments');
      }

      return data as RelatedAssignmentsResponse;
    },
    staleTime: 30000,
    enabled: !!assignmentId,
  });

  // Setup Supabase Realtime subscription for sibling assignments
  useEffect(() => {
    if (!assignmentId || !query.data?.context_id) return;

    const contextType = query.data.context_type;
    const contextId = query.data.context_id;

    let channel: RealtimeChannel;

    if (contextType === 'engagement') {
      // Subscribe to all assignments in the same engagement
      channel = supabase
        .channel(`engagement-assignments:${contextId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assignments',
            filter: `engagement_id=eq.${contextId}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ['related-assignments', assignmentId],
            });
          }
        )
        .subscribe();
    } else if (contextType === 'dossier') {
      // Subscribe to all assignments for the same dossier (work_item_id)
      channel = supabase
        .channel(`dossier-assignments:${contextId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assignments',
            filter: `work_item_id=eq.${contextId}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ['related-assignments', assignmentId],
            });
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [assignmentId, query.data?.context_id, query.data?.context_type, queryClient]);

  return query;
}
