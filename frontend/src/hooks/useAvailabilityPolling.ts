/**
 * Availability Polling Hook
 * Feature: participant-availability-polling
 *
 * React Query hooks for Doodle-style availability polling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AvailabilityPoll,
  PollSlot,
  PollParticipant,
  PollResponse,
  PollStatus,
  PollResponseType,
  CreatePollRequest,
  UpdatePollRequest,
  SubmitVoteRequest,
  BatchSubmitVotesRequest,
  PollListFilters,
  PollListResponse,
  PollDetailsResponse,
  PollCompletionStatus,
  OptimalSlot,
  AutoScheduleRequest,
  AutoScheduleResponse,
  CreatePollSlotRequest,
  CreatePollParticipantRequest,
} from '@/types/availability-polling.types'

const POLLING_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/availability-polling`

// =============================================================================
// Auth Helper
// =============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || 'API request failed')
  }
  return response.json()
}

// =============================================================================
// Query Keys
// =============================================================================

export const pollingQueryKeys = {
  all: ['availability-polls'] as const,
  lists: () => [...pollingQueryKeys.all, 'list'] as const,
  list: (filters: PollListFilters) => [...pollingQueryKeys.lists(), filters] as const,
  details: () => [...pollingQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...pollingQueryKeys.details(), id] as const,
  myPolls: () => [...pollingQueryKeys.all, 'my-polls'] as const,
}

// =============================================================================
// List Polls
// =============================================================================

export function usePolls(filters?: PollListFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pollingQueryKeys.list(filters || {}),
    queryFn: async (): Promise<PollListResponse> => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }

      const response = await fetch(`${POLLING_BASE_URL}?${params.toString()}`, {
        headers,
      })
      return handleResponse<PollListResponse>(response)
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: options?.enabled !== false,
  })
}

export function useMyPolls(options?: { enabled?: boolean }) {
  return usePolls({ created_by: 'me' }, options)
}

// =============================================================================
// Get Poll Details
// =============================================================================

export function usePollDetails(pollId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pollingQueryKeys.detail(pollId || ''),
    queryFn: async (): Promise<PollDetailsResponse> => {
      if (!pollId) throw new Error('Poll ID required')

      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}`, {
        headers,
      })
      return handleResponse<PollDetailsResponse>(response)
    },
    enabled: options?.enabled !== false && !!pollId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// =============================================================================
// Create Poll
// =============================================================================

export function useCreatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: CreatePollRequest): Promise<AvailabilityPoll> => {
      const headers = await getAuthHeaders()
      const response = await fetch(POLLING_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<AvailabilityPoll>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.myPolls() })
    },
  })
}

// =============================================================================
// Update Poll
// =============================================================================

export function useUpdatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      ...updates
    }: UpdatePollRequest & { pollId: string }): Promise<AvailabilityPoll> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      })
      return handleResponse<AvailabilityPoll>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.lists() })
    },
  })
}

// =============================================================================
// Delete Poll
// =============================================================================

export function useDeletePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pollId: string): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}`, {
        method: 'DELETE',
        headers,
      })
      return handleResponse<{ success: boolean }>(response)
    },
    onSuccess: (_, pollId) => {
      queryClient.removeQueries({ queryKey: pollingQueryKeys.detail(pollId) })
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.lists() })
    },
  })
}

// =============================================================================
// Activate Poll
// =============================================================================

export function useActivatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pollId: string): Promise<AvailabilityPoll> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      })
      return handleResponse<AvailabilityPoll>(response)
    },
    onSuccess: (_, pollId) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(pollId) })
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.lists() })
    },
  })
}

// =============================================================================
// Close Poll
// =============================================================================

export function useClosePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      selectedSlotId,
    }: {
      pollId: string
      selectedSlotId?: string
    }): Promise<AvailabilityPoll> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/close`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ selected_slot_id: selectedSlotId }),
      })
      return handleResponse<AvailabilityPoll>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.lists() })
    },
  })
}

// =============================================================================
// Submit Votes
// =============================================================================

export function useSubmitVotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      votes,
    }: {
      pollId: string
      votes: SubmitVoteRequest[]
    }): Promise<{ success: boolean; results: any[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ votes }),
      })
      return handleResponse<{ success: boolean; results: any[] }>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
    },
  })
}

// =============================================================================
// Auto Schedule
// =============================================================================

export function useAutoSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      slotId,
      eventType,
    }: {
      pollId: string
      slotId?: string
      eventType?: string
    }): Promise<AutoScheduleResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot_id: slotId, event_type: eventType }),
      })
      return handleResponse<AutoScheduleResponse>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

// =============================================================================
// Add Slots
// =============================================================================

export function useAddSlots() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      slots,
    }: {
      pollId: string
      slots: CreatePollSlotRequest[]
    }): Promise<{ success: boolean; slots: PollSlot[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/slots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slots }),
      })
      return handleResponse<{ success: boolean; slots: PollSlot[] }>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
    },
  })
}

// =============================================================================
// Delete Slot
// =============================================================================

export function useDeleteSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      slotId,
    }: {
      pollId: string
      slotId: string
    }): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/slots/${slotId}`, {
        method: 'DELETE',
        headers,
      })
      return handleResponse<{ success: boolean }>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
    },
  })
}

// =============================================================================
// Add Participants
// =============================================================================

export function useAddParticipants() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      participants,
    }: {
      pollId: string
      participants: CreatePollParticipantRequest[]
    }): Promise<{ success: boolean; participants: PollParticipant[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/participants`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ participants }),
      })
      return handleResponse<{ success: boolean; participants: PollParticipant[] }>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
    },
  })
}

// =============================================================================
// Delete Participant
// =============================================================================

export function useDeleteParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      participantId,
    }: {
      pollId: string
      participantId: string
    }): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${POLLING_BASE_URL}/${pollId}/participants/${participantId}`, {
        method: 'DELETE',
        headers,
      })
      return handleResponse<{ success: boolean }>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollingQueryKeys.detail(variables.pollId) })
    },
  })
}

// =============================================================================
// Combined Export Hook
// =============================================================================

export function useAvailabilityPolling() {
  return {
    // Queries
    usePolls,
    useMyPolls,
    usePollDetails,

    // Mutations
    useCreatePoll,
    useUpdatePoll,
    useDeletePoll,
    useActivatePoll,
    useClosePoll,
    useSubmitVotes,
    useAutoSchedule,
    useAddSlots,
    useDeleteSlot,
    useAddParticipants,
    useDeleteParticipant,

    // Query keys
    queryKeys: pollingQueryKeys,
  }
}
