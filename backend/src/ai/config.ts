import dotenv from 'dotenv'

dotenv.config()

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'vllm' | 'ollama' | 'anythingllm'

export type AIFeature =
  | 'brief_generation'
  | 'chat'
  | 'entity_linking'
  | 'semantic_search'
  | 'embeddings'

export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  defaultModel: string
  enabled: boolean
}

export interface AIConfig {
  providers: Record<AIProvider, AIProviderConfig>
  features: {
    briefGeneration: boolean
    chat: boolean
    entityLinking: boolean
  }
  embeddings: {
    model: string
    dimensions: number
    fallbackProvider: AIProvider | null
  }
  routing: {
    arabicThreshold: number
    defaultProvider: AIProvider
    arabicProvider: AIProvider | null
    privateProvider: AIProvider | null
  }
  limits: {
    briefTimeoutMs: number
    chatTimeoutMs: number
    maxTokensPerRequest: number
  }
}

export const aiConfig: AIConfig = {
  providers: {
    openai: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o',
      enabled: !!process.env.OPENAI_API_KEY,
    },
    anthropic: {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-3-5-sonnet-20241022',
      enabled: !!process.env.ANTHROPIC_API_KEY,
    },
    google: {
      provider: 'google',
      apiKey: process.env.GOOGLE_AI_API_KEY,
      defaultModel: 'gemini-1.5-pro',
      enabled: !!process.env.GOOGLE_AI_API_KEY,
    },
    vllm: {
      provider: 'vllm',
      baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8000',
      defaultModel: 'llama-3.1-70b',
      enabled: !!process.env.VLLM_BASE_URL,
    },
    ollama: {
      provider: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: 'llama3.1',
      enabled: !!process.env.OLLAMA_BASE_URL,
    },
    anythingllm: {
      provider: 'anythingllm',
      apiKey: process.env.ANYTHING_LLM_API_KEY,
      baseUrl: process.env.ANYTHING_LLM_API_URL || 'http://localhost:3001/api',
      defaultModel: 'gpt-4o-mini',
      enabled: !!process.env.ANYTHING_LLM_API_URL || process.env.AI_USE_ANYTHINGLLM === 'true',
    },
  },
  features: {
    briefGeneration: process.env.AI_BRIEF_GENERATION_ENABLED !== 'false',
    chat: process.env.AI_CHAT_ENABLED !== 'false',
    entityLinking: process.env.AI_ENTITY_LINKING_ENABLED !== 'false',
  },
  embeddings: {
    model: process.env.AI_EMBEDDING_MODEL || 'bge-m3',
    dimensions: parseInt(process.env.AI_EMBEDDING_DIMENSIONS || '1024', 10),
    fallbackProvider: null,
  },
  routing: {
    arabicThreshold: 0.3,
    defaultProvider:
      process.env.AI_USE_ANYTHINGLLM === 'true' || process.env.ANYTHING_LLM_API_URL
        ? 'anythingllm'
        : ((process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai') as AIProvider),
    arabicProvider: null,
    privateProvider: process.env.VLLM_BASE_URL
      ? 'vllm'
      : process.env.OLLAMA_BASE_URL
        ? 'ollama'
        : null,
  },
  limits: {
    briefTimeoutMs: 90000,
    chatTimeoutMs: 30000,
    maxTokensPerRequest: 8192,
  },
}

export function isFeatureEnabled(feature: AIFeature): boolean {
  switch (feature) {
    case 'brief_generation':
      return aiConfig.features.briefGeneration
    case 'chat':
      return aiConfig.features.chat
    case 'entity_linking':
      return aiConfig.features.entityLinking
    case 'semantic_search':
    case 'embeddings':
      return true
    default:
      return false
  }
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig | null {
  const config = aiConfig.providers[provider]
  return config?.enabled ? config : null
}

export function getDefaultProvider(): AIProviderConfig | null {
  const defaultProvider = aiConfig.routing.defaultProvider
  return getProviderConfig(defaultProvider)
}

export function getPrivateProvider(): AIProviderConfig | null {
  const privateProvider = aiConfig.routing.privateProvider
  return privateProvider ? getProviderConfig(privateProvider) : null
}

export default aiConfig
