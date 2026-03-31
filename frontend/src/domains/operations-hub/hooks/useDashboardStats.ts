/**
 * Dashboard Stats Hook
 * Phase 10: Operations Hub Dashboard
 *
 * TanStack Query hook for the Quick Stats bar.
 * staleTime: 5min (medium-sensitivity per D-19).
 */

import { useQuery } from '@tanstack/react-query'
import type { DashboardStats } from '../types/operations-hub.types'
import { getDashboardStats } from '../repositories/operations-hub.repository'
import { operationsHubKeys } from './useAttentionItems'

// ============================================================================
// useDashboardStats Hook
// ============================================================================

/**
 * Fetches summary counts for the Quick Stats bar:
 * active engagements, open tasks, SLA at risk, upcoming this week.
 */
export function useDashboardStats(userId?: string): ReturnType<typeof useQuery<DashboardStats, Error>> {
  return useQuery<DashboardStats, Error>({
    queryKey: operationsHubKeys.stats(userId),
    queryFn: () => getDashboardStats(userId ?? null),
    staleTime: 5 * 60_000, // 5 minutes per D-19
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: true,
  })
}
