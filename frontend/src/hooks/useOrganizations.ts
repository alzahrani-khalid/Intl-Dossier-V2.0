/**
 * useOrganizations — Plan 40-02b adapter hook.
 *
 * TanStack Query hook that fetches paginated organization dossiers from Supabase.
 * Mirrors `useForums.ts:25-97` shape: returns `{ data, pagination }`.
 *
 * Consumed by Wave 1 list-page bodies (DossierTable rows for organizations).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Dossier } from '@/types/dossier'

export interface OrganizationsFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface OrganizationsPagination {
  page: number
  limit: number
  total: number | null
  totalPages: number
}

export interface OrganizationsListResponse {
  data: Dossier[]
  pagination: OrganizationsPagination
}

const ORGANIZATIONS_QUERY_KEY = 'organizations'
const SEARCH_MAX_LEN = 200

export function useOrganizations(
  filters: OrganizationsFilters = {},
): ReturnType<typeof useQuery<OrganizationsListResponse, Error>> {
  return useQuery<OrganizationsListResponse, Error>({
    queryKey: [ORGANIZATIONS_QUERY_KEY, filters],
    queryFn: async (): Promise<OrganizationsListResponse> => {
      const { search, status, page = 1, limit = 20 } = filters
      const offset = (page - 1) * limit
      const safeSearch =
        typeof search === 'string' && search.length > 0 ? search.slice(0, SEARCH_MAX_LEN) : ''

      let query = supabase
        .from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'organization')
        .neq('status', 'deleted')

      if (safeSearch.length > 0) {
        query = query.or(`name_en.ilike.%${safeSearch}%,name_ar.ilike.%${safeSearch}%`)
      }

      if (typeof status === 'string' && status.length > 0) {
        query = query.eq('status', status)
      }

      query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error !== null && error !== undefined) {
        throw new Error(error.message)
      }

      const rows = (data ?? []) as Dossier[]

      // Merge engagement counts from the `engagement_dossiers` extension table
      // (engagement_dossiers.host_organization_id FK → dossiers.id). The list
      // route reads `d.engagement_count`; without this merge it is always 0.
      // Mirrors useCountries.ts host_country_id tally — PostgREST has no GROUP BY
      // here, so tally in JS via a second `.in()` query.
      const ids = rows.map((d) => d.id)
      const engagementCountById: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: engagementExts } = await supabase
          .from('engagement_dossiers')
          .select('host_organization_id')
          .in('host_organization_id', ids)
        if (engagementExts) {
          for (const ext of engagementExts as Array<{ host_organization_id: string | null }>) {
            const hostId = ext.host_organization_id
            if (typeof hostId === 'string' && hostId.length > 0) {
              engagementCountById[hostId] = (engagementCountById[hostId] ?? 0) + 1
            }
          }
        }
      }

      const merged = rows.map((d) => ({
        ...d,
        engagement_count: engagementCountById[d.id] ?? 0,
      }))

      const total: number | null = typeof count === 'number' ? count : null
      const totalPages = total !== null && total > 0 ? Math.ceil(total / limit) : 0

      return {
        data: merged,
        pagination: { page, limit, total, totalPages },
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}
