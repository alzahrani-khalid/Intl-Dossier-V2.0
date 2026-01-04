/**
 * Chat Assistant Agent
 * Feature: 033-ai-brief-generation
 * Task: T030
 *
 * AI agent for natural language chat interactions:
 * - Answers questions about dossiers, commitments, engagements
 * - Uses tools to search and retrieve information
 * - Provides citations for all responses
 * - Supports streaming responses
 */

import { llmRouter, LLMRouterConfig, StreamChunk } from '../llm-router.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { defineAgent, createAgentTools, AgentTool } from '../mastra-config.js'
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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCallId?: string
  toolName?: string
  toolResult?: unknown
}

export interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
  organizationId: string
  userId: string
  language?: 'en' | 'ar'
}

export interface ChatResponse {
  content: string
  toolCalls: Array<{
    name: string
    input: Record<string, unknown>
    result: unknown
  }>
  citations: Array<{
    type: string
    id: string
    title: string
    snippet?: string
  }>
  runId: string
}

const CHAT_SYSTEM_PROMPT = `You are an intelligent assistant for a diplomatic dossier management system. Your role is to help users find information about:
- Dossiers (countries, organizations, persons, topics, forums)
- Positions and stances on various issues
- Commitments and their status
- Engagements and meetings
- Relationships between entities

When answering questions:
1. Use the available tools to search and retrieve accurate information
2. Always cite your sources using the entity IDs provided
3. Be concise but thorough
4. If you don't have enough information, say so and suggest what additional context might help
5. Format responses clearly with bullet points or numbered lists when appropriate

Available tools:
- search_entities: Search across all entity types
- get_dossier: Get detailed information about a specific dossier
- query_commitments: Find commitments with optional filters
- get_engagement_history: Get past engagements

Always use tools to verify information before answering. Do not make up information.`

const ARABIC_CHAT_SYSTEM_PROMPT = `أنت مساعد ذكي لنظام إدارة الملفات الدبلوماسية. دورك هو مساعدة المستخدمين في العثور على معلومات حول:
- الملفات (الدول، المنظمات، الأشخاص، المواضيع، المنتديات)
- المواقف والاتجاهات حول القضايا المختلفة
- الالتزامات وحالتها
- الاجتماعات واللقاءات
- العلاقات بين الكيانات

عند الإجابة على الأسئلة:
1. استخدم الأدوات المتاحة للبحث واسترجاع معلومات دقيقة
2. استشهد دائماً بمصادرك باستخدام معرفات الكيانات
3. كن موجزاً ولكن شاملاً
4. إذا لم يكن لديك معلومات كافية، قل ذلك واقترح ما قد يساعد
5. نسق الردود بوضوح مع نقاط أو قوائم مرقمة عند الاقتضاء

استخدم الأدوات دائماً للتحقق من المعلومات قبل الإجابة. لا تختلق معلومات.`

// Tool implementations
async function searchEntities(
  input: { query: string; entityTypes?: string[]; limit?: number },
  _organizationId: string,
): Promise<{ results: Array<{ id: string; type: string; title: string; snippet: string }> }> {
  try {
    const response = await getSemanticSearchService().search({
      query: input.query,
      entityTypes: input.entityTypes,
      limit: input.limit || 10,
    })

    return {
      results: response.results.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title_en || r.title_ar,
        snippet: (r.description_en || r.description_ar || '').substring(0, 200) + '...',
      })),
    }
  } catch (error) {
    logger.error('Search entities failed', { error, input })
    return { results: [] }
  }
}

async function getDossier(
  input: { dossierId: string },
  organizationId: string,
): Promise<{ dossier: Record<string, unknown> | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('dossiers')
      .select(
        `
        id, name_en, name_ar, dossier_type, 
        overview_en, overview_ar, background_en, background_ar,
        created_at, updated_at,
        positions:dossier_positions(id, title_en, title_ar, stance, created_at)
      `,
      )
      .eq('id', input.dossierId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !data) {
      return { dossier: null }
    }

    return { dossier: data }
  } catch (error) {
    logger.error('Get dossier failed', { error, input })
    return { dossier: null }
  }
}

