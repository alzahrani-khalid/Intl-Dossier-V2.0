/**
 * Engagements Hook
 * Feature: engagements-entity-management
 *
 * Comprehensive TanStack Query hooks for engagement dossier management:
 * - List engagements with search/filters
 * - Get single engagement with full profile
 * - Create/update/archive engagements
 * - Manage participants and agenda items
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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

// API Base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

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
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (params?.search) searchParams.set('search', params.search)
      if (params?.engagement_type) searchParams.set('engagement_type', params.engagement_type)
      if (params?.engagement_category)
        searchParams.set('engagement_category', params.engagement_category)
      if (params?.engagement_status) searchParams.set('engagement_status', params.engagement_status)
      if (params?.host_country_id) searchParams.set('host_country_id', params.host_country_id)
      if (params?.start_date) searchParams.set('start_date', params.start_date)
      if (params?.end_date) searchParams.set('end_date', params.end_date)
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))

      const response = await fetch(`${API_BASE_URL}/engagement-dossiers?${searchParams}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch engagements')
      }

      return response.json()
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
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-dossiers/${id}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch engagement')
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
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-dossiers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to create engagement')
      }

      return response.json()
    },
    onSuccess: (data) => {
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
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-dossiers/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update engagement')
      }

      return response.json()
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
      toast.error(t('messages.updateError', { error: error.message }))
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
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-dossiers/${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to archive engagement')
      }

      return response.json()
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

/**
 * Hook to get participants for an engagement
 */
export function useEngagementParticipants(
  engagementId: string,
  options?: Omit<UseQueryOptions<{ data: EngagementParticipant[] }, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementKeys.participants(engagementId),
    queryFn: async (): Promise<{ data: EngagementParticipant[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-dossiers/${engagementId}/participants`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch participants')
      }

      return response.json()
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
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-dossiers/${engagementId}/participants`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(participant),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to add participant')
      }

      return response.json()
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.participants(engagementId) })
      toast.success(t('messages.participantAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.participantAddError', { error: error.message }))
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
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-dossiers/${engagementId}/participants?participant_id=${participantId}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to remove participant')
      }

      return response.json()
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.participants(engagementId) })
      toast.success(t('messages.participantRemoved'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.participantRemoveError', { error: error.message }))
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
  options?: Omit<UseQueryOptions<{ data: EngagementAgendaItem[] }, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementKeys.agenda(engagementId),
    queryFn: async (): Promise<{ data: EngagementAgendaItem[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-dossiers/${engagementId}/agenda`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch agenda')
      }

      return response.json()
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
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-dossiers/${engagementId}/agenda`, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to add agenda item')
      }

      return response.json()
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.agenda(engagementId) })
      toast.success(t('messages.agendaItemAdded'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.agendaItemAddError', { error: error.message }))
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
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-dossiers/${engagementId}/agenda?agenda_id=${agendaId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updates),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update agenda item')
      }

      return response.json()
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.agenda(engagementId) })
      toast.success(t('messages.agendaItemUpdated'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.agendaItemUpdateError', { error: error.message }))
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
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-dossiers/${engagementId}/agenda?agenda_id=${agendaId}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to remove agenda item')
      }

      return response.json()
    },
    onSuccess: (_, { engagementId }) => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementKeys.agenda(engagementId) })
      toast.success(t('messages.agendaItemRemoved'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.agendaItemRemoveError', { error: error.message }))
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
