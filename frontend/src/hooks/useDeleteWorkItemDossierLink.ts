/**
 * useDeleteWorkItemDossierLink Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * TanStack Query mutation for deleting work item dossier links.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorkItemType } from '@/types/dossier-context.types'
import { workItemDossierKeys } from './useCreateWorkItemDossierLinks'

// ============================================================================
// API Types
// ============================================================================

export interface DeleteWorkItemDossierLinkInput {
  linkId: string
  workItemType: WorkItemType
  workItemId: string
  dossierId: string
}

// ============================================================================
// API Call
// ============================================================================

async function deleteWorkItemDossierLink(input: DeleteWorkItemDossierLinkInput): Promise<void> {
  const { error } = await supabase.from('work_item_dossiers').delete().eq('id', input.linkId)

  if (error) {
    console.error('Error deleting work item dossier link:', error)
    throw new Error(error.message || 'Failed to delete dossier link')
  }
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseDeleteWorkItemDossierLinkOptions {
  /**
   * Callback when link is deleted successfully.
   */
  onSuccess?: () => void
  /**
   * Callback when link deletion fails.
   */
  onError?: (error: Error) => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Delete a dossier link from a work item.
 *
 * @example
 * ```tsx
 * const { mutate: deleteLink } = useDeleteWorkItemDossierLink({
 *   onSuccess: () => {
 *     toast.success('Dossier link removed');
 *   },
 * });
 *
 * deleteLink({
 *   linkId: 'link-uuid',
 *   workItemType: 'task',
 *   workItemId: 'task-uuid',
 *   dossierId: 'dossier-uuid',
 * });
 * ```
 */
export function useDeleteWorkItemDossierLink(options: UseDeleteWorkItemDossierLinkOptions = {}) {
  const { onSuccess, onError } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkItemDossierLink,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: workItemDossierKeys.list(variables.workItemType, variables.workItemId),
      })

      // Invalidate timeline for the dossier
      queryClient.invalidateQueries({
        queryKey: workItemDossierKeys.timeline(variables.dossierId),
      })

      // Also invalidate general dossier queries
      queryClient.invalidateQueries({
        queryKey: ['dossier-activity-timeline'],
      })

      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('Failed to delete work item dossier link:', error)
      onError?.(error)
    },
  })
}

export default useDeleteWorkItemDossierLink
