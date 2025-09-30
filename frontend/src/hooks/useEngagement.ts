import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types based on API spec
export interface Engagement {
  id: string;
  dossier_id: string;
  title: string;
  engagement_type: 'meeting' | 'consultation' | 'coordination' | 'workshop' | 'conference' | 'site_visit' | 'other';
  engagement_date: string;
  location?: string | null;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEngagementRequest {
  dossier_id: string;
  title: string;
  engagement_type: 'meeting' | 'consultation' | 'coordination' | 'workshop' | 'conference' | 'site_visit' | 'other';
  engagement_date: string;
  location?: string;
  description?: string;
}

export interface UpdateEngagementRequest {
  title?: string;
  engagement_type?: 'meeting' | 'consultation' | 'coordination' | 'workshop' | 'conference' | 'site_visit' | 'other';
  engagement_date?: string;
  location?: string;
  description?: string;
}

// Fetch single engagement by ID
export function useEngagement(id: string | undefined) {
  return useQuery({
    queryKey: ['engagement', id],
    queryFn: async () => {
      if (!id) throw new Error('Engagement ID is required');

      const { data, error } = await supabase.functions.invoke('engagements-get', {
        body: { id },
      });

      if (error) throw error;
      return data as Engagement;
    },
    enabled: !!id,
  });
}

// Fetch engagements list for a dossier
export function useEngagements(dossierId: string | undefined, options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['engagements', dossierId, options],
    queryFn: async () => {
      if (!dossierId) throw new Error('Dossier ID is required');

      const { data, error } = await supabase.functions.invoke('engagements-list', {
        body: { dossier_id: dossierId, ...options },
      });

      if (error) throw error;
      return data as { data: Engagement[]; total: number; limit: number; offset: number };
    },
    enabled: !!dossierId,
  });
}

// Create engagement mutation
export function useCreateEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateEngagementRequest) => {
      const { data, error } = await supabase.functions.invoke('engagements-create', {
        body: request,
      });

      if (error) throw error;
      return data as Engagement;
    },
    onSuccess: (data) => {
      // Invalidate engagements list for the dossier
      queryClient.invalidateQueries({ queryKey: ['engagements', data.dossier_id] });
      // Set the single engagement in cache
      queryClient.setQueryData(['engagement', data.id], data);
    },
  });
}

// Update engagement mutation
export function useUpdateEngagement(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateEngagementRequest) => {
      const { data, error } = await supabase.functions.invoke('engagements-update', {
        body: { id, ...request },
      });

      if (error) throw error;
      return data as Engagement;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['engagement', id] });

      // Snapshot previous value
      const previousEngagement = queryClient.getQueryData<Engagement>(['engagement', id]);

      // Optimistically update
      if (previousEngagement) {
        queryClient.setQueryData(['engagement', id], {
          ...previousEngagement,
          ...newData,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousEngagement };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousEngagement) {
        queryClient.setQueryData(['engagement', id], context.previousEngagement);
      }
    },
    onSuccess: (data) => {
      // Update cache with server data
      queryClient.setQueryData(['engagement', id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['engagements', data.dossier_id] });
    },
  });
}
