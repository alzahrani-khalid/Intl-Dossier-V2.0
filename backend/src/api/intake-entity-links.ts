/**
 * Intake Entity Links API Routes
 * Handles entity linking operations for intake tickets
 * Feature: 024-intake-entity-linking
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import {
  createEntityLink,
  getEntityLinks,
  updateEntityLink,
  deleteEntityLink,
  restoreEntityLink,
  reorderEntityLinks,
  createBatchLinks,
  getEntityIntakes,
} from '../services/link.service'
import { createAuditLog, getIntakeAuditLogs } from '../services/link-audit.service'
import { migrateIntakeLinksToPosition } from '../services/link-migration.service'
import { validate } from '../utils/validation'
import type { CreateLinkRequest, UpdateLinkRequest } from '../types/intake-entity-links.types'

const router = Router()

// Valid entity types for intake linking
const validEntityTypes = [
  'dossier',
  'position',
  'mou',
  'engagement',
  'assignment',
  'commitment',
  'intelligence_signal',
  'organization',
  'country',
  'forum',
  'working_group',
  'topic',
] as const

const validLinkTypes = ['primary', 'related', 'mentioned', 'requested', 'assigned_to'] as const

// Validation schemas
const intakeIdParamSchema = z.object({
  intake_id: z.string().uuid(),
})

const intakeLinkParamSchema = z.object({
  intake_id: z.string().uuid(),
  link_id: z.string().uuid(),
})

const createLinkBodySchema = z.object({
  entity_type: z.enum(validEntityTypes),
  entity_id: z.string().uuid(),
  link_type: z.string().min(1).max(50),
  source: z.enum(['human', 'ai']).default('human'),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().max(2000).optional(),
  link_order: z.number().int().min(0).optional(),
  suggested_by: z.string().uuid().optional(),
})

const batchLinksBodySchema = z.object({
  links: z.array(z.object({
    entity_type: z.enum(validEntityTypes),
    entity_id: z.string().uuid(),
    link_type: z.string().min(1).max(50),
    source: z.enum(['human', 'ai']).default('human'),
    confidence: z.number().min(0).max(1).optional(),
    notes: z.string().max(2000).optional(),
    link_order: z.number().int().min(0).optional(),
  })).min(1).max(50),
})

const migrateLinkBodySchema = z.object({
  target_position_id: z.string().uuid(),
  atomic: z.boolean().default(false),
})

const getLinksQuerySchema = z.object({
  include_deleted: z.enum(['true', 'false']).default('false'),
})

const updateLinkBodySchema = z.object({
  notes: z.string().max(2000).optional(),
  link_order: z.number().int().min(0).optional(),
  _version: z.number().int(),
})

const reorderBodySchema = z.object({
  link_orders: z.array(z.object({
    link_id: z.string().uuid(),
    link_order: z.number().int().min(0),
  })).min(1),
})

const auditQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(100),
})

const entityIntakesParamSchema = z.object({
  entity_type: z.enum(validEntityTypes),
  entity_id: z.string().min(1),
})

const entityIntakesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(100).default(50),
  link_type: z.enum(validLinkTypes).optional(),
})

/**
 * POST /api/intake/:intake_id/links
 * Creates a new entity link for an intake ticket
 */
router.post('/intake/:intake_id/links', validate({ params: intakeIdParamSchema, body: createLinkBodySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Body is validated by Zod middleware
    const linkData: CreateLinkRequest = {
      intake_id,
      entity_type: req.body.entity_type,
      entity_id: req.body.entity_id,
      link_type: req.body.link_type,
      source: req.body.source,
      confidence: req.body.confidence,
      notes: req.body.notes,
      link_order: req.body.link_order,
      suggested_by: req.body.suggested_by,
    }

    // Create the entity link
    const newLink = await createEntityLink(intake_id, userId, linkData)

    // Create audit log (fire-and-forget)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    createAuditLog(newLink.id, 'created', userId, null, newLink, ipAddress, userAgent).catch(
      (error) => {
        console.error('Failed to create audit log:', error)
      },
    )

    // Return success response
    return res.status(201).json({
      success: true,
      data: newLink,
    })
  } catch (error: any) {
    console.error('Error creating entity link:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create entity link',
      },
    })
  }
})

