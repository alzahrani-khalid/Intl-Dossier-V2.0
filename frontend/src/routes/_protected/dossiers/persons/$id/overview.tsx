/**
 * Person Overview Tab Route
 * Lazy-loads the existing PersonDossierPage as overview content.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

const PersonOverviewTab = lazy(() =>
  import('@/pages/dossiers/PersonDossierPage').then((m) => ({
    default: m.PersonDossierPage,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/persons/$id/overview')({
  component: PersonOverviewRoute,
})

function PersonOverviewRoute(): ReactElement {
  const { id } = Route.useParams()
  const { data: dossier, isLoading } = useDossier(id)

  if (isLoading || dossier == null) {
    return <TabSkeleton type="cards" />
  }

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <PersonOverviewTab
        dossier={dossier as Parameters<typeof PersonOverviewTab>[0]['dossier']}
      />
    </Suspense>
  )
}
