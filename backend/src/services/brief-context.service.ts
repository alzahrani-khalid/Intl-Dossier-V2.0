/**
 * Brief Context Service
 * Feature: 033-ai-brief-generation
 * Task: T019
 *
 * Gathers context data for brief generation:
 * - Semantic search for related dossiers
 * - Position retrieval for key participants
 * - Commitment aggregation for active commitments
 * - Engagement history retrieval
 *
 * Note: This service is adapted to work with the actual database schema.
 * Some tables have different structures than originally expected.
 */

import { supabaseAdmin } from '../config/supabase.js'
import logger from '../utils/logger.js'

export interface BriefContextRequest {
  engagementId?: string
  dossierId?: string
  organizationId: string
  maxDossiers?: number
  maxPositions?: number
  maxCommitments?: number
  maxEngagements?: number
}

export interface DossierContext {
  id: string
  name_en: string
  name_ar: string
  dossier_type: string
  overview_en?: string
  overview_ar?: string
  background_en?: string
  background_ar?: string
  relevance_score?: number
}

export interface PositionContext {
  id: string
  title_en: string
  title_ar: string
  stance: string
  context?: string
  dossier_name?: string
  last_updated?: string
}

export interface CommitmentContext {
  id: string
  description_en: string
  description_ar: string
  status: string
  deadline?: string
  commitment_type: string
  source_entity?: string
}

export interface EngagementContext {
  id: string
  title_en: string
  title_ar: string
  engagement_type: string
  start_date?: string
  end_date?: string
  location?: string
  participants?: string[]
  outcomes?: string
}

export interface BriefContext {
  engagement?: EngagementContext
  dossier?: DossierContext
  relatedDossiers: DossierContext[]
  positions: PositionContext[]
  commitments: CommitmentContext[]
  recentEngagements: EngagementContext[]
  searchQuery?: string
}

export class BriefContextService {
  async gatherContext(request: BriefContextRequest): Promise<BriefContext> {
    const {
      engagementId,
      dossierId,
      maxDossiers = 5,
      maxPositions = 10,
      maxCommitments = 10,
    } = request

    const context: BriefContext = {
      relatedDossiers: [],
      positions: [],
      commitments: [],
      recentEngagements: [],
    }

    try {
      // If engagement specified, get engagement details first
      if (engagementId) {
        context.engagement = await this.getEngagement(engagementId)
      }

      // If dossier specified, get dossier details
      if (dossierId) {
        context.dossier = await this.getDossier(dossierId)
      }

      // Build search query from context
      const searchQuery = this.buildSearchQuery(context)
      context.searchQuery = searchQuery

      // Gather related data in parallel
      const [relatedDossiers, positions, commitments] = await Promise.all([
        this.getTopDossiers(maxDossiers, dossierId),
        this.getRelevantPositions(maxPositions),
        this.getActiveCommitments(maxCommitments),
      ])

      context.relatedDossiers = relatedDossiers
      context.positions = positions
      context.commitments = commitments
      // Note: recentEngagements left empty as engagements table has limited data

      return context
    } catch (error) {
      logger.error('Failed to gather brief context', { error, request })
      // Return partial context rather than throwing
      return context
    }
  }

  private async getEngagement(engagementId: string): Promise<EngagementContext | undefined> {
    try {
      // Engagements table has limited columns: id, engagement_type, engagement_category, location_en, location_ar
      const { data, error } = await supabaseAdmin
        .from('engagements')
        .select(
          `
          id,
          engagement_type,
          engagement_category,
          location_en,
          location_ar
        `,
        )
        .eq('id', engagementId)
        .single()

      if (error || !data) {
        logger.warn('Failed to get engagement', { error, engagementId })
        return undefined
      }

      // Map to expected interface with available data
      return {
        id: data.id,
        title_en: `${data.engagement_type} - ${data.engagement_category}`,
        title_ar: `${data.engagement_type} - ${data.engagement_category}`,
        engagement_type: data.engagement_type,
        location: data.location_en,
      }
    } catch (error) {
      logger.warn('Error fetching engagement', { error, engagementId })
      return undefined
    }
  }

