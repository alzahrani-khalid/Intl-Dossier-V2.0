/**
 * RBAC middleware tests
 *
 * Tests hierarchical role-based access control:
 * - requireMinRole: blocks lower roles, passes higher roles
 * - requirePermission: blocks missing permissions
 * - requireClearance: blocks insufficient clearance levels
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { requireMinRole, requirePermission, requireClearance, ROLE_HIERARCHY } from '../../backend/src/middleware/rbac'
import { createMockUser, createMockRequest, createMockResponse, createMockNext } from './test-helpers'

describe('RBAC middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction & ReturnType<any>

  beforeEach(() => {
    mockReq = createMockRequest()
    mockRes = createMockResponse()
    mockNext = createMockNext()
  })

  describe('ROLE_HIERARCHY', () => {
    it('should define correct hierarchy levels', () => {
      expect(ROLE_HIERARCHY.super_admin).toBe(100)
      expect(ROLE_HIERARCHY.admin).toBe(80)
      expect(ROLE_HIERARCHY.manager).toBe(60)
      expect(ROLE_HIERARCHY.editor).toBe(40)
      expect(ROLE_HIERARCHY.viewer).toBe(20)
    })
  })

  describe('requireMinRole', () => {
    it('should return 401 when no user is present', () => {
      const middleware = requireMinRole('viewer')
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'UnauthorizedError',
          message: 'Authentication required',
        }),
      )
    })

    it('should block viewer when editor role is required', () => {
      mockReq.user = createMockUser({ role: 'viewer' })
      const middleware = requireMinRole('editor')
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ForbiddenError',
          message: 'Requires minimum role: editor',
        }),
      )
    })

    it('should allow admin when editor role is required', () => {
      mockReq.user = createMockUser({ role: 'admin' })
      const middleware = requireMinRole('editor')
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should block admin when super_admin is required', () => {
      mockReq.user = createMockUser({ role: 'admin' })
      const middleware = requireMinRole('super_admin')
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ForbiddenError',
          message: 'Requires minimum role: super_admin',
        }),
      )
    })

    it('should allow exact role match', () => {
      mockReq.user = createMockUser({ role: 'manager' })
      const middleware = requireMinRole('manager')
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should allow super_admin for any role requirement', () => {
      mockReq.user = createMockUser({ role: 'super_admin' })
      const middleware = requireMinRole('admin')
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })
  })

  describe('requireClearance', () => {
    it('should block user with clearance_level=2 when 3 is required', () => {
      mockReq.user = createMockUser({ clearance_level: 2 })
      const middleware = requireClearance(3)
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ForbiddenError',
          message: 'Requires clearance level 3 or higher',
        }),
      )
    })

    it('should allow user with clearance_level=5 when 3 is required', () => {
      mockReq.user = createMockUser({ clearance_level: 5 })
      const middleware = requireClearance(3)
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should return 401 when no user is present', () => {
      const middleware = requireClearance(1)
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'UnauthorizedError',
        }),
      )
    })
  })

  describe('requirePermission', () => {
    it('should block user without required permission', () => {
      mockReq.user = createMockUser({ permissions: ['read:countries'] })
      const middleware = requirePermission(['write:countries'])
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ForbiddenError',
          message: 'Insufficient permissions',
        }),
      )
    })

    it('should allow user with matching permission', () => {
      mockReq.user = createMockUser({ permissions: ['write:countries', 'read:countries'] })
      const middleware = requirePermission(['write:countries'])
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should allow if user has at least one of the required permissions', () => {
      mockReq.user = createMockUser({ permissions: ['delete:countries'] })
      const middleware = requirePermission(['write:countries', 'delete:countries'])
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should return 401 when no user is present', () => {
      const middleware = requirePermission(['write:countries'])
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'UnauthorizedError',
        }),
      )
    })
  })
})
