import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { CountryFormData } from '../../schemas/country.schema'

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}))

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiGet: vi.fn(),
}))

import { useQuery } from '@tanstack/react-query'
import { useCountryAutoFill } from '../useCountryAutoFill'

function createMockForm(values: Partial<CountryFormData> = {}): UseFormReturn<CountryFormData> {
  const defaults: CountryFormData = {
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    classification: 'unclassified',
    iso_code_2: '',
    iso_code_3: '',
    capital_en: '',
    capital_ar: '',
    region: '',
    ...values,
  } as CountryFormData

  return {
    getValues: vi.fn().mockReturnValue(defaults),
    setValue: vi.fn(),
    watch: vi.fn(),
    control: {} as UseFormReturn<CountryFormData>['control'],
  } as unknown as UseFormReturn<CountryFormData>
}

describe('useCountryAutoFill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not query when nameEn is shorter than 3 characters', () => {
    const form = createMockForm()

    renderHook(() => useCountryAutoFill('SA', form))

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
  })

  it('auto-fills empty form fields when reference match found', () => {
    const mockMatch = {
      cca2: 'SA',
      cca3: 'SAU',
      region: 'Asia',
      capital: ['Riyadh'],
    }

    vi.mocked(useQuery).mockReturnValue({
      data: mockMatch,
      isLoading: false,
    } as ReturnType<typeof useQuery>)

    const form = createMockForm()

    renderHook(() => useCountryAutoFill('Saudi Arabia', form))

    expect(form.setValue).toHaveBeenCalledWith('iso_code_2', 'SA')
    expect(form.setValue).toHaveBeenCalledWith('iso_code_3', 'SAU')
    expect(form.setValue).toHaveBeenCalledWith('region', 'asia')
    expect(form.setValue).toHaveBeenCalledWith('capital_en', 'Riyadh')
  })

  it('does not overwrite user-entered values', () => {
    const mockMatch = {
      cca2: 'SA',
      cca3: 'SAU',
      region: 'Asia',
      capital: ['Riyadh'],
    }

    vi.mocked(useQuery).mockReturnValue({
      data: mockMatch,
      isLoading: false,
    } as ReturnType<typeof useQuery>)

    const form = createMockForm({
      iso_code_2: 'KW',
      iso_code_3: '',
      region: 'Europe',
    })

    renderHook(() => useCountryAutoFill('Saudi Arabia', form))

    // Should NOT overwrite user-entered iso_code_2 or region
    expect(form.setValue).not.toHaveBeenCalledWith('iso_code_2', 'SA')
    expect(form.setValue).not.toHaveBeenCalledWith('region', 'asia')
    // Should fill empty iso_code_3
    expect(form.setValue).toHaveBeenCalledWith('iso_code_3', 'SAU')
  })
})
