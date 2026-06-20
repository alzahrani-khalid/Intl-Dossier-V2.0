/**
 * Elected Official Signals Tab Route
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

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/signals')({
  component: ElectedOfficialSignalsRoute,
})

function ElectedOfficialSignalsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierSignalsTab dossierId={id} />
    </Suspense>
  )
}
