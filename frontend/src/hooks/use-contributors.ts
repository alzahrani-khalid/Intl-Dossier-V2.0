/**
 * Task Contributors Hooks
 * @module hooks/use-contributors
 * @feature 025-unified-tasks-model
 *
 * TanStack Query hooks for managing task contributors with optimistic updates,
 * audit trails, and team collaboration tracking.
 *
 * @description
 * This module provides comprehensive contributor management for tasks:
 * - Fetch contributors for a task (active only)
 * - Fetch contributor history (including removed contributors)
 * - Fetch tasks where user is a contributor
 * - Get contributor count for a task
 * - Check if user is a contributor
 * - Add/remove contributors with optimistic updates (<50ms perceived latency)
 * - Bulk add/remove operations
 * - Automatic cache synchronization
 * - Toast notifications with i18n support
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Granular cache invalidation
 * - Audit trail preservation (soft deletes)
 * - Role-based contributor types
 *
 * @example
 * // Fetch task contributors
 * const { data: contributors, isLoading } = useTaskContributors('task-uuid');
 * contributors?.forEach(c => console.log(c.user_id, c.role));
 *
 * @example
 * // Add contributor with optimistic update
 * const { mutate: addContributor } = useAddContributor('task-uuid');
 * addContributor({
 *   user_id: 'user-uuid',
 *   role: 'reviewer',
 * });
 * // UI updates instantly, before server responds
 *
 * @example
 * // Check contributor status
 * const { data: isContributor } = useIsContributor('task-uuid', currentUser.id);
 * {isContributor && <Badge>You're a contributor</Badge>}
 *
 * @example
 * // Bulk add contributors
 * const { mutate: addMultiple } = useAddMultipleContributors('task-uuid');
 * addMultiple({
 *   contributors: [
 *     { user_id: 'user-1', role: 'contributor' },
 *     { user_id: 'user-2', role: 'reviewer' },
 *   ],
 * });
 *
 * @example
 * // View contributor history (audit trail)
 * const { data: history } = useContributorHistory('task-uuid');
 * history?.forEach(c => {
 *   console.log(c.user_id, c.added_at, c.removed_at);
 * });
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  contributorsAPI,
  type AddContributorRequest,
  type AddMultipleContributorsRequest,
} from '@/services/contributors-api';
import type { Database } from '../../../backend/src/types/database.types';
import { useToast } from './use-toast';
import { tasksKeys } from './use-tasks';

type TaskContributor = Database['public']['Tables']['task_contributors']['Row'];

/**
 * Query Keys Factory for contributor-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation by task and user.
 *
 * Invalidation patterns:
 * - Adding/removing contributors: invalidate task(), count(), taskHistory(), isContributor()
 * - User joining task: invalidate user() for that user
 * - Bulk operations: invalidate all related queries
 *
 * @example
 * // Invalidate all contributor queries
 * queryClient.invalidateQueries({ queryKey: contributorsKeys.all });
 *
 * @example
 * // Invalidate specific task's contributors
 * queryClient.invalidateQueries({ queryKey: contributorsKeys.task('task-id') });
 *
 * @example
 * // Invalidate user's contributor tasks
 * queryClient.invalidateQueries({ queryKey: contributorsKeys.user('user-id') });
 *
 * @example
 * // Check specific contributor status
 * queryClient.invalidateQueries({
 *   queryKey: contributorsKeys.isContributor('task-id', 'user-id')
 * });
 */
export const contributorsKeys = {
  all: ['contributors'] as const,
  task: (taskId: string) => [...contributorsKeys.all, 'task', taskId] as const,
  taskHistory: (taskId: string) => [...contributorsKeys.all, 'history', taskId] as const,
  user: (userId: string) => [...contributorsKeys.all, 'user', userId] as const,
  count: (taskId: string) => [...contributorsKeys.all, 'count', taskId] as const,
  isContributor: (taskId: string, userId: string) =>
    [...contributorsKeys.all, 'is-contributor', taskId, userId] as const,
};

/**
 * Hook to fetch active contributors for a task
 *
 * @description
 * Fetches the list of current (non-removed) contributors for a task.
 * Results are cached with 2-minute stale time for optimal performance.
 *
 * @param taskId - The task UUID to fetch contributors for
 * @returns TanStack Query result with TaskContributor[] array
 *
 * @example
 * // Basic usage
 * const { data: contributors, isLoading } = useTaskContributors('task-123');
 * contributors?.forEach(c => console.log(c.user_id, c.role));
 *
 * @example
 * // Display contributor count
 * const { data: contributors } = useTaskContributors(taskId);
 * <Badge>{contributors?.length || 0} contributors</Badge>
 */
