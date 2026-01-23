/**
 * Delete Relationship Hook
 * @module hooks/useDeleteRelationship
 * @feature 026-unified-dossier-architecture (T065)
 *
 * TanStack Query mutation hook for deleting dossier relationships.
 *
 * @description
 * This hook provides a mutation function for deleting relationships between dossiers.
 * It handles authentication, API calls to the dossiers-relationships-delete Edge Function,
 * and automatic cache invalidation for both parent and child dossiers.
 *
 * The deletion can be filtered by relationship type to remove specific types while
 * preserving others between the same two dossiers.
 *
 * @example
 * // Delete any relationship between two dossiers
 * const { mutate } = useDeleteRelationship();
 *
 * mutate({
 *   parentId: 'country-uuid',
 *   childId: 'org-uuid',
 * });
 *
 * @example
 * // Delete specific relationship type only
 * mutate({
 *   parentId: 'country-uuid',
 *   childId: 'forum-uuid',
 *   relationshipType: 'participates_in',
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Input data for deleting a relationship
 *
 * @property parentId - UUID of the parent dossier
 * @property childId - UUID of the child dossier
 * @property relationshipType - Optional specific relationship type to delete
 */
export interface DeleteRelationshipInput {
  parentId: string;
  childId: string;
  relationshipType?: string;
}

/**
 * Hook to delete a relationship between dossiers
 *
 * @description
 * Deletes a relationship via the dossiers-relationships-delete Edge Function.
 * On success, automatically invalidates relationship query caches for both dossiers
 * to trigger refetch and update the UI.
 *
 * @returns TanStack Mutation result with mutate function accepting DeleteRelationshipInput
 *
 * @example
 * const { mutate, isLoading } = useDeleteRelationship();
 *
 * mutate({
 *   parentId: 'country-uuid',
 *   childId: 'organization-uuid',
 * });
 *
 * @example
 * // Delete specific relationship type
 * mutate({
 *   parentId: 'country-uuid',
 *   childId: 'forum-uuid',
 *   relationshipType: 'participates_in',
 * });
 *
 * @example
 * // With confirmation
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     mutate({ parentId, childId });
 *   }
 * };
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteRelationshipInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        parentId: input.parentId,
        childId: input.childId,
      });

      if (input.relationshipType) {
        params.append('relationshipType', input.relationshipType);
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/dossiers-relationships-delete?${params.toString()}`,
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
        throw new Error(error.error || 'Failed to delete relationship');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relationships queries for both parent and child dossiers
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.childId] });
    },
  });
}
