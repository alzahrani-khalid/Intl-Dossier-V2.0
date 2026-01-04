/**
 * Brief API Endpoints
 * Feature: 033-ai-brief-generation
 * Task: T021
 *
 * API endpoints for AI brief generation:
 * - POST /api/ai/briefs/generate - Generate a new brief (SSE)
 * - GET /api/ai/briefs/:id - Get a specific brief
 * - GET /api/ai/briefs - List briefs
 */

import { Router, Request, Response, NextFunction } from 'express'
import { briefGeneratorAgent } from '../../ai/agents/brief-generator.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { isFeatureEnabled } from '../../ai/config.js'
import logger from '../../utils/logger.js'

const router = Router()

const GENERATION_TIMEOUT_MS = 90000 // 90 seconds

// Transform database snake_case to frontend camelCase
interface DbBrief {
  id: string
  title: string | null
  status: string
  executive_summary: string | null
  background: string | null
  key_participants: unknown[] | null
  relevant_positions: unknown[] | null
  active_commitments: unknown[] | null
  historical_context: string | null
  talking_points: string[] | null
  recommendations: string | null
  citations: unknown[] | null
  engagement_id: string | null
  dossier_id: string | null
  created_by: string
  created_at: string
  completed_at: string | null
}

function transformBriefToFrontend(data: DbBrief) {
  return {
    id: data.id,
    title: data.title || '',
    status: data.status,
    executiveSummary: data.executive_summary || '',
    background: data.background || '',
    keyParticipants: data.key_participants || [],
    relevantPositions: data.relevant_positions || [],
    activeCommitments: data.active_commitments || [],
    historicalContext: data.historical_context || '',
    talkingPoints: data.talking_points || [],
    recommendations: data.recommendations || '',
    citations: data.citations || [],
    engagementId: data.engagement_id,
    dossierId: data.dossier_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    organization_id: string
  }
}

// Middleware to verify Supabase token and populate req.user
const verifySupabaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verify Supabase token
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      logger.warn('Invalid Supabase token', { error: error?.message })
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user's organization from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    req.user = {
      id: user.id,
      organization_id: profile?.organization_id || user.user_metadata?.organization_id || '',
    }

    next()
  } catch (err) {
    logger.error('Token verification failed', { error: err })
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Middleware to check feature flag
const checkFeatureEnabled = (_req: Request, res: Response, next: () => void) => {
  if (!isFeatureEnabled('brief_generation')) {
    return res.status(403).json({
      error: 'Brief generation is disabled',
      code: 'FEATURE_DISABLED',
    })
  }
  next()
}

/**
 * POST /api/ai/briefs/generate
 * Generate a new brief with SSE streaming
 */
router.post(
  '/generate',
  verifySupabaseToken,
  checkFeatureEnabled,
  async (req: AuthenticatedRequest, res: Response) => {
    const { engagement_id, dossier_id, custom_prompt, language = 'en' } = req.body
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!engagement_id && !dossier_id) {
      return res.status(400).json({
        error: 'Either engagement_id or dossier_id is required',
        code: 'MISSING_TARGET',
      })
    }

    // Check if client wants streaming
    const acceptsSSE = req.headers.accept?.includes('text/event-stream')

    if (acceptsSSE) {
      // SSE streaming response
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')

      // Set timeout for generation
      const timeout = setTimeout(() => {
        res.write(
          `data: ${JSON.stringify({ type: 'timeout', message: 'Generation timed out' })}\n\n`,
        )
        res.end()
      }, GENERATION_TIMEOUT_MS)

      try {
        let briefId: string | undefined

        for await (const chunk of briefGeneratorAgent.generateStream({
          engagementId: engagement_id,
          dossierId: dossier_id,
          organizationId,
          userId,
          customPrompt: custom_prompt,
          language,
        })) {
          if (chunk.briefId) {
            briefId = chunk.briefId
            res.write(`data: ${JSON.stringify({ type: 'init', briefId })}\n\n`)
            continue
          }

          res.write(`data: ${JSON.stringify(chunk)}\n\n`)

          if (chunk.type === 'done' || chunk.type === 'error') {
            break
          }
        }

        // Send done signal with briefId so frontend can fetch the completed brief
        res.write(`data: ${JSON.stringify({ type: 'done', briefId })}\n\n`)
        clearTimeout(timeout)
        res.end()
      } catch (error) {
        clearTimeout(timeout)
        logger.error('SSE brief generation failed', { error })
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Generation failed' })}\n\n`)
        res.end()
      }
    } else {
      // Regular JSON response
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Generation timed out')), GENERATION_TIMEOUT_MS)
        })

        const brief = await Promise.race([
          briefGeneratorAgent.generate({
            engagementId: engagement_id,
            dossierId: dossier_id,
            organizationId,
            userId,
            customPrompt: custom_prompt,
            language,
          }),
          timeoutPromise,
        ])

        res.json({
          success: true,
          data: brief,
        })
      } catch (error) {
        logger.error('Brief generation failed', { error })

        if (error instanceof Error && error.message === 'Generation timed out') {
          return res.status(408).json({
            error: 'Brief generation timed out',
            code: 'TIMEOUT',
            message: 'The generation took too long. Try again with a simpler context.',
          })
        }

        res.status(500).json({
          error: 'Brief generation failed',
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  },
)

/**
 * GET /api/ai/briefs/:id
 * Get a specific brief by ID
 */
router.get('/:id', verifySupabaseToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id
  const organizationId = req.user?.organization_id

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_briefs')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error || !data) {
      return res.status(404).json({
        error: 'Brief not found',
        code: 'NOT_FOUND',
      })
    }

    // Transform to frontend camelCase format
    const transformedBrief = transformBriefToFrontend(data as DbBrief)

    res.json({
      success: true,
      data: transformedBrief,
    })
  } catch (error) {
    logger.error('Failed to get brief', { error, id })
    res.status(500).json({
      error: 'Failed to retrieve brief',
      code: 'FETCH_FAILED',
    })
  }
})

