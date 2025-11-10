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

import React from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  getIntelligence,
  refreshIntelligence,
  type GetIntelligenceParams,
  type RefreshIntelligenceParams,
  type IntelligenceReport,
  type GetIntelligenceResponse,
  type RefreshIntelligenceResponse,
  IntelligenceAPIError,
} from '@/services/intelligence-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  list: (params: GetIntelligenceParams) =>
    [...intelligenceKeys.lists(), params] as const,
  details: () => [...intelligenceKeys.all, 'detail'] as const,
  detail: (entityId: string, intelligenceType?: string) =>
    [...intelligenceKeys.details(), entityId, intelligenceType] as const,
  forEntity: (entityId: string) =>
    [...intelligenceKeys.all, 'entity', entityId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get refetch interval based on intelligence type TTL
 * TTL strategy:
 * - economic: 6 hours (quarterly data updates)
 * - political: 1 hour (volatile, time-sensitive)
 * - security: 30 minutes (dynamic threat landscape)
 * - bilateral: 12 hours (stable agreements)
 * - general: 6 hours (default)
 */
function getRefetchInterval(intelligenceType?: string): number | false {
  if (!intelligenceType) return false; // Disable auto-refresh for multi-type queries

  const TTL_INTERVALS = {
    economic: 6 * 60 * 60 * 1000,    // 6 hours
    political: 60 * 60 * 1000,       // 1 hour
    security: 30 * 60 * 1000,        // 30 minutes
    bilateral: 12 * 60 * 60 * 1000,  // 12 hours
    general: 6 * 60 * 60 * 1000,     // 6 hours (default)
  };

  return TTL_INTERVALS[intelligenceType as keyof typeof TTL_INTERVALS] || false;
}

/**
 * Hook to fetch intelligence data for an entity
 *
 * Features:
 * - Automatic caching with configurable TTL
 * - Stale-while-revalidate pattern (shows cached data while fetching fresh)
 * - Background refresh when cache expires (TTL-based)
 * - Supports filtering by intelligence type
 * - Multilingual content (English/Arabic)
 * - Silent background updates (no loading indicators)
 * - Auto-refresh based on intelligence type TTL
 * - Non-intrusive notifications when fresh data arrives
 *
 * @example
 * ```tsx
 * const { data, isLoading, isStale } = useIntelligence({
 *   entity_id: countryId,
 *   intelligence_type: 'economic',
 *   language: 'en',
 *   enableBackgroundNotifications: true
 * });
 * ```
 *
 * @param params - Query parameters (entity_id required)
 * @param options - TanStack Query options for customization
 */
export function useIntelligence(
  params: GetIntelligenceParams & { enableBackgroundNotifications?: boolean },
  options?: Omit<
    UseQueryOptions<GetIntelligenceResponse, IntelligenceAPIError>,
    'queryKey' | 'queryFn'
  >
) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const { enableBackgroundNotifications = false, ...queryParams } = params;

  // Auto-detect language from i18next if not provided
  const finalQueryParams: GetIntelligenceParams = {
    ...queryParams,
    language: queryParams.language || (i18n.language as 'en' | 'ar'),
  };

  // Calculate refetch interval based on intelligence type
  const refetchInterval = getRefetchInterval(params.intelligence_type);

  // Track previous data hash to detect actual data changes
  const previousDataRef = React.useRef<string | null>(null);

  const query = useQuery({
    queryKey: intelligenceKeys.list(finalQueryParams),
    queryFn: () => getIntelligence(finalQueryParams),
    // Stale-while-revalidate: show cached data immediately, refetch in background
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (formerly cacheTime)
    refetchOnMount: 'always', // Always check for updates on mount
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval, // Auto-refresh based on TTL (T069-T070)
    refetchIntervalInBackground: false, // Only refetch when tab is active (T071)
    retry: (failureCount, error) => {
      // Retry on network errors, but not on 404/403
      if (error.status === 404 || error.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });

  // Show non-intrusive notification when background refresh brings fresh data (T072)
  React.useEffect(() => {
    if (!enableBackgroundNotifications || !query.data) return;

    const currentDataHash = JSON.stringify(query.data.data.map(d => ({
      id: d.id,
      version: d.version,
      last_refreshed_at: d.last_refreshed_at
    })));

    // Check if data actually changed (not just initial load)
    if (previousDataRef.current && previousDataRef.current !== currentDataHash) {
      const intelligenceTypeLabel = params.intelligence_type
        ? t(`intelligence.types.${params.intelligence_type}`, params.intelligence_type)
        : t('intelligence.types.all', 'intelligence');

      // Non-intrusive info toast (T072)
      toast.info(
        t(
          'intelligence.backgroundRefresh.success',
          `Fresh {{type}} data is now available`,
          { type: intelligenceTypeLabel }
        ),
        {
          duration: 3000,
          dismissible: true,
        }
      );
    }

    previousDataRef.current = currentDataHash;
  }, [query.data, enableBackgroundNotifications, params.intelligence_type, t]);

  return query;
}

/**
 * Hook to fetch a single intelligence report by entity and type
 *
 * Convenience wrapper around useIntelligence for single-type queries.
 *
 * @example
 * ```tsx
 * const { data: economicIntel } = useIntelligenceByType(
 *   countryId,
 *   'economic'
 * );
 * ```
 */
export function useIntelligenceByType(
  entityId: string,
  intelligenceType: 'economic' | 'political' | 'security' | 'bilateral' | 'general',
  options?: Omit<
    UseQueryOptions<IntelligenceReport | undefined, IntelligenceAPIError>,
    'queryKey' | 'queryFn'
  >
) {
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: intelligenceKeys.detail(entityId, intelligenceType),
    queryFn: async () => {
      const response = await getIntelligence({
        entity_id: entityId,
        intelligence_type: intelligenceType,
        language: i18n.language as 'en' | 'ar',
      });
      // Return first item or undefined
      return response.data[0];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    ...options,
  });
}

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
  >
) {
  const { i18n } = useTranslation();

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
  });
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
  options?: UseMutationOptions<
    RefreshIntelligenceResponse,
    IntelligenceAPIError,
    RefreshIntelligenceParams
  >
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: RefreshIntelligenceParams) => refreshIntelligence(params),

    onMutate: async (params) => {
      // Cancel outgoing queries for this entity
      await queryClient.cancelQueries({
        queryKey: intelligenceKeys.forEntity(params.entity_id),
      });

      // Snapshot current data
      const previousData = queryClient.getQueryData<GetIntelligenceResponse>(
        intelligenceKeys.forEntity(params.entity_id)
      );

      // Optimistic update: mark intelligence as "refreshing"
      if (previousData) {
        const updatedData = {
          ...previousData,
          data: previousData.data.map((item) => {
            const shouldUpdate =
              !params.intelligence_types ||
              params.intelligence_types.includes(item.intelligence_type);

            return shouldUpdate
              ? { ...item, refresh_status: 'refreshing' as const }
              : item;
          }),
        };

        queryClient.setQueryData(
          intelligenceKeys.forEntity(params.entity_id),
          updatedData
        );
      }

      // Show loading toast
      const toastId = toast.loading(
        t('intelligence.refresh.loading', 'Refreshing intelligence data...')
      );

      return { previousData, toastId };
    },

    onSuccess: (data, params, context) => {
      // Dismiss loading toast
      if (context?.toastId) {
        toast.dismiss(context.toastId);
      }

      // Show success toast
      toast.success(t('intelligence.refresh.success', data.message_en));

      // Add small delay to allow database transaction to fully commit
      // before refetching (prevents race condition with 404 errors)
      setTimeout(() => {
        console.log('[useIntelligence] Invalidating queries for entity:', params.entity_id);
        
        // Invalidate and refetch intelligence data
        queryClient.invalidateQueries({
          queryKey: intelligenceKeys.forEntity(params.entity_id),
        });

        // Also invalidate specific type queries if selective refresh
        if (params.intelligence_types) {
          params.intelligence_types.forEach((type) => {
            console.log('[useIntelligence] Invalidating query for type:', type);
            queryClient.invalidateQueries({
              queryKey: intelligenceKeys.detail(params.entity_id, type),
            });
          });
        }

        // Force refetch to ensure data updates immediately
        console.log('[useIntelligence] Force refetching intelligence data...');
        queryClient.refetchQueries({
          queryKey: intelligenceKeys.forEntity(params.entity_id),
        });
      }, 1000); // Wait 1 second for database commit
    },

    onError: (error, params, context) => {
      // Dismiss loading toast
      if (context?.toastId) {
        toast.dismiss(context.toastId);
      }

      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          intelligenceKeys.forEntity(params.entity_id),
          context.previousData
        );
      }

      // Handle specific error cases
      if (error.status === 409) {
        // Refresh already in progress
        toast.warning(
          t(
            'intelligence.refresh.conflict',
            'A refresh is already in progress. Please wait.'
          )
        );
      } else if (error.status === 503) {
        // AnythingLLM unavailable
        toast.error(
          t(
            'intelligence.refresh.serviceUnavailable',
            'Intelligence service is temporarily unavailable. Cached data remains accessible.'
          )
        );
      } else {
        // Generic error
        toast.error(
          t('intelligence.refresh.error', `Failed to refresh: ${error.message}`)
        );
      }
    },

    ...options,
  });
}

