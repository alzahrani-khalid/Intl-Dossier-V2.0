/**
 * Contact Relationship Hooks
 * @module hooks/useContactRelationships
 * @feature 027-contact-directory (Phase 6)
 *
 * TanStack Query hooks for contact-to-contact relationship CRUD operations.
 *
 * @description
 * This module provides hooks for managing relationships between contacts in the directory:
 * - Query hooks for fetching relationships and statistics
 * - Mutation hooks for create and delete operations with optimistic updates
 * - Automatic cache invalidation for bidirectional relationships
 * - Toast notifications with i18n support
 *
 * Contact relationships are distinct from dossier relationships and track
 * person-to-person connections within the contact directory.
 *
 * @example
 * // Fetch relationships for a contact
 * const { data } = useRelationships('contact-uuid');
 *
 * @example
 * // Get relationship statistics
 * const { data } = useRelationshipStats('contact-uuid');
 * console.log(data?.total_relationships);
 *
 * @example
 * // Create a new relationship
 * const { mutate } = useCreateRelationship();
 * mutate({
 *   from_contact_id: 'contact-1-uuid',
 *   to_contact_id: 'contact-2-uuid',
 *   relationship_type: 'colleague',
 * });
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  createRelationship,
  getRelationshipsForContact,
  deleteRelationship,
  getRelationshipStats,
  type RelationshipResponse,
  type CreateRelationshipInput,
  type RelationshipStats,
  RelationshipAPIError,
} from '@/services/contact-relationship-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Query Keys Factory for contact relationship queries
 *
 * @description
 * Provides hierarchical keys for TanStack Query cache management of contact relationships.
 *
 * @example
 * // Invalidate all contact relationship queries
 * queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
 */
export const relationshipKeys = {
  all: ['contact-relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (contactId: string) => [...relationshipKeys.lists(), contactId] as const,
  stats: (contactId: string) => [...relationshipKeys.all, 'stats', contactId] as const,
};

/**
 * Hook to fetch relationships for a contact
 *
 * @description
 * Fetches all relationships where the contact is either the source or target.
 * Results include bidirectional relationships and relationship metadata.
 *
 * @param contactId - UUID of the contact to fetch relationships for
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with array of RelationshipResponse
 *
 * @example
 * const { data, isLoading } = useRelationships('contact-uuid');
 *
 * data?.forEach(rel => {
 *   console.log(`${rel.from_contact.name} → ${rel.to_contact.name}`);
 *   console.log(`Type: ${rel.relationship_type}`);
 * });
 */
export function useRelationships(
  contactId: string,
  options?: Omit<UseQueryOptions<RelationshipResponse[], RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: relationshipKeys.list(contactId),
    queryFn: () => getRelationshipsForContact(contactId),
    enabled: !!contactId,
    ...options,
  });
}

/**
 * Hook to get relationship statistics for a contact
 *
 * @description
 * Fetches aggregate statistics about a contact's relationships including total count
 * and breakdown by relationship type.
 *
 * @param contactId - UUID of the contact to fetch statistics for
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with RelationshipStats
 *
 * @example
 * const { data } = useRelationshipStats('contact-uuid');
 *
 * console.log(`Total: ${data?.total_relationships}`);
 * console.log(`Colleagues: ${data?.by_type?.colleague}`);
 */
export function useRelationshipStats(
  contactId: string,
  options?: Omit<UseQueryOptions<RelationshipStats, RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: relationshipKeys.stats(contactId),
    queryFn: () => getRelationshipStats(contactId),
    enabled: !!contactId,
    ...options,
  });
}

/**
 * Hook to create a new contact relationship
 *
 * @description
 * Creates a new relationship between two contacts with automatic cache invalidation
 * and toast notifications. Invalidates relationship lists and stats for both contacts.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateRelationshipInput
 *
 * @example
 * const { mutate, isLoading } = useCreateRelationship();
 *
 * mutate({
 *   from_contact_id: 'contact-1-uuid',
 *   to_contact_id: 'contact-2-uuid',
 *   relationship_type: 'colleague',
 *   notes: 'Work together on project X',
 * });
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: (input: CreateRelationshipInput) => createRelationship(input),
    onSuccess: (data) => {
      // Invalidate relationship lists for both contacts
      queryClient.invalidateQueries({ queryKey: relationshipKeys.list(data.from_contact_id) });
      queryClient.invalidateQueries({ queryKey: relationshipKeys.list(data.to_contact_id) });

      // Invalidate stats for both contacts
      queryClient.invalidateQueries({ queryKey: relationshipKeys.stats(data.from_contact_id) });
      queryClient.invalidateQueries({ queryKey: relationshipKeys.stats(data.to_contact_id) });

      toast.success(t('contactDirectory.relationships.created_success'));
    },
    onError: (error: RelationshipAPIError) => {
      toast.error(t('contactDirectory.relationships.created_error', { error: error.message }));
    },
  });
}

/**
 * Hook to delete a contact relationship
 *
 * @description
 * Deletes a relationship with optimistic cache updates and automatic rollback on error.
 * On success, invalidates all relationship queries to refetch updated data.
 *
 * @returns TanStack Mutation result with mutate function accepting relationshipId string
 *
 * @example
 * const { mutate, isLoading } = useDeleteRelationship();
 * mutate('relationship-uuid');
 *
 * @example
 * // With confirmation
 * const handleDelete = (relationshipId: string) => {
 *   if (confirm('Delete this relationship?')) {
 *     mutate(relationshipId);
 *   }
 * };
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: (relationshipId: string) => deleteRelationship(relationshipId),
    onMutate: async (relationshipId) => {
      // Find all relationship queries to update optimistically
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: relationshipKeys.lists() });

      // Store previous values for rollback
      const previousData: Record<string, RelationshipResponse[]> = {};

      queries.forEach((query) => {
        const data = query.state.data as RelationshipResponse[] | undefined;
        if (data) {
          previousData[query.queryKey.join('|')] = data;

          // Optimistically remove the relationship
          const updated = data.filter((rel) => rel.id !== relationshipId);
          queryClient.setQueryData(query.queryKey, updated);
        }
      });

      return { previousData };
    },
    onSuccess: () => {
      // Invalidate all relationship queries to refetch
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all });

      toast.success(t('contactDirectory.relationships.deleted_success'));
    },
    onError: (error: RelationshipAPIError, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([key, data]) => {
          const queryKey = key.split('|');
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(t('contactDirectory.relationships.deleted_error', { error: error.message }));
    },
  });
}

/**
 * Hook to invalidate all relationship queries
 *
 * @description
 * Returns a function to invalidate all contact relationship queries.
 * Useful after bulk operations or external changes that affect relationships.
 *
 * @returns Function to invalidate all contact relationship queries
 *
 * @example
 * const invalidate = useInvalidateRelationships();
 *
 * const handleBulkImport = async () => {
 *   await importContactRelationships(data);
 *   invalidate(); // Refresh all relationship data
 * };
 */
export function useInvalidateRelationships() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
  };
}
