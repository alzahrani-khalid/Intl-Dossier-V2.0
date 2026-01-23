/**
 * Archive Dossier Mutation Hook
 * @module hooks/useArchiveDossier
 * @feature 026-unified-dossier-architecture
 *
 * TanStack Query mutation hook for archiving (soft deleting) dossiers with
 * automatic cache invalidation and navigation.
 *
 * @description
 * This hook provides a mutation function to archive a dossier. Archiving is
 * implemented as a soft delete - the dossier is marked as archived but not
 * removed from the database.
 *
 * Features:
 * - Soft delete implementation
 * - Automatic cache invalidation for list and detail queries
 * - Automatic navigation to dossier hub after success
 * - Error handling with descriptive messages
 * - Authentication through Supabase session
 *
 * Side effects on success:
 * 1. Invalidates dossier list queries
 * 2. Invalidates the specific dossier detail query
 * 3. Navigates user to /dossiers hub
 *
 * @example
 * // In a dossier detail page
 * const { mutate: archiveDossier, isPending } = useArchiveDossier(dossierId);
 *
 * const handleArchive = () => {
 *   if (confirm('Archive this dossier?')) {
 *     archiveDossier();
 *   }
 * };
 *
 * return (
 *   <Button onClick={handleArchive} disabled={isPending}>
 *     {isPending ? 'Archiving...' : 'Archive Dossier'}
 *   </Button>
 * );
 *
 * @example
 * // With error handling
 * const { mutate, isPending, error } = useArchiveDossier(dossierId);
 *
 * return (
 *   <div>
 *     {error && <Alert>{error.message}</Alert>}
 *     <Button onClick={() => mutate()}>Archive</Button>
 *   </div>
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';
import { dossierKeys } from './useDossiers';

/**
 * API base URL for Edge Functions
 * @internal
 */
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Get authentication headers from Supabase session
 * @returns Headers object with Content-Type and Authorization
 * @internal
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to archive a dossier (soft delete)
 *
 * @description
 * Creates a TanStack Query mutation for archiving a specific dossier. The
 * mutation automatically handles cache invalidation and navigation after
 * successful archival.
 *
 * The hook uses the dossiers-archive Edge Function which sets the dossier's
 * status to 'archived' rather than deleting it from the database.
 *
 * @param dossierId - UUID of the dossier to archive
 * @returns TanStack Query mutation result with mutate function
 *
 * @example
 * // Basic usage
 * const { mutate: archiveDossier } = useArchiveDossier(dossierId);
 * archiveDossier();
 *
 * @example
 * // With loading state
 * const { mutate, isPending } = useArchiveDossier(dossierId);
 * <Button onClick={() => mutate()} loading={isPending}>
 *   Archive
 * </Button>
 *
 * @example
 * // With confirmation dialog
 * const { mutate } = useArchiveDossier(dossierId);
 * const handleArchive = async () => {
 *   const confirmed = await confirm('Archive this dossier?');
 *   if (confirmed) mutate();
 * };
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