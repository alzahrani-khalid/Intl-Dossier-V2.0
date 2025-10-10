// T069: useDocuments hook
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Document {
  id: string;
  owner_type: string;
  owner_id: string;
  document_type: string;
  title_en?: string;
  title_ar?: string;
  storage_path: string;
  file_size?: number;
  mime_type?: string;
  metadata?: Record<string, any>;
  uploaded_by: string;
  created_at: string;
}

export interface UseDocumentsFilters {
  owner_type?: string;
  owner_id?: string;
  document_type?: string;
}

export interface UseDocumentsResult {
  documents: Document[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDocuments(filters?: UseDocumentsFilters): UseDocumentsResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.owner_type) {
        params.append('owner_type', filters.owner_type);
      }
      if (filters?.owner_id) {
        params.append('owner_id', filters.owner_id);
      }
      if (filters?.document_type) {
        params.append('document_type', filters.document_type);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/documents-get?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch documents');
      }

      const result = await response.json();
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(filters?.owner_type && filters?.owner_id),
  });

  return {
    documents: data?.documents || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
