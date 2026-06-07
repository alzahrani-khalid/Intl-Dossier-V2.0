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

/**
 * A country dossier augmented with its ISO code from the `countries` extension
 * table (`countries.id` FK → `dossiers.id`, column `iso_code_2`). The base
 * `dossiers` row carries no ISO code, so `DossierGlyph` needs this to render a
 * flag instead of falling back to initials.
 */
export interface CountryDossier extends Dossier {
  iso_code?: string
  engagement_count?: number
}

export interface CountriesListResponse {
  data: CountryDossier[]
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

      // Merge ISO codes from the `countries` extension table so DossierGlyph can
      // render flags (mirrors the extension-merge pattern in useForums.ts). The
      // base `dossiers` row has no ISO code; it lives in countries.iso_code_2.
      const ids = rows.map((d) => d.id)
      const isoById: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: countryExts } = await supabase
          .from('countries')
          .select('id, iso_code_2')
          .in('id', ids)
        if (countryExts) {
          for (const ext of countryExts as Array<{ id: string; iso_code_2: string | null }>) {
            if (typeof ext.iso_code_2 === 'string' && ext.iso_code_2.length > 0) {
              isoById[ext.id] = ext.iso_code_2
            }
          }
        }
      }

      // Count engagements per country from the `engagement_dossiers` extension
      // table (engagement_dossiers.host_country_id FK → dossiers.id — the
      // schema-canonical country↔engagement link). PostgREST has no simple
      // GROUP BY here, so tally in JS — mirrors the iso-merge above (a second
      // `.in()` query + reduce). Reads 0 until host_country_id is populated, but
      // removes the latent always-zero bug (the route reads d.engagement_count).
      const engagementCountById: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: engagementExts } = await supabase
          .from('engagement_dossiers')
          .select('host_country_id')
          .in('host_country_id', ids)
        if (engagementExts) {
          for (const ext of engagementExts as Array<{ host_country_id: string | null }>) {
            const hostId = ext.host_country_id
            if (typeof hostId === 'string' && hostId.length > 0) {
              engagementCountById[hostId] = (engagementCountById[hostId] ?? 0) + 1
            }
          }
        }
      }

      const merged: CountryDossier[] = rows.map((d) => ({
        ...d,
        iso_code: isoById[d.id],
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
