/**
 * Country Engagements Tab Route
 * Lazy-loads the DossierEngagementsTab component.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierEngagementsTab = lazy(() =>
  import('@/components/dossier/tabs/DossierEngagementsTab').then((m) => ({
    default: m.DossierEngagementsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/countries/$id/engagements')({
  component: CountryEngagementsRoute,
})

function CountryEngagementsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierEngagementsTab dossierId={id} />
    </Suspense>
  )
}
