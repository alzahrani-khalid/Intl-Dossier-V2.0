/**
 * useDeliverables Hooks
 * Feature: commitment-deliverables
 *
 * TanStack Query hooks for MoU deliverable CRUD operations with:
 * - Pagination support
 * - Optimistic updates for status changes
 * - Bulk operations
 * - Milestone management
 * - Health score tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import {
  deliverableKeys,
  type Deliverable,
  type DeliverableWithRelations,
  type DeliverableFilters,
  type CreateDeliverableInput,
  type UpdateDeliverableInput,
  type Milestone,
  type CreateMilestoneInput,
  type UpdateMilestoneInput,
  type DeliverableStatusHistory,
  type DeliverableDocument,
  type MouDeliverablesHealth,
  type DeliverableStatus,
  type BulkStatusUpdateResponse,
} from '@/types/deliverable.types'

// Re-export for convenience
export { deliverableKeys }

// ============================================================================
// Types
// ============================================================================

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface UseDeliverablesOptions extends DeliverableFilters {
  enabled?: boolean
  page?: number
  limit?: number
}

export interface UseDeliverableOptions {
  enabled?: boolean
}

// ============================================================================
// API Functions
// ============================================================================

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

async function fetchDeliverables(
  filters?: DeliverableFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<DeliverableWithRelations>> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  if (filters?.mouId) params.append('mou_id', filters.mouId)
  if (filters?.status?.length) params.append('status', filters.status.join(','))
  if (filters?.priority?.length) params.append('priority', filters.priority.join(','))
  if (filters?.responsibleUserId) params.append('responsible_user_id', filters.responsibleUserId)
  if (filters?.overdue) params.append('overdue', 'true')
  if (filters?.search) params.append('search', filters.search)
  params.append('page', String(page))
  params.append('limit', String(limit))

  const response = await fetch(`${FUNCTIONS_URL}/deliverables?${params}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch deliverables')
  }

  return response.json()
}

async function fetchDeliverable(id: string): Promise<DeliverableWithRelations> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${id}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch deliverable')
  }

  return response.json()
}

async function createDeliverable(input: CreateDeliverableInput): Promise<Deliverable> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create deliverable')
  }

  return response.json()
}

async function updateDeliverable(id: string, input: UpdateDeliverableInput): Promise<Deliverable> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update deliverable')
  }

  return response.json()
}

async function deleteDeliverable(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete deliverable')
  }
}

async function bulkUpdateStatus(
  deliverableIds: string[],
  status: DeliverableStatus,
  notes?: string,
): Promise<BulkStatusUpdateResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/bulk-status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ deliverable_ids: deliverableIds, status, notes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to bulk update status')
  }

  return response.json()
}

async function fetchMouHealth(mouId: string): Promise<MouDeliverablesHealth | null> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/health?mou_id=${mouId}`, {
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch MoU health')
  }

  return response.json()
}

async function fetchMilestones(deliverableId: string): Promise<Milestone[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${deliverableId}/milestones`, {
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch milestones')
  }

  return response.json()
}

async function createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${input.deliverable_id}/milestones`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create milestone')
  }

  return response.json()
}

async function updateMilestone(
  deliverableId: string,
  milestoneId: string,
  input: UpdateMilestoneInput,
): Promise<Milestone> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${FUNCTIONS_URL}/deliverables/${deliverableId}/milestones/${milestoneId}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update milestone')
  }

  return response.json()
}

async function deleteMilestone(deliverableId: string, milestoneId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${FUNCTIONS_URL}/deliverables/${deliverableId}/milestones/${milestoneId}`,
    {
      method: 'DELETE',
      headers,
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete milestone')
  }
}

async function fetchStatusHistory(deliverableId: string): Promise<DeliverableStatusHistory[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${deliverableId}/history`, {
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch status history')
  }

  return response.json()
}

async function fetchDocuments(deliverableId: string): Promise<DeliverableDocument[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/deliverables/${deliverableId}/documents`, {
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch documents')
  }

  return response.json()
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch deliverables list with pagination
 */
