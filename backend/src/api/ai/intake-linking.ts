/**
 * Entity Linking API
 * Feature: 033-ai-brief-generation
 * Task: T046
 *
 * API endpoints for AI entity linking:
 * - POST /api/ai/intake/:ticketId/propose-links - Generate link proposals
 * - GET /api/ai/intake/:ticketId/proposals - Get proposals for a ticket
 * - POST /api/ai/proposals/:proposalId/approve - Approve a proposal
 * - POST /api/ai/proposals/:proposalId/reject - Reject a proposal
 * - GET /api/ai/intake/:ticketId/links - Get approved links
 * - DELETE /api/ai/intake/links/:linkId - Remove a link
 */

import { Router, Response } from 'express'
import { intakeLinkerAgent } from '../../ai/agents/intake-linker.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { isFeatureEnabled } from '../../ai/config.js'
import logger from '../../utils/logger.js'

// Use Express namespace for extended Request type
type AuthenticatedRequest = Express.Request

const router = Router()

// Middleware to check feature flag
const checkFeatureEnabled = (_req: AuthenticatedRequest, res: Response, next: () => void): void => {
  if (!isFeatureEnabled('entity_linking')) {
    res.status(403).json({
      error: 'Entity linking is disabled',
      code: 'FEATURE_DISABLED',
    })
    return
  }
  next()
}

/**
 * POST /api/ai/intake/:ticketId/propose-links
 * Generate AI link proposals for an intake ticket
 */
router.post(
  '/intake/:ticketId/propose-links',
  checkFeatureEnabled,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { ticketId } = req.params
    const { language = 'en' } = req.body
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      // Verify ticket exists and belongs to org
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('intake_tickets')
        .select('id')
        .eq('id', ticketId)
        .eq('organization_id', organizationId)
        .single()

      if (ticketError || !ticket) {
        res.status(404).json({
          error: 'Intake ticket not found',
          code: 'NOT_FOUND',
        })
        return
      }

      // Generate proposals
      const result = await intakeLinkerAgent.proposeLinks({
        intakeTicketId: ticketId,
        organizationId,
        userId,
        language,
      })

      res.json({
        success: true,
        data: {
          proposals: result.proposals,
          summary: result.ticketSummary,
          runId: result.runId,
        },
      })
    } catch (error) {
      logger.error('Failed to generate link proposals', { error, ticketId })
      res.status(500).json({
        error: 'Failed to generate proposals',
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

/**
 * GET /api/ai/intake/:ticketId/proposals
 * Get link proposals for an intake ticket
 */
router.get(
  '/intake/:ticketId/proposals',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { ticketId } = req.params
    const { status } = req.query
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      let query = supabaseAdmin
        .from('ai_entity_link_proposals')
        .select('*')
        .eq('intake_ticket_id', ticketId)
        .eq('organization_id', organizationId)
        .order('confidence_score', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Failed to fetch proposals', { error, ticketId })
        res.status(500).json({
          error: 'Failed to fetch proposals',
          code: 'FETCH_FAILED',
        })
        return
      }

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      logger.error('Failed to fetch proposals', { error, ticketId })
      res.status(500).json({
        error: 'Failed to fetch proposals',
        code: 'FETCH_FAILED',
      })
    }
  },
)

/**
 * POST /api/ai/proposals/:proposalId/approve
 * Approve a link proposal
 */
router.post(
  '/proposals/:proposalId/approve',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { proposalId } = req.params
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      // Get proposal
      const { data: proposal, error: proposalError } = await supabaseAdmin
        .from('ai_entity_link_proposals')
        .select('*')
        .eq('id', proposalId)
        .eq('organization_id', organizationId)
        .single()

      if (proposalError || !proposal) {
        res.status(404).json({
          error: 'Proposal not found',
          code: 'NOT_FOUND',
        })
        return
      }

      if (proposal.status !== 'pending_approval') {
        res.status(400).json({
          error: 'Proposal is not pending approval',
          code: 'INVALID_STATUS',
        })
        return
      }

      // Create the link
      const { error: linkError } = await supabaseAdmin.from('intake_entity_links').insert({
        intake_ticket_id: proposal.intake_ticket_id,
        entity_type: proposal.entity_type,
        entity_id: proposal.entity_id,
        proposal_id: proposalId,
        created_by: userId,
        is_ai_suggested: true,
      })

      if (linkError) {
        // Check if duplicate
        if (linkError.code === '23505') {
          res.status(409).json({
            error: 'Link already exists',
            code: 'DUPLICATE_LINK',
          })
          return
        }
        throw linkError
      }

      // Update proposal status
      await supabaseAdmin
        .from('ai_entity_link_proposals')
        .update({
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', proposalId)

      res.json({
        success: true,
        message: 'Proposal approved and link created',
      })
    } catch (error) {
      logger.error('Failed to approve proposal', { error, proposalId })
      res.status(500).json({
        error: 'Failed to approve proposal',
        code: 'APPROVAL_FAILED',
      })
    }
  },
)

/**
 * POST /api/ai/proposals/:proposalId/reject
 * Reject a link proposal
 */
router.post(
  '/proposals/:proposalId/reject',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { proposalId } = req.params
    const { reason } = req.body
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      // Get proposal
      const { data: proposal, error: proposalError } = await supabaseAdmin
        .from('ai_entity_link_proposals')
        .select('id, status')
        .eq('id', proposalId)
        .eq('organization_id', organizationId)
        .single()

      if (proposalError || !proposal) {
        res.status(404).json({
          error: 'Proposal not found',
          code: 'NOT_FOUND',
        })
        return
      }

      if (proposal.status !== 'pending_approval') {
        res.status(400).json({
          error: 'Proposal is not pending approval',
          code: 'INVALID_STATUS',
        })
        return
      }

      // Update proposal status
      await supabaseAdmin
        .from('ai_entity_link_proposals')
        .update({
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', proposalId)

      res.json({
        success: true,
        message: 'Proposal rejected',
      })
    } catch (error) {
      logger.error('Failed to reject proposal', { error, proposalId })
      res.status(500).json({
        error: 'Failed to reject proposal',
        code: 'REJECTION_FAILED',
      })
    }
  },
)

/**
 * GET /api/ai/intake/:ticketId/links
 * Get approved links for an intake ticket
 */
router.get(
  '/intake/:ticketId/links',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { ticketId } = req.params
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      // Verify ticket belongs to org
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('intake_tickets')
        .select('id')
        .eq('id', ticketId)
        .eq('organization_id', organizationId)
        .single()

      if (ticketError || !ticket) {
        res.status(404).json({
          error: 'Intake ticket not found',
          code: 'NOT_FOUND',
        })
        return
      }

      // Get links using the function
      const { data, error } = await supabaseAdmin.rpc('get_intake_ticket_links', {
        p_ticket_id: ticketId,
      })

      if (error) {
        // Fallback to direct query if function doesn't exist
        const { data: links, error: linksError } = await supabaseAdmin
          .from('intake_entity_links')
          .select('*')
          .eq('intake_ticket_id', ticketId)
          .order('created_at', { ascending: false })

        if (linksError) {
          throw linksError
        }

        res.json({
          success: true,
          data: links,
        })
        return
      }

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      logger.error('Failed to fetch links', { error, ticketId })
      res.status(500).json({
        error: 'Failed to fetch links',
        code: 'FETCH_FAILED',
      })
    }
  },
)

