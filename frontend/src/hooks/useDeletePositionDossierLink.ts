/**
 * Delete Position-Dossier Link Hook
 * @module hooks/useDeletePositionDossierLink
 * @feature position-dossier-linking
 *
 * TanStack Query mutation hook for deleting position-dossier relationships with
 * automatic cache invalidation.
 *
 * @description
 * This module provides a React hook for deleting position-dossier links:
 * - Mutation hook for removing dossier-position relationships
 * - Automatic cache invalidation on success
 * - Authentication token management
 * - Error handling for failed deletions
 *
 * @example
 * // Delete a position-dossier link
 * const { mutate: deleteLink, isPending } = useDeletePositionDossierLink();
 * deleteLink({
 *   positionId: 'position-uuid',
 *   dossierId: 'dossier-uuid',
 * });
 *
 * @example
 * // Delete with confirmation
 * const { mutate } = useDeletePositionDossierLink();
 * const handleDelete = () => {
 *   if (confirm('Remove this dossier link?')) {
 *     mutate({ positionId, dossierId });
 *   }
 * };
 */

// T068: useDeletePositionDossierLink mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Input parameters for deleting a position-dossier link
 */
export interface DeletePositionDossierLinkInput {
  /** Position UUID the link belongs to */
  positionId: string;
  /** Dossier UUID to unlink */
  dossierId: string;
}

/**
 * Hook to delete a position-dossier link
 *
 * @description
 * Deletes a relationship between a position and a dossier via the positions-dossiers-delete
 * edge function. Automatically invalidates the position-dossier-links query on success to
 * reflect the removal. Requires authentication and validates both position and dossier exist.
 *
 * @returns TanStack Mutation result with mutate function accepting DeletePositionDossierLinkInput
 *
 * @example
 * const { mutate: deleteLink, isPending } = useDeletePositionDossierLink();
 *
 * // Delete a link
 * deleteLink({
 *   positionId: 'position-uuid',
 *   dossierId: 'dossier-uuid',
 * });
 *
 * @example
 * // Delete with confirmation dialog
 * const { mutate, isPending } = useDeletePositionDossierLink();
 *
 * const handleDelete = (positionId: string, dossierId: string, dossierName: string) => {
 *   showConfirmDialog({
 *     title: 'Remove Dossier Link',
 *     message: `Are you sure you want to unlink "${dossierName}"?`,
 *     onConfirm: () => {
 *       mutate(
 *         { positionId, dossierId },
 *         {
 *           onSuccess: () => {
 *             toast.success('Dossier unlinked successfully');
 *           },
 *           onError: (error) => {
 *             toast.error(`Failed to unlink: ${error.message}`);
 *           },
 *         }
 *       );
 *     },
 *   });
 * };
 *
 * @example
 * // Delete with loading state in list
 * const { mutate, isPending } = useDeletePositionDossierLink();
 *
 * return (
 *   <LinksList>
 *     {links.map(link => (
 *       <LinkItem key={link.id}>
 *         <DossierName>{link.dossier?.name_en}</DossierName>
 *         <Button
 *           variant="danger"
 *           size="sm"
 *           onClick={() => mutate({
 *             positionId: link.position_id,
 *             dossierId: link.dossier_id,
 *           })}
 *           disabled={isPending}
 *         >
 *           Remove
 *         </Button>
 *       </LinkItem>
 *     ))}
 *   </LinksList>
 * );
 *
 * @example
 * // Bulk delete with sequential operations
 * const { mutateAsync } = useDeletePositionDossierLink();
 *
 * const handleBulkDelete = async (positionId: string, dossierIds: string[]) => {
 *   for (const dossierId of dossierIds) {
 *     await mutateAsync({ positionId, dossierId });
 *   }
 *   toast.success(`${dossierIds.length} dossier links removed`);
 * };
 *
 * @example
 * // Delete with error handling
 * const { mutate, error, isError } = useDeletePositionDossierLink();
 *
 * useEffect(() => {
 *   if (isError) {
 *     showErrorAlert({
 *       title: 'Deletion Failed',
 *       message: error?.message || 'Unknown error occurred',
 *     });
 *   }
 * }, [isError, error]);
 */
export function useDeletePositionDossierLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeletePositionDossierLinkInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        positionId: input.positionId,
        dossierId: input.dossierId,
      });

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/positions-dossiers-delete?${params.toString()}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete position-dossier link');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate position-dossier links query to refetch
      queryClient.invalidateQueries({ queryKey: ['position-dossier-links', variables.positionId] });
    },
  });
}
