/**
 * Phase 39 Plan 02 — BoardColumn widget (BOARD-01 column shell).
 *
 * Renders one kanban column: header (title + mono digit count + per-column add
 * button) over a list of KCards.
 *
 * Phase 57 D-21 / D-57-07: BoardColumn now consumes KanbanCards + KanbanCard
 * from the shared @/components/kanban primitive instead of importing
 * @dnd-kit/sortable directly. KanbanCards owns the SortableContext + per-card
 * useSortable wiring + data-card-id attribute; KCard becomes the visual child
 * inside KanbanCard's children slot (kcard / overdue / done styles preserved
 * via board.css). The section.col + .col-head + .col-empty markup stays
 * identical so the Phase 39 kanban-render / kanban-rtl / kanban-responsive
 * Playwright selectors continue to resolve.
 *
 * RTL-correct via:
 *  - LtrIsolate around the mono count digit
 *  - useTranslation().i18n.language → toArDigits for AR digit shaping
 *  - No physical-direction Tailwind; all spacing comes from board.css logical rules
 *
 * XSS mitigation (T-39-02-XSS): React JSX escapes `title`. No raw-HTML APIs.
 */

import { type ReactElement, useId } from 'react'
import { useTranslation } from 'react-i18next'

import { KanbanCards, KanbanCard, type KanbanItemProps } from '@/components/kanban'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toArDigits } from '@/lib/i18n/toArDigits'
import type { WorkflowStage } from '@/types/work-item.types'

import { KCard, type KCardItem } from './KCard'

type WorkBoardKanbanItem = KCardItem & KanbanItemProps

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
      <KanbanCards<WorkBoardKanbanItem> id={stage} className="col-body">
        {(item): ReactElement => (
          <KanbanCard<WorkBoardKanbanItem>
            key={item.id}
            {...item}
            className="!gap-0 !rounded-none !border-0 !bg-transparent !p-0 hover:!bg-transparent"
          >
            <KCard item={item} onItemClick={onItemClick} dndEnabled={dndEnabled} />
          </KanbanCard>
        )}
      </KanbanCards>
      {items.length === 0 ? (
        <div className="col-empty" aria-live="polite">
          {t('emptyColumn', { defaultValue: 'No items' })}
        </div>
      ) : null}
    </section>
  )
}
