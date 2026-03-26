/**
 * Create Position Hook (Domain)
 * @module domains/positions/hooks/useCreatePosition
 *
 * TanStack Query mutation for creating a new position.
 * Delegates API calls to positions.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { CreatePositionRequest, Position } from '@/types/position'

/**
 * Hook to create a new position
 */
export const useCreatePosition = (): ReturnType<typeof useMutation<Position, Error, CreatePositionRequest>> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePositionRequest): Promise<Position> => {
      return positionsRepo.createPosition(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] })
    },
  })
}
