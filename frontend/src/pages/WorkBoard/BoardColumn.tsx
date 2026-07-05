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
 *  - Latin digits app-wide (policy D §7.4); the count renders as a raw number
 *  - No physical-direction Tailwind; all spacing comes from board.css logical rules
 *
 * XSS mitigation (T-39-02-XSS): React JSX escapes `title`. No raw-HTML APIs.
 */

import { type ReactElement, useId } from 'react'
import { useTranslation } from 'react-i18next'

import { KanbanCards, KanbanCard, useDroppable, type KanbanItemProps } from '@/components/kanban'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import type { WorkflowStage } from '@/types/work-item.types'

import { KCard, type KCardItem } from './KCard'

type WorkBoardKanbanItem = KCardItem & KanbanItemProps

/**
 * Phase 85 D-85-06 — stage status glyph rendered before each column name.
 * Decorative inline SVG (aria-hidden — the adjacent <h3> already names the
 * stage); tokens only (--ink-faint / --warn / --ok). Shape technique borrowed
 * from signature-visuals/Donut.tsx (plain <circle>/<path>, strokeDasharray,
 * no motion library). `cancelled` is filtered out of the board (WorkBoard.tsx)
 * — it reuses the todo ring purely for Record<WorkflowStage> totality.
 */
const STAGE_GLYPHS: Record<WorkflowStage, ReactElement> = {
  todo: (
    <svg
      className="col-glyph"
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="7" r="5" fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" />
    </svg>
  ),
  in_progress: (
    <svg
      className="col-glyph"
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="7" r="5" fill="var(--warn)" />
    </svg>
  ),
  review: (
    <svg
      className="col-glyph"
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="var(--ink-faint)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  ),
  done: (
    <svg
      className="col-glyph"
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.5 7.5 L6 10 L10.5 4"
        fill="none"
        stroke="var(--ok)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  cancelled: (
    <svg
      className="col-glyph"
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="7" r="5" fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" />
    </svg>
  ),
}

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
  const { t } = useTranslation('unified-kanban')
  const titleId = useId()
  // D-21: column is the droppable target for cross-column DnD. Plays the same
  // role KanbanBoard does inside the shared primitive — but we keep `<section
  // class="col">` to honor the Phase 39 selector contract (kanban-render /
  // kanban-rtl / kanban-responsive depend on `section.col`).
  const { setNodeRef } = useDroppable({ id: stage })

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="col"
      ref={setNodeRef}
      data-droppable-id={stage}
    >
      <header className="col-head">
        {STAGE_GLYPHS[stage]}
        <h3 id={titleId}>{title}</h3>
        <LtrIsolate>
          <span className="col-count font-mono">{items.length}</span>
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
