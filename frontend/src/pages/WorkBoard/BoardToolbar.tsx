/**
 * Phase 39 Plan 03 — BoardToolbar widget.
 *
 * Renders the WorkBoard toolbar:
 *  - Three filter pills: 'By status' (wired) + 'By dossier' / 'By owner' (visual stubs,
 *    aria-disabled with "Coming soon" tooltip per CONTEXT D-06).
 *  - Mono '{n} overdue' chip (LtrIsolate-wrapped so digits render LTR in RTL pages).
 *  - Search input (controlled — parent owns state; client-side filter happens upstream).
 *  - '+ New item' button.
 *
 * RTL discipline: only logical Tailwind / CSS properties; no physical text alignment.
 * XSS posture: search value is bound via a controlled React input — no unsafe-HTML APIs
 * are used; `.includes()` filtering downstream operates on plain strings.
 */

import { type ChangeEvent, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toArDigits } from '@/lib/i18n/toArDigits'
import type { KanbanColumnMode } from '@/types/work-item.types'

interface BoardToolbarProps {
  mode: KanbanColumnMode
  searchQuery: string
  overdueCount: number
  onModeChange: (mode: KanbanColumnMode) => void
  onSearchChange: (q: string) => void
  onNewItem: () => void
}

export function BoardToolbar({
  mode,
  searchQuery,
  overdueCount,
  onModeChange,
  onSearchChange,
  onNewItem,
}: BoardToolbarProps): ReactElement {
  const { t, i18n } = useTranslation('unified-kanban')
  const lang = i18n.language

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value)
  }

  const handleByStatusClick = (): void => {
    onModeChange('status')
  }

  // Stable noop for the visual-stub pills — D-06 mandates they NEVER call onModeChange.
  const noop = (): void => {}

  const overdueLabel = t('overdueChip', { count: toArDigits(overdueCount, lang) })
  const newItemLabel = t('actions.newItem')
  const searchLabel = t('filters.search')
  const comingSoon = t('filters.comingSoon')

  return (
    <div className="board-toolbar" role="toolbar" aria-label={t('filters.byStatus')}>
      <div className="filter-pills" role="group">
        <button
          type="button"
          className="filter-pill"
          aria-pressed={mode === 'status'}
          onClick={handleByStatusClick}
        >
          {t('filters.byStatus')}
        </button>
        <button
          type="button"
          className="filter-pill"
          aria-disabled="true"
          title={comingSoon}
          onClick={noop}
        >
          {t('filters.byDossier')}
        </button>
        <button
          type="button"
          className="filter-pill"
          aria-disabled="true"
          title={comingSoon}
          onClick={noop}
        >
          {t('filters.byOwner')}
        </button>
      </div>

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
