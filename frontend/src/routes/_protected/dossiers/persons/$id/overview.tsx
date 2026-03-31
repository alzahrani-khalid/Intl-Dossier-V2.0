/**
 * Person Overview Tab Route
 * Lazy-loads PersonOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const PersonOverviewTab = lazy(() =>
  import('@/pages/dossiers/PersonOverviewTab').then((m) => ({
    default: m.PersonOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/persons/$id/overview')({
  component: PersonOverviewRoute,
})

function PersonOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <PersonOverviewTab dossierId={id} />
    </Suspense>
  )
}
