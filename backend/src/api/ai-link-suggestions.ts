/**
 * AI Link Suggestions API
 *
 * Provides AI-powered entity link suggestions using AnythingLLM and pgvector.
 * Implements graceful degradation when AI service is unavailable.
 *
 * Endpoints:
 * - POST /api/intake/:intake_id/links/suggestions - Generate AI suggestions
 * - POST /api/intake/:intake_id/links/suggestions/accept - Accept and create link
 *
 * Performance targets:
 * - AI suggestions: <3 seconds for 3-5 recommendations (SC-002)
 * - Rate limiting: 3 requests/minute per user (T066)
 *
 * @module backend/src/api/ai-link-suggestions
 */

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';
import {
  generateSuggestions,
  filterByClearanceLevel,
  filterByArchivedStatus
} from '../services/ai-link-suggestion.service';
import { createEntityLink } from '../services/link.service';
import { checkClearanceLevel } from '../middleware/clearance-check';
import { checkIntakeOrganization } from '../middleware/organization-check';
import type { AILinkSuggestion, AIConfig } from '../types/ai-suggestions.types';

const router = express.Router();

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// Rate limiting: 3 requests/minute per user (T066)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    error: 'Too many AI suggestion requests',
    details: 'Limited to 3 requests per minute to manage AI API costs',
    retry_after: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by user ID
    return req.user?.id || req.ip || 'anonymous';
  }
});

/**
 * POST /api/intake/:intake_id/links/suggestions
 *
 * Generate AI-powered link suggestions for an intake ticket.
 *
 * Security:
 * - Rate limited to 3 requests/minute per user
 * - Requires authentication (Supabase JWT)
 * - Filters by user's clearance level
 * - Enforces organization boundaries
 *
 * Graceful degradation:
 * - If AnythingLLM API fails, returns 503 with fallback message
 * - Frontend shows manual search dialog as fallback
 *
 * Request body:
 * {
 *   "entity_types": ["dossier", "position", "organization"], // Optional, defaults to anchor entities
 *   "max_suggestions": 5 // Optional, defaults to 5
 * }
 *
 * Response:
 * {
 *   "suggestions": [
 *     {
 *       "suggestion_id": "uuid",
 *       "entity_id": "uuid",
 *       "entity_type": "dossier",
 *       "entity_name": "Saudi Arabia Relations",
 *       "confidence_score": 0.89,
 *       "reasoning": "This dossier matches the bilateral trade discussion topics.",
 *       "suggested_link_type": "primary",
 *       "rank": 1
 *     }
 *   ],
 *   "metadata": {
 *     "generated_at": "2025-01-18T10:00:00Z",
 *     "ai_service": "AnythingLLM",
 *     "cache_hit": false
 *   }
 * }
 */
