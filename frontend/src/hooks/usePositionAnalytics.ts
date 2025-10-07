/**
 * TanStack Query Hook: usePositionAnalytics (T042)
 * Fetches usage analytics for a position
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
 * Hook to fetch top positions by various metrics
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
