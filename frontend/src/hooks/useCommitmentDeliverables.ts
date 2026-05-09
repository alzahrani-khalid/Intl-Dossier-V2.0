/**
 * useCommitmentDeliverables Hooks
 * Feature: Interactive timeline for breaking commitments into trackable milestones
 *
 * TanStack Query hooks for commitment deliverables with:
 * - List queries with automatic refresh
 * - CRUD mutations with cache invalidation
 * - Optimistic updates for status/progress changes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getCommitmentDeliverables,
  createCommitmentDeliverable,
  bulkCreateDeliverables,
  updateCommitmentDeliverable,
  updateDeliverableStatus,
  deleteCommitmentDeliverable,
  getDeliverablesSummary,
} from '@/services/commitment-deliverables.service'
import {
  commitmentDeliverableKeys,
  type CommitmentDeliverable,
  type CreateCommitmentDeliverableInput,
  type UpdateCommitmentDeliverableInput,
  type BulkCreateDeliverablesInput,
  type CommitmentDeliverableStatus,
} from '@/types/commitment-deliverable.types'

// Re-export for convenience
export { commitmentDeliverableKeys }

// ============================================================================
// Query Options
// ============================================================================

export interface UseCommitmentDeliverablesOptions {
  enabled?: boolean
}

// ============================================================================
// List Query Hook
// ============================================================================

/**
 * Hook to fetch all deliverables for a commitment
 *
 * @param commitmentId - UUID of the commitment
 * @param options - Hook options
 * @returns TanStack Query result
 */
export function useCommitmentDeliverables(
  commitmentId: string,
  options?: UseCommitmentDeliverablesOptions,
) {
  const { enabled = true } = options ?? {}

  return useQuery<CommitmentDeliverable[], Error>({
    queryKey: commitmentDeliverableKeys.list(commitmentId),
    queryFn: () => getCommitmentDeliverables(commitmentId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: enabled && !!commitmentId,
  })
}

// ============================================================================
// Single Deliverable Query Hook
// ============================================================================

// ============================================================================
// Progress Query Hook
// ============================================================================

// ============================================================================
// Has Deliverables Query Hook
// ============================================================================

// ============================================================================
// Summary Query Hook
// ============================================================================

/**
 * Hook to get deliverables summary stats
 *
 * @param commitmentId - UUID of the commitment
 * @param options - Hook options
 * @returns TanStack Query result
 */
export function useDeliverablesSummary(
  commitmentId: string,
  options?: UseCommitmentDeliverablesOptions,
) {
  const { enabled = true } = options ?? {}

  return useQuery({
    queryKey: [...commitmentDeliverableKeys.list(commitmentId), 'summary'],
    queryFn: () => getDeliverablesSummary(commitmentId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: enabled && !!commitmentId,
  })
}

// ============================================================================
// Create Mutation Hook
// ============================================================================

/**
 * Hook to create a new deliverable
 *
 * @returns TanStack Mutation result
 */
export function useCreateDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('commitment-deliverables')

  return useMutation<CommitmentDeliverable, Error, CreateCommitmentDeliverableInput>({
    mutationFn: createCommitmentDeliverable,
    onSuccess: (data) => {
      // Invalidate list queries to refetch with new item
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.list(data.commitment_id),
      })
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.progress(data.commitment_id),
      })
      toast.success(t('messages.createSuccess'))
    },
    onError: (error) => {
      toast.error(t('messages.createError'))
      console.error('Create deliverable error:', error)
    },
  })
}

// ============================================================================
// Bulk Create Mutation Hook
// ============================================================================

/**
 * Hook to bulk create deliverables from template
 *
 * @returns TanStack Mutation result
 */
