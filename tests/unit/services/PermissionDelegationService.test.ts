import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionDelegationService } from '../../../backend/src/services/PermissionDelegationService'
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

describe('PermissionDelegationService', () => {
  let permissionDelegationService: PermissionDelegationService

  beforeEach(() => {
    permissionDelegationService = new PermissionDelegationService()
    vi.clearAllMocks()
  })

  describe('getAllPermissionDelegations', () => {
    it('should return all permission delegations with pagination', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          delegator_id: 'user-2',
          delegate_id: 'user-3',
          permission_type: 'write',
          resource_type: 'event',
          resource_id: 'event-1',
          status: 'expired',
          expires_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockDelegations,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getAllPermissionDelegations({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockDelegations)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('permission_delegations')
    })

    it('should filter delegations by delegator', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDelegations,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getAllPermissionDelegations({
        page: 1,
        limit: 10,
        delegator_id: 'user-1'
      })

      expect(result.data).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('delegator_id', 'user-1')
    })

    it('should filter delegations by delegate', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDelegations,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getAllPermissionDelegations({
        page: 1,
        limit: 10,
        delegate_id: 'user-2'
      })

      expect(result.data).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('delegate_id', 'user-2')
    })

    it('should filter delegations by status', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDelegations,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getAllPermissionDelegations({
        page: 1,
        limit: 10,
        status: 'active'
      })

      expect(result.data).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('should filter delegations by resource type', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockDelegations,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getAllPermissionDelegations({
        page: 1,
        limit: 10,
        resource_type: 'mou'
      })

      expect(result.data).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('resource_type', 'mou')
    })
  })

  describe('getPermissionDelegationById', () => {
    it('should return permission delegation by ID', async () => {
      const mockDelegation = {
        id: '1',
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        status: 'active',
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDelegation,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getPermissionDelegationById('1')

      expect(result).toEqual(mockDelegation)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when permission delegation not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Permission delegation not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(permissionDelegationService.getPermissionDelegationById('999')).rejects.toThrow('Permission delegation not found')
    })
  })

  describe('createPermissionDelegation', () => {
    it('should create new permission delegation', async () => {
      const newDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        expires_at: '2025-12-31T23:59:59Z'
      }

      const mockCreatedDelegation = {
        id: '3',
        ...newDelegation,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedDelegation,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.createPermissionDelegation(newDelegation)

      expect(result).toEqual(mockCreatedDelegation)
      expect(mockQuery.insert).toHaveBeenCalledWith(newDelegation)
    })

    it('should validate required fields', async () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        // Missing required fields
      }

      await expect(permissionDelegationService.createPermissionDelegation(invalidDelegation as any)).rejects.toThrow()
    })

    it('should validate permission type', async () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'invalid-type',
        resource_type: 'mou',
        resource_id: 'mou-1',
        expires_at: '2025-12-31T23:59:59Z'
      }

      await expect(permissionDelegationService.createPermissionDelegation(invalidDelegation)).rejects.toThrow()
    })

    it('should validate resource type', async () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'invalid-type',
        resource_id: 'mou-1',
        expires_at: '2025-12-31T23:59:59Z'
      }

      await expect(permissionDelegationService.createPermissionDelegation(invalidDelegation)).rejects.toThrow()
    })

    it('should validate expiration date', async () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        expires_at: '2024-01-01T00:00:00Z' // Past date
      }

      await expect(permissionDelegationService.createPermissionDelegation(invalidDelegation)).rejects.toThrow()
    })
  })

  describe('updatePermissionDelegation', () => {
    it('should update existing permission delegation', async () => {
      const updates = {
        permission_type: 'write',
        expires_at: '2025-12-31T23:59:59Z'
      }

      const mockUpdatedDelegation = {
        id: '1',
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'write',
        resource_type: 'mou',
        resource_id: 'mou-1',
        status: 'active',
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedDelegation,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.updatePermissionDelegation('1', updates)

      expect(result).toEqual(mockUpdatedDelegation)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when permission delegation not found for update', async () => {
      const updates = { permission_type: 'write' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Permission delegation not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(permissionDelegationService.updatePermissionDelegation('999', updates)).rejects.toThrow('Permission delegation not found')
    })
  })

  describe('deletePermissionDelegation', () => {
    it('should delete permission delegation', async () => {
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

      await permissionDelegationService.deletePermissionDelegation('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when permission delegation not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Permission delegation not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(permissionDelegationService.deletePermissionDelegation('999')).rejects.toThrow('Permission delegation not found')
    })
  })

  describe('revokePermissionDelegation', () => {
    it('should revoke permission delegation', async () => {
      const mockRevokedDelegation = {
        id: '1',
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        status: 'revoked',
        expires_at: '2025-12-31T23:59:59Z',
        revoked_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRevokedDelegation,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.revokePermissionDelegation('1')

      expect(result).toEqual(mockRevokedDelegation)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when permission delegation not found for revocation', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Permission delegation not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(permissionDelegationService.revokePermissionDelegation('999')).rejects.toThrow('Permission delegation not found')
    })
  })

  describe('getPermissionDelegationsByDelegator', () => {
    it('should return permission delegations by delegator', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDelegations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getPermissionDelegationsByDelegator('user-1')

      expect(result).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('delegator_id', 'user-1')
    })
  })

  describe('getPermissionDelegationsByDelegate', () => {
    it('should return permission delegations by delegate', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDelegations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getPermissionDelegationsByDelegate('user-2')

      expect(result).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('delegate_id', 'user-2')
    })
  })

  describe('getActivePermissionDelegations', () => {
    it('should return active permission delegations', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDelegations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getActivePermissionDelegations()

      expect(result).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('getExpiredPermissionDelegations', () => {
    it('should return expired permission delegations', async () => {
      const mockDelegations = [
        {
          id: '1',
          delegator_id: 'user-1',
          delegate_id: 'user-2',
          permission_type: 'read',
          resource_type: 'mou',
          resource_id: 'mou-1',
          status: 'expired',
          expires_at: '2024-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDelegations,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.getExpiredPermissionDelegations()

      expect(result).toEqual(mockDelegations)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'expired')
    })
  })

  describe('checkPermissionDelegation', () => {
    it('should check if user has delegated permission', async () => {
      const mockDelegation = {
        id: '1',
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        status: 'active',
        expires_at: '2025-12-31T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDelegation,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.checkPermissionDelegation(
        'user-2',
        'read',
        'mou',
        'mou-1'
      )

      expect(result).toBe(true)
    })

    it('should return false when no delegation found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No delegation found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await permissionDelegationService.checkPermissionDelegation(
        'user-2',
        'read',
        'mou',
        'mou-1'
      )

      expect(result).toBe(false)
    })
  })

  describe('validatePermissionDelegationData', () => {
    it('should validate permission delegation data structure', () => {
      const validDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        expires_at: '2025-12-31T23:59:59Z'
      }

      expect(() => permissionDelegationService.validatePermissionDelegationData(validDelegation)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        // Missing required fields
      }

      expect(() => permissionDelegationService.validatePermissionDelegationData(invalidDelegation as any)).toThrow()
    })

    it('should throw error for invalid permission type', () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'invalid-type',
        resource_type: 'mou',
        resource_id: 'mou-1',
        expires_at: '2025-12-31T23:59:59Z'
      }

      expect(() => permissionDelegationService.validatePermissionDelegationData(invalidDelegation)).toThrow()
    })

    it('should throw error for invalid resource type', () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'invalid-type',
        resource_id: 'mou-1',
        expires_at: '2025-12-31T23:59:59Z'
      }

      expect(() => permissionDelegationService.validatePermissionDelegationData(invalidDelegation)).toThrow()
    })

    it('should throw error for past expiration date', () => {
      const invalidDelegation = {
        delegator_id: 'user-1',
        delegate_id: 'user-2',
        permission_type: 'read',
        resource_type: 'mou',
        resource_id: 'mou-1',
        expires_at: '2024-01-01T00:00:00Z' // Past date
      }

      expect(() => permissionDelegationService.validatePermissionDelegationData(invalidDelegation)).toThrow()
    })
  })
})