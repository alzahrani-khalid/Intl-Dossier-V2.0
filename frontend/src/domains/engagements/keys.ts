/**
 * Engagement Query Key Factory
 * @module domains/engagements/keys
 *
 * Canonical query key factory for all engagement-related TanStack Query operations.
 * Provides hierarchical keys for granular cache invalidation.
 *
 * @example
 * // Invalidate all engagement queries
 * queryClient.invalidateQueries({ queryKey: engagementKeys.all })
 *
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
 */

export const engagementKeys = {
  all: ['engagements'] as const,
  lists: () => [...engagementKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...engagementKeys.lists(), filters] as const,
  details: () => [...engagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...engagementKeys.details(), id] as const,
  participants: (engagementId: string) =>
    [...engagementKeys.all, 'participants', engagementId] as const,
  agenda: (engagementId: string) => [...engagementKeys.all, 'agenda', engagementId] as const,
  afterActions: (id: string) => [...engagementKeys.detail(id), 'after-actions'] as const,
}
