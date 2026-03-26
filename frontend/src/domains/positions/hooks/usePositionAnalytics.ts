/**
 * Position Analytics Hook (Domain)
 * @module domains/positions/hooks/usePositionAnalytics
 *
 * TanStack Query hooks for position usage analytics.
 * Delegates API calls to positions.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { PositionAnalytics, TopPositionsParams, TopPosition } from '../types'

export interface UsePositionAnalyticsOptions {
  positionId: string
  enabled?: boolean
}

export function usePositionAnalytics(options: UsePositionAnalyticsOptions): {
  analytics: PositionAnalytics | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
} {
  const { positionId, enabled = true } = options

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['position-analytics', positionId],
    queryFn: () => positionsRepo.getPositionAnalytics(positionId),
    enabled: enabled && !!positionId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return {
    analytics: data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}

/**
 * Hook to fetch top positions by various metrics
 */
export function useTopPositions(options: TopPositionsParams & { enabled?: boolean } = {}): {
  topPositions: TopPosition[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
} {
  const { metric = 'popularity', timeRange = '30d', limit = 10, enabled = true } = options

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['top-positions', metric, timeRange, limit],
    queryFn: () => positionsRepo.getTopPositions({ metric, timeRange, limit }),
    enabled,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return {
    topPositions: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}
