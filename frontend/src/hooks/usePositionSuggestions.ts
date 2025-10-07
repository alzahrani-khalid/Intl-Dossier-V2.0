/**
 * TanStack Query Hook: usePositionSuggestions (T038)
 * Fetches AI-suggested positions for an engagement with fallback mode handling
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PositionSuggestion {
  id: string;
  engagement_id: string;
  position_id: string;
  relevance_score: number;
  suggestion_reasoning?: {
    keywords?: string[];
    context_factors?: string[];
  };
  created_at: string;
  user_action?: 'accepted' | 'rejected' | 'ignored';
  actioned_at?: string;
  position: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    primary_language: 'en' | 'ar';
  };
}

export interface SuggestionsMeta {
  ai_service_status: 'available' | 'degraded' | 'unavailable';
  fallback_mode: boolean;
  generated_at: string;
}

export interface UsePositionSuggestionsOptions {
  engagementId: string;
  minRelevance?: number;
  limit?: number;
  enabled?: boolean;
}

export interface UsePositionSuggestionsResult {
  suggestions: PositionSuggestion[];
  meta: SuggestionsMeta | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

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
