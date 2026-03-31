/**
 * Topic Overview Tab Route
 * Lazy-loads the existing TopicDossierPage as overview content.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

const TopicOverviewTab = lazy(() =>
  import('@/pages/dossiers/TopicDossierPage').then((m) => ({
    default: m.TopicDossierPage,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/topics/$id/overview')({
  component: TopicOverviewRoute,
})

function TopicOverviewRoute(): ReactElement {
  const { id } = Route.useParams()
  const { data: dossier, isLoading } = useDossier(id)

  if (isLoading || dossier == null) {
    return <TabSkeleton type="cards" />
  }

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <TopicOverviewTab dossier={dossier as Parameters<typeof TopicOverviewTab>[0]['dossier']} />
    </Suspense>
  )
}
