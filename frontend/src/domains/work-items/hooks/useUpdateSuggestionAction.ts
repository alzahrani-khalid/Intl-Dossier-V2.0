/**
 * useUpdateSuggestionAction Hook
 * @module domains/work-items/hooks/useUpdateSuggestionAction
 *
 * TanStack Query mutation hook for updating user action on position suggestions.
 * Routes through the work-items repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as WorkItemsRepo from '../repositories/work-items.repository'

// ============================================================================
// Types
// ============================================================================

export interface UpdateSuggestionActionParams {
  engagementId: string
  suggestionId: string
  action: 'accepted' | 'rejected' | 'ignored'
}

export interface UpdateSuggestionActionResult {
  suggestion: {
    id: string
    user_action: string
    actioned_at: string
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUpdateSuggestionAction(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: UpdateSuggestionActionParams) =>
      WorkItemsRepo.updateSuggestionAction(
        params.engagementId,
        params.suggestionId,
        params.action,
      ),
    onSuccess: (_data, variables: UpdateSuggestionActionParams) => {
      queryClient.invalidateQueries({
        queryKey: ['position-suggestions', variables.engagementId],
      })

      if (variables.action === 'accepted') {
        queryClient.invalidateQueries({
          queryKey: ['engagement-positions', variables.engagementId],
        })
      }
    },
    onError: (error) => {
      console.error('Failed to update suggestion action:', error)
    },
  })
}
