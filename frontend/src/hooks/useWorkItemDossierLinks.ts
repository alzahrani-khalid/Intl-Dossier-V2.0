/**
 * useWorkItemDossierLinks Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * TanStack Query hook for fetching work item dossier links.
 * Used to display inherited dossier context in detail views.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorkItemType, WorkItemDossierLink } from '@/types/dossier-context.types'
import { workItemDossierKeys } from './useCreateWorkItemDossierLinks'

// ============================================================================
// API Types
// ============================================================================

export interface WorkItemDossierLinksResponse {
  links: WorkItemDossierLink[]
  total_count: number
}

// ============================================================================
// API Call
// ============================================================================

async function fetchWorkItemDossierLinks(
  workItemType: WorkItemType,
  workItemId: string,
): Promise<WorkItemDossierLinksResponse> {
  const { data, error } = await supabase
    .from('work_item_dossiers')
    .select(
      `
      id,
      work_item_type,
      work_item_id,
      dossier_id,
      is_primary,
      inheritance_source,
      inherited_from_type,
      inherited_from_id,
      created_at,
      created_by,
      dossiers!work_item_dossiers_dossier_id_fkey (
        id,
        name_en,
        name_ar,
        type,
        status
      )
    `,
    )
    .eq('work_item_type', workItemType)
    .eq('work_item_id', workItemId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching work item dossier links:', error)
    throw new Error(error.message || 'Failed to fetch dossier links')
  }

  // Transform the response to include dossier info
  const links: WorkItemDossierLink[] = (data ?? []).map((item: any) => ({
    id: item.id,
    work_item_type: item.work_item_type,
    work_item_id: item.work_item_id,
    dossier_id: item.dossier_id,
    is_primary: item.is_primary,
    inheritance_source: item.inheritance_source,
    inherited_from_type: item.inherited_from_type,
    inherited_from_id: item.inherited_from_id,
    created_at: item.created_at,
    created_by: item.created_by,
    // Add dossier details
    dossier: item.dossiers
      ? {
          id: item.dossiers.id,
          name_en: item.dossiers.name_en,
          name_ar: item.dossiers.name_ar,
          type: item.dossiers.type,
          status: item.dossiers.status,
        }
      : undefined,
  }))

  return {
    links,
    total_count: links.length,
  }
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseWorkItemDossierLinksOptions {
  /**
   * Whether to enable the query.
   */
  enabled?: boolean
  /**
   * Additional TanStack Query options.
   */
  queryOptions?: Omit<
    UseQueryOptions<WorkItemDossierLinksResponse, Error>,
    'queryKey' | 'queryFn' | 'enabled'
  >
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Fetch dossier links for a work item.
 *
 * @example
 * ```tsx
 * const { links, isLoading } = useWorkItemDossierLinks('task', taskId);
 *
 * // Show inherited dossier info
 * {links.map(link => (
 *   <DossierBadge
 *     key={link.id}
 *     dossier={link.dossier}
 *     inheritedFrom={link.inheritance_source}
 *   />
 * ))}
 * ```
 */
export function useWorkItemDossierLinks(
  workItemType: WorkItemType,
  workItemId: string,
  options: UseWorkItemDossierLinksOptions = {},
) {
  const { enabled = true, queryOptions } = options

  const query = useQuery<WorkItemDossierLinksResponse, Error>({
    queryKey: workItemDossierKeys.list(workItemType, workItemId),
    queryFn: () => fetchWorkItemDossierLinks(workItemType, workItemId),
    enabled: enabled && !!workItemType && !!workItemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...queryOptions,
  })

  return {
    links: query.data?.links ?? [],
    totalCount: query.data?.total_count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  }
}

export default useWorkItemDossierLinks
