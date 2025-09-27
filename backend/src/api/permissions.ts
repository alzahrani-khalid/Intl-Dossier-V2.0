import { Router, Request, Response } from 'express';
import { PermissionDelegationService } from '../services/PermissionDelegationService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
let permissionService: PermissionDelegationService;

export function initializePermissionsRouter(
  supabaseUrl: string,
  supabaseKey: string
): Router {
  permissionService = new PermissionDelegationService(supabaseUrl, supabaseKey);
  return router;
}

/**
 * @route POST /api/permissions/delegate
 * @desc Create a new permission delegation
 * @access Private
 */
router.post(
  '/delegate',
  authenticate,
  [
    body('grantee_id').isUUID().withMessage('Valid grantee ID required'),
    body('resource_type').isIn(['dossier', 'mou', 'all']).withMessage('Invalid resource type'),
    body('resource_id').optional().isUUID(),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('permissions.*').isIn(['read', 'write', 'delete', 'approve']),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('valid_from').isISO8601().withMessage('Valid from date required'),
    body('valid_until').isISO8601().withMessage('Valid until date required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const grantorId = req.user?.id;
      if (!grantorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const delegation = await permissionService.delegate(grantorId, req.body);
      
      res.status(201).json({
        success: true,
        data: delegation,
        message: 'Permission delegation created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/permissions/delegate/:id
 * @desc Revoke a permission delegation
 * @access Private
 */
router.delete(
  '/delegate/:id',
  authenticate,
  [param('id').isUUID().withMessage('Valid delegation ID required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await permissionService.revoke(req.params.id, userId);
      
      res.json({
        success: true,
        message: 'Permission delegation revoked successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/permissions/delegated
 * @desc Get permissions delegated to/from the current user
 * @access Private
 */
router.get(
  '/delegated',
  authenticate,
  [
    query('type').optional().isIn(['granted', 'received']).withMessage('Invalid type')
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const type = req.query.type as string || 'both';
      let delegations: any = {};

      if (type === 'granted' || type === 'both') {
        delegations.granted = await permissionService.getDelegationsGranted(userId);
      }

      if (type === 'received' || type === 'both') {
        delegations.received = await permissionService.getDelegationsReceived(userId);
      }

      res.json({
        success: true,
        data: delegations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/permissions/check
 * @desc Check delegated permissions for a resource
 * @access Private
 */
router.get(
  '/check',
  authenticate,
  [
    query('resource_type').notEmpty().withMessage('Resource type required'),
    query('resource_id').optional().isUUID()
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const permissions = await permissionService.checkDelegatedPermissions(
        userId,
        req.query.resource_type as string,
        req.query.resource_id as string
      );

      res.json({
        success: true,
        data: {
          permissions,
          has_access: permissions.length > 0
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/permissions/delegate/:id
 * @desc Update a permission delegation
 * @access Private
 */
router.put(
  '/delegate/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid delegation ID required'),
    body('permissions').optional().isArray(),
    body('permissions.*').optional().isIn(['read', 'write', 'delete', 'approve']),
    body('valid_until').optional().isISO8601(),
    body('reason').optional().notEmpty()
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updated = await permissionService.updateDelegation(
        req.params.id,
        userId,
        req.body
      );

      res.json({
        success: true,
        data: updated,
        message: 'Permission delegation updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/permissions/expiring
 * @desc Get delegations expiring soon
 * @access Private
 */
router.get(
  '/expiring',
  authenticate,
  [
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be 1-30')
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const expiring = await permissionService.getExpiringDelegations(days);

      res.json({
        success: true,
        data: expiring,
        meta: {
          days_ahead: days,
          count: expiring.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;