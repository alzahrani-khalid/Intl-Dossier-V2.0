/**
 * TanStack Query Hook: useEngagementPositions (T035)
 * Fetches positions attached to an engagement with sorting and pagination
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EngagementPosition {
  id: string;
  engagement_id: string;
  position_id: string;
  attached_by: string;
  attached_at: string;
  attachment_reason?: string;
  display_order?: number;
  relevance_score?: number;
  positions: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    primary_language: 'en' | 'ar';
    created_at: string;
    updated_at: string;
  };
}

export interface UseEngagementPositionsOptions {
  engagementId: string;
  sort?: 'display_order' | 'relevance_score' | 'attached_at';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export interface UseEngagementPositionsResult {
  positions: EngagementPosition[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchEngagementPositions(
  options: UseEngagementPositionsOptions
): Promise<{ positions: EngagementPosition[]; total: number }> {
  const {
    engagementId,
    sort = 'attached_at',
    order = 'desc',
    page = 1,
    pageSize = 20,
  } = options;

  // Build query
  let query = supabase
    .from('engagement_positions')
    .select('*, positions(*)', { count: 'exact' })
    .eq('engagement_id', engagementId);

  // Apply sorting
  const ascending = order === 'asc';
  query = query.order(sort, { ascending });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch engagement positions: ${error.message}`);
  }

  return {
    positions: (data || []) as EngagementPosition[],
    total: count || 0,
  };
}

export function useEngagementPositions(
  options: UseEngagementPositionsOptions
): UseEngagementPositionsResult {
  const {
    engagementId,
    sort = 'attached_at',
    order = 'desc',
    page = 1,
    pageSize = 20,
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['engagement-positions', engagementId, sort, order, page, pageSize],
    queryFn: () => fetchEngagementPositions(options),
    enabled: enabled && !!engagementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const positions = data?.positions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    positions,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
