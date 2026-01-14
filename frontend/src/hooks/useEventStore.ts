/**
 * Event Store React Hooks
 *
 * TanStack Query hooks for event sourcing operations.
 * Provides reactive data fetching and mutations for events, state, and history.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import type {
  DomainEvent,
  AggregateType,
  AppendEventRequest,
  GetEventsResponse,
  GetHistoryResponse,
  HistoryEntry,
  AggregateStats,
  EventTypeStats,
} from '@/types/event-sourcing.types'
import {
  appendEvent,
  getAggregateEvents,
  getCorrelatedEvents,
  rebuildAggregateState,
  getStateAtTime,
  getAggregateHistory,
  createSnapshot,
  getAggregateStats,
  getEventTypeStats,
} from '@/services/event-store.service'

// ============================================================================
// Query Keys Factory
// ============================================================================

export const eventStoreKeys = {
  all: ['event-store'] as const,
  events: () => [...eventStoreKeys.all, 'events'] as const,
  aggregateEvents: (aggregateType: AggregateType, aggregateId: string) =>
    [...eventStoreKeys.events(), aggregateType, aggregateId] as const,
  correlatedEvents: (correlationId: string) =>
    [...eventStoreKeys.events(), 'correlated', correlationId] as const,
  state: () => [...eventStoreKeys.all, 'state'] as const,
  aggregateState: (aggregateType: AggregateType, aggregateId: string, version?: number) =>
    [...eventStoreKeys.state(), aggregateType, aggregateId, version] as const,
  stateAtTime: (aggregateType: AggregateType, aggregateId: string, timestamp: string) =>
    [...eventStoreKeys.state(), 'at-time', aggregateType, aggregateId, timestamp] as const,
  history: () => [...eventStoreKeys.all, 'history'] as const,
  aggregateHistory: (aggregateType: AggregateType, aggregateId: string) =>
    [...eventStoreKeys.history(), aggregateType, aggregateId] as const,
  stats: () => [...eventStoreKeys.all, 'stats'] as const,
  aggregateStats: (aggregateType: AggregateType, aggregateId: string) =>
    [...eventStoreKeys.stats(), aggregateType, aggregateId] as const,
  eventTypeStats: () => [...eventStoreKeys.stats(), 'event-types'] as const,
}

// ============================================================================
// Event Query Hooks
// ============================================================================

/**
 * Hook to fetch events for an aggregate
 */
