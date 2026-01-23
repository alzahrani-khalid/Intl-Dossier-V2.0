/**
 * Relationship Suggestions Hooks
 * @module hooks/useRelationshipSuggestions
 * @feature ai-relationship-suggestions
 *
 * TanStack Query hooks for AI-powered relationship suggestions.
 *
 * @description
 * This module provides hooks for managing AI-generated relationship suggestions:
 * - Query hooks for fetching suggestions for persons
 * - Mutation hooks for bulk-creating relationships from suggestions
 * - Rejection tracking to improve future suggestions
 * - Automatic cache invalidation and real-time updates
 *
 * The AI analyzes person profiles, organizational affiliations, and existing
 * relationships to suggest potential new connections.
 *
 * @example
 * // Fetch suggestions for a person
 * const { data } = useRelationshipSuggestions('person-uuid', { limit: 10 });
 *
 * @example
 * // Accept suggestions and create relationships
 * const { mutate } = useBulkCreateRelationships();
 * mutate({
 *   person_id: 'person-uuid',
 *   suggestion_ids: ['suggestion-1', 'suggestion-2'],
 * });
 *
 * @example
 * // Reject a suggestion
 * const { mutate } = useRejectSuggestion();
 * mutate({ person_id: 'person-uuid', suggestion_id: 'suggestion-uuid' });
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getRelationshipSuggestions,
  createBulkRelationships,
  rejectSuggestion,
} from '@/services/relationship-suggestions-api'
import type {
  BulkCreateRelationshipsRequest,
  RejectSuggestionRequest,
} from '@/types/relationship-suggestion.types'

/**
 * Query Keys Factory for relationship suggestion queries
 *
 * @description
 * Provides hierarchical keys for TanStack Query cache management of AI suggestions.
 *
 * @example
 * // Invalidate all suggestion queries
 * queryClient.invalidateQueries({ queryKey: relationshipSuggestionsKeys.all });
 */
export const relationshipSuggestionsKeys = {
  all: ['relationship-suggestions'] as const,
  forPerson: (personId: string) => [...relationshipSuggestionsKeys.all, personId] as const,
}

/**
 * Hook to fetch relationship suggestions for a person
 *
 * @description
 * Fetches AI-generated relationship suggestions based on person profile, affiliations,
 * and existing relationships. Results are cached for 5 minutes.
 *
 * @param personId - UUID of the person to fetch suggestions for (undefined disables query)
 * @param options - Query options (limit, includeRejected, enabled)
 * @returns TanStack Query result with array of relationship suggestions
 *
 * @example
 * // Fetch top 10 suggestions
 * const { data, isLoading } = useRelationshipSuggestions('person-uuid');
 *
 * @example
 * // Include previously rejected suggestions
 * const { data } = useRelationshipSuggestions('person-uuid', {
 *   limit: 20,
 *   includeRejected: true,
 * });
 */
export function useRelationshipSuggestions(
  personId: string | undefined,
  options: {
    limit?: number
    includeRejected?: boolean
    enabled?: boolean
  } = {},
) {
  const { limit = 10, includeRejected = false, enabled = true } = options

  return useQuery({
    queryKey: relationshipSuggestionsKeys.forPerson(personId || ''),
    queryFn: () => getRelationshipSuggestions(personId!, { limit, includeRejected }),
    enabled: enabled && !!personId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create multiple relationships at once from suggestions
 *
 * @description
 * Creates multiple relationships in a single operation based on accepted suggestions.
 * On success, invalidates suggestion and relationship queries, and shows a toast notification.
 *
 * @returns TanStack Mutation result with mutate function accepting BulkCreateRelationshipsRequest
 *
 * @example
 * const { mutate, isLoading } = useBulkCreateRelationships();
 *
 * mutate({
 *   person_id: 'person-uuid',
 *   suggestion_ids: ['suggestion-1-uuid', 'suggestion-2-uuid'],
 * });
 */
export function useBulkCreateRelationships() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return useMutation({
    mutationFn: (request: BulkCreateRelationshipsRequest) => createBulkRelationships(request),
    onSuccess: (data, variables) => {
      // Invalidate suggestions and relationships queries
      queryClient.invalidateQueries({
        queryKey: relationshipSuggestionsKeys.forPerson(variables.person_id),
      })
      queryClient.invalidateQueries({
        queryKey: ['relationships', variables.person_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['person-relationships', variables.person_id],
      })

      // Show success toast
      toast.success(isRTL ? data.message_ar : data.message)
    },
    onError: (error: Error) => {
      toast.error(
        isRTL
          ? `فشل في إنشاء العلاقات: ${error.message}`
          : `Failed to create relationships: ${error.message}`,
      )
    },
  })
}

/**
 * Hook to reject a suggestion
 *
 * @description
 * Marks a suggestion as rejected to improve future AI suggestions and hide it from the list.
 * On success, invalidates the suggestion query and shows a toast notification.
 *
 * @returns TanStack Mutation result with mutate function accepting RejectSuggestionRequest
 *
 * @example
 * const { mutate: reject } = useRejectSuggestion();
 *
 * reject({
 *   person_id: 'person-uuid',
 *   suggestion_id: 'suggestion-uuid',
 * });
 */
export function useRejectSuggestion() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return useMutation({
    mutationFn: (request: RejectSuggestionRequest) => rejectSuggestion(request),
    onSuccess: (_, variables) => {
      // Invalidate suggestions query
      queryClient.invalidateQueries({
        queryKey: relationshipSuggestionsKeys.forPerson(variables.person_id),
      })

      toast.success(isRTL ? 'تم رفض الاقتراح' : 'Suggestion dismissed')
    },
    onError: (error: Error) => {
      toast.error(
        isRTL
          ? `فشل في رفض الاقتراح: ${error.message}`
          : `Failed to dismiss suggestion: ${error.message}`,
      )
    },
  })
}
