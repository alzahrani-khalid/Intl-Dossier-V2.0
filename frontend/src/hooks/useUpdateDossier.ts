/**
 * TanStack Query mutation for updating dossiers
 *
 * Updates dossier with version check (optimistic locking)
 * On 409 Conflict: Shows ConflictDialog with remote data
 * On success: Invalidates dossier query, shows success toast
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DossierUpdate, Dossier, ConflictError } from '../types/dossier';
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
 * Custom error class for version conflicts
 */
export class VersionConflictError extends Error {
  constructor(
    message: string,
    public currentVersion: number,
    public conflictData: ConflictError
  ) {
    super(message);
    this.name = 'VersionConflictError';
  }
}

/**
 * Hook to update dossier
 */
export const useUpdateDossier = (dossierId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DossierUpdate): Promise<Dossier> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dossiers-update`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: dossierId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle version conflict specially
        if (response.status === 409) {
          throw new VersionConflictError(
            error.error?.message_en || 'Version conflict',
            error.error?.current_version,
            error
          );
        }

        throw new Error(error.error?.message_en || 'Failed to update dossier');
      }

      return response.json();
    },
    onMutate: async (updatedData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dossierKeys.detail(dossierId) });

      // Snapshot previous value
      const previousDossier = queryClient.getQueryData(dossierKeys.detail(dossierId));

      // Optimistically update
      queryClient.setQueryData(dossierKeys.detail(dossierId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...updatedData,
          version: updatedData.version,
          updated_at: new Date().toISOString(),
        };
      });

      return { previousDossier };
    },
    onError: (err, updatedData, context) => {
      // Rollback on error (except version conflicts, which should show dialog)
      if (!(err instanceof VersionConflictError) && context?.previousDossier) {
        queryClient.setQueryData(dossierKeys.detail(dossierId), context.previousDossier);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch with real data
      queryClient.invalidateQueries({ queryKey: dossierKeys.detail(dossierId) });
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
    },
  });
};