/**
 * Key Officials Hook (Feature 029 - User Story 6 - T083)
 *
 * Fetches person dossiers related to a country dossier.
 * Uses dossier_relationships to find persons linked to the country.
 * Includes caching and error handling via TanStack Query.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PersonDossier {
  id: string;
  name_en: string;
  name_ar: string;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  status?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UseKeyOfficialsOptions {
  countryId: string;
  enabled?: boolean;
}

export function useKeyOfficials({
  countryId,
  enabled = true,
}: UseKeyOfficialsOptions) {
  return useQuery({
    queryKey: ['key-officials', countryId],
    queryFn: async (): Promise<PersonDossier[]> => {
      // Query person dossiers related to this country via dossier_relationships
      // First, get all relationship IDs where source or target is the country
      const { data: relationships, error: relError } = await supabase
        .from('dossier_relationships')
        .select('source_dossier_id, target_dossier_id')
        .or(`source_dossier_id.eq.${countryId},target_dossier_id.eq.${countryId}`)
        .eq('status', 'active');

      if (relError) {
        throw new Error(`Failed to fetch relationships: ${relError.message}`);
      }

      if (!relationships || relationships.length === 0) {
        return [];
      }

      // Extract person dossier IDs (the ones that are NOT the country ID)
      const personIds = relationships
        .map((rel) =>
          rel.source_dossier_id === countryId
            ? rel.target_dossier_id
            : rel.source_dossier_id
        )
        .filter((id) => id !== countryId);

      if (personIds.length === 0) {
        return [];
      }

      // Fetch person dossiers by IDs
      const { data: persons, error: personError } = await supabase
        .from('dossiers')
        .select('*')
        .in('id', personIds)
        .eq('dossier_type', 'person')
        .order('updated_at', { ascending: false });

      if (personError) {
        throw new Error(`Failed to fetch person dossiers: ${personError.message}`);
      }

      return persons || [];
    },
    enabled: enabled && !!countryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
