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

import { type ReactElement, useContext, useId } from 'react'
import { useTranslation } from 'react-i18next'

import {
  KanbanCards,
  KanbanCard,
  KanbanContext,
  useDroppable,
  useDndContext,
  type KanbanItemProps,
} from '@/components/kanban'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import type { WorkflowStage } from '@/types/work-item.types'

import { resolveCommitmentDropDecision } from './commitment-stage-guard'
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

/**
 * Phase 94 Plan 08 (WRITE-04 · D-04 · D-33) — the drop affordance.
 *
 * While a commitment card is in flight, a column stops being a droppable if
 * the shared guard would refuse the write. `resolveCommitmentDropDecision` is
 * the ONLY copy of that condition: the mutation layer (`WorkBoard.handleDragEnd`)
 * and this predicate call the same function, so the two enforcement points
 * cannot drift. Refusing here removes the drop signal; refusing there remains
 * the load-bearing guarantee, because cards inside a disabled column are
 * droppables of their own and are not disabled by this predicate.
 *
 * THE HOME-COLUMN CARVE-OUT IS MANDATORY, not an optimisation. `closestCenter`
 * RETARGETS a release over a disabled droppable to the nearest ENABLED one. If
 * the dragged card's own column were disabled, dropping a past-due commitment
 * straight back where it started would be rerouted — possibly onto Done, which
 * writes `completed` behind nothing but the global success toast. So the home
 * column is never disabled, and the home drop is a proven no-op via the D-05
 * guard in `WorkBoard.handleDragEnd`.
 *
 * There is deliberately NO visual treatment: the absence of the drop signal IS
 * the affordance. A disabled droppable leaves the collision candidate set, so
 * no `isOver` ring paints — no new CSS, no opacity.
 *
 * The carve-out keys on `homeStage`, NOT on the kanban `column` field:
 * `KanbanProvider.handleDragOver` rewrites `column` on the shared item object
 * mid-drag, so `column` is whatever the pointer last hovered. `homeStage` is
 * the same `resolveBoardStage` call, snapshotted by WorkBoard and never
 * mutated.
 */
export type BoardDragItem = KCardItem & { homeStage: WorkflowStage }

export function isColumnDropDisabled(
  activeItem: BoardDragItem | undefined,
  stage: WorkflowStage,
): boolean {
  if (activeItem === undefined) return false
  // Tasks and intake cards are never restricted by this predicate.
  if (activeItem.source !== 'commitment') return false
  if (activeItem.homeStage === stage) return false
  return !resolveCommitmentDropDecision(activeItem, stage).ok
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
  // 94-08: the card currently in flight, read from the live dnd-kit state. The
  // item bodies come from the kanban data context because `useSortable` in
  // KanbanCard registers no `data` payload, so `active` carries only the id.
  const { active } = useDndContext()
  const { data } = useContext(KanbanContext)
  const activeItem =
    active === null
      ? undefined
      : (data.find((item) => item.id === String(active.id)) as BoardDragItem | undefined)
  // D-21: column is the droppable target for cross-column DnD. Plays the same
  // role KanbanBoard does inside the shared primitive — but we keep `<section
  // class="col">` to honor the Phase 39 selector contract (kanban-render /
  // kanban-rtl / kanban-responsive depend on `section.col`).
  const { setNodeRef } = useDroppable({
    id: stage,
    disabled: isColumnDropDisabled(activeItem, stage),
  })

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