async function queryCommitments(
  input: {
    dossierId?: string
    engagementId?: string
    status?: string
    limit?: number
  },
  organizationId: string,
): Promise<{ commitments: Array<Record<string, unknown>> }> {
  try {
    let query = supabaseAdmin
      .from('commitments')
      .select(
        `
        id, description_en, description_ar, status, priority,
        deadline, owner_name, created_at,
        dossier:dossiers(id, name_en, name_ar)
      `,
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(input.limit || 10)

    if (input.dossierId) {
      query = query.eq('dossier_id', input.dossierId)
    }
    if (input.engagementId) {
      query = query.eq('engagement_id', input.engagementId)
    }
    if (input.status) {
      query = query.eq('status', input.status)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Query commitments failed', { error, input })
      return { commitments: [] }
    }

    return { commitments: data || [] }
  } catch (error) {
    logger.error('Query commitments failed', { error, input })
    return { commitments: [] }
  }
}

async function getEngagementHistory(
  input: {
    dossierId?: string
    limit?: number
    startDate?: string
    endDate?: string
  },
  organizationId: string,
): Promise<{ engagements: Array<Record<string, unknown>> }> {
  try {
    let query = supabaseAdmin
      .from('engagements')
      .select(
        `
        id, name_en, name_ar, engagement_type, 
        start_date, end_date, location_en, location_ar,
        description_en, description_ar, created_at
      `,
      )
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false })
      .limit(input.limit || 10)

    if (input.dossierId) {
      query = query.contains('dossier_ids', [input.dossierId])
    }
    if (input.startDate) {
      query = query.gte('start_date', input.startDate)
    }
    if (input.endDate) {
      query = query.lte('start_date', input.endDate)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Get engagement history failed', { error, input })
      return { engagements: [] }
    }

    return { engagements: data || [] }
  } catch (error) {
    logger.error('Get engagement history failed', { error, input })
    return { engagements: [] }
  }
}

export class ChatAssistantAgent {
  private tools: AgentTool[]

  constructor() {
    this.tools = createAgentTools([
      {
        name: 'search_entities',
        description: 'Search for entities (dossiers, positions, commitments, engagements) by query',
        parameters: {
          query: { type: 'string', description: 'Search query', required: true },
          entityTypes: {
            type: 'array',
            description: 'Filter by entity types (dossier, position, commitment, engagement)',
          },
          limit: { type: 'number', description: 'Max results', default: 10 },
        },
        execute: async (input) =>
          searchEntities(input as { query: string; entityTypes?: string[]; limit?: number }, ''),
      },
      {
        name: 'get_dossier',
        description: 'Get detailed information about a specific dossier including its positions',
        parameters: {
          dossierId: { type: 'string', description: 'Dossier ID', required: true },
        },
        execute: async (input) => getDossier(input as { dossierId: string }, ''),
      },
      {
        name: 'query_commitments',
        description: 'Query commitments with optional filters',
        parameters: {
          dossierId: { type: 'string', description: 'Filter by dossier ID' },
          engagementId: { type: 'string', description: 'Filter by engagement ID' },
          status: {
            type: 'string',
            description: 'Filter by status (pending, in_progress, completed, overdue)',
          },
          limit: { type: 'number', description: 'Max results', default: 10 },
        },
        execute: async (input) =>
          queryCommitments(
            input as { dossierId?: string; engagementId?: string; status?: string; limit?: number },
            '',
          ),
      },
      {
        name: 'get_engagement_history',
        description: 'Get past engagements, optionally filtered by dossier or date range',
        parameters: {
          dossierId: { type: 'string', description: 'Filter by dossier ID' },
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
          limit: { type: 'number', description: 'Max results', default: 10 },
        },
        execute: async (input) =>
          getEngagementHistory(
            input as { dossierId?: string; limit?: number; startDate?: string; endDate?: string },
            '',
          ),
      },
    ])

    // Register agent with Mastra
    defineAgent({
      name: 'chat-assistant',
      description:
        'AI assistant for answering questions about dossiers, commitments, and engagements',
      systemPrompt: CHAT_SYSTEM_PROMPT,
      tools: this.tools,
      temperature: 0.7,
      maxTokens: 2048,
    })
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationHistory = [], organizationId, userId, language = 'en' } = request

