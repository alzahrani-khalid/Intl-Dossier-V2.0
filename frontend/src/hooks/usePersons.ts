/**
 * Persons Hook
 * Feature: persons-entity-management
 *
 * Comprehensive TanStack Query hooks for person entity management:
 * - List persons with search/filters
 * - Get single person with full profile
 * - Create/update/archive persons
 * - Manage roles, affiliations, relationships
 * - Get relationship network for visualization
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  PersonDossier,
  PersonFullProfile,
  PersonCreate,
  PersonUpdate,
  PersonSearchParams,
  PersonListResponse,
  PersonListItem,
  PersonRole,
  PersonRoleCreate,
  PersonAffiliation,
  PersonAffiliationCreate,
  PersonRelationship,
  PersonRelationshipCreate,
  PersonNetwork,
} from '@/types/person.types'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ============================================================================
// Query Keys
// ============================================================================

export const personKeys = {
  all: ['persons'] as const,
  lists: () => [...personKeys.all, 'list'] as const,
  list: (params?: PersonSearchParams) => [...personKeys.lists(), params] as const,
  details: () => [...personKeys.all, 'detail'] as const,
  detail: (id: string) => [...personKeys.details(), id] as const,
  network: (id: string, depth?: number) => [...personKeys.all, 'network', id, depth] as const,
  roles: (personId: string) => [...personKeys.all, 'roles', personId] as const,
  affiliations: (personId: string) => [...personKeys.all, 'affiliations', personId] as const,
  relationships: (personId: string) => [...personKeys.all, 'relationships', personId] as const,
}

// ============================================================================
// Auth Helper
// ============================================================================

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// ============================================================================
// List Persons Hook
// ============================================================================

/**
 * Hook to list persons with search and filters
 */
