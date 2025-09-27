import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IntelligenceService } from '../../../backend/src/services/IntelligenceService'
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

describe('IntelligenceService', () => {
  let intelligenceService: IntelligenceService

  beforeEach(() => {
    intelligenceService = new IntelligenceService()
    vi.clearAllMocks()
  })

  describe('getAllIntelligenceSources', () => {
    it('should return all intelligence sources with pagination', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Test Source',
          name_ar: 'مصدر تجريبي',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name_en: 'Another Source',
          name_ar: 'مصدر آخر',
          type: 'academic',
          status: 'inactive',
          created_by: 'user-2',
          organization_id: 'org-2',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockSources,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getAllIntelligenceSources({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockSources)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('intelligence_sources')
    })

    it('should filter sources by type', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Government Source',
          name_ar: 'مصدر حكومي',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockSources,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getAllIntelligenceSources({
        page: 1,
        limit: 10,
        type: 'government'
      })

      expect(result.data).toEqual(mockSources)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'government')
    })

    it('should filter sources by status', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Active Source',
          name_ar: 'مصدر نشط',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockSources,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getAllIntelligenceSources({
        page: 1,
        limit: 10,
        status: 'active'
      })

      expect(result.data).toEqual(mockSources)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('should filter sources by organization', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Organization Source',
          name_ar: 'مصدر المنظمة',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockSources,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getAllIntelligenceSources({
        page: 1,
        limit: 10,
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockSources)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })

    it('should filter sources by date range', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Source in Range',
          name_ar: 'مصدر في النطاق',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockSources,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getAllIntelligenceSources({
        page: 1,
        limit: 10,
        created_from: '2025-01-01T00:00:00Z',
        created_to: '2025-01-31T23:59:59Z'
      })

      expect(result.data).toEqual(mockSources)
    })
  })

  describe('getIntelligenceSourceById', () => {
    it('should return intelligence source by ID', async () => {
      const mockSource = {
        id: '1',
        name_en: 'Test Source',
        name_ar: 'مصدر تجريبي',
        type: 'government',
        status: 'active',
        created_by: 'user-1',
        organization_id: 'org-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSource,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getIntelligenceSourceById('1')

      expect(result).toEqual(mockSource)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when intelligence source not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Intelligence source not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(intelligenceService.getIntelligenceSourceById('999')).rejects.toThrow('Intelligence source not found')
    })
  })

  describe('createIntelligenceSource', () => {
    it('should create new intelligence source', async () => {
      const newSource = {
        name_en: 'New Source',
        name_ar: 'مصدر جديد',
        type: 'government',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      const mockCreatedSource = {
        id: '3',
        ...newSource,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedSource,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.createIntelligenceSource(newSource)

      expect(result).toEqual(mockCreatedSource)
      expect(mockQuery.insert).toHaveBeenCalledWith(newSource)
    })

    it('should validate required fields', async () => {
      const invalidSource = {
        name_en: 'New Source',
        // Missing required fields
      }

      await expect(intelligenceService.createIntelligenceSource(invalidSource as any)).rejects.toThrow()
    })

    it('should validate source type', async () => {
      const invalidSource = {
        name_en: 'New Source',
        name_ar: 'مصدر جديد',
        type: 'invalid-type',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      await expect(intelligenceService.createIntelligenceSource(invalidSource)).rejects.toThrow()
    })
  })

  describe('updateIntelligenceSource', () => {
    it('should update existing intelligence source', async () => {
      const updates = {
        name_en: 'Updated Source Name',
        name_ar: 'اسم المصدر المحدث',
        description_en: 'Updated description'
      }

      const mockUpdatedSource = {
        id: '1',
        name_en: 'Updated Source Name',
        name_ar: 'اسم المصدر المحدث',
        description_en: 'Updated description',
        type: 'government',
        status: 'active',
        created_by: 'user-1',
        organization_id: 'org-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedSource,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.updateIntelligenceSource('1', updates)

      expect(result).toEqual(mockUpdatedSource)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when intelligence source not found for update', async () => {
      const updates = { name_en: 'Updated Name' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Intelligence source not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(intelligenceService.updateIntelligenceSource('999', updates)).rejects.toThrow('Intelligence source not found')
    })
  })

  describe('deleteIntelligenceSource', () => {
    it('should delete intelligence source', async () => {
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

      await intelligenceService.deleteIntelligenceSource('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when intelligence source not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Intelligence source not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(intelligenceService.deleteIntelligenceSource('999')).rejects.toThrow('Intelligence source not found')
    })
  })

  describe('activateIntelligenceSource', () => {
    it('should activate intelligence source', async () => {
      const mockActivatedSource = {
        id: '1',
        name_en: 'Test Source',
        name_ar: 'مصدر تجريبي',
        type: 'government',
        status: 'active',
        created_by: 'user-1',
        organization_id: 'org-1',
        activated_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockActivatedSource,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.activateIntelligenceSource('1')

      expect(result).toEqual(mockActivatedSource)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when intelligence source not found for activation', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Intelligence source not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(intelligenceService.activateIntelligenceSource('999')).rejects.toThrow('Intelligence source not found')
    })
  })

  describe('deactivateIntelligenceSource', () => {
    it('should deactivate intelligence source', async () => {
      const mockDeactivatedSource = {
        id: '1',
        name_en: 'Test Source',
        name_ar: 'مصدر تجريبي',
        type: 'government',
        status: 'inactive',
        created_by: 'user-1',
        organization_id: 'org-1',
        deactivated_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDeactivatedSource,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.deactivateIntelligenceSource('1')

      expect(result).toEqual(mockDeactivatedSource)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when intelligence source not found for deactivation', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Intelligence source not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(intelligenceService.deactivateIntelligenceSource('999')).rejects.toThrow('Intelligence source not found')
    })
  })

  describe('getIntelligenceSourcesByType', () => {
    it('should return intelligence sources by type', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Government Source',
          name_ar: 'مصدر حكومي',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockSources,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getIntelligenceSourcesByType('government')

      expect(result).toEqual(mockSources)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'government')
    })
  })

  describe('getIntelligenceSourcesByOrganization', () => {
    it('should return intelligence sources by organization', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Organization Source',
          name_ar: 'مصدر المنظمة',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockSources,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getIntelligenceSourcesByOrganization('org-1')

      expect(result).toEqual(mockSources)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })
  })

  describe('getActiveIntelligenceSources', () => {
    it('should return active intelligence sources', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Active Source',
          name_ar: 'مصدر نشط',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          activated_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockSources,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.getActiveIntelligenceSources()

      expect(result).toEqual(mockSources)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('searchIntelligenceSources', () => {
    it('should search intelligence sources by multiple criteria', async () => {
      const mockSources = [
        {
          id: '1',
          name_en: 'Test Source',
          name_ar: 'مصدر تجريبي',
          type: 'government',
          status: 'active',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockSources,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await intelligenceService.searchIntelligenceSources({
        query: 'Test',
        type: 'government',
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockSources)
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

      const result = await intelligenceService.searchIntelligenceSources({
        query: 'NonExistentSource'
      })

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('validateIntelligenceSourceData', () => {
    it('should validate intelligence source data structure', () => {
      const validSource = {
        name_en: 'Test Source',
        name_ar: 'مصدر تجريبي',
        type: 'government',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      expect(() => intelligenceService.validateIntelligenceSourceData(validSource)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidSource = {
        name_en: 'Test Source',
        // Missing required fields
      }

      expect(() => intelligenceService.validateIntelligenceSourceData(invalidSource as any)).toThrow()
    })

    it('should throw error for invalid source type', () => {
      const invalidSource = {
        name_en: 'Test Source',
        name_ar: 'مصدر تجريبي',
        type: 'invalid-type',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      expect(() => intelligenceService.validateIntelligenceSourceData(invalidSource)).toThrow()
    })
  })
})