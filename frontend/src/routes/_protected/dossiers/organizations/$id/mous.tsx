/**
 * Organization MoUs Tab Route
 * Lazy-loads the existing DossierMoUsTab component.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierMoUsTab = lazy(() =>
  import('@/components/dossiers/DossierMoUsTab').then((m) => ({
    default: m.DossierMoUsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/organizations/$id/mous')({
  component: OrganizationMoUsRoute,
})

function OrganizationMoUsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierMoUsTab dossierId={id} />
    </Suspense>
  )
}
