/**
 * Elected Official Documents Tab Route
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

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/docs')({
  component: ElectedOfficialDocsTab,
})

function ElectedOfficialDocsTab(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierDocumentsTab dossierId={id} />
    </Suspense>
  )
}
