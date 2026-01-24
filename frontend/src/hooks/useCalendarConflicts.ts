/**
 * Calendar Conflicts Hooks
 * @module hooks/useCalendarConflicts
 * @feature event-conflict-resolution
 *
 * TanStack Query hooks for calendar conflict detection, resolution, and rescheduling.
 *
 * @description
 * This module provides comprehensive React hooks for managing calendar event conflicts:
 * - Real-time conflict detection with debounced checking
 * - Conflict listing and filtering with pagination
 * - AI-powered rescheduling suggestions
 * - What-if scenario analysis for bulk changes
 * - Bulk rescheduling operations
 * - Conflict resolution tracking
 *
 * All hooks handle authentication and cache invalidation automatically.
 *
 * @example
 * // Check for conflicts while scheduling
 * const { data: conflicts } = useConflictCheck({
 *   start_datetime: '2024-01-15T10:00:00Z',
 *   end_datetime: '2024-01-15T11:00:00Z',
 *   attendee_ids: ['user-1', 'user-2'],
 * });
 *
 * @example
 * // Get rescheduling suggestions
 * const { mutate: suggest } = useGenerateSuggestions();
 * suggest({
 *   event_id: 'event-uuid',
 *   preferences: { preferred_times: ['09:00-12:00', '14:00-17:00'] },
 * });
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
 *
 * @description
 * Retrieves the current session access token and formats it as Authorization header.
 * Throws an error if the user is not authenticated.
 *
 * @returns Promise resolving to headers object with Authorization and Content-Type
 * @throws {Error} If user is not authenticated
 *
 * @private
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
 * Handle API response with error extraction
 *
 * @description
 * Parses API response, extracts error messages on failure, and returns typed data on success.
 *
 * @template T - Expected response data type
 * @param response - Fetch API Response object
 * @returns Promise resolving to parsed response data
 * @throws {Error} If response is not ok, with extracted error message
 *
 * @private
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
 * Hook to check for conflicts for a given event configuration (mutation variant)
 *
 * @description
 * Mutation hook for one-time conflict checking. Use this when you want to manually
 * trigger a conflict check (e.g., on button click). For real-time checking as user
 * types, use useConflictCheck instead.
 *
 * @returns TanStack Mutation result with mutate function accepting ConflictCheckRequest
 *
 * @example
 * // Manual conflict check on button click
 * const { mutate: checkConflicts, data, isPending } = useCheckConflicts();
 *
 * const handleCheck = () => {
 *   checkConflicts({
 *     start_datetime: '2024-01-15T10:00:00Z',
 *     end_datetime: '2024-01-15T11:00:00Z',
 *     attendee_ids: ['user-1', 'user-2'],
 *     room_id: 'room-uuid',
 *   });
 * };
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
 * Hook for real-time conflict checking with debounce (query variant)
 *
 * @description
 * Query hook that automatically checks for conflicts as the request changes.
 * Useful for real-time validation during event creation/editing forms.
 * Includes debouncing to avoid excessive API calls. Returns empty conflict
 * response if start/end datetime are not provided.
 *
 * @param request - Conflict check request or null to disable checking
 * @param options - Configuration options
 * @param options.enabled - Whether the query is enabled (default: true)
 * @param options.debounceMs - Debounce delay in milliseconds (default: 500)
 * @returns TanStack Query result with conflict check data
 *
 * @example
 * // Real-time conflict checking in a form
 * const [formData, setFormData] = useState({ start_datetime: '', end_datetime: '' });
 * const { data: conflicts } = useConflictCheck({
 *   start_datetime: formData.start_datetime,
 *   end_datetime: formData.end_datetime,
 *   attendee_ids: selectedAttendees,
 * }, { debounceMs: 300 });
 *
 * @example
 * // Conditional checking
 * const { data } = useConflictCheck(
 *   hasRequiredFields ? conflictRequest : null,
 *   { enabled: isFormValid }
 * );
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
 * Hook to fetch existing calendar conflicts with filtering and pagination
 *
 * @description
 * Fetches a paginated list of detected calendar conflicts with optional filtering
 * by severity, status, date range, event ID, or attendee. Results are cached for 1 minute.
 *
 * @param filters - Optional filters to narrow down results
 * @returns TanStack Query result with conflicts list and pagination metadata
 *
 * @example
 * // Fetch all unresolved conflicts
 * const { data } = useConflicts({
 *   resolution_status: 'unresolved',
 *   severity: 'high',
 * });
 *
 * @example
 * // Fetch conflicts for a date range
 * const { data } = useConflicts({
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-31',
 *   page: 1,
 *   page_size: 20,
 * });
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
 * Hook to fetch conflicts for a specific calendar event
 *
 * @description
 * Fetches all conflicts involving a specific event by ID. Useful for displaying
 * conflict warnings on event detail pages or edit forms. Query is automatically
 * disabled if eventId is undefined.
 *
 * @param eventId - UUID of the calendar event (undefined disables query)
 * @param options - Configuration options
 * @param options.enabled - Whether the query is enabled (default: true if eventId exists)
 * @returns TanStack Query result with conflicts list for the event
 *
 * @example
 * // Fetch conflicts for an event
 * const { data: conflicts, isLoading } = useEventConflicts(eventId);
 *
 * @example
 * // Conditional fetching
 * const { data } = useEventConflicts(eventId, { enabled: !!eventId && showConflicts });
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
 * Hook to generate AI-powered rescheduling suggestions for an event
 *
 * @description
 * Generates intelligent rescheduling suggestions based on attendee availability,
 * room availability, and user preferences. On success, invalidates the suggestions
 * cache to trigger a refetch.
 *
 * @returns TanStack Mutation result with mutate function accepting ReschedulingSuggestionRequest
 *
 * @example
 * // Generate suggestions with preferences
 * const { mutate: generateSuggestions, data, isPending } = useGenerateSuggestions();
 *
 * generateSuggestions({
 *   event_id: 'event-uuid',
 *   preferences: {
 *     preferred_times: ['09:00-12:00', '14:00-17:00'],
 *     preferred_days: ['monday', 'tuesday', 'wednesday'],
 *     max_suggestions: 5,
 *   },
 * });
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
 * Hook to fetch stored rescheduling suggestions
 *
 * @description
 * Fetches previously generated rescheduling suggestions for an event or conflict.
 * Query is automatically disabled if neither event_id nor conflict_id is provided.
 *
 * @param params - Filter parameters (must provide event_id or conflict_id)
 * @param params.event_id - UUID of the event to fetch suggestions for
 * @param params.conflict_id - UUID of the conflict to fetch suggestions for
 * @param options - Configuration options
 * @param options.enabled - Whether the query is enabled (default: true if params provided)
 * @returns TanStack Query result with suggestions array
 *
 * @example
 * // Fetch suggestions for an event
 * const { data, isLoading } = useSuggestions({ event_id: 'event-uuid' });
 *
 * @example
 * // Fetch suggestions for a conflict
 * const { data } = useSuggestions({ conflict_id: 'conflict-uuid' });
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
 * Hook to accept a rescheduling suggestion and automatically resolve conflict
 *
 * @description
 * Accepts a generated rescheduling suggestion and marks the conflict as auto-resolved.
 * On success, invalidates conflicts and calendar events caches to reflect the changes.
 *
 * @returns TanStack Mutation result with mutate function accepting conflict and suggestion IDs
 *
 * @example
 * // Accept a suggestion
 * const { mutate: acceptSuggestion, isPending } = useAcceptSuggestion();
 *
 * acceptSuggestion({
 *   conflict_id: 'conflict-uuid',
 *   suggestion_id: 'suggestion-uuid',
 * });
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
 * Hook to manually resolve a calendar conflict
 *
 * @description
 * Manually marks a conflict as resolved with a specific resolution status and optional notes.
 * On success, invalidates the conflicts cache. Use this for manual conflict resolution
 * when suggestions are not applicable.
 *
 * @returns TanStack Mutation result with mutate function accepting ResolveConflictRequest
 *
 * @example
 * // Manually resolve conflict as user-overridden
 * const { mutate: resolveConflict, isPending } = useResolveConflict();
 *
 * resolveConflict({
 *   conflict_id: 'conflict-uuid',
 *   resolution_status: 'user_overridden',
 *   resolution_notes: 'Conflict acknowledged, proceeding as planned',
 * });
 *
 * @example
 * // Ignore a conflict
 * const { mutate } = useResolveConflict();
 * mutate({
 *   conflict_id: 'conflict-uuid',
 *   resolution_status: 'ignored',
 * });
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
 * Hook to create a what-if scenario for testing schedule changes
 *
 * @description
 * Creates a what-if scenario to simulate the impact of schedule changes without
 * committing them. Useful for exploring different scheduling options. On success,
 * invalidates the scenarios cache.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateScenarioRequest
 *
 * @example
 * // Create a scenario to test moving an event
 * const { mutate: createScenario, data } = useCreateScenario();
 *
 * createScenario({
 *   name: 'Move team meeting to afternoon',
 *   description: 'Test impact of moving weekly sync to 14:00',
 *   changes: [
 *     {
 *       event_id: 'event-uuid',
 *       new_start: '2024-01-15T14:00:00Z',
 *       new_end: '2024-01-15T15:00:00Z',
 *     },
 *   ],
 * });
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
 * Hook to fetch user's what-if scenarios with optional status filter
 *
 * @description
 * Fetches all what-if scenarios created by the current user. Optionally filter
 * by status (draft, applied, discarded).
 *
 * @param status - Optional status filter (e.g., 'draft', 'applied', 'discarded')
 * @returns TanStack Query result with scenarios array
 *
 * @example
 * // Fetch all scenarios
 * const { data, isLoading } = useScenarios();
 *
 * @example
 * // Fetch only draft scenarios
 * const { data } = useScenarios('draft');
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
 * Hook to apply a what-if scenario and commit the changes
 *
 * @description
 * Applies a previously created what-if scenario, committing all schedule changes
 * to the calendar. On success, invalidates scenarios, events, and conflicts caches.
 *
 * @returns TanStack Mutation result with mutate function accepting scenario ID
 *
 * @example
 * // Apply a scenario
 * const { mutate: applyScenario, data, isPending } = useApplyScenario();
 *
 * applyScenario('scenario-uuid');
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
 * Hook to delete a what-if scenario
 *
 * @description
 * Permanently deletes a what-if scenario. On success, invalidates the scenarios cache.
 *
 * @returns TanStack Mutation result with mutate function accepting scenario ID
 *
 * @example
 * // Delete a scenario
 * const { mutate: deleteScenario, isPending } = useDeleteScenario();
 *
 * deleteScenario('scenario-uuid');
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
 * Hook to generate a bulk rescheduling plan
 *
 * @description
 * Generates a comprehensive rescheduling plan for multiple events, optimizing
 * for conflict resolution and attendee availability. Creates a what-if scenario
 * that can be reviewed and applied. On success, invalidates scenarios cache.
 *
 * @returns TanStack Mutation result with mutate function accepting BulkRescheduleRequest
 *
 * @example
 * // Generate bulk rescheduling plan
 * const { mutate: bulkReschedule, data } = useBulkReschedule();
 *
 * bulkReschedule({
 *   event_ids: ['event-1', 'event-2', 'event-3'],
 *   constraints: {
 *     start_date: '2024-01-15',
 *     end_date: '2024-01-31',
 *     preferred_times: ['09:00-17:00'],
 *   },
 *   optimization_goal: 'minimize_conflicts',
 * });
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

/**
 * Combined hook that exports all calendar conflict management hooks
 *
 * @description
 * Convenience hook that provides access to all calendar conflict hooks in a single object.
 * Useful for organizing imports and making all conflict-related functionality available
 * in one place.
 *
 * @returns Object containing all calendar conflict hooks
 *
 * @example
 * // Use combined hook in a component
 * const conflicts = useCalendarConflicts();
 *
 * // Access individual hooks
 * const { data } = conflicts.useConflicts({ severity: 'high' });
 * const { mutate: resolve } = conflicts.useResolveConflict();
 */
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
