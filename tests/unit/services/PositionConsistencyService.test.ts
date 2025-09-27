import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PositionConsistencyService } from '../../../backend/src/services/PositionConsistencyService'
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

describe('PositionConsistencyService', () => {
  let positionConsistencyService: PositionConsistencyService

  beforeEach(() => {
    positionConsistencyService = new PositionConsistencyService()
    vi.clearAllMocks()
  })

  describe('getAllPositionConsistencies', () => {
    it('should return all position consistencies with pagination', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          country_id: 'country-2',
          organization_id: 'org-2',
          position: 'Minister',
          consistency_score: 0.87,
          last_checked: '2025-01-02T00:00:00Z',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockConsistencies,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getAllPositionConsistencies({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockConsistencies)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('position_consistencies')
    })

    it('should filter consistencies by country', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockConsistencies,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getAllPositionConsistencies({
        page: 1,
        limit: 10,
        country_id: 'country-1'
      })

      expect(result.data).toEqual(mockConsistencies)
      expect(mockQuery.eq).toHaveBeenCalledWith('country_id', 'country-1')
    })

    it('should filter consistencies by organization', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockConsistencies,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getAllPositionConsistencies({
        page: 1,
        limit: 10,
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockConsistencies)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })

    it('should filter consistencies by position', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockConsistencies,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getAllPositionConsistencies({
        page: 1,
        limit: 10,
        position: 'Ambassador'
      })

      expect(result.data).toEqual(mockConsistencies)
      expect(mockQuery.eq).toHaveBeenCalledWith('position', 'Ambassador')
    })

    it('should filter consistencies by score range', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
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
                  data: mockConsistencies,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getAllPositionConsistencies({
        page: 1,
        limit: 10,
        min_score: 0.9,
        max_score: 1.0
      })

      expect(result.data).toEqual(mockConsistencies)
    })
  })

  describe('getPositionConsistencyById', () => {
    it('should return position consistency by ID', async () => {
      const mockConsistency = {
        id: '1',
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 0.95,
        last_checked: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConsistency,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getPositionConsistencyById('1')

      expect(result).toEqual(mockConsistency)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when position consistency not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Position consistency not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(positionConsistencyService.getPositionConsistencyById('999')).rejects.toThrow('Position consistency not found')
    })
  })

  describe('createPositionConsistency', () => {
    it('should create new position consistency', async () => {
      const newConsistency = {
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 0.95
      }

      const mockCreatedConsistency = {
        id: '3',
        ...newConsistency,
        last_checked: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedConsistency,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.createPositionConsistency(newConsistency)

      expect(result).toEqual(mockCreatedConsistency)
      expect(mockQuery.insert).toHaveBeenCalledWith(newConsistency)
    })

    it('should validate required fields', async () => {
      const invalidConsistency = {
        country_id: 'country-1',
        // Missing required fields
      }

      await expect(positionConsistencyService.createPositionConsistency(invalidConsistency as any)).rejects.toThrow()
    })

    it('should validate consistency score range', async () => {
      const invalidConsistency = {
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 1.5 // Invalid score > 1
      }

      await expect(positionConsistencyService.createPositionConsistency(invalidConsistency)).rejects.toThrow()
    })

    it('should validate position format', async () => {
      const invalidConsistency = {
        country_id: 'country-1',
        organization_id: 'org-1',
        position: '', // Empty position
        consistency_score: 0.95
      }

      await expect(positionConsistencyService.createPositionConsistency(invalidConsistency)).rejects.toThrow()
    })
  })

  describe('updatePositionConsistency', () => {
    it('should update existing position consistency', async () => {
      const updates = {
        consistency_score: 0.98,
        position: 'Senior Ambassador'
      }

      const mockUpdatedConsistency = {
        id: '1',
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Senior Ambassador',
        consistency_score: 0.98,
        last_checked: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedConsistency,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.updatePositionConsistency('1', updates)

      expect(result).toEqual(mockUpdatedConsistency)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when position consistency not found for update', async () => {
      const updates = { consistency_score: 0.98 }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Position consistency not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(positionConsistencyService.updatePositionConsistency('999', updates)).rejects.toThrow('Position consistency not found')
    })
  })

  describe('deletePositionConsistency', () => {
    it('should delete position consistency', async () => {
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

      await positionConsistencyService.deletePositionConsistency('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when position consistency not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Position consistency not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(positionConsistencyService.deletePositionConsistency('999')).rejects.toThrow('Position consistency not found')
    })
  })

  describe('checkPositionConsistency', () => {
    it('should check position consistency for country and organization', async () => {
      const mockConsistency = {
        id: '1',
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 0.95,
        last_checked: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConsistency,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.checkPositionConsistency('country-1', 'org-1')

      expect(result).toEqual(mockConsistency)
      expect(mockQuery.eq).toHaveBeenCalledWith('country_id', 'country-1')
    })

    it('should return null when no consistency found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No consistency found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.checkPositionConsistency('country-1', 'org-1')

      expect(result).toBeNull()
    })
  })

  describe('getPositionConsistenciesByCountry', () => {
    it('should return position consistencies by country', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockConsistencies,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getPositionConsistenciesByCountry('country-1')

      expect(result).toEqual(mockConsistencies)
      expect(mockQuery.eq).toHaveBeenCalledWith('country_id', 'country-1')
    })
  })

  describe('getPositionConsistenciesByOrganization', () => {
    it('should return position consistencies by organization', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.95,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockConsistencies,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getPositionConsistenciesByOrganization('org-1')

      expect(result).toEqual(mockConsistencies)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })
  })

  describe('getLowConsistencyPositions', () => {
    it('should return positions with low consistency scores', async () => {
      const mockConsistencies = [
        {
          id: '1',
          country_id: 'country-1',
          organization_id: 'org-1',
          position: 'Ambassador',
          consistency_score: 0.3,
          last_checked: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockConsistencies,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.getLowConsistencyPositions(0.5)

      expect(result).toEqual(mockConsistencies)
      expect(mockQuery.lte).toHaveBeenCalledWith('consistency_score', 0.5)
    })
  })

  describe('updateConsistencyScore', () => {
    it('should update consistency score', async () => {
      const mockUpdatedConsistency = {
        id: '1',
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 0.98,
        last_checked: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedConsistency,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await positionConsistencyService.updateConsistencyScore('1', 0.98)

      expect(result).toEqual(mockUpdatedConsistency)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when position consistency not found for score update', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Position consistency not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(positionConsistencyService.updateConsistencyScore('999', 0.98)).rejects.toThrow('Position consistency not found')
    })
  })

  describe('validatePositionConsistencyData', () => {
    it('should validate position consistency data structure', () => {
      const validConsistency = {
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 0.95
      }

      expect(() => positionConsistencyService.validatePositionConsistencyData(validConsistency)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidConsistency = {
        country_id: 'country-1',
        // Missing required fields
      }

      expect(() => positionConsistencyService.validatePositionConsistencyData(invalidConsistency as any)).toThrow()
    })

    it('should throw error for invalid consistency score', () => {
      const invalidConsistency = {
        country_id: 'country-1',
        organization_id: 'org-1',
        position: 'Ambassador',
        consistency_score: 1.5 // Invalid score > 1
      }

      expect(() => positionConsistencyService.validatePositionConsistencyData(invalidConsistency)).toThrow()
    })

    it('should throw error for empty position', () => {
      const invalidConsistency = {
        country_id: 'country-1',
        organization_id: 'org-1',
        position: '', // Empty position
        consistency_score: 0.95
      }

      expect(() => positionConsistencyService.validatePositionConsistencyData(invalidConsistency)).toThrow()
    })
  })
})