  private async getDossier(dossierId: string): Promise<DossierContext | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('dossiers')
        .select(
          `
          id,
          name_en,
          name_ar,
          type,
          description_en,
          description_ar
        `,
        )
        .eq('id', dossierId)
        .single()

      if (error || !data) {
        logger.warn('Failed to get dossier', { error, dossierId })
        return undefined
      }

      // Map to expected interface
      return {
        id: data.id,
        name_en: data.name_en || '',
        name_ar: data.name_ar || '',
        dossier_type: data.type || 'unknown',
        overview_en: data.description_en,
        overview_ar: data.description_ar,
      }
    } catch (error) {
      logger.warn('Error fetching dossier', { error, dossierId })
      return undefined
    }
  }

  private buildSearchQuery(context: BriefContext): string {
    const parts: string[] = []

    if (context.engagement) {
      parts.push(context.engagement.title_en || '')
      if (context.engagement.location) {
        parts.push(context.engagement.location)
      }
    }

    if (context.dossier) {
      parts.push(context.dossier.name_en || '')
      if (context.dossier.overview_en) {
        parts.push(context.dossier.overview_en.slice(0, 200))
      }
    }

    return parts.filter(Boolean).join(' ').slice(0, 500)
  }

  private async getTopDossiers(limit: number, excludeId?: string): Promise<DossierContext[]> {
    try {
      // Dossiers table: id, type, name_en, name_ar, description_en, description_ar, status, is_active, etc.
      // No organization_id column exists
      let query = supabaseAdmin
        .from('dossiers')
        .select(
          `
          id,
          name_en,
          name_ar,
          type,
          description_en,
          description_ar
        `,
        )
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        logger.warn('Failed to get top dossiers', { error })
        return []
      }

      // Map to expected interface
      return (data || []).map((d) => ({
        id: d.id,
        name_en: d.name_en || '',
        name_ar: d.name_ar || '',
        dossier_type: d.type || 'unknown',
        overview_en: d.description_en,
        overview_ar: d.description_ar,
      }))
    } catch (error) {
      logger.warn('Error fetching top dossiers', { error })
      return []
    }
  }

  private async getRelevantPositions(limit: number): Promise<PositionContext[]> {
    try {
      // Positions table: id, position_type_id, title_en, title_ar, content_en, content_ar,
      // rationale_en, rationale_ar, status, author_id, etc.
      // No organization_id, dossier_id, stance, or context columns
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select(
          `
          id,
          title_en,
          title_ar,
          content_en,
          status,
          updated_at
        `,
        )
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.warn('Failed to get positions', { error })
        return []
      }

      return (data || []).map((p) => ({
        id: p.id,
        title_en: p.title_en || '',
        title_ar: p.title_ar || '',
        stance: p.status || 'neutral', // Use status as stance proxy
        context: p.content_en, // Use content as context
        last_updated: p.updated_at,
      }))
    } catch (error) {
      logger.warn('Error fetching positions', { error })
      return []
    }
  }

  private async getActiveCommitments(limit: number): Promise<CommitmentContext[]> {
    try {
      // Commitments table: id, title, type, source (jsonb), responsible (jsonb),
      // timeline (jsonb), status, priority, etc.
      // No organization_id, description_en/ar, deadline, commitment_type, source_entity columns
      const { data, error } = await supabaseAdmin
        .from('commitments')
        .select(
          `
          id,
          title,
          type,
          status,
          priority,
          timeline,
          source
        `,
        )
        .in('status', ['pending', 'in_progress', 'active'])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.warn('Failed to get commitments', { error })
        return []
      }

      return (data || []).map((c) => {
        // Extract deadline from timeline JSONB if available
        const timeline = c.timeline as { deadline?: string } | null
        const source = c.source as { entity?: string; name?: string } | null

        return {
          id: c.id,
          description_en: c.title || '',
          description_ar: c.title || '', // Use same title for both languages
          status: c.status || 'unknown',
          deadline: timeline?.deadline,
          commitment_type: c.type || 'general',
          source_entity: source?.entity || source?.name,
        }
      })
    } catch (error) {
      logger.warn('Error fetching commitments', { error })
      return []
    }
  }
}

export const briefContextService = new BriefContextService()
export default briefContextService
