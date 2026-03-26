/**
 * Delete Position Dossier Link Hook (Domain)
 * @module domains/positions/hooks/useDeletePositionDossierLink
 *
 * TanStack Query mutation for deleting a position-dossier link.
 * Delegates API calls to positions.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { DeletePositionDossierLinkInput } from '../types'

export function useDeletePositionDossierLink(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeletePositionDossierLinkInput) => {
      return positionsRepo.deletePositionDossierLink(input)
    },
    onSuccess: (_, variables: DeletePositionDossierLinkInput) => {
      queryClient.invalidateQueries({ queryKey: ['position-dossier-links', variables.positionId] })
    },
  })
}
