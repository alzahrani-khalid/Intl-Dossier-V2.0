import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { PermissionDelegationService } from '../services/permission-delegation.service'
import { authenticate } from '../middleware/auth'
import { validate } from '../utils/validation'

const router = Router()
let permissionService: PermissionDelegationService

function initializePermissionsRouter(supabaseUrl: string, supabaseKey: string): Router {
  permissionService = new PermissionDelegationService(supabaseUrl, supabaseKey)
  return router
}

// Validation schemas
const delegateBodySchema = z.object({
  grantee_id: z.string().uuid(),
  resource_type: z.enum(['dossier', 'mou', 'all']),
  resource_id: z.string().uuid().optional(),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'approve'])).min(1),
  reason: z.string().min(1),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
})

const delegationIdParamSchema = z.object({
  id: z.string().uuid(),
})

const delegatedQuerySchema = z.object({
  type: z.enum(['granted', 'received']).optional(),
})

const checkQuerySchema = z.object({
  resource_type: z.string().min(1),
  resource_id: z.string().uuid().optional(),
})

const updateDelegationBodySchema = z.object({
  permissions: z.array(z.enum(['read', 'write', 'delete', 'approve'])).optional(),
  valid_until: z.string().datetime().optional(),
  reason: z.string().min(1).optional(),
})

const expiringQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional(),
})

/**
 * @route POST /api/permissions/delegate
 * @desc Create a new permission delegation
 * @access Private
 */
router.post(
  '/delegate',
  authenticate,
  validate({ body: delegateBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const grantorId = req.user?.id
      if (!grantorId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const delegation = await permissionService.delegate(grantorId, req.body)

      res.status(201).json({
        success: true,
        data: delegation,
        message: 'Permission delegation created successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route DELETE /api/permissions/delegate/:id
 * @desc Revoke a permission delegation
 * @access Private
 */
router.delete(
  '/delegate/:id',
  authenticate,
  validate({ params: delegationIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      await permissionService.revoke(req.params.id, userId)

      res.json({
        success: true,
        message: 'Permission delegation revoked successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route GET /api/permissions/delegated
 * @desc Get permissions delegated to/from the current user
 * @access Private
 */
router.get(
  '/delegated',
  authenticate,
  validate({ query: delegatedQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const type = (req.query.type as string) || 'both'
      const delegations: any = {}

      if (type === 'granted' || type === 'both') {
        delegations.granted = await permissionService.getDelegationsGranted(userId)
      }

      if (type === 'received' || type === 'both') {
        delegations.received = await permissionService.getDelegationsReceived(userId)
      }

      res.json({
        success: true,
        data: delegations,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route GET /api/permissions/check
 * @desc Check delegated permissions for a resource
 * @access Private
 */
router.get(
  '/check',
  authenticate,
  validate({ query: checkQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const permissions = await permissionService.checkDelegatedPermissions(
        userId,
        req.query.resource_type as string,
        req.query.resource_id as string,
      )

      res.json({
        success: true,
        data: {
          permissions,
          has_access: permissions.length > 0,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route PUT /api/permissions/delegate/:id
 * @desc Update a permission delegation
 * @access Private
 */
router.put(
  '/delegate/:id',
  authenticate,
  validate({ params: delegationIdParamSchema, body: updateDelegationBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const updated = await permissionService.updateDelegation(req.params.id, userId, req.body)

      res.json({
        success: true,
        data: updated,
        message: 'Permission delegation updated successfully',
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },
)

/**
 * @route GET /api/permissions/expiring
 * @desc Get delegations expiring soon
 * @access Private
 */
router.get(
  '/expiring',
  authenticate,
  validate({ query: expiringQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7
      const expiring = await permissionService.getExpiringDelegations(days)

      res.json({
        success: true,
        data: expiring,
        meta: {
          days_ahead: days,
          count: expiring.length,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },
)

export default router