/**
 * Hook to refresh a specific intelligence type
 *
 * Convenience wrapper for selective refresh of a single intelligence type.
 *
 * @example
 * ```tsx
 * const { mutate: refreshEconomic } = useRefreshIntelligenceType();
 *
 * refreshEconomic({
 *   entity_id: countryId,
 *   intelligence_type: 'economic'
 * });
 * ```
 */
export function useRefreshIntelligenceType(
  options?: UseMutationOptions<
    RefreshIntelligenceResponse,
    IntelligenceAPIError,
    {
      entity_id: string;
      intelligence_type: 'economic' | 'political' | 'security' | 'bilateral';
      force?: boolean;
      priority?: 'low' | 'normal' | 'high';
    }
  >
) {
  const refreshMutation = useRefreshIntelligence();

  return useMutation({
    mutationFn: (params) =>
      refreshIntelligence({
        entity_id: params.entity_id,
        intelligence_types: [params.intelligence_type],
        force: params.force,
        priority: params.priority,
      }),
    ...options,
  });
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
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();

  return (entityId: string) => {
    queryClient.prefetchQuery({
      queryKey: intelligenceKeys.forEntity(entityId),
      queryFn: () =>
        getIntelligence({
          entity_id: entityId,
          language: i18n.language as 'en' | 'ar',
        }),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate all intelligence queries (useful after bulk operations)
 *
 * @example
 * ```tsx
 * const invalidateAllIntelligence = useInvalidateAllIntelligence();
 *
 * const handleBulkRefresh = async () => {
 *   await bulkRefreshAPI();
 *   invalidateAllIntelligence();
 * };
 * ```
 */
export function useInvalidateAllIntelligence() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: intelligenceKeys.all });
  };
}

