/**
 * useBulkDossierStats Hook
 * Feature: 030-health-commitment
 *
 * TanStack Query hook for fetching multiple dossier statistics in a single request
 */

import { useQuery } from '@tanstack/react-query';
import {
  getBulkStats,
  type BulkDossierStatsResponse,
} from '@/services/dossier-stats.service';

export interface UseBulkDossierStatsOptions {
  /**
   * Array of dossier IDs to fetch stats for (max 100)
   */
  dossierIds: string[];
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
 * Hook to fetch statistics for multiple dossiers with caching
 *
 * Features:
 * - 5-minute stale time (data considered fresh)
 * - 30-minute garbage collection time
 * - Only fetches if dossierIds array is not empty
 * - Efficient batched query (≤1s for 25 dossiers per spec)
 *
 * @param options - Hook options
 * @returns TanStack Query result
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
