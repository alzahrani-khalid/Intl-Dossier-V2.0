/**
 * Position Suggestions Hook
 * @module hooks/usePositionSuggestions
 * @feature engagement-position-suggestions
 *
 * TanStack Query hook for fetching AI-suggested positions for engagements with
 * graceful fallback handling when AI services are unavailable.
 *
 * @description
 * This module provides a React hook for managing AI-powered position suggestions:
 * - Query hook for fetching relevant position suggestions for an engagement
 * - AI service status tracking and graceful degradation
 * - Configurable relevance threshold and result limits
 * - Fallback mode when AI service is unavailable
 * - User action tracking (accepted, rejected, ignored)
 * - Suggestion reasoning with keywords and context factors
 * - Exponential backoff retry strategy
 *
 * @example
 * // Basic usage
 * const { suggestions, isLoading } = usePositionSuggestions({
 *   engagementId: 'uuid-here',
 * });
 *
 * @example
 * // With custom relevance threshold
 * const { suggestions, meta } = usePositionSuggestions({
 *   engagementId: 'uuid',
 *   minRelevance: 0.8,
 *   limit: 5,
 * });
 *
 * @example
 * // Check AI service status
 * const { suggestions, meta } = usePositionSuggestions({ engagementId });
 * if (meta?.fallback_mode) {
 *   return <Alert>AI service unavailable, showing fallback suggestions</Alert>;
 * }
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Position Suggestion Entity
 *
 * @description
 * Represents an AI-suggested position for an engagement with relevance score,
 * reasoning, and user action tracking.
 */
export interface PositionSuggestion {
  /** Unique identifier (UUID) for the suggestion record */
  id: string;
  /** Engagement UUID this suggestion is for */
  engagement_id: string;
  /** Position UUID being suggested */
  position_id: string;
  /** AI-calculated relevance score (0.0 to 1.0) */
  relevance_score: number;
  /** AI reasoning for the suggestion */
  suggestion_reasoning?: {
    /** Keywords that matched */
    keywords?: string[];
    /** Context factors considered */
    context_factors?: string[];
  };
  /** ISO timestamp of when suggestion was created */
  created_at: string;
  /** User's action on the suggestion */
  user_action?: 'accepted' | 'rejected' | 'ignored';
  /** ISO timestamp of when user acted on suggestion */
  actioned_at?: string;
  /** Embedded position data */
  position: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    primary_language: 'en' | 'ar';
  };
}

/**
 * Metadata about suggestion generation
 *
 * @description
 * Tracks AI service status and fallback mode for suggestion queries.
 */
export interface SuggestionsMeta {
  /** Current status of AI service */
  ai_service_status: 'available' | 'degraded' | 'unavailable';
  /** Whether fallback suggestions are being used */
  fallback_mode: boolean;
  /** ISO timestamp of when suggestions were generated */
  generated_at: string;
}

/**
 * Options for position suggestions query
 */
export interface UsePositionSuggestionsOptions {
  /** Engagement UUID to fetch suggestions for */
  engagementId: string;
  /** Minimum relevance score threshold (0.0 to 1.0, defaults to 0.7) */
  minRelevance?: number;
  /** Maximum number of suggestions to return (defaults to 10) */
  limit?: number;
  /** Whether to enable the query (defaults to true) */
  enabled?: boolean;
}

/**
 * Return type for usePositionSuggestions hook
 */
export interface UsePositionSuggestionsResult {
  /** Array of suggested positions */
  suggestions: PositionSuggestion[];
  /** Metadata about suggestion generation */
  meta: SuggestionsMeta | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state indicator */
  isError: boolean;
  /** Error object if query failed, null otherwise */
  error: Error | null;
  /** Function to manually refetch suggestions */
  refetch: () => void;
}

/**
 * Fetch position suggestions from edge function
 *
 * @private
 * @param options - Query options including engagementId, minRelevance, and limit
 * @returns Promise resolving to suggestions and metadata
 * @throws Error if authentication is missing or request fails
 */
async function fetchPositionSuggestions(
  options: UsePositionSuggestionsOptions
): Promise<{ suggestions: PositionSuggestion[]; meta: SuggestionsMeta }> {
  const {
    engagementId,
    minRelevance = 0.7,
    limit = 10,
  } = options;

  // Call edge function for AI suggestions
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/engagements/${engagementId}/positions/suggestions?min_relevance=${minRelevance}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 503) {
    throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    suggestions: result.data || [],
    meta: result.meta || {
      ai_service_status: response.status === 503 ? 'unavailable' : 'available',
      fallback_mode: response.status === 503,
      generated_at: new Date().toISOString(),
    },
  };
}

/**
 * Hook to fetch AI-suggested positions for an engagement
 *
 * @description
 * Fetches position suggestions generated by AI based on engagement context, topics,
 * and keywords. Handles AI service unavailability gracefully by falling back to
 * rule-based suggestions. Results are cached for 15 minutes to reduce API calls.
 * Implements exponential backoff retry strategy for transient failures.
 *
 * @param options - Configuration object with engagementId, minRelevance, limit, and enabled
 * @returns UsePositionSuggestionsResult with suggestions, metadata, loading state, and refetch
 *
 * @example
 * // Basic usage
 * const { suggestions, isLoading } = usePositionSuggestions({
 *   engagementId: 'uuid-123',
 * });
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <SuggestionsList>
 *     {suggestions.map(s => (
 *       <SuggestionCard
 *         key={s.id}
 *         position={s.position}
 *         relevance={s.relevance_score}
 *       />
 *     ))}
 *   </SuggestionsList>
 * );
 *
 * @example
 * // With custom relevance threshold and limit
 * const { suggestions, meta } = usePositionSuggestions({
 *   engagementId: engagementId,
 *   minRelevance: 0.85,
 *   limit: 5,
 * });
 *
 * // Show only high-confidence suggestions
 * const highConfidence = suggestions.filter(s => s.relevance_score >= 0.9);
 *
 * @example
 * // Display AI service status
 * const { suggestions, meta, isLoading } = usePositionSuggestions({
 *   engagementId: id,
 * });
 *
 * return (
 *   <div>
 *     {meta?.fallback_mode && (
 *       <Alert variant="warning">
 *         AI service unavailable. Showing rule-based suggestions.
 *       </Alert>
 *     )}
 *     <Badge variant={meta?.ai_service_status}>
 *       {meta?.ai_service_status}
 *     </Badge>
 *     <SuggestionsList suggestions={suggestions} />
 *   </div>
 * );
 *
 * @example
 * // Conditional query based on engagement state
 * const { suggestions } = usePositionSuggestions({
 *   engagementId: id,
 *   enabled: engagement?.status === 'planning' && !!id,
 * });
 *
 * @example
 * // Handle errors and refetch
 * const { suggestions, isError, error, refetch } = usePositionSuggestions({
 *   engagementId: id,
 * });
 *
 * if (isError) {
 *   return (
 *     <ErrorAlert
 *       message={error?.message}
 *       onRetry={refetch}
 *     />
 *   );
 * }
 */
export function usePositionSuggestions(
  options: UsePositionSuggestionsOptions
): UsePositionSuggestionsResult {
  const {
    engagementId,
    minRelevance = 0.7,
    limit = 10,
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['position-suggestions', engagementId, minRelevance, limit],
    queryFn: () => fetchPositionSuggestions(options),
    enabled: enabled && !!engagementId,
    staleTime: 15 * 60 * 1000, // 15 minutes (suggestions don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
  });

  return {
    suggestions: data?.suggestions || [],
    meta: data?.meta || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
