/**
 * Engagement Stages Hook
 * Phase 10: Operations Hub Dashboard
 *
 * TanStack Query hook for the Active Engagements zone.
 * staleTime: 5min (medium-sensitivity per D-19).
 */

import { useQuery } from '@tanstack/react-query'
import type { StageGroup } from '../types/operations-hub.types'
import { getEngagementStageCounts } from '../repositories/operations-hub.repository'
import { operationsHubKeys } from './useAttentionItems'

// ============================================================================
// useEngagementStages Hook
// ============================================================================

/**
 * Fetches active engagements grouped by lifecycle stage with counts
 * and top 5 engagements per stage.
 */
export function useEngagementStages(userId?: string): ReturnType<typeof useQuery<StageGroup[], Error>> {
  return useQuery<StageGroup[], Error>({
    queryKey: operationsHubKeys.stages(userId),
    queryFn: () => getEngagementStageCounts(userId ?? null),
    staleTime: 5 * 60_000, // 5 minutes per D-19
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: true,
  })
}