export function useBulkCreateDeliverables() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('commitment-deliverables')

  return useMutation<CommitmentDeliverable[], Error, BulkCreateDeliverablesInput>({
    mutationFn: bulkCreateDeliverables,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.list(variables.commitment_id),
      })
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.progress(variables.commitment_id),
      })
      toast.success(t('messages.bulkCreateSuccess', { count: data.length }))
    },
    onError: (error) => {
      toast.error(t('messages.createError'))
      console.error('Bulk create deliverables error:', error)
    },
  })
}

// ============================================================================
// Update Mutation Hook
// ============================================================================

interface UpdateDeliverableInput {
  deliverableId: string
  commitmentId: string
  input: UpdateCommitmentDeliverableInput
}

/**
 * Hook to update an existing deliverable
 *
 * @returns TanStack Mutation result
 */
export function useUpdateDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('commitment-deliverables')

  return useMutation<CommitmentDeliverable, Error, UpdateDeliverableInput>({
    mutationFn: ({ deliverableId, input }) => updateCommitmentDeliverable(deliverableId, input),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(commitmentDeliverableKeys.detail(data.id), data)
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.list(variables.commitmentId),
      })
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.progress(variables.commitmentId),
      })
      toast.success(t('messages.updateSuccess'))
    },
    onError: (error) => {
      toast.error(t('messages.updateError'))
      console.error('Update deliverable error:', error)
    },
  })
}

// ============================================================================
// Status Update Mutation Hook (with Optimistic Updates)
// ============================================================================

interface UpdateStatusInput {
  deliverableId: string
  commitmentId: string
  status: CommitmentDeliverableStatus
}

/**
 * Hook to update deliverable status with optimistic updates
 *
 * @returns TanStack Mutation result
 */
export function useUpdateDeliverableStatus() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('commitment-deliverables')

  return useMutation<
    CommitmentDeliverable,
    Error,
    UpdateStatusInput,
    { previous: CommitmentDeliverable[] | undefined }
  >({
    mutationFn: ({ deliverableId, status }) => updateDeliverableStatus(deliverableId, status),

    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: commitmentDeliverableKeys.list(input.commitmentId),
      })

      const previous = queryClient.getQueryData<CommitmentDeliverable[]>(
        commitmentDeliverableKeys.list(input.commitmentId),
      )

      // Optimistic update
      queryClient.setQueryData<CommitmentDeliverable[]>(
        commitmentDeliverableKeys.list(input.commitmentId),
        (old) =>
          old?.map((d) =>
            d.id === input.deliverableId
              ? {
                  ...d,
                  status: input.status,
                  progress: input.status === 'completed' ? 100 : d.progress,
                  completed_at: input.status === 'completed' ? new Date().toISOString() : null,
                }
              : d,
          ),
      )

      return { previous }
    },

    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          commitmentDeliverableKeys.list(variables.commitmentId),
          context.previous,
        )
      }
      toast.error(t('messages.statusUpdateError'))
      console.error('Status update error:', error)
    },

    onSuccess: (data, variables) => {
      queryClient.setQueryData(commitmentDeliverableKeys.detail(data.id), data)
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.progress(variables.commitmentId),
      })
      toast.success(t('messages.statusUpdated'))
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.list(variables.commitmentId),
      })
    },
  })
}

// ============================================================================
// Delete Mutation Hook
// ============================================================================

interface DeleteDeliverableInput {
  deliverableId: string
  commitmentId: string
}

/**
 * Hook to delete a deliverable
 *
 * @returns TanStack Mutation result
 */
export function useDeleteDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('commitment-deliverables')

  return useMutation<void, Error, DeleteDeliverableInput>({
    mutationFn: ({ deliverableId }) => deleteCommitmentDeliverable(deliverableId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.list(variables.commitmentId),
      })
      queryClient.invalidateQueries({
        queryKey: commitmentDeliverableKeys.progress(variables.commitmentId),
      })
      toast.success(t('messages.deleteSuccess'))
    },
    onError: (error) => {
      toast.error(t('messages.deleteError'))
      console.error('Delete deliverable error:', error)
    },
  })
}
