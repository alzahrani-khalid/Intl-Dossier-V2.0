/**
 * Context Tab Route
 * Lazy-loads ContextTab with cards skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const ContextTab = React.lazy(
  () => import('@/pages/engagements/workspace/ContextTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/context')({
  component: ContextRoute,
})

function ContextRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <ContextTab />
    </Suspense>
  )
}
