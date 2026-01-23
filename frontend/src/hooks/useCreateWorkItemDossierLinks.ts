/**
 * useCreateWorkItemDossierLinks Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * TanStack Query mutation for creating work item dossier links
 * via the work-item-dossiers Edge Function.
 */

import { createMutation } from '@/lib/mutation-factory'
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
// Hook Implementation
// ============================================================================

/**
 * Create dossier links for a work item after creation.
 *
 * @example
 * ```tsx
 * const { mutateAsync: createDossierLinks } = useCreateWorkItemDossierLinks({
 *   onSuccess: (data, variables) => {
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
export const useCreateWorkItemDossierLinks = createMutation<
  CreateWorkItemDossierLinksRequest,
  CreateWorkItemDossierLinksResponse
>({
  method: 'POST',
  url: {
    endpoint: 'work-item-dossiers',
  },
  invalidation: {
    queryKeys: (variables, data) => {
      // Build array of query keys to invalidate
      const keys = [
        // Invalidate the specific work item's dossier links
        workItemDossierKeys.list(variables.work_item_type, variables.work_item_id),
        // Invalidate general dossier activity timeline
        ['dossier-activity-timeline'],
      ]

      // Add timeline query keys for each linked dossier
      variables.dossier_ids.forEach((dossierId) => {
        keys.push(workItemDossierKeys.timeline(dossierId))
      })

      return keys
    },
  },
})

export default useCreateWorkItemDossierLinks
