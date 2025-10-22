/**
 * AI Suggestions Hook
 *
 * TanStack Query hook for AI-powered entity link suggestions.
 * Implements graceful degradation when AI service is unavailable.
 *
 * Performance targets:
 * - AI suggestions: <3 seconds for 3-5 recommendations (SC-002)
 * - Loading states: Show 2-3 second loading indicator
 * - Timeout: 3 seconds before showing fallback UI
 *
 * @module frontend/src/hooks/use-ai-suggestions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  AILinkSuggestion,
  GenerateSuggestionsRequest,
  GenerateSuggestionsResponse,
  AcceptSuggestionRequest,
  AcceptSuggestionResponse
} from '../types/ai-suggestions.types';
import { intakeEntityLinksAPI } from '../services/entity-links-api';

/**
 * Hook for generating AI suggestions
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error, refetch } = useAISuggestions(intakeId, {
 *   entity_types: ['dossier', 'position'],
 *   enabled: true // Only fetch when user clicks "Get AI Suggestions"
 * });
 * ```
 *
 * Graceful degradation:
 * - If AI service returns 503, `error.fallback === 'manual_search'`
 * - Frontend shows manual search dialog as fallback
 * - Retry button available after cooldown period
 *
 * @param intakeId - Intake ticket ID
 * @param options - Query options (entity types, enabled flag)
 * @returns TanStack Query result with suggestions
 */
export function useAISuggestions(
  intakeId: string,
  options: {
    entity_types?: string[];
    max_suggestions?: number;
    enabled?: boolean;
  } = {}
) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['ai-suggestions', intakeId, options.entity_types],
    queryFn: async () => {
      const request: GenerateSuggestionsRequest = {
        entity_types: options.entity_types || ['dossier', 'position', 'organization', 'country'],
        max_suggestions: options.max_suggestions || 5
      };

      const response = await intakeEntityLinksAPI.ai.generateSuggestions(intakeId, request);
      return response;
    },
    enabled: options.enabled !== false, // Default to enabled
    staleTime: 60 * 1000, // 1 minute (matches Redis cache TTL)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if AI service is unavailable (503)
      if (error.status === 503) return false;

      // Don't retry if rate limited (429)
      if (error.status === 429) return false;

      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    meta: {
      errorMessage: t('entityLinks.aiSuggestions.error', 'Failed to generate AI suggestions')
    }
  });
}

/**
 * Hook for accepting AI suggestion and creating link
 *
 * Usage:
 * ```tsx
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
 * ```
 *
 * @param intakeId - Intake ticket ID
 * @returns TanStack Query mutation for accepting suggestion
 */
export function useAcceptAISuggestion(intakeId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (request: AcceptSuggestionRequest) => {
      return await intakeEntityLinksAPI.ai.acceptSuggestion(intakeId, request);
    },
    onSuccess: (data, variables) => {
      // Invalidate entity links query to show new link
      queryClient.invalidateQueries({ queryKey: ['entity-links', intakeId] });

      // Invalidate AI suggestions query to update acceptance status
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', intakeId] });

      // Show success toast (handled by caller)
      console.log('[AI Suggestions] Accepted suggestion:', variables.suggestion_id);
    },
    onError: (error: any) => {
      console.error('[AI Suggestions] Failed to accept suggestion:', error);
      // Error handling in component (show toast)
    },
    meta: {
      successMessage: t('entityLinks.aiSuggestions.accepted', 'AI suggestion accepted and link created'),
      errorMessage: t('entityLinks.aiSuggestions.acceptError', 'Failed to accept suggestion')
    }
  });
}

/**
 * Hook for tracking AI suggestion analytics
 *
 * Tracks:
 * - Suggestion generation requests
 * - Acceptance rate (for SC-005: 90% target)
 * - Time to accept (for user experience metrics)
 * - Fallback to manual search rate
 *
 * @param intakeId - Intake ticket ID
 * @returns Analytics tracking functions
 */
export function useAISuggestionAnalytics(intakeId: string) {
  const trackSuggestionGenerated = (suggestionCount: number, cacheHit: boolean) => {
    // Send to analytics service (e.g., PostHog, Mixpanel)
    console.log('[Analytics] AI suggestions generated:', {
      intake_id: intakeId,
      suggestion_count: suggestionCount,
      cache_hit: cacheHit,
      timestamp: new Date().toISOString()
    });
  };

  const trackSuggestionAccepted = (
    suggestionId: string,
    rank: number,
    confidenceScore: number,
    timeToAccept: number
  ) => {
    console.log('[Analytics] AI suggestion accepted:', {
      intake_id: intakeId,
      suggestion_id: suggestionId,
      rank,
      confidence_score: confidenceScore,
      time_to_accept_ms: timeToAccept,
      timestamp: new Date().toISOString()
    });
  };

  const trackFallbackToManualSearch = (reason: string) => {
    console.log('[Analytics] Fallback to manual search:', {
      intake_id: intakeId,
      reason,
      timestamp: new Date().toISOString()
    });
  };

  return {
    trackSuggestionGenerated,
    trackSuggestionAccepted,
    trackFallbackToManualSearch
  };
}
