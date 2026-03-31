/**
 * Country Overview Tab Route
 * Lazy-loads the existing CountryDossierPage as overview content.
 * Uses useDossier hook (deduplicated by TanStack Query with DossierShell).
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'

const CountryOverviewTab = lazy(() =>
  import('@/pages/dossiers/CountryDossierPage').then((m) => ({
    default: m.CountryDossierPage,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/countries/$id/overview')({
  component: CountryOverviewRoute,
})

function CountryOverviewRoute(): ReactElement {
  const { id } = Route.useParams()
  const { data: dossier, isLoading } = useDossier(id)

  if (isLoading || dossier == null) {
    return <TabSkeleton type="cards" />
  }

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <CountryOverviewTab dossier={dossier as Parameters<typeof CountryOverviewTab>[0]['dossier']} />
    </Suspense>
  )
}
