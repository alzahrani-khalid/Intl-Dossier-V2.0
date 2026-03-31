/**
 * Working Group Overview Tab Route
 * Lazy-loads the existing WorkingGroupDossierPage as overview content.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

const WorkingGroupOverviewTab = lazy(() =>
  import('@/pages/dossiers/WorkingGroupDossierPage').then((m) => ({
    default: m.WorkingGroupDossierPage,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/working_groups/$id/overview')({
  component: WorkingGroupOverviewRoute,
})

function WorkingGroupOverviewRoute(): ReactElement {
  const { id } = Route.useParams()
  const { data: dossier, isLoading } = useDossier(id)

  if (isLoading || dossier == null) {
    return <TabSkeleton type="cards" />
  }

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <WorkingGroupOverviewTab
        dossier={dossier as unknown as Parameters<typeof WorkingGroupOverviewTab>[0]['dossier']}
      />
    </Suspense>
  )
}
