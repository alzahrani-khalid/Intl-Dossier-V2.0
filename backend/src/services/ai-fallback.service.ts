import AnythingLLMService, { AIMessage, ChatOptions, ChatResponse } from './anythingllm.service'
import EmbeddingService from './embeddings.service'
import { cacheHelpers } from '../config/redis'
import { logError } from '../utils/logger'

export class AIFallbackService {
  private readonly allm: AnythingLLMService
  private readonly embedder: EmbeddingService

  constructor(allm?: AnythingLLMService, embedder?: EmbeddingService) {
    this.allm = allm || new AnythingLLMService()
    this.embedder = embedder || new EmbeddingService()
  }

  async generate(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const key = `ai:fallback:${hash(JSON.stringify({ messages, options }))}`
    const cached = await cacheHelpers.get<ChatResponse>(key)
    if (cached) return cached

    // Try provider in order: AnythingLLM → simple local heuristic
    try {
      if (await this.allm.healthCheck()) {
        const res = await this.allm.chat(messages, options)
        await cacheHelpers.set(key, res, 60)
        return res
      }
    } catch (err) {
      logError('AnythingLLM chat failed', err as Error)
    }

    // Very simple local fallback: echo last user content with a notice
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    const text = `Fallback response (provider unavailable). You said: ${lastUser.slice(0, 500)}`
    const result: ChatResponse = { text, model: 'fallback-local' }
    await cacheHelpers.set(key, result, 30)
    return result
  }

  async embeddings(texts: string[]): Promise<number[][]> {
    try {
      // Prefer local embeddings for performance
      return await this.embedder.embedBatch(texts)
    } catch (err) {
      logError('Local embeddings failed', err as Error)
      // attempt AnythingLLM as a backup path
      try {
        return await new AnythingLLMService().embeddings(texts)
      } catch (err2) {
        logError('AnythingLLM embeddings failed', err2 as Error)
        return texts.map(() => new Array(384).fill(0))
      }
    }
  }
}

function hash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  return h.toString(16)
}

export default AIFallbackService

