/**
 * Calendar Sync Hook
 * @module domains/briefings/hooks/useCalendarSync
 *
 * Hooks for calendar integration and sync management.
 * API calls delegated to briefings.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCalendarStatus,
  syncCalendar as syncCalendarApi,
  getCalendarEvents as getCalendarEventsApi,
  connectCalendar as connectCalendarApi,
  disconnectCalendar as disconnectCalendarApi,
  updateCalendarSettings as updateCalendarSettingsApi,
} from '../repositories/briefings.repository'

export const calendarKeys = {
  all: ['calendar'] as const,
  status: () => [...calendarKeys.all, 'status'] as const,
  events: (params?: Record<string, unknown>) => [...calendarKeys.all, 'events', params] as const,
  settings: () => [...calendarKeys.all, 'settings'] as const,
}

export function useCalendarStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: calendarKeys.status(),
    queryFn: () => getCalendarStatus(),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCalendarEvents(params?: {
  from?: string
  to?: string
  source?: string
  enabled?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  if (params?.source) searchParams.set('source', params.source)

  return useQuery({
    queryKey: calendarKeys.events(params),
    queryFn: () => getCalendarEventsApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

export function useSyncCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => syncCalendarApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export function useConnectCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => connectCalendarApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.status() })
    },
  })
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => disconnectCalendarApi(provider),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.status() })
    },
  })
}

export function useUpdateCalendarSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateCalendarSettingsApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.settings() })
    },
  })
}

/* Stub hooks – removed during refactoring, still imported by components */

export function useCalendarSync() {
  return useQuery({
    queryKey: [...calendarKeys.all, 'sync'],
    queryFn: () => Promise.resolve({ connected: false, providers: [] }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useExternalCalendars() {
  return useQuery({
    queryKey: [...calendarKeys.all, 'external'],
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompleteOAuthCallback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}
