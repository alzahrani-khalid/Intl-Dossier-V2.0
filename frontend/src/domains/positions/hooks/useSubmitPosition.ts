/**
 * Submit Position Hook (Domain)
 * @module domains/positions/hooks/useSubmitPosition
 *
 * TanStack Query mutation for submitting a position for review.
 * Delegates API calls to positions.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { SubmitPositionResponse } from '../types'

/**
 * Hook to submit a position for review
 * Returns position + consistency check results
 */
export const useSubmitPosition = (): ReturnType<typeof useMutation<SubmitPositionResponse, Error, string>> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<SubmitPositionResponse> => {
      return positionsRepo.submitPosition(id)
    },
    onSuccess: (data, id) => {
      queryClient.setQueryData(['positions', 'detail', id], data.position)
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] })
    },
  })
}
