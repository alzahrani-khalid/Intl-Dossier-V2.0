/**
 * Dossier Listing Hook (Domain)
 * @module domains/dossiers/hooks/useDossiers
 *
 * TanStack Query hook for listing dossiers with advanced filtering.
 * Delegates API calls to dossiers.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as dossiersRepo from '../repositories/dossiers.repository'
import type { DossierFilters, DossierListResponse } from '@/types/dossier'

/**
 * Serializes filter object for stable query key generation.
 */
const serializeFilters = (filters?: DossierFilters): Record<string, unknown> | undefined => {
  if (!filters) return undefined
  const sorted: Record<string, unknown> = {}
  Object.keys(filters)
    .sort()
    .forEach((key) => {
      const value = filters[key as keyof DossierFilters]
      if (value !== undefined && value !== null && value !== '') {
        sorted[key] = value
      }
    })
  return sorted
}

/**
 * Query Keys Factory for dossier queries
 */
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters?: DossierFilters) => [...dossierKeys.lists(), serializeFilters(filters)] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string, includes?: string[]) => [...dossierKeys.details(), id, includes] as const,
  timeline: (id: string, filters?: unknown) => [...dossierKeys.all, 'timeline', id, filters] as const,
  briefs: (id: string) => [...dossierKeys.all, 'briefs', id] as const,
}

/**
 * Hook to list dossiers with filtering and pagination.
 */
export const useDossiers = (filters?: DossierFilters) => {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: async (): Promise<DossierListResponse> => {
      return dossiersRepo.getDossiers(filters)
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
