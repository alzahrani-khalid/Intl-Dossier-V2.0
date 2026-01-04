import { pipeline } from '@xenova/transformers'
import { redis } from '../config/redis.js'
import { aiConfig } from './config.js'
import logger from '../utils/logger.js'

type EmbeddingPipeline = Awaited<ReturnType<typeof pipeline>>

export interface EmbeddingResult {
  embedding: number[]
  model: string
  dimensions: number
  cached: boolean
}

export interface BatchEmbeddingResult {
  embeddings: number[][]
  model: string
  dimensions: number
  cachedCount: number
}

const CACHE_PREFIX = 'embedding:bge-m3:'
const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

class EmbeddingsService {
  private embedder: EmbeddingPipeline | null = null
  private initPromise: Promise<void> | null = null
  private modelName: string
  private dimensions: number

  constructor() {
    this.modelName = aiConfig.embeddings.model
    this.dimensions = aiConfig.embeddings.dimensions
  }

  private async initialize(): Promise<void> {
    if (this.embedder) return

    if (this.initPromise) {
      await this.initPromise
      return
    }

    this.initPromise = (async () => {
      try {
        logger.info('Initializing BGE-M3 embedding model...')
        this.embedder = await pipeline('feature-extraction', 'Xenova/bge-m3', {
          quantized: true,
        })
        logger.info('BGE-M3 embedding model initialized successfully')
      } catch (error) {
        logger.error('Failed to initialize BGE-M3 model', { error })
        throw new Error('Embedding model initialization failed')
      }
    })()

    await this.initPromise
  }

  private getCacheKey(text: string): string {
    const hash = Buffer.from(text).toString('base64').slice(0, 32)
    return `${CACHE_PREFIX}${hash}`
  }

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

  private async setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
      const key = this.getCacheKey(text)
      await redis.setex(key, CACHE_TTL, JSON.stringify(embedding))
    } catch (error) {
      logger.warn('Redis cache write failed', { error })
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const cached = await this.getCachedEmbedding(text)
    if (cached) {
      return {
        embedding: cached,
        model: this.modelName,
        dimensions: this.dimensions,
        cached: true,
      }
    }

    await this.initialize()

    if (!this.embedder) {
      throw new Error('Embedding model not initialized')
    }

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

      await this.setCachedEmbedding(text, embedding)

      return {
        embedding,
        model: this.modelName,
        dimensions: embedding.length,
        cached: false,
      }
    } catch (error) {
      logger.error('Failed to generate embedding', { error, textLength: text.length })
      throw new Error('Embedding generation failed')
    }
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const results: number[][] = []
    let cachedCount = 0

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

    if (uncachedTexts.length > 0) {
      await this.initialize()

      if (!this.embedder) {
        throw new Error('Embedding model not initialized')
      }

      for (let i = 0; i < uncachedTexts.length; i++) {
        const text = uncachedTexts[i]!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const output = await (this.embedder as any)(text, {
          pooling: 'cls',
          normalize: true,
        })

        let embedding: number[] = Array.from(output.data as Float32Array)

        if (embedding.length > this.dimensions) {
          embedding = embedding.slice(0, this.dimensions)
        }

        const originalIndex = uncachedIndices[i]!
        results[originalIndex] = embedding

        await this.setCachedEmbedding(text, embedding)
      }
    }

    return {
      embeddings: results,
      model: this.modelName,
      dimensions: this.dimensions,
      cachedCount,
    }
  }

  async isReady(): Promise<boolean> {
    try {
      await this.initialize()
      return this.embedder !== null
    } catch {
      return false
    }
  }

  getModelInfo(): { model: string; dimensions: number } {
    return {
      model: this.modelName,
      dimensions: this.dimensions,
    }
  }
}

export const embeddingsService = new EmbeddingsService()
export default embeddingsService
