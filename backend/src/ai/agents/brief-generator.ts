/**
 * Brief Generator Agent
 * Feature: 033-ai-brief-generation
 * Task: T020
 *
 * AI agent for generating engagement briefs using RAG:
 * - Uses LLM Router for provider selection
 * - Gathers context from brief-context.service
 * - Generates structured briefs with citations
 * - Supports streaming output
 */

import { llmRouter, LLMRouterConfig, StreamChunk } from '../llm-router.js'
import { briefContextService, BriefContext } from '../../services/brief-context.service.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { defineAgent, createAgentTools } from '../mastra-config.js'
import logger from '../../utils/logger.js'

export interface BriefGenerationRequest {
  engagementId?: string
  dossierId?: string
  organizationId: string
  userId: string
  customPrompt?: string
  language?: 'en' | 'ar'
}

export interface GeneratedBrief {
  id: string
  title: string
  executiveSummary: string
  background: string
  keyParticipants: Array<{
    name: string
    role: string
    relevance: string
  }>
  relevantPositions: Array<{
    title: string
    stance: string
    source: string
    sourceId: string
  }>
  activeCommitments: Array<{
    description: string
    status: string
    deadline?: string
    sourceId: string
  }>
  historicalContext: string
  talkingPoints: string[]
  recommendations: string
  citations: Array<{
    type: 'dossier' | 'position' | 'commitment' | 'engagement'
    id: string
    title: string
    snippet?: string
  }>
  status: 'completed' | 'partial' | 'failed'
  runId: string
}

const BRIEF_SYSTEM_PROMPT = `You are a diplomatic brief generator assistant. Your role is to create comprehensive, well-structured briefing documents for upcoming engagements.

When generating a brief, you should:
1. Analyze the context provided about the engagement, related dossiers, positions, and commitments
2. Create an executive summary highlighting key points
3. Provide relevant background information
4. List key participants and their significance
5. Summarize relevant positions and stances
6. Include active commitments that may be discussed
7. Suggest talking points based on the context
8. Provide recommendations for the engagement

Format your response as a JSON object with the following structure:
{
  "title": "Brief title",
  "executiveSummary": "2-3 paragraph executive summary",
  "background": "Historical context and background",
  "keyParticipants": [{"name": "", "role": "", "relevance": ""}],
  "relevantPositions": [{"title": "", "stance": "", "source": "", "sourceId": ""}],
  "activeCommitments": [{"description": "", "status": "", "deadline": "", "sourceId": ""}],
  "historicalContext": "Previous engagement history and context",
  "talkingPoints": ["Point 1", "Point 2"],
  "recommendations": "Strategic recommendations"
}

Be concise but thorough. Always cite sources using the provided IDs.`

const ARABIC_BRIEF_SYSTEM_PROMPT = `أنت مساعد لإنشاء موجزات دبلوماسية. دورك هو إنشاء وثائق إحاطة شاملة ومنظمة للاجتماعات القادمة.

عند إنشاء الموجز، يجب عليك:
1. تحليل السياق المقدم حول الاجتماع والملفات ذات الصلة والمواقف والالتزامات
2. إنشاء ملخص تنفيذي يبرز النقاط الرئيسية
3. تقديم معلومات أساسية ذات صلة
4. سرد المشاركين الرئيسيين وأهميتهم
5. تلخيص المواقف والاتجاهات ذات الصلة
6. تضمين الالتزامات النشطة التي قد تناقش
7. اقتراح نقاط للحوار بناءً على السياق
8. تقديم توصيات للاجتماع

قم بتنسيق ردك كـ JSON.`

export class BriefGeneratorAgent {
  // Agent configuration for future Mastra integration
  private readonly _agentConfig = defineAgent({
    name: 'brief-generator',
    description: 'Generates comprehensive diplomatic briefs for engagements',
    systemPrompt: BRIEF_SYSTEM_PROMPT,
    tools: createAgentTools([
      {
        name: 'search_dossiers',
        description: 'Search for relevant dossiers by query',
        parameters: {
          query: { type: 'string', description: 'Search query', required: true },
          limit: { type: 'number', description: 'Max results', default: 5 },
        },
        execute: async () => ({ results: [] }),
      },
      {
        name: 'get_positions',
        description: 'Get positions for a dossier',
        parameters: {
          dossierId: { type: 'string', description: 'Dossier ID', required: true },
        },
        execute: async () => ({ positions: [] }),
      },
      {
        name: 'get_commitments',
        description: 'Get active commitments',
        parameters: {
          dossierId: { type: 'string', description: 'Dossier ID' },
          engagementId: { type: 'string', description: 'Engagement ID' },
        },
        execute: async () => ({ commitments: [] }),
      },
      {
        name: 'get_engagements',
        description: 'Get recent engagements',
        parameters: {
          dossierId: { type: 'string', description: 'Dossier ID' },
          limit: { type: 'number', description: 'Max results', default: 5 },
        },
        execute: async () => ({ engagements: [] }),
      },
    ]),
    temperature: 0.7,
    maxTokens: 4096,
  })

