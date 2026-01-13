/**
 * Data Retention Policies Hook
 * Feature: data-retention-policies
 *
 * TanStack Query hooks for data retention policy management:
 * - List/create/update retention policies
 * - Manage legal holds
 * - View retention statistics
 * - Execute retention processor
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  RetentionPolicy,
  RetentionPolicyInput,
  RetentionPolicyFilters,
  RetentionPolicyListResponse,
  RetentionPolicyResponse,
  LegalHold,
  LegalHoldInput,
  LegalHoldFilters,
  LegalHoldListResponse,
  LegalHoldResponse,
  RetentionStatistics,
  RetentionStatisticsResponse,
  PendingRetentionAction,
  PendingActionsResponse,
  PendingActionsFilters,
  ExpiringEntity,
  ExpiringEntitiesResponse,
  ExpiringEntitiesFilters,
  RetentionExecutionLog,
  ExecutionLogResponse,
  ProcessorConfig,
  ProcessorResultResponse,
  RetentionEntityType,
  DocumentClass,
} from '@/types/retention-policy.types'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ============================================================================
// Query Keys
// ============================================================================

export const retentionPolicyKeys = {
  all: ['retention-policies'] as const,
  policies: () => [...retentionPolicyKeys.all, 'policies'] as const,
  policyList: (filters?: RetentionPolicyFilters) =>
    [...retentionPolicyKeys.policies(), filters] as const,
  policyDetail: (id: string) => [...retentionPolicyKeys.policies(), 'detail', id] as const,
  legalHolds: () => [...retentionPolicyKeys.all, 'legal-holds'] as const,
  legalHoldList: (filters?: LegalHoldFilters) =>
    [...retentionPolicyKeys.legalHolds(), filters] as const,
  legalHoldDetail: (id: string) => [...retentionPolicyKeys.legalHolds(), 'detail', id] as const,
  statistics: () => [...retentionPolicyKeys.all, 'statistics'] as const,
  pendingActions: (filters?: PendingActionsFilters) =>
    [...retentionPolicyKeys.all, 'pending', filters] as const,
  expiring: (filters?: ExpiringEntitiesFilters) =>
    [...retentionPolicyKeys.all, 'expiring', filters] as const,
  executionLog: () => [...retentionPolicyKeys.all, 'execution-log'] as const,
}

// ============================================================================
// Auth Helper
// ============================================================================

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// ============================================================================
// Retention Policies Hooks
// ============================================================================

/**
 * Hook to list retention policies
 */
export function useRetentionPolicies(
  filters?: RetentionPolicyFilters,
  options?: Omit<UseQueryOptions<RetentionPolicy[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.policyList(filters),
    queryFn: async (): Promise<RetentionPolicy[]> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (filters?.status) searchParams.set('status', filters.status)
      if (filters?.entity_type) searchParams.set('entity_type', filters.entity_type)
      if (filters?.document_class) searchParams.set('document_class', filters.document_class)

      const response = await fetch(`${API_BASE_URL}/data-retention/policies?${searchParams}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch retention policies')
      }

      const result: RetentionPolicyListResponse = await response.json()
      return result.data
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

/**
 * Hook to get a single retention policy
 */
export function useRetentionPolicy(
  id: string,
  options?: Omit<UseQueryOptions<RetentionPolicy, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.policyDetail(id),
    queryFn: async (): Promise<RetentionPolicy> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/policies/${id}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch retention policy')
      }

      const result: RetentionPolicyResponse = await response.json()
      return result.data
    },
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  })
}

/**
 * Hook to create a retention policy
 */
export function useCreateRetentionPolicy() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (data: RetentionPolicyInput): Promise<RetentionPolicy> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/policies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to create retention policy')
      }

      const result: RetentionPolicyResponse = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.policies() })
      toast.success(t('messages.policyCreated', { name: data.name_en }))
    },
    onError: (error: Error) => {
      toast.error(t('messages.policyCreateError', { error: error.message }))
    },
  })
}

/**
 * Hook to update a retention policy
 */
export function useUpdateRetentionPolicy() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<RetentionPolicyInput>
    }): Promise<RetentionPolicy> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/policies/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update retention policy')
      }

      const result: RetentionPolicyResponse = await response.json()
      return result.data
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(retentionPolicyKeys.policyDetail(id), data)
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.policies() })
      toast.success(t('messages.policyUpdated'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.policyUpdateError', { error: error.message }))
    },
  })
}

/**
 * Hook to archive (soft delete) a retention policy
 */
export function useArchiveRetentionPolicy() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/policies/${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to archive retention policy')
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: retentionPolicyKeys.policyDetail(id) })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.policies() })
      toast.success(t('messages.policyArchived'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.policyArchiveError', { error: error.message }))
    },
  })
}

// ============================================================================
// Legal Holds Hooks
// ============================================================================

/**
 * Hook to list legal holds
 */
export function useLegalHolds(
  filters?: LegalHoldFilters,
  options?: Omit<UseQueryOptions<LegalHold[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.legalHoldList(filters),
    queryFn: async (): Promise<LegalHold[]> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (filters?.status) searchParams.set('status', filters.status)

      const response = await fetch(`${API_BASE_URL}/data-retention/legal-holds?${searchParams}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch legal holds')
      }

      const result: LegalHoldListResponse = await response.json()
      return result.data
    },
    staleTime: 60_000,
    ...options,
  })
}

