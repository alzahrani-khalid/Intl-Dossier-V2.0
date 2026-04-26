/**
 * useCountries — Plan 40-02b adapter hook.
 *
 * TanStack Query hook that fetches paginated country dossiers from Supabase.
 * Mirrors `useForums.ts:25-97` shape: returns `{ data, pagination }`.
 *
 * Consumed by Wave 1 list-page bodies (DossierTable rows for countries).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Dossier } from '@/types/dossier'

export interface CountriesFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface CountriesPagination {
  page: number
  limit: number
  total: number | null
  totalPages: number
}

export interface CountriesListResponse {
  data: Dossier[]
  pagination: CountriesPagination
}

const COUNTRIES_QUERY_KEY = 'countries'
const SEARCH_MAX_LEN = 200

export function useCountries(
  filters: CountriesFilters = {},
): ReturnType<typeof useQuery<CountriesListResponse, Error>> {
  return useQuery<CountriesListResponse, Error>({
    queryKey: [COUNTRIES_QUERY_KEY, filters],
    queryFn: async (): Promise<CountriesListResponse> => {
      const { search, status, page = 1, limit = 20 } = filters
      const offset = (page - 1) * limit
      const safeSearch =
        typeof search === 'string' && search.length > 0 ? search.slice(0, SEARCH_MAX_LEN) : ''

      let query = supabase
        .from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'country')
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
      const total: number | null = typeof count === 'number' ? count : null
      const totalPages = total !== null && total > 0 ? Math.ceil(total / limit) : 0

      return {
        data: rows,
        pagination: { page, limit, total, totalPages },
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}
