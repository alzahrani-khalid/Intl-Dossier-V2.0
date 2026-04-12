/**
 * Work Item Query Key Factory
 * @module domains/work-items/keys
 *
 * Canonical query key factory for all work-item-related TanStack Query operations.
 * Provides hierarchical keys for granular cache invalidation.
 *
 * @example
 * // Invalidate all work-item queries
 * queryClient.invalidateQueries({ queryKey: workItemKeys.all })
 *
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: workItemKeys.lists() })
 */

export const workItemKeys = {
  all: ['work-items'] as const,
  lists: () => [...workItemKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...workItemKeys.lists(), filters] as const,
  details: () => [...workItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...workItemKeys.details(), id] as const,
  byDossier: (dossierId: string) => [...workItemKeys.all, 'by-dossier', dossierId] as const,
  dossierLinks: (workItemId: string, workItemType?: string) =>
    [...workItemKeys.all, 'dossier-links', workItemId, workItemType] as const,
}
