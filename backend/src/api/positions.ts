import { Router, Request, Response } from 'express';
import { PositionConsistencyService } from '../services/PositionConsistencyService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
let consistencyService: PositionConsistencyService;

export function initializePositionsRouter(
  supabaseUrl: string,
  supabaseKey: string
): Router {
  consistencyService = new PositionConsistencyService(supabaseUrl, supabaseKey);
  return router;
}

/**
 * @route GET /api/positions/:id/consistency
 * @desc Get consistency analysis for a thematic area
 * @access Private
 */
router.get(
  '/:id/consistency',
  authenticate,
  [param('id').isUUID().withMessage('Valid thematic area ID required')],
  validate,
  async (req: Request, res: Response) => {
    try {
      const analysis = await consistencyService.analyzeConsistency(req.params.id);

      res.json({
        success: true,
        data: analysis,
        meta: {
          analyzed_at: new Date(),
          thematic_area_id: req.params.id
        }
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
 * @route POST /api/positions/validate
 * @desc Validate positions for consistency
 * @access Private
 */
router.post(
  '/validate',
  authenticate,
  [
    body('thematic_area_id').isUUID().withMessage('Valid thematic area ID required'),
    body('force_refresh').optional().isBoolean()
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { thematic_area_id, force_refresh } = req.body;

      // Check if recent analysis exists
      if (!force_refresh) {
        const history = await consistencyService.getConsistencyHistory(
          thematic_area_id,
          1
        );

        if (history.length > 0) {
          const lastAnalysis = history[0];
          const hoursSinceAnalysis = 
            (Date.now() - new Date(lastAnalysis.calculated_at).getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceAnalysis < 24) {
            return res.json({
              success: true,
              data: lastAnalysis,
              meta: {
                cached: true,
                analyzed_at: lastAnalysis.calculated_at
              }
            });
          }
        }
      }

      // Perform new analysis
      const analysis = await consistencyService.analyzeConsistency(thematic_area_id);

      res.json({
        success: true,
        data: analysis,
        meta: {
          cached: false,
          analyzed_at: new Date()
        }
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
 * @route PUT /api/positions/consistency/:id/reconcile
 * @desc Reconcile position conflicts
 * @access Private
 */
router.put(
  '/consistency/:id/reconcile',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid consistency ID required'),
    body('conflict_index').isInt({ min: 0 }).withMessage('Valid conflict index required'),
    body('resolution_notes').notEmpty().withMessage('Resolution notes required')
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updated = await consistencyService.reconcileConflict(
        req.params.id,
        {
          conflict_index: req.body.conflict_index,
          resolution_notes: req.body.resolution_notes,
          reconciled_by: userId
        }
      );

      res.json({
        success: true,
        data: updated,
        message: 'Conflict reconciled successfully'
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
 * @route GET /api/positions/consistency/unresolved
 * @desc Get all unresolved position conflicts
 * @access Private
 */
router.get(
  '/consistency/unresolved',
  authenticate,
  [
    query('severity').optional().isIn(['low', 'medium', 'high']),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      let unresolved = await consistencyService.getUnresolvedConflicts();

      // Filter by severity if specified
      if (req.query.severity) {
        unresolved = unresolved.filter(item => {
          const conflicts = item.conflicts as any[];
          return conflicts.some(c => c.severity === req.query.severity);
        });
      }

      // Apply limit
      const limit = parseInt(req.query.limit as string) || 50;
      unresolved = unresolved.slice(0, limit);

      res.json({
        success: true,
        data: unresolved,
        meta: {
          total: unresolved.length,
          filters: {
            severity: req.query.severity || 'all'
          }
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
 * @route GET /api/positions/consistency/critical
 * @desc Get critical position inconsistencies
 * @access Private
 */
router.get(
  '/consistency/critical',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const critical = await consistencyService.getCriticalInconsistencies();

      res.json({
        success: true,
        data: critical,
        meta: {
          total: critical.length,
          threshold_score: 40,
          message: critical.length > 0 
            ? 'Immediate attention required for critical inconsistencies'
            : 'No critical inconsistencies found'
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
 * @route GET /api/positions/consistency/history/:thematicAreaId
 * @desc Get consistency analysis history for a thematic area
 * @access Private
 */
router.get(
  '/consistency/history/:thematicAreaId',
  authenticate,
  [
    param('thematicAreaId').isUUID().withMessage('Valid thematic area ID required'),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await consistencyService.getConsistencyHistory(
        req.params.thematicAreaId,
        limit
      );

      res.json({
        success: true,
        data: history,
        meta: {
          thematic_area_id: req.params.thematicAreaId,
          count: history.length,
          limit
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
 * @route POST /api/positions/consistency/bulk-analyze
 * @desc Analyze consistency for multiple thematic areas
 * @access Private/Admin
 */
router.post(
  '/consistency/bulk-analyze',
  authenticate,
  [
    body('thematic_area_ids').isArray({ min: 1, max: 10 }),
    body('thematic_area_ids.*').isUUID()
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin or analyst
      if (!['admin', 'analyst'].includes(req.user?.role || '')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const results = [];
      const errors = [];

      for (const areaId of req.body.thematic_area_ids) {
        try {
          const analysis = await consistencyService.analyzeConsistency(areaId);
          results.push({
            thematic_area_id: areaId,
            ...analysis
          });
        } catch (error: any) {
          errors.push({
            thematic_area_id: areaId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          successful: results,
          failed: errors
        },
        meta: {
          total_requested: req.body.thematic_area_ids.length,
          successful_count: results.length,
          failed_count: errors.length
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