/**
 * Hook to check if intelligence data is stale
 *
 * Returns true if any intelligence report for the entity has expired cache.
 *
 * @example
 * ```tsx
 * const isStale = useIntelligenceStaleStatus(countryId);
 *
 * {isStale && <Badge>Outdated Data</Badge>}
 * ```
 */
export function useIntelligenceStaleStatus(entityId: string): boolean {
  const { data } = useAllIntelligence(entityId, {
    enabled: !!entityId,
  });

  if (!data) return false;

  return data.data.some((report) => report.is_expired || report.refresh_status === 'stale');
}

/**
 * Hook to get intelligence refresh status
 *
 * Returns the refresh status for all intelligence types.
 *
 * @example
 * ```tsx
 * const status = useIntelligenceRefreshStatus(countryId);
 *
 * {status.isRefreshing && <Spinner />}
 * {status.hasErrors && <Alert>Some intelligence failed to refresh</Alert>}
 * ```
 */
export function useIntelligenceRefreshStatus(entityId: string) {
  const { data } = useAllIntelligence(entityId, {
    enabled: !!entityId,
  });

  if (!data) {
    return {
      isRefreshing: false,
      hasErrors: false,
      hasFresh: false,
      hasStale: false,
    };
  }

  return {
    isRefreshing: data.data.some((r) => r.refresh_status === 'refreshing'),
    hasErrors: data.data.some((r) => r.refresh_status === 'error'),
    hasFresh: data.data.some((r) => r.refresh_status === 'fresh'),
    hasStale: data.data.some((r) => r.refresh_status === 'stale' || r.is_expired),
  };
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
} from '@/services/intelligence-api';