export function useAggregateEvents(
  aggregateType: AggregateType,
  aggregateId: string,
  options?: {
    fromVersion?: number
    toVersion?: number
    limit?: number
    enabled?: boolean
  },
) {
  const { fromVersion = 0, toVersion, limit = 1000, enabled = true } = options || {}

  return useQuery<GetEventsResponse>({
    queryKey: eventStoreKeys.aggregateEvents(aggregateType, aggregateId),
    queryFn: () => getAggregateEvents(aggregateType, aggregateId, fromVersion, toVersion, limit),
    enabled: enabled && !!aggregateId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch correlated events (events linked by correlation ID)
 */
export function useCorrelatedEvents(correlationId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: eventStoreKeys.correlatedEvents(correlationId!),
    queryFn: () => getCorrelatedEvents(correlationId!),
    enabled: enabled && !!correlationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// State Query Hooks
// ============================================================================

/**
 * Hook to rebuild and fetch aggregate state
 */
export function useAggregateState<T = Record<string, unknown>>(
  aggregateType: AggregateType,
  aggregateId: string,
  options?: {
    targetVersion?: number
    enabled?: boolean
  },
) {
  const { targetVersion, enabled = true } = options || {}

  return useQuery<{ state: T; version: number; last_event_id: string | null }>({
    queryKey: eventStoreKeys.aggregateState(aggregateType, aggregateId, targetVersion),
    queryFn: () =>
      rebuildAggregateState(aggregateType, aggregateId, targetVersion) as Promise<{
        state: T
        version: number
        last_event_id: string | null
      }>,
    enabled: enabled && !!aggregateId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for time travel - get state at a specific point in time
 */
export function useStateAtTime<T = Record<string, unknown>>(
  aggregateType: AggregateType,
  aggregateId: string,
  timestamp: string | undefined,
  enabled = true,
) {
  return useQuery<{ state: T | null; as_of: string }>({
    queryKey: eventStoreKeys.stateAtTime(aggregateType, aggregateId, timestamp!),
    queryFn: () =>
      getStateAtTime(aggregateType, aggregateId, timestamp!) as Promise<{
        state: T | null
        as_of: string
      }>,
    enabled: enabled && !!aggregateId && !!timestamp,
    staleTime: 60 * 1000, // 1 minute - historical data changes less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================================================
// History Query Hooks
// ============================================================================

/**
 * Hook to fetch aggregate history with pagination
 */
export function useAggregateHistory(
  aggregateType: AggregateType,
  aggregateId: string,
  options?: {
    limit?: number
    enabled?: boolean
  },
) {
  const { limit = 50, enabled = true } = options || {}

  return useInfiniteQuery({
    queryKey: eventStoreKeys.aggregateHistory(aggregateType, aggregateId),
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number
      return getAggregateHistory(aggregateType, aggregateId, limit, offset)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: GetHistoryResponse, allPages) => {
      return lastPage.has_more ? allPages.length * limit : undefined
    },
    enabled: enabled && !!aggregateId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// Statistics Query Hooks
// ============================================================================

/**
 * Hook to fetch aggregate statistics
 */
export function useAggregateStats(
  aggregateType: AggregateType,
  aggregateId: string,
  enabled = true,
) {
  return useQuery<AggregateStats | null>({
    queryKey: eventStoreKeys.aggregateStats(aggregateType, aggregateId),
    queryFn: () => getAggregateStats(aggregateType, aggregateId),
    enabled: enabled && !!aggregateId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch event type statistics
 */
export function useEventTypeStats(enabled = true) {
  return useQuery<{ event_types: EventTypeStats[] }>({
    queryKey: eventStoreKeys.eventTypeStats(),
    queryFn: getEventTypeStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to append a new event
 */
export function useAppendEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: appendEvent,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateEvents(variables.aggregate_type, variables.aggregate_id),
      })
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateState(variables.aggregate_type, variables.aggregate_id),
      })
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateHistory(variables.aggregate_type, variables.aggregate_id),
      })
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateStats(variables.aggregate_type, variables.aggregate_id),
      })

      // If correlation ID provided, invalidate correlated events
      if (variables.correlation_id) {
        queryClient.invalidateQueries({
          queryKey: eventStoreKeys.correlatedEvents(variables.correlation_id),
        })
      }
    },
  })
}

/**
 * Hook to create a snapshot
 */
export function useCreateSnapshot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      aggregateType,
      aggregateId,
      state,
    }: {
      aggregateType: AggregateType
      aggregateId: string
      state: Record<string, unknown>
    }) => createSnapshot(aggregateType, aggregateId, state),
    onSuccess: (data, variables) => {
      // Invalidate state queries since we have a new snapshot
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateState(variables.aggregateType, variables.aggregateId),
      })
    },
  })
}

// ============================================================================
// Composite Hooks
// ============================================================================

/**
 * Hook to append an event with optimistic updates
 */
export function useAppendEventOptimistic<T extends Record<string, unknown>>(
  aggregateType: AggregateType,
  aggregateId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: appendEvent,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: eventStoreKeys.aggregateState(aggregateType, aggregateId),
      })

      // Snapshot the previous value
      const previousState = queryClient.getQueryData<{ state: T; version: number }>(
        eventStoreKeys.aggregateState(aggregateType, aggregateId),
      )

      // Optimistically update the state
      if (previousState) {
        queryClient.setQueryData(eventStoreKeys.aggregateState(aggregateType, aggregateId), {
          state: { ...previousState.state, ...variables.payload } as T,
          version: previousState.version + 1,
          last_event_id: 'pending',
        })
      }

      return { previousState }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousState) {
        queryClient.setQueryData(
          eventStoreKeys.aggregateState(aggregateType, aggregateId),
          context.previousState,
        )
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateState(aggregateType, aggregateId),
      })
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateEvents(aggregateType, aggregateId),
      })
      queryClient.invalidateQueries({
        queryKey: eventStoreKeys.aggregateHistory(aggregateType, aggregateId),
      })
    },
  })
}

