/**
 * Working Group Documents Tab Route
 * Lazy-loads the DossierDocumentsTab component.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierDocumentsTab = lazy(() =>
  import('@/components/dossier/tabs/DossierDocumentsTab').then((m) => ({
    default: m.DossierDocumentsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/working_groups/$id/docs')({
  component: WorkingGroupDocsRoute,
})

function WorkingGroupDocsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierDocumentsTab dossierId={id} />
    </Suspense>
  )
}
