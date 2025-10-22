/**
 * Task Contributors Hook
 * Part of: 025-unified-tasks-model implementation
 * Task: T024
 *
 * TanStack Query hooks for contributor operations with:
 * - Optimistic updates for instant UI feedback
 * - Team collaboration tracking
 * - Contributor history and audit trail
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
 * Query keys for cache management
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
 * Hook to fetch contributors for a task
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
 * Hook to add a contributor to a task
 * Includes optimistic updates for instant UI feedback
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
