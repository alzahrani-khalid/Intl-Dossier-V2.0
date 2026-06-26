/**
 * Dossier Query Key Factory
 * @module domains/dossiers/keys
 *
 * Canonical query key factory for all dossier-related TanStack Query operations.
 * Provides hierarchical keys for granular cache invalidation.
 *
 * @example
 * // Invalidate all dossier queries
 * queryClient.invalidateQueries({ queryKey: dossierKeys.all })
 *
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: dossierKeys.lists() })
 *
 * // Invalidate a specific dossier detail
 * queryClient.invalidateQueries({ queryKey: dossierKeys.detail('uuid') })
 */

export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...dossierKeys.lists(), filters] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string) => [...dossierKeys.details(), id] as const,
  // When called without paging (invalidation), return a clean prefix so it
  // matches paginated byType list queries — a trailing {page:undefined} object
  // is rejected by TanStack's partialDeepEqual against a list's {page:1,...}.
  byType: (type: string, page?: number, pageSize?: number) =>
    page === undefined && pageSize === undefined
      ? ([...dossierKeys.all, 'type', type] as const)
      : ([...dossierKeys.all, 'type', type, { page, pageSize }] as const),
  timeline: (id: string, filters?: unknown) =>
    [...dossierKeys.all, 'timeline', id, filters] as const,
  briefs: (id: string) => [...dossierKeys.all, 'briefs', id] as const,
  related: (id: string) => [...dossierKeys.detail(id), 'related'] as const,
  counts: () => [...dossierKeys.all, 'counts'] as const,
  countByType: (type: string) => [...dossierKeys.counts(), type] as const,
}