/**
 * Hook to get a single legal hold
 */
export function useLegalHold(
  id: string,
  options?: Omit<UseQueryOptions<LegalHold, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.legalHoldDetail(id),
    queryFn: async (): Promise<LegalHold> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/legal-holds/${id}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch legal hold')
      }

      const result: LegalHoldResponse = await response.json()
      return result.data
    },
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  })
}

/**
 * Hook to create a legal hold
 */
export function useCreateLegalHold() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (data: LegalHoldInput): Promise<LegalHold> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/legal-holds`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to create legal hold')
      }

      const result: LegalHoldResponse = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.legalHolds() })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.statistics() })
      toast.success(t('messages.legalHoldCreated', { name: data.name_en }))
    },
    onError: (error: Error) => {
      toast.error(t('messages.legalHoldCreateError', { error: error.message }))
    },
  })
}

/**
 * Hook to update a legal hold
 */
export function useUpdateLegalHold() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<LegalHoldInput>
    }): Promise<LegalHold> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/legal-holds/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update legal hold')
      }

      const result: LegalHoldResponse = await response.json()
      return result.data
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(retentionPolicyKeys.legalHoldDetail(id), data)
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.legalHolds() })
      toast.success(t('messages.legalHoldUpdated'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.legalHoldUpdateError', { error: error.message }))
    },
  })
}

/**
 * Hook to release a legal hold
 */
export function useReleaseLegalHold() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (id: string): Promise<{ affected_count: number }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/release-hold`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ legal_hold_id: id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to release legal hold')
      }

      return response.json()
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.legalHoldDetail(id) })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.legalHolds() })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.statistics() })
      toast.success(t('messages.legalHoldReleased', { count: data.affected_count }))
    },
    onError: (error: Error) => {
      toast.error(t('messages.legalHoldReleaseError', { error: error.message }))
    },
  })
}

/**
 * Hook to delete a legal hold (only if not active)
 */
export function useDeleteLegalHold() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/legal-holds/${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to delete legal hold')
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: retentionPolicyKeys.legalHoldDetail(id) })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.legalHolds() })
      toast.success(t('messages.legalHoldDeleted'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.legalHoldDeleteError', { error: error.message }))
    },
  })
}

// ============================================================================
// Statistics & Status Hooks
// ============================================================================

/**
 * Hook to get retention statistics
 */
