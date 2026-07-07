/**
 * FilterChipsRow — Phase 87 F24 (AFF-02)
 *
 * A slim Linear-native chip row consuming useActiveFilters output (via useListControls).
 * Deliberately NOT ActiveFiltersBar: no animation library, no scale/lift — hover is a
 * background fade only (Pitfall 8). Chips at --radius-sm with a per-chip remove (×);
 * "Clear all" appears at ≥ 2 chips; the result count reuses active-filters:showingFiltered.
 */

import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { FilterChipConfig } from '@/components/active-filters/ActiveFiltersBar'

export interface FilterChipsRowProps {
  chips: FilterChipConfig[]
  onRemove: (key: string, arrayValue?: string) => void
  onClearAll: () => void
  /** N — rows shown after filtering. */
  showing?: number
  /** M — total rows before filtering. */
  total?: number
}

export function FilterChipsRow({
  chips,
  onRemove,
  onClearAll,
  showing,
  total,
}: FilterChipsRowProps): ReactElement | null {
  const { t } = useTranslation(['list-controls', 'active-filters'])

  if (chips.length === 0) {
    return null
  }

  const showCount = showing !== undefined && total !== undefined

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.arrayValue ?? ''}`}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-surface-raised ps-2 pe-1 py-1 text-sm text-ink"
        >
          <span className="text-ink-mute">{chip.label}</span>
          <span>{chip.value}</span>
          <button
            type="button"
            className="btn-ghost inline-flex size-5 items-center justify-center rounded-[var(--radius-sm)] p-0"
            onClick={() => onRemove(chip.key, chip.arrayValue)}
            aria-label={chip.label}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </span>
      ))}

      {chips.length >= 2 ? (
        <button type="button" className="btn-ghost text-sm" onClick={onClearAll}>
          {t('active-filters:clearAll', { defaultValue: 'Clear all' })}
        </button>
      ) : null}

      {showCount ? (
        <span className="ms-auto text-sm text-ink-faint">
          {t('active-filters:showingFiltered', {
            count: showing,
            total,
            defaultValue: 'Showing {{count}} of {{total}} results',
          })}
        </span>
      ) : null}
    </div>
  )
}
