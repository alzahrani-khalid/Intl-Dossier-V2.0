import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CountrySearchService, createCountrySearchService } from '../../../backend/src/services/countries-search'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      ilike: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => ({
                    data: [],
                    error: null,
                    count: 0
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}

// Mock createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

describe('CountrySearchService', () => {
  let searchService: CountrySearchService

  beforeEach(() => {
    vi.clearAllMocks()
    searchService = new CountrySearchService('http://test.supabase.co', 'test-key')
  })

  describe('search', () => {
    it('should search countries with basic filters', async () => {
      const mockData = [
        { id: '1', name_en: 'Saudi Arabia', name_ar: 'المملكة العربية السعودية', region: 'asia' }
      ]
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = mockData
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 1

      const result = await searchService.search({
        filters: { name: 'Saudi', region: 'asia' },
        page: 1,
        pageSize: 20
      })

      expect(result).toEqual({
        data: mockData,
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      })
    })

    it('should apply name filter correctly', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: { name: 'United' }
      })

      expect(mockSupabase.from().select().ilike).toHaveBeenCalledWith('name_en', '%United%')
    })

    it('should apply Arabic name filter correctly', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: { nameAr: 'المملكة' }
      })

      expect(mockSupabase.from().select().ilike).toHaveBeenCalledWith('name_ar', '%المملكة%')
    })

    it('should apply region filter correctly', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: { region: 'asia' }
      })

      expect(mockSupabase.from().select().ilike().eq).toHaveBeenCalledWith('region', 'asia')
    })

    it('should apply ISO code filter correctly', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: { isoCode: 'sa' }
      })

      expect(mockSupabase.from().select().ilike().eq().or).toHaveBeenCalledWith('iso_code_2.eq.SA,iso_code_3.eq.SA')
    })

    it('should apply population range filters', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: { populationMin: 1000000, populationMax: 50000000 }
      })

      expect(mockSupabase.from().select().ilike().eq().or().gte).toHaveBeenCalledWith('population', 1000000)
      expect(mockSupabase.from().select().ilike().eq().or().gte().lte).toHaveBeenCalledWith('population', 50000000)
    })

    it('should apply area range filters', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: { areaMin: 1000, areaMax: 100000 }
      })

      expect(mockSupabase.from().select().ilike().eq().or().gte).toHaveBeenCalledWith('area_sq_km', 1000)
      expect(mockSupabase.from().select().ilike().eq().or().gte().lte).toHaveBeenCalledWith('area_sq_km', 100000)
    })

    it('should apply sorting correctly', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: {},
        sortBy: 'population',
        sortOrder: 'desc'
      })

      expect(mockSupabase.from().select().ilike().eq().or().gte().lte().order).toHaveBeenCalledWith('population', { ascending: false })
    })

    it('should apply pagination correctly', async () => {
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = []
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 0

      await searchService.search({
        filters: {},
        page: 3,
        pageSize: 10
      })

      expect(mockSupabase.from().select().ilike().eq().or().gte().lte().order().range).toHaveBeenCalledWith(20, 29)
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().error = error

      await expect(searchService.search({ filters: {} })).rejects.toThrow('Country search failed: Database connection failed')
    })
  })

  describe('searchByText', () => {
    it('should search by English text', async () => {
      const mockData = [{ id: '1', name_en: 'Saudi Arabia' }]
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = mockData
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 1

      const result = await searchService.searchByText('Saudi', 'en')

      expect(result.data).toEqual(mockData)
      expect(mockSupabase.from().select().ilike).toHaveBeenCalledWith('name_en', '%Saudi%')
    })

    it('should search by Arabic text', async () => {
      const mockData = [{ id: '1', name_ar: 'المملكة العربية السعودية' }]
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = mockData
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 1

      const result = await searchService.searchByText('المملكة', 'ar')

      expect(result.data).toEqual(mockData)
      expect(mockSupabase.from().select().ilike).toHaveBeenCalledWith('name_ar', '%المملكة%')
    })
  })

  describe('getByRegion', () => {
    it('should get countries by region', async () => {
      const mockData = [{ id: '1', name_en: 'Saudi Arabia', region: 'asia' }]
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = mockData
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 1

      const result = await searchService.getByRegion('asia')

      expect(result.data).toEqual(mockData)
      expect(mockSupabase.from().select().ilike().eq).toHaveBeenCalledWith('region', 'asia')
    })
  })

  describe('getActiveCountries', () => {
    it('should get only active countries', async () => {
      const mockData = [{ id: '1', name_en: 'Saudi Arabia', status: 'active' }]
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().data = mockData
      mockSupabase.from().select().ilike().eq().or().gte().lte().order().range().count = 1

      const result = await searchService.getActiveCountries()

      expect(result.data).toEqual(mockData)
      expect(mockSupabase.from().select().ilike().eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('autocomplete', () => {
    it('should return autocomplete results for English', async () => {
      const mockData = [
        { id: '1', name_en: 'Saudi Arabia', iso_code_2: 'SA' },
        { id: '2', name_en: 'United States', iso_code_2: 'US' }
      ]
      mockSupabase.from().select().ilike().eq().order().limit().data = mockData

      const result = await searchService.autocomplete('Sau', 'en', 5)

      expect(result).toEqual([
        { id: '1', name: 'Saudi Arabia', code: 'SA' },
        { id: '2', name: 'United States', code: 'US' }
      ])
      expect(mockSupabase.from().select).toHaveBeenCalledWith('id, name_en, iso_code_2')
    })

    it('should return autocomplete results for Arabic', async () => {
      const mockData = [
        { id: '1', name_ar: 'المملكة العربية السعودية', iso_code_2: 'SA' }
      ]
      mockSupabase.from().select().ilike().eq().order().limit().data = mockData

      const result = await searchService.autocomplete('المملكة', 'ar', 5)

      expect(result).toEqual([
        { id: '1', name: 'المملكة العربية السعودية', code: 'SA' }
      ])
      expect(mockSupabase.from().select).toHaveBeenCalledWith('id, name_ar, iso_code_2')
    })

    it('should handle autocomplete errors', async () => {
      const error = new Error('Autocomplete failed')
      mockSupabase.from().select().ilike().eq().order().limit().error = error

      await expect(searchService.autocomplete('test')).rejects.toThrow('Autocomplete failed: Autocomplete failed')
    })
  })

  describe('getCountriesWithStats', () => {
    it('should return countries with statistics', async () => {
      const mockCountries = [
        { id: '1', name_en: 'Saudi Arabia', status: 'active' }
      ]
      mockSupabase.from().select().eq().data = mockCountries
      mockSupabase.from().select().eq().count = 5 // org count
      mockSupabase.from().select().eq().count = 3 // event count
      mockSupabase.from().select().data = [{ id: 'org1' }] // org IDs
      mockSupabase.from().select().or().count = 2 // MoU count

      const result = await searchService.getCountriesWithStats()

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('stats')
      expect(result[0].stats).toEqual({
        organizations: 5,
        events: 3,
        mous: 2
      })
    })

    it('should handle errors in getCountriesWithStats', async () => {
      const error = new Error('Failed to fetch countries')
      mockSupabase.from().select().eq().error = error

      await expect(searchService.getCountriesWithStats()).rejects.toThrow('Failed to fetch countries: Failed to fetch countries')
    })
  })

  describe('bulkSearch', () => {
    it('should search multiple countries by ISO codes', async () => {
      const mockData = [
        { id: '1', name_en: 'Saudi Arabia', iso_code_2: 'SA' },
        { id: '2', name_en: 'United States', iso_code_2: 'US' }
      ]
      mockSupabase.from().select().or().data = mockData

      const result = await searchService.bulkSearch(['sa', 'us'])

      expect(result).toEqual(mockData)
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*')
    })

    it('should handle bulk search errors', async () => {
      const error = new Error('Bulk search failed')
      mockSupabase.from().select().or().error = error

      await expect(searchService.bulkSearch(['sa'])).rejects.toThrow('Bulk search failed: Bulk search failed')
    })
  })

  describe('createCountrySearchService factory', () => {
    it('should create a CountrySearchService instance', () => {
      const service = createCountrySearchService('http://test.supabase.co', 'test-key')
      expect(service).toBeInstanceOf(CountrySearchService)
    })
  })
})