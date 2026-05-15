/**
 * TasksTab — Inline kanban board for engagement workspace
 * Replaces the dialog-based EngagementKanbanDialog with an embedded board.
 * Desktop: horizontal columns with drag-and-drop via kibo-ui/kanban.
 * Mobile: stacked collapsible sections with "Move to" dropdown.
 */

import { type ReactElement, useMemo, useState, useCallback } from 'react'
import { useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { DragEndEvent } from '@dnd-kit/core'
import { useDirection } from '@/hooks/useDirection'
import {
  useEngagementKanban,
  type KanbanAssignment,
  type WorkflowStage,
  type SortOption,
} from '@/domains/engagements/hooks/useEngagementKanban'
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban'
import { KanbanTaskCard } from '@/components/assignments/KanbanTaskCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, ChevronDown, ChevronUp, ArrowDownUp, ClipboardList } from 'lucide-react'

const VISIBLE_STAGES: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done']

const STAGE_COLORS: Record<WorkflowStage, string> = {
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TasksTab
  todo: 'bg-slate-100 dark:bg-slate-800',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TasksTab
  in_progress: 'bg-blue-50 dark:bg-blue-950',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TasksTab
  review: 'bg-amber-50 dark:bg-amber-950',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TasksTab
  done: 'bg-emerald-50 dark:bg-emerald-950',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TasksTab
  cancelled: 'bg-red-50 dark:bg-red-950',
}

export default function TasksTab(): ReactElement {
  const { engagementId } = useParams({
    from: '/_protected/engagements/$engagementId',
  })
  const { t } = useTranslation('workspace')
  const { t: tAssign } = useTranslation('assignments')
  const { isRTL } = useDirection()
  const [sortBy, setSortBy] = useState<SortOption>('created_at')

  const { columns, stats, handleDragEnd, isLoading } = useEngagementKanban(engagementId, sortBy)

  // Determine which stages to show (include cancelled only if non-empty)
  const activeStages = useMemo((): WorkflowStage[] => {
    if (!columns) return VISIBLE_STAGES
    const cancelledCount = columns.cancelled?.length ?? 0
    return cancelledCount > 0 ? [...VISIBLE_STAGES, 'cancelled'] : VISIBLE_STAGES
  }, [columns])

  // Transform columns to kibo-ui format
  const kanbanColumns = useMemo(
    () =>
      activeStages.map((stage) => ({
        id: stage,
        name: tAssign(`kanban.columns.${stage}`, stage),
      })),
    [activeStages, tAssign],
  )

  // Transform assignments to kibo-ui data format
  const kanbanData = useMemo(() => {
    if (!columns) return []
    const items: Array<{ id: string; name: string; column: string }> = []
    for (const stage of activeStages) {
      const stageItems = columns[stage] ?? []
      for (const a of stageItems) {
        items.push({ id: a.id, name: a.work_item_id, column: stage })
      }
    }
    return items
  }, [columns, activeStages])

  // Keep full assignment data for card rendering
  const assignmentMap = useMemo(() => {
    if (!columns) return new Map<string, KanbanAssignment>()
    const map = new Map<string, KanbanAssignment>()
    for (const col of Object.values(columns)) {
      for (const a of col ?? []) {
        map.set(a.id, a)
      }
    }
    return map
  }, [columns])

  const onKanbanDragEnd = useCallback(
    (event: DragEndEvent): void => {
      const { active, over } = event
      if (!over) return

      const assignmentId = active.id as string
      const item = kanbanData.find((a) => a.id === assignmentId)
      if (!item) return

      const validStages: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']
      const newStage = over.id as WorkflowStage
      if (validStages.includes(newStage) && item.column !== newStage) {
        handleDragEnd(assignmentId, newStage)
      }
    },
    [kanbanData, handleDragEnd],
  )

  const isEmpty = !isLoading && (stats.total === 0 || !columns)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center text-muted-foreground">
          <ClipboardList className="mx-auto h-8 w-8 mb-2 animate-pulse" />
          <p className="text-sm">{tAssign('kanban.loading')}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('empty.tasks.heading')}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {t('empty.tasks.body')}
        </p>
        <Button variant="outline" size="sm" className="min-h-11">
          <Plus className="h-4 w-4" />
          {t('empty.tasks.action')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {stats.total} {t('tabs.tasks').toLowerCase()}
          </span>
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={stats.progressPercentage} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">
              {stats.progressPercentage}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e): void => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-transparent border rounded-md px-2 py-1 min-h-8 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={tAssign('kanban.sort_by')}
            >
              <option value="created_at">{tAssign('kanban.sort_created')}</option>
              <option value="sla_deadline">{tAssign('kanban.sort_sla')}</option>
              <option value="priority">{tAssign('kanban.sort_priority')}</option>
            </select>
          </div>

          {/* Create task button */}
          <Button variant="outline" size="sm" className="min-h-8">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.createTask')}</span>
          </Button>
        </div>
      </div>

      {/* Desktop Kanban Board (md+) */}
      <div className="hidden md:block">
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <KanbanProvider
            columns={kanbanColumns}
            data={kanbanData}
            onDragEnd={onKanbanDragEnd}
            className="min-w-[1000px] pb-2 gap-3"
          >
            {(column) => (
              <KanbanBoard
                key={column.id}
                id={column.id}
                className={`bg-muted/30 border-muted min-w-[280px]`}
              >
                <KanbanHeader className="bg-muted/50 font-semibold text-sm px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <span>{column.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {kanbanData.filter((a) => a.column === column.id).length}
                    </Badge>
                  </div>
                </KanbanHeader>
                <KanbanCards id={column.id} className="p-3 gap-3 min-h-[200px]">
                  {(assignment) => {
                    const fullAssignment = assignmentMap.get(assignment.id as string)
                    return (
                      <KanbanCard
                        key={assignment.id}
                        id={assignment.id}
                        name={assignment.name}
                        column={assignment.column}
                        className="bg-background hover:shadow-md transition-shadow border-border"
                      >
                        {fullAssignment != null && <KanbanTaskCard assignment={fullAssignment} />}
                      </KanbanCard>
                    )
                  }}
                </KanbanCards>
              </KanbanBoard>
            )}
          </KanbanProvider>
        </div>
      </div>

      {/* Mobile Stacked View (< md) */}
      <div className="block md:hidden space-y-3">
        {activeStages.map((stage) => (
          <MobileStageSection
            key={stage}
            stage={stage}
            label={tAssign(`kanban.columns.${stage}`, stage)}
            assignments={columns?.[stage] ?? []}
            allStages={activeStages}
            stageLabels={activeStages.reduce(
              (acc, s) => {
                acc[s] = tAssign(`kanban.columns.${s}`, s)
                return acc
              },
              {} as Record<WorkflowStage, string>,
            )}
            onMoveToStage={handleDragEnd}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Mobile collapsible stage section with "Move to" dropdown per card.
 */
function MobileStageSection({
  stage,
  label,
  assignments,
  allStages,
  stageLabels,
  onMoveToStage,
}: {
  stage: WorkflowStage
  label: string
  assignments: KanbanAssignment[]
  allStages: WorkflowStage[]
  stageLabels: Record<WorkflowStage, string>
  onMoveToStage: (assignmentId: string, newStage: WorkflowStage) => void
}): ReactElement {
  const { t: tAssign } = useTranslation('assignments')
  const [expanded, setExpanded] = useState(stage === 'todo' || stage === 'in_progress')

  const toggleExpanded = useCallback((): void => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <div className={`rounded-lg border ${STAGE_COLORS[stage]} overflow-hidden`}>
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between px-4 py-3 min-h-11"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {assignments.length}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 px-3 pb-3">
          {assignments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              {tAssign('kanban.no_assignments')}
            </p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md border bg-card p-3 space-y-2">
                <KanbanTaskCard assignment={assignment} />

                {/* Move to dropdown */}
                <div className="pt-2 border-t">
                  <select
                    value={stage}
                    onChange={(e): void => {
                      const newStage = e.target.value as WorkflowStage
                      if (newStage !== stage) {
                        onMoveToStage(assignment.id, newStage)
                      }
                    }}
                    className="text-xs w-full bg-transparent border rounded-md px-2 py-1.5 min-h-8 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={tAssign('kanban.drag_to_move')}
                  >
                    {allStages.map((s) => (
                      <option key={s} value={s}>
                        {stageLabels[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
