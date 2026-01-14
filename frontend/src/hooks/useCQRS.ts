/**
 * CQRS React Hooks
 *
 * TanStack Query hooks for CQRS operations.
 * Separates read (query) and write (command) operations for optimal performance.
 *
 * Query hooks use optimized read models for fast data fetching.
 * Command hooks handle mutations with proper cache invalidation.
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import {
  queries,
  commands,
  generateIdempotencyKey,
  generateCorrelationId,
  type TimelineQuery,
  type TimelineResponse,
  type TimelineEvent,
  type GraphQuery,
  type GraphResponse,
  type DossierSummary,
  type SearchQuery,
  type SearchResponse,
  type CreateDossierCommand,
  type UpdateDossierCommand,
  type ArchiveDossierCommand,
  type CreateRelationshipCommand,
  type DeleteRelationshipCommand,
  type CreateCalendarCommand,
  type UpdateCalendarCommand,
  type DeleteCalendarCommand,
  type CommandResult,
} from '@/services/cqrs.service'

// ============================================================================
// Query Keys Factory
// ============================================================================

export const cqrsKeys = {
  all: ['cqrs'] as const,

  // Timeline keys
  timeline: () => [...cqrsKeys.all, 'timeline'] as const,
  timelineForDossier: (dossierId: string, filters?: Partial<TimelineQuery>) =>
    [...cqrsKeys.timeline(), dossierId, filters] as const,

  // Graph keys
  graph: () => [...cqrsKeys.all, 'graph'] as const,
  graphForDossier: (dossierId: string, options?: Partial<GraphQuery>) =>
    [...cqrsKeys.graph(), dossierId, options] as const,

  // Summary keys
  summaries: () => [...cqrsKeys.all, 'summaries'] as const,
  summary: (dossierId: string) => [...cqrsKeys.summaries(), dossierId] as const,

  // Search keys
  search: () => [...cqrsKeys.all, 'search'] as const,
  searchResults: (query: string, filters?: Partial<SearchQuery>) =>
    [...cqrsKeys.search(), query, filters] as const,

  // Metrics keys
  metrics: () => [...cqrsKeys.all, 'metrics'] as const,
  dailyMetrics: (dateRange?: { from?: string; to?: string }) =>
    [...cqrsKeys.metrics(), 'daily', dateRange] as const,
}

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * Hook to fetch timeline events with infinite scrolling
 *
 * Uses optimized read model for fast queries.
 * Supports filtering by event type, priority, date range, and search.
 */
