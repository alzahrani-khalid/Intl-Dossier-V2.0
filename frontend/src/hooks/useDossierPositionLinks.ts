/**
 * Dossier Position Links Hook
 * @module hooks/useDossierPositionLinks
 * @feature 026-unified-dossier-architecture
 * @feature 034-dossier-ui-polish
 *
 * Fetches position papers linked to a dossier with their link_type information.
 * Used in DossierPositionsTab to display positions with their relationship type badges.
 *
 * @description
 * This hook retrieves all position papers linked to a specific dossier through
 * the position_dossier_links junction table. Each link includes:
 * - Link type: 'primary', 'related', or 'reference'
 * - Link notes (optional)
 * - Full position paper data
 *
 * Supports filtering by:
 * - Link type
 * - Position status
 * - Text search across position title and content
 *
 * @example
 * // Basic usage
 * const { links, positions, isLoading } = useDossierPositionLinks('dossier-uuid');
 *
 * @example
 * // With filters
 * const { positions } = useDossierPositionLinks('dossier-uuid', {
 *   link_type: 'primary',
 *   status: 'approved',
 *   search: 'climate',
 * });
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Position } from '@/types/position'

/**
 * Represents a link between a dossier and a position paper
 * @property position_id - UUID of the linked position paper
 * @property dossier_id - UUID of the dossier
 * @property link_type - Relationship type: 'primary' (main topic), 'related' (supporting), or 'reference' (informational)
 * @property notes - Optional notes explaining the relationship
 * @property created_at - ISO timestamp of when the link was created
 * @property created_by - UUID of the user who created the link
 * @property position - Full position paper data
 */
export interface DossierPositionLink {
  position_id: string
  dossier_id: string
  link_type: 'primary' | 'related' | 'reference'
  notes?: string | null
  created_at: string
  created_by: string
  position: Position
}

/**
 * Filter options for the useDossierPositionLinks hook
 * @property link_type - Filter by relationship type
 * @property status - Filter by position approval status
 * @property search - Text search across position title and content fields
 */
export interface UseDossierPositionLinksFilters {
  link_type?: 'primary' | 'related' | 'reference'
  status?: string
  search?: string
}

/**
 * Return type of the useDossierPositionLinks hook
 * @property links - Array of position-dossier link records with full position data
 * @property positions - Convenience array of just the position papers (with link_type added)
 * @property totalCount - Total number of linked positions
 * @property isLoading - Whether the query is currently loading
 * @property error - Error object if the query failed
 * @property refetch - Function to manually refetch the data
 */
export interface UseDossierPositionLinksResult {
  links: DossierPositionLink[]
  positions: Position[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook to fetch position papers linked to a dossier
 *
 * @description
 * Fetches all positions linked to a dossier with their relationship metadata.
 * The hook returns both the full link records and a convenience array of
 * positions with the link_type injected for easy display.
 *
 * Cache behavior:
 * - staleTime: 2 minutes
 * - Automatically disabled when dossierId is falsy
 *
 * @param dossierId - The UUID of the dossier to fetch linked positions for
 * @param filters - Optional filters for link_type, status, and text search
 * @returns UseDossierPositionLinksResult with links, positions, and query state
 *
 * @example
 * // In a component
 * const { positions, isLoading, error } = useDossierPositionLinks(dossierId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return positions.map(pos => (
 *   <PositionCard key={pos.id} position={pos} linkType={pos.link_type} />
 * ));
 */
export function useDossierPositionLinks(
  dossierId: string,
  filters?: UseDossierPositionLinksFilters,
): UseDossierPositionLinksResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dossier-position-links', dossierId, filters],
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('position_dossier_links')
        .select(
          `
          position_id,
          dossier_id,
          link_type,
          notes,
          created_at,
          created_by,
          position:positions (
            id,
            title_en,
            title_ar,
            content_en,
            content_ar,
            rationale_en,
            rationale_ar,
            alignment_notes_en,
            alignment_notes_ar,
            thematic_category,
            status,
            position_type_id,
            current_stage,
            approval_chain_config,
            consistency_score,
            author_id,
            created_at,
            updated_at,
            version
          )
        `,
        )
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false })

      // Apply link_type filter
      if (filters?.link_type) {
        query = query.eq('link_type', filters.link_type)
      }

      const { data: links, error: queryError, count } = await query

      if (queryError) {
        throw new Error(queryError.message)
      }

      // Filter by position status if provided
      let filteredLinks = links || []
      if (filters?.status) {
        filteredLinks = filteredLinks.filter((link) => link.position?.status === filters.status)
      }

      // Filter by search query if provided
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredLinks = filteredLinks.filter((link) => {
          const position = link.position
          if (!position) return false
          return (
            position.title_en?.toLowerCase().includes(searchLower) ||
            position.title_ar?.toLowerCase().includes(searchLower) ||
            position.content_en?.toLowerCase().includes(searchLower) ||
            position.content_ar?.toLowerCase().includes(searchLower)
          )
        })
      }

      // Extract positions from links and add link_type as metadata
      const positions = filteredLinks
        .filter((link) => link.position)
        .map((link) => ({
          ...link.position,
          link_type: link.link_type, // Add link_type to position object
        })) as Position[]

      return {
        links: filteredLinks as DossierPositionLink[],
        positions,
        total_count: count || filteredLinks.length,
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!dossierId,
  })

  return {
    links: data?.links || [],
    positions: data?.positions || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
