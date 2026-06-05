/**
 * Person Timeline Tab Route
 * Lazy-loads the DossierActivityTimeline component.
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

export const Route = createFileRoute('/_protected/dossiers/persons/$id/timeline')({
  component: PersonTimelineRoute,
})

function PersonTimelineRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierActivityTimeline dossierId={id} />
    </Suspense>
  )
}
