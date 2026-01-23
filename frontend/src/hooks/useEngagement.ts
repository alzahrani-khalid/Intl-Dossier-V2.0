/**
 * Engagement Hook (Basic)
 * @module hooks/useEngagement
 * @feature 026-unified-dossier-architecture
 * @feature 028-type-specific-dossier-pages
 *
 * TanStack Query hook for fetching a single engagement dossier with automatic caching
 * and real-time updates using unified dossier architecture.
 *
 * @description
 * This module provides a simplified React hook for fetching engagement entities:
 * - Query hook for fetching a single engagement by ID
 * - Automatic JOIN between dossiers and engagements tables
 * - Flattened data structure for easier consumption
 * - Automatic caching and cache invalidation via TanStack Query
 *
 * Note: For full CRUD operations, see useEngagements.ts
 *
 * @example
 * // Fetch a single engagement
 * const { data, isLoading } = useEngagement('engagement-uuid-123');
 *
 * @example
 * // Access engagement data
 * if (data) {
 *   console.log(data.name_en); // "Annual Summit"
 *   console.log(data.engagement_type); // "conference"
 *   console.log(data.engagement_category); // "multilateral"
 * }
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Engagement entity with flattened dossier and engagement data
 *
 * @interface Engagement
 * @property {string} id - Unique identifier (UUID) from dossiers table
 * @property {string} name_en - English name of the engagement
 * @property {string} name_ar - Arabic name of the engagement
 * @property {string} [description_en] - Optional English description
 * @property {string} [description_ar] - Optional Arabic description
 * @property {string} engagement_type - Type: meeting, consultation, coordination, workshop, conference, site_visit, ceremony
 * @property {string} engagement_category - Category: bilateral, multilateral, regional, internal
 * @property {string} [location_en] - Optional English location
 * @property {string} [location_ar] - Optional Arabic location
 * @property {string} status - Dossier status (active, archived, etc.)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 * @property {string} [created_by] - Optional UUID of user who created the engagement
 * @property {string} [updated_by] - Optional UUID of user who last updated the engagement
 */
export interface Engagement {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  engagement_type: 'meeting' | 'consultation' | 'coordination' | 'workshop' | 'conference' | 'site_visit' | 'ceremony';
  engagement_category: 'bilateral' | 'multilateral' | 'regional' | 'internal';
  location_en?: string;
  location_ar?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Hook to fetch a single engagement by ID
 *
 * @description
 * Fetches an engagement entity from the database using a JOIN between the dossiers
 * and engagements tables. The result is automatically flattened into a single object.
 * The query is cached using TanStack Query with the key ['engagement', engagementId].
 *
 * The query is automatically enabled when engagementId is truthy and disabled when falsy,
 * preventing unnecessary API calls.
 *
 * @param {string} engagementId - The unique identifier (UUID) of the engagement to fetch
 * @returns {UseQueryResult<Engagement>} TanStack Query result with data typed as Engagement
 *
 * @throws {Error} Throws if the database query fails or engagement is not found
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useEngagement('uuid-123');
 *
 * @example
 * // Conditional fetching
 * const engagementId = params.id;
 * const { data } = useEngagement(engagementId); // Auto-disabled if engagementId is undefined
 *
 * @example
 * // With loading and error states
 * const { data, isLoading, error } = useEngagement('uuid-123');
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <EngagementDetails engagement={data} />;
 */
export function useEngagement(engagementId: string) {
  return useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: async () => {
      // Query with JOIN to get dossier data
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          name_en,
          name_ar,
          description_en,
          description_ar,
          status,
          created_at,
          updated_at,
          created_by,
          updated_by,
          engagements!inner (
            engagement_type,
            engagement_category,
            location_en,
            location_ar
          )
        `)
        .eq('id', engagementId)
        .eq('type', 'engagement')
        .single();

      if (error) throw error;

      // Flatten the joined data structure
      const flattenedData: Engagement = {
        id: data.id,
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en,
        description_ar: data.description_ar,
        engagement_type: (data.engagements as any).engagement_type,
        engagement_category: (data.engagements as any).engagement_category,
        location_en: (data.engagements as any).location_en,
        location_ar: (data.engagements as any).location_ar,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        updated_by: data.updated_by,
      };

      return flattenedData;
    },
    enabled: !!engagementId,
  });
}
