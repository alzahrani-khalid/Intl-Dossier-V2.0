/**
 * Embeddings Service
 * Feature: ai-features-reenablement
 *
 * Hybrid embedding service that can use:
 * 1. Local ONNX (BGE-M3) for development
 * 2. External Edge Function for production (avoids Alpine/ONNX issues)
 * 3. OpenAI API as direct fallback
 *
 * Environment variables:
 * - AI_EMBEDDINGS_USE_EDGE_FUNCTION: 'true' to use Edge Function (recommended for production)
 * - AI_EMBEDDINGS_USE_LOCAL: 'true' to force local ONNX (development only)
 * - SUPABASE_URL: Base URL for Edge Functions
 * - SUPABASE_SERVICE_ROLE_KEY: Auth key for Edge Functions
 * - OPENAI_API_KEY: Direct OpenAI fallback
 */

import { redis } from '../config/redis.js'
import { aiConfig } from './config.js'
import logger from '../utils/logger.js'

export interface EmbeddingResult {
  embedding: number[]
  model: string
  dimensions: number
  cached: boolean
  provider: 'local' | 'edge-function' | 'openai' | 'anythingllm'
}

export interface BatchEmbeddingResult {
  embeddings: number[][]
  model: string
  dimensions: number
  cachedCount: number
  provider: 'local' | 'edge-function' | 'openai' | 'anythingllm'
}

const CACHE_PREFIX = 'embedding:v2:'
const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

// Lazy import for ONNX (only when local mode is enabled)
type EmbeddingPipeline = Awaited<ReturnType<typeof import('@xenova/transformers').pipeline>>

class EmbeddingsService {
  private embedder: EmbeddingPipeline | null = null
  private initPromise: Promise<void> | null = null
  private modelName: string
  private dimensions: number
  private localOnnxAvailable: boolean | null = null

  // Configuration flags
  private useEdgeFunction: boolean
  private useLocalOnnx: boolean

  constructor() {
    this.modelName = aiConfig.embeddings.model
    this.dimensions = aiConfig.embeddings.dimensions

    // Determine embedding strategy
    // Default to Edge Function in production (NODE_ENV=production)
    const isProduction = process.env.NODE_ENV === 'production'
    this.useEdgeFunction =
      process.env.AI_EMBEDDINGS_USE_EDGE_FUNCTION === 'true' ||
      (isProduction && process.env.AI_EMBEDDINGS_USE_LOCAL !== 'true')
    this.useLocalOnnx =
      process.env.AI_EMBEDDINGS_USE_LOCAL === 'true' ||
      (!isProduction && process.env.AI_EMBEDDINGS_USE_EDGE_FUNCTION !== 'true')

    logger.info('Embeddings service initialized', {
      useEdgeFunction: this.useEdgeFunction,
      useLocalOnnx: this.useLocalOnnx,
      isProduction,
      model: this.modelName,
      dimensions: this.dimensions,
    })
  }

  /**
   * Initialize local ONNX embedder (development only)
   */
  private async initializeLocalOnnx(): Promise<boolean> {
    if (this.localOnnxAvailable === false) return false
    if (this.embedder) return true

    if (this.initPromise) {
      await this.initPromise
      return this.embedder !== null
    }

    this.initPromise = (async () => {
      try {
        logger.info('Initializing local BGE-M3 embedding model...')
        const { pipeline } = await import('@xenova/transformers')
        this.embedder = await pipeline('feature-extraction', 'Xenova/bge-m3', {
          quantized: true,
        })
        this.localOnnxAvailable = true
        logger.info('Local BGE-M3 embedding model initialized successfully')
      } catch (error) {
        logger.warn('Failed to initialize local BGE-M3 model, will use remote providers', {
          error,
        })
        this.localOnnxAvailable = false
        this.embedder = null
      }
    })()

    await this.initPromise
    return this.embedder !== null
  }

  /**
   * Get cache key for text
   */
  private getCacheKey(text: string): string {
    const hash = Buffer.from(text).toString('base64').slice(0, 32)
    return `${CACHE_PREFIX}${hash}`
  }

  /**
   * Get cached embedding
   */
  private async getCachedEmbedding(text: string): Promise<number[] | null> {
    try {
      const key = this.getCacheKey(text)
      const cached = await redis.get(key)

      if (cached) {
        return JSON.parse(cached)
      }
      return null
    } catch (error) {
      logger.warn('Redis cache read failed', { error })
      return null
    }
  }

