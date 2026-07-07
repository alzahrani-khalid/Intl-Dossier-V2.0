/**
 * useListControls — Phase 87 F24 (AFF-02, locked decision 3)
 *
 * The surface-agnostic URL-param engine behind the split Filter + Display popovers.
 * Filter = which rows (flat per-surface keys); Display = how arranged (sort/dir,
 * property visibility via a comma-joined `cols`, and kanban `group`). The hook is
 * router-agnostic: it takes the current parsed `search` plus a `setSearch` reducer
 * applier the route supplies, so it unit-tests without a router. Chip derivation is
 * delegated to the existing `useActiveFilters` hook (no duplicate chip logic).
 *
 * URL contract (single source of truth — see 87-02-PLAN.md §objective):
 * - Filter params: flat per-surface keys (`status`, `sensitivity`, `type`, ...).
 * - Display params: `sort` (field id), `dir` ('asc' | 'desc'), `cols` (comma-joined
 *   visible property ids; absent = surface defaults), `group` (kanban only).
 * - Reserved names never reused: `dossier`, `dossierType`, `commitment`, `page`, `search`.
 * - Every filter change resets `page: 1`; routes navigate with `replace: true`.
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useActiveFilters,
  type FilterFieldConfig,
} from '@/components/active-filters/useActiveFilters'
import type { FilterChipConfig } from '@/components/active-filters/ActiveFiltersBar'

export interface FilterFieldDef {
  /** URL param name ('status', 'sensitivity', 'type', ...). */
  key: string
  /** list-controls:… or surface-namespace i18n key for the group header. */
  labelKey: string
  options: { value: string; labelKey: string }[]
  /** Optional live facet-count builder — RLS-scoped head-count for this value. */
  buildCountQuery?: (value: string, active: Record<string, string | undefined>) => Promise<number>
}

export interface SortFieldDef {
  id: string
  labelKey: string
}

export interface PropertyDef {
  id: string
  labelKey: string
  defaultVisible: boolean
}

export interface GroupingDef {
  id: string
  labelKey: string
}

export interface ListControlsConfig {
  filters: FilterFieldDef[]
  /** omit → no Sort by section */
  sortFields?: SortFieldDef[]
  /** omit or < 2 entries → no Display properties section (Open Q3) */
  properties?: PropertyDef[]
  /** kanban only; omit → 'No grouping' static row */
  grouping?: GroupingDef[]
}

/** Router-supplied reducer applier — pure param logic, no router dependency. */
export type SetSearch = (
  reducer: (prev: Record<string, unknown>) => Record<string, unknown>,
) => void

export interface UseListControlsReturn {
  /** Active filter values, keyed by config filter key. */
  filters: Record<string, string | undefined>
  sort?: string
  dir?: 'asc' | 'desc'
  /** Currently-visible property ids (defaults when `cols` is absent). */
  visibleProperties: string[]
  group?: string
  activeFilterCount: number
  hasActiveFilters: boolean
  filterChips: FilterChipConfig[]
  setFilter: (key: string, value: string | undefined) => void
  removeFilter: (key: string, arrayValue?: string) => void
  clearAll: () => void
  setSort: (id: string) => void
  setDir: (dir: 'asc' | 'desc') => void
  toggleProperty: (id: string) => void
  setGroup: (id: string | undefined) => void
  resetDisplay: () => void
}

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

const defaultVisibleIds = (config: ListControlsConfig): string[] =>
  (config.properties ?? []).filter((p) => p.defaultVisible).map((p) => p.id)

/**
 * Whitelist-validate raw route search against a config — routes call this inside
 * `validateSearch`. Every param is checked against config-declared values/ids;
 * anything unknown becomes `undefined` (T-87-04 tampering mitigation). Only the
 * params this config owns are returned; page/search stay the route's concern.
 */
export function parseListControlsSearch(
  raw: Record<string, unknown>,
  config: ListControlsConfig,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}

  for (const field of config.filters) {
    const v = raw[field.key]
    if (typeof v === 'string' && field.options.some((o) => o.value === v)) {
      out[field.key] = v
    }
  }

  if (config.sortFields?.length) {
    const s = raw.sort
    if (typeof s === 'string' && config.sortFields.some((f) => f.id === s)) {
      out.sort = s
    }
  }

  const d = raw.dir
  if (d === 'asc' || d === 'desc') {
    out.dir = d
  }

  if (config.properties?.length) {
    const c = raw.cols
    if (typeof c === 'string') {
      const known = new Set(config.properties.map((p) => p.id))
      const filtered = c
        .split(',')
        .map((s) => s.trim())
        .filter((id) => known.has(id))
      if (filtered.length > 0) {
        out.cols = filtered.join(',')
      }
    }
  }

  if (config.grouping?.length) {
    const g = raw.group
    if (typeof g === 'string' && config.grouping.some((x) => x.id === g)) {
      out.group = g
    }
  }

  return out
}

