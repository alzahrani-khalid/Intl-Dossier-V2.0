import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

interface Brief {
  id: string;
  type: 'country' | 'event' | 'organization' | 'relationship';
  entity_id: string;
  title_en: string;
  title_ar?: string;
  content_en: string;
  content_ar?: string;
  template_id?: string;
  sections: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  key_points?: string[];
  recommendations?: string[];
  data_sources?: string[];
  generation_method: 'ai' | 'template' | 'manual';
  ai_model?: string;
  ai_prompt?: string;
  confidence_score?: number;
  review_status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: Date;
  metadata?: Record<string, any>;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface BriefTemplate {
  id: string;
  name: string;
  type: Brief['type'];
  sections: Array<{
    title: string;
    prompt?: string;
    data_fields?: string[];
    order: number;
  }>;
  is_active: boolean;
}

interface GenerateBriefParams {
  type: Brief['type'];
  entityId: string;
  templateId?: string;
  language?: 'en' | 'ar' | 'both';
  additionalContext?: string;
}

export class BriefService {
  private readonly anythingLLMUrl: string;
  private readonly anythingLLMKey: string;
  private readonly cachePrefix = 'brief:';
  private readonly cacheTTL = 3600; // 1 hour

  constructor() {
    this.anythingLLMUrl = process.env.ANYTHINGLLM_API_URL || 'http://localhost:3002';
    this.anythingLLMKey = process.env.ANYTHINGLLM_API_KEY || '';
  }

