/**
 * Attention Items Hook + Query Key Factory
 * Phase 10: Operations Hub Dashboard
 *
 * TanStack Query hook for the Attention Needed zone.
 * staleTime: 30s (most time-sensitive zone per D-19).
 * Also exports the shared query key factory for all Operations Hub hooks.
 */

import { useQuery } from '@tanstack/react-query'
import type { AttentionItemData } from '../types/operations-hub.types'
import { getAttentionItems } from '../repositories/operations-hub.repository'

// ============================================================================
// Query Key Factory (shared across all Operations Hub hooks)
// ============================================================================

export const operationsHubKeys = {
  all: ['operations-hub'] as const,
  attention: (userId?: string) =>
    [...operationsHubKeys.all, 'attention', userId] as const,
  timeline: (userId?: string) =>
    [...operationsHubKeys.all, 'timeline', userId] as const,
  stages: (userId?: string) =>
    [...operationsHubKeys.all, 'stages', userId] as const,
  stats: (userId?: string) =>
    [...operationsHubKeys.all, 'stats', userId] as const,
  activity: () =>
    [...operationsHubKeys.all, 'activity'] as const,
}

// ============================================================================
// useAttentionItems Hook
// ============================================================================

/**
 * Fetches items needing attention: overdue, due-soon, SLA-at-risk, stalled.
 * Most time-sensitive zone — 30s staleTime with window focus refetch.
 */
export function useAttentionItems(userId?: string): ReturnType<typeof useQuery<AttentionItemData[], Error>> {
  return useQuery<AttentionItemData[], Error>({
    queryKey: operationsHubKeys.attention(userId),
    queryFn: () => getAttentionItems(userId ?? null),
    staleTime: 30_000, // 30 seconds — most time-sensitive per D-19
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}
