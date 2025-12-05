/**
 * Search API Endpoints
 * Feature: 015-search-retrieval-spec
 * Tasks: T039, T040, T041
 *
 * Endpoints:
 * - GET /api/search - Global keyword search
 * - GET /api/search/suggest - Typeahead suggestions
 * - POST /api/search/semantic - Semantic vector search
 */

import { Router, Request, Response } from 'express'
import { FullTextSearchService } from '../services/fulltext-search.service'
import { SuggestionService } from '../services/suggestion.service'
import { SemanticSearchService } from '../services/semantic-search.service'
import {
  validateSearchRequest,
  validateSemanticSearchRequest,
} from '../middleware/search-validation'
import { searchRateLimit } from '../middleware/search-rate-limit'

const router = Router()

// Initialize services
const searchService = new FullTextSearchService()
const suggestionService = new SuggestionService()
const semanticSearchService = new SemanticSearchService()

/**
 * GET /api/search
 * Global search across all entity types
 * Task: T039
 */
router.get(
  '/',
  searchRateLimit,
  validateSearchRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now()

      // Get validated parameters (added by middleware)
      const { query, entityTypes, limit, offset, includeArchived, language, warnings } = (
        req as any
      ).validatedSearch

      // Perform search
      const results = await searchService.search({
        query,
        entityTypes:
          entityTypes.length > 0 && !entityTypes.includes('all') ? entityTypes : undefined,
        language,
        limit,
        offset,
        includeArchived,
      })

      // Add any validation warnings to response
      if (warnings && warnings.length > 0) {
        results.warnings = [...(results.warnings || []), ...warnings.map((w: any) => w.message_en)]
      }

      // Set performance headers
      res.setHeader('X-Response-Time-Ms', Date.now() - startTime)
      res.setHeader('X-RLS-Enforced', 'true')

      // Return results
      res.status(200).json(results)
    } catch (error) {
      console.error('Search endpoint error:', error)

      res.status(500).json({
        error: {
          code: 'SEARCH_ERROR',
          message_en: 'An error occurred while processing your search',
          message_ar: 'حدث خطأ أثناء معالجة بحثك',
        },
      })
    }
  },
)

/**
 * GET /api/search/suggest
 * Typeahead suggestions with <200ms performance requirement
 * Task: T040
 */
router.get('/suggest', searchRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now()

    // Validate required parameters
    const prefix = (req.query.q || req.query.prefix) as string

    if (!prefix || prefix.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'MISSING_PREFIX',
          message_en: 'Suggestion prefix is required',
          message_ar: 'بادئة الاقتراح مطلوبة',
        },
      })
      return
    }

    const entityType = (req.query.type || 'all') as string
    const language = (req.query.lang || 'both') as 'en' | 'ar' | 'both'
    const limit = parseInt((req.query.limit || '10') as string, 10)

    // Get suggestions
    const response = await suggestionService.getSuggestions({
      prefix,
      entityType,
      language,
      limit,
    })

    const tookMs = Date.now() - startTime

    // Set performance headers
    res.setHeader('X-Response-Time-Ms', tookMs)
    res.setHeader('X-Cache-Hit', response.cache_hit ? 'true' : 'false')

    // Warn if performance target exceeded
    if (tookMs > 200) {
      console.warn(`Suggestion performance degraded: ${tookMs}ms (target: <200ms)`)
    }

    // Return suggestions
    res.status(200).json(response)
  } catch (error) {
    console.error('Suggestion endpoint error:', error)

    res.status(500).json({
      error: {
        code: 'SUGGESTION_ERROR',
        message_en: 'An error occurred while fetching suggestions',
        message_ar: 'حدث خطأ أثناء جلب الاقتراحات',
      },
    })
  }
})

/**
 * POST /api/search/semantic
 * Semantic search using vector embeddings
 * Task: T041
 */
router.post(
  '/semantic',
  searchRateLimit,
  validateSemanticSearchRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get validated parameters (added by middleware)
      const { query, entityTypes, similarityThreshold, limit, includeKeywordResults, warnings } = (
        req as any
      ).validatedSemanticSearch

      // Check if semantic search is available
      const isAvailable = await semanticSearchService.isSemanticSearchAvailable()

      if (!isAvailable && !includeKeywordResults) {
        res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message_en: 'Semantic search service (AnythingLLM) is currently unavailable',
            message_ar: 'خدمة البحث الدلالي غير متاحة حاليًا',
          },
        })
        return
      }

      // Perform semantic search
      const results = await semanticSearchService.search({
        query,
        entityTypes,
        similarityThreshold,
        limit,
        includeKeywordResults,
      })

      // Add any validation warnings to response
      if (warnings && warnings.length > 0) {
        results.warnings = [...(results.warnings || []), ...warnings.map((w: any) => w.message_en)]
      }

      // Set performance headers
      res.setHeader('X-Response-Time-Ms', results.performance.total_ms)
      res.setHeader('X-Embedding-Time-Ms', results.performance.embedding_generation_ms)

      // Return results
      res.status(200).json(results)
    } catch (error) {
      console.error('Semantic search endpoint error:', error)

      res.status(500).json({
        error: {
          code: 'SEMANTIC_SEARCH_ERROR',
          message_en: 'An error occurred while processing semantic search',
          message_ar: 'حدث خطأ أثناء معالجة البحث الدلالي',
        },
      })
    }
  },
)

export default router
