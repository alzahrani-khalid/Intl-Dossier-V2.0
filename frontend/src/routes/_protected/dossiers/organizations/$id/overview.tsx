/**
 * Organization Overview Tab Route
 * Lazy-loads OrganizationOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const OrganizationOverviewTab = lazy(() =>
  import('@/pages/dossiers/OrganizationOverviewTab').then((m) => ({
    default: m.OrganizationOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/organizations/$id/overview')({
  component: OrganizationOverviewRoute,
})

function OrganizationOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <OrganizationOverviewTab dossierId={id} />
    </Suspense>
  )
}
