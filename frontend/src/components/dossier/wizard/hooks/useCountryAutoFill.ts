import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import { apiGet } from '@/lib/api-client'
import { STALE_TIME } from '@/lib/query-tiers'
import type { CountryFormData } from '../schemas/country.schema'

interface CountryReferenceResult {
  code: string
  code3: string
  name_en: string
  name_ar: string
  region: string
  capital?: string
}

interface CountryListResponse {
  data: CountryReferenceResult[]
  pagination: {
    page: number
    pages: number
    total: number
  }
  total: number
}

async function fetchCountryReference(
  name: string,
): Promise<CountryReferenceResult | undefined> {
  const response = await apiGet<CountryListResponse>(
    `/api/countries?search=${encodeURIComponent(name)}&limit=1`,
    { baseUrl: 'express' },
  )
  if (response.data.length > 0) {
    return response.data[0]
  }
  return undefined
}

/**
 * Auto-fills country form fields from reference data when name_en >= 3 characters.
 * Only fills fields that are still empty -- never overwrites user edits.
 */
export function useCountryAutoFill(
  nameEn: string,
  form: UseFormReturn<CountryFormData>,
): void {
  const { data: match } = useQuery({
    queryKey: ['country-reference', nameEn],
    queryFn: () => fetchCountryReference(nameEn),
    enabled: nameEn.length >= 3,
    staleTime: STALE_TIME.NORMAL,
  })

  useEffect(() => {
    if (match == null) return

    const current = form.getValues()

    if (current.iso_code_2 === '' && match.code !== '') {
      form.setValue('iso_code_2', match.code)
    }
    if (current.iso_code_3 === '' && match.code3 !== '') {
      form.setValue('iso_code_3', match.code3)
    }
    if (current.region === '' && match.region !== '') {
      form.setValue('region', match.region)
    }
  }, [match, form])
}
