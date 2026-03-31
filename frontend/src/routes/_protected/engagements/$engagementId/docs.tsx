/**
 * Docs Tab Route
 * Lazy-loads DocsTab with list skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DocsTab = React.lazy(
  () => import('@/pages/engagements/workspace/DocsTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/docs')({
  component: DocsRoute,
})

function DocsRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DocsTab />
    </Suspense>
  )
}
