/**
 * Overview Tab Route
 * Lazy-loads OverviewTab with summary skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const OverviewTab = React.lazy(
  () => import('@/pages/engagements/workspace/OverviewTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/overview')({
  component: OverviewRoute,
})

function OverviewRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="summary" />}>
      <OverviewTab />
    </Suspense>
  )
}