export function useTimeline(
  dossierId: string,
  options?: {
    eventTypes?: string[]
    priority?: string[]
    dateFrom?: string
    dateTo?: string
    searchQuery?: string
    limit?: number
    enabled?: boolean
  },
) {
  const {
    eventTypes,
    priority,
    dateFrom,
    dateTo,
    searchQuery,
    limit = 20,
    enabled = true,
  } = options || {}

  return useInfiniteQuery({
    queryKey: cqrsKeys.timelineForDossier(dossierId, {
      event_types: eventTypes,
      priority,
      date_from: dateFrom,
      date_to: dateTo,
      search_query: searchQuery,
    }),
    queryFn: async ({ pageParam }) => {
      return queries.timeline({
        dossier_id: dossierId,
        event_types: eventTypes,
        priority,
        date_from: dateFrom,
        date_to: dateTo,
        search_query: searchQuery,
        cursor: pageParam as string | undefined,
        limit,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled: enabled && !!dossierId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch relationship graph
 *
 * Uses pre-computed graph for fast traversal.
 * Supports filtering by relationship type and max depth.
 */
export function useRelationshipGraph(
  dossierId: string,
  options?: {
    relationshipTypes?: string[]
    maxDepth?: number
    includeInactive?: boolean
    enabled?: boolean
  },
) {
  const { relationshipTypes, maxDepth = 2, includeInactive = false, enabled = true } = options || {}

  return useQuery<GraphResponse>({
    queryKey: cqrsKeys.graphForDossier(dossierId, {
      relationship_types: relationshipTypes,
      max_depth: maxDepth,
      include_inactive: includeInactive,
    }),
    queryFn: () =>
      queries.graph({
        dossier_id: dossierId,
        relationship_types: relationshipTypes,
        max_depth: maxDepth,
        include_inactive: includeInactive,
      }),
    enabled: enabled && !!dossierId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch pre-computed dossier summary
 *
 * Includes aggregated stats like relationship count, events, etc.
 */
export function useDossierSummary(
  dossierId: string,
  options?: {
    enabled?: boolean
  },
) {
  const { enabled = true } = options || {}

  return useQuery<DossierSummary>({
    queryKey: cqrsKeys.summary(dossierId),
    queryFn: () => queries.dossierSummary(dossierId),
    enabled: enabled && !!dossierId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to search dossiers using optimized full-text search
 */
export function useDossierSearch(
  searchQuery: string,
  options?: {
    types?: string[]
    status?: string[]
    limit?: number
    offset?: number
    enabled?: boolean
  },
) {
  const { types, status, limit = 20, offset = 0, enabled = true } = options || {}

  return useQuery<SearchResponse>({
    queryKey: cqrsKeys.searchResults(searchQuery, { types, status, limit, offset }),
    queryFn: () =>
      queries.search({
        query: searchQuery,
        types,
        status,
        limit,
        offset,
      }),
    enabled: enabled && searchQuery.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch daily metrics
 */
export function useDailyMetrics(options?: {
  dateFrom?: string
  dateTo?: string
  metricType?: string
  enabled?: boolean
}) {
  const { dateFrom, dateTo, metricType, enabled = true } = options || {}

  return useQuery({
    queryKey: cqrsKeys.dailyMetrics({ from: dateFrom, to: dateTo }),
    queryFn: () =>
      queries.metrics({
        date_from: dateFrom,
        date_to: dateTo,
        metric_type: metricType,
      }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// COMMAND HOOKS (Write Operations)
// ============================================================================

/**
 * Hook to create a new dossier
 */
export function useCreateDossier(
  options?: UseMutationOptions<CommandResult<Record<string, unknown>>, Error, CreateDossierCommand>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.dossier.create({
        ...command,
        idempotency_key: command.idempotency_key || generateIdempotencyKey('create-dossier', 'new'),
      }),
    onSuccess: (data) => {
      // Invalidate dossier-related queries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summaries() })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.search() })
    },
    ...options,
  })
}

/**
 * Hook to update a dossier
 */
export function useUpdateDossier(
  options?: UseMutationOptions<CommandResult<Record<string, unknown>>, Error, UpdateDossierCommand>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.dossier.update({
        ...command,
        idempotency_key:
          command.idempotency_key || generateIdempotencyKey('update-dossier', command.id),
      }),
    onSuccess: (data, variables) => {
      // Invalidate specific dossier and related queries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.id) })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.timelineForDossier(variables.id) })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.graphForDossier(variables.id) })
    },
    ...options,
  })
}

/**
 * Hook to archive a dossier
 */
export function useArchiveDossier(
  options?: UseMutationOptions<
    CommandResult<Record<string, unknown>>,
    Error,
    ArchiveDossierCommand
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.dossier.archive({
        ...command,
        idempotency_key:
          command.idempotency_key || generateIdempotencyKey('archive-dossier', command.id),
      }),
    onSuccess: (data, variables) => {
      // Invalidate dossier and related queries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.id) })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summaries() })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.search() })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.graph() })
    },
    ...options,
  })
}

/**
 * Hook to create a relationship
 */
export function useCreateRelationship(
  options?: UseMutationOptions<
    CommandResult<Record<string, unknown>>,
    Error,
    CreateRelationshipCommand
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.relationship.create({
        ...command,
        idempotency_key:
          command.idempotency_key ||
          generateIdempotencyKey(
            'create-relationship',
            `${command.source_dossier_id}-${command.target_dossier_id}`,
          ),
      }),
    onSuccess: (data, variables) => {
      // Invalidate graph queries for both source and target
      queryClient.invalidateQueries({
        queryKey: cqrsKeys.graphForDossier(variables.source_dossier_id),
      })
      queryClient.invalidateQueries({
        queryKey: cqrsKeys.graphForDossier(variables.target_dossier_id),
      })
      // Update summaries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.source_dossier_id) })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.target_dossier_id) })
    },
    ...options,
  })
}

/**
 * Hook to delete a relationship
 */
export function useDeleteRelationship(
  options?: UseMutationOptions<
    CommandResult<{ deleted: boolean; id: string }>,
    Error,
    DeleteRelationshipCommand & { sourceDossierId?: string; targetDossierId?: string }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.relationship.delete({
        id: command.id,
        idempotency_key:
          command.idempotency_key || generateIdempotencyKey('delete-relationship', command.id),
      }),
    onSuccess: (data, variables) => {
      // Invalidate graph queries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.graph() })
      // Update summaries if dossier IDs provided
      if (variables.sourceDossierId) {
        queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.sourceDossierId) })
      }
      if (variables.targetDossierId) {
        queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.targetDossierId) })
      }
    },
    ...options,
  })
}

/**
 * Hook to create a calendar entry
 */
export function useCreateCalendarEntry(
  options?: UseMutationOptions<
    CommandResult<Record<string, unknown>>,
    Error,
    CreateCalendarCommand
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.calendar.create({
        ...command,
        idempotency_key:
          command.idempotency_key || generateIdempotencyKey('create-calendar', command.dossier_id),
      }),
    onSuccess: (data, variables) => {
      // Invalidate timeline queries for the dossier
      queryClient.invalidateQueries({
        queryKey: cqrsKeys.timelineForDossier(variables.dossier_id),
      })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(variables.dossier_id) })
    },
    ...options,
  })
}