  async generate(request: BriefGenerationRequest): Promise<GeneratedBrief> {
    const {
      engagementId,
      dossierId,
      organizationId,
      userId,
      customPrompt,
      language = 'en',
    } = request

    // Gather context
    const context = await briefContextService.gatherContext({
      engagementId,
      dossierId,
      organizationId,
    })

    // Create brief record
    const briefId = await this.createBriefRecord(request, context)

    // Build prompt
    const userPrompt = this.buildUserPrompt(context, customPrompt, language)
    const systemPrompt = language === 'ar' ? ARABIC_BRIEF_SYSTEM_PROMPT : BRIEF_SYSTEM_PROMPT

    // Configure LLM
    const llmConfig: LLMRouterConfig = {
      organizationId,
      userId,
      feature: 'brief_generation',
      dataClassification: 'internal',
    }

    try {
      // Generate brief
      const response = await llmRouter.chat(
        llmConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 4096,
        },
      )

      // Parse response
      const brief = this.parseResponse(response.content, context, briefId, response.runId)

      // Update brief record
      await this.updateBriefRecord(briefId, brief)

      return brief
    } catch (error) {
      logger.error('Brief generation failed', { error, request })
      await this.markBriefFailed(briefId, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  async *generateStream(
    request: BriefGenerationRequest,
  ): AsyncGenerator<StreamChunk & { briefId?: string }> {
    const {
      engagementId,
      dossierId,
      organizationId,
      userId,
      customPrompt,
      language = 'en',
    } = request

    // Gather context
    const context = await briefContextService.gatherContext({
      engagementId,
      dossierId,
      organizationId,
    })

    // Create brief record
    const briefId = await this.createBriefRecord(request, context)
    yield { type: 'content', content: '', briefId }

    // Build prompt
    const userPrompt = this.buildUserPrompt(context, customPrompt, language)
    const systemPrompt = language === 'ar' ? ARABIC_BRIEF_SYSTEM_PROMPT : BRIEF_SYSTEM_PROMPT

    // Configure LLM
    const llmConfig: LLMRouterConfig = {
      organizationId,
      userId,
      feature: 'brief_generation',
      dataClassification: 'internal',
    }

    let fullContent = ''

    try {
      for await (const chunk of llmRouter.streamChat(
        llmConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 4096,
        },
      )) {
        if (chunk.type === 'content' && chunk.content) {
          fullContent += chunk.content
          // Only yield content chunks - don't yield 'done' or 'error'
          // This allows the generator to complete naturally and run post-loop code
          yield chunk
        }
        // Skip yielding 'done' and 'error' - we'll handle them after saving
      }

      // Parse and save final brief
      logger.info('Stream completed, parsing response', {
        briefId,
        contentLength: fullContent.length,
      })
      const brief = this.parseResponse(fullContent, context, briefId, '')
      logger.info('Parsed brief, updating record', {
        briefId,
        briefStatus: brief.status,
        hasTitle: !!brief.title,
      })
      await this.updateBriefRecord(briefId, brief)
      logger.info('Brief record updated successfully', { briefId })

      // Now yield done to signal completion (after saving)
      yield { type: 'done' }
    } catch (error) {
      logger.error('Stream brief generation failed', { error, request })
      await this.markBriefFailed(briefId, error instanceof Error ? error.message : 'Unknown error')
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private buildUserPrompt(context: BriefContext, customPrompt?: string, language?: string): string {
    const parts: string[] = []

    if (customPrompt) {
      parts.push(`User Instructions: ${customPrompt}\n`)
    }

    if (context.engagement) {
      parts.push(`## Target Engagement
- Title: ${context.engagement.title_en || context.engagement.title_ar}
- Type: ${context.engagement.engagement_type}
- Date: ${context.engagement.start_date || 'TBD'}
- Location: ${context.engagement.location || 'TBD'}
`)
    }

    if (context.dossier) {
      parts.push(`## Primary Dossier
- Name: ${context.dossier.name_en || context.dossier.name_ar}
- Type: ${context.dossier.dossier_type}
- Overview: ${context.dossier.overview_en || context.dossier.overview_ar || 'N/A'}
`)
    }

    if (context.relatedDossiers.length > 0) {
      parts.push(`## Related Dossiers
${context.relatedDossiers.map((d) => `- [${d.id}] ${d.name_en || d.name_ar} (${d.dossier_type})`).join('\n')}
`)
    }

    if (context.positions.length > 0) {
      parts.push(`## Relevant Positions
${context.positions.map((p) => `- [${p.id}] ${p.title_en}: ${p.stance}`).join('\n')}
`)
    }

    if (context.commitments.length > 0) {
      parts.push(`## Active Commitments
${context.commitments.map((c) => `- [${c.id}] ${c.description_en} (${c.status}, deadline: ${c.deadline || 'N/A'})`).join('\n')}
`)
    }

    if (context.recentEngagements.length > 0) {
      parts.push(`## Recent Engagements
${context.recentEngagements.map((e) => `- [${e.id}] ${e.title_en} (${e.engagement_type}, ${e.start_date})`).join('\n')}
`)
    }

    parts.push(
      `\nGenerate a comprehensive brief ${language === 'ar' ? 'in Arabic' : 'in English'} based on the above context. Include citations using the IDs provided in brackets.`,
    )

    return parts.join('\n')
  }

  private parseResponse(
    content: string,
    context: BriefContext,
    briefId: string,
    runId: string,
  ): GeneratedBrief {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          id: briefId,
          title: parsed.title || 'Engagement Brief',
          executiveSummary: parsed.executiveSummary || '',
          background: parsed.background || '',
          keyParticipants: parsed.keyParticipants || [],
          relevantPositions: parsed.relevantPositions || [],
          activeCommitments: parsed.activeCommitments || [],
          historicalContext: parsed.historicalContext || '',
          talkingPoints: parsed.talkingPoints || [],
          recommendations: parsed.recommendations || '',
          citations: this.extractCitations(content, context),
          status: 'completed',
          runId,
        }
      }
    } catch (error) {
      logger.warn('Failed to parse JSON response, using fallback', { error })
    }

    // Fallback: use raw content
    return {
      id: briefId,
      title: context.engagement?.title_en || context.dossier?.name_en || 'Engagement Brief',
      executiveSummary: content,
      background: '',
      keyParticipants: [],
      relevantPositions: [],
      activeCommitments: [],
      historicalContext: '',
      talkingPoints: [],
      recommendations: '',
      citations: this.extractCitations(content, context),
      status: 'partial',
      runId,
    }
  }

