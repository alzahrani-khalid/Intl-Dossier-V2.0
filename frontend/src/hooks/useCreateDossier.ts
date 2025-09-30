/**
 * TanStack Query mutation for creating dossiers
 *
 * Creates new dossier with optimistic update
 * On success: Invalidates dossiers list query, navigates to detail
 * On error: Rollback, show error toast
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';
import type { DossierCreate, Dossier } from '../types/dossier';
import { dossierKeys } from './useDossiers';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to create new dossier
 */
export const useCreateDossier = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: DossierCreate): Promise<Dossier> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dossiers-create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message_en || 'Failed to create dossier');
      }

      return response.json();
    },
    onMutate: async (newDossier) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dossierKeys.lists() });

      // Snapshot previous value
      const previousDossiers = queryClient.getQueryData(dossierKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(dossierKeys.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [
            {
              ...newDossier,
              id: 'temp-' + Date.now(),
              version: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              archived: false,
              tags: newDossier.tags || [],
            } as Dossier,
            ...old.data,
          ],
        };
      });

      return { previousDossiers };
    },
    onError: (err, newDossier, context) => {
      // Rollback to previous value
      if (context?.previousDossiers) {
        queryClient.setQueryData(dossierKeys.lists(), context.previousDossiers);
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch with real data
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });

      // Navigate to detail page
      navigate({ to: `/dossiers/${data.id}` });
    },
  });
};