/**
 * Phase 39 Plan 02 — BoardColumn widget (BOARD-01 column shell).
 *
 * Renders one kanban column: header (title + mono digit count + per-column add
 * button) over a list of KCards. When dndEnabled, the kcard list is wrapped in
 * a SortableContext so 39-04 can wire DnD without touching this file.
 *
 * RTL-correct via:
 *  - LtrIsolate around the mono count digit
 *  - useTranslation().i18n.language → toArDigits for AR digit shaping
 *  - No physical-direction Tailwind; all spacing comes from board.css logical rules
 *
 * XSS mitigation (T-39-02-XSS): React JSX escapes `title`. No raw-HTML APIs.
 */

import { type ReactElement, type ReactNode, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toArDigits } from '@/lib/i18n/toArDigits'
import type { WorkflowStage } from '@/types/work-item.types'

import { KCard, type KCardItem } from './KCard'

export interface BoardColumnProps {
  title: string
  stage: WorkflowStage
  items: KCardItem[]
  dndEnabled: boolean
  onItemClick: (item: KCardItem) => void
  onAddItem: (stage: WorkflowStage) => void
}

export function BoardColumn(props: BoardColumnProps): ReactElement {
  const { title, stage, items, dndEnabled, onItemClick, onAddItem } = props
  const { t, i18n } = useTranslation('unified-kanban')
  const lang = i18n.language
  const titleId = useId()
  const ids = items.map((it) => it.id)

  const list: ReactNode = (
    <>
      {items.map((it) => (
        <KCard key={it.id} item={it} onItemClick={onItemClick} dndEnabled={dndEnabled} />
      ))}
      {items.length === 0 ? (
        <div className="col-empty" aria-live="polite">
          {t('emptyColumn', { defaultValue: 'No items' })}
        </div>
      ) : null}
    </>
  )

  return (
    <section role="region" aria-labelledby={titleId} className="col">
      <header className="col-head">
        <h3 id={titleId}>{title}</h3>
        <LtrIsolate>
          <span className="col-count font-mono">{toArDigits(items.length, lang)}</span>
        </LtrIsolate>
        <button
          type="button"
          className="col-add"
          aria-label={t('actions.addToColumn', { column: title })}
          onClick={(): void => onAddItem(stage)}
        >
          +
        </button>
      </header>
      <div className="col-body">
        {dndEnabled ? (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {list}
          </SortableContext>
        ) : (
          list
        )}
      </div>
    </section>
  )
}
