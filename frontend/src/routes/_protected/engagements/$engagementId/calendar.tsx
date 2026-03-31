/**
 * Calendar Tab Route
 * Lazy-loads CalendarTab with list skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const CalendarTab = React.lazy(
  () => import('@/pages/engagements/workspace/CalendarTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/calendar')({
  component: CalendarRoute,
})

function CalendarRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <CalendarTab />
    </Suspense>
  )
}
