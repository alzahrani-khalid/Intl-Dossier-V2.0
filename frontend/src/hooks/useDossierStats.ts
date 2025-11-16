/**
 * useDossierStats Hook
 * Feature: 030-health-commitment
 *
 * TanStack Query hook for fetching dossier statistics with automatic caching and background refresh
 */

import { useQuery } from '@tanstack/react-query';
import { getStats, type DossierStats } from '@/services/dossier-stats.service';

export interface UseDossierStatsOptions {
  /**
   * Dossier ID to fetch stats for
   */
  dossierId: string;
  /**
   * Optional array of stat categories to include (default: all)
   */
  include?: Array<'commitments' | 'engagements' | 'documents' | 'health'>;
  /**
   * Enable or disable the query (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to fetch dossier statistics with caching
 *
 * Features:
 * - 5-minute stale time (data considered fresh)
 * - 30-minute garbage collection time
 * - Automatic refetch on window focus
 * - Background refetch every 5 minutes
 *
 * @param options - Hook options
 * @returns TanStack Query result
 */
export function useDossierStats(options: UseDossierStatsOptions) {
  const { dossierId, include, enabled = true } = options;

  return useQuery<DossierStats, Error>({
    queryKey: ['dossierStats', dossierId, include],
    queryFn: () => getStats(dossierId, include),
    staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
    gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
    enabled: enabled && !!dossierId, // Only fetch if enabled and dossierId exists
  });
}
