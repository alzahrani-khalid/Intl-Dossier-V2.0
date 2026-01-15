/**
 * Working Group Member Suggestions Hooks
 * Feature: working-group-member-suggestions
 *
 * React Query hooks for AI-powered working group member suggestions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWGMemberSuggestions,
  addBulkWGMembers,
  rejectWGMemberSuggestion,
} from '@/services/wg-member-suggestions-api'
import type {
  GetWGSuggestionsResponse,
  BulkAddMembersRequest,
  BulkAddMembersResponse,
  RejectWGSuggestionRequest,
} from '@/types/wg-member-suggestion.types'

/**
 * Query key factory for working group member suggestions
 */
export const wgMemberSuggestionsKeys = {
  all: ['wg-member-suggestions'] as const,
  suggestions: (workingGroupId: string) =>
    [...wgMemberSuggestionsKeys.all, 'suggestions', workingGroupId] as const,
}

/**
 * Hook to fetch member suggestions for a working group
 */
export function useWGMemberSuggestions(
  workingGroupId: string,
  options: {
    limit?: number
    includeRejected?: boolean
    enabled?: boolean
  } = {},
) {
  const { limit = 15, includeRejected = false, enabled = true } = options

  return useQuery<GetWGSuggestionsResponse, Error>({
    queryKey: wgMemberSuggestionsKeys.suggestions(workingGroupId),
    queryFn: () => getWGMemberSuggestions(workingGroupId, { limit, includeRejected }),
    enabled: enabled && !!workingGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to add multiple members from suggestions
 */
export function useBulkAddWGMembers() {
  const queryClient = useQueryClient()

  return useMutation<BulkAddMembersResponse, Error, BulkAddMembersRequest>({
    mutationFn: addBulkWGMembers,
    onSuccess: (_, variables) => {
      // Invalidate suggestions query
      queryClient.invalidateQueries({
        queryKey: wgMemberSuggestionsKeys.suggestions(variables.working_group_id),
      })
      // Also invalidate the working group members query
      queryClient.invalidateQueries({
        queryKey: ['working-group', variables.working_group_id, 'members'],
      })
      // Invalidate the working group full query
      queryClient.invalidateQueries({
        queryKey: ['working-group', variables.working_group_id],
      })
    },
  })
}

/**
 * Hook to reject a member suggestion
 */
export function useRejectWGSuggestion() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, RejectWGSuggestionRequest>({
    mutationFn: rejectWGMemberSuggestion,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: wgMemberSuggestionsKeys.suggestions(variables.working_group_id),
      })
    },
  })
}