/**
 * POST /api/intake/:intake_id/links/batch
 * Creates multiple entity links in a single batch operation
 * T085 [US3]: Batch link creation endpoint
 */
router.post('/intake/:intake_id/links/batch', validate({ params: intakeIdParamSchema, body: batchLinksBodySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Body validated by Zod middleware (links array, size 1-50)
    const { links } = req.body

    // Process batch link creation
    const result = await createBatchLinks(intake_id, userId, links)

    // T088: Enhanced error handling for partial failures
    const response = {
      success: true,
      data: {
        succeeded: result.succeeded,
        failed: result.failed,
      },
      meta: {
        total_requested: links.length,
        succeeded_count: result.succeeded.length,
        failed_count: result.failed.length,
      },
    }

    // Return 201 for successful batch operation (even with partial failures)
    return res.status(201).json(response)
  } catch (error: any) {
    console.error('Error creating batch links:', error)

    // T088: Handle specific error codes with detailed messages
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create batch links',
      },
    })
  }
})

/**
 * POST /api/intake/:intake_id/migrate-links
 * Migrates all entity links from an intake ticket to a position
 * T083 [US3]: Link migration endpoint
 */
router.post('/intake/:intake_id/migrate-links', validate({ params: intakeIdParamSchema, body: migrateLinkBodySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Body validated by Zod middleware
    const { target_position_id, atomic } = req.body

    // Execute migration
    const result = await migrateIntakeLinksToPosition(
      intake_id,
      target_position_id,
      userId,
      atomic || false,
    )

    // Return migration result
    return res.status(200).json({
      success: true,
      data: {
        intake_id: result.intake_id,
        position_id: result.position_id,
        migrated_count: result.migrated_count,
        failed_count: result.failed_count,
        link_mappings: result.link_mappings,
      },
      meta: {
        migration_complete: result.failed_count === 0,
        atomic_mode: atomic || false,
      },
    })
  } catch (error: any) {
    console.error('Error migrating links:', error)

    // T088: Handle specific error codes with detailed messages
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to migrate links',
      },
    })
  }
})

/**
 * GET /api/intake/:intake_id/links
 * Gets all entity links for an intake ticket
 */
router.get('/intake/:intake_id/links', validate({ params: intakeIdParamSchema, query: getLinksQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Query validated by Zod middleware
    const includeDeleted = req.query.include_deleted === 'true'

    // TODO: Check if user has access to this intake ticket
    // This would involve checking if the user is assigned to the intake
    // or has appropriate permissions to view it

    // Get entity links
    const links = await getEntityLinks(intake_id, includeDeleted)

    // Return success response
    return res.status(200).json({
      success: true,
      data: links,
      total: links.length,
      page: 1,
      page_size: links.length,
    })
  } catch (error: any) {
    console.error('Error fetching entity links:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch entity links',
      },
    })
  }
})

/**
 * PUT /api/intake/:intake_id/links/:link_id
 * Updates an existing entity link
 */
router.put('/intake/:intake_id/links/:link_id', validate({ params: intakeLinkParamSchema, body: updateLinkBodySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id, link_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Body validated by Zod middleware (_version is required integer)
    const updateData: UpdateLinkRequest = {
      notes: req.body.notes,
      link_order: req.body.link_order,
      _version: req.body._version,
    }

    // Get old values for audit log
    const oldLinks = await getEntityLinks(intake_id, false)
    const oldLink = oldLinks.find((l) => l.id === link_id)

    // Update the entity link
    const updatedLink = await updateEntityLink(link_id, userId, updateData)

    // Create audit log (fire-and-forget)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    createAuditLog(link_id, 'updated', userId, oldLink, updatedLink, ipAddress, userAgent).catch(
      (error) => {
        console.error('Failed to create audit log:', error)
      },
    )

    // Return success response
    return res.status(200).json({
      success: true,
      data: updatedLink,
    })
  } catch (error: any) {
    console.error('Error updating entity link:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update entity link',
      },
    })
  }
})

/**
 * PUT /api/intake/:intake_id/links/reorder
 * Reorders entity links for an intake ticket
 * T113 [US5]: Reorder endpoint for drag-and-drop functionality
 */
