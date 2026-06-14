/**
 * Forum Signals Tab Route
 * Lazy-loads the DossierSignalsTab component (Phase 69, D-01).
 */

import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierSignalsTab = lazy(() =>
  import('@/components/dossier/tabs/DossierSignalsTab').then((m) => ({
    default: m.DossierSignalsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/forums/$id/signals')({
  component: ForumSignalsRoute,
})

function ForumSignalsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierSignalsTab dossierId={id} />
    </Suspense>
  )
}
