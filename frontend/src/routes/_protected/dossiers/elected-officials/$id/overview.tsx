/**
 * Elected Official Overview Tab Route
 * Lazy-loads ElectedOfficialOverviewTab with enrichment cards.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const ElectedOfficialOverviewTab = lazy(() =>
  import('@/pages/dossiers/ElectedOfficialOverviewTab').then((m) => ({
    default: m.ElectedOfficialOverviewTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/overview')({
  component: ElectedOfficialOverviewRoute,
})

function ElectedOfficialOverviewRoute(): ReactElement {
  const { id } = Route.useParams()

  return (
    <Suspense fallback={<TabSkeleton type="cards" />}>
      <ElectedOfficialOverviewTab dossierId={id} />
    </Suspense>
  )
}
