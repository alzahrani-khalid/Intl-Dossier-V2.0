/**
 * Dossier Statistics Hooks
 * Feature: R13 - Pre-computed aggregate statistics for dossier dashboards
 *
 * TanStack Query hooks for fetching pre-computed dossier statistics
 * from the dossier_statistics materialized view.
 */

import { useQuery, useQueries } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import {
  fetchDossierStatistics,
  fetchDossierStatisticsBatch,
  fetchDossierStatisticsSummary,
  fetchDossierStatisticsFromView,
} from '@/services/dossier-statistics.service'
import type {
  DossierStatistics,
  DossierStatisticsSummary,
  DossierStatisticsFilters,
  DossierStatisticsBatchResponse,
} from '@/types/dossier-statistics.types'

// =============================================================================
// Query Keys
// =============================================================================

export const dossierStatisticsKeys = {
  all: ['dossier-statistics'] as const,
  single: (dossierId: string) => [...dossierStatisticsKeys.all, 'single', dossierId] as const,
  batch: (dossierIds: string[]) =>
    [...dossierStatisticsKeys.all, 'batch', dossierIds.sort().join(',')] as const,
  summary: (dossierType?: string) =>
    [...dossierStatisticsKeys.all, 'summary', dossierType] as const,
  list: (filters?: DossierStatisticsFilters) =>
    [...dossierStatisticsKeys.all, 'list', filters] as const,
}

// =============================================================================
// Single Dossier Statistics Hook
// =============================================================================

/**
 * Hook to fetch pre-computed statistics for a single dossier
 *
 * @param dossierId - The dossier ID to fetch statistics for
 * @param options - Optional TanStack Query options
 */
export function useDossierStatistics(
  dossierId: string | undefined,
  options?: Omit<UseQueryOptions<DossierStatistics | null, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierStatisticsKeys.single(dossierId || ''),
    queryFn: () => (dossierId ? fetchDossierStatistics(dossierId) : Promise.resolve(null)),
    enabled: !!dossierId,
    staleTime: 30_000, // 30 seconds - stats refresh every 5 minutes
    gcTime: 5 * 60_000, // 5 minutes
    ...options,
  })
}

// =============================================================================
// Batch Dossier Statistics Hook
// =============================================================================

/**
 * Hook to fetch pre-computed statistics for multiple dossiers
 *
 * @param dossierIds - Array of dossier IDs to fetch statistics for
 * @param options - Optional TanStack Query options
 */
export function useDossierStatisticsBatch(
  dossierIds: string[],
  options?: Omit<UseQueryOptions<DossierStatistics[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierStatisticsKeys.batch(dossierIds),
    queryFn: () => fetchDossierStatisticsBatch(dossierIds),
    enabled: dossierIds.length > 0,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
    ...options,
  })
}

// =============================================================================
// Parallel Dossier Statistics Hooks
// =============================================================================

/**
 * Hook to fetch statistics for multiple dossiers in parallel
 * Useful when you need individual loading/error states per dossier
 *
 * @param dossierIds - Array of dossier IDs to fetch statistics for
 */
export function useDossierStatisticsParallel(dossierIds: string[]) {
  return useQueries({
    queries: dossierIds.map((dossierId) => ({
      queryKey: dossierStatisticsKeys.single(dossierId),
      queryFn: () => fetchDossierStatistics(dossierId),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    })),
  })
}

// =============================================================================
// Summary Statistics Hook
// =============================================================================

/**
 * Hook to fetch aggregated summary statistics across all dossiers
 *
 * @param dossierType - Optional filter by dossier type
 * @param options - Optional TanStack Query options
 */
export function useDossierStatisticsSummary(
  dossierType?: string,
  options?: Omit<UseQueryOptions<DossierStatisticsSummary, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierStatisticsKeys.summary(dossierType),
    queryFn: () => fetchDossierStatisticsSummary(dossierType),
    staleTime: 60_000, // 1 minute - summary is aggregated
    gcTime: 10 * 60_000, // 10 minutes
    ...options,
  })
}

// =============================================================================
// List Statistics Hook (with filtering)
// =============================================================================

/**
 * Hook to fetch dossier statistics with filtering and pagination
 *
 * @param filters - Optional filters for the query
 * @param options - Optional TanStack Query options
 */
export function useDossierStatisticsList(
  filters?: DossierStatisticsFilters,
  options?: Omit<UseQueryOptions<DossierStatisticsBatchResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierStatisticsKeys.list(filters),
    queryFn: () => fetchDossierStatisticsFromView(filters),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
    ...options,
  })
}

// =============================================================================
// Combined Hook for Dashboard
// =============================================================================

/**
 * Combined hook for dashboard that fetches both summary and top dossiers
 * with pending work
 */
export function useDossierStatisticsDashboard(dossierType?: string) {
  const summaryQuery = useDossierStatisticsSummary(dossierType)

  const topPendingQuery = useDossierStatisticsList({
    dossier_type: dossierType as DossierStatisticsFilters['dossier_type'],
    has_pending_work: true,
    sort_by: 'total_pending_work',
    sort_order: 'desc',
    limit: 10,
  })

  const topOverdueQuery = useDossierStatisticsList({
    dossier_type: dossierType as DossierStatisticsFilters['dossier_type'],
    has_overdue: true,
    sort_by: 'total_overdue',
    sort_order: 'desc',
    limit: 10,
  })

  return {
    summary: summaryQuery,
    topPending: topPendingQuery,
    topOverdue: topOverdueQuery,
    isLoading: summaryQuery.isLoading || topPendingQuery.isLoading || topOverdueQuery.isLoading,
    isError: summaryQuery.isError || topPendingQuery.isError || topOverdueQuery.isError,
  }
}

// =============================================================================
// Utility Hook for Dossier Card Stats
// =============================================================================

/**
 * Hook specifically for DossierCard components that need quick stats
 * Returns a simplified stats object optimized for card display
 */
export function useDossierCardStats(dossierId: string | undefined) {
  const { data, isLoading, error } = useDossierStatistics(dossierId)

  return {
    isLoading,
    error,
    stats: data
      ? {
          taskCount: data.task_count,
          pendingCount: data.total_pending_work,
          overdueCount: data.total_overdue,
          commitmentCount: data.commitment_count,
          positionCount: data.position_count,
          relationshipCount: data.relationship_count,
          eventCount: data.event_count,
          documentCount: data.document_count,
          lastActivity: data.last_activity_at,
          hasOverdue: data.total_overdue > 0,
          hasPending: data.total_pending_work > 0,
        }
      : null,
  }
}
