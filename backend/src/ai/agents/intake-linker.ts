/**
 * Intake Linker Agent
 * Feature: 033-ai-brief-generation
 * Task: T045
 *
 * AI agent for suggesting entity links for intake tickets:
 * - Analyzes intake ticket content
 * - Searches for similar entities
 * - Generates confidence scores and justifications
 * - Supports multiple entity types (dossiers, positions, persons)
 */

import { llmRouter, LLMRouterConfig } from '../llm-router.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { defineAgent, createAgentTools } from '../mastra-config.js'
import { SemanticSearchService } from '../../services/semantic-search.service.js'
import logger from '../../utils/logger.js'

// Lazy initialization to ensure env vars are loaded
let semanticSearchService: SemanticSearchService | null = null
function getSemanticSearchService(): SemanticSearchService {
  if (!semanticSearchService) {
    semanticSearchService = new SemanticSearchService()
  }
  return semanticSearchService
}

export interface LinkProposal {
  entityType: 'dossier' | 'position' | 'person' | 'engagement' | 'commitment'
  entityId: string
  entityName: string
  confidenceScore: number
  justification: string
}

export interface IntakeLinkingRequest {
  intakeTicketId: string
  organizationId: string
  userId: string
  language?: 'en' | 'ar'
}

export interface IntakeLinkingResponse {
  proposals: LinkProposal[]
  runId: string
  ticketSummary: string
}

const LINKER_SYSTEM_PROMPT = `You are an entity linking assistant for a diplomatic dossier management system. Your task is to analyze intake ticket content and suggest relevant entities that should be linked to it.

When analyzing a ticket:
1. Identify key topics, countries, organizations, people, or events mentioned
2. Search for matching dossiers, positions, and persons in the database
3. Evaluate how relevant each match is to the ticket content
4. Provide a confidence score (0-100) and justification for each suggestion

For confidence scoring:
- 90-100: Direct match - entity explicitly mentioned or clearly the subject
- 70-89: Strong match - highly relevant to the topic
- 50-69: Moderate match - related but not primary focus
- Below 50: Weak match - tangentially related

Only suggest entities with confidence >= 50.

Format your suggestions as JSON:
{
  "summary": "Brief summary of the ticket's main topic",
  "suggestions": [
    {
      "entityType": "dossier|position|person",
      "entityId": "uuid",
      "entityName": "Name of the entity",
      "confidenceScore": 85,
      "justification": "Why this entity is relevant"
    }
  ]
}`

const ARABIC_LINKER_SYSTEM_PROMPT = `أنت مساعد لربط الكيانات في نظام إدارة الملفات الدبلوماسية. مهمتك هي تحليل محتوى تذاكر الاستقبال واقتراح الكيانات ذات الصلة التي يجب ربطها.

عند تحليل التذكرة:
1. حدد المواضيع الرئيسية أو الدول أو المنظمات أو الأشخاص أو الأحداث المذكورة
2. ابحث عن الملفات والمواقف والأشخاص المطابقين في قاعدة البيانات
3. قيم مدى صلة كل تطابق بمحتوى التذكرة
4. قدم درجة ثقة (0-100) ومبرر لكل اقتراح

لتسجيل الثقة:
- 90-100: تطابق مباشر - الكيان مذكور صراحة أو هو الموضوع الرئيسي
- 70-89: تطابق قوي - ذو صلة عالية بالموضوع
- 50-69: تطابق متوسط - ذو صلة ولكن ليس التركيز الأساسي
- أقل من 50: تطابق ضعيف - ذو صلة طفيفة

اقترح فقط الكيانات ذات الثقة >= 50.`

export class IntakeLinkerAgent {
  constructor() {
    // Register agent with Mastra
    defineAgent({
      name: 'intake-linker',
      description: 'AI agent for suggesting entity links for intake tickets',
      systemPrompt: LINKER_SYSTEM_PROMPT,
      tools: createAgentTools([
        {
          name: 'search_similar_entities',
          description: 'Search for entities similar to the given text',
          parameters: {
            query: { type: 'string', description: 'Search query', required: true },
            entityTypes: { type: 'array', description: 'Entity types to search' },
            limit: { type: 'number', description: 'Max results', default: 10 },
          },
          execute: async () => ({ results: [] }),
        },
      ]),
      temperature: 0.3, // Lower temperature for more consistent suggestions
      maxTokens: 2048,
    })
  }