    const systemPrompt = language === 'ar' ? ARABIC_CHAT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
        .filter((m) => m.role !== 'tool')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user', content: message },
    ]

    const llmConfig: LLMRouterConfig = {
      organizationId,
      userId,
      feature: 'chat',
      dataClassification: 'internal',
    }

    const toolCalls: ChatResponse['toolCalls'] = []
    const citations: ChatResponse['citations'] = []

    try {
      // First, check if we need to use tools
      const toolDecision = await this.decideToolUsage(message, organizationId)

      if (toolDecision.shouldUseTool) {
        // Execute the tool
        const toolResult = await this.executeTool(
          toolDecision.toolName!,
          toolDecision.toolInput!,
          organizationId,
        )

        toolCalls.push({
          name: toolDecision.toolName!,
          input: toolDecision.toolInput!,
          result: toolResult,
        })

        // Add tool results to context
        messages.push({
          role: 'assistant',
          content: `I used the ${toolDecision.toolName} tool and got the following results:\n${JSON.stringify(toolResult, null, 2)}`,
        })

        // Extract citations from tool results
        this.extractCitations(toolResult, citations)
      }

      // Generate response
      const response = await llmRouter.chat(llmConfig, messages, {
        temperature: 0.7,
        maxTokens: 2048,
      })

      // Extract any additional citations from the response
      this.extractCitationsFromText(response.content, citations)

      return {
        content: response.content,
        toolCalls,
        citations,
        runId: response.runId,
      }
    } catch (error) {
      logger.error('Chat failed', { error, request })
      throw error
    }
  }

  async *chatStream(
    request: ChatRequest,
  ): AsyncGenerator<
    StreamChunk & { toolCall?: { name: string; input: Record<string, unknown>; result?: unknown } }
  > {
    const { message, conversationHistory = [], organizationId, userId, language = 'en' } = request

    const systemPrompt = language === 'ar' ? ARABIC_CHAT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
        .filter((m) => m.role !== 'tool')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user', content: message },
    ]

    const llmConfig: LLMRouterConfig = {
      organizationId,
      userId,
      feature: 'chat',
      dataClassification: 'internal',
    }

    try {
      // Check if we need to use tools
      const toolDecision = await this.decideToolUsage(message, organizationId)

      if (toolDecision.shouldUseTool) {
        // Signal tool call start
        yield {
          type: 'tool_call',
          toolName: toolDecision.toolName,
          toolInput: toolDecision.toolInput,
        }

        // Execute the tool
        const toolResult = await this.executeTool(
          toolDecision.toolName!,
          toolDecision.toolInput!,
          organizationId,
        )

        // Signal tool result
        yield {
          type: 'tool_call',
          toolName: toolDecision.toolName,
          toolResult,
        }

        // Add tool results to context
        messages.push({
          role: 'assistant',
          content: `Tool result from ${toolDecision.toolName}:\n${JSON.stringify(toolResult, null, 2)}`,
        })
      }

      // Stream the response
      for await (const chunk of llmRouter.streamChat(llmConfig, messages, {
        temperature: 0.7,
        maxTokens: 2048,
      })) {
        yield chunk
      }
    } catch (error) {
      logger.error('Chat stream failed', { error, request })
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async decideToolUsage(
    message: string,
    _organizationId: string,
  ): Promise<{ shouldUseTool: boolean; toolName?: string; toolInput?: Record<string, unknown> }> {
    const lowerMessage = message.toLowerCase()

    // Simple heuristics for tool selection
    // In production, this could use another LLM call for better routing

    // Search patterns
    if (
      lowerMessage.includes('find') ||
      lowerMessage.includes('search') ||
      lowerMessage.includes('look for') ||
      lowerMessage.includes('what do we know about') ||
      lowerMessage.includes('information about') ||
      lowerMessage.includes('أبحث') ||
      lowerMessage.includes('ابحث') ||
      lowerMessage.includes('ما نعرفه عن')
    ) {
      const searchQuery = message.replace(
        /^(find|search|look for|what do we know about|information about|أبحث عن|ابحث عن|ما نعرفه عن)\s*/i,
        '',
      )
      return {
        shouldUseTool: true,
        toolName: 'search_entities',
        toolInput: { query: searchQuery, limit: 10 },
      }
    }

    // Commitment patterns
    if (
      lowerMessage.includes('commitment') ||
      lowerMessage.includes('commitments') ||
      lowerMessage.includes('التزام') ||
      lowerMessage.includes('التزامات')
    ) {
      const filters: Record<string, unknown> = { limit: 10 }

      if (
        lowerMessage.includes('active') ||
        lowerMessage.includes('pending') ||
        lowerMessage.includes('نشط')
      ) {
        filters.status = 'pending'
      } else if (
        lowerMessage.includes('completed') ||
        lowerMessage.includes('done') ||
        lowerMessage.includes('مكتمل')
      ) {
        filters.status = 'completed'
      } else if (lowerMessage.includes('overdue') || lowerMessage.includes('متأخر')) {
        filters.status = 'overdue'
      }

      return {
        shouldUseTool: true,
        toolName: 'query_commitments',
        toolInput: filters,
      }
    }

    // Engagement patterns
    if (
      lowerMessage.includes('engagement') ||
      lowerMessage.includes('meeting') ||
      lowerMessage.includes('engagements') ||
      lowerMessage.includes('اجتماع') ||
      lowerMessage.includes('اجتماعات') ||
      lowerMessage.includes('لقاء')
    ) {
      return {
        shouldUseTool: true,
        toolName: 'get_engagement_history',
        toolInput: { limit: 10 },
      }
    }

    // Dossier patterns - extract ID if present
    const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
    const uuidMatch = message.match(uuidPattern)
    if (uuidMatch && (lowerMessage.includes('dossier') || lowerMessage.includes('ملف'))) {
      return {
        shouldUseTool: true,
        toolName: 'get_dossier',
        toolInput: { dossierId: uuidMatch[0] },
      }
    }

    // Country/organization name patterns - search
    const countryPatterns = [
      'japan',
      'china',
      'usa',
      'saudi',
      'uae',
      'uk',
      'france',
      'germany',
      'اليابان',
      'الصين',
      'السعودية',
      'الإمارات',
      'فرنسا',
      'ألمانيا',
    ]
    for (const pattern of countryPatterns) {
      if (lowerMessage.includes(pattern)) {
        return {
          shouldUseTool: true,
          toolName: 'search_entities',
          toolInput: { query: pattern, entityTypes: ['dossier'], limit: 5 },
        }
      }
    }

    // Default: no tool needed for general conversation
    return { shouldUseTool: false }
  }

  private async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    organizationId: string,
  ): Promise<unknown> {
    switch (toolName) {
      case 'search_entities':
        return searchEntities(
          input as { query: string; entityTypes?: string[]; limit?: number },
          organizationId,
        )
      case 'get_dossier':
        return getDossier(input as { dossierId: string }, organizationId)
      case 'query_commitments':
        return queryCommitments(
          input as { dossierId?: string; engagementId?: string; status?: string; limit?: number },
          organizationId,
        )
      case 'get_engagement_history':
        return getEngagementHistory(
          input as { dossierId?: string; limit?: number; startDate?: string; endDate?: string },
          organizationId,
        )
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  private extractCitations(toolResult: unknown, citations: ChatResponse['citations']): void {
    if (!toolResult || typeof toolResult !== 'object') return

    const result = toolResult as Record<string, unknown>

    // Extract from search results
    if (Array.isArray(result.results)) {
      for (const item of result.results) {
        if (item && typeof item === 'object' && 'id' in item) {
          citations.push({
            type: ((item as Record<string, unknown>).type as string) || 'entity',
            id: (item as Record<string, unknown>).id as string,
            title: ((item as Record<string, unknown>).title as string) || 'Unknown',
            snippet: (item as Record<string, unknown>).snippet as string,
          })
        }
      }
    }

    // Extract from dossier
    if (result.dossier && typeof result.dossier === 'object') {
      const dossier = result.dossier as Record<string, unknown>
      citations.push({
        type: 'dossier',
        id: dossier.id as string,
        title: (dossier.name_en || dossier.name_ar) as string,
      })
    }

    // Extract from commitments
    if (Array.isArray(result.commitments)) {
      for (const item of result.commitments) {
        if (item && typeof item === 'object' && 'id' in item) {
          citations.push({
            type: 'commitment',
            id: (item as Record<string, unknown>).id as string,
            title:
              (((item as Record<string, unknown>).description_en ||
                (item as Record<string, unknown>).description_ar) as string) || 'Commitment',
          })
        }
      }
    }

    // Extract from engagements
    if (Array.isArray(result.engagements)) {
      for (const item of result.engagements) {
        if (item && typeof item === 'object' && 'id' in item) {
          citations.push({
            type: 'engagement',
            id: (item as Record<string, unknown>).id as string,
            title:
              (((item as Record<string, unknown>).name_en ||
                (item as Record<string, unknown>).name_ar) as string) || 'Engagement',
          })
        }
      }
    }
  }

  private extractCitationsFromText(text: string, citations: ChatResponse['citations']): void {
    // Extract UUIDs from response text that might be references
    const uuidPattern = /\[([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\]/gi
    const matches = text.matchAll(uuidPattern)

    for (const match of matches) {
      const id = match[1]
      if (id && !citations.some((c) => c.id === id)) {
        citations.push({
          type: 'reference',
          id,
          title: 'Referenced Entity',
        })
      }
    }
  }
}

export const chatAssistantAgent = new ChatAssistantAgent()
export default chatAssistantAgent
