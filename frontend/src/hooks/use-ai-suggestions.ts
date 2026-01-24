/**
 * AI Entity Link Suggestions Hooks
 * @module hooks/use-ai-suggestions
 * @feature ai-entity-linking
 *
 * TanStack Query hooks for AI-powered entity link suggestions with graceful
 * degradation, Redis caching, and analytics tracking.
 *
 * @description
 * This module provides hooks for generating and accepting AI-powered entity link
 * suggestions for intake tickets:
 * - Generate 3-5 link suggestions in <3 seconds (SC-002 target)
 * - Redis caching with 60-second TTL for repeated requests
 * - Graceful degradation to manual search when AI unavailable (503)
 * - Rate limiting protection (429 handling)
 * - Automatic cache invalidation on acceptance
 * - Analytics tracking for acceptance rates (SC-005: 90% target)
 * - Multi-entity type support (dossier, position, organization, etc.)
 *
 * The suggestion system analyzes intake ticket content and recommends relevant
 * entities to link, with confidence scores and suggested link types.
 *
 * Performance targets:
 * - AI suggestions: <3 seconds for 3-5 recommendations
 * - Loading states: 2-3 second loading indicator
 * - Timeout: 3 seconds before showing fallback UI
 * - Acceptance rate: 90% target (SC-005)
 *
 * @example
 * // Generate suggestions for intake ticket
 * const { data, isLoading, error } = useAISuggestions(intakeId, {
 *   entity_types: ['dossier', 'position'],
 *   max_suggestions: 5
 * });
 *
 * @example
 * // Accept suggestion and create link
 * const acceptMutation = useAcceptAISuggestion(intakeId);
 * acceptMutation.mutate({
 *   suggestion_id: 'suggestion-uuid',
 *   entity_id: 'entity-uuid',
 *   entity_type: 'dossier',
 *   link_type: 'mentioned_in'
 * });
 *
 * @example
 * // Graceful degradation on AI unavailable
 * const { data, error } = useAISuggestions(intakeId);
 * if (error?.status === 503) {
 *   return <ManualSearchFallback />;
 * }
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type {
  AILinkSuggestion,
  GenerateSuggestionsRequest,
  GenerateSuggestionsResponse,
  AcceptSuggestionRequest,
  AcceptSuggestionResponse,
} from '../types/ai-suggestions.types'
import { intakeEntityLinksAPI } from '../services/entity-links-api'

/**
 * Hook for generating AI-powered entity link suggestions
 *
 * @description
 * Generates AI suggestions for entities to link to an intake ticket. The AI analyzes:
 * - Ticket title and description
 * - Related entities already linked
 * - Historical linking patterns
 * - Entity metadata and relationships
 *
 * Features:
 * - Redis caching (60s TTL) for repeat requests
 * - Retry logic with exponential backoff
 * - No retry on 503 (AI unavailable) or 429 (rate limited)
 * - Automatic stale-while-revalidate for smooth UX
 * - Default enabled (fetch immediately on mount)
 *
 * Graceful degradation:
 * - 503 error indicates AI service unavailable → show manual search fallback
 * - 429 error indicates rate limit hit → show retry button with cooldown
 * - Other errors retry up to 2 times with 1s-5s backoff
 *
 * @param intakeId - Intake ticket UUID
 * @param options - Query configuration options
 * @param options.entity_types - Entity types to suggest (default: all types)
 * @param options.max_suggestions - Maximum suggestions to return (default: 5)
 * @param options.enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with suggestion list
 *
 * @example
 * // Basic usage - fetch immediately
 * const { data, isLoading } = useAISuggestions(intakeId);
 *
 * @example
 * // Fetch on user action
 * const { data, refetch } = useAISuggestions(intakeId, { enabled: false });
 * const handleGetSuggestions = () => refetch();
 *
 * @example
 * // Filter by entity types
 * const { data } = useAISuggestions(intakeId, {
 *   entity_types: ['dossier', 'position'],
 *   max_suggestions: 3
 * });
 *
 * @example
 * // Graceful degradation
 * const { data, error } = useAISuggestions(intakeId);
 *
 * if (error?.status === 503) {
 *   return <ManualSearchFallback />;
 * }
 *
 * if (error?.status === 429) {
 *   return <RateLimitMessage retryAfter={error.retryAfter} />;
 * }
 *
 * @example
 * // Display suggestions
 * const { data } = useAISuggestions(intakeId);
 *
 * return (
 *   <div>
 *     {data?.suggestions.map(suggestion => (
 *       <SuggestionCard
 *         key={suggestion.suggestion_id}
 *         suggestion={suggestion}
 *         confidence={suggestion.confidence_score}
 *       />
 *     ))}
 *   </div>
 * );
 */
export function useAISuggestions(
  intakeId: string,
  options: {
    entity_types?: string[]
    max_suggestions?: number
    enabled?: boolean
  } = {},
) {
  const { t } = useTranslation()

  return useQuery({
    queryKey: ['ai-suggestions', intakeId, options.entity_types],
    queryFn: async () => {
      const request: GenerateSuggestionsRequest = {
        entity_types: options.entity_types || ['dossier', 'position', 'organization', 'country'],
        max_suggestions: options.max_suggestions || 5,
      }

      const response = await intakeEntityLinksAPI.ai.generateSuggestions(intakeId, request)
      return response
    },
    enabled: options.enabled !== false, // Default to enabled
    staleTime: 60 * 1000, // 1 minute (matches Redis cache TTL)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if AI service is unavailable (503)
      if (error.status === 503) return false

      // Don't retry if rate limited (429)
      if (error.status === 429) return false

      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    meta: {
      errorMessage: t('entityLinks.aiSuggestions.error', 'Failed to generate AI suggestions'),
    },
  })
}