export function usePersons(
  params?: PersonSearchParams,
  options?: Omit<UseQueryOptions<PersonListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: personKeys.list(params),
    queryFn: async (): Promise<PersonListResponse> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (params?.search) searchParams.set('search', params.search)
      if (params?.organization_id) searchParams.set('organization_id', params.organization_id)
      if (params?.nationality_id) searchParams.set('nationality_id', params.nationality_id)
      if (params?.importance_level)
        searchParams.set('importance_level', String(params.importance_level))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))

      const response = await fetch(`${API_BASE_URL}/persons?${searchParams}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch persons')
      }

      return response.json()
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Person Hook
// ============================================================================

/**
 * Hook to get a single person with full profile
 */
export function usePerson(
  id: string,
  options?: Omit<UseQueryOptions<PersonFullProfile, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: async (): Promise<PersonFullProfile> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${id}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch person')
      }

      return response.json()
    },
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

// ============================================================================
// Person Network Hook
// ============================================================================

/**
 * Hook to get person's relationship network for visualization
 */
export function usePersonNetwork(
  id: string,
  depth: number = 1,
  options?: Omit<UseQueryOptions<PersonNetwork, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: personKeys.network(id, depth),
    queryFn: async (): Promise<PersonNetwork> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${id}/network?depth=${depth}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch network')
      }

      return response.json()
    },
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  })
}

// ============================================================================
// Create Person Hook
// ============================================================================

/**
 * Hook to create a new person
 */
export function useCreatePerson() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async (data: PersonCreate): Promise<PersonDossier> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to create person')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: personKeys.lists() })
      queryClient.setQueryData(personKeys.detail(data.id), data)
      toast.success(t('messages.created', { name: data.name_en }))
    },
    onError: (error: Error) => {
      toast.error(t('messages.createError', { error: error.message }))
    },
  })
}

// ============================================================================
// Update Person Hook
// ============================================================================

/**
 * Hook to update a person
 */
export function useUpdatePerson() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: PersonUpdate
    }): Promise<PersonFullProfile> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update person')
      }

      return response.json()
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: personKeys.detail(id) })
      const previousPerson = queryClient.getQueryData<PersonFullProfile>(personKeys.detail(id))

      if (previousPerson) {
        queryClient.setQueryData<PersonFullProfile>(personKeys.detail(id), {
          ...previousPerson,
          person: { ...previousPerson.person, ...updates, updated_at: new Date().toISOString() },
        })
      }

      return { previousPerson }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(personKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: personKeys.lists() })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousPerson) {
        queryClient.setQueryData(personKeys.detail(id), context.previousPerson)
      }
      toast.error(t('messages.updateError', { error: error.message }))
    },
  })
}

// ============================================================================
// Archive Person Hook
// ============================================================================

/**
 * Hook to archive (soft delete) a person
 */
export function useArchivePerson() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to archive person')
      }

      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: personKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: personKeys.lists() })
      toast.success(t('messages.archived'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.archiveError', { error: error.message }))
    },
  })
}

// ============================================================================
// Person Roles Hooks
// ============================================================================

/**
 * Hook to add a role to a person
 */
export function useAddPersonRole() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      personId,
      role,
    }: {
      personId: string
      role: PersonRoleCreate
    }): Promise<PersonRole> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${personId}/roles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(role),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to add role')
      }

      return response.json()
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.roles(personId) })
      toast.success(t('messages.roleAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.roleAddError', { error: error.message }))
    },
  })
}

/**
 * Hook to delete a role from a person
 */
export function useDeletePersonRole() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      personId,
      roleId,
    }: {
      personId: string
      roleId: string
    }): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${personId}/roles?role_id=${roleId}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to delete role')
      }

      return response.json()
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.roles(personId) })
      toast.success(t('messages.roleDeleted'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.roleDeleteError', { error: error.message }))
    },
  })
}

// ============================================================================
// Person Affiliations Hooks
// ============================================================================

/**
 * Hook to add an affiliation to a person
 */
export function useAddPersonAffiliation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      personId,
      affiliation,
    }: {
      personId: string
      affiliation: PersonAffiliationCreate
    }): Promise<PersonAffiliation> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${personId}/affiliations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(affiliation),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to add affiliation')
      }

      return response.json()
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.affiliations(personId) })
      toast.success(t('messages.affiliationAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.affiliationAddError', { error: error.message }))
    },
  })
}

/**
 * Hook to delete an affiliation from a person
 */
export function useDeletePersonAffiliation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      personId,
      affiliationId,
    }: {
      personId: string
      affiliationId: string
    }): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/persons/${personId}/affiliations?affiliation_id=${affiliationId}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to delete affiliation')
      }

      return response.json()
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.affiliations(personId) })
      toast.success(t('messages.affiliationDeleted'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.affiliationDeleteError', { error: error.message }))
    },
  })
}

// ============================================================================
// Person Relationships Hooks
// ============================================================================

/**
 * Hook to add a relationship between persons
 */
export function useAddPersonRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      personId,
      relationship,
    }: {
      personId: string
      relationship: PersonRelationshipCreate
    }): Promise<PersonRelationship> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/persons/${personId}/relationships`, {
        method: 'POST',
        headers,
        body: JSON.stringify(relationship),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to add relationship')
      }

      return response.json()
    },
    onSuccess: (_, { personId, relationship }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.detail(relationship.to_person_id) })
      queryClient.invalidateQueries({ queryKey: personKeys.relationships(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.network(personId) })
      toast.success(t('messages.relationshipAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.relationshipAddError', { error: error.message }))
    },
  })
}

/**
 * Hook to delete a relationship
 */
export function useDeletePersonRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: async ({
      personId,
      relationshipId,
    }: {
      personId: string
      relationshipId: string
    }): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/persons/${personId}/relationships?relationship_id=${relationshipId}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to delete relationship')
      }

      return response.json()
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.relationships(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.network(personId) })
      toast.success(t('messages.relationshipDeleted'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.relationshipDeleteError', { error: error.message }))
    },
  })
}

// ============================================================================
// Cache Invalidation Helper
// ============================================================================

/**
 * Hook to invalidate all person queries
 */
export function useInvalidatePersons() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: personKeys.all })
  }
}
