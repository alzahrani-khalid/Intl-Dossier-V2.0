/**
 * Persons Hooks
 * @module domains/persons/hooks/usePersons
 *
 * TanStack Query hooks for person entity management.
 * All API calls route through the persons repository.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as PersonsRepo from '../repositories/persons.repository'
import type {
  PersonDossier,
  PersonFullProfile,
  PersonCreate,
  PersonUpdate,
  PersonSearchParams,
  PersonListResponse,
  PersonRole,
  PersonRoleCreate,
  PersonAffiliation,
  PersonAffiliationCreate,
  PersonRelationship,
  PersonRelationshipCreate,
  PersonNetwork,
} from '@/types/person.types'

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
// List Persons Hook
// ============================================================================

export function usePersons(
  params?: PersonSearchParams,
  options?: Omit<UseQueryOptions<PersonListResponse, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: personKeys.list(params),
    queryFn: () => PersonsRepo.getPersons(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Person Hook
// ============================================================================

export function usePerson(
  id: string,
  options?: Omit<UseQueryOptions<PersonFullProfile, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: () => PersonsRepo.getPerson(id),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

// ============================================================================
// Person Network Hook
// ============================================================================

export function usePersonNetwork(
  id: string,
  depth: number = 1,
  options?: Omit<UseQueryOptions<PersonNetwork, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: personKeys.network(id, depth),
    queryFn: () => PersonsRepo.getPersonNetwork(id, depth),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  })
}

// ============================================================================
// Create Person Hook
// ============================================================================

export function useCreatePerson(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: (data: PersonCreate) => PersonsRepo.createPerson(data),
    onSuccess: (data: PersonDossier) => {
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

export function useUpdatePerson(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PersonUpdate }) =>
      PersonsRepo.updatePerson(id, updates),
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
    onSuccess: (data: PersonFullProfile, { id }) => {
      queryClient.setQueryData(personKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: personKeys.lists() })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error, { id }, context) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousPerson' in context &&
        context.previousPerson
      ) {
        queryClient.setQueryData(personKeys.detail(id), context.previousPerson)
      }
      toast.error(t('messages.updateError', { error: error.message }))
    },
  })
}

// ============================================================================
// Archive Person Hook
// ============================================================================

export function useArchivePerson(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: (id: string) => PersonsRepo.archivePerson(id),
    onSuccess: (_: unknown, id: string) => {
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

export function useAddPersonRole(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({ personId, role }: { personId: string; role: PersonRoleCreate }) =>
      PersonsRepo.addPersonRole(personId, role),
    onSuccess: (_: PersonRole, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.roles(personId) })
      toast.success(t('messages.roleAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.roleAddError', { error: error.message }))
    },
  })
}

export function useDeletePersonRole(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({ personId, roleId }: { personId: string; roleId: string }) =>
      PersonsRepo.deletePersonRole(personId, roleId),
    onSuccess: (_: unknown, { personId }) => {
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

export function useAddPersonAffiliation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({
      personId,
      affiliation,
    }: {
      personId: string
      affiliation: PersonAffiliationCreate
    }) => PersonsRepo.addPersonAffiliation(personId, affiliation),
    onSuccess: (_: PersonAffiliation, { personId }) => {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(personId) })
      queryClient.invalidateQueries({ queryKey: personKeys.affiliations(personId) })
      toast.success(t('messages.affiliationAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.affiliationAddError', { error: error.message }))
    },
  })
}

export function useDeletePersonAffiliation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({
      personId,
      affiliationId,
    }: {
      personId: string
      affiliationId: string
    }) => PersonsRepo.deletePersonAffiliation(personId, affiliationId),
    onSuccess: (_: unknown, { personId }) => {
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

export function useAddPersonRelationship(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({
      personId,
      relationship,
    }: {
      personId: string
      relationship: PersonRelationshipCreate
    }) => PersonsRepo.addPersonRelationship(personId, relationship),
    onSuccess: (_: PersonRelationship, { personId, relationship }) => {
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

export function useDeletePersonRelationship(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('persons')

  return useMutation({
    mutationFn: ({
      personId,
      relationshipId,
    }: {
      personId: string
      relationshipId: string
    }) => PersonsRepo.deletePersonRelationship(personId, relationshipId),
    onSuccess: (_: unknown, { personId }) => {
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

export function useInvalidatePersons(): () => void {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: personKeys.all })
  }
}
