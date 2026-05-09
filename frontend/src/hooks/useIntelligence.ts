/**
 * Intelligence Hooks
 * Feature: 029-dynamic-country-intelligence
 *
 * TanStack Query hooks for dynamic country intelligence operations.
 * Provides automatic caching with TTL-based stale-while-revalidate pattern,
 * manual refresh capabilities, and optimistic updates.
 *
 * @see specs/029-dynamic-country-intelligence/spec.md
 * @see specs/029-dynamic-country-intelligence/api-contracts/openapi.yaml
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import {
  getIntelligence,
  refreshIntelligence,
  type GetIntelligenceParams,
  type RefreshIntelligenceParams,
  type GetIntelligenceResponse,
  type RefreshIntelligenceResponse,
  IntelligenceAPIError,
} from '@/services/intelligence-api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Hierarchical query keys for intelligence data
 * Enables granular cache invalidation and prefetching
 */
export const intelligenceKeys = {
  all: ['intelligence'] as const,
  lists: () => [...intelligenceKeys.all, 'list'] as const,
  list: (params: GetIntelligenceParams) => [...intelligenceKeys.lists(), params] as const,
  details: () => [...intelligenceKeys.all, 'detail'] as const,
  detail: (entityId: string, intelligenceType?: string) =>
    [...intelligenceKeys.details(), entityId, intelligenceType] as const,
  forEntity: (entityId: string) => [...intelligenceKeys.all, 'entity', entityId] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch all intelligence types for an entity
 *
 * Fetches economic, political, security, and bilateral intelligence in a single query.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAllIntelligence(countryId);
 * // data contains all intelligence types with meta information
 * ```
 */
export function useAllIntelligence(
  entityId: string,
  options?: Omit<
    UseQueryOptions<GetIntelligenceResponse, IntelligenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { i18n } = useTranslation()

  return useQuery({
    queryKey: intelligenceKeys.forEntity(entityId),
    queryFn: () =>
      getIntelligence({
        entity_id: entityId,
        include_stale: true,
        language: i18n.language as 'en' | 'ar',
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to manually refresh intelligence data
 *
 * Features:
 * - Optimistic updates (shows loading state immediately)
 * - Automatic cache invalidation on success
 * - Toast notifications for user feedback
 * - Handles concurrent refresh conflicts (409)
 * - Graceful degradation when AnythingLLM unavailable (503)
 *
 * @example
 * ```tsx
 * const { mutate: refresh, isPending } = useRefreshIntelligence();
 *
 * const handleRefresh = () => {
 *   refresh({
 *     entity_id: countryId,
 *     intelligence_types: ['economic', 'political'],
 *     priority: 'high'
 *   });
 * };
 * ```
 *
 * @param options - TanStack Query mutation options
 */
export function useRefreshIntelligence(
  options?: Omit<
    UseMutationOptions<
      RefreshIntelligenceResponse,
      IntelligenceAPIError,
      RefreshIntelligenceParams
    >,
    'mutationFn' | 'onMutate' | 'onSuccess' | 'onError'
  >,
) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  type RefreshMutationContext = {
    previousData: GetIntelligenceResponse | undefined
    toastId: string | number
  }

  return useMutation<
    RefreshIntelligenceResponse,
    IntelligenceAPIError,
    RefreshIntelligenceParams,
    RefreshMutationContext
  >({
    mutationFn: (params: RefreshIntelligenceParams) => refreshIntelligence(params),

    onMutate: async (params) => {
      // Cancel outgoing queries for this entity
      await queryClient.cancelQueries({
        queryKey: intelligenceKeys.forEntity(params.entity_id),
      })

      // Snapshot current data
      const previousData = queryClient.getQueryData<GetIntelligenceResponse>(
        intelligenceKeys.forEntity(params.entity_id),
      )

      // Optimistic update: mark intelligence as "refreshing"
      if (previousData) {
        const updatedData = {
          ...previousData,
          data: previousData.data.map((item) => {
            const shouldUpdate =
              !params.intelligence_types ||
              params.intelligence_types.includes(item.intelligence_type)

            return shouldUpdate ? { ...item, refresh_status: 'refreshing' as const } : item
          }),
        }

        queryClient.setQueryData(intelligenceKeys.forEntity(params.entity_id), updatedData)
      }

      // Show loading toast
      const toastId = toast.loading(
        t('intelligence.refresh.loading', 'Refreshing intelligence data...'),
      )

      return { previousData, toastId }
    },

    onSuccess: (data, params, context) => {
      // Dismiss loading toast
      if (context?.toastId) {
        toast.dismiss(context.toastId)
      }

      // Show success toast
      toast.success(t('intelligence.refresh.success', data.message_en))

      // Add small delay to allow database transaction to fully commit
      // before refetching (prevents race condition with 404 errors)
      setTimeout(() => {
        // Invalidate and refetch intelligence data
        queryClient.invalidateQueries({
          queryKey: intelligenceKeys.forEntity(params.entity_id),
        })

        // Also invalidate specific type queries if selective refresh
        if (params.intelligence_types) {
          params.intelligence_types.forEach((type) => {
            queryClient.invalidateQueries({
              queryKey: intelligenceKeys.detail(params.entity_id, type),
            })
          })
        }

        // Force refetch to ensure data updates immediately
        queryClient.refetchQueries({
          queryKey: intelligenceKeys.forEntity(params.entity_id),
        })
      }, 1000) // Wait 1 second for database commit
    },

    onError: (error, params, context) => {
      // Dismiss loading toast
      if (context?.toastId) {
        toast.dismiss(context.toastId)
      }

      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(intelligenceKeys.forEntity(params.entity_id), context.previousData)
      }

      // Handle specific error cases
      if (error.status === 409) {
        // Refresh already in progress
        toast.warning(
          t('intelligence.refresh.conflict', 'A refresh is already in progress. Please wait.'),
        )
      } else if (error.status === 503) {
        // AnythingLLM unavailable
        toast.error(
          t(
            'intelligence.refresh.serviceUnavailable',
            'Intelligence service is temporarily unavailable. Cached data remains accessible.',
          ),
        )
      } else {
        // Generic error
        toast.error(t('intelligence.refresh.error', `Failed to refresh: ${error.message}`))
      }
    },

    ...options,
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to prefetch intelligence data (useful for hover effects, navigation)
 *
 * @example
 * ```tsx
 * const prefetchIntelligence = usePrefetchIntelligence();
 *
 * <Link
 *   to={`/dossiers/${countryId}`}
 *   onMouseEnter={() => prefetchIntelligence(countryId)}
 * >
 * ```
 */
export function usePrefetchIntelligence() {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()

  return (entityId: string) => {
    queryClient.prefetchQuery({
      queryKey: intelligenceKeys.forEntity(entityId),
      queryFn: () =>
        getIntelligence({
          entity_id: entityId,
          language: i18n.language as 'en' | 'ar',
        }),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// ============================================================================
// Type Re-exports for Convenience
// ============================================================================

export type {
  IntelligenceReport,
  GetIntelligenceResponse,
  RefreshIntelligenceResponse,
  GetIntelligenceParams,
  RefreshIntelligenceParams,
} from '@/services/intelligence-api'
