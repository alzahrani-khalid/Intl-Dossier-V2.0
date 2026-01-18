/**
 * useCreateWorkItemDossierLinks Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * TanStack Query mutation for creating work item dossier links
 * via the work-item-dossiers Edge Function.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  WorkItemType,
  InheritanceSource,
  ContextEntityType,
  WorkItemDossierLink,
} from '@/types/dossier-context.types'

// ============================================================================
// API Types
// ============================================================================

export interface CreateWorkItemDossierLinksRequest {
  work_item_type: WorkItemType
  work_item_id: string
  dossier_ids: string[]
  inheritance_source: InheritanceSource
  inherited_from_type?: ContextEntityType
  inherited_from_id?: string
  is_primary?: boolean
}

export interface CreateWorkItemDossierLinksResponse {
  links: WorkItemDossierLink[]
  created_count: number
}

// ============================================================================
// API Call
// ============================================================================

async function createWorkItemDossierLinks(
  request: CreateWorkItemDossierLinksRequest,
): Promise<CreateWorkItemDossierLinksResponse> {
  const { data, error } = await supabase.functions.invoke<CreateWorkItemDossierLinksResponse>(
    'work-item-dossiers',
    {
      body: request,
    },
  )

  if (error) {
    console.error('Error creating work item dossier links:', error)
    throw new Error(error.message || 'Failed to create dossier links')
  }

  if (!data) {
    throw new Error('No data returned from work-item-dossiers')
  }

  return data
}

// ============================================================================
// Query Keys
// ============================================================================

export const workItemDossierKeys = {
  all: ['work-item-dossiers'] as const,
  lists: () => [...workItemDossierKeys.all, 'list'] as const,
  list: (workItemType: string, workItemId: string) =>
    [...workItemDossierKeys.lists(), workItemType, workItemId] as const,
  timeline: (dossierId: string) => [...workItemDossierKeys.all, 'timeline', dossierId] as const,
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseCreateWorkItemDossierLinksOptions {
  /**
   * Callback when links are created successfully.
   */
  onSuccess?: (data: CreateWorkItemDossierLinksResponse) => void
  /**
   * Callback when link creation fails.
   */
  onError?: (error: Error) => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Create dossier links for a work item after creation.
 *
 * @example
 * ```tsx
 * const { mutateAsync: createDossierLinks } = useCreateWorkItemDossierLinks({
 *   onSuccess: (data) => {
 *     console.log(`Created ${data.created_count} dossier links`);
 *   },
 * });
 *
 * // After task creation:
 * const task = await createTask(taskData);
 * await createDossierLinks({
 *   work_item_type: 'task',
 *   work_item_id: task.id,
 *   dossier_ids: ['dossier-uuid'],
 *   inheritance_source: 'direct',
 * });
 * ```
 */
export function useCreateWorkItemDossierLinks(options: UseCreateWorkItemDossierLinksOptions = {}) {
  const { onSuccess, onError } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkItemDossierLinks,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: workItemDossierKeys.list(variables.work_item_type, variables.work_item_id),
      })

      // Invalidate timeline for each linked dossier
      variables.dossier_ids.forEach((dossierId) => {
        queryClient.invalidateQueries({
          queryKey: workItemDossierKeys.timeline(dossierId),
        })
      })

      // Also invalidate general dossier queries
      queryClient.invalidateQueries({
        queryKey: ['dossier-activity-timeline'],
      })

      onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('Failed to create work item dossier links:', error)
      onError?.(error)
    },
  })
}

export default useCreateWorkItemDossierLinks
