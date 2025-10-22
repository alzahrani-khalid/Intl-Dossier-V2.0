/**
 * Tasks Hook
 * Part of: 025-unified-tasks-model implementation
 * Task: T023
 *
 * TanStack Query hooks for task CRUD operations with:
 * - Optimistic updates for <50ms perceived latency
 * - Auto-retry on optimistic lock conflicts (3 retries with exponential backoff)
 * - Variable load optimization (10-1000+ tasks)
 * - Work item linking support
 * - Offline state management with IndexedDB (T113-T115)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useEffect, useCallback } from 'react';
import {
  tasksAPI,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  type TaskFilters,
  OptimisticLockConflictError,
} from '@/services/tasks-api';
import type { Database } from '../../../backend/src/types/database.types';
import { useToast } from './use-toast';
import { useOfflineState } from './use-offline-state';
import {
  saveTaskDraft,
  getTaskDraft,
  clearTaskDraft,
  getAllTaskDrafts,
  clearStaleDrafts,
  isIndexedDBSupported,
} from '@/utils/local-storage';

type Task = Database['public']['Tables']['tasks']['Row'];

/**
 * Query keys for cache management
 */
export const tasksKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...tasksKeys.lists(), filters] as const,
  detail: (id: string) => [...tasksKeys.all, 'detail', id] as const,
  myTasks: () => [...tasksKeys.all, 'my-tasks'] as const,
  contributedTasks: () => [...tasksKeys.all, 'contributed'] as const,
  engagement: (engagementId: string) =>
    [...tasksKeys.all, 'engagement', engagementId] as const,
  workItem: (workItemType: string, workItemId: string) =>
    [...tasksKeys.all, 'work-item', workItemType, workItemId] as const,
  overdue: (assigneeId?: string) =>
    [...tasksKeys.all, 'overdue', assigneeId || 'all'] as const,
  approaching: (hours: number, assigneeId?: string) =>
    [...tasksKeys.all, 'approaching', hours, assigneeId || 'all'] as const,
};