router.post(
  '/intake/:intake_id/links/suggestions',
  aiRateLimiter,
  checkClearanceLevel,
  checkIntakeOrganization,
  async (req: Request, res: Response) => {
    const { intake_id } = req.params;
    const { entity_types, max_suggestions = 5 } = req.body;
    const userId = req.user?.id;
    const userClearanceLevel = req.user?.clearance_level || 0;
    const orgId = req.user?.organization_id;

    try {
      // Validate required parameters
      if (!intake_id || !userId) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'intake_id and userId are required'
        });
      }

      // Validate intake exists and user has access
      const { data: intake, error: intakeError } = await supabase
        .from('intake_tickets')
        .select('id, title, description, org_id, classification_level')
        .eq('id', intake_id)
        .eq('org_id', orgId) // Organization boundary enforcement
        .single();

      if (intakeError || !intake) {
        return res.status(404).json({
          error: 'Intake ticket not found',
          details: 'Ticket does not exist or you do not have access'
        });
      }

      // Clearance check
      if (intake.classification_level > userClearanceLevel) {
        return res.status(403).json({
          error: 'Insufficient clearance level',
          details: `Ticket requires clearance level ${intake.classification_level}, you have ${userClearanceLevel}`
        });
      }

      // Combine title + description for embedding
      const intakeContent = `${intake.title}\n\n${intake.description || ''}`;

      if (!intakeContent.trim()) {
        return res.status(400).json({
          error: 'Intake content is empty',
          details: 'Cannot generate suggestions without title or description'
        });
      }

      // AnythingLLM configuration
      const aiConfig: AIConfig = {
        api_url: process.env.ANYTHINGLLM_API_URL!,
        api_key: process.env.ANYTHINGLLM_API_KEY!,
        workspace_slug: process.env.ANYTHINGLLM_WORKSPACE_SLUG || 'default',
        embedding_model: process.env.ANYTHINGLLM_EMBEDDING_MODEL || 'text-embedding-ada-002',
        embedding_dimensions: 1536,
        chat_model: process.env.ANYTHINGLLM_CHAT_MODEL || 'gpt-3.5-turbo',
        max_suggestions: max_suggestions,
        min_confidence_threshold: 0.70,
        rate_limit_per_minute: 3,
        timeout_ms: 3000 // 3 second timeout for SC-002
      };

      // Validate AnythingLLM configuration
      if (!aiConfig.api_url || !aiConfig.api_key) {
        return res.status(503).json({
          error: 'AI service unavailable',
          details: 'AnythingLLM API is not configured. Please use manual search.',
          fallback: 'manual_search'
        });
      }

      // Ensure orgId is defined
      if (!orgId) {
        return res.status(403).json({
          error: 'Organization not found',
          details: 'User organization_id is missing from profile'
        });
      }

      // Generate AI suggestions with graceful degradation
      const cacheHit = await redis.exists(`ai:suggestions:${intake_id}`);

      let suggestions: AILinkSuggestion[];
      try {
        suggestions = await generateSuggestions(
          supabase,
          redis,
          intake_id,
          intakeContent,
          entity_types || ['dossier', 'position', 'organization', 'country'],
          userClearanceLevel,
          orgId,
          aiConfig
        );

        // Apply additional filters (belt-and-suspenders)
        suggestions = filterByClearanceLevel(suggestions, userClearanceLevel);
        suggestions = filterByArchivedStatus(suggestions);

      } catch (error: any) {
        console.error('[AI Suggestions API] Generation failed:', error);

        // Graceful degradation: Return 503 with fallback instructions
        return res.status(503).json({
          error: 'AI service temporarily unavailable',
          details: error.message || 'Unable to generate suggestions at this time',
          fallback: 'manual_search',
          retry_after: 60
        });
      }

      // Return suggestions
      return res.status(200).json({
        suggestions: suggestions.slice(0, max_suggestions),
        metadata: {
          generated_at: new Date().toISOString(),
          ai_service: 'AnythingLLM',
          cache_hit: cacheHit > 0,
          total_suggestions: suggestions.length
        }
      });

    } catch (error: any) {
      console.error('[AI Suggestions API] Unexpected error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to generate AI suggestions'
      });
    }
  }
);

/**
 * POST /api/intake/:intake_id/links/suggestions/accept
 *
 * Accept an AI suggestion and create entity link.
 *
 * This is a convenience endpoint that combines:
 * 1. Validating the suggestion
 * 2. Creating the entity link
 * 3. Recording the acceptance for analytics
 *
 * Request body:
 * {
 *   "suggestion_id": "uuid",
 *   "entity_id": "uuid",
 *   "entity_type": "dossier",
 *   "link_type": "primary" // Can override suggested_link_type
 * }
 *
 * Response:
 * {
 *   "link": { ... }, // Created link object
 *   "accepted_suggestion": { ... } // Original suggestion
 * }
 */
router.post(
  '/intake/:intake_id/links/suggestions/accept',
  checkClearanceLevel,
  checkIntakeOrganization,
  async (req: Request, res: Response) => {
    const { intake_id } = req.params;
    const { suggestion_id, entity_id, entity_type, link_type, notes } = req.body;
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;

    try {
      // Validate request
      if (!intake_id || !entity_id || !entity_type || !link_type || !userId || !orgId) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'intake_id, entity_id, entity_type, link_type, userId, and organization_id are required'
        });
      }

      // Create entity link (reuses existing service from User Story 1)
      const link = await createEntityLink(
        intake_id,
        userId,
        {
          intake_id,
          entity_id,
          entity_type,
          link_type,
          source: 'ai',
          notes: notes || null
        }
      );

      // Record suggestion acceptance in ai_link_suggestions table for analytics
      await supabase
        .from('ai_link_suggestions')
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
          accepted_by: userId
        })
        .eq('suggestion_id', suggestion_id);

      // Return created link
      return res.status(201).json({
        link,
        accepted_suggestion: { suggestion_id, entity_id, entity_type }
      });

    } catch (error: any) {
      console.error('[AI Suggestions API] Accept failed:', error);
      return res.status(500).json({
        error: 'Failed to accept suggestion',
        details: error.message
      });
    }
  }
);

export default router;
