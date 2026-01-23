/**
 * Create Relationship Hook
 * @module hooks/useCreateRelationship
 * @feature 026-unified-dossier-architecture (T064)
 *
 * TanStack Query mutation hook for creating dossier relationships.
 *
 * @description
 * This hook provides a mutation function for creating parent-child relationships
 * between dossiers. It handles authentication, API calls to the dossiers-relationships-create
 * Edge Function, and automatic cache invalidation.
 *
 * Supported relationship types:
 * - member_of: Organization membership
 * - participates_in: Forum/event participation
 * - collaborates_with: Collaboration relationships
 * - monitors: Monitoring relationships
 * - is_member: Membership relationships
 * - hosts: Hosting relationships
 *
 * @example
 * // Create organization membership
 * const { mutate } = useCreateRelationship('country-uuid');
 *
 * mutate({
 *   child_dossier_id: 'org-uuid',
 *   relationship_type: 'member_of',
 *   relationship_strength: 'primary',
 *   established_date: '2024-01-01',
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Input data for creating a relationship
 *
 * @property child_dossier_id - UUID of the child dossier in the relationship
 * @property relationship_type - Type of relationship being created
 * @property relationship_strength - Optional strength indicator (primary, secondary, observer)
 * @property established_date - Optional ISO date when relationship was established
 * @property end_date - Optional ISO date when relationship ended (null for active)
 * @property notes - Optional notes about the relationship
 */
export interface CreateRelationshipInput {
  child_dossier_id: string;
  relationship_type: 'member_of' | 'participates_in' | 'collaborates_with' | 'monitors' | 'is_member' | 'hosts';
  relationship_strength?: 'primary' | 'secondary' | 'observer';
  established_date?: string;
  end_date?: string | null;
  notes?: string | null;
}

/**
 * Hook to create a relationship between parent and child dossiers
 *
 * @description
 * Creates a new parent-child relationship via the dossiers-relationships-create Edge Function.
 * On success, automatically invalidates the relationships query cache to trigger refetch.
 *
 * @param parentDossierId - UUID of the parent dossier in the relationship
 * @returns TanStack Mutation result with mutate function accepting CreateRelationshipInput
 *
 * @example
 * const { mutate, isLoading, error } = useCreateRelationship('country-uuid');
 *
 * mutate({
 *   child_dossier_id: 'organization-uuid',
 *   relationship_type: 'member_of',
 *   relationship_strength: 'primary',
 * });
 *
 * @example
 * // With date ranges
 * mutate({
 *   child_dossier_id: 'forum-uuid',
 *   relationship_type: 'participates_in',
 *   established_date: '2024-01-01',
 *   end_date: '2024-12-31',
 *   notes: 'Annual participation',
 * });
 */
export function useCreateRelationship(parentDossierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRelationshipInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/dossiers-relationships-create?dossierId=${parentDossierId}`,
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
        throw new Error(error.error || 'Failed to create relationship');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relationships query to refetch
      queryClient.invalidateQueries({ queryKey: ['relationships', parentDossierId] });
    },
  });
}