export function useDeliverables(options?: UseDeliverablesOptions) {
  const { enabled = true, page = 1, limit = 20, ...filters } = options ?? {}

  return useQuery<PaginatedResponse<DeliverableWithRelations>, Error>({
    queryKey: [...deliverableKeys.list(filters), page, limit],
    queryFn: () => fetchDeliverables(filters, page, limit),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  })
}

/**
 * Hook to fetch deliverables for a specific MoU
 */
export function useMouDeliverables(mouId: string, options?: Omit<UseDeliverablesOptions, 'mouId'>) {
  return useDeliverables({ ...options, mouId, enabled: options?.enabled !== false && !!mouId })
}

/**
 * Hook to fetch a single deliverable by ID
 */
export function useDeliverable(deliverableId: string, options?: UseDeliverableOptions) {
  const { enabled = true } = options ?? {}

  return useQuery<DeliverableWithRelations, Error>({
    queryKey: deliverableKeys.detail(deliverableId),
    queryFn: () => fetchDeliverable(deliverableId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!deliverableId,
  })
}

/**
 * Hook to fetch MoU deliverables health summary
 */
export function useMouDeliverablesHealth(mouId: string) {
  return useQuery<MouDeliverablesHealth | null, Error>({
    queryKey: deliverableKeys.health(mouId),
    queryFn: () => fetchMouHealth(mouId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!mouId,
  })
}

/**
 * Hook to fetch milestones for a deliverable
 */
export function useMilestones(deliverableId: string) {
  return useQuery<Milestone[], Error>({
    queryKey: deliverableKeys.milestones(deliverableId),
    queryFn: () => fetchMilestones(deliverableId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!deliverableId,
  })
}

/**
 * Hook to fetch status history for a deliverable
 */
export function useDeliverableStatusHistory(deliverableId: string) {
  return useQuery<DeliverableStatusHistory[], Error>({
    queryKey: deliverableKeys.history(deliverableId),
    queryFn: () => fetchStatusHistory(deliverableId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!deliverableId,
  })
}

/**
 * Hook to fetch documents for a deliverable
 */
export function useDeliverableDocuments(deliverableId: string) {
  return useQuery<DeliverableDocument[], Error>({
    queryKey: deliverableKeys.documents(deliverableId),
    queryFn: () => fetchDocuments(deliverableId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!deliverableId,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new deliverable
 */
export function useCreateDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<Deliverable, Error, CreateDeliverableInput>({
    mutationFn: createDeliverable,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
      if (data.mou_id) {
        queryClient.invalidateQueries({ queryKey: deliverableKeys.byMou(data.mou_id) })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.health(data.mou_id) })
      }
      toast.success(t('success.created', 'Deliverable created successfully'))
    },
    onError: (error) => {
      toast.error(t('errors.createFailed', 'Failed to create deliverable'))
      console.error('Create deliverable error:', error)
    },
  })
}

/**
 * Hook to update an existing deliverable
 */
export function useUpdateDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<Deliverable, Error, { deliverableId: string; input: UpdateDeliverableInput }>({
    mutationFn: ({ deliverableId, input }) => updateDeliverable(deliverableId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(deliverableKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
      if (data.mou_id) {
        queryClient.invalidateQueries({ queryKey: deliverableKeys.byMou(data.mou_id) })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.health(data.mou_id) })
      }
      toast.success(t('success.updated', 'Deliverable updated successfully'))
    },
    onError: (error) => {
      toast.error(t('errors.updateFailed', 'Failed to update deliverable'))
      console.error('Update deliverable error:', error)
    },
  })
}

/**
 * Hook to delete a deliverable
 */
export function useDeleteDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<void, Error, { deliverableId: string; mouId?: string }>({
    mutationFn: ({ deliverableId }) => deleteDeliverable(deliverableId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
      if (variables.mouId) {
        queryClient.invalidateQueries({ queryKey: deliverableKeys.byMou(variables.mouId) })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.health(variables.mouId) })
      }
      toast.success(t('success.deleted', 'Deliverable deleted successfully'))
    },
    onError: (error) => {
      toast.error(t('errors.deleteFailed', 'Failed to delete deliverable'))
      console.error('Delete deliverable error:', error)
    },
  })
}

/**
 * Hook to update deliverable status with optimistic updates
 */