  /**
   * Cache embedding
   */
  private async setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
      const key = this.getCacheKey(text)
      await redis.setex(key, CACHE_TTL, JSON.stringify(embedding))
    } catch (error) {
      logger.warn('Redis cache write failed', { error })
    }
  }

  /**
   * Generate embedding using local ONNX model
   */
  private async embedLocal(text: string): Promise<number[] | null> {
    if (!this.useLocalOnnx) return null

    const initialized = await this.initializeLocalOnnx()
    if (!initialized || !this.embedder) return null

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await (this.embedder as any)(text, {
        pooling: 'cls',
        normalize: true,
      })

      let embedding: number[] = Array.from(output.data as Float32Array)

      if (embedding.length > this.dimensions) {
        embedding = embedding.slice(0, this.dimensions)
      }

      return embedding
    } catch (error) {
      logger.error('Local embedding generation failed', { error, textLength: text.length })
      return null
    }
  }

  /**
   * Generate embedding using Edge Function
   */
  private async embedEdgeFunction(text: string | string[]): Promise<number[][] | null> {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      logger.warn('Edge Function not configured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return null
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/embeddings-generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model: 'text-embedding-3-small',
          dimensions: this.dimensions,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('Edge Function embedding failed', { status: response.status, error })
        return null
      }

      const data = await response.json()
      return data.embeddings
    } catch (error) {
      logger.error('Edge Function request failed', { error })
      return null
    }
  }

  /**
   * Generate embedding using OpenAI directly
   */
  private async embedOpenAI(text: string | string[]): Promise<number[][] | null> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      logger.warn('OpenAI fallback not available: missing OPENAI_API_KEY')
      return null
    }

    try {
      const texts = Array.isArray(text) ? text : [text]

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: 'text-embedding-3-small',
          dimensions: this.dimensions,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('OpenAI embedding failed', { status: response.status, error })
        return null
      }

      const data = await response.json()
      return data.data.map((item: { embedding: number[] }) => item.embedding)
    } catch (error) {
      logger.error('OpenAI request failed', { error })
      return null
    }
  }

  /**
   * Generate embedding for single text
   */
  async embed(text: string): Promise<EmbeddingResult> {
    // Check cache first
    const cached = await this.getCachedEmbedding(text)
    if (cached) {
      return {
        embedding: cached,
        model: this.modelName,
        dimensions: this.dimensions,
        cached: true,
        provider: 'local', // Cache doesn't store provider, assume local for compatibility
      }
    }

    let embedding: number[] | null = null
    let provider: EmbeddingResult['provider'] = 'local'

    // Strategy 1: Try Edge Function (production default)
    if (this.useEdgeFunction) {
      const result = await this.embedEdgeFunction(text)
      if (result && result[0]) {
        embedding = result[0]
        provider = 'edge-function'
      }
    }

    // Strategy 2: Try local ONNX (development or fallback)
    if (!embedding && this.useLocalOnnx) {
      embedding = await this.embedLocal(text)
      if (embedding) {
        provider = 'local'
      }
    }

    // Strategy 3: Try OpenAI directly (final fallback)
    if (!embedding) {
      const result = await this.embedOpenAI(text)
      if (result && result[0]) {
        embedding = result[0]
        provider = 'openai'
      }
    }

    if (!embedding) {
      throw new Error('All embedding providers failed')
    }

    // Cache the result
    await this.setCachedEmbedding(text, embedding)

    return {
      embedding,
      model: provider === 'local' ? this.modelName : 'text-embedding-3-small',
      dimensions: embedding.length,
      cached: false,
      provider,
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const results: number[][] = []
    let cachedCount = 0
    let provider: BatchEmbeddingResult['provider'] = 'local'

    // Check cache for all texts
    const cached: (number[] | null)[] = await Promise.all(
      texts.map((text) => this.getCachedEmbedding(text)),
    )

    const uncachedIndices: number[] = []
    const uncachedTexts: string[] = []

    for (let i = 0; i < texts.length; i++) {
      if (cached[i]) {
        results[i] = cached[i]!
        cachedCount++
      } else {
        uncachedIndices.push(i)
        uncachedTexts.push(texts[i]!)
      }
    }

    // If all cached, return early
    if (uncachedTexts.length === 0) {
      return {
        embeddings: results,
        model: this.modelName,
        dimensions: this.dimensions,
        cachedCount,
        provider: 'local',
      }
    }

    // Generate embeddings for uncached texts
    let newEmbeddings: number[][] | null = null

    // Strategy 1: Try Edge Function for batch
    if (this.useEdgeFunction) {
      newEmbeddings = await this.embedEdgeFunction(uncachedTexts)
      if (newEmbeddings) {
        provider = 'edge-function'
      }
    }

    // Strategy 2: Try OpenAI directly for batch
    if (!newEmbeddings) {
      newEmbeddings = await this.embedOpenAI(uncachedTexts)
      if (newEmbeddings) {
        provider = 'openai'
      }
    }

    // Strategy 3: Fall back to local one-by-one
    if (!newEmbeddings && this.useLocalOnnx) {
      newEmbeddings = []
      for (const text of uncachedTexts) {
        const embedding = await this.embedLocal(text)
        if (embedding) {
          newEmbeddings.push(embedding)
          provider = 'local'
        } else {
          throw new Error('Local embedding failed for batch item')
        }
      }
    }

    if (!newEmbeddings) {
      throw new Error('All embedding providers failed for batch')
    }

    // Map new embeddings back to original indices and cache
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i]!
      const text = uncachedTexts[i]!
      const embedding = newEmbeddings[i]!

      results[originalIndex] = embedding
      await this.setCachedEmbedding(text, embedding)
    }

    return {
      embeddings: results,
      model: provider === 'local' ? this.modelName : 'text-embedding-3-small',
      dimensions: this.dimensions,
      cachedCount,
      provider,
    }
  }

  /**
   * Check if embedding service is ready
   */
  async isReady(): Promise<boolean> {
    // If using Edge Function, check its availability
    if (this.useEdgeFunction) {
      const supabaseUrl = process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/embeddings-generate/health`)
          return response.ok
        } catch {
          // Fall through to other checks
        }
      }
    }

    // Check local ONNX
    if (this.useLocalOnnx) {
      try {
        await this.initializeLocalOnnx()
        if (this.embedder) return true
      } catch {
        // Fall through to other checks
      }
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      return true
    }

    return false
  }

  /**
   * Get model info
   */
  getModelInfo(): {
    model: string
    dimensions: number
    useEdgeFunction: boolean
    useLocalOnnx: boolean
    localOnnxAvailable: boolean | null
  } {
    return {
      model: this.modelName,
      dimensions: this.dimensions,
      useEdgeFunction: this.useEdgeFunction,
      useLocalOnnx: this.useLocalOnnx,
      localOnnxAvailable: this.localOnnxAvailable,
    }
  }

  /**
   * Get provider health status
   */
  async getHealthStatus(): Promise<{
    edgeFunction: { available: boolean; error?: string }
    localOnnx: { available: boolean; error?: string }
    openai: { available: boolean; error?: string }
  }> {
    const status = {
      edgeFunction: { available: false, error: undefined as string | undefined },
      localOnnx: { available: false, error: undefined as string | undefined },
      openai: { available: false, error: undefined as string | undefined },
    }

    // Check Edge Function
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceRoleKey) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/embeddings-generate/health`)
        status.edgeFunction.available = response.ok
        if (!response.ok) {
          status.edgeFunction.error = `HTTP ${response.status}`
        }
      } catch (error) {
        status.edgeFunction.error = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      status.edgeFunction.error = 'Not configured'
    }

    // Check local ONNX
    if (this.useLocalOnnx) {
      try {
        await this.initializeLocalOnnx()
        status.localOnnx.available = this.embedder !== null
        if (!status.localOnnx.available) {
          status.localOnnx.error = 'ONNX initialization failed'
        }
      } catch (error) {
        status.localOnnx.error = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      status.localOnnx.error = 'Disabled'
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        })
        status.openai.available = response.ok
        if (!response.ok) {
          status.openai.error = `HTTP ${response.status}`
        }
      } catch (error) {
        status.openai.error = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      status.openai.error = 'Not configured'
    }

    return status
  }
}

export const embeddingsService = new EmbeddingsService()
export default embeddingsService
