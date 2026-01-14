/**
 * Engagement Context - React Query Hooks
 *
 * TanStack Query hooks for engagement operations.
 * These hooks provide the primary interface for React components
 * to interact with the engagement domain.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isOk, isDomainError } from '@/domains/shared'
import { engagementService } from '../services/engagement.service'
import type {
  EngagementFullProfile,
  EngagementCreate,
  EngagementUpdate,
  EngagementSearchParams,
} from '../types/engagement'
import type { EngagementParticipant, EngagementParticipantCreate } from '../types/participant'
import type {
  EngagementAgendaItem,
  EngagementAgendaItemCreate,
  EngagementAgendaItemUpdate,
} from '../types/agenda'
import type { EngagementListResponse } from '../repositories/engagement.repository'

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for engagements
 */
export const engagementKeys = {
  all: ['engagements'] as const,
  lists: () => [...engagementKeys.all, 'list'] as const,
  list: (params?: EngagementSearchParams) => [...engagementKeys.lists(), params] as const,
  details: () => [...engagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...engagementKeys.details(), id] as const,
  participants: (engagementId: string) =>
    [...engagementKeys.all, 'participants', engagementId] as const,
  agenda: (engagementId: string) => [...engagementKeys.all, 'agenda', engagementId] as const,
}

// ============================================================================
// List Engagements Hook
// ============================================================================

/**
 * Hook to list engagements with search and filters
 */
export function useEngagements(
  params?: EngagementSearchParams,
  options?: Omit<UseQueryOptions<EngagementListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementKeys.list(params),
    queryFn: async (): Promise<EngagementListResponse> => {
      const result = await engagementService.listEngagements(params)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Engagement Hook
// ============================================================================

/**
 * Hook to get a single engagement with full profile
 */
export function useEngagement(
  id: string,
  options?: Omit<UseQueryOptions<EngagementFullProfile, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementKeys.detail(id),
    queryFn: async (): Promise<EngagementFullProfile> => {
      const result = await engagementService.getEngagement(id)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

// ============================================================================
// Create Engagement Hook
// ============================================================================

/**
 * Hook to create a new engagement
 */
export function useCreateEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async (data: EngagementCreate): Promise<EngagementFullProfile> => {
      const result = await engagementService.createEngagement(data)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      if (data.engagement?.id) {
        queryClient.setQueryData(engagementKeys.detail(data.engagement.id), data)
      }
      toast.success(t('messages.created', { name: data.engagement?.name_en }))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.createError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Update Engagement Hook
// ============================================================================

/**
 * Hook to update an engagement
 */
export function useUpdateEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: EngagementUpdate
    }): Promise<EngagementFullProfile> => {
      const result = await engagementService.updateEngagement(id, updates)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: engagementKeys.detail(id) })
      const previousEngagement = queryClient.getQueryData<EngagementFullProfile>(
        engagementKeys.detail(id),
      )
      return { previousEngagement }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(engagementKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(engagementKeys.detail(id), context.previousEngagement)
      }
      const message = isDomainError(error)
        ? error.message
        : t('messages.updateError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Archive Engagement Hook
// ============================================================================

/**
 * Hook to archive (soft delete) an engagement
 */
export function useArchiveEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const result = await engagementService.archiveEngagement(id)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: engagementKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      toast.success(t('messages.archived'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.archiveError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Participants Hooks
// ============================================================================

/**
 * Hook to get participants for an engagement
 */
export function useEngagementParticipants(
  engagementId: string,
  options?: Omit<UseQueryOptions<EngagementParticipant[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementKeys.participants(engagementId),
    queryFn: async (): Promise<EngagementParticipant[]> => {
      const result = await engagementService.getParticipants(engagementId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!engagementId,
    ...options,
  })
}

/**
 * Hook to add a participant to an engagement
 */
export function useAddEngagementParticipant() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async ({
      engagementId,
      participant,
    }: {
      engagementId: string
      participant: EngagementParticipantCreate
    }): Promise<EngagementParticipant> => {
      const result = await engagementService.addParticipant(engagementId, participant)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({
        queryKey: engagementKeys.detail(engagementId),
      })
      queryClient.invalidateQueries({
        queryKey: engagementKeys.participants(engagementId),
      })
      toast.success(t('messages.participantAdded'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.participantAddError', { error: error.message })
      toast.error(message)
    },
  })
}

/**
 * Hook to remove a participant from an engagement
 */
export function useRemoveEngagementParticipant() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async ({
      engagementId,
      participantId,
    }: {
      engagementId: string
      participantId: string
    }): Promise<{ success: boolean }> => {
      const result = await engagementService.removeParticipant(engagementId, participantId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({
        queryKey: engagementKeys.detail(engagementId),
      })
      queryClient.invalidateQueries({
        queryKey: engagementKeys.participants(engagementId),
      })
      toast.success(t('messages.participantRemoved'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.participantRemoveError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Agenda Hooks
// ============================================================================

/**
 * Hook to get agenda items for an engagement
 */
export function useEngagementAgenda(
  engagementId: string,
  options?: Omit<UseQueryOptions<EngagementAgendaItem[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementKeys.agenda(engagementId),
    queryFn: async (): Promise<EngagementAgendaItem[]> => {
      const result = await engagementService.getAgenda(engagementId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!engagementId,
    ...options,
  })
}

/**
 * Hook to add an agenda item to an engagement
 */
export function useAddEngagementAgendaItem() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async ({
      engagementId,
      item,
    }: {
      engagementId: string
      item: EngagementAgendaItemCreate
    }): Promise<EngagementAgendaItem> => {
      const result = await engagementService.addAgendaItem(engagementId, item)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({
        queryKey: engagementKeys.detail(engagementId),
      })
      queryClient.invalidateQueries({
        queryKey: engagementKeys.agenda(engagementId),
      })
      toast.success(t('messages.agendaItemAdded'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.agendaItemAddError', { error: error.message })
      toast.error(message)
    },
  })
}

/**
 * Hook to update an agenda item
 */
export function useUpdateEngagementAgendaItem() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async ({
      engagementId,
      agendaId,
      updates,
    }: {
      engagementId: string
      agendaId: string
      updates: EngagementAgendaItemUpdate
    }): Promise<EngagementAgendaItem> => {
      const result = await engagementService.updateAgendaItem(engagementId, agendaId, updates)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({
        queryKey: engagementKeys.detail(engagementId),
      })
      queryClient.invalidateQueries({
        queryKey: engagementKeys.agenda(engagementId),
      })
      toast.success(t('messages.agendaItemUpdated'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.agendaItemUpdateError', { error: error.message })
      toast.error(message)
    },
  })
}

/**
 * Hook to remove an agenda item from an engagement
 */
export function useRemoveEngagementAgendaItem() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async ({
      engagementId,
      agendaId,
    }: {
      engagementId: string
      agendaId: string
    }): Promise<{ success: boolean }> => {
      const result = await engagementService.removeAgendaItem(engagementId, agendaId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({
        queryKey: engagementKeys.detail(engagementId),
      })
      queryClient.invalidateQueries({
        queryKey: engagementKeys.agenda(engagementId),
      })
      toast.success(t('messages.agendaItemRemoved'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.agendaItemRemoveError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Cache Invalidation Helper
// ============================================================================

/**
 * Hook to invalidate all engagement queries
 */
export function useInvalidateEngagements() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: engagementKeys.all })
  }
}
