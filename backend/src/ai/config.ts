import dotenv from 'dotenv'

dotenv.config()

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'vllm' | 'ollama' | 'anythingllm'

export type AIFeature =
  | 'brief_generation'
  | 'chat'
  | 'entity_linking'
  | 'semantic_search'
  | 'embeddings'
  | 'voice_transcription'

export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  defaultModel: string
  enabled: boolean
}

/**
 * Embedding provider configuration
 * Feature: ai-features-reenablement
 */
export interface EmbeddingConfig {
  model: string
  dimensions: number
  fallbackProvider: AIProvider | null
  /** Use Edge Function for embedding generation (recommended for production) */
  useEdgeFunction: boolean
  /** Use local ONNX model (development only, causes issues with Alpine) */
  useLocalOnnx: boolean
  /** Maximum queue batch size for async processing */
  queueBatchSize: number
  /** Queue processing interval in milliseconds */
  queueIntervalMs: number
}

/**
 * Voice/transcription feature configuration
 * Feature: ai-features-reenablement
 */
export interface VoiceConfig {
  /** Enable voice memo transcription */
  transcriptionEnabled: boolean
  /** Transcription provider: 'openai' (Whisper) or 'edge-function' */
  transcriptionProvider: 'openai' | 'edge-function'
  /** Maximum audio duration in seconds */
  maxDurationSeconds: number
  /** Supported audio formats */
  supportedFormats: string[]
}

export interface AIConfig {
  providers: Record<AIProvider, AIProviderConfig>
  features: {
    briefGeneration: boolean
    chat: boolean
    entityLinking: boolean
    semanticSearch: boolean
    voiceTranscription: boolean
  }
  embeddings: EmbeddingConfig
  voice: VoiceConfig
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

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production'

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
    semanticSearch: process.env.AI_SEMANTIC_SEARCH_ENABLED !== 'false',
    voiceTranscription: process.env.AI_VOICE_TRANSCRIPTION_ENABLED !== 'false',
  },
  embeddings: {
    model: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.AI_EMBEDDING_DIMENSIONS || '1024', 10),
    fallbackProvider: null,
    // In production, default to Edge Function to avoid ONNX/Alpine issues
    useEdgeFunction:
      process.env.AI_EMBEDDINGS_USE_EDGE_FUNCTION === 'true' ||
      (isProduction && process.env.AI_EMBEDDINGS_USE_LOCAL !== 'true'),
    // In development, default to local ONNX
    useLocalOnnx:
      process.env.AI_EMBEDDINGS_USE_LOCAL === 'true' ||
      (!isProduction && process.env.AI_EMBEDDINGS_USE_EDGE_FUNCTION !== 'true'),
    queueBatchSize: parseInt(process.env.AI_EMBEDDING_QUEUE_BATCH_SIZE || '50', 10),
    queueIntervalMs: parseInt(process.env.AI_EMBEDDING_QUEUE_INTERVAL_MS || '30000', 10),
  },
  voice: {
    transcriptionEnabled: process.env.AI_VOICE_TRANSCRIPTION_ENABLED !== 'false',
    transcriptionProvider:
      (process.env.AI_VOICE_TRANSCRIPTION_PROVIDER as 'openai' | 'edge-function') || 'openai',
    maxDurationSeconds: parseInt(process.env.AI_VOICE_MAX_DURATION_SECONDS || '600', 10),
    supportedFormats: (process.env.AI_VOICE_SUPPORTED_FORMATS || 'mp3,wav,m4a,webm,ogg').split(','),
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
      return aiConfig.features.semanticSearch
    case 'embeddings':
      // Embeddings are enabled if any provider is available
      return (
        aiConfig.embeddings.useEdgeFunction ||
        aiConfig.embeddings.useLocalOnnx ||
        !!process.env.OPENAI_API_KEY
      )
    case 'voice_transcription':
      return aiConfig.features.voiceTranscription && aiConfig.voice.transcriptionEnabled
    default:
      return false
  }
}

/**
 * Get detailed AI feature status
 * Feature: ai-features-reenablement
 */
export function getAIFeatureStatus(): Record<
  AIFeature,
  { enabled: boolean; provider?: string; reason?: string }
> {
  return {
    brief_generation: {
      enabled: aiConfig.features.briefGeneration,
      provider: aiConfig.routing.defaultProvider,
    },
    chat: {
      enabled: aiConfig.features.chat,
      provider: aiConfig.routing.defaultProvider,
    },
    entity_linking: {
      enabled: aiConfig.features.entityLinking,
      provider: aiConfig.routing.defaultProvider,
    },
    semantic_search: {
      enabled: aiConfig.features.semanticSearch,
      reason: !aiConfig.features.semanticSearch
        ? 'Disabled via AI_SEMANTIC_SEARCH_ENABLED'
        : undefined,
    },
    embeddings: {
      enabled: isFeatureEnabled('embeddings'),
      provider: aiConfig.embeddings.useEdgeFunction
        ? 'edge-function'
        : aiConfig.embeddings.useLocalOnnx
          ? 'local-onnx'
          : 'openai',
      reason: !isFeatureEnabled('embeddings') ? 'No embedding provider available' : undefined,
    },
    voice_transcription: {
      enabled: isFeatureEnabled('voice_transcription'),
      provider: aiConfig.voice.transcriptionProvider,
      reason: !isFeatureEnabled('voice_transcription')
        ? 'Disabled via AI_VOICE_TRANSCRIPTION_ENABLED'
        : undefined,
    },
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
