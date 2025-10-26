/**
 * useEngagement Hook
 *
 * Fetches a single engagement by ID with real-time updates
 * Uses unified dossier architecture with JOIN
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
