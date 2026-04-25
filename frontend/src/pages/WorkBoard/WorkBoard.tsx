/**
 * Phase 39 Plan 04 — WorkBoard page composer.
 *
 * Composes BoardToolbar over four BoardColumns ('todo' | 'in_progress' | 'review' | 'done')
 * inside a horizontal-scroll layout. Wires the REAL `useUnifiedKanban` signature
 * `{ contextType, columnMode, sourceFilter }` (per RESEARCH Confirmation #2 — overrides
 * CONTEXT.md wording of `{ context, mode, sources }`).
 *
 * Decisions enforced here:
 *  - D-03: DnD enabled only when columnMode === 'status'. Sensors empty otherwise.
 *  - D-05: contextType: 'personal', sourceFilter: ['commitment','task']
 *  - D-06: 'By dossier' / 'By owner' visual stubs in the toolbar — never reach this page state.
 *  - D-07: Search filters client-side over the ALREADY-LOADED items (no `searchQuery` prop
 *          is passed to the hook even though the hook supports it server-side).
 *  - D-08: column counts + overdue chip computed client-side from the response.
 *  - D-09: kcard click → existing detail surface routed by `item.source`.
 *  - Confirmation #8: items with `workflow_stage === 'cancelled'` OR `status === 'cancelled'`
 *    are filtered OUT of the visible board.
 *
 * RTL discipline:
 *  - dir attribute on the root container drives flex/scroll direction
 *  - logical CSS only in board.css; no `ml-*`/`mr-*`/`textAlign:'right'`
 *  - never `.reverse()` columns or items
 *
 * XSS posture (T-39-04-XSS): all rendered values flow through React JSX escaping via
 * children KCards; no raw-HTML APIs are referenced anywhere in this file.
 */

import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { Skeleton } from '@/components/ui/skeleton'
import { useUnifiedKanban, useUnifiedKanbanStatusUpdate } from '@/hooks/useUnifiedKanban'
import type { KanbanColumnMode, WorkflowStage, WorkSource } from '@/types/work-item.types'

import { BoardColumn } from './BoardColumn'
import { BoardToolbar } from './BoardToolbar'
import type { KCardItem } from './KCard'
import './board.css'

const STAGES: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done']
const SOURCE_FILTER: WorkSource[] = ['commitment', 'task']

// Map workflow stage → task_status enum value (per useUnifiedKanban DB notes).
const STAGE_TO_STATUS: Record<WorkflowStage, string> = {
  todo: 'pending',
  in_progress: 'in_progress',
  review: 'in_progress',
  done: 'completed',
  cancelled: 'cancelled',
}

function isCancelled(item: KCardItem): boolean {
  return item.workflow_stage === 'cancelled' || item.status === 'cancelled'
}

function matchesSearch(item: KCardItem, q: string): boolean {
  if (q === '') return true
  const candidates: Array<string | null | undefined> = [
    item.title,
    item.title_ar,
    item.dossier?.name,
    item.dossier?.name_ar,
    item.assignee?.name,
  ]
  return candidates.some((s) => typeof s === 'string' && s.toLowerCase().includes(q))
}

