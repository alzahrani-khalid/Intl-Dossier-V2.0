/**
 * useBulkDossierStats Hook
 * @module hooks/useBulkDossierStats
 * @feature 030-health-commitment
 *
 * TanStack Query hook for efficiently fetching statistics for multiple dossiers
 * in a single batched request with intelligent caching.
 *
 * @description
 * This hook optimizes performance when displaying statistics for multiple dossiers
 * (e.g., in list views or dashboards) by batching requests into a single API call.
 *
 * Features:
 * - Batched API request (max 100 dossiers per request)
 * - Performance target: ≤1 second for 25 dossiers
 * - Selective stat inclusion to reduce payload size
 * - Intelligent caching with 5-minute stale time
 * - Automatic cache key generation based on dossier IDs
 * - Conditional fetching (disabled when dossierIds is empty)
 *
 * Available stat categories:
 * - commitments: Commitment counts and status breakdown
 * - engagements: Engagement metrics
 * - documents: Document counts by type
 * - health: Health score and indicators
 *
 * @example
 * // Fetch stats for multiple dossiers
 * const { data, isLoading } = useBulkDossierStats({
 *   dossierIds: ['uuid-1', 'uuid-2', 'uuid-3'],
 * });
 *
 * @example
 * // With selective inclusion
 * const { data } = useBulkDossierStats({
 *   dossierIds: dossierIds,
 *   include: ['commitments', 'health'],
 * });
 *
 * @example
 * // In a list view
 * const { data: statsMap } = useBulkDossierStats({
 *   dossierIds: dossiers.map(d => d.id),
 * });
 *
 * return dossiers.map(dossier => {
 *   const stats = statsMap?.[dossier.id];
 *   return (
 *     <DossierCard
 *       key={dossier.id}
 *       dossier={dossier}
 *       commitments={stats?.commitments}
 *       health={stats?.health}
 *     />
 *   );
 * });
 */

import { useQuery } from '@tanstack/react-query';
import {
  getBulkStats,
  type BulkDossierStatsResponse,
} from '@/services/dossier-stats.service';

/**
 * Options for the useBulkDossierStats hook
 */
export interface UseBulkDossierStatsOptions {
  /**
   * Array of dossier UUIDs to fetch stats for
   * @maximum 100 dossiers per request
   */
  dossierIds: string[];
  /**
   * Optional array of stat categories to include
   * If not specified, all categories are included
   * @default ['commitments', 'engagements', 'documents', 'health']
   */
  include?: Array<'commitments' | 'engagements' | 'documents' | 'health'>;
  /**
   * Enable or disable the query
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook to fetch statistics for multiple dossiers in a single batched request
 *
 * @description
 * Fetches aggregated statistics for an array of dossiers with intelligent caching
 * and performance optimizations. The hook automatically batches IDs into a single
 * API request and returns a map of dossier ID to statistics.
 *
 * Cache behavior:
 * - staleTime: 5 minutes - data considered fresh, no background refetch
 * - gcTime: 30 minutes - unused data removed from cache
 * - Cache key includes sorted dossier IDs for consistency
 *
 * Performance:
 * - Target: ≤1 second for 25 dossiers
 * - Supports up to 100 dossiers per request
 * - Selective inclusion reduces payload size
 *
 * @param options - Hook configuration options
 * @param options.dossierIds - Array of dossier UUIDs (max 100)
 * @param options.include - Optional stat categories to fetch
 * @param options.enabled - Whether the query should execute
 * @returns TanStack Query result with stats map keyed by dossier ID
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useBulkDossierStats({
 *   dossierIds: ['uuid-1', 'uuid-2', 'uuid-3'],
 * });
 *
 * // Access individual dossier stats
 * const dossier1Stats = data?.['uuid-1'];
 * console.log(`Health: ${dossier1Stats?.health?.score}`);
 *
 * @example
 * // With conditional fetching
 * const { data } = useBulkDossierStats({
 *   dossierIds: selectedDossierIds,
 *   include: ['commitments'],
 *   enabled: selectedDossierIds.length > 0,
 * });
 */
export function useBulkDossierStats(options: UseBulkDossierStatsOptions) {
  const { dossierIds, include, enabled = true } = options;

  return useQuery<BulkDossierStatsResponse, Error>({
    queryKey: ['bulkDossierStats', dossierIds, include],
    queryFn: () => getBulkStats(dossierIds, include),
    staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
    gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection)
    enabled: enabled && dossierIds.length > 0, // Only fetch if enabled and IDs exist
  });
}
