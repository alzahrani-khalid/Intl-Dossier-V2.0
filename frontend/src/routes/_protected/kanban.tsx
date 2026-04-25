/**
 * Phase 39 Plan 04 — /kanban route is now a thin Suspense + lazy mount of WorkBoard.
 *
 * D-01 mandate: replace the legacy route outright. All data-hook calls and
 * toolbar/list-view chrome live inside the new WorkBoard page composer. The
 * legacy widgets are scheduled for deletion in 39-09.
 */

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy, type ReactElement } from 'react'

const WorkBoard = lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))

export const Route = createFileRoute('/_protected/kanban')({
  component: KanbanRoute,
})

function KanbanRoute(): ReactElement {
  return (
    <Suspense fallback={null /* page-level Skeleton lives inside WorkBoard */}>
      <WorkBoard />
    </Suspense>
  )
}
