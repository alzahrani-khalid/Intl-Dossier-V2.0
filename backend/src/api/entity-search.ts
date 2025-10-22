/**
 * Entity Search API Routes
 * Handles entity search operations across multiple tables
 * Feature: 024-intake-entity-linking
 */

import { Router, Request, Response } from 'express';
import { searchEntities, getEntityMetadata, invalidateEntityCache } from '../services/entity-search.service';
import type {
  EntitySearchResult,
  EntityType,
} from '../types/intake-entity-links.types';

const router = Router();

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
router.get('/entities/search', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Parse query parameters
    const query = req.query.q as string;
    const entityTypesParam = req.query.entity_types as string;
    const limitParam = req.query.limit as string;
    const offsetParam = req.query.offset as string;
    const minConfidenceParam = req.query.min_confidence as string;

    // Validate required query parameter
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required query parameter: q',
        },
      });
    }

    // Parse entity types
    let entityTypes: EntityType[] | undefined;
    if (entityTypesParam) {
      entityTypes = entityTypesParam.split(',').map(type => type.trim()) as EntityType[];

      // Validate entity types
      const validTypes: EntityType[] = [
        'dossier', 'position', 'mou', 'engagement', 'assignment',
        'commitment', 'intelligence_signal', 'organization',
        'country', 'forum', 'working_group', 'topic'
      ];

      const invalidTypes = entityTypes.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid entity types: ${invalidTypes.join(', ')}`,
            details: {
              valid_types: validTypes,
              invalid_types: invalidTypes,
            },
          },
        });
      }
    }

    // Parse pagination parameters
    const limit = limitParam ? Math.min(parseInt(limitParam), 50) : 10;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Parse min confidence
    const minConfidence = minConfidenceParam ? parseFloat(minConfidenceParam) : undefined;

    // Validate pagination parameters
    if (limit < 1 || isNaN(limit)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid limit parameter. Must be between 1 and 50.',
        },
      });
    }

    if (offset < 0 || isNaN(offset)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid offset parameter. Must be 0 or greater.',
        },
      });
    }

    // Perform entity search
    const searchResults = await searchEntities(
      query.trim(),
      {
        entity_types: entityTypes,
        min_confidence: minConfidence,
        limit,
        offset,
      },
      userId
    );

    // Return success response
    return res.status(200).json({
      success: true,
      data: searchResults,
      pagination: {
        total: searchResults.length, // Note: This is the count of returned results
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('Error searching entities:', error);

    // Handle specific error codes
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to search entities',
      },
    });
  }
});

/**
 * GET /api/entities/:entity_type/:entity_id
 * Gets metadata for a specific entity
 */
router.get('/entities/:entity_type/:entity_id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { entity_type, entity_id } = req.params;

    // Validate entity type
    const validTypes: EntityType[] = [
      'dossier', 'position', 'mou', 'engagement', 'assignment',
      'commitment', 'intelligence_signal', 'organization',
      'country', 'forum', 'working_group', 'topic'
    ];

    if (!validTypes.includes(entity_type as EntityType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ENTITY_TYPE',
          message: `Invalid entity type: ${entity_type}`,
          details: {
            valid_types: validTypes,
          },
        },
      });
    }

    // Get entity metadata
    const metadata = await getEntityMetadata(entity_type as EntityType, entity_id);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENTITY_NOT_FOUND',
          message: `${entity_type} with ID ${entity_id} not found`,
        },
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    console.error('Error fetching entity metadata:', error);

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch entity metadata',
      },
    });
  }
});

/**
 * POST /api/entities/:entity_type/:entity_id/invalidate-cache
 * Invalidates cache for a specific entity
 * (Admin endpoint - should be protected with appropriate middleware)
 */
router.post('/entities/:entity_type/:entity_id/invalidate-cache', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // TODO: Add admin/permission check here

    const { entity_type, entity_id } = req.params;

    // Validate entity type
    const validTypes: EntityType[] = [
      'dossier', 'position', 'mou', 'engagement', 'assignment',
      'commitment', 'intelligence_signal', 'organization',
      'country', 'forum', 'working_group', 'topic'
    ];

    if (!validTypes.includes(entity_type as EntityType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ENTITY_TYPE',
          message: `Invalid entity type: ${entity_type}`,
        },
      });
    }

    // Invalidate cache
    await invalidateEntityCache(entity_type as EntityType, entity_id);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Cache invalidated successfully',
    });
  } catch (error: any) {
    console.error('Error invalidating entity cache:', error);

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INVALIDATION_FAILED',
        message: 'Failed to invalidate entity cache',
      },
    });
  }
});

/**
 * GET /api/entities/types
 * Returns all available entity types with their descriptions
 */
router.get('/entities/types', async (req: Request, res: Response) => {
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
    ];

    return res.status(200).json({
      success: true,
      data: entityTypes,
    });
  } catch (error: any) {
    console.error('Error fetching entity types:', error);

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch entity types',
      },
    });
  }
});

export default router;