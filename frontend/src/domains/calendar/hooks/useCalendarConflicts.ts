/**
 * Calendar Conflicts Hook (Domain)
 * @module domains/calendar/hooks/useCalendarConflicts
 *
 * TanStack Query hooks for calendar conflict detection and resolution.
 * Delegates API calls to calendar.repository.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as calendarRepo from '../repositories/calendar.repository'
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

// ============================================================================
// Conflict Detection
// ============================================================================

export function useCheckConflicts() {
  return useMutation({
    mutationFn: async (request: ConflictCheckRequest): Promise<ConflictCheckResponse> => {
      return calendarRepo.checkConflicts(request)
    },
  })
}

export function useConflictCheck(
  request: ConflictCheckRequest | null,
  options?: { enabled?: boolean; debounceMs?: number },
): ReturnType<typeof useQuery<ConflictCheckResponse>> {
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
      return calendarRepo.checkConflicts(request)
    },
    enabled: enabled && !!request?.start_datetime && !!request?.end_datetime,
    staleTime: debounceMs,
    gcTime: 30 * 1000,
  })
}

export function useConflicts(
  filters?: ConflictListFilters,
): ReturnType<typeof useQuery<ConflictsListResponse>> {
  return useQuery({
    queryKey: ['calendar-conflicts', filters],
    queryFn: (): Promise<ConflictsListResponse> => calendarRepo.getConflicts(filters),
    staleTime: 60 * 1000,
  })
}

export function useEventConflicts(
  eventId: string | undefined,
  options?: { enabled?: boolean },
): ReturnType<typeof useQuery<ConflictsListResponse>> {
  return useQuery({
    queryKey: ['event-conflicts', eventId],
    queryFn: async (): Promise<ConflictsListResponse> => {
      if (!eventId) throw new Error('Event ID required')
      return calendarRepo.getEventConflicts(eventId)
    },
    enabled: options?.enabled !== false && !!eventId,
  })
}

// ============================================================================
// Rescheduling Suggestions
// ============================================================================

export function useGenerateSuggestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      request: ReschedulingSuggestionRequest,
    ): Promise<ReschedulingSuggestionResponse> => {
      return calendarRepo.generateSuggestions(request)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rescheduling-suggestions', variables.event_id] })
    },
  })
}

export function useSuggestions(
  params: { event_id?: string; conflict_id?: string },
  options?: { enabled?: boolean },
): ReturnType<typeof useQuery<{ suggestions: ReschedulingSuggestion[] }>> {
  return useQuery({
    queryKey: ['rescheduling-suggestions', params],
    queryFn: (): Promise<{ suggestions: ReschedulingSuggestion[] }> =>
      calendarRepo.getSuggestions(params),
    enabled: options?.enabled !== false && !!(params.event_id || params.conflict_id),
  })
}

export function useAcceptSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      conflict_id: string
      suggestion_id: string
    }): Promise<{ success: boolean }> => {
      return calendarRepo.acceptSuggestion(params.conflict_id, params.suggestion_id)
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

export function useResolveConflict() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ResolveConflictRequest): Promise<{ success: boolean }> => {
      return calendarRepo.resolveConflict(request)
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

export function useCreateScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: CreateScenarioRequest): Promise<{ scenario: WhatIfScenario }> => {
      return calendarRepo.createScenario(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
    },
  })
}

export function useScenarios(
  status?: string,
): ReturnType<typeof useQuery<{ scenarios: WhatIfScenario[] }>> {
  return useQuery({
    queryKey: ['what-if-scenarios', status],
    queryFn: (): Promise<{ scenarios: WhatIfScenario[] }> => calendarRepo.getScenarios(status),
  })
}

export function useApplyScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scenarioId: string): Promise<{ success: boolean; results: unknown[] }> => {
      return calendarRepo.applyScenario(scenarioId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] })
    },
  })
}

export function useDeleteScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scenarioId: string): Promise<{ success: boolean }> => {
      return calendarRepo.deleteScenario(scenarioId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
    },
  })
}

// ============================================================================
// Bulk Operations
// ============================================================================

export function useBulkReschedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: BulkRescheduleRequest): Promise<BulkRescheduleResponse> => {
      return calendarRepo.bulkReschedule(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['what-if-scenarios'] })
    },
  })
}

// ============================================================================
// Combined Export
// ============================================================================

export function useCalendarConflicts(): {
  useCheckConflicts: typeof useCheckConflicts
  useConflictCheck: typeof useConflictCheck
  useConflicts: typeof useConflicts
  useEventConflicts: typeof useEventConflicts
  useGenerateSuggestions: typeof useGenerateSuggestions
  useSuggestions: typeof useSuggestions
  useAcceptSuggestion: typeof useAcceptSuggestion
  useResolveConflict: typeof useResolveConflict
  useCreateScenario: typeof useCreateScenario
  useScenarios: typeof useScenarios
  useApplyScenario: typeof useApplyScenario
  useDeleteScenario: typeof useDeleteScenario
  useBulkReschedule: typeof useBulkReschedule
} {
  return {
    useCheckConflicts,
    useConflictCheck,
    useConflicts,
    useEventConflicts,
    useGenerateSuggestions,
    useSuggestions,
    useAcceptSuggestion,
    useResolveConflict,
    useCreateScenario,
    useScenarios,
    useApplyScenario,
    useDeleteScenario,
    useBulkReschedule,
  }
}
