/**
 * useDossierPositionLinks Hook
 *
 * Fetches positions linked to a dossier with their link_type information
 * Used in DossierPositionsTab to show link type badges
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Position } from '@/types/position';

export interface DossierPositionLink {
  position_id: string;
  dossier_id: string;
  link_type: 'primary' | 'related' | 'reference';
  notes?: string | null;
  created_at: string;
  created_by: string;
  position: Position;
}

export interface UseDossierPositionLinksFilters {
  link_type?: 'primary' | 'related' | 'reference';
  status?: string;
  search?: string;
}

export interface UseDossierPositionLinksResult {
  links: DossierPositionLink[];
  positions: Position[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDossierPositionLinks(
  dossierId: string,
  filters?: UseDossierPositionLinksFilters
): UseDossierPositionLinksResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dossier-position-links', dossierId, filters],
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('position_dossier_links')
        .select(`
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
        `)
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false });

      // Apply link_type filter
      if (filters?.link_type) {
        query = query.eq('link_type', filters.link_type);
      }

      const { data: links, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Filter by position status if provided
      let filteredLinks = links || [];
      if (filters?.status) {
        filteredLinks = filteredLinks.filter(
          (link) => link.position?.status === filters.status
        );
      }

      // Filter by search query if provided
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLinks = filteredLinks.filter((link) => {
          const position = link.position;
          if (!position) return false;
          return (
            position.title_en?.toLowerCase().includes(searchLower) ||
            position.title_ar?.toLowerCase().includes(searchLower) ||
            position.content_en?.toLowerCase().includes(searchLower) ||
            position.content_ar?.toLowerCase().includes(searchLower)
          );
        });
      }

      // Extract positions from links and add link_type as metadata
      const positions = filteredLinks
        .filter((link) => link.position)
        .map((link) => ({
          ...link.position,
          link_type: link.link_type, // Add link_type to position object
        })) as Position[];

      return {
        links: filteredLinks as DossierPositionLink[],
        positions,
        total_count: count || filteredLinks.length,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!dossierId,
  });

  return {
    links: data?.links || [],
    positions: data?.positions || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
