/**
 * Single Position Hook (Domain)
 * @module domains/positions/hooks/usePosition
 *
 * TanStack Query hook for fetching a single position.
 * Delegates API calls to positions.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { Position } from '@/types/position'
import { positionKeys } from './usePositions'

/**
 * Hook to fetch a single position by ID
 */
export const usePosition = (
  id: string | undefined,
  options?: { enabled?: boolean },
): ReturnType<typeof useQuery<Position>> => {
  return useQuery({
    queryKey: positionKeys.detail(id || ''),
    queryFn: async (): Promise<Position> => {
      if (!id) {
        throw new Error('Position ID is required')
      }
      return positionsRepo.getPosition(id)
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
