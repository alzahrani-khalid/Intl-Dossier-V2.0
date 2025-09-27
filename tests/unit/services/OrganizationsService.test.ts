import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrganizationsService } from '../../../backend/src/services/OrganizationsService'
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

describe('OrganizationsService', () => {
  let organizationsService: OrganizationsService

  beforeEach(() => {
    organizationsService = new OrganizationsService()
    vi.clearAllMocks()
  })

  describe('getAllOrganizations', () => {
    it('should return all organizations with pagination', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'European Union',
          type: 'regional',
          description: 'A political and economic union of 27 European countries',
          headquarters: 'Brussels, Belgium',
          website: 'https://europa.eu',
          established_date: '1993-11-01',
          member_count: 27,
          status: 'active',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
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

      const result = await organizationsService.getAllOrganizations({
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
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await organizationsService.getAllOrganizations({
        page: 1,
        limit: 10,
        type: 'international'
      })

      expect(result.data).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'international')
    })

    it('should filter organizations by status', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await organizationsService.getAllOrganizations({
        page: 1,
        limit: 10,
        status: 'active'
      })

      expect(result.data).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('should filter organizations by member count range', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
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

      const result = await organizationsService.getAllOrganizations({
        page: 1,
        limit: 10,
        min_member_count: 100,
        max_member_count: 200
      })

      expect(result.data).toEqual(mockOrganizations)
    })

    it('should filter organizations by established date range', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
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

      const result = await organizationsService.getAllOrganizations({
        page: 1,
        limit: 10,
        established_date_from: '1940-01-01',
        established_date_to: '1950-12-31'
      })

      expect(result.data).toEqual(mockOrganizations)
    })
  })

  describe('getOrganizationById', () => {
    it('should return organization by ID', async () => {
      const mockOrganization = {
        id: '1',
        name: 'United Nations',
        type: 'international',
        description: 'An international organization founded in 1945',
        headquarters: 'New York, NY, USA',
        website: 'https://www.un.org',
        established_date: '1945-10-24',
        member_count: 193,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
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

      const result = await organizationsService.getOrganizationById('1')

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

      await expect(organizationsService.getOrganizationById('999')).rejects.toThrow('Organization not found')
    })
  })

  describe('createOrganization', () => {
    it('should create new organization', async () => {
      const newOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new international organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'active'
      }

      const mockCreatedOrganization = {
        id: '3',
        ...newOrganization,
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

      const result = await organizationsService.createOrganization(newOrganization)

      expect(result).toEqual(mockCreatedOrganization)
      expect(mockQuery.insert).toHaveBeenCalledWith(newOrganization)
    })

    it('should validate required fields', async () => {
      const invalidOrganization = {
        name: 'New Organization',
        // Missing required fields
      }

      await expect(organizationsService.createOrganization(invalidOrganization as any)).rejects.toThrow()
    })

    it('should validate organization type', async () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'invalid-type',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'active'
      }

      await expect(organizationsService.createOrganization(invalidOrganization)).rejects.toThrow()
    })

    it('should validate status', async () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'invalid-status'
      }

      await expect(organizationsService.createOrganization(invalidOrganization)).rejects.toThrow()
    })

    it('should validate member count', async () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: -10, // Negative member count
        status: 'active'
      }

      await expect(organizationsService.createOrganization(invalidOrganization)).rejects.toThrow()
    })

    it('should validate website URL', async () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'invalid-url',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'active'
      }

      await expect(organizationsService.createOrganization(invalidOrganization)).rejects.toThrow()
    })
  })

  describe('updateOrganization', () => {
    it('should update existing organization', async () => {
      const updates = {
        name: 'Updated Organization',
        member_count: 100
      }

      const mockUpdatedOrganization = {
        id: '1',
        name: 'Updated Organization',
        type: 'international',
        description: 'An international organization founded in 1945',
        headquarters: 'New York, NY, USA',
        website: 'https://www.un.org',
        established_date: '1945-10-24',
        member_count: 100,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
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

      const result = await organizationsService.updateOrganization('1', updates)

      expect(result).toEqual(mockUpdatedOrganization)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when organization not found for update', async () => {
      const updates = { name: 'Updated Organization' }

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

      await expect(organizationsService.updateOrganization('999', updates)).rejects.toThrow('Organization not found')
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

      await organizationsService.deleteOrganization('1')

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

      await expect(organizationsService.deleteOrganization('999')).rejects.toThrow('Organization not found')
    })
  })

  describe('searchOrganizations', () => {
    it('should search organizations by name', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrganizations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationsService.searchOrganizations('United')

      expect(result).toEqual(mockOrganizations)
    })
  })

  describe('getOrganizationsByType', () => {
    it('should return organizations by type', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await organizationsService.getOrganizationsByType('international')

      expect(result).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'international')
    })
  })

  describe('getOrganizationsByStatus', () => {
    it('should return organizations by status', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await organizationsService.getOrganizationsByStatus('active')

      expect(result).toEqual(mockOrganizations)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('getOrganizationsByHeadquarters', () => {
    it('should return organizations by headquarters', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrganizations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationsService.getOrganizationsByHeadquarters('New York')

      expect(result).toEqual(mockOrganizations)
      expect(mockQuery.ilike).toHaveBeenCalledWith('headquarters', '%New York%')
    })
  })

  describe('getOrganizationsByEstablishedDateRange', () => {
    it('should return organizations by established date range', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'United Nations',
          type: 'international',
          description: 'An international organization founded in 1945',
          headquarters: 'New York, NY, USA',
          website: 'https://www.un.org',
          established_date: '1945-10-24',
          member_count: 193,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockOrganizations,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await organizationsService.getOrganizationsByEstablishedDateRange('1940-01-01', '1950-12-31')

      expect(result).toEqual(mockOrganizations)
    })
  })

  describe('validateOrganizationData', () => {
    it('should validate organization data structure', () => {
      const validOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'active'
      }

      expect(() => organizationsService.validateOrganizationData(validOrganization)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidOrganization = {
        name: 'New Organization',
        // Missing required fields
      }

      expect(() => organizationsService.validateOrganizationData(invalidOrganization as any)).toThrow()
    })

    it('should throw error for invalid organization type', () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'invalid-type',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'active'
      }

      expect(() => organizationsService.validateOrganizationData(invalidOrganization)).toThrow()
    })

    it('should throw error for invalid status', () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'invalid-status'
      }

      expect(() => organizationsService.validateOrganizationData(invalidOrganization)).toThrow()
    })

    it('should throw error for negative member count', () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'https://www.neworg.org',
        established_date: '2025-01-01',
        member_count: -10, // Negative member count
        status: 'active'
      }

      expect(() => organizationsService.validateOrganizationData(invalidOrganization)).toThrow()
    })

    it('should throw error for invalid website URL', () => {
      const invalidOrganization = {
        name: 'New Organization',
        type: 'international',
        description: 'A new organization',
        headquarters: 'New York, NY, USA',
        website: 'invalid-url',
        established_date: '2025-01-01',
        member_count: 50,
        status: 'active'
      }

      expect(() => organizationsService.validateOrganizationData(invalidOrganization)).toThrow()
    })
  })
})