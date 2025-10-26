import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Engagement {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  engagement_type: string;
  engagement_category: string;
  location_en?: string;
  location_ar?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UseEngagementsParams {
  limit?: number;
  offset?: number;
}

interface EngagementsResponse {
  items: Engagement[];
  total: number;
}

export function useEngagements(params?: UseEngagementsParams) {
  return useQuery<EngagementsResponse, Error>({
    queryKey: ['engagements', params],
    queryFn: async () => {
      // Query with JOIN to get dossier data
      let query = supabase
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
          engagements!inner (
            engagement_type,
            engagement_category,
            location_en,
            location_ar
          )
        `, { count: 'exact' })
        .eq('type', 'engagement')
        .order('created_at', { ascending: false });

      // Apply pagination
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      if (params?.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Flatten the joined data structure
      const flattenedData = (data || []).map((item: any) => ({
        id: item.id,
        name_en: item.name_en,
        name_ar: item.name_ar,
        description_en: item.description_en,
        description_ar: item.description_ar,
        engagement_type: item.engagements.engagement_type,
        engagement_category: item.engagements.engagement_category,
        location_en: item.engagements.location_en,
        location_ar: item.engagements.location_ar,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return {
        items: flattenedData,
        total: count || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