/**
 * Hook for entity with full event sourcing support
 * Provides state, history, events, and mutation capabilities
 */
export function useEventSourcedEntity<T = Record<string, unknown>>(
  aggregateType: AggregateType,
  aggregateId: string,
  options?: {
    enableState?: boolean
    enableHistory?: boolean
    enableEvents?: boolean
    enableStats?: boolean
    historyLimit?: number
    eventsLimit?: number
  },
) {
  const {
    enableState = true,
    enableHistory = false,
    enableEvents = false,
    enableStats = false,
    historyLimit = 50,
    eventsLimit = 100,
  } = options || {}

  const stateQuery = useAggregateState<T>(aggregateType, aggregateId, {
    enabled: enableState && !!aggregateId,
  })

  const historyQuery = useAggregateHistory(aggregateType, aggregateId, {
    limit: historyLimit,
    enabled: enableHistory && !!aggregateId,
  })

  const eventsQuery = useAggregateEvents(aggregateType, aggregateId, {
    limit: eventsLimit,
    enabled: enableEvents && !!aggregateId,
  })

  const statsQuery = useAggregateStats(aggregateType, aggregateId, enableStats && !!aggregateId)

  const appendEventMutation = useAppendEventOptimistic<T>(aggregateType, aggregateId)
  const createSnapshotMutation = useCreateSnapshot()

  return {
    // State
    state: stateQuery.data?.state ?? null,
    version: stateQuery.data?.version ?? 0,
    stateLoading: stateQuery.isLoading,
    stateError: stateQuery.error,
    refetchState: stateQuery.refetch,

    // History
    history: historyQuery.data?.pages.flatMap((p) => p.history) ?? [],
    historyLoading: historyQuery.isLoading,
    historyError: historyQuery.error,
    hasMoreHistory: historyQuery.hasNextPage,
    fetchMoreHistory: historyQuery.fetchNextPage,

    // Events
    events: eventsQuery.data?.events ?? [],
    eventsLoading: eventsQuery.isLoading,
    eventsError: eventsQuery.error,

    // Stats
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,

    // Mutations
    appendEvent: appendEventMutation.mutateAsync,
    appendEventPending: appendEventMutation.isPending,
    appendEventError: appendEventMutation.error,

    createSnapshot: (state: Record<string, unknown>) =>
      createSnapshotMutation.mutateAsync({ aggregateType, aggregateId, state }),
    createSnapshotPending: createSnapshotMutation.isPending,
  }
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to compare state between two versions
 */
export function useStateComparison<T = Record<string, unknown>>(
  aggregateType: AggregateType,
  aggregateId: string,
  version1?: number,
  version2?: number,
  enabled = true,
) {
  const state1Query = useAggregateState<T>(aggregateType, aggregateId, {
    targetVersion: version1,
    enabled: enabled && !!version1,
  })

  const state2Query = useAggregateState<T>(aggregateType, aggregateId, {
    targetVersion: version2,
    enabled: enabled && !!version2,
  })

  return {
    state1: state1Query.data?.state ?? null,
    state2: state2Query.data?.state ?? null,
    loading: state1Query.isLoading || state2Query.isLoading,
    error: state1Query.error || state2Query.error,
  }
}

/**
 * Hook to compare state at two different points in time
 */
export function useTimeComparison<T = Record<string, unknown>>(
  aggregateType: AggregateType,
  aggregateId: string,
  timestamp1?: string,
  timestamp2?: string,
  enabled = true,
) {
  const state1Query = useStateAtTime<T>(aggregateType, aggregateId, timestamp1, enabled)
  const state2Query = useStateAtTime<T>(aggregateType, aggregateId, timestamp2, enabled)

  return {
    state1: state1Query.data?.state ?? null,
    state2: state2Query.data?.state ?? null,
    loading: state1Query.isLoading || state2Query.isLoading,
    error: state1Query.error || state2Query.error,
  }
}