export function useListControls(
  config: ListControlsConfig,
  search: Record<string, unknown>,
  setSearch: SetSearch,
): UseListControlsReturn {
  // Bound to list-controls so bare option keys resolve; colon-qualified keys
  // (e.g. `list-controls:sensitivity.3`) resolve regardless of the binding.
  const { t } = useTranslation('list-controls')

  const filters = useMemo<Record<string, string | undefined>>(() => {
    const f: Record<string, string | undefined> = {}
    for (const field of config.filters) {
      const v = asString(search[field.key])
      if (v !== undefined) {
        f[field.key] = v
      }
    }
    return f
  }, [config.filters, search])

  const sort = asString(search.sort)
  const dirRaw = search.dir
  const dir = dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : undefined
  const group = asString(search.group)

  const visibleProperties = useMemo<string[]>(() => {
    const props = config.properties ?? []
    const defaults = defaultVisibleIds(config)
    const cols = asString(search.cols)
    if (cols === undefined) {
      return defaults
    }
    const known = new Set(props.map((p) => p.id))
    const fromCols = cols.split(',').filter((id) => known.has(id))
    return fromCols.length > 0 ? fromCols : defaults
  }, [config, search.cols])

  // Chip derivation reuses useActiveFilters wholesale (UI-free). Each config filter
  // maps to a single-value string field; formatValue resolves the option label to
  // its translated string so chips never leak the raw i18n key.
  const fieldConfigs = useMemo<FilterFieldConfig[]>(
    () =>
      config.filters.map((field) => ({
        key: field.key,
        labelKey: field.labelKey,
        type: 'string' as const,
        formatValue: (value: unknown): string => {
          const opt = field.options.find((o) => o.value === value)
          return opt ? t(opt.labelKey) : String(value)
        },
      })),
    [config.filters, t],
  )

  const onFiltersChange = useCallback(
    (next: Record<string, unknown>): void => {
      setSearch((prev) => {
        const out = { ...prev }
        for (const field of config.filters) {
          out[field.key] = next[field.key]
        }
        out.page = 1
        return out
      })
    },
    [config.filters, setSearch],
  )

  const active = useActiveFilters({
    filters,
    fieldConfigs,
    onFiltersChange,
  })

  const setFilter = useCallback(
    (key: string, value: string | undefined): void => {
      setSearch((prev) => ({ ...prev, [key]: value, page: 1 }))
    },
    [setSearch],
  )

  const clearAll = useCallback((): void => {
    setSearch((prev) => {
      const out = { ...prev }
      for (const field of config.filters) {
        delete out[field.key]
      }
      out.page = 1
      return out
    })
  }, [config.filters, setSearch])

  const setSort = useCallback(
    (id: string): void => {
      setSearch((prev) => ({ ...prev, sort: id }))
    },
    [setSearch],
  )

  const setDir = useCallback(
    (nextDir: 'asc' | 'desc'): void => {
      setSearch((prev) => ({ ...prev, dir: nextDir }))
    },
    [setSearch],
  )

  const toggleProperty = useCallback(
    (id: string): void => {
      const props = config.properties ?? []
      const defaults = defaultVisibleIds(config)
      const current = new Set(visibleProperties)
      if (current.has(id)) {
        current.delete(id)
      } else {
        current.add(id)
      }
      // Preserve property-definition order for a stable, shareable URL.
      const nextVisible = props.map((p) => p.id).filter((pid) => current.has(pid))
      const isDefault =
        nextVisible.length === defaults.length && nextVisible.every((pid) => defaults.includes(pid))
      const cols = isDefault ? undefined : nextVisible.join(',')
      setSearch((prev) => {
        const out = { ...prev }
        if (cols === undefined) {
          delete out.cols
        } else {
          out.cols = cols
        }
        return out
      })
    },
    [config, visibleProperties, setSearch],
  )

  const setGroup = useCallback(
    (id: string | undefined): void => {
      setSearch((prev) => {
        const out = { ...prev }
        if (id === undefined || id === '') {
          delete out.group
        } else {
          out.group = id
        }
        return out
      })
    },
    [setSearch],
  )

  const resetDisplay = useCallback((): void => {
    setSearch((prev) => {
      const out = { ...prev }
      delete out.sort
      delete out.dir
      delete out.cols
      delete out.group
      return out
    })
  }, [setSearch])

  return {
    filters,
    sort,
    dir,
    visibleProperties,
    group,
    activeFilterCount: active.activeFilterCount,
    hasActiveFilters: active.hasActiveFilters,
    filterChips: active.filterChips,
    setFilter,
    removeFilter: active.removeFilter,
    clearAll,
    setSort,
    setDir,
    toggleProperty,
    setGroup,
    resetDisplay,
  }
}
