/**
 * Topic Positions Tab Route
 * Lazy-loads the existing DossierPositionsTab component.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierPositionsTab = lazy(() =>
  import('@/components/positions/DossierPositionsTab').then((m) => ({
    default: m.DossierPositionsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/topics/$id/positions')({
  component: TopicPositionsRoute,
})

function TopicPositionsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierPositionsTab dossierId={id} />
    </Suspense>
  )
}