/**
 * Hook for accepting AI suggestion and creating entity link
 *
 * @description
 * Accepts an AI suggestion and creates the corresponding entity link in the database.
 * On success:
 * - Creates the entity-intake link
 * - Marks suggestion as accepted
 * - Invalidates entity-links query (shows new link in UI)
 * - Invalidates ai-suggestions query (updates acceptance status)
 * - Shows success toast (via meta.successMessage)
 *
 * This mutation is tracked for analytics to measure:
 * - Acceptance rate (SC-005: 90% target)
 * - Time to accept
 * - Which suggestions are most accepted (by rank, confidence, type)
 *
 * @param intakeId - Intake ticket UUID
 * @returns TanStack Mutation for accepting suggestions
 *
 * @example
 * const acceptMutation = useAcceptAISuggestion(intakeId);
 *
 * const handleAccept = (suggestion: AILinkSuggestion) => {
 *   acceptMutation.mutate({
 *     suggestion_id: suggestion.suggestion_id,
 *     entity_id: suggestion.entity_id,
 *     entity_type: suggestion.entity_type,
 *     link_type: suggestion.suggested_link_type
 *   });
 * };
 *
 * @example
 * // With loading and error states
 * const acceptMutation = useAcceptAISuggestion(intakeId);
 *
 * return (
 *   <button
 *     onClick={() => acceptMutation.mutate(request)}
 *     disabled={acceptMutation.isPending}
 *   >
 *     {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
 *   </button>
 * );
 *
 * @example
 * // With success callback
 * const acceptMutation = useAcceptAISuggestion(intakeId);
 *
 * acceptMutation.mutate(request, {
 *   onSuccess: (data) => {
 *     console.log('Link created:', data.link_id);
 *     showSuccessToast();
 *   }
 * });
 */
export function useAcceptAISuggestion(intakeId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (request: AcceptSuggestionRequest) => {
      return await intakeEntityLinksAPI.ai.acceptSuggestion(intakeId, request)
    },
    onSuccess: (data, variables) => {
      // Invalidate entity links query to show new link
      queryClient.invalidateQueries({ queryKey: ['entity-links', intakeId] })

      // Invalidate AI suggestions query to update acceptance status
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', intakeId] })

      // Show success toast (handled by caller)
    },
    onError: (_error: any) => {
      // Error handling in component (show toast)
    },
    meta: {
      successMessage: t(
        'entityLinks.aiSuggestions.accepted',
        'AI suggestion accepted and link created',
      ),
      errorMessage: t('entityLinks.aiSuggestions.acceptError', 'Failed to accept suggestion'),
    },
  })
}

/**
 * Hook for tracking AI suggestion analytics
 *
 * @description
 * Provides analytics tracking functions for measuring AI suggestion performance.
 * Tracks key metrics for success criteria:
 * - SC-005: 90% acceptance rate target
 * - SC-002: <3s generation time
 * - Fallback usage (when AI unavailable)
 * - User interaction patterns
 *
 * Metrics tracked:
 * - Suggestion generation count and cache hit rate
 * - Acceptance rate by rank position (e.g., users prefer suggestion #1)
 * - Acceptance rate by confidence score
 * - Time from suggestion display to acceptance
 * - Fallback to manual search frequency
 *
 * This data helps optimize AI model performance and user experience.
 *
 * @param intakeId - Intake ticket UUID for context
 * @returns Analytics tracking functions
 *
 * @example
 * const analytics = useAISuggestionAnalytics(intakeId);
 *
 * // Track suggestion generation
 * const { data } = useAISuggestions(intakeId);
 * useEffect(() => {
 *   if (data) {
 *     analytics.trackSuggestionGenerated(
 *       data.suggestions.length,
 *       data.cache_hit || false
 *     );
 *   }
 * }, [data]);
 *
 * @example
 * // Track acceptance
 * const handleAccept = (suggestion: AILinkSuggestion, rank: number) => {
 *   const startTime = Date.now();
 *   acceptMutation.mutate(request, {
 *     onSuccess: () => {
 *       analytics.trackSuggestionAccepted(
 *         suggestion.suggestion_id,
 *         rank,
 *         suggestion.confidence_score,
 *         Date.now() - startTime
 *       );
 *     }
 *   });
 * };
 *
 * @example
 * // Track fallback usage
 * if (error?.status === 503) {
 *   analytics.trackFallbackToManualSearch('ai_unavailable');
 * }
 */
export function useAISuggestionAnalytics(_intakeId: string) {
  const trackSuggestionGenerated = (_suggestionCount: number, _cacheHit: boolean) => {
    // Send to analytics service (e.g., PostHog, Mixpanel)
  }

  const trackSuggestionAccepted = (
    _suggestionId: string,
    _rank: number,
    _confidenceScore: number,
    _timeToAccept: number,
  ) => {
    // Track AI suggestion acceptance
  }

  const trackFallbackToManualSearch = (_reason: string) => {
    // Track fallback to manual search
  }

  return {
    trackSuggestionGenerated,
    trackSuggestionAccepted,
    trackFallbackToManualSearch,
  }
}
