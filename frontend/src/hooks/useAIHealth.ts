/**
 * AI Health Status Hooks
 * @module hooks/useAIHealth
 * @feature ai-features-reenablement
 *
 * TanStack Query hooks for monitoring AI service health and availability with
 * automatic polling, feature flags, and provider status tracking.
 *
 * @description
 * This module provides hooks for monitoring the health and availability of AI services:
 * - Real-time health status polling (default: every 60 seconds)
 * - Multi-provider health checks (embeddings, inference)
 * - Feature availability flags for conditional rendering
 * - Provider-specific status (Edge Function, ONNX, OpenAI, Anthropic, etc.)
 * - Automatic cache management with 30s staleness window
 * - Graceful degradation with error status tracking
 *
 * Use these hooks to conditionally enable/disable AI features in the UI based on
 * service availability, show fallback UIs when AI is unavailable, and provide
 * users with transparency about which AI capabilities are currently operational.
 *
 * @example
 * // Monitor overall AI health
 * const { data, isLoading } = useAIHealth();
 * if (data?.status === 'healthy') {
 *   // All AI services operational
 * }
 *
 * @example
 * // Conditional feature rendering
 * const isSemanticSearchAvailable = useSemanticSearchAvailable();
 * return (
 *   <>
 *     {isSemanticSearchAvailable ? (
 *       <SmartSearchInput />
 *     ) : (
 *       <BasicSearchInput />
 *     )}
 *   </>
 * );
 *
 * @example
 * // Check specific feature availability
 * const isBriefGenAvailable = useAIFeatureAvailable('brief_generation');
 * const provider = useEmbeddingProvider(); // 'edge-function' | 'local-onnx' | 'openai'
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Type definitions for AI health status responses
 */
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

/**
 * Query key for AI health status
 */
export const AI_HEALTH_QUERY_KEY = ['ai', 'health'] as const

/**
 * Fetch AI health status from backend API
 *
 * @description
 * Calls the /api/ai/health endpoint to retrieve current status of all AI services.
 * Even on HTTP errors, attempts to parse error response for partial status data.
 *
 * @returns Promise resolving to AIHealthResponse with service statuses
 * @throws Never throws - always returns a response object, even on errors
 */
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
 * Hook to check AI services health status with automatic polling
 *
 * @description
 * Fetches and monitors the health status of all AI services including:
 * - Embedding providers (Edge Function, Local ONNX, OpenAI)
 * - Inference providers (AnythingLLM, OpenAI, Anthropic)
 * - Feature flags (brief_generation, chat, entity_linking, etc.)
 * - Overall system status (healthy, degraded, error)
 *
 * The query automatically refetches every 60 seconds by default to keep status current.
 * Data is considered stale after 30 seconds, prompting background refetch.
 * Results are cached for 5 minutes to minimize redundant requests.
 *
 * Use this hook to:
 * - Display AI service status indicators in the UI
 * - Enable/disable features based on availability
 * - Show maintenance messages when services are down
 * - Route requests to available providers
 *
 * @param options - Query configuration options
 * @param options.enabled - Whether to enable the query (default: true)
 * @param options.refetchInterval - Polling interval in milliseconds (default: 60000 = 1 minute)
 * @returns TanStack Query result with AIHealthResponse data
 *
 * @example
 * // Basic health monitoring
 * const { data, isLoading, error } = useAIHealth();
 * if (data?.status === 'healthy') {
 *   // All systems operational
 * }
 *
 * @example
 * // Custom polling interval
 * const { data } = useAIHealth({ refetchInterval: 30000 }); // Poll every 30s
 *
 * @example
 * // Conditional enabling
 * const { data } = useAIHealth({ enabled: isAdminUser });
 *
 * @example
 * // Display provider status
 * const { data } = useAIHealth();
 * console.log('Embedding provider:', data?.summary.embeddingProvider);
 * console.log('Embeddings available:', data?.summary.embeddingsAvailable);
 * console.log('Inference available:', data?.summary.inferenceAvailable);
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
 * @description
 * Checks whether a specific AI feature is currently enabled based on the latest
 * health status. Returns false if health data is not yet loaded or feature is disabled.
 * Useful for conditional rendering of AI-powered UI components.
 *
 * @param feature - The feature key to check (e.g., 'brief_generation', 'chat')
 * @returns boolean indicating if the feature is currently available
 *
 * @example
 * const isChatAvailable = useAIFeatureAvailable('chat');
 * return (
 *   <button disabled={!isChatAvailable}>
 *     Ask AI {!isChatAvailable && '(Offline)'}
 *   </button>
 * );
 *
 * @example
 * const isBriefGenAvailable = useAIFeatureAvailable('brief_generation');
 * if (!isBriefGenAvailable) {
 *   return <FallbackBriefEditor />;
 * }
 */
