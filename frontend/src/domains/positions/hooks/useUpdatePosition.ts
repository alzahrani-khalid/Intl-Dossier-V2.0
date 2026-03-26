/**
 * Update Position Hook (Domain)
 * @module domains/positions/hooks/useUpdatePosition
 *
 * TanStack Query mutation for updating a position with optimistic updates.
 * Delegates API calls to positions.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { Position } from '@/types/position'
import type { UpdatePositionVariables } from '../types'

/**
 * Hook to update a position with optimistic updates
 */
export const useUpdatePosition = (): ReturnType<typeof useMutation<Position, Error, UpdatePositionVariables>> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: UpdatePositionVariables): Promise<Position> => {
      return positionsRepo.updatePosition(variables)
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['positions', 'detail', id] })
      const previousPosition = queryClient.getQueryData<Position>(['positions', 'detail', id])

      if (previousPosition) {
        queryClient.setQueryData<Position>(['positions', 'detail', id], {
          ...previousPosition,
          ...data,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousPosition }
    },
    onError: (_err, { id }, context) => {
      if (context?.previousPosition) {
        queryClient.setQueryData(['positions', 'detail', id], context.previousPosition)
      }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['positions', 'detail', id], data)
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] })
    },
  })
}
