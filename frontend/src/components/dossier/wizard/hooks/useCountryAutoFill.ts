import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import type { CountryFormData } from '../schemas/country.schema'

interface RestCountryResult {
  cca2: string
  cca3: string
  region: string
  capital?: string[]
}

/** Region mapping from REST Countries regions to our region values */
const REGION_MAP: Record<string, string> = {
  Asia: 'asia',
  Africa: 'africa',
  Europe: 'europe',
  Americas: 'americas',
  Oceania: 'oceania',
  Antarctic: 'antarctic',
}

async function fetchCountryReference(name: string): Promise<RestCountryResult | undefined> {
  const res = await fetch(
    `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=cca2,cca3,region,capital`,
  )
  if (!res.ok) return undefined
  const data: unknown = await res.json()
  if (!Array.isArray(data) || data.length === 0) return undefined
  return data[0] as RestCountryResult
}

/**
 * Auto-fills country form fields from REST Countries API when name_en >= 3 characters.
 * Only fills fields that are still empty -- never overwrites user edits.
 */
export function useCountryAutoFill(nameEn: string, form: UseFormReturn<CountryFormData>): void {
  const { data: match } = useQuery({
    queryKey: ['country-reference', nameEn],
    queryFn: () => fetchCountryReference(nameEn),
    enabled: (nameEn?.length ?? 0) >= 3,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (match == null) return

    const current = form.getValues()

    if (current.iso_code_2 === '' && match.cca2 != null && match.cca2 !== '') {
      form.setValue('iso_code_2', match.cca2)
    }
    if (current.iso_code_3 === '' && match.cca3 != null && match.cca3 !== '') {
      form.setValue('iso_code_3', match.cca3)
    }
    if (current.region === '' && match.region != null && match.region !== '') {
      const mapped = REGION_MAP[match.region] ?? ''
      if (mapped !== '') {
        form.setValue('region', mapped)
      }
    }
    if (current.capital_en === '' && match.capital != null && match.capital.length > 0) {
      form.setValue('capital_en', match.capital[0])
    }
  }, [match, form])
}