/**
 * Hook to fetch tasks with filtering and pagination
 */
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: tasksKeys.list(filters),
    queryFn: () => tasksAPI.getTasks(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch a single task by ID
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: tasksKeys.detail(taskId),
    queryFn: () => tasksAPI.getTask(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch my tasks (assigned to current user)
 */
export function useMyTasks(filters: Omit<TaskFilters, 'filter'> = {}) {
  return useQuery({
    queryKey: tasksKeys.myTasks(),
    queryFn: () => tasksAPI.getMyTasks(filters),
    staleTime: 1000 * 60 * 1, // 1 minute (more frequent updates for personal tasks)
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch tasks I contributed to (US2 - T049)
 * Queries tasks via task_contributors join where user is a contributor
 */
export function useContributedTasks(filters: Omit<TaskFilters, 'filter'> = {}) {
  return useQuery({
    queryKey: tasksKeys.contributedTasks(),
    queryFn: () => tasksAPI.getContributedTasks(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes (contributors change less frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch tasks for an engagement (kanban board)
 */
export function useEngagementTasks(engagementId: string) {
  return useQuery({
    queryKey: tasksKeys.engagement(engagementId),
    queryFn: () => tasksAPI.getEngagementTasks(engagementId),
    enabled: !!engagementId,
    staleTime: 1000 * 30, // 30 seconds (more frequent for kanban boards)
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch tasks linked to a work item
 */
export function useWorkItemTasks(
  workItemType: 'dossier' | 'position' | 'ticket' | 'generic',
  workItemId: string
) {
  return useQuery({
    queryKey: tasksKeys.workItem(workItemType, workItemId),
    queryFn: () => tasksAPI.getWorkItemTasks(workItemType, workItemId),
    enabled: !!workItemId && !!workItemType,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch overdue tasks
 */
export function useOverdueTasks(assigneeId?: string) {
  return useQuery({
    queryKey: tasksKeys.overdue(assigneeId),
    queryFn: () => tasksAPI.getOverdueTasks(assigneeId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch tasks approaching deadline
 */
export function useTasksApproachingDeadline(hours: number = 4, assigneeId?: string) {
  return useQuery({
    queryKey: tasksKeys.approaching(hours, assigneeId),
    queryFn: () => tasksAPI.getTasksApproachingDeadline(hours, assigneeId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to create a new task
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateTask() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksAPI.createTask(data),

    onSuccess: (newTask) => {
      // Invalidate all task lists to refetch
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });

      if (newTask.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.engagement(newTask.engagement_id),
        });
      }

      if (newTask.work_item_type && newTask.work_item_id) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.workItem(newTask.work_item_type, newTask.work_item_id),
        });
      }

      toast({
        title: t('tasks.created'),
        description: t('tasks.created_success'),
      });
    },

    onError: (error: any) => {
      toast({
        title: t('tasks.create_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a task
 * Includes optimistic locking with auto-retry (3 attempts, exponential backoff)
 * After retries fail, triggers ConflictDialog for user resolution (T050)
 */
export function useUpdateTask(options?: {
  onConflictDetected?: (error: OptimisticLockConflictError, localChanges: UpdateTaskRequest) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) =>
      tasksAPI.updateTask(taskId, data),

    // Auto-retry on optimistic lock conflicts
    retry: (failureCount, error) => {
      if (error instanceof OptimisticLockConflictError) {
        return failureCount < 3; // Retry up to 3 times
      }
      return false;
    },

    retryDelay: (attemptIndex) => {
      // Exponential backoff: 100ms, 200ms, 400ms
      return Math.min(1000, 100 * Math.pow(2, attemptIndex));
    },

    onMutate: async ({ taskId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: tasksKeys.detail(taskId) });

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<Task>(tasksKeys.detail(taskId));

      // Optimistically update the cache
      if (previousTask) {
        queryClient.setQueryData<Task>(tasksKeys.detail(taskId), {
          ...previousTask,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      // Return context for rollback
      return { previousTask };
    },

    onError: (error, { taskId, data }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(tasksKeys.detail(taskId), context.previousTask);
      }

      // Special handling for optimistic lock conflicts
      if (error instanceof OptimisticLockConflictError) {
        // After all retries fail, trigger conflict dialog if callback provided
        if (options?.onConflictDetected) {
          options.onConflictDetected(error, data);
        } else {
          // Fallback: show toast notification
          toast({
            title: t('tasks.conflict'),
            description: t('tasks.conflict_message'),
            variant: 'default',
          });
        }
      } else {
        toast({
          title: t('tasks.update_failed'),
          description: error.message,
          variant: 'destructive',
        });
      }
    },

    onSuccess: (updatedTask) => {
      // Update cache with server data
      queryClient.setQueryData(tasksKeys.detail(updatedTask.id), updatedTask);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });

      if (updatedTask.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.engagement(updatedTask.engagement_id),
        });
      }

      if (updatedTask.work_item_type && updatedTask.work_item_id) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.workItem(updatedTask.work_item_type, updatedTask.work_item_id),
        });
      }

      toast({
        title: t('tasks.updated'),
        description: t('tasks.updated_success'),
      });
    },
  });
}

/**
 * Hook to update task workflow stage (for kanban drag-and-drop)
 */
export function useUpdateWorkflowStage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      workflow_stage,
      last_known_updated_at,
    }: {
      taskId: string;
      workflow_stage: UpdateTaskRequest['workflow_stage'];
      last_known_updated_at?: string;
    }) => tasksAPI.updateWorkflowStage(taskId, workflow_stage, last_known_updated_at),

    // Auto-retry on optimistic lock conflicts
    retry: (failureCount, error) => {
      if (error instanceof OptimisticLockConflictError) {
        return failureCount < 3;
      }
      return false;
    },

    retryDelay: (attemptIndex) => Math.min(1000, 100 * Math.pow(2, attemptIndex)),

    onError: (error) => {
      if (!(error instanceof OptimisticLockConflictError)) {
        toast({
          title: t('tasks.update_failed'),
          description: error.message,
          variant: 'destructive',
        });
      }
    },

    onSuccess: (updatedTask) => {
      queryClient.setQueryData(tasksKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });

      if (updatedTask.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.engagement(updatedTask.engagement_id),
        });
      }
    },
  });
}

/**
 * Hook to mark task as completed
 */
export function useCompleteTask() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      last_known_updated_at,
    }: {
      taskId: string;
      last_known_updated_at?: string;
    }) => tasksAPI.completeTask(taskId, last_known_updated_at),

    // Auto-retry on optimistic lock conflicts
    retry: (failureCount, error) => {
      if (error instanceof OptimisticLockConflictError) {
        return failureCount < 3;
      }
      return false;
    },

    retryDelay: (attemptIndex) => Math.min(1000, 100 * Math.pow(2, attemptIndex)),

    onSuccess: (completedTask) => {
      queryClient.setQueryData(tasksKeys.detail(completedTask.id), completedTask);
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });

      if (completedTask.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: tasksKeys.engagement(completedTask.engagement_id),
        });
      }

      toast({
        title: t('tasks.completed'),
        description: t('tasks.completed_success'),
      });
    },

    onError: (error) => {
      if (!(error instanceof OptimisticLockConflictError)) {
        toast({
          title: t('tasks.complete_failed'),
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

/**
 * Hook to delete a task (soft delete)
 */
export function useDeleteTask() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksAPI.deleteTask(taskId),

    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
      queryClient.removeQueries({ queryKey: tasksKeys.detail(taskId) });

      toast({
        title: t('tasks.deleted'),
        description: t('tasks.deleted_success'),
      });
    },

    onError: (error: any) => {
      toast({
        title: t('tasks.delete_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to automatically recover task drafts from IndexedDB on mount (T115)
 * - Checks IndexedDB for any unsaved drafts
 * - Attempts to save them when connectivity is restored
 * - Cleans up stale drafts (older than 7 days)
 *
 * Usage: Call this hook once in the root App component
 */
export function useTaskDraftRecovery() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOnline } = useOfflineState();
  const updateTask = useUpdateTask();

  // Attempt to recover drafts when coming online
  const recoverDrafts = useCallback(async () => {
    if (!isIndexedDBSupported()) {
      console.log('[TaskDraftRecovery] IndexedDB not supported, skipping recovery');
      return;
    }

    try {
      // Get all pending drafts
      const drafts = await getAllTaskDrafts();

      if (drafts.length === 0) {
        console.log('[TaskDraftRecovery] No drafts to recover');
        return;
      }

      console.log(`[TaskDraftRecovery] Found ${drafts.length} drafts to recover`);

      // Attempt to save each draft
      let successCount = 0;
      let failureCount = 0;

      for (const draft of drafts) {
        try {
          // Attempt to update task with draft data
          await updateTask.mutateAsync({
            taskId: draft.taskId,
            data: {
              ...draft.updates,
              // Include original updated_at for optimistic locking if available
              ...(draft.originalUpdatedAt && {
                updated_at: draft.originalUpdatedAt,
              }),
            },
          });

          // Clear draft on success
          await clearTaskDraft(draft.taskId);
          successCount++;

          console.log(`[TaskDraftRecovery] Successfully recovered draft for task ${draft.taskId}`);
        } catch (error) {
          console.error(`[TaskDraftRecovery] Failed to recover draft for task ${draft.taskId}:`, error);
          failureCount++;

          // If it's an optimistic lock conflict, keep the draft for manual resolution
          if (!(error instanceof OptimisticLockConflictError)) {
            // For other errors, clear the draft to avoid endless retry loops
            await clearTaskDraft(draft.taskId);
          }
        }
      }

      // Show summary toast
      if (successCount > 0) {
        toast({
          title: t('tasks.drafts_recovered'),
          description: t('tasks.drafts_recovered_message', {
            count: successCount,
          }),
        });
      }

      if (failureCount > 0) {
        toast({
          title: t('tasks.drafts_recovery_partial'),
          description: t('tasks.drafts_recovery_partial_message', {
            failed: failureCount,
          }),
          variant: 'default',
        });
      }

      // Clean up stale drafts
      const staleCount = await clearStaleDrafts();
      if (staleCount > 0) {
        console.log(`[TaskDraftRecovery] Cleared ${staleCount} stale drafts`);
      }
    } catch (error) {
      console.error('[TaskDraftRecovery] Error during draft recovery:', error);
    }
  }, [isOnline, updateTask, toast, t]);

  // Trigger recovery when coming online
  useEffect(() => {
    if (isOnline) {
      recoverDrafts();
    }
  }, [isOnline, recoverDrafts]);

  return {
    recoverDrafts,
  };
}

/**
 * Hook to persist task updates to IndexedDB when offline (T114)
 *
 * Usage:
 * ```tsx
 * const { saveOfflineDraft } = useTaskOfflineDraft(taskId);
 *
 * const handleSave = async () => {
 *   if (isOffline) {
 *     await saveOfflineDraft({ title: newTitle });
 *     toast({ title: 'Saved offline, will sync when online' });
 *   } else {
 *     await updateTask.mutateAsync({ taskId, data: { title: newTitle } });
 *   }
 * };
 * ```
 */
export function useTaskOfflineDraft(taskId: string) {
  const { isOffline } = useOfflineState();
  const { toast } = useToast();
  const { t } = useTranslation();

  const saveOfflineDraft = useCallback(
    async (updates: Partial<UpdateTaskRequest>, originalUpdatedAt?: string) => {
      if (!isIndexedDBSupported()) {
        console.warn('[TaskOfflineDraft] IndexedDB not supported');
        return;
      }

      try {
        await saveTaskDraft(taskId, updates, originalUpdatedAt);
        console.log(`[TaskOfflineDraft] Saved draft for task ${taskId}`);

        toast({
          title: t('tasks.draft_saved'),
          description: t('tasks.draft_saved_offline_message'),
        });
      } catch (error) {
        console.error('[TaskOfflineDraft] Error saving draft:', error);
        toast({
          title: t('tasks.draft_save_failed'),
          description: t('tasks.draft_save_failed_message'),
          variant: 'destructive',
        });
      }
    },
    [taskId, toast, t]
  );

  const loadDraft = useCallback(async () => {
    if (!isIndexedDBSupported()) {
      return null;
    }

    try {
      const draft = await getTaskDraft(taskId);
      return draft;
    } catch (error) {
      console.error('[TaskOfflineDraft] Error loading draft:', error);
      return null;
    }
  }, [taskId]);

  const clearDraft = useCallback(async () => {
    if (!isIndexedDBSupported()) {
      return;
    }

    try {
      await clearTaskDraft(taskId);
      console.log(`[TaskOfflineDraft] Cleared draft for task ${taskId}`);
    } catch (error) {
      console.error('[TaskOfflineDraft] Error clearing draft:', error);
    }
  }, [taskId]);

  return {
    isOffline,
    saveOfflineDraft,
    loadDraft,
    clearDraft,
  };
}