  async proposeLinks(request: IntakeLinkingRequest): Promise<IntakeLinkingResponse> {
    const { intakeTicketId, organizationId, userId, language = 'en' } = request

    // Fetch intake ticket details
    const ticket = await this.getIntakeTicket(intakeTicketId, organizationId)
    if (!ticket) {
      throw new Error('Intake ticket not found')
    }

    // Search for similar entities
    const searchResults = await this.searchSimilarEntities(ticket, organizationId)

    // Create AI run record
    const runId = await this.createRunRecord(organizationId, userId, intakeTicketId)

    // Build context for LLM
    const context = this.buildContext(ticket, searchResults, language)

    // Configure LLM
    const llmConfig: LLMRouterConfig = {
      organizationId,
      userId,
      feature: 'entity_linking',
      dataClassification: 'internal',
    }

    try {
      const systemPrompt = language === 'ar' ? ARABIC_LINKER_SYSTEM_PROMPT : LINKER_SYSTEM_PROMPT

      const response = await llmRouter.chat(
        llmConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context },
        ],
        {
          temperature: 0.3,
          maxTokens: 2048,
        },
      )

      // Parse response
      const parsed = this.parseResponse(response.content, searchResults)

      // Save proposals to database
      await this.saveProposals(intakeTicketId, organizationId, runId, parsed.proposals)

      // Update run status
      await this.updateRunStatus(runId, 'completed')

