/**
 * Engagement Positions Hook
 * @module hooks/useEngagementPositions
 * @feature 035-dossier-context
 * @feature engagement-position-linking
 *
 * TanStack Query hook for fetching positions attached to engagement dossiers with
 * automatic caching, sorting, and pagination.
 *
 * @description
 * This module provides a React hook for managing engagement-position relationships:
 * - Query hook for fetching positions linked to an engagement
 * - Support for sorting by display_order, relevance_score, or attached_at
 * - Pagination with configurable page size
 * - Automatic caching and cache invalidation
 * - Enriched position data with full position details
 *
 * Positions are linked to engagements to provide policy context and strategic guidance
 * for diplomatic interactions. Each link includes metadata like attachment reason,
 * display order, and relevance score.
 *
 * @example
 * // Fetch positions for an engagement
 * const { positions, total, isLoading } = useEngagementPositions({
 *   engagementId: 'engagement-uuid',
 *   sort: 'relevance_score',
 *   order: 'desc',
 *   page: 1,
 *   pageSize: 10,
 * });
 *
 * @example
 * // Access position data
 * positions.forEach(pos => {
 *   console.log(pos.positions.title); // Position title
 *   console.log(pos.attachment_reason); // Why it's linked
 *   console.log(pos.relevance_score); // Relevance to engagement
 * });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Engagement position entity with linked position details
 *
 * @interface EngagementPosition
 * @property {string} id - Unique identifier for the engagement-position link
 * @property {string} engagement_id - UUID of the engagement
 * @property {string} position_id - UUID of the linked position
 * @property {string} attached_by - UUID of user who created the link
 * @property {string} attached_at - ISO timestamp of when link was created
 * @property {string} [attachment_reason] - Optional reason for the link
 * @property {number} [display_order] - Optional display order for sorting
 * @property {number} [relevance_score] - Optional relevance score (0-100)
 * @property {Object} positions - Full position details from JOIN
 * @property {string} positions.id - Position UUID
 * @property {string} positions.title - Position title
 * @property {string} positions.content - Position content/description
 * @property {string} positions.type - Position type
 * @property {string} positions.status - Position status
 * @property {string} positions.primary_language - Primary language: 'en' or 'ar'
 * @property {string} positions.created_at - Position creation timestamp
 * @property {string} positions.updated_at - Position last update timestamp
 */
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

/**
 * Options for useEngagementPositions hook
 *
 * @interface UseEngagementPositionsOptions
 * @property {string} engagementId - The UUID of the engagement
 * @property {string} [sort='attached_at'] - Sort field: 'display_order', 'relevance_score', or 'attached_at'
 * @property {string} [order='desc'] - Sort order: 'asc' or 'desc'
 * @property {number} [page=1] - Page number for pagination (1-indexed)
 * @property {number} [pageSize=20] - Number of items per page
 * @property {boolean} [enabled=true] - Whether the query should run
 */
export interface UseEngagementPositionsOptions {
  engagementId: string;
  sort?: 'display_order' | 'relevance_score' | 'attached_at';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Result object returned by useEngagementPositions hook
 *
 * @interface UseEngagementPositionsResult
 * @property {EngagementPosition[]} positions - Array of engagement positions
 * @property {number} total - Total number of positions across all pages
 * @property {number} page - Current page number
 * @property {number} pageSize - Number of items per page
 * @property {number} totalPages - Total number of pages
 * @property {boolean} isLoading - Loading state for initial fetch
 * @property {boolean} isError - Error state flag
 * @property {Error | null} error - Error object if fetch failed
 * @property {Function} refetch - Function to manually refetch data
 */
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

/**
 * Async function to fetch engagement positions from Supabase
 *
 * @description
 * Performs a database query to fetch positions linked to an engagement with
 * sorting, pagination, and full position details via JOIN. Returns both the
 * positions array and total count for pagination.
 *
 * @param {UseEngagementPositionsOptions} options - Query options
 * @returns {Promise<{positions: EngagementPosition[], total: number}>} Positions and total count
 * @throws {Error} Throws if database query fails
 * @private
 */
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

/**
 * Hook to fetch positions linked to an engagement
 *
 * @description
 * Fetches a paginated list of positions attached to a specific engagement with
 * configurable sorting and pagination. Results are cached using TanStack Query
 * with a 5-minute stale time. The query is automatically enabled when engagementId
 * is provided and the enabled option is true.
 *
 * Sorting options:
 * - display_order: Manual ordering set by user
 * - relevance_score: AI-computed relevance to engagement (0-100)
 * - attached_at: When the position was linked (default)
 *
 * @param {UseEngagementPositionsOptions} options - Query options
 * @returns {UseEngagementPositionsResult} Hook result with positions, pagination, and loading states
 *
 * @example
 * // Fetch positions sorted by relevance
 * const { positions, total, isLoading, refetch } = useEngagementPositions({
 *   engagementId: 'engagement-uuid',
 *   sort: 'relevance_score',
 *   order: 'desc',
 *   page: 1,
 *   pageSize: 10,
 * });
 *
 * @example
 * // Conditional fetching
 * const { positions } = useEngagementPositions({
 *   engagementId: 'engagement-uuid',
 *   enabled: !!engagementId, // Only fetch if engagementId exists
 * });
 *
 * @example
 * // Access position data
 * if (isLoading) return <Spinner />;
 * return (
 *   <div>
 *     <h2>Relevant Positions ({total})</h2>
 *     {positions.map(pos => (
 *       <PositionCard
 *         key={pos.id}
 *         position={pos.positions}
 *         relevance={pos.relevance_score}
 *         reason={pos.attachment_reason}
 *       />
 *     ))}
 *     <Pagination page={page} totalPages={totalPages} />
 *   </div>
 * );
 */
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
