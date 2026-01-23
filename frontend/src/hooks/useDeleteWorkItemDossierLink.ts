/**
 * useDeleteWorkItemDossierLink Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * TanStack Query mutation for deleting work item dossier links.
 * Refactored to use mutation factory (T027: consolidate-duplicated-crud-mutation-hooks).
 */

import { createMutation } from '@/lib/mutation-factory';
import type { WorkItemType } from '@/types/dossier-context.types';
import { workItemDossierKeys } from './useCreateWorkItemDossierLinks';

// ============================================================================
// API Types
// ============================================================================

export interface DeleteWorkItemDossierLinkInput {
  linkId: string;
  workItemType: WorkItemType;
  workItemId: string;
  dossierId: string;
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
export const useDeleteWorkItemDossierLink = createMutation<
  DeleteWorkItemDossierLinkInput,
  void
>({
  method: 'DELETE',
  url: {
    endpoint: 'work-item-dossiers',
    queryParams: (input) => ({
      link_id: input.linkId,
    }),
  },
  invalidation: {
    queryKeys: (variables) => [
      workItemDossierKeys.list(variables.workItemType, variables.workItemId),
      workItemDossierKeys.timeline(variables.dossierId),
      ['dossier-activity-timeline'],
    ],
  },
});

export default useDeleteWorkItemDossierLink;
