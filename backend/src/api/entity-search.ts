/**
 * Entity Search API Routes
 * Handles entity search operations across multiple tables
 * Feature: 024-intake-entity-linking
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import {
  searchEntities,
  getEntityMetadata,
  invalidateEntityCache,
} from '../services/entity-search.service'
import { requireRole } from '../middleware/auth'
import { validate } from '../utils/validation'
import type { EntityType } from '../types/intake-entity-links.types'

const router = Router()

// Valid entity types for this API
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

// Validation schemas
const entitySearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  entity_types: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
  min_confidence: z.coerce.number().min(0).max(1).optional(),
})

const entityParamsSchema = z.object({
  entity_type: z.enum(validEntityTypes),
  entity_id: z.string().min(1),
})

/**
 * GET /api/entities/search
 * Searches for entities across multiple tables
 *
 * Query parameters:
 * - q: Search query (required)
 * - entity_types: Comma-separated list of entity types to search (optional)
 * - limit: Maximum number of results (default: 10, max: 50)
 * - offset: Offset for pagination (default: 0)
 * - min_confidence: Minimum confidence score for AI suggestions (optional)
 */
router.get(
  '/entities/search',
  validate({ query: entitySearchQuerySchema }),
  async (req: Request, res: Response) => {
    try {
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

      // Query params are validated and coerced by Zod
      const {
        q: query,
        entity_types: entityTypesParam,
        limit,
        offset,
        min_confidence: minConfidence,
      } = req.query as unknown as z.infer<typeof entitySearchQuerySchema>

      // Parse entity types from comma-separated string
      let entityTypes: EntityType[] | undefined
      if (entityTypesParam) {
        entityTypes = entityTypesParam.split(',').map((type) => type.trim()) as EntityType[]

        const invalidTypes = entityTypes.filter(
          (type) => !validEntityTypes.includes(type as (typeof validEntityTypes)[number]),
        )
        if (invalidTypes.length > 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid entity types: ${invalidTypes.join(', ')}`,
              details: {
                valid_types: [...validEntityTypes],
                invalid_types: invalidTypes,
              },
            },
          })
        }
      }

      // Perform entity search
      const searchResults = await searchEntities(
        (query as string).trim(),
        {
          entity_types: entityTypes,
          min_confidence: minConfidence as number | undefined,
          limit: limit as number,
          offset: offset as number,
        },
        userId,
      )

      // Return success response
      return res.status(200).json({
        success: true,
        data: searchResults,
        pagination: {
          total: searchResults.length, // Note: This is the count of returned results
          limit,
          offset,
        },
      })
    } catch (error: any) {
      console.error('Error searching entities:', error)

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
          code: 'SEARCH_FAILED',
          message: 'Failed to search entities',
        },
      })
    }
  },
)

/**
 * GET /api/entities/:entity_type/:entity_id
 * Gets metadata for a specific entity
 */
router.get(
  '/entities/:entity_type/:entity_id',
  validate({ params: entityParamsSchema }),
  async (req: Request, res: Response) => {
    try {
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

      const { entity_type, entity_id } = req.params as { entity_type: string; entity_id: string }

      // Get entity metadata
      const metadata = await getEntityMetadata(entity_type as EntityType, entity_id)

      if (!metadata) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: `${entity_type} with ID ${entity_id} not found`,
          },
        })
      }

      // Return success response
      return res.status(200).json({
        success: true,
        data: metadata,
      })
    } catch (error: any) {
      console.error('Error fetching entity metadata:', error)

      // Generic error response
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch entity metadata',
        },
      })
    }
  },
)

/**
 * POST /api/entities/:entity_type/:entity_id/invalidate-cache
 * Invalidates cache for a specific entity
 * Requires admin role
 */
router.post(
  '/entities/:entity_type/:entity_id/invalidate-cache',
  requireRole(['admin']),
  validate({ params: entityParamsSchema }),
  async (req: Request, res: Response) => {
    try {
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

      const { entity_type, entity_id } = req.params as { entity_type: string; entity_id: string }

      // Invalidate cache
      await invalidateEntityCache(entity_type as EntityType, entity_id)

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Cache invalidated successfully',
      })
    } catch (error: any) {
      console.error('Error invalidating entity cache:', error)

      // Generic error response
      return res.status(500).json({
        success: false,
        error: {
          code: 'INVALIDATION_FAILED',
          message: 'Failed to invalidate entity cache',
        },
      })
    }
  },
)

/**
 * GET /api/entities/types
 * Returns all available entity types with their descriptions
 */
router.get('/entities/types', async (_req: Request, res: Response) => {
  try {
    const entityTypes = [
      {
        type: 'dossier',
        name: 'Dossier',
        description: 'A collection of related documents and information',
        can_be_primary: true,
      },
      {
        type: 'position',
        name: 'Position',
        description: 'An official stance or policy position',
        can_be_primary: false,
      },
      {
        type: 'mou',
        name: 'Memorandum of Understanding',
        description: 'A formal agreement between parties',
        can_be_primary: false,
      },
      {
        type: 'engagement',
        name: 'Engagement',
        description: 'A meeting or interaction with external parties',
        can_be_primary: false,
      },
      {
        type: 'assignment',
        name: 'Assignment',
        description: 'A task or responsibility assigned to someone',
        can_be_primary: false,
      },
      {
        type: 'commitment',
        name: 'Commitment',
        description: 'A pledge or promise to take action',
        can_be_primary: false,
      },
      {
        type: 'intelligence_signal',
        name: 'Intelligence Signal',
        description: 'Information or insight from intelligence sources',
        can_be_primary: false,
      },
      {
        type: 'organization',
        name: 'Organization',
        description: 'An institution or entity',
        can_be_primary: true,
      },
      {
        type: 'country',
        name: 'Country',
        description: 'A nation or sovereign state',
        can_be_primary: true,
      },
      {
        type: 'forum',
        name: 'Forum',
        description: 'A meeting place or discussion platform',
        can_be_primary: true,
      },
      {
        type: 'working_group',
        name: 'Working Group',
        description: 'A committee or team focused on specific tasks',
        can_be_primary: false,
      },
      {
        type: 'topic',
        name: 'Topic',
        description: 'A subject or theme of discussion',
        can_be_primary: false,
      },
    ]

    return res.status(200).json({
      success: true,
      data: entityTypes,
    })
  } catch (error: any) {
    console.error('Error fetching entity types:', error)

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch entity types',
      },
    })
  }
})

export default router
