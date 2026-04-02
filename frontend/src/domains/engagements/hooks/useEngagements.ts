/**
 * Engagements Hook (Domain)
 * @module domains/engagements/hooks/useEngagements
 *
 * Comprehensive TanStack Query hooks for engagement dossier management.
 * Delegates API calls to engagements.repository.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as engagementsRepo from '../repositories/engagements.repository'
import type {
  EngagementFullProfile,
  EngagementCreate,
  EngagementUpdate,
  EngagementSearchParams,
  EngagementListResponse,
  EngagementParticipant,
  EngagementParticipantCreate,
  EngagementAgendaItem,
  EngagementAgendaItemCreate,
  EngagementAgendaItemUpdate,
} from '@/types/engagement.types'

// ============================================================================
// Query Keys
// ============================================================================

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

export function useEngagements(
  params?: EngagementSearchParams,
  options?: Omit<UseQueryOptions<EngagementListResponse, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery<EngagementListResponse, Error>> {
  return useQuery({
    queryKey: engagementKeys.list(params),
    queryFn: async (): Promise<EngagementListResponse> => {
      return engagementsRepo.getEngagements(params)
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Engagement Hook
// ============================================================================

export function useEngagement(
  id: string,
  options?: Omit<UseQueryOptions<EngagementFullProfile, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery<EngagementFullProfile, Error>> {
  return useQuery({
    queryKey: engagementKeys.detail(id),
    queryFn: async (): Promise<EngagementFullProfile> => {
      return engagementsRepo.getEngagement(id)
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

export function useCreateEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async (data: EngagementCreate): Promise<EngagementFullProfile> => {
      return engagementsRepo.createEngagement(data)
    },
    onSuccess: (data: EngagementFullProfile) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      if (data.engagement?.id) {
        queryClient.setQueryData(engagementKeys.detail(data.engagement.id), data)
      }
      toast.success(t('messages.created', { name: data.engagement?.name_en }))
    },
    onError: (error: Error) => {
      toast.error(t('messages.createError', { error: error.message }))
    },
  })
}

// ============================================================================
// Update Engagement Hook
// ============================================================================

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
      return engagementsRepo.updateEngagement(id, updates)
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
    onError: (error, { id }, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(engagementKeys.detail(id), context.previousEngagement)
      }
      toast.error(t('messages.updateError', { error: (error as Error).message }))
    },
  })
}

// ============================================================================
// Archive Engagement Hook
// ============================================================================

export function useArchiveEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagements')

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      return engagementsRepo.archiveEngagement(id)
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: engagementKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      toast.success(t('messages.archived'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.archiveError', { error: error.message }))
    },
  })
}

// ============================================================================
// Participants Hooks
// ============================================================================

export function useEngagementParticipants(
  engagementId: string,
  options?: Omit<UseQueryOptions<{ data: EngagementParticipant[] }, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: engagementKeys.participants(engagementId),
    queryFn: async (): Promise<{ data: EngagementParticipant[] }> => {
      return engagementsRepo.getParticipants(engagementId)
    },
    enabled: !!engagementId,
    ...options,
  })
}

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
      return engagementsRepo.addParticipant(engagementId, participant)
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.participants(engagementId) })
      toast.success(t('messages.participantAdded'))
    },
    onError: (error) => {
      toast.error(t('messages.participantAddError', { error: (error as Error).message }))
    },
  })
}

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
      return engagementsRepo.removeParticipant(engagementId, participantId)
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.participants(engagementId) })
      toast.success(t('messages.participantRemoved'))
    },
    onError: (error) => {
      toast.error(t('messages.participantRemoveError', { error: (error as Error).message }))
    },
  })
}

// ============================================================================
// Agenda Hooks
// ============================================================================

export function useEngagementAgenda(
  engagementId: string,
  options?: Omit<UseQueryOptions<{ data: EngagementAgendaItem[] }, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: engagementKeys.agenda(engagementId),
    queryFn: async (): Promise<{ data: EngagementAgendaItem[] }> => {
      return engagementsRepo.getAgenda(engagementId)
    },
    enabled: !!engagementId,
    ...options,
  })
}

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
      return engagementsRepo.addAgendaItem(engagementId, item)
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.agenda(engagementId) })
      toast.success(t('messages.agendaItemAdded'))
    },
    onError: (error) => {
      toast.error(t('messages.agendaItemAddError', { error: (error as Error).message }))
    },
  })
}

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
      return engagementsRepo.updateAgendaItem(engagementId, agendaId, updates)
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.agenda(engagementId) })
      toast.success(t('messages.agendaItemUpdated'))
    },
    onError: (error) => {
      toast.error(t('messages.agendaItemUpdateError', { error: (error as Error).message }))
    },
  })
}

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
      return engagementsRepo.removeAgendaItem(engagementId, agendaId)
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.agenda(engagementId) })
      toast.success(t('messages.agendaItemRemoved'))
    },
    onError: (error) => {
      toast.error(t('messages.agendaItemRemoveError', { error: (error as Error).message }))
    },
  })
}

// ============================================================================
// Cache Invalidation Helper
// ============================================================================

export function useInvalidateEngagements(): () => void {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: engagementKeys.all })
  }
}
