/**
 * Create MoU Hook (Domain)
 * @module domains/mous/hooks/useCreateMou
 *
 * TanStack Query mutation for creating a new MoU.
 * Delegates API calls to mous.repository and invalidates the MoU list on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as mousRepo from '../repositories/mous.repository'
import { mouKeys } from '../keys'
import type { CreateMouPayload, Mou } from '../types'

/**
 * Hook to create a new MoU
 */
export const useCreateMou = (): ReturnType<typeof useMutation<Mou, Error, CreateMouPayload>> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateMouPayload): Promise<Mou> => {
      return mousRepo.createMou(payload)
    },
    onSuccess: () => {
      // Root key 'mous' prefix-matches MousPage's inline ['mous', searchTerm, filterState].
      void queryClient.invalidateQueries({ queryKey: mouKeys.all })
    },
  })
}
