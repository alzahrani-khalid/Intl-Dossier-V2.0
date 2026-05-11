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

import type {
  ExternalCalendarConnection,
  ExternalCalendarProvider,
  CalendarSyncConflict,
  ICalFeedSubscription,
} from '@/types/calendar-sync.types'

export interface CalendarSyncState {
  connections: ExternalCalendarConnection[]
  isLoadingConnections: boolean
  conflicts: CalendarSyncConflict[]
  icalSubscriptions: ICalFeedSubscription[]
  connectProvider: (provider: ExternalCalendarProvider, redirectUri: string) => Promise<void>
  isConnecting: boolean
  disconnectProvider: (id: string) => Promise<void>
  updateConnection: (id: string, updates: Record<string, unknown>) => Promise<void>
  triggerSync: (params: { connection_id: string }) => Promise<void>
  isSyncing: boolean
  resolveConflict: (params: { conflict_id: string; resolution: string }) => Promise<void>
  isResolvingConflict: boolean
  addICalFeed: (feed: Record<string, unknown>) => Promise<void>
  isAddingIcal: boolean
  updateICalFeed: (id: string, updates: Record<string, unknown>) => Promise<void>
  removeICalFeed: (id: string) => Promise<void>
  refreshICalFeed: (id: string) => Promise<void>
  isRefreshingIcal: boolean
}

const NOOP_ASYNC = (): Promise<void> => Promise.resolve()

export function useCalendarSync(): CalendarSyncState {
  return {
    connections: [],
    isLoadingConnections: false,
    conflicts: [],
    icalSubscriptions: [],
    connectProvider: NOOP_ASYNC,
    isConnecting: false,
    disconnectProvider: NOOP_ASYNC,
    updateConnection: NOOP_ASYNC,
    triggerSync: NOOP_ASYNC,
    isSyncing: false,
    resolveConflict: NOOP_ASYNC,
    isResolvingConflict: false,
    addICalFeed: NOOP_ASYNC,
    isAddingIcal: false,
    updateICalFeed: NOOP_ASYNC,
    removeICalFeed: NOOP_ASYNC,
    refreshICalFeed: NOOP_ASYNC,
    isRefreshingIcal: false,
  }
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
