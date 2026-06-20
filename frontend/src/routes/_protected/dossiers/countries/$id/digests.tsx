/**
 * Country Digests Tab Route
 * Lazy-loads the DigestsTab component (Phase 70, D-12).
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DigestsTab = lazy(() =>
  import('@/components/intelligence/DigestsTab').then((m) => ({
    default: m.DigestsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/countries/$id/digests')({
  component: CountryDigestsRoute,
})

function CountryDigestsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DigestsTab dossierId={id} />
    </Suspense>
  )
}
