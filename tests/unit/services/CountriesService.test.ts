import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CountriesService } from '../../../backend/src/services/CountriesService'
import { supabaseAdmin } from '../../../backend/src/config/supabase'

// Mock supabase
vi.mock('../../../backend/src/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
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
        eq: vi.fn().mockReturnValue({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('CountriesService', () => {
  let countriesService: CountriesService

  beforeEach(() => {
    countriesService = new CountriesService()
    vi.clearAllMocks()
  })

  describe('getAllCountries', () => {
    it('should return all countries with pagination', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Canada',
          code: 'CA',
          iso_code: 'CAN',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Ottawa',
          population: 37742154,
          area: 9984670,
          currency: 'CAD',
          languages: ['en', 'fr'],
          timezones: ['UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00'],
          flag_url: 'https://flagcdn.com/ca.svg',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
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

      const result = await countriesService.getAllCountries({
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
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getAllCountries({
        page: 1,
        limit: 10,
        region: 'North America'
      })

      expect(result.data).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('region', 'North America')
    })

    it('should filter countries by subregion', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getAllCountries({
        page: 1,
        limit: 10,
        subregion: 'Northern America'
      })

      expect(result.data).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('subregion', 'Northern America')
    })

    it('should filter countries by currency', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getAllCountries({
        page: 1,
        limit: 10,
        currency: 'USD'
      })

      expect(result.data).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('currency', 'USD')
    })

    it('should filter countries by language', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
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

      const result = await countriesService.getAllCountries({
        page: 1,
        limit: 10,
        language: 'en'
      })

      expect(result.data).toEqual(mockCountries)
      expect(mockQuery.contains).toHaveBeenCalledWith('languages', ['en'])
    })

    it('should filter countries by population range', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
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

      const result = await countriesService.getAllCountries({
        page: 1,
        limit: 10,
        min_population: 300000000,
        max_population: 400000000
      })

      expect(result.data).toEqual(mockCountries)
    })

    it('should filter countries by area range', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
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

      const result = await countriesService.getAllCountries({
        page: 1,
        limit: 10,
        min_area: 9000000,
        max_area: 10000000
      })

      expect(result.data).toEqual(mockCountries)
    })
  })

  describe('getCountryById', () => {
    it('should return country by ID', async () => {
      const mockCountry = {
        id: '1',
        name: 'United States',
        code: 'US',
        iso_code: 'USA',
        region: 'North America',
        subregion: 'Northern America',
        capital: 'Washington, D.C.',
        population: 331002651,
        area: 9833517,
        currency: 'USD',
        languages: ['en'],
        timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
        flag_url: 'https://flagcdn.com/us.svg',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getCountryById('1')

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

      await expect(countriesService.getCountryById('999')).rejects.toThrow('Country not found')
    })
  })

  describe('getCountryByCode', () => {
    it('should return country by code', async () => {
      const mockCountry = {
        id: '1',
        name: 'United States',
        code: 'US',
        iso_code: 'USA',
        region: 'North America',
        subregion: 'Northern America',
        capital: 'Washington, D.C.',
        population: 331002651,
        area: 9833517,
        currency: 'USD',
        languages: ['en'],
        timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
        flag_url: 'https://flagcdn.com/us.svg',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getCountryByCode('US')

      expect(result).toEqual(mockCountry)
      expect(mockQuery.eq).toHaveBeenCalledWith('code', 'US')
    })

    it('should throw error when country not found by code', async () => {
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

      await expect(countriesService.getCountryByCode('XX')).rejects.toThrow('Country not found')
    })
  })

  describe('getCountryByIsoCode', () => {
    it('should return country by ISO code', async () => {
      const mockCountry = {
        id: '1',
        name: 'United States',
        code: 'US',
        iso_code: 'USA',
        region: 'North America',
        subregion: 'Northern America',
        capital: 'Washington, D.C.',
        population: 331002651,
        area: 9833517,
        currency: 'USD',
        languages: ['en'],
        timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
        flag_url: 'https://flagcdn.com/us.svg',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getCountryByIsoCode('USA')

      expect(result).toEqual(mockCountry)
      expect(mockQuery.eq).toHaveBeenCalledWith('iso_code', 'USA')
    })

    it('should throw error when country not found by ISO code', async () => {
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

      await expect(countriesService.getCountryByIsoCode('XXX')).rejects.toThrow('Country not found')
    })
  })

  describe('createCountry', () => {
    it('should create new country', async () => {
      const newCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      const mockCreatedCountry = {
        id: '3',
        ...newCountry,
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

      const result = await countriesService.createCountry(newCountry)

      expect(result).toEqual(mockCreatedCountry)
      expect(mockQuery.insert).toHaveBeenCalledWith(newCountry)
    })

    it('should validate required fields', async () => {
      const invalidCountry = {
        name: 'New Country',
        // Missing required fields
      }

      await expect(countriesService.createCountry(invalidCountry as any)).rejects.toThrow()
    })

    it('should validate country code format', async () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'INVALID', // Invalid code format
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      await expect(countriesService.createCountry(invalidCountry)).rejects.toThrow()
    })

    it('should validate ISO code format', async () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'INVALID', // Invalid ISO code format
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      await expect(countriesService.createCountry(invalidCountry)).rejects.toThrow()
    })

    it('should validate population', async () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: -1000, // Negative population
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      await expect(countriesService.createCountry(invalidCountry)).rejects.toThrow()
    })

    it('should validate area', async () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: -1000, // Negative area
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      await expect(countriesService.createCountry(invalidCountry)).rejects.toThrow()
    })
  })

  describe('updateCountry', () => {
    it('should update existing country', async () => {
      const updates = {
        name: 'Updated Country',
        population: 2000000
      }

      const mockUpdatedCountry = {
        id: '1',
        name: 'Updated Country',
        code: 'US',
        iso_code: 'USA',
        region: 'North America',
        subregion: 'Northern America',
        capital: 'Washington, D.C.',
        population: 2000000,
        area: 9833517,
        currency: 'USD',
        languages: ['en'],
        timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
        flag_url: 'https://flagcdn.com/us.svg',
        created_at: '2025-01-01T00:00:00Z',
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

      const result = await countriesService.updateCountry('1', updates)

      expect(result).toEqual(mockUpdatedCountry)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when country not found for update', async () => {
      const updates = { name: 'Updated Country' }

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

      await expect(countriesService.updateCountry('999', updates)).rejects.toThrow('Country not found')
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

      await countriesService.deleteCountry('1')

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

      await expect(countriesService.deleteCountry('999')).rejects.toThrow('Country not found')
    })
  })

  describe('searchCountries', () => {
    it('should search countries by name', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCountries,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await countriesService.searchCountries('United')

      expect(result).toEqual(mockCountries)
    })
  })

  describe('getCountriesByRegion', () => {
    it('should return countries by region', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getCountriesByRegion('North America')

      expect(result).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('region', 'North America')
    })
  })

  describe('getCountriesBySubregion', () => {
    it('should return countries by subregion', async () => {
      const mockCountries = [
        {
          id: '1',
          name: 'United States',
          code: 'US',
          iso_code: 'USA',
          region: 'North America',
          subregion: 'Northern America',
          capital: 'Washington, D.C.',
          population: 331002651,
          area: 9833517,
          currency: 'USD',
          languages: ['en'],
          timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
          flag_url: 'https://flagcdn.com/us.svg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await countriesService.getCountriesBySubregion('Northern America')

      expect(result).toEqual(mockCountries)
      expect(mockQuery.eq).toHaveBeenCalledWith('subregion', 'Northern America')
    })
  })

  describe('validateCountryData', () => {
    it('should validate country data structure', () => {
      const validCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      expect(() => countriesService.validateCountryData(validCountry)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidCountry = {
        name: 'New Country',
        // Missing required fields
      }

      expect(() => countriesService.validateCountryData(invalidCountry as any)).toThrow()
    })

    it('should throw error for invalid country code format', () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'INVALID', // Invalid code format
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      expect(() => countriesService.validateCountryData(invalidCountry)).toThrow()
    })

    it('should throw error for invalid ISO code format', () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'INVALID', // Invalid ISO code format
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      expect(() => countriesService.validateCountryData(invalidCountry)).toThrow()
    })

    it('should throw error for negative population', () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: -1000, // Negative population
        area: 1000000,
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      expect(() => countriesService.validateCountryData(invalidCountry)).toThrow()
    })

    it('should throw error for negative area', () => {
      const invalidCountry = {
        name: 'New Country',
        code: 'NC',
        iso_code: 'NCO',
        region: 'Test Region',
        subregion: 'Test Subregion',
        capital: 'Test Capital',
        population: 1000000,
        area: -1000, // Negative area
        currency: 'NCC',
        languages: ['en'],
        timezones: ['UTC+00:00'],
        flag_url: 'https://flagcdn.com/nc.svg'
      }

      expect(() => countriesService.validateCountryData(invalidCountry)).toThrow()
    })
  })
})