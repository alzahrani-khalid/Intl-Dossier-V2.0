/**
 * Relationship Suggestions Hooks
 * Feature: ai-relationship-suggestions
 *
 * React Query hooks for AI-powered relationship suggestions
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
 * Query key factory for relationship suggestions
 */
export const relationshipSuggestionsKeys = {
  all: ['relationship-suggestions'] as const,
  forPerson: (personId: string) => [...relationshipSuggestionsKeys.all, personId] as const,
}

/**
 * Hook to fetch relationship suggestions for a person
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
 * Hook to create multiple relationships at once
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
