/**
 * useCalendarSync Hook
 * Manages two-way sync with external calendar systems (Google Calendar, Outlook, Exchange)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ExternalCalendarConnection,
  ExternalCalendar,
  CalendarSyncLog,
  CalendarSyncConflict,
  ICalFeedSubscription,
  ExternalCalendarProvider,
  UpdateConnectionInput,
  UpdateCalendarInput,
  TriggerSyncRequest,
  ResolveConflictInput,
  CreateICalSubscriptionInput,
  UpdateICalSubscriptionInput,
  UnifiedCalendarEvent,
} from '@/types/calendar-sync.types'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync`

// Query keys
export const calendarSyncKeys = {
  all: ['calendar-sync'] as const,
  connections: () => [...calendarSyncKeys.all, 'connections'] as const,
  connection: (id: string) => [...calendarSyncKeys.connections(), id] as const,
  calendars: (connectionId: string) =>
    [...calendarSyncKeys.all, 'calendars', connectionId] as const,
  conflicts: () => [...calendarSyncKeys.all, 'conflicts'] as const,
  icalSubscriptions: () => [...calendarSyncKeys.all, 'ical'] as const,
  syncLogs: (connectionId: string) => [...calendarSyncKeys.all, 'logs', connectionId] as const,
  unifiedEvents: (startDate: string, endDate: string) =>
    [...calendarSyncKeys.all, 'unified', startDate, endDate] as const,
}

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }
}

// API helper
async function fetchCalendarSync<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// ============================================================================
// Connection Hooks
// ============================================================================

/**
 * Fetch all calendar connections
 */
export function useCalendarConnections() {
  return useQuery({
    queryKey: calendarSyncKeys.connections(),
    queryFn: () => fetchCalendarSync<ExternalCalendarConnection[]>('/connections'),
  })
}

/**
 * Fetch a single connection
 */
export function useCalendarConnection(connectionId: string | undefined) {
  return useQuery({
    queryKey: calendarSyncKeys.connection(connectionId || ''),
    queryFn: () => fetchCalendarSync<ExternalCalendarConnection>(`/connections/${connectionId}`),
    enabled: !!connectionId,
  })
}

/**
 * Initiate OAuth connection to a calendar provider
 */
export function useConnectCalendarProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      provider,
      redirectUri,
      settings,
    }: {
      provider: ExternalCalendarProvider
      redirectUri: string
      settings?: Partial<UpdateConnectionInput>
    }) => {
      return fetchCalendarSync<{ authorization_url: string; state: string }>('/connections', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          redirect_uri: redirectUri,
          ...settings,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connections(),
      })
    },
  })
}

/**
 * Complete OAuth callback
 */
export function useCompleteOAuthCallback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      provider,
      code,
      state,
      redirectUri,
    }: {
      provider: ExternalCalendarProvider
      code: string
      state: string
      redirectUri: string
    }) => {
      return fetchCalendarSync<ExternalCalendarConnection>('/oauth/callback', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          code,
          state,
          redirect_uri: redirectUri,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connections(),
      })
    },
  })
}

/**
 * Update connection settings
 */
export function useUpdateCalendarConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      connectionId,
      updates,
    }: {
      connectionId: string
      updates: UpdateConnectionInput
    }) => {
      return fetchCalendarSync<ExternalCalendarConnection>(`/connections/${connectionId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connection(connectionId),
      })
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connections(),
      })
    },
  })
}

/**
 * Disconnect a calendar provider
 */
export function useDisconnectCalendarProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: string) => {
      return fetchCalendarSync<{ success: boolean }>(`/connections/${connectionId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connections(),
      })
    },
  })
}

// ============================================================================
// Calendar Hooks
// ============================================================================

/**
 * Fetch calendars for a connection
 */
export function useExternalCalendars(connectionId: string | undefined) {
  return useQuery({
    queryKey: calendarSyncKeys.calendars(connectionId || ''),
    queryFn: () => fetchCalendarSync<ExternalCalendar[]>(`/calendars/${connectionId}`),
    enabled: !!connectionId,
  })
}

/**
 * Update calendar settings
 */
export function useUpdateExternalCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      calendarId,
      connectionId: _connectionId,
      updates,
    }: {
      calendarId: string
      connectionId: string
      updates: UpdateCalendarInput
    }) => {
      void _connectionId // Used for cache invalidation
      return fetchCalendarSync<ExternalCalendar>(`/calendars/${calendarId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.calendars(connectionId),
      })
    },
  })
}

// ============================================================================
// Sync Hooks
// ============================================================================

/**
 * Trigger manual sync
 */
export function useTriggerCalendarSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: TriggerSyncRequest) => {
      return fetchCalendarSync<CalendarSyncLog>('/sync', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    onSuccess: (_, { connection_id }) => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connection(connection_id),
      })
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.connections(),
      })
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.conflicts(),
      })
    },
  })
}

// ============================================================================
// Conflict Hooks
// ============================================================================

/**
 * Fetch pending conflicts
 */
export function useCalendarSyncConflicts() {
  return useQuery({
    queryKey: calendarSyncKeys.conflicts(),
    queryFn: () => fetchCalendarSync<CalendarSyncConflict[]>('/conflicts'),
  })
}

/**
 * Resolve a sync conflict
 */
export function useResolveCalendarConflict() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ResolveConflictInput) => {
      return fetchCalendarSync<CalendarSyncConflict>(`/conflicts/${input.conflict_id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolution: input.resolution,
          merged_data: input.merged_data,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.conflicts(),
      })
    },
  })
}

