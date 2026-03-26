/**
 * Create Position Dossier Link Hook (Domain)
 * @module domains/positions/hooks/useCreatePositionDossierLink
 *
 * TanStack Query mutation for creating a position-dossier link.
 * Delegates API calls to positions.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { CreatePositionDossierLinkInput } from '../types'

export function useCreatePositionDossierLink(positionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePositionDossierLinkInput) => {
      return positionsRepo.createPositionDossierLink(positionId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-dossier-links', positionId] })
    },
  })
}