export function useTaskContributors(taskId: string) {
  return useQuery({
    queryKey: contributorsKeys.task(taskId),
    queryFn: () => contributorsAPI.getTaskContributors(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch contributor history for a task (including removed)
 */
export function useContributorHistory(taskId: string) {
  return useQuery({
    queryKey: contributorsKeys.taskHistory(taskId),
    queryFn: () => contributorsAPI.getContributorHistory(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5, // 5 minutes (history changes less frequently)
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch tasks where user is a contributor
 */
export function useUserContributorTasks(userId: string) {
  return useQuery({
    queryKey: contributorsKeys.user(userId),
    queryFn: () => contributorsAPI.getUserContributorTasks(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to get contributor count for a task
 */
export function useContributorCount(taskId: string) {
  return useQuery({
    queryKey: contributorsKeys.count(taskId),
    queryFn: () => contributorsAPI.getContributorCount(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to check if user is a contributor on a task
 */
export function useIsContributor(taskId: string, userId: string) {
  return useQuery({
    queryKey: contributorsKeys.isContributor(taskId, userId),
    queryFn: () => contributorsAPI.isContributor(taskId, userId),
    enabled: !!taskId && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to add a contributor to a task with optimistic updates
 *
 * @description
 * Adds a new contributor to a task with instant UI feedback (<50ms perceived latency).
 * Uses optimistic updates to show the contributor immediately before server responds.
 * Automatically rolls back if the server request fails.
 *
 * The mutation flow:
 * 1. onMutate: Add temporary contributor to cache instantly
 * 2. mutationFn: Send request to server
 * 3. onError: Rollback cache if server fails
 * 4. onSuccess: Replace temp ID with real data, invalidate related queries
 *
 * Invalidates: task contributors, count, history, task detail
 *
 * @param taskId - The task UUID to add contributor to
 * @returns TanStack Mutation for adding contributors
 *
 * @example
 * // Basic usage
 * const { mutate: addContributor } = useAddContributor('task-uuid');
 * addContributor({
 *   user_id: 'user-uuid',
 *   role: 'contributor',
 * });
 *
 * @example
 * // With async/await
 * const { mutateAsync: addContributor } = useAddContributor(taskId);
 * try {
 *   const contributor = await addContributor({
 *     user_id: userId,
 *     role: 'reviewer',
 *   });
 *   console.log('Added:', contributor.id);
 * } catch (error) {
 *   console.error('Failed:', error);
 * }
 *
 * @example
 * // Handle loading state
 * const mutation = useAddContributor(taskId);
 * <Button
 *   onClick={() => mutation.mutate({ user_id: selectedUser, role: 'contributor' })}
 *   disabled={mutation.isPending}
 * >
 *   {mutation.isPending ? 'Adding...' : 'Add Contributor'}
 * </Button>
 */
export function useAddContributor(taskId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddContributorRequest) =>
      contributorsAPI.addContributor(taskId, data),

    // Optimistic update for <50ms perceived latency
    onMutate: async (newContributor) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: contributorsKeys.task(taskId),
      });

      // Snapshot the previous value
      const previousContributors = queryClient.getQueryData<TaskContributor[]>(
        contributorsKeys.task(taskId)
      );

      // Optimistically update the cache
      if (previousContributors) {
        const optimisticContributor: TaskContributor = {
          id: `temp-${Date.now()}`, // Temporary ID
          task_id: taskId,
          user_id: newContributor.user_id,
          role: newContributor.role || 'contributor',
          added_by: '', // Will be filled by server
          added_at: new Date().toISOString(),
          removed_at: null,
          removed_by: null,
        };

        queryClient.setQueryData<TaskContributor[]>(
          contributorsKeys.task(taskId),
          [...previousContributors, optimisticContributor]
        );
      }

      // Return context for rollback
      return { previousContributors };
    },

    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousContributors) {
        queryClient.setQueryData(contributorsKeys.task(taskId), context.previousContributors);
      }

      toast({
        title: t('contributors.add_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },

    onSuccess: (contributor) => {
      // Update cache with server data
      queryClient.setQueryData<TaskContributor[]>(
        contributorsKeys.task(taskId),
        (old) => {
          if (!old) return [contributor];
          // Replace temp ID with real one
          return old.map((c) => (c.id.startsWith('temp-') ? contributor : c));
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: contributorsKeys.count(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.taskHistory(taskId) });
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) });

      toast({
        title: t('contributors.added'),
        description: t('contributors.added_success'),
      });
    },
  });
}

/**
 * Hook to add multiple contributors to a task
 */
export function useAddMultipleContributors(taskId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMultipleContributorsRequest) =>
      contributorsAPI.addMultipleContributors(taskId, data),

    onSuccess: (contributors) => {
      // Invalidate queries to refetch with real data
      queryClient.invalidateQueries({ queryKey: contributorsKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.count(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.taskHistory(taskId) });
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) });

      toast({
        title: t('contributors.added_multiple'),
        description: t('contributors.added_multiple_success', {
          count: contributors.length,
        }),
      });
    },

    onError: (error: any) => {
      toast({
        title: t('contributors.add_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to remove a contributor from a task
 */
export function useRemoveContributor(taskId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => contributorsAPI.removeContributor(taskId, userId),

    // Optimistic update for instant UI feedback
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: contributorsKeys.task(taskId),
      });

      // Snapshot the previous value
      const previousContributors = queryClient.getQueryData<TaskContributor[]>(
        contributorsKeys.task(taskId)
      );

      // Optimistically remove contributor from cache
      if (previousContributors) {
        queryClient.setQueryData<TaskContributor[]>(
          contributorsKeys.task(taskId),
          previousContributors.filter((c) => c.user_id !== userId)
        );
      }

      // Return context for rollback
      return { previousContributors };
    },

    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousContributors) {
        queryClient.setQueryData(contributorsKeys.task(taskId), context.previousContributors);
      }

      toast({
        title: t('contributors.remove_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },

    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: contributorsKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.count(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.taskHistory(taskId) });
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) });

      toast({
        title: t('contributors.removed'),
        description: t('contributors.removed_success'),
      });
    },
  });
}

/**
 * Hook to remove multiple contributors from a task
 */
export function useRemoveMultipleContributors(taskId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) =>
      contributorsAPI.removeMultipleContributors(taskId, userIds),

    onSuccess: (_, userIds) => {
      // Invalidate queries to refetch with real data
      queryClient.invalidateQueries({ queryKey: contributorsKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.count(taskId) });
      queryClient.invalidateQueries({ queryKey: contributorsKeys.taskHistory(taskId) });
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) });

      toast({
        title: t('contributors.removed_multiple'),
        description: t('contributors.removed_multiple_success', {
          count: userIds.length,
        }),
      });
    },

    onError: (error: any) => {
      toast({
        title: t('contributors.remove_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
