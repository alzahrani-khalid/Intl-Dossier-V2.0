/**
 * FilterPopover — Phase 87 F24 (AFF-02, locked decision 3: Filter = which rows)
 *
 * A surface-agnostic filter builder driven by a ListControlsConfig. Trigger is a
 * plain .btn-ghost (never HeroUI Button — filterDOMProps drops aria); the label
 * flips to "Filter · N" with an accent indicator dot when filters are active.
 * Options apply immediately (no Apply button) and show live facet counts inline-end.
 * Popover surface overrides the shared wrapper to --surface-3 + no shadow per the
 * Phase-87 elevation contract.
 */

import { useMemo, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ListFilter, Check } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useFacetCounts } from './useFacetCounts'
import type { ListControlsConfig } from './useListControls'

export interface FilterPopoverProps {
  config: ListControlsConfig
  /** Stable per-surface key for facet-count query cache isolation. */
  surfaceKey: string
  activeFilters: Record<string, string | undefined>
  activeFilterCount: number
  onFilterChange: (key: string, value: string | undefined) => void
  /** Controlled open (optional — falls back to internal state). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FilterPopover({
  config,
  surfaceKey,
  activeFilters,
  activeFilterCount,
  onFilterChange,
  open: controlledOpen,
  onOpenChange,
}: FilterPopoverProps): ReactElement {
  const { t } = useTranslation('list-controls')
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const handleOpenChange = (next: boolean): void => {
    if (!isControlled) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }

  const counts = useFacetCounts(config, surfaceKey, activeFilters, open)

  const hasActive = activeFilterCount > 0
  const triggerLabel = hasActive
    ? t('filter.trigger_active', { count: activeFilterCount, defaultValue: 'Filter · {{count}}' })
    : t('filter.trigger', { defaultValue: 'Filter' })

  // Resolve option labels once so the builder search can filter on them.
  const groups = useMemo(
    () =>
      config.filters.map((field) => ({
        field,
        options: field.options.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
      })),
    [config.filters, t],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      options:
        normalizedQuery.length > 0
          ? g.options.filter((o) => o.label.toLowerCase().includes(normalizedQuery))
          : g.options,
    }))
    .filter((g) => g.options.length > 0)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="btn-ghost inline-flex items-center gap-2">
          <ListFilter size={14} aria-hidden="true" />
          <span>{triggerLabel}</span>
          {hasActive ? (
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-accent"
              data-testid="filter-active-dot"
            />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="bg-surface-3 shadow-none w-72">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('filter.search_placeholder', { defaultValue: 'Filter by...' })}
          className="mb-2 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-line-strong"
        />
        {filteredGroups.length === 0 ? (
          <p className="px-1 py-2 text-sm text-ink-mute">
            {t('filter.no_matches', { defaultValue: 'No filters match' })}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGroups.map((g) => (
              <div key={g.field.key} className="flex flex-col">
                <p className="mb-1 text-sm text-ink-faint">{t(g.field.labelKey)}</p>
                {g.options.map((opt) => {
                  const checked = activeFilters[g.field.key] === opt.value
                  const count = counts[g.field.key]?.[opt.value]
                  const zero = count === 0
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => onFilterChange(g.field.key, checked ? undefined : opt.value)}
                      style={{ minBlockSize: 'var(--row-h)' }}
                      className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 text-start text-sm hover:bg-[var(--line-soft)]"
                    >
                      <span className="flex size-4 items-center justify-center">
                        {checked ? <Check size={14} className="text-accent" /> : null}
                      </span>
                      <span className={zero ? 'text-ink-tertiary' : 'text-ink'}>{opt.label}</span>
                      {count !== undefined ? (
                        <span className="ms-auto text-sm text-ink-faint">
                          {t('filter.option_count', { count, defaultValue: '{{count}}' })}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
