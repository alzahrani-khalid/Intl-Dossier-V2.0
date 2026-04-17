/**
 * Phase 32 Plan 32-04: batch identity enrichment for persons + elected-officials lists.
 *
 * The existing list queries (dossiers-list Edge Function for persons, Express
 * search_persons_advanced RPC for elected officials) don't yet return the 11
 * identity columns or the joined nationality ISO-2. Rather than invent a new
 * SQL artifact (Wave 4.5 concern), we piggyback on @/lib/supabase-client and
 * do a second SELECT keyed to the visible page of IDs. The result is a
 * Map<personId, enrichment> the list-row renderers consult for label + badge.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'

export interface PersonIdentityEnrichment {
  honorific_en: string | null
  honorific_ar: string | null
  first_name_en: string | null
  last_name_en: string | null
  first_name_ar: string | null
  last_name_ar: string | null
  nationality_country_id: string | null
  nationality_iso_2: string | null
}

export type PersonIdentityEnrichmentMap = Map<string, PersonIdentityEnrichment>

interface PersonRow {
  id: string
  honorific_en: string | null
  honorific_ar: string | null
  first_name_en: string | null
  last_name_en: string | null
  first_name_ar: string | null
  last_name_ar: string | null
  nationality_country_id: string | null
}

interface CountryRow {
  id: string
  iso_code_2: string | null
}

export const personIdentityKeys = {
  all: ['person-identity-enrichment'] as const,
  byIds: (ids: string[]) => [...personIdentityKeys.all, [...ids].sort().join(',')] as const,
}

const fetchEnrichment = async (ids: string[]): Promise<PersonIdentityEnrichmentMap> => {
  const out: PersonIdentityEnrichmentMap = new Map()
  if (ids.length === 0) return out

  const { data: persons, error: personsErr } = await supabase
    .from('persons')
    .select(
      'id, honorific_en, honorific_ar, first_name_en, last_name_en, first_name_ar, last_name_ar, nationality_country_id',
    )
    .in('id', ids)

  if (personsErr != null) {
    // Non-fatal: enrichment is best-effort; list rows fall back to name_en/name_ar (D-15).
    console.warn('[usePersonIdentityEnrichment] persons fetch failed', personsErr.message)
    return out
  }

  const personsTyped = (persons ?? []) as PersonRow[]
  const countryIds = Array.from(
    new Set(
      personsTyped
        .map((p) => p.nationality_country_id)
        .filter((v): v is string => v != null && v !== ''),
    ),
  )

  const isoByCountryId = new Map<string, string | null>()
  if (countryIds.length > 0) {
    const { data: countries, error: countriesErr } = await supabase
      .from('countries')
      .select('id, iso_code_2')
      .in('id', countryIds)

    if (countriesErr != null) {
      console.warn('[usePersonIdentityEnrichment] countries fetch failed', countriesErr.message)
    } else {
      for (const c of (countries ?? []) as CountryRow[]) {
        isoByCountryId.set(c.id, c.iso_code_2)
      }
    }
  }

  for (const p of personsTyped) {
    const iso2 =
      p.nationality_country_id != null
        ? (isoByCountryId.get(p.nationality_country_id) ?? null)
        : null
    out.set(p.id, {
      honorific_en: p.honorific_en,
      honorific_ar: p.honorific_ar,
      first_name_en: p.first_name_en,
      last_name_en: p.last_name_en,
      first_name_ar: p.first_name_ar,
      last_name_ar: p.last_name_ar,
      nationality_country_id: p.nationality_country_id,
      nationality_iso_2: iso2,
    })
  }

  return out
}

/**
 * Returns a Map<personId, PersonIdentityEnrichment>. Callers should use it as:
 *   const enrichment = data?.get(row.id)
 *   formatPersonLabel({ ...row, ...enrichment }, locale)
 */
export const usePersonIdentityEnrichment = (ids: string[]) => {
  // Stable key: sorted, deduped
  const stableIds = Array.from(new Set(ids)).sort()
  return useQuery<PersonIdentityEnrichmentMap, Error>({
    queryKey: personIdentityKeys.byIds(stableIds),
    queryFn: () => fetchEnrichment(stableIds),
    enabled: stableIds.length > 0,
    staleTime: 30_000,
  })
}
