/**
 * Position-Dossier Links Hook
 * @module hooks/usePositionDossierLinks
 * @feature position-dossier-linking
 *
 * TanStack Query hook for fetching position-dossier relationships with automatic caching
 * and filtering capabilities.
 *
 * @description
 * This module provides a React hook for managing position-dossier link queries:
 * - Query hook for fetching all dossiers linked to a position
 * - Support for filtering by link type (primary, related, reference)
 * - Automatic cache management with 5-minute stale time
 * - Related dossier metadata included (name, type, status, description)
 * - Efficient refetch capabilities for real-time updates
 *
 * @example
 * // Fetch all linked dossiers for a position
 * const { links, isLoading } = usePositionDossierLinks('position-uuid');
 *
 * @example
 * // Fetch only primary links
 * const { links } = usePositionDossierLinks('position-uuid', { link_type: 'primary' });
 *
 * @example
 * // Display linked dossiers with refetch
 * const { links, totalCount, refetch } = usePositionDossierLinks(positionId);
 * return <DossierList dossiers={links} total={totalCount} onRefresh={refetch} />;
 */

// T066: usePositionDossierLinks hook
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Position-Dossier Link Entity
 *
 * @description
 * Represents a relationship between a position and a dossier.
 * Includes link metadata and optionally embedded dossier data.
 */
export interface PositionDossierLink {
  /** Unique identifier (UUID) for the link */
  id: string
  /** Position UUID this link belongs to */
  position_id: string
  /** Dossier UUID being linked */
  dossier_id: string
  /** Type of relationship: primary (main focus), related (connected), reference (cited) */
  link_type: 'primary' | 'related' | 'reference'
  /** Optional notes explaining the relationship */
  notes?: string | null
  /** UUID of user who created the link */
  created_by: string
  /** ISO timestamp of when the link was created */
  created_at: string
  /** Embedded dossier data (included in API response) */
  dossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
    description_en?: string
    description_ar?: string
  }
}

/**
 * Filter options for position-dossier links query
 */
export interface UsePositionDossierLinksFilters {
  /** Filter by link type: 'primary', 'related', or 'reference' */
  link_type?: string
}

/**
 * Return type for usePositionDossierLinks hook
 */
export interface UsePositionDossierLinksResult {
  /** Array of position-dossier links with embedded dossier data */
  links: PositionDossierLink[]
  /** Total count of links matching the filter */
  totalCount: number
  /** Loading state indicator */
  isLoading: boolean
  /** Error object if query failed, null otherwise */
  error: Error | null
  /** Function to manually refetch the links */
  refetch: () => void
}

/**
 * Hook to fetch dossiers linked to a position
 *
 * @description
 * Fetches all dossier-position relationships for a given position, with optional
 * filtering by link type. Results include embedded dossier metadata for display.
 * The query is automatically cached and enabled only when positionId is provided.
 * Stale time is set to 5 minutes to balance freshness and performance.
 *
 * @param positionId - The unique identifier (UUID) of the position
 * @param filters - Optional filters to apply (link_type)
 * @returns UsePositionDossierLinksResult with links array, count, loading state, and refetch function
 *
 * @example
 * // Basic usage - fetch all linked dossiers
 * const { links, totalCount, isLoading } = usePositionDossierLinks('uuid-123');
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     <Text>Linked Dossiers: {totalCount}</Text>
 *     {links.map(link => (
 *       <DossierCard key={link.id} dossier={link.dossier} type={link.link_type} />
 *     ))}
 *   </div>
 * );
 *
 * @example
 * // Filter by link type
 * const { links: primaryLinks } = usePositionDossierLinks(positionId, {
 *   link_type: 'primary',
 * });
 *
 * const { links: referenceLinks } = usePositionDossierLinks(positionId, {
 *   link_type: 'reference',
 * });
 *
 * @example
 * // Manual refetch after creating/deleting a link
 * const { links, refetch, isLoading } = usePositionDossierLinks(positionId);
 *
 * const handleLinkCreated = async () => {
 *   await createLink({ dossier_id: newDossierId, link_type: 'related' });
 *   refetch(); // Refresh the links list
 * };
 *
 * @example
 * // Display links grouped by type
 * const { links, isLoading } = usePositionDossierLinks(positionId);
 *
 * const primaryLinks = links.filter(l => l.link_type === 'primary');
 * const relatedLinks = links.filter(l => l.link_type === 'related');
 * const referenceLinks = links.filter(l => l.link_type === 'reference');
 *
 * return (
 *   <Tabs>
 *     <TabPanel title={`Primary (${primaryLinks.length})`}>
 *       <LinksList links={primaryLinks} />
 *     </TabPanel>
 *     <TabPanel title={`Related (${relatedLinks.length})`}>
 *       <LinksList links={relatedLinks} />
 *     </TabPanel>
 *     <TabPanel title={`References (${referenceLinks.length})`}>
 *       <LinksList links={referenceLinks} />
 *     </TabPanel>
 *   </Tabs>
 * );
 */
export function usePositionDossierLinks(
  positionId: string,
  filters?: UsePositionDossierLinksFilters,
): UsePositionDossierLinksResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['position-dossier-links', positionId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ positionId })
      if (filters?.link_type) {
        params.append('link_type', filters.link_type)
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/positions-dossiers-get?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch position-dossier links')
      }

      const result = await response.json()
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!positionId,
  })

  return {
    links: data?.links || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
