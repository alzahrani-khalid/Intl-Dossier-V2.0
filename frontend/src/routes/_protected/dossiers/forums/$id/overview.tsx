/**
 * Forum Overview Tab Route
 * Lazy-loads the existing ForumDossierPage as overview content.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

const ForumOverviewTab = lazy(() =>
  import('@/pages/dossiers/ForumDossierPage').then((m) => ({
    default: m.ForumDossierPage,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/forums/$id/overview')({
  component: ForumOverviewRoute,
})

function ForumOverviewRoute(): ReactElement {
  const { id } = Route.useParams()
  const { data: dossier, isLoading } = useDossier(id)

  if (isLoading || dossier == null) {
    return <TabSkeleton type="cards" />
  }

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <ForumOverviewTab dossier={dossier as unknown as Parameters<typeof ForumOverviewTab>[0]['dossier']} />
    </Suspense>
  )
}