/**
 * GET /api/ai/briefs
 * List briefs with pagination
 */
router.get('/', verifySupabaseToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id
  const organizationId = req.user?.organization_id
  const { engagement_id, dossier_id, status, limit = '20', offset = '0', created_by } = req.query

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    let query = supabaseAdmin
      .from('ai_briefs')
      .select(
        'id, title, status, engagement_id, dossier_id, created_by, created_at, completed_at',
        { count: 'exact' },
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

    if (engagement_id) {
      query = query.eq('engagement_id', engagement_id)
    }

    if (dossier_id) {
      query = query.eq('dossier_id', dossier_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (created_by) {
      query = query.eq('created_by', created_by)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Failed to list briefs', { error })
      return res.status(500).json({
        error: 'Failed to list briefs',
        code: 'LIST_FAILED',
      })
    }

    res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    })
  } catch (error) {
    logger.error('Failed to list briefs', { error })
    res.status(500).json({
      error: 'Failed to list briefs',
      code: 'LIST_FAILED',
    })
  }
})

/**
 * DELETE /api/ai/briefs/:id
 * Delete a brief (only creator or admin)
 */
router.delete('/:id', verifySupabaseToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id
  const organizationId = req.user?.organization_id

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Check ownership
    const { data: brief, error: fetchError } = await supabaseAdmin
      .from('ai_briefs')
      .select('created_by')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !brief) {
      return res.status(404).json({
        error: 'Brief not found',
        code: 'NOT_FOUND',
      })
    }

    if (brief.created_by !== userId) {
      return res.status(403).json({
        error: 'Not authorized to delete this brief',
        code: 'FORBIDDEN',
      })
    }

    const { error } = await supabaseAdmin.from('ai_briefs').delete().eq('id', id)

    if (error) {
      logger.error('Failed to delete brief', { error, id })
      return res.status(500).json({
        error: 'Failed to delete brief',
        code: 'DELETE_FAILED',
      })
    }

    res.json({
      success: true,
      message: 'Brief deleted',
    })
  } catch (error) {
    logger.error('Failed to delete brief', { error, id })
    res.status(500).json({
      error: 'Failed to delete brief',
      code: 'DELETE_FAILED',
    })
  }
})

export default router