export function WorkBoard(): ReactElement {
  const { t, i18n } = useTranslation('unified-kanban')
  const navigate = useNavigate()

  const [mode, setMode] = useState<KanbanColumnMode>('status')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // REAL hook signature: { contextType, columnMode, sourceFilter } — NOT { context, mode, sources }
  // D-07: do NOT pass searchQuery (client-side filter only).
  const { items, isLoading } = useUnifiedKanban({
    contextType: 'personal',
    columnMode: mode,
    sourceFilter: SOURCE_FILTER,
  }) as { items: KCardItem[]; isLoading: boolean }

  const update = useUnifiedKanbanStatusUpdate()

  // Confirmation #8 — drop cancelled items from view (no cancelled column rendered).
  const visibleItems = useMemo(
    () => (Array.isArray(items) ? items.filter((it) => !isCancelled(it)) : []),
    [items],
  )

  // D-07 — client-side search across EN + AR title, dossier, assignee.
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return visibleItems.filter((it) => matchesSearch(it, q))
  }, [visibleItems, searchQuery])

  // D-08 — overdue chip count uses unfiltered visibleItems so the chip is stable while typing.
  const overdueCount = useMemo(
    () => visibleItems.filter((it) => it.is_overdue).length,
    [visibleItems],
  )

  // Group by stage for column rendering. We never .reverse() — RTL is handled by `dir`.
  const byStage = useMemo<Record<WorkflowStage, KCardItem[]>>(() => {
    const empty: Record<WorkflowStage, KCardItem[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    }
    for (const it of filtered) {
      const s = it.workflow_stage ?? 'todo'
      if (s in empty) empty[s].push(it)
    }
    return empty
  }, [filtered])

  // D-03 sensor stack — empty when not 'status' so cards are visually present but un-draggable.
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
  const dndSensors =
    mode === 'status' ? useSensors(mouseSensor, touchSensor, keyboardSensor) : useSensors()

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      const activeId = event.active?.id
      const over = event.over
      if (activeId == null || over == null) return

      // Resolve source item from current visible set.
      const item = visibleItems.find((it) => it.id === String(activeId))
      if (!item) return

      // Resolve target stage: prefer over.data.current.stage, fall back to id heuristic.
      type OverData = { stage?: WorkflowStage } | undefined
      const overData = (over.data?.current as OverData) ?? undefined
      let targetStage: WorkflowStage | undefined = overData?.stage
      if (targetStage === undefined) {
        const overIdStr = String(over.id)
        const stripped = overIdStr.startsWith('col-') ? overIdStr.slice(4) : overIdStr
        if ((STAGES as string[]).includes(stripped)) {
          targetStage = stripped as WorkflowStage
        }
      }
      if (targetStage === undefined || targetStage === item.workflow_stage) return

      update.mutate({
        itemId: item.id,
        source: item.source,
        newStatus: STAGE_TO_STATUS[targetStage],
        newWorkflowStage: targetStage,
      })
    },
    [visibleItems, update],
  )

  // D-09 — route by source. Per open-question 3 we reuse today's existing detail surfaces.
  const handleItemClick = useCallback(
    (item: KCardItem): void => {
      switch (item.source) {
        case 'task':
          void navigate({ to: `/tasks/${item.id}` })
          break
        case 'commitment':
          void navigate({ to: '/commitments' })
          break
        case 'intake':
          void navigate({ to: `/intake/tickets/${item.id}` })
          break
      }
    },
    [navigate],
  )

  // D-12 — per-column +Add and toolbar +New both route into the existing TaskCreate flow.
  // /tasks/new accepting `defaultWorkflowStage` is verified in 39-09; today we navigate to
  // /tasks with a query param so the prefill arrives once the route picks it up.
  const handleAddItem = useCallback(
    (stage: WorkflowStage): void => {
      void navigate({ to: '/tasks', search: { defaultWorkflowStage: stage } })
    },
    [navigate],
  )

  const handleNewItem = useCallback((): void => {
    void navigate({ to: '/tasks' })
  }, [navigate])

  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div className="workboard-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="board-columns" aria-busy="true">
          {STAGES.map((stage) => (
            <section key={stage} className="col" aria-label={t(`columns.${stage}`)}>
              <Skeleton className="workboard-skeleton-head" />
              <Skeleton className="workboard-skeleton-card" />
              <Skeleton className="workboard-skeleton-card" />
              <Skeleton className="workboard-skeleton-card" />
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={dndSensors} onDragEnd={handleDragEnd}>
      <div className="workboard-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <BoardToolbar
          mode={mode}
          searchQuery={searchQuery}
          overdueCount={overdueCount}
          onModeChange={setMode}
          onSearchChange={setSearchQuery}
          onNewItem={handleNewItem}
        />
        <div className="board-columns">
          {STAGES.map((stage) => (
            <BoardColumn
              key={stage}
              title={t(`columns.${stage}`)}
              stage={stage}
              items={byStage[stage]}
              dndEnabled={mode === 'status'}
              onItemClick={handleItemClick}
              onAddItem={handleAddItem}
            />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
