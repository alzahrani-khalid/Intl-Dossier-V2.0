/**
 * Audit Tab Route
 * Lazy-loads AuditTab with list skeleton fallback.
 */

import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const AuditTab = React.lazy(
  () => import('@/pages/engagements/workspace/AuditTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/audit')({
  component: AuditRoute,
})

function AuditRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <AuditTab />
    </Suspense>
  )
}
