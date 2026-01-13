/**
 * Calendar Conflicts Hook
 * Feature: event-conflict-resolution
 *
 * React Query hooks for calendar conflict detection and resolution
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ConflictCheckRequest,
  ConflictCheckResponse,
  ConflictsListResponse,
  ConflictListFilters,
  ReschedulingSuggestionRequest,
  ReschedulingSuggestionResponse,
  ReschedulingSuggestion,
  CreateScenarioRequest,
  WhatIfScenario,
  BulkRescheduleRequest,
  BulkRescheduleResponse,
  ResolveConflictRequest,
} from '@/types/calendar-conflict.types'

const CONFLICTS_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-conflicts`

/**
 * Get auth headers for API requests
 */
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

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || 'API request failed')
  }
  return response.json()
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Check for conflicts for a given event configuration
 */
export function useCheckConflicts() {
  return useMutation({
    mutationFn: async (request: ConflictCheckRequest): Promise<ConflictCheckResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<ConflictCheckResponse>(response)
    },
  })
}

/**
 * Real-time conflict checking with debounce
 */
export function useConflictCheck(
  request: ConflictCheckRequest | null,
  options?: { enabled?: boolean; debounceMs?: number },
) {
  const { enabled = true, debounceMs = 500 } = options || {}

  return useQuery({
    queryKey: ['conflict-check', request],
    queryFn: async (): Promise<ConflictCheckResponse> => {
      if (!request?.start_datetime || !request?.end_datetime) {
        return {
          has_conflicts: false,
          conflicts: [],
          warnings: [],
          severity_summary: { critical: 0, high: 0, medium: 0, low: 0 },
          total_conflicts: 0,
        }
      }

      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<ConflictCheckResponse>(response)
    },
    enabled: enabled && !!request?.start_datetime && !!request?.end_datetime,
    staleTime: debounceMs,
    gcTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get existing conflicts with pagination
 */
export function useConflicts(filters?: ConflictListFilters) {
  return useQuery({
    queryKey: ['calendar-conflicts', filters],
    queryFn: async (): Promise<ConflictsListResponse> => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }

      const response = await fetch(`${CONFLICTS_BASE_URL}?${params.toString()}`, {
        headers,
      })
      return handleResponse<ConflictsListResponse>(response)
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Get conflicts for a specific event
 */
export function useEventConflicts(eventId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['event-conflicts', eventId],
    queryFn: async (): Promise<ConflictsListResponse> => {
      if (!eventId) throw new Error('Event ID required')

      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}?event_id=${eventId}`, {
        headers,
      })
      return handleResponse<ConflictsListResponse>(response)
    },
    enabled: options?.enabled !== false && !!eventId,
  })
}

// ============================================================================
// Rescheduling Suggestions
// ============================================================================

/**
 * Generate rescheduling suggestions for an event
 */
export function useGenerateSuggestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      request: ReschedulingSuggestionRequest,
    ): Promise<ReschedulingSuggestionResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/suggest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<ReschedulingSuggestionResponse>(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rescheduling-suggestions', variables.event_id] })
    },
  })
}

/**
 * Get stored suggestions for an event or conflict
 */
export function useSuggestions(
  params: { event_id?: string; conflict_id?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['rescheduling-suggestions', params],
    queryFn: async (): Promise<{ suggestions: ReschedulingSuggestion[] }> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (params.event_id) searchParams.append('event_id', params.event_id)
      if (params.conflict_id) searchParams.append('conflict_id', params.conflict_id)

      const response = await fetch(`${CONFLICTS_BASE_URL}/suggestions?${searchParams.toString()}`, {
        headers,
      })
      return handleResponse<{ suggestions: ReschedulingSuggestion[] }>(response)
    },
    enabled: options?.enabled !== false && !!(params.event_id || params.conflict_id),
  })
}

/**
 * Accept a rescheduling suggestion and resolve conflict
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      conflict_id: string
      suggestion_id: string
    }): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/resolve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          conflict_id: params.conflict_id,
          resolution_status: 'auto_resolved',
          accepted_suggestion_id: params.suggestion_id,
        }),
      })
      return handleResponse<{ success: boolean }>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] })
      queryClient.invalidateQueries({ queryKey: ['event-conflicts'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

// ============================================================================
// Conflict Resolution
// ============================================================================

/**
 * Resolve a conflict manually
 */
export function useResolveConflict() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ResolveConflictRequest): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/resolve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<{ success: boolean }>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] })
      queryClient.invalidateQueries({ queryKey: ['event-conflicts'] })
    },
  })
}

// ============================================================================
// What-If Scenarios
// ============================================================================

/**
 * Create a what-if scenario
 */
export function useCreateScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: CreateScenarioRequest): Promise<{ scenario: WhatIfScenario }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/scenarios`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<{ scenario: WhatIfScenario }>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
    },
  })
}

/**
 * Get user's what-if scenarios
 */
export function useScenarios(status?: string) {
  return useQuery({
    queryKey: ['what-if-scenarios', status],
    queryFn: async (): Promise<{ scenarios: WhatIfScenario[] }> => {
      const headers = await getAuthHeaders()
      const params = status ? `?status=${status}` : ''
      const response = await fetch(`${CONFLICTS_BASE_URL}/scenarios${params}`, {
        headers,
      })
      return handleResponse<{ scenarios: WhatIfScenario[] }>(response)
    },
  })
}

/**
 * Apply a what-if scenario
 */
export function useApplyScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scenarioId: string): Promise<{ success: boolean; results: any[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/apply-scenario`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ scenario_id: scenarioId }),
      })
      return handleResponse<{ success: boolean; results: any[] }>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] })
    },
  })
}

/**
 * Delete a what-if scenario
 */
export function useDeleteScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scenarioId: string): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/scenarios/${scenarioId}`, {
        method: 'DELETE',
        headers,
      })
      return handleResponse<{ success: boolean }>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
    },
  })
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Generate bulk rescheduling plan
 */
export function useBulkReschedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: BulkRescheduleRequest): Promise<BulkRescheduleResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${CONFLICTS_BASE_URL}/bulk-reschedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })
      return handleResponse<BulkRescheduleResponse>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
    },
  })
}

// ============================================================================
// Export Combined Hook
// ============================================================================

export function useCalendarConflicts() {
  return {
    // Conflict checking
    useCheckConflicts,
    useConflictCheck,
    useConflicts,
    useEventConflicts,

    // Suggestions
    useGenerateSuggestions,
    useSuggestions,
    useAcceptSuggestion,

    // Resolution
    useResolveConflict,

    // Scenarios
    useCreateScenario,
    useScenarios,
    useApplyScenario,
    useDeleteScenario,

    // Bulk operations
    useBulkReschedule,
  }
}
