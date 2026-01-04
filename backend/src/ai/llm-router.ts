import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { redis } from '../config/redis.js'
import {
  aiConfig,
  AIProvider,
  DataClassification,
  getProviderConfig,
  getPrivateProvider,
} from './config.js'
import logger from '../utils/logger.js'
import AnythingLLMService from '../services/anythingllm.service.js'

// Request deduplication: Track in-flight requests
const inFlightRequests = new Map<string, Promise<LLMResponse>>()
const DEDUP_CACHE_TTL = 300 // 5 minutes for response caching
const DEDUP_CACHE_PREFIX = 'ai:dedup:'

// Provider health tracking for fallback (T061)
const providerHealth = new Map<
  AIProvider,
  { healthy: boolean; lastCheck: number; failCount: number }
>()
const HEALTH_CHECK_INTERVAL = 60000 // 1 minute
const HEALTH_FAILURE_THRESHOLD = 3

// Retry configuration (T062)
const MAX_RETRIES = 3
const BASE_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 30000 // 30 seconds

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) return true
    // Temporary server errors
    if (message.includes('502') || message.includes('503') || message.includes('504')) return true
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) return true
    // Connection errors
    if (message.includes('econnreset') || message.includes('econnrefused')) return true
  }
  return false
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
function getRetryDelay(attempt: number): number {
  const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, attempt)
  const jitter = Math.random() * 1000 // Add up to 1 second of jitter
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY)
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface LLMRouterConfig {
  organizationId: string
  userId: string
  feature: 'brief_generation' | 'chat' | 'entity_linking' | 'semantic_search' | 'embeddings'
  dataClassification?: DataClassification
  preferredProvider?: AIProvider
  systemPrompt?: string
}

export interface LLMResponse {
  content: string
  inputTokens: number
  outputTokens: number
  provider: AIProvider
  model: string
  runId: string
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error'
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolResult?: unknown
  error?: string
}

interface OrgLLMPolicy {
  default_provider: AIProvider
  default_model: string
  arabic_provider: AIProvider | null
  arabic_model: string | null
  allow_cloud_for_confidential: boolean
  private_provider: AIProvider | null
  private_model: string | null
  private_endpoint_url: string | null
  monthly_spend_cap_usd: number | null
  brief_generation_enabled: boolean
  chat_enabled: boolean
  entity_linking_enabled: boolean
}

const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F]/g

export function detectArabicContent(text: string): number {
  if (!text || text.length === 0) return 0
  const arabicChars = (text.match(ARABIC_PATTERN) || []).length
  return arabicChars / text.length
}

export function isArabicDominant(text: string, threshold = 0.3): boolean {
  return detectArabicContent(text) >= threshold
}

/**
 * Generate a hash key for request deduplication
 */
