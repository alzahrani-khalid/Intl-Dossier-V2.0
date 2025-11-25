/**
 * useCommitments Hook
 * Feature: 030-health-commitment
 *
 * TanStack Query hook for fetching commitments list with automatic caching
 */

import { useQuery } from '@tanstack/react-query';
import {
  getCommitments,
  type CommitmentFilters,
  type CommitmentsListResponse,
} from '@/services/commitments.service';

export interface UseCommitmentsOptions extends CommitmentFilters {
  /**
   * Enable or disable the query (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to fetch commitments list with caching
 *
 * Features:
 * - 2-minute stale time (data considered fresh)
 * - 10-minute garbage collection time
 * - Automatic refetch on window focus
 * - Background refetch every 2 minutes
 *
 * @param options - Hook options with filters
 * @returns TanStack Query result
 */
export function useCommitments(options?: UseCommitmentsOptions) {
  const { enabled = true, ...filters } = options ?? {};

  return useQuery<CommitmentsListResponse, Error>({
    queryKey: ['commitments', filters],
    queryFn: () => getCommitments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (data considered fresh)
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 2 * 60 * 1000, // Background refetch every 2 minutes
    enabled,
  });
}
