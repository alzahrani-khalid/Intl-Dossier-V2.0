/**
 * Legislation Hooks
 * TanStack Query hooks for legislation tracking operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getLegislations,
  getLegislation,
  createLegislation,
  updateLegislation,
  updateLegislationStatus,
  deleteLegislation,
  getLegislationSponsors,
  addLegislationSponsor,
  removeLegislationSponsor,
  getLegislationAmendments,
  createLegislationAmendment,
  updateLegislationAmendment,
  getLegislationDeadlines,
  createLegislationDeadline,
  updateLegislationDeadline,
  completeLegislationDeadline,
  deleteLegislationDeadline,
  getUpcomingDeadlines,
  getOpenCommentPeriods,
  getLegislationStatusHistory,
  watchLegislation,
  unwatchLegislation,
  updateWatchPreferences,
  getMyWatchedLegislations,
  getRelatedLegislations,
  addRelatedLegislation,
  removeRelatedLegislation,
  searchLegislations,
} from '@/services/legislation.service'
import {
  legislationKeys,
  type LegislationFilters,
  type LegislationCreateInput,
  type LegislationUpdateInput,
  type LegislationStatusUpdateInput,
  type LegislationListResponse,
  type LegislationSponsorInput,
  type LegislationAmendmentInput,
  type LegislationDeadlineInput,
  type LegislationWatcherInput,
  type RelatedLegislationInput,
  type LegislationDeadlineFilters,
} from '@/types/legislation.types'

// =============================================
// LEGISLATION LIST & DETAIL HOOKS
// =============================================

interface UseLegislationsOptions extends LegislationFilters {
  enabled?: boolean
}

/**
 * Hook to fetch a paginated list of legislations
 */
export function useLegislations(options?: UseLegislationsOptions) {
  const { enabled = true, ...filters } = options ?? {}

  return useQuery({
    queryKey: legislationKeys.list(filters),
    queryFn: () => getLegislations(filters),
    staleTime: STALE_TIME.LIVE, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    enabled,
  })
}

/**
 * Hook for infinite scroll pagination of legislations
 */
function useInfiniteLegislations(options?: UseLegislationsOptions) {
  const { enabled = true, ...filters } = options ?? {}

  return useInfiniteQuery<
    LegislationListResponse,
    Error,
    InfiniteData<LegislationListResponse>,
    ReturnType<typeof legislationKeys.list>,
    string | undefined
  >({
    queryKey: legislationKeys.list(filters),
    queryFn: ({ pageParam }) => getLegislations(filters, pageParam, 20),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: STALE_TIME.LIVE,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  })
}

/**
 * Hook to fetch a single legislation with full details
 */
export function useLegislation(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: legislationKeys.detail(id),
    queryFn: () => getLegislation(id),
    staleTime: STALE_TIME.LIVE,
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!id,
  })
}

// =============================================
// LEGISLATION MUTATIONS
// =============================================

/**
 * Hook to create a new legislation
 */
export function useCreateLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: LegislationCreateInput) => createLegislation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.lists() })
      toast.success(t('messages.created'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

/**
 * Hook to update an existing legislation
 */
export function useUpdateLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LegislationUpdateInput }) =>
      updateLegislation(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.lists() })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

/**
 * Hook to update legislation status
 */
function useUpdateLegislationStatus() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: LegislationStatusUpdateInput) => updateLegislationStatus(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: legislationKeys.statusHistory(data.id) })
      toast.success(t('messages.statusUpdated'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

/**
 * Hook to delete a legislation
 */
export function useDeleteLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (id: string) => deleteLegislation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.lists() })
      toast.success(t('messages.deleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// =============================================
// SPONSORS HOOKS
// =============================================

export function useLegislationSponsors(legislationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: legislationKeys.sponsors(legislationId),
    queryFn: () => getLegislationSponsors(legislationId),
    enabled: enabled && !!legislationId,
  })
}

function useAddLegislationSponsor() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: LegislationSponsorInput) => addLegislationSponsor(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.sponsors(data.legislation_id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.legislation_id) })
      toast.success(t('sponsors.added'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useRemoveLegislationSponsor() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({ id }: { id: string; legislationId: string }) => removeLegislationSponsor(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.sponsors(variables.legislationId),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.detail(variables.legislationId),
      })
      toast.success(t('sponsors.removed'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// =============================================
// AMENDMENTS HOOKS
// =============================================

export function useLegislationAmendments(legislationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: legislationKeys.amendments(legislationId),
    queryFn: () => getLegislationAmendments(legislationId),
    enabled: enabled && !!legislationId,
  })
}

function useCreateLegislationAmendment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: LegislationAmendmentInput) => createLegislationAmendment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.amendments(data.legislation_id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.legislation_id) })
      toast.success(t('amendments.created'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useUpdateLegislationAmendment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<LegislationAmendmentInput>
      legislationId: string
    }) => updateLegislationAmendment(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.amendments(variables.legislationId),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.detail(variables.legislationId),
      })
      toast.success(t('amendments.updated'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// =============================================
// DEADLINES HOOKS
// =============================================

export function useLegislationDeadlines(legislationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: legislationKeys.deadlines(legislationId),
    queryFn: () => getLegislationDeadlines(legislationId),
    enabled: enabled && !!legislationId,
  })
}

