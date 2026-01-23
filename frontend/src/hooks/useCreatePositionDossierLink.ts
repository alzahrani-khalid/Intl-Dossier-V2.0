/**
 * Create Position-Dossier Link Hook
 * @module hooks/useCreatePositionDossierLink
 * @feature position-dossier-linking
 *
 * TanStack Query mutation hook for creating position-dossier relationships with
 * automatic cache invalidation.
 *
 * @description
 * This module provides a React hook for creating position-dossier links:
 * - Mutation hook for linking a dossier to a position
 * - Support for link types (primary, related, reference)
 * - Optional notes field for relationship context
 * - Automatic cache invalidation on success
 * - Authentication token management
 *
 * @example
 * // Create a primary link
 * const { mutate: createLink, isPending } = useCreatePositionDossierLink('position-uuid');
 * createLink({
 *   dossier_id: 'dossier-uuid',
 *   link_type: 'primary',
 *   notes: 'Main country focus for this position',
 * });
 *
 * @example
 * // Create a reference link without notes
 * const { mutate } = useCreatePositionDossierLink(positionId);
 * mutate({ dossier_id: dossierId, link_type: 'reference' });
 */

// T067: useCreatePositionDossierLink mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Input parameters for creating a position-dossier link
 */
export interface CreatePositionDossierLinkInput {
  /** Dossier UUID to link */
  dossier_id: string;
  /** Type of relationship (defaults to 'related' if not specified) */
  link_type?: 'primary' | 'related' | 'reference';
  /** Optional notes explaining the relationship */
  notes?: string;
}

/**
 * Hook to create a position-dossier link
 *
 * @description
 * Creates a relationship between a position and a dossier via the positions-dossiers-create
 * edge function. Automatically invalidates the position-dossier-links query on success to
 * reflect the new link. Requires authentication and validates the dossier exists.
 *
 * @param positionId - The position UUID to create the link for
 * @returns TanStack Mutation result with mutate function accepting CreatePositionDossierLinkInput
 *
 * @example
 * const { mutate: createLink, isPending } = useCreatePositionDossierLink('uuid-123');
 *
 * // Create a primary link with notes
 * createLink({
 *   dossier_id: 'dossier-uuid',
 *   link_type: 'primary',
 *   notes: 'This position directly addresses this country',
 * });
 *
 * @example
 * // Create a reference link from dropdown selection
 * const { mutate } = useCreatePositionDossierLink(positionId);
 *
 * const handleAddDossier = (dossierId: string, type: string) => {
 *   mutate(
 *     {
 *       dossier_id: dossierId,
 *       link_type: type as 'primary' | 'related' | 'reference',
 *     },
 *     {
 *       onSuccess: () => {
 *         toast.success('Dossier linked successfully');
 *         closeModal();
 *       },
 *       onError: (error) => {
 *         toast.error(`Failed to link: ${error.message}`);
 *       },
 *     }
 *   );
 * };
 *
 * @example
 * // Create link with loading state
 * const { mutate, isPending } = useCreatePositionDossierLink(positionId);
 *
 * return (
 *   <Form onSubmit={(data) => mutate(data)}>
 *     <DossierSelect name="dossier_id" />
 *     <Select name="link_type" options={['primary', 'related', 'reference']} />
 *     <TextArea name="notes" placeholder="Optional notes..." />
 *     <Button type="submit" disabled={isPending}>
 *       {isPending ? 'Linking...' : 'Link Dossier'}
 *     </Button>
 *   </Form>
 * );
 *
 * @example
 * // Bulk link creation
 * const { mutateAsync } = useCreatePositionDossierLink(positionId);
 *
 * const handleBulkLink = async (dossierIds: string[]) => {
 *   for (const dossierId of dossierIds) {
 *     await mutateAsync({
 *       dossier_id: dossierId,
 *       link_type: 'related',
 *     });
 *   }
 *   toast.success(`${dossierIds.length} dossiers linked`);
 * };
 */
export function useCreatePositionDossierLink(positionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePositionDossierLinkInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/positions-dossiers-create?positionId=${positionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create position-dossier link');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate position-dossier links query to refetch
      queryClient.invalidateQueries({ queryKey: ['position-dossier-links', positionId] });
    },
  });
}