export function useUpdateDeliverableStatus() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<
    Deliverable,
    Error,
    { deliverableId: string; status: DeliverableStatus; notes?: string; mouId?: string },
    { previous: unknown }
  >({
    mutationFn: ({ deliverableId, status, notes }) =>
      updateDeliverable(deliverableId, { status, completion_notes: notes }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: deliverableKeys.lists() })

      const previous = queryClient.getQueryData(deliverableKeys.lists())

      // Optimistic update
      queryClient.setQueriesData<PaginatedResponse<DeliverableWithRelations>>(
        { queryKey: deliverableKeys.lists() },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((d) =>
              d.id === input.deliverableId
                ? { ...d, status: input.status, updated_at: new Date().toISOString() }
                : d,
            ),
          }
        },
      )

      return { previous }
    },

    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(deliverableKeys.lists(), context.previous)
      }
      toast.error(t('errors.statusUpdateFailed', 'Failed to update status'))
      console.error('Status update error:', error)
    },

    onSuccess: (data, variables) => {
      queryClient.setQueryData(deliverableKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: deliverableKeys.history(data.id) })
      if (variables.mouId) {
        queryClient.invalidateQueries({ queryKey: deliverableKeys.health(variables.mouId) })
      }
      toast.success(t('status.updated', 'Status updated successfully'))
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
    },
  })
}

/**
 * Hook for bulk status update
 */
export function useBulkUpdateDeliverableStatus() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<
    BulkStatusUpdateResponse,
    Error,
    { deliverableIds: string[]; status: DeliverableStatus; notes?: string; mouId?: string }
  >({
    mutationFn: ({ deliverableIds, status, notes }) =>
      bulkUpdateStatus(deliverableIds, status, notes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliverableKeys.lists() })
      if (variables.mouId) {
        queryClient.invalidateQueries({ queryKey: deliverableKeys.byMou(variables.mouId) })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.health(variables.mouId) })
      }
      toast.success(
        t('success.bulkUpdated', '{{count}} deliverables updated', {
          count: data.updated_count,
        }),
      )
    },
    onError: (error) => {
      toast.error(t('errors.bulkUpdateFailed', 'Failed to update deliverables'))
      console.error('Bulk update error:', error)
    },
  })
}

// ============================================================================
// Milestone Mutation Hooks
// ============================================================================

/**
 * Hook to create a new milestone
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<Milestone, Error, CreateMilestoneInput>({
    mutationFn: createMilestone,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: deliverableKeys.milestones(variables.deliverable_id),
      })
      queryClient.invalidateQueries({
        queryKey: deliverableKeys.detail(variables.deliverable_id),
      })
      toast.success(t('milestones.created', 'Milestone created successfully'))
    },
    onError: (error) => {
      toast.error(t('milestones.createFailed', 'Failed to create milestone'))
      console.error('Create milestone error:', error)
    },
  })
}

/**
 * Hook to update a milestone
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<
    Milestone,
    Error,
    { deliverableId: string; milestoneId: string; input: UpdateMilestoneInput }
  >({
    mutationFn: ({ deliverableId, milestoneId, input }) =>
      updateMilestone(deliverableId, milestoneId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: deliverableKeys.milestones(variables.deliverableId),
      })
      queryClient.invalidateQueries({
        queryKey: deliverableKeys.detail(variables.deliverableId),
      })
      toast.success(t('milestones.updated', 'Milestone updated successfully'))
    },
    onError: (error) => {
      toast.error(t('milestones.updateFailed', 'Failed to update milestone'))
      console.error('Update milestone error:', error)
    },
  })
}

/**
 * Hook to delete a milestone
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('deliverables')

  return useMutation<void, Error, { deliverableId: string; milestoneId: string }>({
    mutationFn: ({ deliverableId, milestoneId }) => deleteMilestone(deliverableId, milestoneId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: deliverableKeys.milestones(variables.deliverableId),
      })
      queryClient.invalidateQueries({
        queryKey: deliverableKeys.detail(variables.deliverableId),
      })
      toast.success(t('milestones.deleted', 'Milestone deleted successfully'))
    },
    onError: (error) => {
      toast.error(t('milestones.deleteFailed', 'Failed to delete milestone'))
      console.error('Delete milestone error:', error)
    },
  })
}
