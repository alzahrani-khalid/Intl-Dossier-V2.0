/**
 * AI Health Status Hook
 * Feature: ai-features-reenablement
 *
 * Provides real-time health status for AI services including:
 * - Embedding generation (Edge Function, Local ONNX, OpenAI)
 * - Inference providers (AnythingLLM, OpenAI, Anthropic)
 * - Feature flags status
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, refetch } = useAIHealth();
 *
 * if (data?.status === 'healthy') {
 *   // All AI services are operational
 * }
 *
 * if (!data?.summary.embeddingsAvailable) {
 *   // Embeddings service is down - semantic search may not work
 * }
 * ```
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'

// Types
export interface AIFeatureStatus {
  enabled: boolean
  provider?: string
  reason?: string
}

export interface AIProviderHealth {
  available: boolean
  error?: string
  latency?: number
}

export interface EmbeddingProviderHealth {
  edgeFunction: AIProviderHealth
  localOnnx: AIProviderHealth
  openai: AIProviderHealth
  config: {
    model: string
    dimensions: number
    useEdgeFunction: boolean
    useLocalOnnx: boolean
    localOnnxAvailable: boolean | null
  }
}

export interface AIHealthResponse {
  status: 'healthy' | 'degraded' | 'error'
  timestamp: string
  features: {
    brief_generation: AIFeatureStatus
    chat: AIFeatureStatus
    entity_linking: AIFeatureStatus
    semantic_search: AIFeatureStatus
    embeddings: AIFeatureStatus
    voice_transcription: AIFeatureStatus
  }
  providers: {
    embeddings: EmbeddingProviderHealth
    inference: {
      anythingllm: AIProviderHealth
      openai: AIProviderHealth
      anthropic: AIProviderHealth
    }
  }
  summary: {
    embeddingsAvailable: boolean
    inferenceAvailable: boolean
    productionMode: boolean
    embeddingProvider: 'edge-function' | 'local-onnx' | 'openai'
  }
  error?: string
}

// Query key
export const AI_HEALTH_QUERY_KEY = ['ai', 'health'] as const

// Fetch function
async function fetchAIHealth(): Promise<AIHealthResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const response = await fetch(`${apiUrl}/api/ai/health`)

  if (!response.ok) {
    // Even if the endpoint returns an error status, it may have a valid JSON body
    const data = await response.json().catch(() => ({
      status: 'error' as const,
      timestamp: new Date().toISOString(),
      error: `HTTP ${response.status}: ${response.statusText}`,
    }))
    return data
  }

  return response.json()
}

/**
 * Hook to check AI services health status
 *
 * @param options.enabled - Whether to enable the query (default: true)
 * @param options.refetchInterval - How often to refetch in ms (default: 60000 = 1 minute)
 */
export function useAIHealth(options?: { enabled?: boolean; refetchInterval?: number }) {
  const { enabled = true, refetchInterval = 60000 } = options || {}

  return useQuery({
    queryKey: AI_HEALTH_QUERY_KEY,
    queryFn: fetchAIHealth,
    enabled,
    refetchInterval,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
    retryDelay: 1000,
  })
}

/**
 * Hook to check if a specific AI feature is available
 *
 * @param feature - The feature to check
 * @returns boolean indicating if the feature is available
 */
export function useAIFeatureAvailable(feature: keyof AIHealthResponse['features']): boolean {
  const { data } = useAIHealth()
  return data?.features[feature]?.enabled ?? false
}

/**
 * Hook to check if semantic search/embeddings are available
 * Useful for conditionally showing search features
 */
export function useSemanticSearchAvailable(): boolean {
  const { data } = useAIHealth()
  return data?.summary.embeddingsAvailable ?? false
}

/**
 * Hook to check if AI chat/inference is available
 */
export function useAIInferenceAvailable(): boolean {
  const { data } = useAIHealth()
  return data?.summary.inferenceAvailable ?? false
}

/**
 * Hook to get the current embedding provider
 */
export function useEmbeddingProvider(): 'edge-function' | 'local-onnx' | 'openai' | null {
  const { data } = useAIHealth()
  return data?.summary.embeddingProvider ?? null
}

/**
 * Hook to invalidate AI health cache
 * Useful after making changes that might affect AI service availability
 */
export function useInvalidateAIHealth() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: AI_HEALTH_QUERY_KEY })
  }
}

export default useAIHealth
