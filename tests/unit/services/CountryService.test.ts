import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CountryService } from '../../../backend/src/services/CountryService'
import { supabaseAdmin } from '../../../backend/src/config/supabase'

// Mock supabase
vi.mock('../../../backend/src/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        ilike: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(),
            })),
          })),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('CountryService', () => {
  let countryService: CountryService

  beforeEach(() => {
    countryService = new CountryService()
    vi.clearAllMocks()
  })

  describe('getAllCountries', () => {
    it('should return all countries with pagination', async () => {
      const mockCountries = [
        {
          id: '1',
          iso_code_2: 'SA',
          iso_code_3: 'SAU',
          name_en: 'Saudi Arabia',
          name_ar: 'المملكة العربية السعودية',
          region: 'asia',
          capital_en: 'Riyadh',
          capital_ar: 'الرياض',
          status: 'active'
        },
        {
          id: '2',
          iso_code_2: 'AE',
          iso_code_3: 'ARE',
          name_en: 'United Arab Emirates',
          name_ar: 'دولة الإمارات العربية المتحدة',
          region: 'asia',
          capital_en: 'Abu Dhabi',
          capital_ar: 'أبو ظبي',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockCountries,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.getAllCountries({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockCountries)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('countries')
    })

    it('should filter countries by region', async () => {
      const mockCountries = [
        {
          id: '1',
          iso_code_2: 'SA',
          iso_code_3: 'SAU',
          name_en: 'Saudi Arabia',
          name_ar: 'المملكة العربية السعودية',
          region: 'asia',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockCountries,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.getAllCountries({
        page: 1,
        limit: 10,
        region: 'asia'
      })

      expect(result.data).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('region', 'asia')
    })

    it('should search countries by name', async () => {
      const mockCountries = [
        {
          id: '1',
          iso_code_2: 'SA',
          iso_code_3: 'SAU',
          name_en: 'Saudi Arabia',
          name_ar: 'المملكة العربية السعودية',
          region: 'asia',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockCountries,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.getAllCountries({
        page: 1,
        limit: 10,
        search: 'Saudi'
      })

      expect(result.data).toEqual(mockCountries)
      expect(mockQuery.ilike).toHaveBeenCalledWith('name_en', '%Saudi%')
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
              count: 0
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(countryService.getAllCountries({
        page: 1,
        limit: 10
      })).rejects.toThrow('Database error')
    })
  })

  describe('getCountryById', () => {
    it('should return country by ID', async () => {
      const mockCountry = {
        id: '1',
        iso_code_2: 'SA',
        iso_code_3: 'SAU',
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        region: 'asia',
        capital_en: 'Riyadh',
        capital_ar: 'الرياض',
        status: 'active'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCountry,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.getCountryById('1')

      expect(result).toEqual(mockCountry)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when country not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Country not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(countryService.getCountryById('999')).rejects.toThrow('Country not found')
    })
  })

  describe('createCountry', () => {
    it('should create new country', async () => {
      const newCountry = {
        iso_code_2: 'KW',
        iso_code_3: 'KWT',
        name_en: 'Kuwait',
        name_ar: 'الكويت',
        region: 'asia',
        capital_en: 'Kuwait City',
        capital_ar: 'مدينة الكويت'
      }

      const mockCreatedCountry = {
        id: '3',
        ...newCountry,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedCountry,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.createCountry(newCountry)

      expect(result).toEqual(mockCreatedCountry)
      expect(mockQuery.insert).toHaveBeenCalledWith(newCountry)
    })

    it('should validate required fields', async () => {
      const invalidCountry = {
        iso_code_2: 'KW',
        // Missing required fields
      }

      await expect(countryService.createCountry(invalidCountry as any)).rejects.toThrow()
    })

    it('should handle duplicate ISO codes', async () => {
      const duplicateCountry = {
        iso_code_2: 'SA', // Already exists
        iso_code_3: 'SAU',
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        region: 'asia'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'duplicate key value violates unique constraint' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(countryService.createCountry(duplicateCountry)).rejects.toThrow()
    })
  })

  describe('updateCountry', () => {
    it('should update existing country', async () => {
      const updates = {
        name_en: 'Updated Saudi Arabia',
        name_ar: 'المملكة العربية السعودية المحدثة',
        capital_en: 'Updated Riyadh'
      }

      const mockUpdatedCountry = {
        id: '1',
        iso_code_2: 'SA',
        iso_code_3: 'SAU',
        name_en: 'Updated Saudi Arabia',
        name_ar: 'المملكة العربية السعودية المحدثة',
        region: 'asia',
        capital_en: 'Updated Riyadh',
        capital_ar: 'الرياض',
        status: 'active',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedCountry,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.updateCountry('1', updates)

      expect(result).toEqual(mockUpdatedCountry)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when country not found for update', async () => {
      const updates = { name_en: 'Updated Name' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Country not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(countryService.updateCountry('999', updates)).rejects.toThrow('Country not found')
    })
  })

  describe('deleteCountry', () => {
    it('should delete country', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1' },
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await countryService.deleteCountry('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when country not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Country not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(countryService.deleteCountry('999')).rejects.toThrow('Country not found')
    })
  })

  describe('searchCountries', () => {
    it('should search countries by multiple criteria', async () => {
      const mockCountries = [
        {
          id: '1',
          iso_code_2: 'SA',
          iso_code_3: 'SAU',
          name_en: 'Saudi Arabia',
          name_ar: 'المملكة العربية السعودية',
          region: 'asia',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockCountries,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.searchCountries({
        query: 'Saudi',
        region: 'asia',
        status: 'active'
      })

      expect(result.data).toEqual(mockCountries)
    })

    it('should handle empty search results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.searchCountries({
        query: 'NonExistentCountry'
      })

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getCountriesByRegion', () => {
    it('should return countries grouped by region', async () => {
      const mockCountries = [
        {
          id: '1',
          iso_code_2: 'SA',
          iso_code_3: 'SAU',
          name_en: 'Saudi Arabia',
          name_ar: 'المملكة العربية السعودية',
          region: 'asia',
          status: 'active'
        },
        {
          id: '2',
          iso_code_2: 'AE',
          iso_code_3: 'ARE',
          name_en: 'United Arab Emirates',
          name_ar: 'دولة الإمارات العربية المتحدة',
          region: 'asia',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCountries,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countryService.getCountriesByRegion('asia')

      expect(result).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('region', 'asia')
    })
  })

  describe('validateCountryData', () => {
    it('should validate country data structure', () => {
      const validCountry = {
        iso_code_2: 'SA',
        iso_code_3: 'SAU',
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        region: 'asia'
      }

      expect(() => countryService.validateCountryData(validCountry)).not.toThrow()
    })

    it('should throw error for invalid ISO codes', () => {
      const invalidCountry = {
        iso_code_2: 'INVALID',
        iso_code_3: 'SAU',
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        region: 'asia'
      }

      expect(() => countryService.validateCountryData(invalidCountry)).toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidCountry = {
        iso_code_2: 'SA',
        // Missing required fields
      }

      expect(() => countryService.validateCountryData(invalidCountry as any)).toThrow()
    })
  })
})