router.put('/intake/:intake_id/links/reorder', validate({ params: intakeIdParamSchema, body: reorderBodySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Body validated by Zod middleware (link_orders array with link_id + link_order)
    const { link_orders } = req.body

    // Reorder the links
    const updatedLinks = await reorderEntityLinks(intake_id, userId, link_orders)

    // T114: Create audit log for reorder operation (fire-and-forget)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']

    // Create a single audit log entry for the reorder operation
    createAuditLog(
      intake_id, // Use intake_id as link_id for reorder operations
      'reordered',
      userId,
      null,
      {
        link_count: updatedLinks.length,
        new_orders: link_orders,
      },
      ipAddress,
      userAgent,
    ).catch((error) => {
      console.error('Failed to create audit log:', error)
    })

    // Return success response
    return res.status(200).json({
      success: true,
      data: updatedLinks,
      meta: {
        updated_count: updatedLinks.length,
      },
    })
  } catch (error: any) {
    console.error('Error reordering entity links:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reorder entity links',
      },
    })
  }
})

/**
 * DELETE /api/intake/:intake_id/links/:link_id
 * Soft deletes an entity link
 */
router.delete('/intake/:intake_id/links/:link_id', validate({ params: intakeLinkParamSchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id, link_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Delete the entity link
    const deletedLink = await deleteEntityLink(link_id, userId)

    // Create audit log (fire-and-forget)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    createAuditLog(link_id, 'deleted', userId, deletedLink, null, ipAddress, userAgent).catch(
      (error) => {
        console.error('Failed to create audit log:', error)
      },
    )

    // Return success response
    return res.status(200).json({
      success: true,
      data: deletedLink,
    })
  } catch (error: any) {
    console.error('Error deleting entity link:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete entity link',
      },
    })
  }
})

/**
 * POST /api/intake/:intake_id/links/:link_id/restore
 * Restores a soft-deleted entity link
 */
router.post('/intake/:intake_id/links/:link_id/restore', validate({ params: intakeLinkParamSchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id, link_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Restore the entity link
    const restoredLink = await restoreEntityLink(link_id, userId)

    // Create audit log (fire-and-forget)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    createAuditLog(link_id, 'restored', userId, null, restoredLink, ipAddress, userAgent).catch(
      (error) => {
        console.error('Failed to create audit log:', error)
      },
    )

    // Return success response
    return res.status(200).json({
      success: true,
      data: restoredLink,
    })
  } catch (error: any) {
    console.error('Error restoring entity link:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to restore entity link',
      },
    })
  }
})

/**
 * GET /api/intake/:intake_id/links/audit
 * Gets audit logs for all links in an intake ticket
 */
router.get('/intake/:intake_id/links/audit', validate({ params: intakeIdParamSchema, query: auditQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { intake_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Query validated by Zod middleware
    const limit = (req.query as { limit: number }).limit

    // Get audit logs
    const auditLogs = await getIntakeAuditLogs(intake_id, limit)

    // Return success response
    return res.status(200).json({
      success: true,
      data: auditLogs,
      total: auditLogs.length,
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch audit logs',
      },
    })
  }
})

/**
 * GET /api/entities/:entity_type/:entity_id/intakes
 * Gets all intake tickets linked to a specific entity (reverse lookup)
 * T093 [US4]: Reverse lookup endpoint with pagination and filtering
 *
 * Performance target: <2 seconds for 1000+ intakes (SC-004)
 */
router.get('/entities/:entity_type/:entity_id/intakes', validate({ params: entityIntakesParamSchema, query: entityIntakesQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      })
    }

    // Get user profile for clearance level
    const { data: userProfile } = await req.supabase
      .from('profiles')
      .select('clearance_level')
      .eq('user_id', userId)
      .single()

    // Query validated by Zod middleware
    const { page, page_size: pageSize, link_type: linkType } = req.query as unknown as z.infer<typeof entityIntakesQuerySchema>

    // Get entity intakes with reverse lookup
    const result = await getEntityIntakes(entity_type, entity_id, {
      page: page as number,
      pageSize: pageSize as number,
      linkType: linkType as any,
      userClearanceLevel: userProfile?.clearance_level,
    })

    // Return success response
    return res.status(200).json({
      success: true,
      data: result.intakes,
      pagination: result.pagination,
      filters: {
        entity_type,
        entity_id,
        link_type: linkType || 'all',
      },
    })
  } catch (error: any) {
    console.error('Error fetching entity intakes:', error)

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch entity intakes',
      },
    })
  }
})

export default router