function generateRequestHash(
  feature: string,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number },
): string {
  const payload = JSON.stringify({
    feature,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    options: {
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 4096,
    },
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}

export class LLMRouter {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private anythingllm: AnythingLLMService | null = null

  constructor() {
    if (aiConfig.providers.openai.enabled && aiConfig.providers.openai.apiKey) {
      this.openai = new OpenAI({ apiKey: aiConfig.providers.openai.apiKey })
      providerHealth.set('openai', { healthy: true, lastCheck: Date.now(), failCount: 0 })
    }
    if (aiConfig.providers.anthropic.enabled && aiConfig.providers.anthropic.apiKey) {
      this.anthropic = new Anthropic({ apiKey: aiConfig.providers.anthropic.apiKey })
      providerHealth.set('anthropic', { healthy: true, lastCheck: Date.now(), failCount: 0 })
    }
    if (aiConfig.providers.anythingllm.enabled) {
      this.anythingllm = new AnythingLLMService(
        aiConfig.providers.anythingllm.baseUrl,
        aiConfig.providers.anythingllm.apiKey,
      )
      providerHealth.set('anythingllm', { healthy: true, lastCheck: Date.now(), failCount: 0 })
      logger.info('AnythingLLM provider initialized', {
        baseUrl: aiConfig.providers.anythingllm.baseUrl,
      })
    }
  }

  /**
   * Check if a provider is healthy (T061)
   */
  isProviderHealthy(provider: AIProvider): boolean {
    const health = providerHealth.get(provider)
    if (!health) return false

    // If health check is stale, assume healthy
    if (Date.now() - health.lastCheck > HEALTH_CHECK_INTERVAL) {
      health.healthy = true
      health.failCount = 0
    }

    return health.healthy
  }

  /**
   * Record a provider failure (T061)
   */
  recordProviderFailure(provider: AIProvider): void {
    const health = providerHealth.get(provider)
    if (!health) return

    health.failCount++
    health.lastCheck = Date.now()

    if (health.failCount >= HEALTH_FAILURE_THRESHOLD) {
      health.healthy = false
      logger.warn('Provider marked as unhealthy', { provider, failCount: health.failCount })
    }
  }

  /**
   * Record a provider success (T061)
   */
  recordProviderSuccess(provider: AIProvider): void {
    const health = providerHealth.get(provider)
    if (!health) return

    health.healthy = true
    health.failCount = 0
    health.lastCheck = Date.now()
  }

  /**
   * Get fallback provider (T061)
   */
  async getFallbackProvider(
    config: LLMRouterConfig,
    excludeProvider: AIProvider,
  ): Promise<{ provider: AIProvider; model: string } | null> {
    const policy = await this.getOrgPolicy(config.organizationId)

    // Check if fallback is configured in policy
    if (policy?.private_provider && policy.private_provider !== excludeProvider) {
      return {
        provider: policy.private_provider,
        model:
          policy.private_model || aiConfig.providers[policy.private_provider]?.defaultModel || '',
      }
    }

    // Try other available providers
    const providers: AIProvider[] = ['anthropic', 'openai', 'google']
    for (const provider of providers) {
      if (provider !== excludeProvider && this.isProviderHealthy(provider)) {
        const providerConfig = getProviderConfig(provider)
        if (providerConfig) {
          return { provider, model: providerConfig.defaultModel }
        }
      }
    }

    return null
  }

  async getOrgPolicy(organizationId: string): Promise<OrgLLMPolicy | null> {
    const { data, error } = await supabaseAdmin.rpc('get_org_llm_policy', {
      p_org_id: organizationId,
    })

    if (error) {
      logger.warn('Failed to get org LLM policy, using defaults', { error, organizationId })
      return null
    }

    return data?.[0] || null
  }

  async checkSpendCap(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data, error } = await supabaseAdmin.rpc('check_ai_spend_cap', {
      p_org_id: organizationId,
    })

    if (error) {
      logger.error('Failed to check spend cap', { error, organizationId })
      return { allowed: true }
    }

    const result = data?.[0]
    if (!result) return { allowed: true }

    if (result.cap_reached) {
      return {
        allowed: false,
        reason: `Monthly spend cap of $${result.monthly_cap} reached. Current spend: $${result.current_spend}`,
      }
    }

    if (result.alert_threshold_reached) {
      logger.warn('AI spend alert threshold reached', {
        organizationId,
        currentSpend: result.current_spend,
        cap: result.monthly_cap,
      })
    }

    return { allowed: true }
  }

  async selectProvider(
    config: LLMRouterConfig,
    inputText: string,
  ): Promise<{ provider: AIProvider; model: string; endpoint?: string }> {
    const policy = await this.getOrgPolicy(config.organizationId)
    const classification = config.dataClassification || 'internal'

    if (classification === 'secret') {
      const privateProvider = getPrivateProvider()
      if (!privateProvider) {
        throw new Error('Secret data requires private LLM but none configured')
      }
      return {
        provider: privateProvider.provider,
        model: privateProvider.defaultModel,
        endpoint: privateProvider.baseUrl,
      }
    }

    if (classification === 'confidential') {
      const allowCloud = policy?.allow_cloud_for_confidential ?? false
      if (!allowCloud) {
        const privateProvider = getPrivateProvider()
        if (!privateProvider) {
          throw new Error('Confidential data routing requires private LLM but none configured')
        }
        return {
          provider: privateProvider.provider,
          model: privateProvider.defaultModel,
          endpoint: privateProvider.baseUrl,
        }
      }
    }

    if (isArabicDominant(inputText) && policy?.arabic_provider && policy?.arabic_model) {
      return {
        provider: policy.arabic_provider,
        model: policy.arabic_model,
      }
    }

    if (config.preferredProvider) {
      const providerConfig = getProviderConfig(config.preferredProvider)
      if (providerConfig) {
        return {
          provider: providerConfig.provider,
          model: providerConfig.defaultModel,
        }
      }
    }

    const defaultProvider = policy?.default_provider || aiConfig.routing.defaultProvider
    const defaultModel = policy?.default_model || aiConfig.providers[defaultProvider].defaultModel

    return {
      provider: defaultProvider,
      model: defaultModel,
    }
  }

  async startRun(config: LLMRouterConfig, provider: AIProvider, model: string): Promise<string> {
    const { data, error } = await supabaseAdmin.rpc('start_ai_run', {
      p_org_id: config.organizationId,
      p_user_id: config.userId,
      p_feature: config.feature,
      p_provider: provider,
      p_model: model,
      p_metadata: {},
    })

    if (error) {
      logger.error('Failed to start AI run', { error })
      throw new Error('Failed to initialize AI run')
    }

    return data as string
  }

  async completeRun(
    runId: string,
    status: 'completed' | 'failed' | 'cancelled',
    inputTokens?: number,
    outputTokens?: number,
    errorMessage?: string,
  ): Promise<void> {
    const { error } = await supabaseAdmin.rpc('complete_ai_run', {
      p_run_id: runId,
      p_status: status,
      p_input_tokens: inputTokens ?? null,
      p_output_tokens: outputTokens ?? null,
      p_error_message: errorMessage ?? null,
    })

    if (error) {
      logger.error('Failed to complete AI run', { error, runId })
    }
  }

  async chat(
    config: LLMRouterConfig,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      skipDedup?: boolean
    },
  ): Promise<LLMResponse> {
    const spendCheck = await this.checkSpendCap(config.organizationId)
    if (!spendCheck.allowed) {
      throw new Error(spendCheck.reason)
    }

    // Request deduplication (T059)
    const requestHash = generateRequestHash(config.feature, messages, options)
    const cacheKey = `${DEDUP_CACHE_PREFIX}${config.organizationId}:${requestHash}`

    // Check for cached response (skip for chat which should be unique)
    if (!options?.skipDedup && config.feature !== 'chat') {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          logger.debug('Returning cached LLM response', {
            feature: config.feature,
            hash: requestHash,
          })
          return JSON.parse(cached) as LLMResponse
        }
      } catch (error) {
        logger.warn('Failed to check dedup cache', { error })
      }

      // Check for in-flight request
      const inFlight = inFlightRequests.get(cacheKey)
      if (inFlight) {
        logger.debug('Joining in-flight LLM request', {
          feature: config.feature,
          hash: requestHash,
        })
        return inFlight
      }
    }

    const inputText = messages.map((m) => m.content).join(' ')
    const { provider, model } = await this.selectProvider(config, inputText)
    const runId = await this.startRun(config, provider, model)

    // Create the request promise
    const requestPromise = (async (): Promise<LLMResponse> => {
      try {
        let response: LLMResponse

        if (provider === 'anythingllm' && this.anythingllm) {
          response = await this.chatAnythingLLM(messages, model, options, runId, provider)
        } else if (provider === 'openai' && this.openai) {
          response = await this.chatOpenAI(messages, model, options, runId, provider)
        } else if (provider === 'anthropic' && this.anthropic) {
          response = await this.chatAnthropic(messages, model, options, runId, provider)
        } else {
          throw new Error(`Provider ${provider} not available`)
        }

        await this.completeRun(runId, 'completed', response.inputTokens, response.outputTokens)

        // Cache the response (skip for chat)
        if (!options?.skipDedup && config.feature !== 'chat') {
          try {
            await redis.setex(cacheKey, DEDUP_CACHE_TTL, JSON.stringify(response))
          } catch (error) {
            logger.warn('Failed to cache LLM response', { error })
          }
        }

        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await this.completeRun(runId, 'failed', undefined, undefined, errorMessage)
        throw error
      } finally {
        // Remove from in-flight map
        inFlightRequests.delete(cacheKey)
      }
    })()

    // Track in-flight request
    if (!options?.skipDedup && config.feature !== 'chat') {
      inFlightRequests.set(cacheKey, requestPromise)
    }

    return requestPromise
  }

  private async chatOpenAI(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    model: string,
    options?: { temperature?: number; maxTokens?: number },
    runId?: string,
    provider?: AIProvider,
  ): Promise<LLMResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized')

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    })

    return {
      content: response.choices[0]?.message?.content || '',
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      provider: provider || 'openai',
      model,
      runId: runId || '',
    }
  }

  private async chatAnthropic(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    model: string,
    options?: { temperature?: number; maxTokens?: number },
    runId?: string,
    provider?: AIProvider,
  ): Promise<LLMResponse> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized')

    const systemMessage = messages.find((m) => m.role === 'system')?.content
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      system: systemMessage,
      messages: chatMessages,
    })

    const textContent = response.content.find((c) => c.type === 'text')

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      provider: provider || 'anthropic',
      model,
      runId: runId || '',
    }
  }

  private async chatAnythingLLM(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    model: string,
    options?: { temperature?: number; maxTokens?: number },
    runId?: string,
    provider?: AIProvider,
  ): Promise<LLMResponse> {
    if (!this.anythingllm) throw new Error('AnythingLLM client not initialized')

    const response = await this.anythingllm.chat(
      messages.map((m) => ({ role: m.role, content: m.content })),
      {
        model,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 4096,
      },
    )

    // AnythingLLM may not return detailed usage, estimate based on content
    const estimatedInputTokens = messages.reduce(
      (sum, m) => sum + Math.ceil(m.content.length / 4),
      0,
    )
    const estimatedOutputTokens = Math.ceil((response.text?.length || 0) / 4)

    return {
      content: response.text || '',
      inputTokens: (response.usage as any)?.prompt_tokens || estimatedInputTokens,
      outputTokens: (response.usage as any)?.completion_tokens || estimatedOutputTokens,
      provider: provider || 'anythingllm',
      model: response.model || model,
      runId: runId || '',
    }
  }

  async *streamChat(
    config: LLMRouterConfig,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
    },
  ): AsyncGenerator<StreamChunk> {
    const spendCheck = await this.checkSpendCap(config.organizationId)
    if (!spendCheck.allowed) {
      yield { type: 'error', error: spendCheck.reason }
      return
    }

    const inputText = messages.map((m) => m.content).join(' ')
    const { provider, model } = await this.selectProvider(config, inputText)
    const runId = await this.startRun(config, provider, model)

    let inputTokens = 0
    let outputTokens = 0

    try {
      if (provider === 'anythingllm' && this.anythingllm) {
        // AnythingLLM - fall back to non-streaming for now
        // (streaming would require SSE handling from their API)
        const response = await this.anythingllm.chat(
          messages.map((m) => ({ role: m.role, content: m.content })),
          {
            model,
            temperature: options?.temperature ?? 0.7,
            maxTokens: options?.maxTokens ?? 4096,
          },
        )
        yield { type: 'content', content: response.text || '' }
        inputTokens = Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4)
        outputTokens = Math.ceil((response.text?.length || 0) / 4)
      } else if (provider === 'openai' && this.openai) {
        const stream = await this.openai.chat.completions.create({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          stream: true,
          stream_options: { include_usage: true },
        })

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            yield { type: 'content', content }
          }
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens
            outputTokens = chunk.usage.completion_tokens
          }
        }
      } else if (provider === 'anthropic' && this.anthropic) {
        const systemMessage = messages.find((m) => m.role === 'system')?.content
        const chatMessages = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))

        const stream = this.anthropic.messages.stream({
          model,
          max_tokens: options?.maxTokens ?? 4096,
          system: systemMessage,
          messages: chatMessages,
        })

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            const delta = event.delta
            if ('text' in delta) {
              yield { type: 'content', content: delta.text }
            }
          }
        }

        const finalMessage = await stream.finalMessage()
        inputTokens = finalMessage.usage?.input_tokens || 0
        outputTokens = finalMessage.usage?.output_tokens || 0
      } else {
        throw new Error(`Provider ${provider} not available`)
      }

      await this.completeRun(runId, 'completed', inputTokens, outputTokens)
      yield { type: 'done' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.completeRun(runId, 'failed', undefined, undefined, errorMessage)
      yield { type: 'error', error: errorMessage }
    }
  }
}

export const llmRouter = new LLMRouter()
export default llmRouter