/**
 * Hook to update a calendar entry
 */
export function useUpdateCalendarEntry(
  dossierId: string,
  options?: UseMutationOptions<
    CommandResult<Record<string, unknown>>,
    Error,
    UpdateCalendarCommand
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.calendar.update({
        ...command,
        idempotency_key:
          command.idempotency_key || generateIdempotencyKey('update-calendar', command.id),
      }),
    onSuccess: () => {
      // Invalidate timeline queries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.timelineForDossier(dossierId) })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(dossierId) })
    },
    ...options,
  })
}

/**
 * Hook to delete a calendar entry
 */
export function useDeleteCalendarEntry(
  dossierId: string,
  options?: UseMutationOptions<
    CommandResult<{ deleted: boolean; id: string }>,
    Error,
    DeleteCalendarCommand
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command) =>
      commands.calendar.delete({
        ...command,
        idempotency_key:
          command.idempotency_key || generateIdempotencyKey('delete-calendar', command.id),
      }),
    onSuccess: () => {
      // Invalidate timeline queries
      queryClient.invalidateQueries({ queryKey: cqrsKeys.timelineForDossier(dossierId) })
      queryClient.invalidateQueries({ queryKey: cqrsKeys.summary(dossierId) })
    },
    ...options,
  })
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Hook for dossier detail page with timeline, graph, and summary
 */
export function useDossierCQRS(
  dossierId: string,
  options?: {
    enableTimeline?: boolean
    enableGraph?: boolean
    enableSummary?: boolean
    timelineLimit?: number
    graphMaxDepth?: number
  },
) {
  const {
    enableTimeline = true,
    enableGraph = true,
    enableSummary = true,
    timelineLimit = 20,
    graphMaxDepth = 2,
  } = options || {}

  const summaryQuery = useDossierSummary(dossierId, { enabled: enableSummary })
  const timelineQuery = useTimeline(dossierId, {
    limit: timelineLimit,
    enabled: enableTimeline,
  })
  const graphQuery = useRelationshipGraph(dossierId, {
    maxDepth: graphMaxDepth,
    enabled: enableGraph,
  })

  // Command hooks
  const updateDossier = useUpdateDossier()
  const archiveDossier = useArchiveDossier()
  const createRelationship = useCreateRelationship()
  const createCalendarEntry = useCreateCalendarEntry()

  return {
    // Query data
    summary: summaryQuery.data,
    summaryLoading: summaryQuery.isLoading,
    summaryError: summaryQuery.error,

    timeline: timelineQuery.data?.pages.flatMap((p) => p.events) || [],
    timelineLoading: timelineQuery.isLoading,
    timelineError: timelineQuery.error,
    hasMoreTimeline: timelineQuery.hasNextPage,
    fetchMoreTimeline: timelineQuery.fetchNextPage,

    graph: graphQuery.data,
    graphLoading: graphQuery.isLoading,
    graphError: graphQuery.error,

    // Commands
    updateDossier: updateDossier.mutateAsync,
    updateDossierPending: updateDossier.isPending,
    updateDossierError: updateDossier.error,

    archiveDossier: archiveDossier.mutateAsync,
    archiveDossierPending: archiveDossier.isPending,

    createRelationship: createRelationship.mutateAsync,
    createRelationshipPending: createRelationship.isPending,

    createCalendarEntry: createCalendarEntry.mutateAsync,
    createCalendarEntryPending: createCalendarEntry.isPending,

    // Refresh functions
    refetchSummary: summaryQuery.refetch,
    refetchTimeline: timelineQuery.refetch,
    refetchGraph: graphQuery.refetch,
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export { generateIdempotencyKey, generateCorrelationId }
