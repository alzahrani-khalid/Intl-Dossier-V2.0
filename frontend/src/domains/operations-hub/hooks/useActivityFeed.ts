/**
 * Activity Feed Hook
 * Phase 10: Operations Hub Dashboard
 *
 * TanStack Query hook for the Recent Activity zone.
 * staleTime: 2min (higher-sensitivity per D-19).
 */

import { useQuery } from '@tanstack/react-query'
import type { ActivityItemData } from '../types/operations-hub.types'
import { getRecentActivity } from '../repositories/operations-hub.repository'
import { operationsHubKeys } from './useAttentionItems'

// ============================================================================
// useActivityFeed Hook
// ============================================================================

/**
 * Fetches recent activity items from the activity log.
 * Higher-sensitivity — 2min staleTime per D-19.
 */
export function useActivityFeed(limit: number = 10): ReturnType<typeof useQuery<ActivityItemData[], Error>> {
  return useQuery<ActivityItemData[], Error>({
    queryKey: operationsHubKeys.activity(),
    queryFn: () => getRecentActivity(limit),
    staleTime: 2 * 60_000, // 2 minutes per D-19
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}
