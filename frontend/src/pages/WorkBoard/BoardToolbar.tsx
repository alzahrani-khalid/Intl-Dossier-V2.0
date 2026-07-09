/**
 * Phase 39 Plan 03 — BoardToolbar widget.
 *
 * Phase 87 Plan 09 — Filter + Display popovers replace the legacy pill row.
 * Search input, overdue chip, and + New item are unchanged.
 *
 * RTL discipline: only logical Tailwind / CSS properties; no physical text alignment.
 */

import { type ChangeEvent, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { FilterPopover } from '@/components/list-controls/FilterPopover'
import { DisplayPopover } from '@/components/list-controls/DisplayPopover'
import type {
  ListControlsConfig,
  UseListControlsReturn,
} from '@/components/list-controls/useListControls'

interface BoardToolbarProps {
  config: ListControlsConfig
  controls: UseListControlsReturn
  searchQuery: string
  overdueCount: number
  onSearchChange: (q: string) => void
  onNewItem: () => void
}

export function BoardToolbar({
  config,
  controls,
  searchQuery,
  overdueCount,
  onSearchChange,
  onNewItem,
}: BoardToolbarProps): ReactElement {
  const { t } = useTranslation('unified-kanban')

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value)
  }

  const overdueLabel = t('overdueChip', { count: overdueCount })
  const newItemLabel = t('actions.newItem')
  const searchLabel = t('filters.search')

  return (
    <div className="board-toolbar" role="toolbar" aria-label={t('columnModes.label')}>
      <FilterPopover
        config={config}
        surfaceKey="kanban"
        activeFilters={controls.filters}
        activeFilterCount={controls.activeFilterCount}
        onFilterChange={controls.setFilter}
      />
      <DisplayPopover
        config={config}
        sort={controls.sort}
        dir={controls.dir}
        visibleProperties={controls.visibleProperties}
        group={controls.group}
        onSetSort={controls.setSort}
        onSetDir={controls.setDir}
        onToggleProperty={controls.toggleProperty}
        onSetGroup={controls.setGroup}
        onReset={controls.resetDisplay}
      />

      <LtrIsolate>
        <span className="overdue-chip font-mono">{overdueLabel}</span>
      </LtrIsolate>

      <input
        type="search"
        className="board-search"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder={searchLabel}
        aria-label={searchLabel}
      />

      <button type="button" className="new-item-btn" onClick={onNewItem} aria-label={newItemLabel}>
        {`+ ${newItemLabel}`}
      </button>
    </div>
  )
}
