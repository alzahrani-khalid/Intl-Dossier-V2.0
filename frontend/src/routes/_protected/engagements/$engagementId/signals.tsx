/**
 * Engagement Signals Tab Route
 *
 * Phase 69 (D-01): an engagement's `engagementId` IS a `dossiers.id`
 * (`engagement_dossiers` is a 1:1 extension table sharing the dossiers PK).
 * The tab body reuses the shipped `DossierSignalsTab` verbatim with
 * `dossierId={engagementId}` — the SAME SignalsQueue path used by the other
 * seven dossier types and the global /intelligence queue, filtered by
 * dossierId. The clearance gate (read_signals INVOKER RPC) still applies per
 * dossier (SIGNAL-04). Mirrors the sibling `positions.tsx` route.
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

export const Route = createFileRoute('/_protected/engagements/$engagementId/signals')({
  component: EngagementSignalsRoute,
})

function EngagementSignalsRoute(): ReactElement {
  const { engagementId } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierSignalsTab dossierId={engagementId} />
    </Suspense>
  )
}
