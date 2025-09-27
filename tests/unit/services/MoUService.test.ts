import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MoUService } from '../../../backend/src/services/MoUService'
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

describe('MoUService', () => {
  let mouService: MoUService

  beforeEach(() => {
    mouService = new MoUService()
    vi.clearAllMocks()
  })

  describe('getAllMoUs', () => {
    it('should return all MoUs with pagination', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Test MoU',
          title_ar: 'مذكرة تفاهم تجريبية',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          title_en: 'Another MoU',
          title_ar: 'مذكرة تفاهم أخرى',
          status: 'signed',
          organization_id: 'org-2',
          partner_organization_id: 'org-3',
          created_by: 'user-2',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockMoUs,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getAllMoUs({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockMoUs)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('mous')
    })

    it('should filter MoUs by status', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Draft MoU',
          title_ar: 'مذكرة تفاهم مسودة',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockMoUs,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getAllMoUs({
        page: 1,
        limit: 10,
        status: 'draft'
      })

      expect(result.data).toEqual(mockMoUs)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'draft')
    })

    it('should filter MoUs by organization', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Organization MoU',
          title_ar: 'مذكرة تفاهم المنظمة',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockMoUs,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getAllMoUs({
        page: 1,
        limit: 10,
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockMoUs)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })

    it('should filter MoUs by partner organization', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Partner MoU',
          title_ar: 'مذكرة تفاهم الشريك',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockMoUs,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getAllMoUs({
        page: 1,
        limit: 10,
        partner_organization_id: 'org-2'
      })

      expect(result.data).toEqual(mockMoUs)
      expect(mockQuery.eq).toHaveBeenCalledWith('partner_organization_id', 'org-2')
    })

    it('should filter MoUs by date range', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'MoU in Range',
          title_ar: 'مذكرة تفاهم في النطاق',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
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
                  data: mockMoUs,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getAllMoUs({
        page: 1,
        limit: 10,
        created_from: '2025-01-01T00:00:00Z',
        created_to: '2025-01-31T23:59:59Z'
      })

      expect(result.data).toEqual(mockMoUs)
    })
  })

  describe('getMoUById', () => {
    it('should return MoU by ID', async () => {
      const mockMoU = {
        id: '1',
        title_en: 'Test MoU',
        title_ar: 'مذكرة تفاهم تجريبية',
        status: 'draft',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMoU,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getMoUById('1')

      expect(result).toEqual(mockMoU)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when MoU not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'MoU not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(mouService.getMoUById('999')).rejects.toThrow('MoU not found')
    })
  })

  describe('createMoU', () => {
    it('should create new MoU', async () => {
      const newMoU = {
        title_en: 'New MoU',
        title_ar: 'مذكرة تفاهم جديدة',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1'
      }

      const mockCreatedMoU = {
        id: '3',
        ...newMoU,
        status: 'draft',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedMoU,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.createMoU(newMoU)

      expect(result).toEqual(mockCreatedMoU)
      expect(mockQuery.insert).toHaveBeenCalledWith(newMoU)
    })

    it('should validate required fields', async () => {
      const invalidMoU = {
        title_en: 'New MoU',
        // Missing required fields
      }

      await expect(mouService.createMoU(invalidMoU as any)).rejects.toThrow()
    })

    it('should validate MoU status', async () => {
      const invalidMoU = {
        title_en: 'New MoU',
        title_ar: 'مذكرة تفاهم جديدة',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1',
        status: 'invalid-status'
      }

      await expect(mouService.createMoU(invalidMoU)).rejects.toThrow()
    })
  })

  describe('updateMoU', () => {
    it('should update existing MoU', async () => {
      const updates = {
        title_en: 'Updated MoU Title',
        title_ar: 'عنوان مذكرة التفاهم المحدث',
        description_en: 'Updated description'
      }

      const mockUpdatedMoU = {
        id: '1',
        title_en: 'Updated MoU Title',
        title_ar: 'عنوان مذكرة التفاهم المحدث',
        description_en: 'Updated description',
        status: 'draft',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedMoU,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.updateMoU('1', updates)

      expect(result).toEqual(mockUpdatedMoU)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when MoU not found for update', async () => {
      const updates = { title_en: 'Updated Title' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'MoU not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(mouService.updateMoU('999', updates)).rejects.toThrow('MoU not found')
    })
  })

  describe('deleteMoU', () => {
    it('should delete MoU', async () => {
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

      await mouService.deleteMoU('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when MoU not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'MoU not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(mouService.deleteMoU('999')).rejects.toThrow('MoU not found')
    })
  })

  describe('signMoU', () => {
    it('should sign MoU', async () => {
      const mockSignedMoU = {
        id: '1',
        title_en: 'Test MoU',
        title_ar: 'مذكرة تفاهم تجريبية',
        status: 'signed',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1',
        signed_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockSignedMoU,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.signMoU('1')

      expect(result).toEqual(mockSignedMoU)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when MoU not found for signing', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'MoU not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(mouService.signMoU('999')).rejects.toThrow('MoU not found')
    })
  })

  describe('getMoUsByOrganization', () => {
    it('should return MoUs by organization', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Organization MoU',
          title_ar: 'مذكرة تفاهم المنظمة',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMoUs,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getMoUsByOrganization('org-1')

      expect(result).toEqual(mockMoUs)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })
  })

  describe('getMoUsByPartnerOrganization', () => {
    it('should return MoUs by partner organization', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Partner MoU',
          title_ar: 'مذكرة تفاهم الشريك',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMoUs,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getMoUsByPartnerOrganization('org-2')

      expect(result).toEqual(mockMoUs)
      expect(mockQuery.eq).toHaveBeenCalledWith('partner_organization_id', 'org-2')
    })
  })

  describe('getSignedMoUs', () => {
    it('should return signed MoUs', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Signed MoU',
          title_ar: 'مذكرة تفاهم موقعة',
          status: 'signed',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
          signed_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMoUs,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.getSignedMoUs()

      expect(result).toEqual(mockMoUs)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'signed')
    })
  })

  describe('searchMoUs', () => {
    it('should search MoUs by multiple criteria', async () => {
      const mockMoUs = [
        {
          id: '1',
          title_en: 'Test MoU',
          title_ar: 'مذكرة تفاهم تجريبية',
          status: 'draft',
          organization_id: 'org-1',
          partner_organization_id: 'org-2',
          created_by: 'user-1',
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
                  data: mockMoUs,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await mouService.searchMoUs({
        query: 'Test',
        status: 'draft',
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockMoUs)
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

      const result = await mouService.searchMoUs({
        query: 'NonExistentMoU'
      })

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('validateMoUData', () => {
    it('should validate MoU data structure', () => {
      const validMoU = {
        title_en: 'Test MoU',
        title_ar: 'مذكرة تفاهم تجريبية',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1'
      }

      expect(() => mouService.validateMoUData(validMoU)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidMoU = {
        title_en: 'Test MoU',
        // Missing required fields
      }

      expect(() => mouService.validateMoUData(invalidMoU as any)).toThrow()
    })

    it('should throw error for invalid MoU status', () => {
      const invalidMoU = {
        title_en: 'Test MoU',
        title_ar: 'مذكرة تفاهم تجريبية',
        organization_id: 'org-1',
        partner_organization_id: 'org-2',
        created_by: 'user-1',
        status: 'invalid-status'
      }

      expect(() => mouService.validateMoUData(invalidMoU)).toThrow()
    })
  })
})