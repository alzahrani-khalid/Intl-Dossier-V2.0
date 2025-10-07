/**
 * TanStack Query mutation for archiving dossiers
 *
 * Archives (soft delete) dossier
 * On success: Invalidates dossiers list, navigates to hub, shows toast
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';
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
 * Hook to archive dossier
 */
export const useArchiveDossier = (dossierId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dossiers-archive`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: dossierId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message_en || 'Failed to archive dossier');
      }

      // 204 No Content response
      if (response.status !== 204) {
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.detail(dossierId) });

      // Navigate to hub
      navigate({ to: '/dossiers' });
    },
  });
};