// ============================================================================
// iCal Feed Hooks
// ============================================================================

/**
 * Fetch iCal subscriptions
 */
export function useICalSubscriptions() {
  return useQuery({
    queryKey: calendarSyncKeys.icalSubscriptions(),
    queryFn: () => fetchCalendarSync<ICalFeedSubscription[]>('/ical'),
  })
}

/**
 * Add iCal subscription
 */
export function useAddICalSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateICalSubscriptionInput) => {
      return fetchCalendarSync<ICalFeedSubscription>('/ical', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.icalSubscriptions(),
      })
    },
  })
}

/**
 * Update iCal subscription
 */
export function useUpdateICalSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateICalSubscriptionInput }) => {
      return fetchCalendarSync<ICalFeedSubscription>(`/ical/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.icalSubscriptions(),
      })
    },
  })
}

/**
 * Remove iCal subscription
 */
export function useRemoveICalSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchCalendarSync<{ success: boolean }>(`/ical/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.icalSubscriptions(),
      })
    },
  })
}

/**
 * Refresh iCal feed
 */
export function useRefreshICalFeed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchCalendarSync<{ success: boolean; event_count?: number }>(`/ical/${id}/refresh`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: calendarSyncKeys.icalSubscriptions(),
      })
    },
  })
}

// ============================================================================
// Unified Calendar Events
// ============================================================================

/**
 * Fetch unified calendar events (internal + external + iCal)
 */
export function useUnifiedCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: calendarSyncKeys.unifiedEvents(startDate, endDate),
    queryFn: () =>
      fetchCalendarSync<UnifiedCalendarEvent[]>(
        `/unified?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`,
      ),
    enabled: !!startDate && !!endDate,
  })
}

// ============================================================================
// Combined Hook
// ============================================================================

/**
 * Main calendar sync hook that provides all functionality
 */
export function useCalendarSync() {
  const connectionsQuery = useCalendarConnections()
  const conflictsQuery = useCalendarSyncConflicts()
  const icalQuery = useICalSubscriptions()

  const connectProviderMutation = useConnectCalendarProvider()
  const completeOAuthMutation = useCompleteOAuthCallback()
  const disconnectMutation = useDisconnectCalendarProvider()
  const updateConnectionMutation = useUpdateCalendarConnection()
  const updateCalendarMutation = useUpdateExternalCalendar()
  const triggerSyncMutation = useTriggerCalendarSync()
  const resolveConflictMutation = useResolveCalendarConflict()
  const addICalMutation = useAddICalSubscription()
  const updateICalMutation = useUpdateICalSubscription()
  const removeICalMutation = useRemoveICalSubscription()
  const refreshICalMutation = useRefreshICalFeed()

  return {
    // Data
    connections: connectionsQuery.data ?? [],
    isLoadingConnections: connectionsQuery.isLoading,
    connectionsError: connectionsQuery.error,

    conflicts: conflictsQuery.data ?? [],
    isLoadingConflicts: conflictsQuery.isLoading,
    conflictsError: conflictsQuery.error,

    icalSubscriptions: icalQuery.data ?? [],
    isLoadingIcal: icalQuery.isLoading,
    icalError: icalQuery.error,

    // Connection actions
    connectProvider: async (
      provider: ExternalCalendarProvider,
      redirectUri: string,
      settings?: Partial<UpdateConnectionInput>,
    ) => {
      const result = await connectProviderMutation.mutateAsync({
        provider,
        redirectUri,
        settings,
      })
      // Redirect to OAuth provider
      if (result.authorization_url) {
        window.location.href = result.authorization_url
      }
      return result
    },
    isConnecting: connectProviderMutation.isPending,

    completeOAuth: completeOAuthMutation.mutateAsync,
    isCompletingOAuth: completeOAuthMutation.isPending,

    disconnectProvider: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,

    updateConnection: async (connectionId: string, updates: UpdateConnectionInput) => {
      return updateConnectionMutation.mutateAsync({ connectionId, updates })
    },
    isUpdatingConnection: updateConnectionMutation.isPending,

    // Calendar actions
    updateCalendar: async (
      calendarId: string,
      connectionId: string,
      updates: UpdateCalendarInput,
    ) => {
      return updateCalendarMutation.mutateAsync({
        calendarId,
        connectionId,
        updates,
      })
    },
    isUpdatingCalendar: updateCalendarMutation.isPending,

    // Sync actions
    triggerSync: triggerSyncMutation.mutateAsync,
    isSyncing: triggerSyncMutation.isPending,
    lastSyncResult: triggerSyncMutation.data,

    // Conflict actions
    resolveConflict: resolveConflictMutation.mutateAsync,
    isResolvingConflict: resolveConflictMutation.isPending,

    // iCal actions
    addICalFeed: addICalMutation.mutateAsync,
    isAddingIcal: addICalMutation.isPending,

    updateICalFeed: async (id: string, updates: UpdateICalSubscriptionInput) => {
      return updateICalMutation.mutateAsync({ id, updates })
    },
    isUpdatingIcal: updateICalMutation.isPending,

    removeICalFeed: removeICalMutation.mutateAsync,
    isRemovingIcal: removeICalMutation.isPending,

    refreshICalFeed: refreshICalMutation.mutateAsync,
    isRefreshingIcal: refreshICalMutation.isPending,

    // Refetch
    refetchConnections: connectionsQuery.refetch,
    refetchConflicts: conflictsQuery.refetch,
    refetchIcal: icalQuery.refetch,
  }
}

export default useCalendarSync
