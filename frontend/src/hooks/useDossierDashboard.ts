/**
 * Dossier Dashboard Hooks
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * TanStack Query hooks for fetching dossier dashboard data.
 * Includes optimistic updates and realtime subscriptions.
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type {
  MyDossiersResponse,
  MyDossiersFilters,
  RecentDossierActivityResponse,
  RecentActivityFilters,
  PendingWorkByDossierResponse,
  PendingWorkFilters,
  DossierDashboardSummary,
} from '@/types/dossier-dashboard.types'
import {
  fetchMyDossiers,
  fetchRecentDossierActivity,
  fetchPendingWorkByDossier,
  fetchDossierDashboardSummary,
} from '@/services/dossier-dashboard.service'

// =============================================================================
// Query Keys
// =============================================================================

export const dossierDashboardKeys = {
  all: ['dossier-dashboard'] as const,
  myDossiers: () => [...dossierDashboardKeys.all, 'my-dossiers'] as const,
  myDossiersFiltered: (filters?: MyDossiersFilters) =>
    [...dossierDashboardKeys.myDossiers(), { filters }] as const,
  recentActivity: () => [...dossierDashboardKeys.all, 'recent-activity'] as const,
  recentActivityFiltered: (filters?: RecentActivityFilters) =>
    [...dossierDashboardKeys.recentActivity(), { filters }] as const,
  pendingWork: () => [...dossierDashboardKeys.all, 'pending-work'] as const,
  pendingWorkFiltered: (filters?: PendingWorkFilters) =>
    [...dossierDashboardKeys.pendingWork(), { filters }] as const,
  summary: () => [...dossierDashboardKeys.all, 'summary'] as const,
}

// =============================================================================
// useMyDossiers Hook
// =============================================================================

/**
 * Hook for fetching dossiers the current user owns or contributes to
 */
export function useMyDossiers(filters?: MyDossiersFilters, options?: { enabled?: boolean }) {
  return useQuery<MyDossiersResponse, Error>({
    queryKey: dossierDashboardKeys.myDossiersFiltered(filters),
    queryFn: () => fetchMyDossiers(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// useRecentDossierActivity Hook
// =============================================================================

/**
 * Hook for fetching recent activity across user's dossiers with infinite scroll
 */
export function useRecentDossierActivity(
  filters?: RecentActivityFilters,
  options?: { enabled?: boolean; pageSize?: number },
) {
  const pageSize = options?.pageSize ?? 20

  return useInfiniteQuery<RecentDossierActivityResponse, Error>({
    queryKey: dossierDashboardKeys.recentActivityFiltered(filters),
    queryFn: async ({ pageParam }) => {
      return fetchRecentDossierActivity({
        ...filters,
        cursor: pageParam as string | undefined,
        limit: pageSize,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching recent activity without infinite scroll (for dashboard cards)
 */
export function useRecentDossierActivitySimple(
  filters?: RecentActivityFilters,
  options?: { enabled?: boolean },
) {
  return useQuery<RecentDossierActivityResponse, Error>({
    queryKey: [...dossierDashboardKeys.recentActivityFiltered(filters), 'simple'] as const,
    queryFn: () => fetchRecentDossierActivity(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// usePendingWorkByDossier Hook
// =============================================================================

/**
 * Hook for fetching pending work items grouped by dossier
 */
export function usePendingWorkByDossier(
  filters?: PendingWorkFilters,
  options?: { enabled?: boolean },
) {
  return useQuery<PendingWorkByDossierResponse, Error>({
    queryKey: dossierDashboardKeys.pendingWorkFiltered(filters),
    queryFn: () => fetchPendingWorkByDossier(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// useDossierDashboardSummary Hook
// =============================================================================

/**
 * Hook for fetching overall dashboard summary statistics
 */
export function useDossierDashboardSummary(options?: { enabled?: boolean }) {
  return useQuery<DossierDashboardSummary, Error>({
    queryKey: dossierDashboardKeys.summary(),
    queryFn: fetchDossierDashboardSummary,
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute (summary changes less frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// useDossierDashboard Combined Hook
// =============================================================================

/**
 * Combined hook for all dashboard data - use for initial dashboard load
 */
export function useDossierDashboard(options?: {
  myDossiersFilters?: MyDossiersFilters
  recentActivityFilters?: RecentActivityFilters
  pendingWorkFilters?: PendingWorkFilters
  enabled?: boolean
}) {
  const enabled = options?.enabled ?? true

  const summary = useDossierDashboardSummary({ enabled })
  const myDossiers = useMyDossiers({ ...options?.myDossiersFilters, limit: 6 }, { enabled })
  const recentActivity = useRecentDossierActivitySimple(
    { ...options?.recentActivityFilters, limit: 10 },
    { enabled },
  )
  const pendingWork = usePendingWorkByDossier(
    { ...options?.pendingWorkFilters, limit: 5 },
    { enabled },
  )

  return {
    summary,
    myDossiers,
    recentActivity,
    pendingWork,
    isLoading:
      summary.isLoading ||
      myDossiers.isLoading ||
      recentActivity.isLoading ||
      pendingWork.isLoading,
    isError: summary.isError || myDossiers.isError || recentActivity.isError || pendingWork.isError,
    error: summary.error || myDossiers.error || recentActivity.error || pendingWork.error,
  }
}

// =============================================================================
// useInvalidateDossierDashboard Hook
// =============================================================================

/**
 * Hook to invalidate all dossier dashboard queries
 */
export function useInvalidateDossierDashboard() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.all })
    },
    invalidateMyDossiers: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.myDossiers() })
    },
    invalidateRecentActivity: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.recentActivity() })
    },
    invalidatePendingWork: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.pendingWork() })
    },
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.summary() })
    },
  }
}
