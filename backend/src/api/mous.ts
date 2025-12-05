import { Router } from 'express'
import { z } from 'zod'
import { MoUService } from '../services/MoUService'
import { supabaseAdmin } from '../config/supabase'
import {
  validate,
  paginationSchema,
  idParamSchema,
  createBilingualError,
  getRequestLanguage,
} from '../utils/validation'
import { requireRole, requirePermission } from '../middleware/auth'
import { logInfo, logError } from '../utils/logger'

const router = Router()
const mouService = new MoUService()

// Validation schemas
const createMoUSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  type: z.enum(['bilateral', 'multilateral', 'framework', 'technical']),
  status: z
    .enum(['draft', 'negotiation', 'signed', 'active', 'expired', 'terminated'])
    .default('draft'),
  parties: z
    .array(
      z.object({
        type: z.enum(['country', 'organization']),
        id: z.string().uuid(),
        role: z.enum(['primary', 'secondary', 'observer']).default('primary'),
      }),
    )
    .min(2),
  signed_date: z.string().datetime().optional(),
  effective_date: z.string().datetime().optional(),
  expiry_date: z.string().datetime().optional(),
  auto_renewal: z.boolean().default(false),
  renewal_period_months: z.number().optional(),
  deliverables: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        due_date: z.string().datetime(),
        responsible_party: z.string().uuid(),
        status: z
          .enum(['pending', 'in_progress', 'completed', 'delayed', 'cancelled'])
          .default('pending'),
      }),
    )
    .optional(),
  thematic_areas: z.array(z.string().uuid()).optional(),
  alert_settings: z
    .object({
      renewal_alert_days: z.number().default(90),
      deliverable_alert_days: z.number().default(30),
      expiry_alert_days: z.number().default(60),
    })
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

const updateMoUSchema = createMoUSchema.partial()

const mouFiltersSchema = z.object({
  status: z.enum(['draft', 'negotiation', 'signed', 'active', 'expired', 'terminated']).optional(),
  type: z.enum(['bilateral', 'multilateral', 'framework', 'technical']).optional(),
  countryId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  thematicAreaId: z.string().uuid().optional(),
  expiringWithinDays: z.coerce.number().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ...paginationSchema.shape,
})

const deliverableUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().datetime().optional(),
  responsible_party: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

/**
 * @route GET /api/mous
 * @desc Get all MoUs with filters
 * @access Private
 */
router.get('/', validate({ query: mouFiltersSchema }), async (req, res, next) => {
  try {
    const filters = req.query
    const userId = req.user?.id

    logInfo('Fetching MoUs', { filters, userId })

    const result = await mouService.getMoUs(filters as any)

    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
      },
      total: result.total,
    })
  } catch (error) {
    logError('Failed to fetch MoUs', error as Error)
    next(error)
  }
})

/**
 * @route GET /api/mous/stats
 * @desc Get MoU statistics
 * @access Private
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Get statistics by fetching counts
    const { data: active } = await supabaseAdmin
      .from('mous')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    const { data: expired } = await supabaseAdmin
      .from('mous')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'expired')

    const { data: draft } = await supabaseAdmin
      .from('mous')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')

    const stats = {
      total: (active?.length || 0) + (expired?.length || 0) + (draft?.length || 0),
      active: active?.length || 0,
      expired: expired?.length || 0,
      draft: draft?.length || 0,
    }
    res.json(stats)
  } catch (error) {
    logError('Failed to fetch MoU statistics', error as Error)
    next(error)
  }
})

/**
 * @route GET /api/mous/expiring
 * @desc Get expiring MoUs
 * @access Private
 */
router.get('/expiring', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 90
    const expiring = await mouService.getExpiringMoUs(days)
    res.json({ data: expiring, total: expiring.length })
  } catch (error) {
    logError('Failed to fetch expiring MoUs', error as Error)
    next(error)
  }
})

/**
 * @route GET /api/mous/:id
 * @desc Get MoU by ID
 * @access Private
 */
router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params
    const mou = await mouService.getMoUById(id)

    if (!mou) {
      const lang = getRequestLanguage(req)
      return res.status(404).json({
        error: createBilingualError('MoU not found', 'مذكرة التفاهم غير موجودة', lang),
      })
    }

    res.json(mou)
  } catch (error) {
    logError('Failed to fetch MoU', error as Error)
    next(error)
  }
})

/**
 * @route POST /api/mous
 * @desc Create new MoU
 * @access Private - requires permission
 */