export function useAIFeatureAvailable(feature: keyof AIHealthResponse['features']): boolean {
  const { data } = useAIHealth()
  return data?.features[feature]?.enabled ?? false
}

/**
 * Hook to check if semantic search/embeddings are available
 *
 * @description
 * Convenience hook that checks if the embeddings service is operational.
 * Returns true only if at least one embedding provider (Edge Function, ONNX, or OpenAI)
 * is available. Use this to conditionally show/hide semantic search features.
 *
 * @returns boolean indicating if semantic search is available
 *
 * @example
 * const isSemanticSearchAvailable = useSemanticSearchAvailable();
 * return (
 *   <SearchBox
 *     placeholder={isSemanticSearchAvailable ? 'Smart search...' : 'Keyword search...'}
 *     useSemanticSearch={isSemanticSearchAvailable}
 *   />
 * );
 */
export function useSemanticSearchAvailable(): boolean {
  const { data } = useAIHealth()
  return data?.summary.embeddingsAvailable ?? false
}

/**
 * Hook to check if AI chat/inference is available
 *
 * @description
 * Convenience hook that checks if at least one inference provider (AnythingLLM,
 * OpenAI, or Anthropic) is available. Use this to enable/disable chat features.
 *
 * @returns boolean indicating if AI inference is available
 *
 * @example
 * const isAIInferenceAvailable = useAIInferenceAvailable();
 * if (!isAIInferenceAvailable) {
 *   return <div>AI chat is temporarily unavailable</div>;
 * }
 */
export function useAIInferenceAvailable(): boolean {
  const { data } = useAIHealth()
  return data?.summary.inferenceAvailable ?? false
}

/**
 * Hook to get the current active embedding provider
 *
 * @description
 * Returns the name of the currently active embedding provider being used for
 * vector embeddings. Useful for displaying provider information to users or
 * routing requests to specific providers.
 *
 * @returns The active embedding provider or null if none available
 *
 * @example
 * const provider = useEmbeddingProvider();
 * console.log(`Using ${provider} for embeddings`);
 * // Output: "Using edge-function for embeddings"
 */
export function useEmbeddingProvider(): 'edge-function' | 'local-onnx' | 'openai' | null {
  const { data } = useAIHealth()
  return data?.summary.embeddingProvider ?? null
}

/**
 * Hook to invalidate AI health cache and force refetch
 *
 * @description
 * Returns a function that invalidates the AI health query cache, forcing a fresh
 * fetch of health status. Useful after making configuration changes that might
 * affect AI service availability (e.g., enabling/disabling providers, updating API keys).
 *
 * @returns Function to trigger cache invalidation
 *
 * @example
 * const invalidateHealth = useInvalidateAIHealth();
 *
 * const handleSaveAPIKey = async (key: string) => {
 *   await saveAPIKey(key);
 *   invalidateHealth(); // Refresh health status after config change
 * };
 */
export function useInvalidateAIHealth() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: AI_HEALTH_QUERY_KEY })
  }
}

export default useAIHealth
