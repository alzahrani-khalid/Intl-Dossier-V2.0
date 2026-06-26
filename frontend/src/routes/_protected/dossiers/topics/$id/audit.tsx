/**
 * Topic Audit Tab Route
 * Renders the full dossier activity log (this app's "audit" surface) for the dossier.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierActivityTimeline = lazy(() =>
  import('@/components/dossier/DossierActivityTimeline').then((m) => ({
    default: m.DossierActivityTimeline,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/topics/$id/audit')({
  component: TopicAuditRoute,
})

function TopicAuditRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierActivityTimeline dossierId={id} />
    </Suspense>
  )
}
