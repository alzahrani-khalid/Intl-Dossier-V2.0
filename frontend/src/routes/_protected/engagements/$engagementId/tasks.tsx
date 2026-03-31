/**
 * Tasks Tab Route
 * Lazy-loads TasksTab with kanban skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const TasksTab = React.lazy(
  () => import('@/pages/engagements/workspace/TasksTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/tasks')({
  component: TasksRoute,
})

function TasksRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="kanban" />}>
      <TasksTab />
    </Suspense>
  )
}