export function useRetentionStatistics(
  options?: Omit<UseQueryOptions<RetentionStatistics[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.statistics(),
    queryFn: async (): Promise<RetentionStatistics[]> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/statistics`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch retention statistics')
      }

      const result: RetentionStatisticsResponse = await response.json()
      return result.data
    },
    staleTime: 30_000,
    ...options,
  })
}

/**
 * Hook to get pending retention actions
 */
export function usePendingRetentionActions(
  filters?: PendingActionsFilters,
  options?: Omit<UseQueryOptions<PendingRetentionAction[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.pendingActions(filters),
    queryFn: async (): Promise<PendingRetentionAction[]> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (filters?.entity_type) searchParams.set('entity_type', filters.entity_type)
      if (filters?.action) searchParams.set('action', filters.action)
      if (filters?.limit) searchParams.set('limit', String(filters.limit))

      const response = await fetch(
        `${API_BASE_URL}/data-retention/pending-actions?${searchParams}`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch pending actions')
      }

      const result: PendingActionsResponse = await response.json()
      return result.data
    },
    staleTime: 30_000,
    ...options,
  })
}

/**
 * Hook to get expiring entities
 */
export function useExpiringEntities(
  filters?: ExpiringEntitiesFilters,
  options?: Omit<UseQueryOptions<ExpiringEntity[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.expiring(filters),
    queryFn: async (): Promise<ExpiringEntity[]> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (filters?.days) searchParams.set('days', String(filters.days))
      if (filters?.entity_type) searchParams.set('entity_type', filters.entity_type)
      if (filters?.limit) searchParams.set('limit', String(filters.limit))

      const response = await fetch(`${API_BASE_URL}/data-retention/expiring?${searchParams}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch expiring entities')
      }

      const result: ExpiringEntitiesResponse = await response.json()
      return result.data
    },
    staleTime: 30_000,
    ...options,
  })
}

/**
 * Hook to get execution log
 */
export function useRetentionExecutionLog(
  options?: Omit<UseQueryOptions<RetentionExecutionLog[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: retentionPolicyKeys.executionLog(),
    queryFn: async (): Promise<RetentionExecutionLog[]> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/execution-log`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch execution log')
      }

      const result: ExecutionLogResponse = await response.json()
      return result.data
    },
    staleTime: 60_000,
    ...options,
  })
}

// ============================================================================
// Processor Hooks
// ============================================================================

/**
 * Hook to run the retention processor
 */
export function useRunRetentionProcessor() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (config: ProcessorConfig): Promise<ProcessorResultResponse['data']> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/retention-processor`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to run retention processor')
      }

      const result: ProcessorResultResponse = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.statistics() })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.pendingActions() })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.expiring() })
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.executionLog() })

      const isDryRun =
        data.items_archived === 0 &&
        data.items_deleted === 0 &&
        data.items_anonymized === 0 &&
        data.items_processed > 0

      if (isDryRun) {
        toast.info(
          t('messages.dryRunComplete', {
            processed: data.items_processed,
            archived: data.items_archived,
            deleted: data.items_deleted,
          }),
        )
      } else {
        toast.success(
          t('messages.processorComplete', {
            processed: data.items_processed,
            archived: data.items_archived,
            deleted: data.items_deleted,
            warned: data.items_warned,
          }),
        )
      }
    },
    onError: (error: Error) => {
      toast.error(t('messages.processorError', { error: error.message }))
    },
  })
}

/**
 * Hook to apply retention policy to specific entity
 */
export function useApplyRetentionPolicy() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (params: {
      entity_type: RetentionEntityType
      entity_id: string
      document_class?: DocumentClass
      sensitivity_level?: number
      dossier_type?: string
    }): Promise<{ status_id: string }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/apply-policy`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to apply retention policy')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.statistics() })
      toast.success(t('messages.policyApplied'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.policyApplyError', { error: error.message }))
    },
  })
}

/**
 * Hook to set manual hold on entity
 */
export function useSetManualHold() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('retention-policies')

  return useMutation({
    mutationFn: async (params: {
      entity_type: RetentionEntityType
      entity_id: string
      reason: string
      until?: string
    }): Promise<{ data: unknown }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/data-retention/manual-hold`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to set manual hold')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.statistics() })
      toast.success(t('messages.manualHoldSet'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.manualHoldError', { error: error.message }))
    },
  })
}

// ============================================================================
// Cache Invalidation Helper
// ============================================================================

/**
 * Hook to invalidate all retention policy queries
 */
export function useInvalidateRetentionPolicies() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: retentionPolicyKeys.all })
  }
}
