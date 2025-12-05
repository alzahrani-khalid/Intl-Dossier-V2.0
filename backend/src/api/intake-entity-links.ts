/**
 * Intake Entity Links API Routes
 * Handles entity linking operations for intake tickets
 * Feature: 024-intake-entity-linking
 */

import { Router, Request, Response } from 'express'
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
import type { CreateLinkRequest, UpdateLinkRequest } from '../types/intake-entity-links.types'

const router = Router()

/**
 * POST /api/intake/:intake_id/links
 * Creates a new entity link for an intake ticket
 */
router.post('/intake/:intake_id/links', async (req: Request, res: Response) => {
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

    // Parse and validate request body
    const linkData: CreateLinkRequest = {
      intake_id,
      entity_type: req.body.entity_type,
      entity_id: req.body.entity_id,
      link_type: req.body.link_type,
      source: req.body.source || 'human',
      confidence: req.body.confidence,
      notes: req.body.notes,
      link_order: req.body.link_order,
      suggested_by: req.body.suggested_by,
    }

    // Validate required fields
    if (!linkData.entity_type || !linkData.entity_id || !linkData.link_type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: entity_type, entity_id, link_type',
          details: {
            missing_fields: [
              !linkData.entity_type && 'entity_type',
              !linkData.entity_id && 'entity_id',
              !linkData.link_type && 'link_type',
            ].filter(Boolean),
          },
        },
      })
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
router.post('/intake/:intake_id/links/batch', async (req: Request, res: Response) => {
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

    // Validate request body has links array
    const { links } = req.body

    if (!Array.isArray(links)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must contain a "links" array',
        },
      })
    }

    // Validate batch size (1-50 links)
    if (links.length < 1 || links.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Batch size must be between 1 and 50 links',
          details: {
            current_size: links.length,
            min_size: 1,
            max_size: 50,
          },
        },
      })
    }

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
router.post('/intake/:intake_id/migrate-links', async (req: Request, res: Response) => {
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

    // Validate request body
    const { target_position_id, atomic } = req.body

    if (!target_position_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: target_position_id',
        },
      })
    }

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
router.get('/intake/:intake_id/links', async (req: Request, res: Response) => {
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

    // Parse query parameters
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
router.put('/intake/:intake_id/links/:link_id', async (req: Request, res: Response) => {
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

    // Parse and validate request body
    const updateData: UpdateLinkRequest = {
      notes: req.body.notes,
      link_order: req.body.link_order,
      _version: req.body._version,
    }

    // Validate _version field for optimistic locking
    if (typeof updateData._version !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing or invalid _version field for optimistic locking',
        },
      })
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
router.put('/intake/:intake_id/links/reorder', async (req: Request, res: Response) => {
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

    // Parse and validate request body
    const { link_orders } = req.body

    if (!Array.isArray(link_orders)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must contain a "link_orders" array',
        },
      })
    }

    // Validate each link order entry has required fields
    const invalidEntries = link_orders.filter(
      (entry: any) => !entry.link_id || typeof entry.link_order !== 'number',
    )

    if (invalidEntries.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Each link order entry must have link_id (string) and link_order (number)',
          details: {
            invalid_count: invalidEntries.length,
          },
        },
      })
    }

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
router.delete('/intake/:intake_id/links/:link_id', async (req: Request, res: Response) => {
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
router.post('/intake/:intake_id/links/:link_id/restore', async (req: Request, res: Response) => {
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
router.get('/intake/:intake_id/links/audit', async (req: Request, res: Response) => {
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

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 100

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
router.get('/entities/:entity_type/:entity_id/intakes', async (req: Request, res: Response) => {
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

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.page_size as string) || 50
    const linkType = req.query.link_type as string | undefined

    // Validate entity_type
    const validEntityTypes = [
      'dossier',
      'country',
      'organization',
      'forum',
      'working_group',
      'topic',
      'position',
      'mou',
      'engagement',
      'assignment',
      'commitment',
      'intelligence_signal',
    ]

    if (!validEntityTypes.includes(entity_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid entity_type: ${entity_type}`,
          details: {
            valid_types: validEntityTypes,
          },
        },
      })
    }

    // Validate link_type if provided
    if (linkType) {
      const validLinkTypes = ['primary', 'related', 'mentioned', 'requested', 'assigned_to']
      if (!validLinkTypes.includes(linkType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid link_type: ${linkType}`,
            details: {
              valid_types: validLinkTypes,
            },
          },
        })
      }
    }

    // Get entity intakes with reverse lookup
    const result = await getEntityIntakes(entity_type, entity_id, {
      page,
      pageSize,
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