  /**
   * Generate brief using AnythingLLM
   */
  async generateBrief(params: GenerateBriefParams, userId: string): Promise<Brief> {
    try {
      const { type, entityId, templateId, language = 'both', additionalContext } = params;

      // Fetch entity data
      const entityData = await this.fetchEntityData(type, entityId);
      if (!entityData) {
        throw new Error(`Entity not found: ${type} ${entityId}`);
      }

      // Get or create template
      const template = templateId
        ? await this.getTemplate(templateId)
        : await this.getDefaultTemplate(type);

      // Prepare context for AI
      const context = await this.prepareContext(type, entityData, additionalContext);

      // Generate content for each section
      const sections: Brief['sections'] = [];
      const keyPoints: string[] = [];
      const recommendations: string[] = [];

      for (const templateSection of template.sections) {
        const sectionContent = await this.generateSection(
          templateSection,
          context,
          language
        );

        sections.push({
          title: templateSection.title,
          content: sectionContent.content,
          order: templateSection.order
        });

        // Extract key points and recommendations
        if (sectionContent.keyPoints) {
          keyPoints.push(...sectionContent.keyPoints);
        }
        if (sectionContent.recommendations) {
          recommendations.push(...sectionContent.recommendations);
        }
      }

      // Combine sections into full brief content
      const content_en = sections
        .sort((a, b) => a.order - b.order)
        .map(s => `## ${s.title}\n\n${s.content}`)
        .join('\n\n');

      // Generate Arabic version if needed
      let content_ar: string | undefined;
      if (language === 'ar' || language === 'both') {
        content_ar = await this.translateContent(content_en, 'ar');
      }

      // Save brief to database
      const { data: brief, error } = await supabaseAdmin
        .from('briefs')
        .insert({
          type,
          entity_id: entityId,
          title_en: `${type.charAt(0).toUpperCase() + type.slice(1)} Brief: ${entityData.name || entityId}`,
          title_ar: language === 'both' ? `ملخص ${this.getArabicType(type)}: ${entityData.name_ar || entityData.name}` : undefined,
          content_en,
          content_ar,
          template_id: template.id,
          sections,
          key_points: keyPoints,
          recommendations,
          generation_method: 'ai',
          ai_model: 'anythingllm',
          confidence_score: 0.85,
          review_status: 'pending',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logInfo(`Generated brief for ${type} ${entityId}`);
      return brief;
    } catch (error) {
      logError('Error generating brief', error as Error);
      throw error;
    }
  }

  /**
   * Get briefs for entity
   */
  async getBriefsForEntity(type: Brief['type'], entityId: string): Promise<Brief[]> {
    try {
      const cacheKey = `${this.cachePrefix}${type}:${entityId}`;
      const cached = await cacheHelpers.get<Brief[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabaseAdmin
        .from('briefs')
        .select('*')
        .eq('type', type)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      }

      return data || [];
    } catch (error) {
      logError('Error fetching briefs', error as Error);
      throw error;
    }
  }

  /**
   * Review brief
   */
  async reviewBrief(
    briefId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    comments?: string
  ): Promise<Brief> {
    try {
      const { data, error } = await supabaseAdmin
        .from('briefs')
        .update({
          review_status: status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          metadata: { review_comments: comments },
          updated_at: new Date().toISOString()
        })
        .eq('id', briefId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear cache
      await cacheHelpers.clearPattern(`${this.cachePrefix}*`);

      logInfo(`Brief ${briefId} ${status} by ${reviewerId}`);
      return data;
    } catch (error) {
      logError('Error reviewing brief', error as Error);
      throw error;
    }
  }

  // Helper methods

  private async fetchEntityData(type: Brief['type'], entityId: string): Promise<any> {
    let table: string;
    switch (type) {
      case 'country':
        table = 'countries';
        break;
      case 'organization':
        table = 'organizations';
        break;
      case 'event':
        table = 'events';
        break;
      case 'relationship':
        table = 'relationships';
        break;
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  private async getDefaultTemplate(type: Brief['type']): Promise<BriefTemplate> {
    // Default templates for each type
    const templates: Record<Brief['type'], BriefTemplate> = {
      country: {
        id: 'default-country',
        name: 'Country Brief Template',
        type: 'country',
        sections: [
          { title: 'Overview', order: 1 },
          { title: 'Key Statistics', order: 2 },
          { title: 'Bilateral Relations', order: 3 },
          { title: 'Active Collaborations', order: 4 },
          { title: 'Opportunities', order: 5 },
          { title: 'Recommendations', order: 6 }
        ],
        is_active: true
      },
      organization: {
        id: 'default-org',
        name: 'Organization Brief Template',
        type: 'organization',
        sections: [
          { title: 'Organization Profile', order: 1 },
          { title: 'Mission & Objectives', order: 2 },
          { title: 'Partnership Status', order: 3 },
          { title: 'Joint Initiatives', order: 4 },
          { title: 'Key Contacts', order: 5 },
          { title: 'Next Steps', order: 6 }
        ],
        is_active: true
      },
      event: {
        id: 'default-event',
        name: 'Event Brief Template',
        type: 'event',
        sections: [
          { title: 'Event Summary', order: 1 },
          { title: 'Objectives', order: 2 },
          { title: 'Key Participants', order: 3 },
          { title: 'Agenda Highlights', order: 4 },
          { title: 'Expected Outcomes', order: 5 },
          { title: 'Preparation Notes', order: 6 }
        ],
        is_active: true
      },
      relationship: {
        id: 'default-rel',
        name: 'Relationship Brief Template',
        type: 'relationship',
        sections: [
          { title: 'Relationship Overview', order: 1 },
          { title: 'Historical Context', order: 2 },
          { title: 'Current Status', order: 3 },
          { title: 'Key Achievements', order: 4 },
          { title: 'Challenges', order: 5 },
          { title: 'Strategic Recommendations', order: 6 }
        ],
        is_active: true
      }
    };

    return templates[type];
  }

  private async getTemplate(templateId: string): Promise<BriefTemplate> {
    const { data, error } = await supabaseAdmin
      .from('brief_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      // Fallback to default template
      return this.getDefaultTemplate('country');
    }

    return data;
  }

  private async prepareContext(type: Brief['type'], entityData: any, additionalContext?: string): Promise<string> {
    let context = `Entity Type: ${type}\n`;
    context += `Entity Data: ${JSON.stringify(entityData, null, 2)}\n`;

    // Add related data based on type
    if (type === 'country') {
      // Fetch recent MoUs, events, etc.
      const { data: mous } = await supabaseAdmin
        .from('mous')
        .select('title_en, status, sign_date')
        .contains('parties', [{ country_id: entityData.id }])
        .limit(5);

      if (mous) {
        context += `\nRecent MoUs: ${JSON.stringify(mous, null, 2)}\n`;
      }
    }

    if (additionalContext) {
      context += `\nAdditional Context: ${additionalContext}\n`;
    }

    return context;
  }

  private async generateSection(
    section: BriefTemplate['sections'][0],
    context: string,
    language: 'en' | 'ar' | 'both'
  ): Promise<{ content: string; keyPoints?: string[]; recommendations?: string[] }> {
    try {
      // Call AnythingLLM API
      const prompt = `Generate a ${section.title} section for a brief.\nContext: ${context}\nLanguage: ${language}\nProvide a comprehensive but concise response.`;

      const response = await this.callAnythingLLM(prompt);

      // Parse response and extract key points if applicable
      const keyPoints = section.title.includes('Key') ? this.extractKeyPoints(response) : undefined;
      const recommendations = section.title.includes('Recommendation') ? this.extractRecommendations(response) : undefined;

      return {
        content: response,
        keyPoints,
        recommendations
      };
    } catch (error) {
      // Fallback to template-based generation
      logError(`AI generation failed for section ${section.title}, using fallback`, error as Error);
      return {
        content: `[${section.title}]\n\nContent generation pending.`,
        keyPoints: [],
        recommendations: []
      };
    }
  }

  private async callAnythingLLM(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.anythingLLMUrl}/api/v1/chat`,
        {
          message: prompt,
          mode: 'chat'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.anythingLLMKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.response || 'No response generated';
    } catch (error) {
      logError('AnythingLLM API call failed', error as Error);
      throw error;
    }
  }

  private async translateContent(content: string, targetLang: 'ar'): Promise<string> {
    // This would integrate with translation service
    // For now, return a placeholder
    return `[Arabic translation of: ${content.substring(0, 50)}...]`;
  }

  private extractKeyPoints(content: string): string[] {
    // Simple extraction logic - would be more sophisticated in production
    const lines = content.split('\n');
    return lines
      .filter(line => line.startsWith('- ') || line.startsWith('• '))
      .map(line => line.substring(2).trim())
      .slice(0, 5);
  }

  private extractRecommendations(content: string): string[] {
    // Simple extraction logic
    const lines = content.split('\n');
    return lines
      .filter(line => line.includes('recommend') || line.includes('suggest'))
      .slice(0, 3);
  }

  private getArabicType(type: Brief['type']): string {
    const translations: Record<Brief['type'], string> = {
      country: 'الدولة',
      organization: 'المنظمة',
      event: 'الحدث',
      relationship: 'العلاقة'
    };
    return translations[type];
  }

  /**
   * Get all briefs for a specific user
   */
  async getUserBriefs(userId: string): Promise<Brief[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('briefs')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('Failed to get user briefs', error as Error);
      throw error;
    }
  }

  /**
   * Get brief by ID
   */
  async getBriefById(briefId: string): Promise<Brief | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('briefs')
        .select('*')
        .eq('id', briefId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('Failed to get brief by ID', error as Error);
      throw error;
    }
  }

  /**
   * Get all brief templates
   */
  async getTemplates(): Promise<BriefTemplate[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('brief_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('Failed to get brief templates', error as Error);
      throw error;
    }
  }

  /**
   * Create a new brief template
   */
  async createTemplate(template: Omit<BriefTemplate, 'id'>): Promise<BriefTemplate> {
    try {
      const { data, error } = await supabaseAdmin
        .from('brief_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('Failed to create brief template', error as Error);
      throw error;
    }
  }
}

export default BriefService;

// --- Merged from brief-context.service.ts (Phase 06 consolidation) ---

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
      if (engagementId) {
        context.engagement = await this.getEngagement(engagementId)
      }

      if (dossierId) {
        context.dossier = await this.getDossier(dossierId)
      }

      const searchQuery = this.buildSearchQuery(context)
      context.searchQuery = searchQuery

      const [relatedDossiers, positions, commitments] = await Promise.all([
        this.getTopDossiers(maxDossiers, dossierId),
        this.getRelevantPositions(maxPositions),
        this.getActiveCommitments(maxCommitments),
      ])

      context.relatedDossiers = relatedDossiers
      context.positions = positions
      context.commitments = commitments

      return context
    } catch (error) {
      logError('Failed to gather brief context', error as Error)
      return context
    }
  }

  private async getEngagement(engagementId: string): Promise<EngagementContext | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('engagements')
        .select(`id, engagement_type, engagement_category, location_en, location_ar`)
        .eq('id', engagementId)
        .single()

      if (error || !data) {
        logError('Failed to get engagement', error as Error)
        return undefined
      }

      return {
        id: data.id,
        title_en: `${data.engagement_type} - ${data.engagement_category}`,
        title_ar: `${data.engagement_type} - ${data.engagement_category}`,
        engagement_type: data.engagement_type,
        location: data.location_en,
      }
    } catch (error) {
      logError('Error fetching engagement', error as Error)
      return undefined
    }
  }

  private async getDossier(dossierId: string): Promise<DossierContext | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('dossiers')
        .select(`id, name_en, name_ar, type, description_en, description_ar`)
        .eq('id', dossierId)
        .single()

      if (error || !data) {
        logError('Failed to get dossier', error as Error)
        return undefined
      }

      return {
        id: data.id,
        name_en: data.name_en || '',
        name_ar: data.name_ar || '',
        dossier_type: data.type || 'unknown',
        overview_en: data.description_en,
        overview_ar: data.description_ar,
      }
    } catch (error) {
      logError('Error fetching dossier', error as Error)
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
      let query = supabaseAdmin
        .from('dossiers')
        .select(`id, name_en, name_ar, type, description_en, description_ar`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        logError('Failed to get top dossiers', error as Error)
        return []
      }

      return (data || []).map((d) => ({
        id: d.id,
        name_en: d.name_en || '',
        name_ar: d.name_ar || '',
        dossier_type: d.type || 'unknown',
        overview_en: d.description_en,
        overview_ar: d.description_ar,
      }))
    } catch (error) {
      logError('Error fetching top dossiers', error as Error)
      return []
    }
  }

  private async getRelevantPositions(limit: number): Promise<PositionContext[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select(`id, title_en, title_ar, content_en, status, updated_at`)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        logError('Failed to get positions', error as Error)
        return []
      }

      return (data || []).map((p) => ({
        id: p.id,
        title_en: p.title_en || '',
        title_ar: p.title_ar || '',
        stance: p.status || 'neutral',
        context: p.content_en,
        last_updated: p.updated_at,
      }))
    } catch (error) {
      logError('Error fetching positions', error as Error)
      return []
    }
  }

  private async getActiveCommitments(limit: number): Promise<CommitmentContext[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('commitments')
        .select(`id, title, type, status, priority, timeline, source`)
        .in('status', ['pending', 'in_progress', 'active'])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logError('Failed to get commitments', error as Error)
        return []
      }

      return (data || []).map((c) => {
        const timeline = c.timeline as { deadline?: string } | null
        const source = c.source as { entity?: string; name?: string } | null

        return {
          id: c.id,
          description_en: c.title || '',
          description_ar: c.title || '',
          status: c.status || 'unknown',
          deadline: timeline?.deadline,
          commitment_type: c.type || 'general',
          source_entity: source?.entity || source?.name,
        }
      })
    } catch (error) {
      logError('Error fetching commitments', error as Error)
      return []
    }
  }
}

export const briefContextService = new BriefContextService()