/**
 * Contact Relationship Hooks
 * Part of: 027-contact-directory Phase 6
 *
 * TanStack Query hooks for contact relationship operations with automatic caching,
 * invalidation, and optimistic updates.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createRelationship,
  getRelationshipsForContact,
  getRelationshipStats,
  type RelationshipResponse,
  type CreateRelationshipInput,
  type RelationshipStats,
  RelationshipAPIError,
} from '@/services/contact-relationship-api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

/**
 * Query Keys Factory
 */
export const relationshipKeys = {
  all: ['contact-relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (contactId: string) => [...relationshipKeys.lists(), contactId] as const,
  stats: (contactId: string) => [...relationshipKeys.all, 'stats', contactId] as const,
}

/**
 * Hook to fetch relationships for a contact
 */
export function useRelationships(
  contactId: string,
  options?: Omit<
    UseQueryOptions<RelationshipResponse[], RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.list(contactId),
    queryFn: () => getRelationshipsForContact(contactId),
    enabled: !!contactId,
    ...options,
  })
}

/**
 * Hook to get relationship statistics for a contact
 */
export function useRelationshipStats(
  contactId: string,
  options?: Omit<UseQueryOptions<RelationshipStats, RelationshipAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: relationshipKeys.stats(contactId),
    queryFn: () => getRelationshipStats(contactId),
    enabled: !!contactId,
    ...options,
  })
}

/**
 * Hook to create a new relationship
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('contacts')

  return useMutation({
    mutationFn: (input: CreateRelationshipInput) => createRelationship(input),
    onSuccess: (data) => {
      // Invalidate relationship lists for both contacts
      queryClient.invalidateQueries({ queryKey: relationshipKeys.list(data.from_contact_id) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.list(data.to_contact_id) })

      // Invalidate stats for both contacts
      queryClient.invalidateQueries({ queryKey: relationshipKeys.stats(data.from_contact_id) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.stats(data.to_contact_id) })

      toast.success(t('contactDirectory.relationships.created_success'))
    },
    onError: (error: RelationshipAPIError) => {
      toast.error(t('contactDirectory.relationships.created_error', { error: error.message }))
    },
  })
}