  private extractCitations(content: string, context: BriefContext): GeneratedBrief['citations'] {
    const citations: GeneratedBrief['citations'] = []
    const idPattern = /\[([a-f0-9-]{36})\]/g
    const matches = content.matchAll(idPattern)

    for (const match of matches) {
      const id = match[1]!
      if (!id) continue

      // Check dossiers
      const dossier =
        context.relatedDossiers.find((d) => d.id === id) ||
        (context.dossier?.id === id ? context.dossier : null)
      if (dossier) {
        citations.push({
          type: 'dossier',
          id,
          title: String(dossier.name_en || dossier.name_ar || ''),
        })
        continue
      }

      // Check positions
      const position = context.positions.find((p) => p.id === id)
      if (position) {
        citations.push({
          type: 'position',
          id,
          title: String(position.title_en || position.title_ar || ''),
        })
        continue
      }

      // Check commitments
      const commitment = context.commitments.find((c) => c.id === id)
      if (commitment) {
        citations.push({
          type: 'commitment',
          id,
          title: String(commitment.description_en || commitment.description_ar || ''),
        })
        continue
      }

      // Check engagements
      const engagement =
        context.recentEngagements.find((e) => e.id === id) ||
        (context.engagement?.id === id ? context.engagement : null)
      if (engagement) {
        citations.push({
          type: 'engagement',
          id,
          title: String(engagement.title_en || engagement.title_ar || ''),
        })
      }
    }

    return citations
  }

  private async createBriefRecord(
    request: BriefGenerationRequest,
    context: BriefContext,
  ): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('ai_briefs')
      .insert({
        organization_id: request.organizationId,
        created_by: request.userId,
        engagement_id: request.engagementId,
        dossier_id: request.dossierId,
        custom_prompt: request.customPrompt,
        status: 'generating',
        title: context.engagement?.title_en || context.dossier?.name_en || 'Generating...',
        full_content: {},
      })
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to create brief record', { error })
      throw new Error('Failed to initialize brief')
    }

    return data.id
  }

  private async updateBriefRecord(briefId: string, brief: GeneratedBrief): Promise<void> {
    logger.info('Updating brief record', {
      briefId,
      status: brief.status,
      titleLength: brief.title?.length,
      summaryLength: brief.executiveSummary?.length,
    })

    const { error, data } = await supabaseAdmin
      .from('ai_briefs')
      .update({
        status: brief.status === 'completed' ? 'completed' : 'partial',
        title: brief.title,
        executive_summary: brief.executiveSummary,
        background: brief.background,
        key_participants: brief.keyParticipants,
        relevant_positions: brief.relevantPositions,
        active_commitments: brief.activeCommitments,
        historical_context: brief.historicalContext,
        talking_points: brief.talkingPoints,
        recommendations: brief.recommendations,
        citations: brief.citations,
        full_content: brief,
        completed_at: new Date().toISOString(),
      })
      .eq('id', briefId)
      .select()

    if (error) {
      logger.error('Failed to update brief record', { error, briefId })
    } else {
      logger.info('Brief record update result', { briefId, updated: !!data?.length })
    }
  }

  private async markBriefFailed(briefId: string, errorMessage: string): Promise<void> {
    await supabaseAdmin
      .from('ai_briefs')
      .update({
        status: 'failed',
        full_content: { error: errorMessage },
        completed_at: new Date().toISOString(),
      })
      .eq('id', briefId)
  }
}

export const briefGeneratorAgent = new BriefGeneratorAgent()
export default briefGeneratorAgent
