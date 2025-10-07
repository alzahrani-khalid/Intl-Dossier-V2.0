/**
 * useEngagement Hook
 *
 * Fetches a single engagement by ID with real-time updates
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Engagement {
  id: string;
  dossier_id: string;
  title: string;
  engagement_type: 'meeting' | 'consultation' | 'coordination' | 'workshop' | 'conference' | 'site_visit' | 'other';
  engagement_date: string;
  location?: string;
  description?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export function useEngagement(engagementId: string) {
  return useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagements')
        .select('*')
        .eq('id', engagementId)
        .single();

      if (error) throw error;
      return data as Engagement;
    },
    enabled: !!engagementId,
  });
}
