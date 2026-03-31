/**
 * Working Group Overview Tab Route
 * Lazy-loads WorkingGroupOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const WorkingGroupOverviewTab = lazy(() =>
  import('@/pages/dossiers/WorkingGroupOverviewTab').then((m) => ({
    default: m.WorkingGroupOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/working_groups/$id/overview')({
  component: WorkingGroupOverviewRoute,
})

function WorkingGroupOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <WorkingGroupOverviewTab dossierId={id} />
    </Suspense>
  )
}
