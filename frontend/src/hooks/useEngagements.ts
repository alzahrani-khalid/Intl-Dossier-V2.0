import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Engagement {
  id: string;
  dossier_id: string;
  title: string;
  engagement_type: string;
  engagement_date: string;
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface UseEngagementsParams {
  dossierId?: string;
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
      let query = supabase
        .from('engagements')
        .select('*', { count: 'exact' })
        .order('engagement_date', { ascending: false });

      // Filter by dossier if provided
      if (params?.dossierId) {
        query = query.eq('dossier_id', params.dossierId);
      }

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

      return {
        items: data || [],
        total: count || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
