import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo, useCallback } from 'react';

export interface KanbanAssignment {
  id: string;
  work_item_id: string;
  work_item_type: string;
  assignee_id: string;
  workflow_stage: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: string;
  status: string;
  sla_deadline: string | null;
  overall_sla_deadline: string | null;
  current_stage_sla_deadline: string | null;
  engagement_id: string;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface KanbanColumns {
  todo: KanbanAssignment[];
  in_progress: KanbanAssignment[];
  review: KanbanAssignment[];
  done: KanbanAssignment[];
  cancelled: KanbanAssignment[];
}

export type SortOption = 'created_at' | 'sla_deadline' | 'priority';
export type WorkflowStage = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

export function useEngagementKanban(engagementId: string, sortBy: SortOption = 'created_at') {
  const queryClient = useQueryClient();

  const { data: columns, isLoading, error } = useQuery({
    queryKey: ['engagement-kanban', engagementId, sortBy],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagements-kanban-get?engagement_id=${engagementId}&sort=${sortBy}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Kanban board');
      }

      const data = await response.json();
      return data.columns as KanbanColumns;
    },
    enabled: !!engagementId,
  });

  // Flatten all assignments from columns
  const assignments = useMemo(() => {
    if (!columns) return [];
    return [
      ...(columns.todo || []),
      ...(columns.in_progress || []),
      ...(columns.review || []),
      ...(columns.done || []),
      ...(columns.cancelled || []),
    ];
  }, [columns]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!columns) {
      return {
        total: 0,
        todo: 0,
        in_progress: 0,
        review: 0,
        done: 0,
        progressPercentage: 0,
      };
    }

    const total = assignments.length;
    const done = columns.done?.length || 0;
    const progressPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      todo: columns.todo?.length || 0,
      in_progress: columns.in_progress?.length || 0,
      review: columns.review?.length || 0,
      done,
      progressPercentage,
    };
  }, [columns, assignments]);

  // Mutation for updating workflow stage
  const updateStageMutation = useMutation({
    mutationFn: async ({ assignmentId, newStage }: { assignmentId: string; newStage: WorkflowStage }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assignments-workflow-stage-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: assignmentId,
            workflow_stage: newStage,
            triggered_by_user_id: user.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.validation_error || error.error || 'Failed to update assignment stage');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['engagement-kanban', engagementId] });
    },
  });

  const handleDragEnd = useCallback((assignmentId: string, newStage: WorkflowStage) => {
    updateStageMutation.mutate({ assignmentId, newStage });
  }, [updateStageMutation]);

  return {
    assignments,
    columns,
    stats,
    handleDragEnd,
    isLoading,
    error,
  };
}
