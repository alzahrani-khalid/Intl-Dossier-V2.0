/**
 * Position Dossier Links Hook (Domain)
 * @module domains/positions/hooks/usePositionDossierLinks
 *
 * TanStack Query hook for fetching dossier links for a position.
 * Delegates API calls to positions.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type {
  PositionDossierLink,
  PositionDossierLinksFilters,
} from '../types'

export interface UsePositionDossierLinksResult {
  links: PositionDossierLink[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function usePositionDossierLinks(
  positionId: string,
  filters?: PositionDossierLinksFilters,
): UsePositionDossierLinksResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['position-dossier-links', positionId, filters],
    queryFn: () => positionsRepo.getPositionDossierLinks(positionId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!positionId,
  })

  return {
    links: data?.links || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
