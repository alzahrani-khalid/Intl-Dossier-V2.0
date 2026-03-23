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
  workspace?: string
}

export interface ChatResponse {
  text: string
  model?: string
  usage?: Record<string, unknown>
}

class AnythingLLMService {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly workspace: string

  constructor(baseUrl?: string, apiKey?: string, workspace?: string) {
    this.baseUrl = baseUrl || process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001'
    this.apiKey = apiKey || process.env.ANYTHINGLLM_API_KEY || ''
    this.workspace = workspace || process.env.ANYTHINGLLM_WORKSPACE || 'intl-dossier'
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
    // Build the message from conversation history
    // AnythingLLM workspace chat expects a single message, we'll format the conversation
    const workspace = options.workspace || this.workspace

    // Combine system prompt and messages into a single prompt for AnythingLLM
    let combinedMessage = ''
    const systemMessage = messages.find((m) => m.role === 'system')
    const userMessages = messages.filter((m) => m.role !== 'system')

    if (systemMessage) {
      combinedMessage += `[System Instructions]\n${systemMessage.content}\n\n`
    }

    // Add conversation history
    for (const msg of userMessages) {
      if (msg.role === 'user') {
        combinedMessage += `User: ${msg.content}\n`
      } else if (msg.role === 'assistant') {
        combinedMessage += `Assistant: ${msg.content}\n`
      }
    }

    // Get the last user message for the actual query
    const lastUserMsg = userMessages.filter((m) => m.role === 'user').pop()
    if (lastUserMsg && userMessages.length > 1) {
      // If there's conversation history, just use the combined message
      combinedMessage = combinedMessage.trim()
    } else if (lastUserMsg) {
      // Single message, use it directly with system prompt
      combinedMessage = systemMessage
        ? `${systemMessage.content}\n\nUser message: ${lastUserMsg.content}`
        : lastUserMsg.content
    }

    logInfo('AnythingLLM chat request', { workspace, messageLength: combinedMessage.length })

    const payload = {
      message: combinedMessage,
      mode: 'chat',
    }

    const resp = await fetch(`${this.baseUrl}/api/v1/workspace/${workspace}/chat`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!resp.ok) {
      const body = await safeText(resp)
      logError('AnythingLLM chat failed', new Error(`${resp.status} ${resp.statusText}`), { body })
      throw new Error(`AnythingLLM chat failed: ${resp.status} ${resp.statusText} ${body}`)
    }

    const data = (await resp.json()) as any
    const text = data?.textResponse || ''

    logInfo('AnythingLLM chat response', { responseLength: text.length })

    const result: ChatResponse = {
      text,
      model: 'anythingllm-workspace',
      usage: {
        prompt_tokens: Math.ceil(combinedMessage.length / 4),
        completion_tokens: Math.ceil(text.length / 4),
      },
    }

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