/**
 * DELETE /api/ai/intake/links/:linkId
 * Remove a link
 */
router.delete(
  '/intake/links/:linkId',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { linkId } = req.params
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      // Get link to verify ownership
      const { data: link, error: linkError } = await supabaseAdmin
        .from('intake_entity_links')
        .select(
          `
        id,
        created_by,
        intake_tickets!inner(organization_id)
      `,
        )
        .eq('id', linkId)
        .single()

      if (linkError || !link) {
        res.status(404).json({
          error: 'Link not found',
          code: 'NOT_FOUND',
        })
        return
      }

      // Check authorization (creator or admin)
      const intakeTicket = link.intake_tickets as unknown as { organization_id: string }
      if (intakeTicket.organization_id !== organizationId) {
        res.status(403).json({
          error: 'Not authorized to delete this link',
          code: 'FORBIDDEN',
        })
        return
      }

      // Delete the link
      const { error: deleteError } = await supabaseAdmin
        .from('intake_entity_links')
        .delete()
        .eq('id', linkId)

      if (deleteError) {
        throw deleteError
      }

      res.json({
        success: true,
        message: 'Link removed',
      })
    } catch (error) {
      logger.error('Failed to delete link', { error, linkId })
      res.status(500).json({
        error: 'Failed to delete link',
        code: 'DELETE_FAILED',
      })
    }
  },
)

/**
 * POST /api/ai/intake/:ticketId/links
 * Manually create a link (without AI suggestion)
 */
router.post(
  '/intake/:ticketId/links',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { ticketId } = req.params
    const { entity_type, entity_id } = req.body
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!entity_type || !entity_id) {
      res.status(400).json({
        error: 'entity_type and entity_id are required',
        code: 'MISSING_FIELDS',
      })
      return
    }

    try {
      // Verify ticket belongs to org
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('intake_tickets')
        .select('id')
        .eq('id', ticketId)
        .eq('organization_id', organizationId)
        .single()

      if (ticketError || !ticket) {
        res.status(404).json({
          error: 'Intake ticket not found',
          code: 'NOT_FOUND',
        })
        return
      }

      // Create the link
      const { data, error } = await supabaseAdmin
        .from('intake_entity_links')
        .insert({
          intake_ticket_id: ticketId,
          entity_type,
          entity_id,
          created_by: userId,
          is_ai_suggested: false,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          res.status(409).json({
            error: 'Link already exists',
            code: 'DUPLICATE_LINK',
          })
          return
        }
        throw error
      }

      res.status(201).json({
        success: true,
        data,
      })
    } catch (error) {
      logger.error('Failed to create link', { error, ticketId })
      res.status(500).json({
        error: 'Failed to create link',
        code: 'CREATE_FAILED',
      })
    }
  },
)

export default router
