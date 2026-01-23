/**
 * Position Analytics Query Hooks
 * @module hooks/usePositionAnalytics
 * @feature T042
 *
 * TanStack Query hooks for fetching position usage analytics and trending data.
 *
 * @description
 * This module provides React hooks for position analytics and metrics:
 * - Query hook for position-specific analytics (views, attachments, briefings)
 * - Query hook for top positions by various metrics
 * - Trend data with daily/weekly/monthly breakdowns
 * - Popularity scoring and ranking
 * - Automatic caching with 10-minute stale time
 *
 * @example
 * // Fetch analytics for a position
 * const { analytics } = usePositionAnalytics({ positionId: 'uuid' });
 *
 * @example
 * // Fetch top positions by popularity
 * const { topPositions } = useTopPositions({ metric: 'popularity', limit: 10 });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Position analytics data structure
 *
 * @description
 * Contains comprehensive usage metrics and trend data for a position.
 */
export interface PositionAnalytics {
  position_id: string;
  view_count: number;
  attachment_count: number;
  briefing_pack_count: number;
  last_viewed_at?: string;
  last_attached_at?: string;
  trend_data?: {
    daily?: { date: string; views: number; attachments: number }[];
    weekly?: { week: string; views: number; attachments: number }[];
    monthly?: { month: string; views: number; attachments: number }[];
  };
  popularity_score?: number; // Computed weighted score
  usage_rank?: number; // Rank among all positions
  updated_at: string;
}

export interface UsePositionAnalyticsOptions {
  positionId: string;
  enabled?: boolean;
}

/**
 * Fetches position analytics from the Edge Function
 *
 * @description
 * Internal function that calls the positions analytics Edge Function to retrieve
 * usage metrics and trend data for a specific position.
 *
 * @param positionId - The unique identifier of the position
 * @returns Promise resolving to PositionAnalytics data
 * @throws Error if authentication fails or position not found
 * @private
 */
async function fetchPositionAnalytics(
  positionId: string
): Promise<PositionAnalytics> {
  // Call edge function to get analytics
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/positions/${positionId}/analytics`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Position not found');
    }
    throw new Error('Failed to fetch position analytics');
  }

  return await response.json();
}

/**
 * Hook to fetch usage analytics for a position
 *
 * @description
 * Fetches comprehensive usage analytics including view counts, attachment counts,
 * briefing pack usage, trend data, and popularity rankings. Analytics data is
 * cached for 10 minutes as it doesn't change frequently.
 *
 * @param options - Configuration options
 * @param options.positionId - The unique identifier of the position
 * @param options.enabled - Whether to enable the query (defaults to true)
 * @returns Object containing analytics data, loading state, and error state
 *
 * @example
 * // Basic usage
 * const { analytics, isLoading } = usePositionAnalytics({ positionId: 'uuid' });
 *
 * @example
 * // Conditional fetching
 * const { analytics } = usePositionAnalytics({
 *   positionId: 'uuid',
 *   enabled: !!currentUser,
 * });
 *
 * @example
 * // Access trend data
 * const { analytics } = usePositionAnalytics({ positionId: 'uuid' });
 * const dailyTrends = analytics?.trend_data?.daily || [];
 */
export function usePositionAnalytics(
  options: UsePositionAnalyticsOptions
) {
  const {
    positionId,
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['position-analytics', positionId],
    queryFn: () => fetchPositionAnalytics(positionId),
    enabled: enabled && !!positionId,
    staleTime: 10 * 60 * 1000, // 10 minutes (analytics don't change frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    analytics: data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Options for fetching top positions query
 *
 * @description
 * Configuration for filtering and sorting top positions by various metrics.
 */
export interface TopPositionsOptions {
  metric?: 'views' | 'attachments' | 'briefings' | 'popularity';
  timeRange?: '7d' | '30d' | '90d' | 'all';
  limit?: number;
  enabled?: boolean;
}

export interface TopPosition {
  position_id: string;
  position_title: string;
  position_type: string;
  metric_value: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Fetches top positions from the Edge Function
 *
 * @description
 * Internal function that calls the positions analytics Edge Function to retrieve
 * top-performing positions ranked by various metrics.
 *
 * @param options - Query options (metric, timeRange, limit)
 * @returns Promise resolving to array of TopPosition data
 * @throws Error if authentication fails or request fails
 * @private
 */
async function fetchTopPositions(
  options: TopPositionsOptions
): Promise<TopPosition[]> {
  const {
    metric = 'popularity',
    timeRange = '30d',
    limit = 10,
  } = options;

  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/positions/analytics/top?metric=${metric}&time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch top positions');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Hook to fetch top positions by various metrics
 *
 * @description
 * Fetches a ranked list of top-performing positions filtered by metric
 * (views, attachments, briefings, or popularity) and time range. Results
 * are cached for 15 minutes.
 *
 * @param options - Configuration options
 * @param options.metric - Metric to rank by (defaults to 'popularity')
 * @param options.timeRange - Time window for metrics (defaults to '30d')
 * @param options.limit - Maximum number of positions to return (defaults to 10)
 * @param options.enabled - Whether to enable the query (defaults to true)
 * @returns Object containing top positions array, loading state, and error state
 *
 * @example
 * // Fetch top 10 positions by popularity in last 30 days
 * const { topPositions, isLoading } = useTopPositions();
 *
 * @example
 * // Fetch top 20 by views in last 7 days
 * const { topPositions } = useTopPositions({
 *   metric: 'views',
 *   timeRange: '7d',
 *   limit: 20,
 * });
 *
 * @example
 * // Fetch top briefing positions of all time
 * const { topPositions } = useTopPositions({
 *   metric: 'briefings',
 *   timeRange: 'all',
 * });
 */
export function useTopPositions(
  options: TopPositionsOptions = {}
) {
  const {
    metric = 'popularity',
    timeRange = '30d',
    limit = 10,
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['top-positions', metric, timeRange, limit],
    queryFn: () => fetchTopPositions(options),
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
  });

  return {
    topPositions: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