router.post(
  '/',
  requirePermission(['create_mou']),
  validate({ body: createMoUSchema }),
  async (req, res, next) => {
    try {
      const mouData = req.body
      const userId = req.user?.id
      const lang = getRequestLanguage(req)

      logInfo('Creating new MoU', { mouData, userId })

      const mou = await mouService.createMoU(mouData, userId!)

      res.status(201).json({
        data: mou,
        message: createBilingualError(
          'MoU created successfully',
          'تم إنشاء مذكرة التفاهم بنجاح',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to create MoU', error as Error)
      next(error)
    }
  },
)

/**
 * @route PUT /api/mous/:id
 * @desc Update MoU
 * @access Private - requires permission
 */
router.put(
  '/:id',
  requirePermission(['manage_mou']),
  validate({
    params: idParamSchema,
    body: updateMoUSchema,
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const updates = req.body
      const lang = getRequestLanguage(req)

      const mou = await mouService.updateMoU(id, updates)

      if (!mou) {
        return res.status(404).json({
          error: createBilingualError('MoU not found', 'مذكرة التفاهم غير موجودة', lang),
        })
      }

      res.json({
        data: mou,
        message: createBilingualError(
          'MoU updated successfully',
          'تم تحديث مذكرة التفاهم بنجاح',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to update MoU', error as Error)
      next(error)
    }
  },
)

/**
 * @route DELETE /api/mous/:id
 * @desc Delete MoU
 * @access Admin only
 */
router.delete(
  '/:id',
  requireRole(['admin']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const lang = getRequestLanguage(req)

      // Delete MoU using supabaseAdmin directly
      const { error } = await supabaseAdmin.from('mous').delete().eq('id', id)

      const success = !error

      if (!success) {
        return res.status(404).json({
          error: createBilingualError('MoU not found', 'مذكرة التفاهم غير موجودة', lang),
        })
      }

      res.json({
        message: createBilingualError(
          'MoU deleted successfully',
          'تم حذف مذكرة التفاهم بنجاح',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to delete MoU', error as Error)
      next(error)
    }
  },
)

/**
 * @route GET /api/mous/:id/deliverables
 * @desc Get MoU deliverables
 * @access Private
 */
router.get('/:id/deliverables', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params
    // Get MoU and extract deliverables
    const mou = await mouService.getMoUById(id)
    const deliverables = mou?.deliverables || []
    res.json({ data: deliverables, total: deliverables.length })
  } catch (error) {
    logError('Failed to fetch MoU deliverables', error as Error)
    next(error)
  }
})

/**
 * @route PATCH /api/mous/:id/deliverables/:deliverableId
 * @desc Update deliverable status
 * @access Private
 */
router.patch(
  '/:id/deliverables/:deliverableId',
  requirePermission(['manage_deliverables']),
  validate({
    params: z.object({
      id: z.string().uuid(),
      deliverableId: z.string().uuid(),
    }),
    body: deliverableUpdateSchema,
  }),
  async (req, res, next) => {
    try {
      const { id, deliverableId } = req.params
      const updates = req.body
      const lang = getRequestLanguage(req)

      const deliverable = await mouService.updateDeliverable(id, deliverableId, updates)

      res.json({
        data: deliverable,
        message: createBilingualError(
          'Deliverable updated successfully',
          'تم تحديث التسليم بنجاح',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to update deliverable', error as Error)
      next(error)
    }
  },
)

/**
 * @route POST /api/mous/:id/renew
 * @desc Renew MoU
 * @access Private
 */
router.post(
  '/:id/renew',
  requirePermission(['manage_mou']),
  validate({
    params: idParamSchema,
    body: z.object({
      renewal_date: z.string().datetime(),
      new_expiry_date: z.string().datetime(),
      notes: z.string().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const renewalData = req.body
      const lang = getRequestLanguage(req)

      // Renew MoU by updating status and dates
      const mou = await mouService.transitionMoUStatus(id, 'renewed', req.user!.id)
      await mouService.updateMoU(id, {
        effective_date: new Date(renewalData.renewal_date),
        expiry_date: new Date(renewalData.new_expiry_date),
        notes: renewalData.notes,
      })

      res.json({
        data: mou,
        message: createBilingualError(
          'MoU renewed successfully',
          'تم تجديد مذكرة التفاهم بنجاح',
          lang,
        ),
      })
    } catch (error) {
      logError('Failed to renew MoU', error as Error)
      next(error)
    }
  },
)

/**
 * @route GET /api/mous/:id/timeline
 * @desc Get MoU activity timeline
 * @access Private
 */
router.get('/:id/timeline', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params
    // Get timeline from audit logs
    const { data: timeline, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'mou')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ data: timeline, total: timeline.length })
  } catch (error) {
    logError('Failed to fetch MoU timeline', error as Error)
    next(error)
  }
})

/**
 * @route GET /api/mous/:id/performance
 * @desc Get MoU performance metrics
 * @access Private
 */
router.get('/:id/performance', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params
    const metrics = await mouService.calculateMoUPerformance(id)
    res.json(metrics)
  } catch (error) {
    logError('Failed to fetch MoU performance metrics', error as Error)
    next(error)
  }
})

export default router
