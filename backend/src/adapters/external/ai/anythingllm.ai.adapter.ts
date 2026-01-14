/**
 * AnythingLLM AI Service Adapter
 *
 * Anti-Corruption Layer (ACL) adapter that implements IAIService
 * using AnythingLLM as the underlying AI provider.
 *
 * This adapter translates domain AI requests to AnythingLLM-specific
 * API calls and transforms responses back to domain models.
 *
 * @module adapters/external/ai/anythingllm.ai.adapter
 */

import axios, { AxiosInstance } from 'axios'
import type {
  IAIService,
  TextGenerationRequest,
  TextGenerationResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  DocumentExtractionRequest,
  DocumentExtractionResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  SimilaritySearchRequest,
  SimilaritySearchResult,
  ExtractedEntity,
  ChatMessage,
} from '../../../core/ports/services'

/**
 * AnythingLLM adapter configuration
 */
export interface AnythingLLMAdapterConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
  defaultModel?: string
  embeddingModel?: string
  maxRetries?: number
  healthCheckInterval?: number
}

/**
 * AnythingLLM API response types (external model)
 */
interface ALLMChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface ALLMEmbeddingResponse {
  object: string
  data: Array<{
    object: string
    index: number
    embedding: number[]
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

interface ALLMSearchResponse {
  success: boolean
  results: Array<{
    id: string
    content: string
    metadata: Record<string, unknown>
    score: number
  }>
  total: number
}

/**
 * Fallback service for when AnythingLLM is unavailable
 */
class BasicFallbackService {
  private embeddings: Map<string, number[]> = new Map()

  async generateEmbedding(text: string): Promise<number[]> {
    const hash = this.simpleHash(text)
    const embedding = this.hashToVector(hash, 1536)
    this.embeddings.set(text, embedding)
    return embedding
  }

  async generateText(_prompt: string): Promise<string> {
    const responses: string[] = [
      "I'm currently unable to process your request. Please try again later.",
      'The AI service is temporarily unavailable.',
      "I'm experiencing technical difficulties. Please try again shortly.",
    ]
    const index = Math.floor(Math.random() * responses.length)
    return (responses[index] ?? responses[0]) as string
  }

  async searchSimilar(query: string, limit = 5): Promise<SimilaritySearchResult[]> {
    const results: SimilaritySearchResult[] = []
    for (const [text, _embedding] of this.embeddings.entries()) {
      const similarity = this.calculateSimilarity(query, text)
      if (similarity > 0.3) {
        results.push({
          id: `fallback-${results.length}`,
          content: text,
          score: similarity,
          metadata: {},
        })
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private hashToVector(hash: number, dimensions: number): number[] {
    const vector: number[] = []
    let currentHash = hash
    for (let i = 0; i < dimensions; i++) {
      currentHash = (currentHash * 1103515245 + 12345) % 2147483647
      vector.push((currentHash / 2147483647) * 2 - 1)
    }
    return vector
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    const intersection = new Set([...words1].filter((x) => words2.has(x)))
    const union = new Set([...words1, ...words2])
    return intersection.size / union.size
  }
}

/**
 * AnythingLLM AI Service Adapter
 *
 * Implements IAIService using AnythingLLM for AI operations.
 * Acts as an Anti-Corruption Layer protecting the domain from AnythingLLM API changes.
 */
export class AnythingLLMAIAdapter implements IAIService {
  private readonly config: AnythingLLMAdapterConfig
  private readonly client: AxiosInstance
  private readonly fallbackService: BasicFallbackService
  private isHealthy = true
  private lastHealthCheck = 0

  constructor(config: AnythingLLMAdapterConfig) {
    this.config = config
    this.fallbackService = new BasicFallbackService()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 30000,
      headers,
    })

    this.setupInterceptors()
    this.startHealthCheck()
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.isHealthy = false
        return Promise.reject(error)
      },
    )
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    const interval = this.config.healthCheckInterval ?? 60000
    const checkHealth = async () => {
      try {
        await this.client.get('/health')
        this.isHealthy = true
      } catch {
        this.isHealthy = false
      }
      this.lastHealthCheck = Date.now()
    }

    checkHealth()
    setInterval(checkHealth, interval)
  }

  /**
   * Ensure the service is healthy
   */
  private async ensureHealthy(): Promise<boolean> {
    const now = Date.now()
    const interval = this.config.healthCheckInterval ?? 60000
    if (now - this.lastHealthCheck > interval) {
      try {
        await this.client.get('/health')
        this.isHealthy = true
      } catch {
        this.isHealthy = false
      }
      this.lastHealthCheck = now
    }
    return this.isHealthy
  }

  /**
   * Transform domain TextGenerationRequest to AnythingLLM format
   */
  private transformToALLMChatRequest(request: TextGenerationRequest): unknown {
    return {
      model: this.config.defaultModel ?? 'gpt-3.5-turbo',
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1000,
      top_p: request.topP,
      stop: request.stopSequences,
    }
  }

  /**
   * Transform AnythingLLM response to domain TextGenerationResponse
   */
  private transformFromALLMChatResponse(response: ALLMChatResponse): TextGenerationResponse {
    const choice = response.choices[0]
    return {
      text: choice?.message?.content ?? '',
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason: this.mapFinishReason(choice?.finish_reason),
      model: response.model,
    }
  }

  /**
   * Map AnythingLLM finish reason to domain model
   */
  private mapFinishReason(reason?: string): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      default:
        return 'stop'
    }
  }

  /**
   * Generate text completion
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const healthy = await this.ensureHealthy()
      if (!healthy) {
        const fallbackText = await this.fallbackService.generateText(request.prompt)
        return {
          text: fallbackText,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop',
          model: 'fallback',
        }
      }

      const allRequest = this.transformToALLMChatRequest(request)
      const response = await this.client.post<ALLMChatResponse>('/v1/chat/completions', allRequest)
      return this.transformFromALLMChatResponse(response.data)
    } catch (error) {
      const fallbackText = await this.fallbackService.generateText(request.prompt)
      return {
        text: fallbackText,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'error',
        model: 'fallback',
      }
    }
  }

  /**
   * Generate embeddings
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const healthy = await this.ensureHealthy()
      const texts = Array.isArray(request.text) ? request.text : [request.text]

      if (!healthy) {
        const embeddings = await Promise.all(
          texts.map((t) => this.fallbackService.generateEmbedding(t)),
        )
        return {
          embeddings,
          model: 'fallback',
          dimensions: 1536,
        }
      }

      const response = await this.client.post<ALLMEmbeddingResponse>('/v1/embeddings', {
        input: request.text,
        model: request.model ?? this.config.embeddingModel ?? 'text-embedding-ada-002',
      })

      return {
        embeddings: response.data.data.map((d) => d.embedding),
        model: response.data.model,
        dimensions: response.data.data[0]?.embedding.length ?? 1536,
      }
    } catch {
      const texts = Array.isArray(request.text) ? request.text : [request.text]
      const embeddings = await Promise.all(
        texts.map((t) => this.fallbackService.generateEmbedding(t)),
      )
      return {
        embeddings,
        model: 'fallback',
        dimensions: 1536,
      }
    }
  }

  /**
   * Extract entities from document
   */
  async extractFromDocument(
    request: DocumentExtractionRequest,
  ): Promise<DocumentExtractionResponse> {
    const prompt = `Extract entities from the following ${request.language === 'ar' ? 'Arabic' : 'English'} ${request.contentType} content. Return entities as JSON array with type, value, and confidence.

Content:
${request.content}

${request.extractionSchema ? `Schema: ${JSON.stringify(request.extractionSchema)}` : ''}`

    try {
      const response = await this.generateText({
        prompt,
        systemPrompt:
          'You are an entity extraction assistant. Extract named entities and return them in JSON format.',
        temperature: 0.3,
        maxTokens: 2000,
      })

      // Parse entities from response
      let entities: ExtractedEntity[] = []
      try {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          entities = JSON.parse(jsonMatch[0])
        }
      } catch {
        // If parsing fails, return empty entities
      }

      return {
        entities,
        summary: response.text.substring(0, 500),
        keywords: [],
      }
    } catch {
      return {
        entities: [],
        summary: '',
        keywords: [],
      }
    }
  }

  /**
   * Chat completion
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const healthy = await this.ensureHealthy()
      if (!healthy) {
        const fallbackText = await this.fallbackService.generateText(
          request.messages.map((m) => m.content).join('\n'),
        )
        return {
          message: { role: 'assistant', content: fallbackText },
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop',
        }
      }

      const response = await this.client.post<ALLMChatResponse>('/v1/chat/completions', {
        model: this.config.defaultModel ?? 'gpt-3.5-turbo',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
      })

      const choice = response.data.choices[0]
      if (!choice) {
        throw new Error('No choice returned from AI service')
      }
      return {
        message: {
          role: choice.message.role as ChatMessage['role'],
          content: choice.message.content,
        },
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
        finishReason: this.mapChatFinishReason(choice.finish_reason),
      }
    } catch {
      const fallbackText = await this.fallbackService.generateText(
        request.messages.map((m) => m.content).join('\n'),
      )
      return {
        message: { role: 'assistant', content: fallbackText },
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      }
    }
  }

  /**
   * Map chat finish reason
   */
  private mapChatFinishReason(reason: string): 'stop' | 'tool_calls' | 'length' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'function_call':
      case 'tool_calls':
        return 'tool_calls'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      default:
        return 'stop'
    }
  }

  /**
   * Similarity search
   */
  async similaritySearch(request: SimilaritySearchRequest): Promise<SimilaritySearchResult[]> {
    try {
      const healthy = await this.ensureHealthy()
      if (!healthy) {
        return this.fallbackService.searchSimilar(request.query, request.limit ?? 5)
      }

      const response = await this.client.post<ALLMSearchResponse>('/api/search', {
        query: request.query,
        collectionId: request.collection,
        limit: request.limit ?? 5,
        threshold: request.threshold ?? 0.7,
        includeMetadata: true,
      })

      return response.data.results.map((r) => ({
        id: r.id,
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      }))
    } catch {
      return this.fallbackService.searchSimilar(request.query, request.limit ?? 5)
    }
  }

  /**
   * Summarize text
   */
  async summarize(text: string, maxLength?: number, language?: 'ar' | 'en'): Promise<string> {
    const prompt =
      language === 'ar'
        ? `لخص النص التالي في ${maxLength ?? 200} كلمة كحد أقصى:\n\n${text}`
        : `Summarize the following text in ${maxLength ?? 200} words or less:\n\n${text}`

    const response = await this.generateText({
      prompt,
      systemPrompt: 'You are a text summarization assistant.',
      temperature: 0.5,
      maxTokens: maxLength ? maxLength * 2 : 500,
    })

    return response.text
  }

  /**
   * Translate text
   */
  async translate(text: string, targetLanguage: 'ar' | 'en'): Promise<string> {
    const prompt =
      targetLanguage === 'ar'
        ? `Translate the following text to Arabic:\n\n${text}`
        : `Translate the following text to English:\n\n${text}`

    const response = await this.generateText({
      prompt,
      systemPrompt: 'You are a translation assistant. Provide accurate translations.',
      temperature: 0.3,
      maxTokens: text.length * 2,
    })

    return response.text
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    return this.ensureHealthy()
  }

  /**
   * Get model info
   */
  async getModelInfo(): Promise<{
    name: string
    version: string
    maxContextLength: number
    capabilities: string[]
  }> {
    return {
      name: this.config.defaultModel ?? 'AnythingLLM',
      version: '1.0.0',
      maxContextLength: 4096,
      capabilities: [
        'text_generation',
        'embeddings',
        'entity_extraction',
        'chat',
        'similarity_search',
        'summarization',
        'translation',
      ],
    }
  }
}

/**
 * Factory function to create AnythingLLMAIAdapter
 */
export function createAnythingLLMAIAdapter(config: AnythingLLMAdapterConfig): AnythingLLMAIAdapter {
  return new AnythingLLMAIAdapter(config)
}

/**
 * AI Service token for dependency injection
 */
export const AI_SERVICE_TOKEN = Symbol('IAIService')
