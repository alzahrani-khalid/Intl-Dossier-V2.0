/**
 * Country Overview Tab Route
 * Lazy-loads CountryOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const CountryOverviewTab = lazy(() =>
  import('@/pages/dossiers/CountryOverviewTab').then((m) => ({
    default: m.CountryOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/countries/$id/overview')({
  component: CountryOverviewRoute,
})

function CountryOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <CountryOverviewTab dossierId={id} />
    </Suspense>
  )
}