function useCreateLegislationDeadline() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: LegislationDeadlineInput) => createLegislationDeadline(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.deadlines(data.legislation_id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.legislation_id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.upcomingDeadlines() })
      toast.success(t('deadlines.created'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useUpdateLegislationDeadline() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<LegislationDeadlineInput>
      legislationId: string
    }) => updateLegislationDeadline(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.deadlines(variables.legislationId),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.detail(variables.legislationId),
      })
      queryClient.invalidateQueries({ queryKey: legislationKeys.upcomingDeadlines() })
      toast.success(t('deadlines.updated'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useCompleteLegislationDeadline() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({ id }: { id: string; legislationId: string }) => completeLegislationDeadline(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.deadlines(variables.legislationId),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.detail(variables.legislationId),
      })
      queryClient.invalidateQueries({ queryKey: legislationKeys.upcomingDeadlines() })
      toast.success(t('deadlines.completed'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useDeleteLegislationDeadline() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({ id }: { id: string; legislationId: string }) => deleteLegislationDeadline(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.deadlines(variables.legislationId),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.detail(variables.legislationId),
      })
      queryClient.invalidateQueries({ queryKey: legislationKeys.upcomingDeadlines() })
      toast.success(t('deadlines.deleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// =============================================
// UPCOMING DEADLINES & COMMENT PERIODS
// =============================================

function useUpcomingDeadlines(filters?: LegislationDeadlineFilters) {
  return useQuery({
    queryKey: legislationKeys.upcomingDeadlines(filters),
    queryFn: () => getUpcomingDeadlines(filters),
    staleTime: STALE_TIME.NORMAL, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  })
}

function useOpenCommentPeriods() {
  return useQuery({
    queryKey: legislationKeys.openCommentPeriods(),
    queryFn: () => getOpenCommentPeriods(),
    staleTime: STALE_TIME.NORMAL,
    refetchInterval: 5 * 60 * 1000,
  })
}

// =============================================
// STATUS HISTORY HOOKS
// =============================================

export function useLegislationStatusHistory(legislationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: legislationKeys.statusHistory(legislationId),
    queryFn: () => getLegislationStatusHistory(legislationId),
    enabled: enabled && !!legislationId,
  })
}

// =============================================
// WATCHER HOOKS
// =============================================

export function useWatchLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: LegislationWatcherInput) => watchLegislation(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.legislation_id) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.myWatches() })
      toast.success(t('watchers.watching'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUnwatchLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (legislationId: string) => unwatchLegislation(legislationId),
    onSuccess: (_, legislationId) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(legislationId) })
      queryClient.invalidateQueries({ queryKey: legislationKeys.myWatches() })
      toast.success(t('watchers.unwatched'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useUpdateWatchPreferences() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({
      legislationId,
      preferences,
    }: {
      legislationId: string
      preferences: Partial<Omit<LegislationWatcherInput, 'legislation_id'>>
    }) => updateWatchPreferences(legislationId, preferences),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: legislationKeys.detail(data.legislation_id) })
      toast.success(t('watchers.preferencesUpdated'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useMyWatchedLegislations() {
  return useQuery({
    queryKey: legislationKeys.myWatches(),
    queryFn: () => getMyWatchedLegislations(),
    staleTime: STALE_TIME.LIVE,
  })
}

// =============================================
// RELATED LEGISLATIONS HOOKS
// =============================================

export function useRelatedLegislations(legislationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: legislationKeys.relatedLegislations(legislationId),
    queryFn: () => getRelatedLegislations(legislationId),
    enabled: enabled && !!legislationId,
  })
}

function useAddRelatedLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: (input: RelatedLegislationInput) => addRelatedLegislation(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.relatedLegislations(data.legislation_id),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.relatedLegislations(data.related_legislation_id),
      })
      toast.success(t('related.added'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

function useRemoveRelatedLegislation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('legislation')

  return useMutation({
    mutationFn: ({ id }: { id: string; legislationId: string; relatedLegislationId: string }) =>
      removeRelatedLegislation(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: legislationKeys.relatedLegislations(variables.legislationId),
      })
      queryClient.invalidateQueries({
        queryKey: legislationKeys.relatedLegislations(variables.relatedLegislationId),
      })
      toast.success(t('related.removed'))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// =============================================
// SEARCH HOOK
// =============================================

function useSearchLegislations(query: string, limit: number = 20) {
  return useQuery({
    queryKey: ['legislations', 'search', query, limit],
    queryFn: () => searchLegislations(query, limit),
    enabled: query.length >= 2,
    staleTime: STALE_TIME.LIVE, // 30 seconds
  })
}
