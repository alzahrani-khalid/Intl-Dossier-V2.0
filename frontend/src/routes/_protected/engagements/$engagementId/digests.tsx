/**
 * Engagement Digests Tab Route
 *
 * Phase 70 (D-12): an engagement's `engagementId` is the dossier UUID used by
 * engagement_dossiers, so the shared DigestsTab receives it as dossierId.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DigestsTab = lazy(() =>
  import('@/components/intelligence/DigestsTab').then((m) => ({
    default: m.DigestsTab,
  })),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/digests')({
  component: EngagementDigestsRoute,
})

function EngagementDigestsRoute(): ReactElement {
  const { engagementId } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DigestsTab dossierId={engagementId} />
    </Suspense>
  )
}
