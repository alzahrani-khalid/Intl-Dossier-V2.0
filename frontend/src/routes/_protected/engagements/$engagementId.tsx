/**
 * Engagement Workspace Layout Route
 *
 * Layout route that renders WorkspaceShell with Outlet.
 * All tab routes (overview, context, tasks, calendar, docs, audit)
 * and the after-action route render as children inside this shell.
 */

import type { ReactElement } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'

export const Route = createFileRoute('/_protected/engagements/$engagementId')({
  component: EngagementWorkspaceLayout,
})

function EngagementWorkspaceLayout(): ReactElement {
  const { engagementId } = Route.useParams()

  return (
    <WorkspaceShell engagementId={engagementId}>
      <Outlet />
    </WorkspaceShell>
  )
}