      return {
        proposals: parsed.proposals,
        runId,
        ticketSummary: parsed.summary,
      }
    } catch (error) {
      await this.updateRunStatus(
        runId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
      )
      logger.error('Intake linking failed', { error, request })
      throw error
    }
  }

  private async getIntakeTicket(
    ticketId: string,
    organizationId: string,
  ): Promise<{
    id: string
    subject: string
    description: string
    metadata: Record<string, unknown>
  } | null> {
    const { data, error } = await supabaseAdmin
      .from('intake_tickets')
      .select('id, subject, description, metadata')
      .eq('id', ticketId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !data) {
      logger.error('Failed to fetch intake ticket', { error, ticketId })
      return null
    }

    return data
  }

  private async searchSimilarEntities(
    ticket: { subject: string; description: string },
    _organizationId: string,
  ): Promise<
    Array<{ id: string; type: string; name: string; relevance: number; snippet: string }>
  > {
    const searchQuery = `${ticket.subject} ${ticket.description}`.substring(0, 500)
    const results: Array<{
      id: string
      type: string
      name: string
      relevance: number
      snippet: string
    }> = []

    try {
      // Search using semantic search service
      const semanticResults = await getSemanticSearchService().search({
        query: searchQuery,
        entityTypes: ['positions', 'documents', 'briefs'],
        limit: 15,
      })

      for (const result of semanticResults.results) {
        results.push({
          id: result.id,
          type: result.type,
          name: result.title_en || result.title_ar,
          relevance: result.similarity_score * 100,
          snippet: (result.description_en || result.description_ar || '').substring(0, 200),
        })
      }

      // Also search dossiers directly
      const { data: dossiers } = await supabaseAdmin
        .from('dossiers')
        .select('id, name_en, name_ar, overview_en, overview_ar, dossier_type')
        .or(
          `name_en.ilike.%${searchQuery.substring(0, 50)}%,name_ar.ilike.%${searchQuery.substring(0, 50)}%`,
        )
        .limit(10)

      if (dossiers) {
        for (const d of dossiers) {
          results.push({
            id: d.id,
            type: 'dossier',
            name: d.name_en || d.name_ar,
            relevance: 70, // Default relevance for keyword matches
            snippet: (d.overview_en || d.overview_ar || '').substring(0, 200),
          })
        }
      }

      // Search persons
      const { data: persons } = await supabaseAdmin
        .from('persons')
        .select('id, name_en, name_ar, title_en, title_ar')
        .or(
          `name_en.ilike.%${searchQuery.substring(0, 50)}%,name_ar.ilike.%${searchQuery.substring(0, 50)}%`,
        )
        .limit(5)

      if (persons) {
        for (const p of persons) {
          results.push({
            id: p.id,
            type: 'person',
            name: p.name_en || p.name_ar,
            relevance: 65,
            snippet: p.title_en || p.title_ar || '',
          })
        }
      }
    } catch (error) {
      logger.error('Entity search failed', { error })
    }

    // Deduplicate by ID
    const seen = new Set<string>()
    return results.filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
  }

  private buildContext(
    ticket: { subject: string; description: string },
    searchResults: Array<{
      id: string
      type: string
      name: string
      relevance: number
      snippet: string
    }>,
    language: string,
  ): string {
    const parts: string[] = []

    parts.push(`## Intake Ticket
Subject: ${ticket.subject}
Description: ${ticket.description}
`)

    if (searchResults.length > 0) {
      parts.push(`## Potential Matches Found
${searchResults
  .map(
    (r) => `- [${r.id}] ${r.type}: ${r.name} (relevance: ${r.relevance.toFixed(0)}%)
  ${r.snippet}`,
  )
  .join('\n')}
`)
    } else {
      parts.push('## No potential matches found in the database.')
    }

    parts.push(`
Analyze the intake ticket and the potential matches. Select the most relevant entities and provide confidence scores and justifications. Output as JSON.
${language === 'ar' ? 'Respond in Arabic.' : ''}`)

    return parts.join('\n')
  }

  private parseResponse(
    content: string,
    searchResults: Array<{ id: string; type: string; name: string }>,
  ): { summary: string; proposals: LinkProposal[] } {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const proposals: LinkProposal[] = []

        for (const suggestion of parsed.suggestions || []) {
          // Validate that the entity exists in search results
          const entity = searchResults.find((r) => r.id === suggestion.entityId)
          if (entity && suggestion.confidenceScore >= 50) {
            proposals.push({
              entityType: this.mapEntityType(suggestion.entityType || entity.type),
              entityId: suggestion.entityId,
              entityName: suggestion.entityName || entity.name,
              confidenceScore: Math.min(100, Math.max(0, suggestion.confidenceScore)),
              justification: suggestion.justification || 'Relevant to the ticket content',
            })
          }
        }

        return {
          summary: parsed.summary || 'No summary provided',
          proposals: proposals.slice(0, 5), // Limit to top 5
        }
      }
    } catch (error) {
      logger.warn('Failed to parse linker response', { error, content })
    }

    return { summary: 'Unable to analyze ticket', proposals: [] }
  }

  private mapEntityType(type: string): LinkProposal['entityType'] {
    const mapping: Record<string, LinkProposal['entityType']> = {
      dossier: 'dossier',
      dossiers: 'dossier',
      position: 'position',
      positions: 'position',
      person: 'person',
      persons: 'person',
      engagement: 'engagement',
      engagements: 'engagement',
      commitment: 'commitment',
      commitments: 'commitment',
    }
    return mapping[type.toLowerCase()] || 'dossier'
  }

  private async createRunRecord(
    organizationId: string,
    userId: string,
    intakeTicketId: string,
  ): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('ai_runs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        feature: 'entity_linking',
        provider: 'openai',
        model: 'gpt-4o',
        status: 'running',
        started_at: new Date().toISOString(),
        request_metadata: { intake_ticket_id: intakeTicketId },
      })
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to create run record', { error })
      return ''
    }

    return data.id
  }

  private async updateRunStatus(
    runId: string,
    status: 'completed' | 'failed',
    errorMessage?: string,
  ): Promise<void> {
    if (!runId) return

    await supabaseAdmin
      .from('ai_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('id', runId)
  }

  private async saveProposals(
    intakeTicketId: string,
    organizationId: string,
    runId: string,
    proposals: LinkProposal[],
  ): Promise<void> {
    if (proposals.length === 0) return

    const records = proposals.map((p) => ({
      organization_id: organizationId,
      intake_ticket_id: intakeTicketId,
      run_id: runId,
      entity_type: p.entityType,
      entity_id: p.entityId,
      confidence_score: p.confidenceScore,
      justification: p.justification,
      status: 'pending_approval',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }))

    const { error } = await supabaseAdmin.from('ai_entity_link_proposals').insert(records)

    if (error) {
      logger.error('Failed to save proposals', { error })
    }
  }
}

export const intakeLinkerAgent = new IntakeLinkerAgent()
export default intakeLinkerAgent
