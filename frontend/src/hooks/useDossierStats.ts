/**
 * Dossier Statistics Hook
 * @module hooks/useDossierStats
 * @feature 030-health-commitment
 * @feature 034-dossier-ui-polish
 *
 * TanStack Query hook for fetching dossier statistics with automatic caching,
 * background refresh, and selective data inclusion.
 *
 * @description
 * This hook provides aggregated statistics for a dossier including:
 * - Commitment counts and status breakdown
 * - Engagement metrics
 * - Document counts by type
 * - Health score and indicators
 *
 * The hook implements intelligent caching with:
 * - 5-minute stale time (data considered fresh)
 * - 30-minute garbage collection
 * - Automatic refetch on window focus
 * - Background refetch every 5 minutes
 *
 * @example
 * // Fetch all stats for a dossier
 * const { data, isLoading } = useDossierStats({ dossierId: 'uuid-123' });
 *
 * @example
 * // Fetch only specific stat categories
 * const { data } = useDossierStats({
 *   dossierId: 'uuid-123',
 *   include: ['commitments', 'health'],
 * });
 *
 * @example
 * // Conditionally enable the query
 * const { data } = useDossierStats({
 *   dossierId,
 *   enabled: !!dossierId && isVisible,
 * });
 */

import { useQuery } from '@tanstack/react-query'
import { getStats, type DossierStats } from '@/services/dossier-stats.service'

/**
 * Options for the useDossierStats hook
 */
export interface UseDossierStatsOptions {
  /**
   * The UUID of the dossier to fetch statistics for
   */
  dossierId: string
  /**
   * Optional array of stat categories to include
   * If not specified, all categories are included
   * @default ['commitments', 'engagements', 'documents', 'health']
   */
  include?: Array<'commitments' | 'engagements' | 'documents' | 'health'>
  /**
   * Whether the query should be enabled
   * Useful for conditional fetching based on UI state
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook to fetch dossier statistics with intelligent caching
 *
 * @description
 * Fetches aggregated statistics for a dossier with configurable caching behavior.
 * Supports selective data inclusion to reduce payload size when only specific
 * stats are needed.
 *
 * Cache behavior:
 * - staleTime: 5 minutes - data considered fresh, no background refetch
 * - gcTime: 30 minutes - unused data removed from cache
 * - refetchOnWindowFocus: true - refreshes when user returns to tab
 * - refetchInterval: 5 minutes - background updates for long-lived pages
 *
 * @param options - Hook configuration options
 * @param options.dossierId - Required dossier UUID
 * @param options.include - Optional array of stat categories to fetch
 * @param options.enabled - Optional flag to enable/disable the query
 * @returns TanStack Query result with DossierStats data
 *
 * @example
 * // Basic usage
 * const { data: stats } = useDossierStats({ dossierId: 'uuid-123' });
 * console.log(`Health score: ${stats?.health?.score}`);
 *
 * @example
 * // With selective inclusion
 * const { data } = useDossierStats({
 *   dossierId: 'uuid-123',
 *   include: ['commitments'],
 * });
 * console.log(`Open commitments: ${data?.commitments?.open}`);
 */
export function useDossierStats(options: UseDossierStatsOptions) {
  const { dossierId, include, enabled = true } = options

  return useQuery<DossierStats, Error>({
    queryKey: ['dossierStats', dossierId, include],
    queryFn: () => getStats(dossierId, include),
    staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
    gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
    enabled: enabled && !!dossierId, // Only fetch if enabled and dossierId exists
  })
}
