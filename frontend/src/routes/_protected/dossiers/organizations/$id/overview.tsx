/**
 * Organization Overview Tab Route
 * Lazy-loads the existing OrganizationDossierPage as overview content.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

const OrganizationOverviewTab = lazy(() =>
  import('@/pages/dossiers/OrganizationDossierPage').then((m) => ({
    default: m.OrganizationDossierPage,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/organizations/$id/overview')({
  component: OrganizationOverviewRoute,
})

function OrganizationOverviewRoute(): ReactElement {
  const { id } = Route.useParams()
  const { data: dossier, isLoading } = useDossier(id)

  if (isLoading || dossier == null) {
    return <TabSkeleton type="cards" />
  }

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <OrganizationOverviewTab
        dossier={dossier as Parameters<typeof OrganizationOverviewTab>[0]['dossier']}
      />
    </Suspense>
  )
}
