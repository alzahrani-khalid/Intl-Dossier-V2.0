// T063: useRelationships hook
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DossierRelationship {
  parent_dossier_id: string;
  child_dossier_id: string;
  relationship_type: 'member_of' | 'participates_in' | 'collaborates_with' | 'monitors' | 'is_member' | 'hosts';
  relationship_strength?: 'primary' | 'secondary' | 'observer';
  status: 'active' | 'archived';
  established_date?: string;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  child_dossier?: {
    id: string;
    name_en: string;
    name_ar: string;
    reference_type: string;
    status: string;
  };
  parent_dossier?: {
    id: string;
    name_en: string;
    name_ar: string;
    reference_type: string;
    status: string;
  };
}

export interface UseRelationshipsFilters {
  relationship_type?: string;
  direction?: 'parent' | 'child' | 'both';
}

export interface UseRelationshipsResult {
  relationships: DossierRelationship[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRelationships(
  dossierId: string,
  filters?: UseRelationshipsFilters
): UseRelationshipsResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['relationships', dossierId, filters],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams({ dossierId });
      if (filters?.relationship_type) {
        params.append('relationship_type', filters.relationship_type);
      }
      if (filters?.direction) {
        params.append('direction', filters.direction);
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call Edge Function
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/dossiers-relationships-get?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch relationships');
      }

      const result = await response.json();
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!dossierId,
  });

  return {
    relationships: data?.relationships || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
