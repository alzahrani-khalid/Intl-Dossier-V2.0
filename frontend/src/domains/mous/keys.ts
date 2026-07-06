/**
 * MoU Query Key Factory
 * @module domains/mous/keys
 *
 * Canonical query keys for MoU TanStack Query operations. The root string MUST
 * stay `'mous'` so `mouKeys.all` prefix-matches the inline list key MousPage uses
 * (`['mous', searchTerm, filterState]`), making one invalidation refresh the list.
 */

export const mouKeys = {
  all: ['mous'] as const,
  list: (filters?: Record<string, unknown>) => [...mouKeys.all, filters] as const,
}
