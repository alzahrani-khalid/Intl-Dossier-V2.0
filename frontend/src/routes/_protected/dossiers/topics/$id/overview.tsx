/**
 * Topic Overview Tab Route
 * Lazy-loads TopicOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const TopicOverviewTab = lazy(() =>
  import('@/pages/dossiers/TopicOverviewTab').then((m) => ({
    default: m.TopicOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/topics/$id/overview')({
  component: TopicOverviewRoute,
})

function TopicOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <TopicOverviewTab dossierId={id} />
    </Suspense>
  )
}
