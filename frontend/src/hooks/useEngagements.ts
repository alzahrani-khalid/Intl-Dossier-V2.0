/**
 * Engagement Management Hooks
 * @module hooks/useEngagements
 * @feature engagements-entity-management
 * @feature 026-unified-dossier-architecture
 * @feature 035-dossier-context
 *
 * Comprehensive TanStack Query hooks for engagement dossier CRUD operations with automatic
 * caching, cache invalidation, optimistic updates, and toast notifications.
 *
 * @description
 * This module provides a complete set of React hooks for managing engagement dossiers:
 * - Query hooks for fetching lists and single engagements with full profiles
 * - Mutation hooks for create, update, and archive operations with optimistic updates
 * - Participant management hooks for adding/removing engagement participants
 * - Agenda item management hooks for CRUD operations on engagement agenda
 * - Cache invalidation utilities for manual cache management
 * - Automatic toast notifications for all mutation operations
 *
 * All hooks use Supabase Edge Functions for server-side logic and validation.
 *
 * @example
 * // Fetch list of engagements with filters
 * const { data, isLoading } = useEngagements({
 *   engagement_type: 'conference',
 *   engagement_status: 'upcoming',
 *   search: 'Summit',
 *   page: 1,
 *   limit: 20,
 * });
 *
 * @example
 * // Fetch single engagement with full profile
 * const { data } = useEngagement('engagement-uuid');
 * // data includes participants, agenda, documents, etc.
 *
 * @example
 * // Create a new engagement
 * const { mutate } = useCreateEngagement();
 * mutate({
 *   name_en: 'Annual Summit',
 *   name_ar: 'القمة السنوية',
 *   engagement_type: 'conference',
 *   engagement_category: 'multilateral',
 *   start_date: '2024-06-01',
 *   end_date: '2024-06-03',
 * });
 *
 * @example
 * // Add participant to engagement
 * const { mutate } = useAddEngagementParticipant();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   participant: {
 *     dossier_id: 'person-uuid',
 *     role: 'speaker',
 *     participant_type: 'individual',
 *   },
 * });
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

/**
 * Query Keys Factory for engagement-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation and efficient
 * cache updates for engagement entities and related data.
 *
 * @example
 * // Invalidate all engagement queries
 * queryClient.invalidateQueries({ queryKey: engagementKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: engagementKeys.lists() });
 *
 * @example
 * // Invalidate specific engagement detail
 * queryClient.invalidateQueries({ queryKey: engagementKeys.detail('uuid') });
 *
 * @example
 * // Invalidate participants for a specific engagement
 * queryClient.invalidateQueries({ queryKey: engagementKeys.participants('uuid') });
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
// Auth Helper
// ============================================================================

/**
 * Helper function to get authenticated headers for Edge Function requests
 *
 * @description
 * Retrieves the current Supabase session and constructs headers with
 * the access token for authenticated API requests to Edge Functions.
 *
 * @returns {Promise<Object>} Headers object with Content-Type and Authorization
 * @private
 */
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
 *
 * @description
 * Fetches a paginated list of engagements with optional filtering by type, category,
 * status, host country, date range, and search query. Results are cached based on
 * filter parameters. Automatically handles authentication and error states.
 *
 * @param {EngagementSearchParams} [params] - Optional search and filter parameters
 * @param {string} [params.search] - Free-text search in names and descriptions
 * @param {string} [params.engagement_type] - Filter by engagement type (meeting, conference, etc.)
 * @param {string} [params.engagement_category] - Filter by category (bilateral, multilateral, etc.)
 * @param {string} [params.engagement_status] - Filter by status (upcoming, completed, etc.)
 * @param {string} [params.host_country_id] - Filter by host country UUID
 * @param {string} [params.start_date] - Filter by start date (ISO format)
 * @param {string} [params.end_date] - Filter by end date (ISO format)
 * @param {number} [params.page] - Page number for pagination (1-indexed, defaults to 1)
 * @param {number} [params.limit] - Items per page (defaults to 20)
 * @param {UseQueryOptions} [options] - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns {UseQueryResult<EngagementListResponse>} TanStack Query result with paginated engagement list
 *
 * @example
 * // Fetch all engagements
 * const { data } = useEngagements();
 *
 * @example
 * // Fetch with filters
 * const { data } = useEngagements({
 *   engagement_type: 'conference',
 *   engagement_category: 'multilateral',
 *   engagement_status: 'upcoming',
 *   search: 'Summit',
 *   page: 1,
 *   limit: 20,
 * });
 *
 * @example
 * // Fetch engagements for a specific host country
 * const { data } = useEngagements({
 *   host_country_id: 'country-uuid',
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31',
 * });
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
 *
 * @description
 * Fetches a single engagement entity with its full profile including participants,
 * agenda items, linked documents, positions, and other related data. The query is
 * automatically cached and can be invalidated using engagementKeys.detail(id).
 *
 * The query is automatically enabled when id is truthy and disabled when falsy.
 *
 * @param {string} id - The unique identifier (UUID) of the engagement to fetch
 * @param {UseQueryOptions} [options] - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns {UseQueryResult<EngagementFullProfile>} TanStack Query result with full engagement profile
 *
 * @throws {Error} Throws if the API request fails or engagement is not found
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useEngagement('engagement-uuid');
 *
 * @example
 * // With additional options
 * const { data } = useEngagement('engagement-uuid', {
 *   staleTime: 120000,
 *   enabled: !!dossierId,
 *   refetchOnWindowFocus: false,
 * });
 *
 * @example
 * // Access full profile data
 * if (data) {
 *   console.log(data.engagement.name_en);
 *   console.log(data.participants); // Array of participants
 *   console.log(data.agenda_items); // Array of agenda items
 *   console.log(data.statistics); // Engagement statistics
 * }
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
 *
 * @description
 * Creates a new engagement entity with automatic cache invalidation and toast notifications.
 * On success, invalidates list queries and pre-populates the detail cache with the new entity.
 * Displays success/error toast notifications using i18next translations.
 *
 * @returns {UseMutationResult<EngagementFullProfile, Error, EngagementCreate>} TanStack Mutation result
 *
 * @example
 * // Basic usage
 * const { mutate, isPending } = useCreateEngagement();
 * mutate({
 *   name_en: 'Annual Summit 2024',
 *   name_ar: 'القمة السنوية 2024',
 *   engagement_type: 'conference',
 *   engagement_category: 'multilateral',
 *   start_date: '2024-06-01',
 *   end_date: '2024-06-03',
 * });
 *
 * @example
 * // With callbacks
 * const { mutate } = useCreateEngagement();
 * mutate(newEngagement, {
 *   onSuccess: (data) => {
 *     navigate(`/engagements/${data.engagement.id}`);
 *   },
 *   onError: (error) => {
 *     console.error('Failed to create:', error);
 *   },
 * });
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
 *
 * @description
 * Updates an existing engagement with optimistic updates and automatic cache management.
 * On mutation start, cancels in-flight queries and saves previous state for rollback.
 * On success, updates the detail cache and invalidates list queries.
 * On error, rolls back to previous state and shows error toast.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Basic usage
 * const { mutate } = useUpdateEngagement();
 * mutate({
 *   id: 'engagement-uuid',
 *   updates: {
 *     name_en: 'Updated Summit Name',
 *     engagement_status: 'completed',
 *   },
 * });
 *
 * @example
 * // With optimistic UI updates
 * const { mutate, isPending } = useUpdateEngagement();
 * if (isPending) return <Spinner />;
 * // UI updates immediately, rolls back on error
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
 *
 * @description
 * Performs a soft delete on an engagement by setting its status to archived.
 * On success, removes the engagement from the detail cache and invalidates list queries.
 * Displays success/error toast notifications.
 *
 * @returns {UseMutationResult<{success: boolean}, Error, string>} TanStack Mutation result
 *
 * @example
 * // Basic usage
 * const { mutate } = useArchiveEngagement();
 * mutate('engagement-uuid');
 *
 * @example
 * // With confirmation dialog
 * const { mutate } = useArchiveEngagement();
 * const handleArchive = () => {
 *   if (confirm('Archive this engagement?')) {
 *     mutate(engagementId, {
 *       onSuccess: () => navigate('/engagements'),
 *     });
 *   }
 * };
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
 *
 * @description
 * Fetches the list of participants for a specific engagement including their roles,
 * participant types, and linked dossier information. Results are cached and automatically
 * refreshed when participant mutations occur.
 *
 * @param {string} engagementId - The UUID of the engagement
 * @param {UseQueryOptions} [options] - Additional TanStack Query options
 * @returns {UseQueryResult<{data: EngagementParticipant[]}>} TanStack Query result with participants array
 *
 * @example
 * // Fetch engagement participants
 * const { data } = useEngagementParticipants('engagement-uuid');
 * const participants = data?.data || [];
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
 *
 * @description
 * Adds a new participant to an engagement with automatic cache invalidation.
 * On success, invalidates both engagement detail and participants queries to reflect the change.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Add a speaker to the engagement
 * const { mutate } = useAddEngagementParticipant();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   participant: {
 *     dossier_id: 'person-uuid',
 *     role: 'speaker',
 *     participant_type: 'individual',
 *   },
 * });
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
 *
 * @description
 * Removes a participant from an engagement by their participant ID.
 * On success, invalidates both engagement detail and participants queries.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Remove a participant
 * const { mutate } = useRemoveEngagementParticipant();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   participantId: 'participant-uuid',
 * });
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
 *
 * @description
 * Fetches the ordered list of agenda items for a specific engagement including
 * titles, descriptions, status, and order numbers. Results are cached and automatically
 * refreshed when agenda mutations occur.
 *
 * @param {string} engagementId - The UUID of the engagement
 * @param {UseQueryOptions} [options] - Additional TanStack Query options
 * @returns {UseQueryResult<{data: EngagementAgendaItem[]}>} TanStack Query result with agenda items array
 *
 * @example
 * // Fetch engagement agenda
 * const { data } = useEngagementAgenda('engagement-uuid');
 * const agendaItems = data?.data || [];
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
 *
 * @description
 * Adds a new agenda item to an engagement with automatic cache invalidation.
 * On success, invalidates both engagement detail and agenda queries to reflect the change.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Add an agenda item
 * const { mutate } = useAddEngagementAgendaItem();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   item: {
 *     title_en: 'Opening Remarks',
 *     title_ar: 'الملاحظات الافتتاحية',
 *     order_number: 1,
 *     item_status: 'pending',
 *   },
 * });
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
 *
 * @description
 * Updates an existing agenda item for an engagement with automatic cache invalidation.
 * On success, invalidates both engagement detail and agenda queries.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Update an agenda item
 * const { mutate } = useUpdateEngagementAgendaItem();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   agendaId: 'agenda-item-uuid',
 *   updates: {
 *     title_en: 'Updated Title',
 *     item_status: 'completed',
 *   },
 * });
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
 *
 * @description
 * Removes an agenda item from an engagement by its agenda item ID.
 * On success, invalidates both engagement detail and agenda queries.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Remove an agenda item
 * const { mutate } = useRemoveEngagementAgendaItem();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   agendaId: 'agenda-item-uuid',
 * });
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
 *
 * @description
 * Returns a function that invalidates all engagement-related queries in the cache.
 * Useful for manual cache refresh after external operations or when data is known to be stale.
 *
 * @returns {Function} Function to call to invalidate all engagement queries
 *
 * @example
 * // Manual cache invalidation
 * const invalidateAll = useInvalidateEngagements();
 * invalidateAll(); // Triggers refetch of all active engagement queries
 */
export function useInvalidateEngagements() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: engagementKeys.all })
  }
}
