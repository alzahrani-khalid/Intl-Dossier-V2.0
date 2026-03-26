/**
 * Positions List Hook (Domain)
 * @module domains/positions/hooks/usePositions
 *
 * TanStack Query infinite query for position list with filtering.
 * Delegates API calls to positions.repository.
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { PositionFilters, PositionListResponse } from '@/types/position'

/**
 * Query Keys Factory for position queries
 */
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (filters?: PositionFilters) => [...positionKeys.lists(), filters] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
  versions: (id: string) => [...positionKeys.all, 'versions', id] as const,
  attachments: (id: string) => [...positionKeys.all, 'attachments', id] as const,
}

/**
 * Hook to list positions with infinite scroll
 */
export const usePositions = (filters?: Omit<PositionFilters, 'offset'>): ReturnType<typeof useInfiniteQuery<PositionListResponse>> => {
  const pageSize = filters?.limit || 20

  return useInfiniteQuery({
    queryKey: positionKeys.list(filters),
    queryFn: async ({ pageParam = 0 }): Promise<PositionListResponse> => {
      return positionsRepo.getPositions(filters, pageParam as number)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.has_more) {
        return lastPage.offset + lastPage.limit
      }
      return undefined
    },
    initialPageParam: 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
