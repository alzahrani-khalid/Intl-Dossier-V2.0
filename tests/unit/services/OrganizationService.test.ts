import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrganizationService } from '../../../backend/src/services/OrganizationService'
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

describe('OrganizationService', () => {
  let organizationService: OrganizationService

  beforeEach(() => {
    organizationService = new OrganizationService()
    vi.clearAllMocks()
  })

  describe('getAllOrganizations', () => {
    it('should return all organizations with pagination', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active',
          established_date: '2020-01-01'
        },
        {
          id: '2',
          code: 'UN',
          name_en: 'United Nations',
          name_ar: 'الأمم المتحدة',
          type: 'international',
          country_id: 'country-2',
          status: 'active',
          established_date: '1945-10-24'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockOrganizations,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getAllOrganizations({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockOrganizations)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('organizations')
    })

    it('should filter organizations by type', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockOrganizations,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getAllOrganizations({
        page: 1,
        limit: 10,
        type: 'government'
      })

      expect(result.data).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'government')
    })

    it('should filter organizations by country', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockOrganizations,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getAllOrganizations({
        page: 1,
        limit: 10,
        country_id: 'country-1'
      })

      expect(result.data).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('country_id', 'country-1')
    })

    it('should search organizations by name', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockOrganizations,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getAllOrganizations({
        page: 1,
        limit: 10,
        search: 'Statistics'
      })

      expect(result.data).toEqual(mockOrganizations)
      expect(mockQuery.ilike).toHaveBeenCalledWith('name_en', '%Statistics%')
    })
  })

  describe('getOrganizationById', () => {
    it('should return organization by ID', async () => {
      const mockOrganization = {
        id: '1',
        code: 'GASTAT',
        name_en: 'General Authority for Statistics',
        name_ar: 'الهيئة العامة للإحصاء',
        type: 'government',
        country_id: 'country-1',
        status: 'active',
        established_date: '2020-01-01'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOrganization,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getOrganizationById('1')

      expect(result).toEqual(mockOrganization)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when organization not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Organization not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(organizationService.getOrganizationById('999')).rejects.toThrow('Organization not found')
    })
  })

  describe('createOrganization', () => {
    it('should create new organization', async () => {
      const newOrganization = {
        code: 'NEWORG',
        name_en: 'New Organization',
        name_ar: 'منظمة جديدة',
        type: 'ngo',
        country_id: 'country-1',
        website: 'https://neworg.com',
        email: 'info@neworg.com'
      }

      const mockCreatedOrganization = {
        id: '3',
        ...newOrganization,
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedOrganization,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.createOrganization(newOrganization)

      expect(result).toEqual(mockCreatedOrganization)
      expect(mockQuery.insert).toHaveBeenCalledWith(newOrganization)
    })

    it('should validate required fields', async () => {
      const invalidOrganization = {
        code: 'NEWORG',
        // Missing required fields
      }

      await expect(organizationService.createOrganization(invalidOrganization as any)).rejects.toThrow()
    })

    it('should handle duplicate organization codes', async () => {
      const duplicateOrganization = {
        code: 'GASTAT', // Already exists
        name_en: 'Duplicate Organization',
        name_ar: 'منظمة مكررة',
        type: 'government',
        country_id: 'country-1'
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

      await expect(organizationService.createOrganization(duplicateOrganization)).rejects.toThrow()
    })
  })

  describe('updateOrganization', () => {
    it('should update existing organization', async () => {
      const updates = {
        name_en: 'Updated Organization Name',
        name_ar: 'اسم المنظمة المحدث',
        website: 'https://updated.org'
      }

      const mockUpdatedOrganization = {
        id: '1',
        code: 'GASTAT',
        name_en: 'Updated Organization Name',
        name_ar: 'اسم المنظمة المحدث',
        type: 'government',
        country_id: 'country-1',
        website: 'https://updated.org',
        status: 'active',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedOrganization,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.updateOrganization('1', updates)

      expect(result).toEqual(mockUpdatedOrganization)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when organization not found for update', async () => {
      const updates = { name_en: 'Updated Name' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Organization not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(organizationService.updateOrganization('999', updates)).rejects.toThrow('Organization not found')
    })
  })

  describe('deleteOrganization', () => {
    it('should delete organization', async () => {
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

      await organizationService.deleteOrganization('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when organization not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Organization not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(organizationService.deleteOrganization('999')).rejects.toThrow('Organization not found')
    })
  })

  describe('getOrganizationsByType', () => {
    it('should return organizations by type', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrganizations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getOrganizationsByType('government')

      expect(result).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'government')
    })
  })

  describe('getOrganizationsByCountry', () => {
    it('should return organizations by country', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrganizations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getOrganizationsByCountry('country-1')

      expect(result).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('country_id', 'country-1')
    })
  })

  describe('searchOrganizations', () => {
    it('should search organizations by multiple criteria', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'GASTAT',
          name_en: 'General Authority for Statistics',
          name_ar: 'الهيئة العامة للإحصاء',
          type: 'government',
          country_id: 'country-1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockOrganizations,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.searchOrganizations({
        query: 'Statistics',
        type: 'government',
        country_id: 'country-1'
      })

      expect(result.data).toEqual(mockOrganizations)
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

      const result = await organizationService.searchOrganizations({
        query: 'NonExistentOrganization'
      })

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('validateOrganizationData', () => {
    it('should validate organization data structure', () => {
      const validOrganization = {
        code: 'TEST',
        name_en: 'Test Organization',
        name_ar: 'منظمة تجريبية',
        type: 'ngo',
        country_id: 'country-1'
      }

      expect(() => organizationService.validateOrganizationData(validOrganization)).not.toThrow()
    })

    it('should throw error for invalid organization code format', () => {
      const invalidOrganization = {
        code: 'invalid-code-with-lowercase', // Should be uppercase
        name_en: 'Test Organization',
        name_ar: 'منظمة تجريبية',
        type: 'ngo',
        country_id: 'country-1'
      }

      expect(() => organizationService.validateOrganizationData(invalidOrganization)).toThrow()
    })

    it('should throw error for invalid organization type', () => {
      const invalidOrganization = {
        code: 'TEST',
        name_en: 'Test Organization',
        name_ar: 'منظمة تجريبية',
        type: 'invalid-type',
        country_id: 'country-1'
      }

      expect(() => organizationService.validateOrganizationData(invalidOrganization)).toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidOrganization = {
        code: 'TEST',
        // Missing required fields
      }

      expect(() => organizationService.validateOrganizationData(invalidOrganization as any)).toThrow()
    })
  })

  describe('getOrganizationHierarchy', () => {
    it('should return organization hierarchy', async () => {
      const mockOrganizations = [
        {
          id: '1',
          code: 'PARENT',
          name_en: 'Parent Organization',
          name_ar: 'المنظمة الأم',
          type: 'government',
          country_id: 'country-1',
          parent_organization_id: null,
          status: 'active'
        },
        {
          id: '2',
          code: 'CHILD',
          name_en: 'Child Organization',
          name_ar: 'المنظمة الفرعية',
          type: 'government',
          country_id: 'country-1',
          parent_organization_id: '1',
          status: 'active'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockOrganizations,
            error: null
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationService.getOrganizationHierarchy()

      expect(result).toEqual(mockOrganizations)
    })
  })
})
