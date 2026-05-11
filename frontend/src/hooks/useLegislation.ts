/**
 * Legislation Hooks
 * TanStack Query hooks for legislation tracking operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getLegislations,
  getLegislation,
  createLegislation,
  updateLegislation,
  deleteLegislation,
  getLegislationSponsors,
  getLegislationAmendments,
  getLegislationDeadlines,
  completeLegislationDeadline,
  getLegislationStatusHistory,
  watchLegislation,
  unwatchLegislation,
  getRelatedLegislations,
} from '@/services/legislation.service'
import {
  legislationKeys,
  type LegislationFilters,
  type LegislationCreateInput,
  type LegislationUpdateInput,
  type LegislationWatcherInput,
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
