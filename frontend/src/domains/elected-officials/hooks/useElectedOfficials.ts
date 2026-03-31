/**
 * Elected Officials TanStack Query Hooks
 * @module domains/elected-officials/hooks
 *
 * Query hooks for elected officials CRUD operations.
 * Elected officials are persons with person_subtype = 'elected_official'.
 * Uses the Express backend API at /api/elected-officials.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api-client'
import type {
  ElectedOfficial,
  ElectedOfficialListResponse,
  ElectedOfficialFilters,
} from '@/domains/elected-officials/types/elected-official.types'

/**
 * Query Keys Factory for elected official queries
 */
export const electedOfficialKeys = {
  all: ['elected-officials'] as const,
  lists: () => [...electedOfficialKeys.all, 'list'] as const,
  list: (filters?: ElectedOfficialFilters) =>
    [...electedOfficialKeys.lists(), { filters }] as const,
  details: () => [...electedOfficialKeys.all, 'detail'] as const,
  detail: (id: string) => [...electedOfficialKeys.details(), id] as const,
}

/**
 * Hook to fetch a paginated list of elected officials with filters
 *
 * @param filters - Optional filters (party, office_type, is_current_term, country_id, search, page, limit)
 * @returns TanStack Query result with paginated elected official list
 */
export function useElectedOfficials(filters?: ElectedOfficialFilters) {
  const params = new URLSearchParams()

  if (filters != null) {
    if (filters.search != null && filters.search !== '') params.set('search', filters.search)
    if (filters.party != null && filters.party !== '') params.set('party', filters.party)
    if (filters.office_type != null) params.set('office_type', filters.office_type)
    if (filters.is_current_term != null)
      params.set('is_current_term', String(filters.is_current_term))
    if (filters.country_id != null && filters.country_id !== '')
      params.set('country_id', filters.country_id)
    if (filters.page != null) params.set('page', String(filters.page))
    if (filters.limit != null) params.set('limit', String(filters.limit))
  }

  const queryString = params.toString()
  const path = `/api/elected-officials${queryString !== '' ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: electedOfficialKeys.list(filters),
    queryFn: () => apiGet<ElectedOfficialListResponse>(path, { baseUrl: 'express' }),
  })
}

/**
 * Hook to fetch a single elected official by ID
 *
 * @param id - The elected official (person) UUID
 * @returns TanStack Query result with full elected official data
 */
export function useElectedOfficial(id: string) {
  return useQuery({
    queryKey: electedOfficialKeys.detail(id),
    queryFn: () => apiGet<ElectedOfficial>(`/api/elected-officials/${id}`, { baseUrl: 'express' }),
    enabled: id !== '',
  })
}
