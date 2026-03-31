/**
 * Forum Overview Tab Route
 * Lazy-loads ForumOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const ForumOverviewTab = lazy(() =>
  import('@/pages/dossiers/ForumOverviewTab').then((m) => ({
    default: m.ForumOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/forums/$id/overview')({
  component: ForumOverviewRoute,
})

function ForumOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <ForumOverviewTab dossierId={id} />
    </Suspense>
  )
}
