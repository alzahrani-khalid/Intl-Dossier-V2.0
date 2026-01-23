/**
 * Engagement Kanban Board Hook
 * @module hooks/useEngagementKanban
 * @feature 032-unified-work-management
 * @feature engagements-kanban-board
 *
 * TanStack Query hook for managing engagement-specific Kanban boards with automatic
 * caching, drag-and-drop support, and workflow stage transitions.
 *
 * @description
 * This module provides a React hook for managing engagement Kanban boards:
 * - Query hook for fetching Kanban board columns organized by workflow stage
 * - Mutation hook for updating workflow stages with drag-and-drop
 * - Computed statistics (total items, progress percentage, counts by stage)
 * - Flattened assignments list for easy iteration
 * - Support for multiple sorting options (created_at, sla_deadline, priority)
 * - Automatic cache invalidation on workflow stage changes
 *
 * The Kanban board displays work item assignments organized into 5 workflow stages:
 * todo, in_progress, review, done, cancelled.
 *
 * @example
 * // Fetch Kanban board for engagement
 * const { columns, stats, handleDragEnd, isLoading } = useEngagementKanban(
 *   'engagement-uuid',
 *   'sla_deadline'
 * );
 *
 * @example
 * // Access column data
 * if (columns) {
 *   console.log(columns.todo); // Array of assignments in 'todo' stage
 *   console.log(columns.in_progress); // Array of assignments in progress
 *   console.log(stats.progressPercentage); // e.g., 65
 * }
 *
 * @example
 * // Handle drag-and-drop
 * const { handleDragEnd } = useEngagementKanban('engagement-uuid');
 * // On drop:
 * handleDragEnd('assignment-uuid', 'in_progress');
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo, useCallback } from 'react';

/**
 * Kanban assignment entity representing a work item in the board
 *
 * @interface KanbanAssignment
 * @property {string} id - Unique identifier for the assignment
 * @property {string} work_item_id - UUID of the underlying work item (task/commitment/intake)
 * @property {string} work_item_type - Type of work item: 'task', 'commitment', or 'intake'
 * @property {string} assignee_id - UUID of the assigned user
 * @property {string} workflow_stage - Current workflow stage: 'todo', 'in_progress', 'review', 'done', 'cancelled'
 * @property {string} priority - Priority level: 'low', 'medium', 'high', 'urgent'
 * @property {string} status - Status of the work item
 * @property {string | null} sla_deadline - Overall SLA deadline (ISO timestamp or null)
 * @property {string | null} overall_sla_deadline - Overall SLA deadline (ISO timestamp or null)
 * @property {string | null} current_stage_sla_deadline - Stage-specific SLA deadline (ISO timestamp or null)
 * @property {string} engagement_id - UUID of the engagement this assignment belongs to
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 * @property {Object} [assignee] - Optional assignee details
 * @property {string} assignee.id - Assignee user UUID
 * @property {string} assignee.full_name - Assignee full name
 * @property {string} [assignee.avatar_url] - Optional assignee avatar URL
 */
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

/**
 * Kanban columns organized by workflow stage
 *
 * @interface KanbanColumns
 * @property {KanbanAssignment[]} todo - Assignments in 'todo' stage
 * @property {KanbanAssignment[]} in_progress - Assignments in 'in_progress' stage
 * @property {KanbanAssignment[]} review - Assignments in 'review' stage
 * @property {KanbanAssignment[]} done - Assignments in 'done' stage
 * @property {KanbanAssignment[]} cancelled - Assignments in 'cancelled' stage
 */
export interface KanbanColumns {
  todo: KanbanAssignment[];
  in_progress: KanbanAssignment[];
  review: KanbanAssignment[];
  done: KanbanAssignment[];
  cancelled: KanbanAssignment[];
}

/**
 * Sort options for Kanban board
 * @typedef {'created_at' | 'sla_deadline' | 'priority'} SortOption
 */
export type SortOption = 'created_at' | 'sla_deadline' | 'priority';

/**
 * Workflow stages for Kanban board
 * @typedef {'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'} WorkflowStage
 */
export type WorkflowStage = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

/**
 * Hook to fetch and manage engagement Kanban board
 *
 * @description
 * Fetches Kanban board data for a specific engagement, organized by workflow stages.
 * Provides computed statistics, flattened assignments list, and drag-and-drop handler
 * for updating workflow stages. Data is cached and automatically refetched on mutations.
 *
 * Returns:
 * - columns: Assignments organized by workflow stage (todo, in_progress, review, done, cancelled)
 * - assignments: Flattened array of all assignments across all stages
 * - stats: Computed statistics (total, counts by stage, progress percentage)
 * - handleDragEnd: Callback for drag-and-drop workflow stage updates
 * - isLoading: Loading state for initial fetch
 * - error: Error state if fetch fails
 *
 * @param {string} engagementId - The UUID of the engagement
 * @param {SortOption} [sortBy='created_at'] - Sort option: 'created_at', 'sla_deadline', or 'priority'
 * @returns {Object} Hook result with columns, stats, handleDragEnd, isLoading, error
 *
 * @example
 * // Fetch Kanban board sorted by SLA deadline
 * const { columns, stats, handleDragEnd, isLoading } = useEngagementKanban(
 *   'engagement-uuid',
 *   'sla_deadline'
 * );
 *
 * @example
 * // Render columns
 * if (isLoading) return <Spinner />;
 * return (
 *   <div className="kanban-board">
 *     <Column title="To Do" assignments={columns.todo} />
 *     <Column title="In Progress" assignments={columns.in_progress} />
 *     <Column title="Review" assignments={columns.review} />
 *     <Column title="Done" assignments={columns.done} />
 *   </div>
 * );
 *
 * @example
 * // Handle drag-and-drop
 * const { handleDragEnd } = useEngagementKanban('engagement-uuid');
 * const onDrop = (assignmentId: string, newStage: WorkflowStage) => {
 *   handleDragEnd(assignmentId, newStage);
 * };
 */
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
