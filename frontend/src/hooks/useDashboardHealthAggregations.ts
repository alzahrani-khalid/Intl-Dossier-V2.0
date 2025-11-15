/**
 * useDashboardHealthAggregations Hook
 * Feature: 030-health-commitment - User Story 2
 *
 * TanStack Query hook for fetching dashboard health aggregations grouped by region, bloc, or classification
 */

import { useQuery } from '@tanstack/react-query';
import {
  getDashboardAggregations,
  type DashboardAggregationsResponse,
  type DashboardAggregationsFilter,
} from '@/services/dossier-stats.service';

export interface UseDashboardHealthAggregationsOptions {
  /**
   * Field to group aggregations by
   */
  groupBy: 'region' | 'bloc' | 'classification';
  /**
   * Optional filter criteria
   */
  filter?: DashboardAggregationsFilter;
  /**
   * Enable or disable the query (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to fetch dashboard health aggregations with caching and automatic background refresh
 *
 * Features:
 * - 5-minute stale time (data considered fresh)
 * - 30-minute garbage collection time
 * - Background refetch every 5 minutes (dashboard stays live)
 * - Automatic refetch on window focus
 * - Meets ≤2s SLA for regional aggregations per spec
 *
 * @param options - Hook options
 * @returns TanStack Query result
 */
export function useDashboardHealthAggregations(
  options: UseDashboardHealthAggregationsOptions
) {
  const { groupBy, filter, enabled = true } = options;

  return useQuery<DashboardAggregationsResponse, Error>({
    queryKey: ['dashboardHealthAggregations', groupBy, filter],
    queryFn: () => getDashboardAggregations(groupBy, filter),
    staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
    gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection)
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes (live dashboard)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    enabled: enabled && !!groupBy, // Only fetch if enabled and groupBy is specified
  });
}
