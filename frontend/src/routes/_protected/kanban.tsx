/**
 * Phase 39 Plan 04 — /kanban route is now a thin Suspense + lazy mount of WorkBoard.
 *
 * D-01 mandate: replace the legacy route outright. All data-hook calls and
 * toolbar/list-view chrome live inside the new WorkBoard page composer. The
 * legacy widgets are scheduled for deletion in 39-09.
 *
 * Phase 87 Plan 09 — URL-normalized board state: group/search/source/priority/sort/dir
 * validated here; WorkBoard reads via Route.useSearch + replace:true navigators.
 */

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy, type ReactElement } from 'react'
import {
  parseListControlsSearch,
  type ListControlsConfig,
} from '@/components/list-controls/useListControls'
import type { KanbanColumnMode, Priority, WorkSource } from '@/types/work-item.types'

const WorkBoard = lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))

const GROUP_VALUES = ['status'] as const satisfies readonly KanbanColumnMode[]
const SOURCE_VALUES = ['task', 'commitment', 'intake'] as const satisfies readonly WorkSource[]
const PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'] as const satisfies readonly Priority[]

/** Minimal config for validateSearch whitelisting — facet builders live in WorkBoard. */
export const kanbanListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'source',
      labelKey: 'unified-kanban:filters.source',
      options: SOURCE_VALUES.map((value) => ({
        value,
        labelKey: `unified-kanban:sources.${value}`,
      })),
    },
    {
      key: 'priority',
      labelKey: 'unified-kanban:filters.priority',
      options: PRIORITY_VALUES.map((value) => ({
        value,
        labelKey: `unified-kanban:priority.${value}`,
      })),
    },
  ],
  sortFields: [
    { id: 'deadline', labelKey: 'unified-kanban:sorting.deadline' },
    { id: 'created_at', labelKey: 'unified-kanban:sorting.created_at' },
    { id: 'priority', labelKey: 'unified-kanban:sorting.priority' },
  ],
  grouping: [{ id: 'status', labelKey: 'unified-kanban:columnModes.status' }],
}

export interface KanbanSearch {
  group?: KanbanColumnMode
  search?: string
  source?: WorkSource
  priority?: Priority
  sort?: string
  dir?: 'asc' | 'desc'
}

export const Route = createFileRoute('/_protected/kanban')({
  component: KanbanRoute,
  validateSearch: (raw: Record<string, unknown>): KanbanSearch => {
    const controls = parseListControlsSearch(raw, kanbanListConfig)
    return {
      group:
        controls.group !== undefined && (GROUP_VALUES as readonly string[]).includes(controls.group)
          ? (controls.group as KanbanColumnMode)
          : undefined,
      search: typeof raw.search === 'string' && raw.search.length > 0 ? raw.search : undefined,
      source:
        controls.source !== undefined &&
        (SOURCE_VALUES as readonly string[]).includes(controls.source)
          ? (controls.source as WorkSource)
          : undefined,
      priority:
        controls.priority !== undefined &&
        (PRIORITY_VALUES as readonly string[]).includes(controls.priority)
          ? (controls.priority as Priority)
          : undefined,
      sort: controls.sort,
      dir: controls.dir === 'asc' || controls.dir === 'desc' ? controls.dir : undefined,
    }
  },
})

function KanbanRoute(): ReactElement {
  return (
    <Suspense fallback={null /* page-level Skeleton lives inside WorkBoard */}>
      <WorkBoard />
    </Suspense>
  )
}
