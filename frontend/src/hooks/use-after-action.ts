/**
 * TanStack Query Hooks for After-Action Operations
 * Feature: 022-after-action-structured
 *
 * Custom hooks for managing after-action data with caching, optimistic updates, and error handling.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type {
  AfterActionRecord,
  AfterActionCreateInput,
  AfterActionUpdateInput,
  EditRequestInput,
  EditApprovalInput,
} from '../../../backend/src/types/after-action.types';
import afterActionAPI, {
  type AfterActionListFilters,
  type AfterActionListResponse,
  type PublishResponse,
  AfterActionAPIError,
} from '../services/after-action-api';

/**
 * Query Keys
 */
export const afterActionKeys = {
  all: ['after-actions'] as const,
  lists: () => [...afterActionKeys.all, 'list'] as const,
  list: (filters: AfterActionListFilters) => [...afterActionKeys.lists(), filters] as const,
  details: () => [...afterActionKeys.all, 'detail'] as const,
  detail: (id: string) => [...afterActionKeys.details(), id] as const,
};

/**
 * Hook: List after-actions for a dossier
 */
export function useAfterActionList(
  filters: AfterActionListFilters,
  options?: Omit<UseQueryOptions<AfterActionListResponse, AfterActionAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: afterActionKeys.list(filters),
    queryFn: () => afterActionAPI.list(filters),
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook: Get single after-action details
 */
export function useAfterActionDetail(
  id: string,
  includeAttachments = true,
  includeVersionHistory = false,
  options?: Omit<UseQueryOptions<AfterActionRecord, AfterActionAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: afterActionKeys.detail(id),
    queryFn: () => afterActionAPI.get(id, includeAttachments, includeVersionHistory),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

/**
 * Hook: Create after-action record
 */
export function useCreateAfterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AfterActionCreateInput) => afterActionAPI.create(data),
    onSuccess: (newRecord) => {
      // Invalidate list queries for the dossier
      queryClient.invalidateQueries({
        queryKey: afterActionKeys.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as AfterActionListFilters;
          return filters?.dossier_id === newRecord.dossier_id;
        },
      });

      // Add to cache
      queryClient.setQueryData(afterActionKeys.detail(newRecord.id!), newRecord);
    },
    onError: (error: AfterActionAPIError) => {
      console.error('Failed to create after-action:', error.message, error.details);
    },
  });
}

/**
 * Hook: Update after-action draft
 */
export function useUpdateAfterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AfterActionUpdateInput }) =>
      afterActionAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: afterActionKeys.detail(id) });

      // Snapshot previous value
      const previousRecord = queryClient.getQueryData<AfterActionRecord>(
        afterActionKeys.detail(id)
      );

      // Optimistically update
      if (previousRecord) {
        queryClient.setQueryData<AfterActionRecord>(afterActionKeys.detail(id), {
          ...previousRecord,
          ...data,
          _version: previousRecord._version + 1,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousRecord };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousRecord) {
        queryClient.setQueryData(afterActionKeys.detail(id), context.previousRecord);
      }
      console.error('Failed to update after-action:', error.message);
    },
    onSuccess: (updatedRecord) => {
      // Update cache with server response
      queryClient.setQueryData(afterActionKeys.detail(updatedRecord.id!), updatedRecord);

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: afterActionKeys.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as AfterActionListFilters;
          return filters?.dossier_id === updatedRecord.dossier_id;
        },
      });
    },
  });
}

/**
 * Hook: Publish after-action
 */
export function usePublishAfterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      version,
      sendNotifications = true,
    }: {
      id: string;
      version: number;
      sendNotifications?: boolean;
    }) => afterActionAPI.publish(id, version, sendNotifications),
    onSuccess: (response, { id }) => {
      // Update detail cache
      queryClient.setQueryData(afterActionKeys.detail(id), response.after_action);

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: afterActionKeys.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as AfterActionListFilters;
          return filters?.dossier_id === response.after_action.dossier_id;
        },
      });

      // Invalidate task lists (tasks were created)
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: AfterActionAPIError) => {
      console.error('Failed to publish after-action:', error.message, error.details);
    },
  });
}

/**
 * Hook: Request edit for published record
 */
export function useRequestEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditRequestInput }) =>
      afterActionAPI.requestEdit(id, data),
    onSuccess: (response, { id }) => {
      // Update detail cache with new status
      queryClient.setQueryData(afterActionKeys.detail(id), response.after_action);

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: afterActionKeys.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as AfterActionListFilters;
          return filters?.dossier_id === response.after_action.dossier_id;
        },
      });
    },
    onError: (error: AfterActionAPIError) => {
      console.error('Failed to request edit:', error.message);
    },
  });
}

/**
 * Hook: Approve/reject edit request (supervisor)
 */
export function useApproveEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditApprovalInput }) =>
      afterActionAPI.approveEdit(id, data),
    onSuccess: (response, { id }) => {
      // Update detail cache
      queryClient.setQueryData(afterActionKeys.detail(id), response.after_action);

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: afterActionKeys.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as AfterActionListFilters;
          return filters?.dossier_id === response.after_action.dossier_id;
        },
      });
    },
    onError: (error: AfterActionAPIError) => {
      console.error('Failed to approve/reject edit:', error.message);
    },
  });
}

/**
 * Hook: Delete after-action draft
 */
export function useDeleteAfterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => afterActionAPI.delete(id),
    onSuccess: (_data, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: afterActionKeys.detail(id) });

      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: afterActionKeys.lists() });
    },
    onError: (error: AfterActionAPIError) => {
      console.error('Failed to delete after-action:', error.message);
    },
  });
}

/**
 * Hook: Auto-save draft (debounced)
 */
export function useAutoSave(id: string, debounceMs = 30000) {
  const { mutate: updateAfterAction } = useUpdateAfterAction();
  let timeoutId: NodeJS.Timeout | null = null;

  const autoSave = (data: AfterActionUpdateInput) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      updateAfterAction({ id, data });
    }, debounceMs);
  };

  return { autoSave };
}

/**
 * Export all hooks
 */
export default {
  useAfterActionList,
  useAfterActionDetail,
  useCreateAfterAction,
  useUpdateAfterAction,
  usePublishAfterAction,
  useRequestEdit,
  useApproveEdit,
  useDeleteAfterAction,
  useAutoSave,
};
