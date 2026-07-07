/**
 * useFacetCounts — Phase 87 F24 (AFF-02)
 *
 * Live per-option result counts for the Filter popover. Each filter option gets a
 * head-count query built by the config's `buildCountQuery` (the working-groups
 * head-count pattern: anon Supabase client `.select('*', { count, head: true })`
 * so RLS applies — NEVER a service-role count endpoint, T-87-06). Queries are
 * gated on `open` so nothing fires while the popover is closed (the DossierDrawer
 * `enabled` precedent), with a 30s staleTime.
 */

import { useQueries } from '@tanstack/react-query'
import type { ListControlsConfig } from './useListControls'

/** counts[fieldKey][optionValue] = live result count (undefined while loading). */
export type FacetCounts = Record<string, Record<string, number | undefined>>

export function useFacetCounts(
  config: ListControlsConfig,
  surfaceKey: string,
  activeFilters: Record<string, string | undefined>,
  open: boolean,
): FacetCounts {
  // Flatten (field, option) pairs that declare a count builder — stable per config
  // so the useQueries array length never changes across renders (rules-of-hooks).
  const entries = config.filters.flatMap((field) =>
    field.buildCountQuery
      ? field.options.map((opt) => ({
          fieldKey: field.key,
          value: opt.value,
          build: field.buildCountQuery!,
        }))
      : [],
  )

  const results = useQueries({
    queries: entries.map((e) => ({
      queryKey: ['facet-count', surfaceKey, e.fieldKey, e.value, activeFilters] as const,
      queryFn: (): Promise<number> => e.build(e.value, activeFilters),
      enabled: open,
      staleTime: 30_000,
    })),
  })

  const counts: FacetCounts = {}
  entries.forEach((e, i) => {
    const data = results[i]?.data
    const bucket = (counts[e.fieldKey] ??= {})
    bucket[e.value] = typeof data === 'number' ? data : undefined
  })
  return counts
}
