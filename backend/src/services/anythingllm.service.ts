import { cacheHelpers } from '../config/redis'
import { logError, logInfo } from '../utils/logger'

export type AIMessageRole = 'system' | 'user' | 'assistant'

export interface AIMessage {
  role: AIMessageRole
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatResponse {
  text: string
  model?: string
  usage?: Record<string, unknown>
}

export class AnythingLLMService {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.ANYTHINGLLM_API_URL || 'http://localhost:3002'
    this.apiKey = apiKey || process.env.ANYTHINGLLM_API_KEY || ''
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { headers: this.headers() })
      return res.ok
    } catch (err) {
      logError('AnythingLLM health check failed', err as Error)
      return false
    }
  }

  async chat(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const cacheKey = `allm:chat:${this.hash(JSON.stringify({ messages, options }))}`
    const cached = await cacheHelpers.get<ChatResponse>(cacheKey)
    if (cached) return cached

    const payload = {
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature ?? 0.2,
      stream: options.stream ?? false,
      messages,
      max_tokens: options.maxTokens,
    }

    const resp = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const body = await safeText(resp)
      throw new Error(`AnythingLLM chat failed: ${resp.status} ${resp.statusText} ${body}`)
    }

    const data = (await resp.json()) as any
    const text = data?.choices?.[0]?.message?.content ?? ''
    const result: ChatResponse = { text, model: data?.model, usage: data?.usage }
    await cacheHelpers.set(cacheKey, result, 60) // cache 60s
    return result
  }

  async embeddings(texts: string[]): Promise<number[][]> {
    const cacheKey = `allm:emb:${this.hash(JSON.stringify(texts))}`
    const cached = await cacheHelpers.get<number[][]>(cacheKey)
    if (cached) return cached

    const payload = { model: 'text-embedding-3-small', input: texts }
    const resp = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const body = await safeText(resp)
      throw new Error(`AnythingLLM embeddings failed: ${resp.status} ${resp.statusText} ${body}`)
    }

    const data = (await resp.json()) as any
    const vectors = (data?.data || []).map((d: any) => d?.embedding as number[])
    await cacheHelpers.set(cacheKey, vectors, 60 * 5)
    return vectors
  }

  private headers() {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    return headers
  }

  private hash(input: string): string {
    let h = 0
    for (let i = 0; i < input.length; i++) {
      h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
    }
    return h.toString(16)
  }
}

async function safeText(resp: Response): Promise<string> {
  try {
    return await resp.text()
  } catch {
    return ''
  }
}

export default AnythingLLMService

