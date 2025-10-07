/**
 * useRelatedAssignments Hook
 *
 * TanStack Query hook with Supabase Realtime subscription for related (sibling) assignments.
 * Fetches assignments from the same engagement or dossier.
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

export interface RelatedAssignmentsResponse {
  context_type: 'engagement' | 'dossier' | 'none';
  context_id: string | null;
  context_title?: string;
  related_assignments: RelatedAssignment[];
  total_count: number;
  completed_count: number;
  progress_percentage: number;
}

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
