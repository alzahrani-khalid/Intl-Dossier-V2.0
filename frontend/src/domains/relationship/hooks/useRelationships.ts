/**
 * Relationship Context - React Query Hooks
 *
 * TanStack Query hooks for relationship operations.
 * These hooks provide the primary interface for React components
 * to interact with the relationship domain.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isOk, isDomainError } from '@/domains/shared'
import { relationshipService } from '../services/relationship.service'
import type {
  RelationshipWithDossiers,
  RelationshipCreate,
  RelationshipUpdate,
  RelationshipFilters,
} from '../types/relationship'
import type {
  RelationshipHealthScore,
  HealthScoreListParams,
  AlertListParams,
  HealthScoreListResponse,
  HealthHistoryListResponse,
  AlertListResponse,
  CalculationResultResponse,
} from '../types/health'
import type { RelationshipListResponse } from '../repositories/relationship.repository'

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for relationships
 */
export const relationshipKeys = {
  all: ['relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (filters?: RelationshipFilters) => [...relationshipKeys.lists(), filters] as const,
  details: () => [...relationshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...relationshipKeys.details(), id] as const,
  forDossier: (dossierId: string) => [...relationshipKeys.all, 'forDossier', dossierId] as const,
  byType: (dossierId: string, type: string) =>
    [...relationshipKeys.forDossier(dossierId), type] as const,
  // Health scoring
  health: () => [...relationshipKeys.all, 'health'] as const,
  healthScore: (relationshipId: string) => [...relationshipKeys.health(), relationshipId] as const,
  healthScores: (params?: HealthScoreListParams) =>
    [...relationshipKeys.health(), 'list', params] as const,
  healthHistory: (relationshipId: string) =>
    [...relationshipKeys.health(), 'history', relationshipId] as const,
  alerts: (relationshipId: string) =>
    [...relationshipKeys.health(), 'alerts', relationshipId] as const,
}

// ============================================================================
// Relationship CRUD Hooks
// ============================================================================

/**
 * Hook to list relationships with filters
 */
export function useRelationships(
  filters?: RelationshipFilters,
  options?: Omit<UseQueryOptions<RelationshipListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.list(filters),
    queryFn: async (): Promise<RelationshipListResponse> => {
      const result = await relationshipService.listRelationships(filters)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

/**
 * Hook to get a single relationship
 */
export function useRelationship(
  id: string,
  options?: Omit<UseQueryOptions<RelationshipWithDossiers, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.detail(id),
    queryFn: async (): Promise<RelationshipWithDossiers> => {
      const result = await relationshipService.getRelationship(id)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook to get relationships for a dossier
 */
export function useRelationshipsForDossier(
  dossierId: string,
  page?: number,
  pageSize?: number,
  options?: Omit<UseQueryOptions<RelationshipListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.forDossier(dossierId),
    queryFn: async (): Promise<RelationshipListResponse> => {
      const result = await relationshipService.getRelationshipsForDossier(dossierId, page, pageSize)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!dossierId,
    ...options,
  })
}

/**
 * Hook to create a relationship
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('relationships')

  return useMutation({
    mutationFn: async (data: RelationshipCreate): Promise<RelationshipWithDossiers> => {
      const result = await relationshipService.createRelationship(data)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      })
      toast.success(t('messages.created'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.createError', { error: error.message })
      toast.error(message)
    },
  })
}

/**
 * Hook to update a relationship
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('relationships')

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: RelationshipUpdate
    }): Promise<RelationshipWithDossiers> => {
      const result = await relationshipService.updateRelationship(id, updates)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(relationshipKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.updateError', { error: error.message })
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a relationship
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('relationships')

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; id: string }> => {
      const result = await relationshipService.deleteRelationship(id)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: relationshipKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      toast.success(t('messages.deleted'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.deleteError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Health Scoring Hooks
// ============================================================================

/**
 * Hook to get health score for a relationship
 */
export function useRelationshipHealthScore(
  relationshipId: string,
  options?: Omit<UseQueryOptions<RelationshipHealthScore, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.healthScore(relationshipId),
    queryFn: async (): Promise<RelationshipHealthScore> => {
      const result = await relationshipService.getHealthScore(relationshipId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!relationshipId,
    staleTime: 5 * 60_000, // Health scores don't change frequently
    ...options,
  })
}

/**
 * Hook to list health scores
 */
export function useHealthScores(
  params?: HealthScoreListParams,
  options?: Omit<UseQueryOptions<HealthScoreListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.healthScores(params),
    queryFn: async (): Promise<HealthScoreListResponse> => {
      const result = await relationshipService.listHealthScores(params)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    staleTime: 5 * 60_000,
    ...options,
  })
}

/**
 * Hook to get health history
 */
export function useHealthHistory(
  relationshipId: string,
  limit?: number,
  offset?: number,
  options?: Omit<UseQueryOptions<HealthHistoryListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.healthHistory(relationshipId),
    queryFn: async (): Promise<HealthHistoryListResponse> => {
      const result = await relationshipService.getHealthHistory(relationshipId, limit, offset)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!relationshipId,
    ...options,
  })
}

/**
 * Hook to trigger health score calculation
 */
export function useCalculateHealthScores() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('relationships')

  return useMutation({
    mutationFn: async (): Promise<CalculationResultResponse> => {
      const result = await relationshipService.calculateHealthScores()
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.health() })
      toast.success(t('messages.healthCalculated', { count: data.relationships_updated }))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.healthCalculationError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Alert Hooks
// ============================================================================

/**
 * Hook to get alerts for a relationship
 */
export function useRelationshipAlerts(
  relationshipId: string,
  params?: AlertListParams,
  options?: Omit<UseQueryOptions<AlertListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.alerts(relationshipId),
    queryFn: async (): Promise<AlertListResponse> => {
      const result = await relationshipService.getAlerts(relationshipId, params)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!relationshipId,
    ...options,
  })
}

/**
 * Hook to mark alert as read
 */
export function useMarkAlertRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string): Promise<{ success: boolean }> => {
      const result = await relationshipService.markAlertRead(alertId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.health() })
    },
  })
}

/**
 * Hook to dismiss alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string): Promise<{ success: boolean }> => {
      const result = await relationshipService.dismissAlert(alertId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.health() })
    },
  })
}

// ============================================================================
// Cache Invalidation Helper
// ============================================================================

/**
 * Hook to invalidate all relationship queries
 */
export function useInvalidateRelationships() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
  }
}
