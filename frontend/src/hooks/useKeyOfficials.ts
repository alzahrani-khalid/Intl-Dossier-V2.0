/**
 * Key Officials Hook
 * @module hooks/useKeyOfficials
 * @feature 029-dynamic-country-intelligence (User Story 6 - T083)
 * @feature 034-dossier-ui-polish
 *
 * Fetches person dossiers related to a country dossier.
 * Uses dossier_relationships table to find persons linked to the country.
 *
 * @description
 * This hook retrieves all person dossiers that have a relationship with a given
 * country dossier. It queries the dossier_relationships table to find connections,
 * then fetches the full person dossier data for display in the Key Officials section.
 *
 * The hook:
 * 1. Queries dossier_relationships for active relationships involving the country
 * 2. Extracts person dossier IDs from those relationships
 * 3. Fetches full person dossier data filtered by dossier_type='person'
 * 4. Returns sorted by most recently updated
 *
 * Cache behavior:
 * - staleTime: 5 minutes (data considered fresh)
 * - gcTime: 10 minutes (garbage collection)
 * - Automatically disabled when countryId is falsy
 *
 * @example
 * // Basic usage in KeyOfficials section
 * const { data: officials, isLoading, error } = useKeyOfficials({
 *   countryId: 'country-uuid-123',
 * });
 *
 * @example
 * // With conditional enabling
 * const { data } = useKeyOfficials({
 *   countryId,
 *   enabled: isTabActive && !!countryId,
 * });
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Person dossier data structure returned by the hook
 * @property id - Unique identifier (UUID) of the person dossier
 * @property name_en - English name of the person
 * @property name_ar - Arabic name of the person
 * @property title_en - English job title (optional)
 * @property title_ar - Arabic job title (optional)
 * @property description_en - English biography/description (optional)
 * @property description_ar - Arabic biography/description (optional)
 * @property status - Dossier status ('active', 'inactive', 'archived')
 * @property photo_url - URL to person's photo (optional)
 * @property created_at - ISO timestamp of creation
 * @property updated_at - ISO timestamp of last update
 */
export interface PersonDossier {
  id: string
  name_en: string
  name_ar: string
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  status?: string
  photo_url?: string
  created_at: string
  updated_at: string
}

/**
 * Options for the useKeyOfficials hook
 * @property countryId - UUID of the country dossier to find related persons for
 * @property enabled - Whether the query should be enabled (default: true)
 */
export interface UseKeyOfficialsOptions {
  countryId: string
  enabled?: boolean
}

/**
 * Hook to fetch key officials (persons) related to a country
 *
 * @description
 * Fetches person dossiers that have relationships with the specified country.
 * Uses a two-step query: first fetches relationships, then fetches person data.
 *
 * @param options - Hook configuration options
 * @param options.countryId - Required country dossier UUID
 * @param options.enabled - Optional flag to enable/disable the query
 * @returns TanStack Query result with PersonDossier array
 *
 * @example
 * const { data, isLoading, error, refetch } = useKeyOfficials({
 *   countryId: 'country-uuid',
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorState error={error} />;
 * if (!data?.length) return <EmptyState />;
 *
 * return data.map(person => <PersonCard key={person.id} person={person} />);
 */
export function useKeyOfficials({ countryId, enabled = true }: UseKeyOfficialsOptions) {
  return useQuery({
    queryKey: ['key-officials', countryId],
    queryFn: async (): Promise<PersonDossier[]> => {
      // Query person dossiers related to this country via dossier_relationships
      // First, get all relationship IDs where source or target is the country
      const { data: relationships, error: relError } = await supabase
        .from('dossier_relationships')
        .select('source_dossier_id, target_dossier_id')
        .or(`source_dossier_id.eq.${countryId},target_dossier_id.eq.${countryId}`)
        .eq('status', 'active')

      if (relError) {
        throw new Error(`Failed to fetch relationships: ${relError.message}`)
      }

      if (!relationships || relationships.length === 0) {
        return []
      }

      // Extract person dossier IDs (the ones that are NOT the country ID)
      const personIds = relationships
        .map((rel) =>
          rel.source_dossier_id === countryId ? rel.target_dossier_id : rel.source_dossier_id,
        )
        .filter((id) => id !== countryId)

      if (personIds.length === 0) {
        return []
      }

      // Fetch person dossiers by IDs
      const { data: persons, error: personError } = await supabase
        .from('dossiers')
        .select('*')
        .in('id', personIds)
        .eq('dossier_type', 'person')
        .order('updated_at', { ascending: false })

      if (personError) {
        throw new Error(`Failed to fetch person dossiers: ${personError.message}`)
      }

      return persons || []
    },
    enabled: enabled && !!countryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}
