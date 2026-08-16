/**
 * Phase 39 Plan 04 — WorkBoard page composer.
 *
 * Composes BoardToolbar over four BoardColumns ('todo' | 'in_progress' | 'review' | 'done')
 * inside a horizontal-scroll layout. Wires the REAL `useUnifiedKanban` signature
 * `{ contextType, columnMode, sourceFilter }` (per RESEARCH Confirmation #2 — overrides
 * CONTEXT.md wording of `{ context, mode, sources }`).
 *
 * Phase 57 D-21 / D-57-06 / D-57-07: WorkBoard now consumes the shared
 * @/components/kanban primitive (KanbanProvider + KanbanCards + KanbanCard)
 * instead of importing @dnd-kit/core directly. Surface-swap, not absorb:
 * BoardColumn / BoardToolbar / KCard / board.css all preserved.
 *
 * Phase 87 Plan 09 — URL state (group/search/source/priority/sort/dir), Filter + Display
 * popovers, commitment-card peek via CommitmentDrawer, board-level empty states.
 *
 * Decisions enforced here:
 *  - D-03: DnD enabled only when columnMode === 'status'. Sensors empty otherwise
 *    (passed via KanbanProvider `sensors={[]}` override of the primitive's defaults).
 *  - D-05: contextType: 'personal', sourceFilter: ['commitment','task']
 *  - D-06: only 'status' grouping is wired — Display popover owns the single control.
 *  - D-07: Search filters client-side over the ALREADY-LOADED items (no `searchQuery` prop
 *          is passed to the hook even though the hook supports it server-side).
 *  - D-08: column counts + overdue chip computed client-side from the response.
 *  - D-09: kcard click → existing detail surface routed by `item.source`; commitments peek.
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

import { type ReactElement, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'

import {
  KanbanProvider,
  type DragEndEvent,
  type KanbanItemProps,
  type SensorDescriptor,
} from '@/components/kanban'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterChipsRow } from '@/components/list-controls/FilterChipsRow'
import {
  useListControls,
  type ListControlsConfig,
} from '@/components/list-controls/useListControls'
import { ListEmptyState } from '@/components/empty-states/ListEmptyState'
import {
  useUnifiedKanban,
  useUnifiedKanbanStatusUpdate,
  showCommitmentRejectToast,
} from '@/hooks/useUnifiedKanban'
import { useCommitmentDrawer } from '@/hooks/useCommitmentDrawer'
import { useWorkCreation } from '@/components/work-creation'
import { usePeekStore } from '@/store/peekStore'
import { Route, kanbanListConfig } from '@/routes/_protected/kanban'
import type { KanbanColumnMode, Priority, WorkflowStage, WorkSource } from '@/types/work-item.types'

import { BoardColumn } from './BoardColumn'
import { BoardToolbar } from './BoardToolbar'
import { resolveCommitmentDropDecision } from './commitment-stage-guard'
import type { KCardItem } from './KCard'
import './board.css'

const STAGES: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done']
const SOURCE_FILTER: WorkSource[] = ['commitment', 'task']

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

// Map workflow stage → task_status enum value (per useUnifiedKanban DB notes).
const STAGE_TO_STATUS: Record<WorkflowStage, string> = {
  todo: 'pending',
  in_progress: 'in_progress',
  review: 'review',
  done: 'completed',
  cancelled: 'cancelled',
}

type WorkBoardKanbanItem = KCardItem & KanbanItemProps

function isCancelled(item: KCardItem): boolean {
  return item.workflow_stage === 'cancelled' || item.status === 'cancelled'
}

// Reverse mapping (D-31): where each live commitment status renders.
//   pending → todo · in_progress → in_progress · completed → done
//   cancelled → filtered out above (isCancelled), never bucketed
//   overdue → todo, via the default branch, indistinguishable from
//             never-started. Undesigned and stated; handling it is Phase 96's
//             COUNT-04, not this plan's work.
// There is no `review` branch: the commitment CHECK constraint has five values
// and `review` is not one of them, so `item.status === 'review'` was dead.
function resolveBoardStage(item: KCardItem): WorkflowStage {
  if (item.source === 'task') return (item.workflow_stage as WorkflowStage | null) ?? 'todo'
  switch (item.status) {
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'done'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'todo'
  }
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

function matchesFacetFilters(
  item: KCardItem,
  active: Record<string, string | undefined>,
  excludeKey: string,
  searchQ: string,
): boolean {
  if (!matchesSearch(item, searchQ)) return false
  if (excludeKey !== 'source' && active.source !== undefined && item.source !== active.source) {
    return false
  }
  if (
    excludeKey !== 'priority' &&
    active.priority !== undefined &&
    item.priority !== active.priority
  ) {
    return false
  }
  return true
}

function countBoardFacet(
  items: KCardItem[],
  fieldKey: string,
  value: string,
  active: Record<string, string | undefined>,
  searchQ: string,
): number {
  return items.filter((item) => {
    if (fieldKey === 'source' && item.source !== value) return false
    if (fieldKey === 'priority' && item.priority !== value) return false
    return matchesFacetFilters(item, active, fieldKey, searchQ)
  }).length
}

function sortBoardItems(items: KCardItem[], sort?: string, dir?: 'asc' | 'desc'): KCardItem[] {
  if (sort === undefined) return items
  const mult = dir === 'desc' ? -1 : 1
  return [...items].sort((a, b) => {
    let cmp = 0
    if (sort === 'deadline') {
      const da = a.deadline != null ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY
      const db = b.deadline != null ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY
      cmp = da - db
    } else if (sort === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sort === 'priority') {
      cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    }
    return cmp * mult
  })
}

export function WorkBoard(): ReactElement {
  const { t, i18n } = useTranslation('unified-kanban')
  const navigate = useNavigate()
  const search = Route.useSearch()
  const routeNavigate = Route.useNavigate()

  const { openPalette } = useWorkCreation()
  const { openCommitment } = useCommitmentDrawer()

  const mode: KanbanColumnMode = search.group ?? 'status'
  const searchQuery = search.search ?? ''

  const setSearch = useCallback(
    (reducer: (prev: Record<string, unknown>) => Record<string, unknown>): void => {
      void routeNavigate({
        search: (prev: Record<string, unknown>) => reducer(prev),
        replace: true,
      } as unknown as Parameters<typeof routeNavigate>[0])
    },
    [routeNavigate],
  )

  const { items, isLoading } = useUnifiedKanban({
    contextType: 'personal',
    columnMode: mode,
    sourceFilter: SOURCE_FILTER,
  }) as { items: KCardItem[]; isLoading: boolean }

  const update = useUnifiedKanbanStatusUpdate()

  const visibleItems = useMemo(
    () => (Array.isArray(items) ? items.filter((it) => !isCancelled(it)) : []),
    [items],
  )

  const boardListConfig = useMemo((): ListControlsConfig => {
    const searchQ = searchQuery.toLowerCase().trim()
    return {
      ...kanbanListConfig,
      filters: kanbanListConfig.filters.map((field) => ({
        ...field,
        buildCountQuery: (value, active) =>
          Promise.resolve(countBoardFacet(visibleItems, field.key, value, active, searchQ)),
      })),
    }
  }, [searchQuery, visibleItems])

  const controls = useListControls(boardListConfig, search as Record<string, unknown>, setSearch)

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    let next = visibleItems.filter((it) => matchesSearch(it, q))
    if (search.source !== undefined) {
      next = next.filter((it) => it.source === search.source)
    }
    if (search.priority !== undefined) {
      next = next.filter((it) => it.priority === search.priority)
    }
    return sortBoardItems(next, search.sort, search.dir)
  }, [visibleItems, searchQuery, search.source, search.priority, search.sort, search.dir])

  const overdueCount = useMemo(
    () => visibleItems.filter((it) => it.is_overdue).length,
    [visibleItems],
  )

  const byStage = useMemo<Record<WorkflowStage, KCardItem[]>>(() => {
    const empty: Record<WorkflowStage, KCardItem[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    }
    for (const it of filtered) {
      const s = resolveBoardStage(it)
      if (s in empty) empty[s].push(it)
    }
    return empty
  }, [filtered])

  const visibleCommitmentIds = useMemo((): string[] => {
    const ids: string[] = []
    for (const stage of STAGES) {
      for (const item of byStage[stage]) {
        if (item.source === 'commitment') ids.push(item.id)
      }
    }
    return ids
  }, [byStage])

  // 94-08 (D-33): `homeStage` is the SAME `resolveBoardStage` call as `column`,
  // snapshotted under a name nothing mutates. BoardColumn's drop-affordance
  // carve-out must not read `column`, because KanbanProvider.handleDragOver
  // (`KanbanProvider.tsx:223`) assigns `newData[activeIndex].column = overColumn`
  // on the shared item object mid-drag — so `column` drifts to whatever the
  // pointer last hovered. A carve-out keyed on it would move the "home" column
  // during the gesture and re-disable the real one, which is precisely the
  // closestCenter-retarget failure the carve-out exists to prevent.
  const kanbanItems = useMemo<WorkBoardKanbanItem[]>(
    () =>
      filtered.map((it) => {
        const homeStage = resolveBoardStage(it)
        return { ...it, name: it.title, column: homeStage as string, homeStage }
      }),
    [filtered],
  )

  const columnDescriptors = useMemo(
    () => STAGES.map((stage) => ({ id: stage, name: t(`columns.${stage}`) })),
    [t],
  )

  const dndExtraProps: { sensors?: SensorDescriptor<object>[] } =
    mode === 'status' ? {} : { sensors: [] }

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      const activeId = event.active?.id
      const over = event.over
      if (activeId == null || over == null) return

      const item = visibleItems.find((it) => it.id === String(activeId))
      if (!item) return

      type OverData = { stage?: WorkflowStage } | undefined
      const overData = (over.data?.current as OverData) ?? undefined
      let targetStage: WorkflowStage | undefined = overData?.stage
      if (targetStage === undefined) {
        const overIdStr = String(over.id)
        const stripped = overIdStr.startsWith('col-') ? overIdStr.slice(4) : overIdStr
        if ((STAGES as string[]).includes(stripped)) {
          targetStage = stripped as WorkflowStage
        } else {
          const overCard = visibleItems.find((it) => it.id === overIdStr)
          if (overCard !== undefined) {
            targetStage = resolveBoardStage(overCard)
          }
        }
      }
      // The no-op guard must compare against the stage that PLACED the card.
      // `workflow_stage` is null for every commitment, so comparing it made an
      // own-column drop look like a move — a mutation and a success toast for
      // a gesture that changed nothing (D-05).
      if (targetStage === undefined || targetStage === resolveBoardStage(item)) return

      // Gesture-layer enforcement point (D-33). Same module the mutation layer
      // uses, so the condition cannot drift; refusing here means no mutation is
      // ever enqueued. 94-08 adds the droppable affordance on top of this.
      if (item.source === 'commitment') {
        const decision = resolveCommitmentDropDecision(item, targetStage)
        if (!decision.ok) {
          showCommitmentRejectToast(decision.reason, t)
          return
        }
      }

      update.mutate({
        itemId: item.id,
        source: item.source,
        newStatus: STAGE_TO_STATUS[targetStage],
        newWorkflowStage: targetStage,
        deadline: item.deadline,
      })
    },
    [visibleItems, update, t],
  )

  const handleItemClick = useCallback(
    (item: KCardItem): void => {
      switch (item.source) {
        case 'task':
          void navigate({ to: `/tasks/${item.id}` })
          break
        case 'commitment': {
          usePeekStore.getState().register({
            ids: visibleCommitmentIds,
            type: 'commitment',
            total: visibleCommitmentIds.length,
            pageOffset: 0,
            pageSize: visibleCommitmentIds.length,
          })
          openCommitment(item.id)
          break
        }
        case 'intake':
          void navigate({ to: `/intake/tickets/${item.id}` })
          break
      }
    },
    [navigate, openCommitment, visibleCommitmentIds],
  )

  const handleAddItem = useCallback((): void => {
    openPalette('task')
  }, [openPalette])

  const handleNewItem = useCallback((): void => {
    openPalette('task')
  }, [openPalette])

  const handleSearchChange = useCallback(
    (q: string): void => {
      void routeNavigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          search: q.length > 0 ? q : undefined,
        }),
        replace: true,
      } as unknown as Parameters<typeof routeNavigate>[0])
    },
    [routeNavigate],
  )

  const handleClearFilters = useCallback((): void => {
    controls.clearAll()
    handleSearchChange('')
  }, [controls, handleSearchChange])

  const isRTL = i18n.language === 'ar'
  const isBoardEmpty = !isLoading && visibleItems.length === 0
  const isFilteredEmpty = !isLoading && visibleItems.length > 0 && filtered.length === 0

  if (isLoading) {
    return (
      <div
        className="workboard-page"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-busy="true"
        aria-live="polite"
      >
        <Skeleton className="board-toolbar-skeleton" />
        <div className="board-columns">
          {STAGES.map((stage) => (
            <section key={stage} className="col" aria-label={t(`columns.${stage}`)}>
              <header className="col-head">
                <Skeleton className="workboard-skeleton-head-title" />
                <Skeleton className="workboard-skeleton-head-count" />
              </header>
              <div className="col-body">
                <Skeleton className="kcard-skeleton" />
                <Skeleton className="kcard-skeleton" />
                <Skeleton className="kcard-skeleton" />
              </div>
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="workboard-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="sr-only">{t('title', { defaultValue: 'Work Board' })}</h1>
      <BoardToolbar
        config={boardListConfig}
        controls={controls}
        searchQuery={searchQuery}
        overdueCount={overdueCount}
        onSearchChange={handleSearchChange}
        onNewItem={handleNewItem}
      />
      <FilterChipsRow
        chips={controls.filterChips}
        onRemove={controls.removeFilter}
        onClearAll={controls.clearAll}
        showing={filtered.length}
        total={visibleItems.length}
      />
      {isBoardEmpty ? (
        <div className="board-empty flex flex-1 items-center justify-center py-16">
          <ListEmptyState entityType="work_item" onCreate={(): void => openPalette('task')} />
        </div>
      ) : isFilteredEmpty ? (
        <div className="board-empty flex flex-1 items-center justify-center py-16">
          <ListEmptyState entityType="work_item" filtered onClearFilters={handleClearFilters} />
        </div>
      ) : (
        <div className="board-columns">
          <KanbanProvider<WorkBoardKanbanItem, { id: WorkflowStage; name: string }>
            columns={columnDescriptors}
            data={kanbanItems}
            onDragEnd={handleDragEnd}
            className="contents"
            {...dndExtraProps}
          >
            {(column) => (
              <BoardColumn
                key={column.id}
                title={column.name}
                stage={column.id}
                items={byStage[column.id]}
                dndEnabled={mode === 'status'}
                onItemClick={handleItemClick}
                onAddItem={handleAddItem}
              />
            )}
          </KanbanProvider>
        </div>
      )}
    </div>
  )
}
