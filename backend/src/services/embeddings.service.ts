import { cacheHelpers } from '../config/redis'
import { logError } from '../utils/logger'

export interface EmbeddingOptions {
  model?: string
}

export class EmbeddingService {
  constructor(private readonly options: EmbeddingOptions = {}) {}

  async embed(text: string): Promise<number[]> {
    const [v] = await this.embedBatch([text])
    return v
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const cacheKey = `emb:xenova:${this.options.model || 'all-MiniLM-L6-v2'}:${hash(JSON.stringify(texts))}`
    const cached = await cacheHelpers.get<number[][]>(cacheKey)
    if (cached) return cached

    try {
      // Lazy import to keep startup lean
      const { pipeline } = await import('@xenova/transformers') as any
      const pipe = await pipeline('feature-extraction', this.options.model || 'Xenova/all-MiniLM-L6-v2')
      const out = await Promise.all(
        texts.map(async (t) => {
          const output = await pipe(t, { pooling: 'mean', normalize: true })
          // output.data is a TypedArray
          return Array.from(output.data as Float32Array)
        })
      )
      await cacheHelpers.set(cacheKey, out, 60 * 30)
      return out
    } catch (err) {
      logError('Local embedding generation failed', err as Error)
      // As a last resort, return zero vectors of length 384 (MiniLM dimension)
      return texts.map(() => new Array(384).fill(0))
    }
  }
}

function hash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  return h.toString(16)
}

export default EmbeddingService

