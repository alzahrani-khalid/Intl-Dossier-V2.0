/**
 * Engagement Positions Tab Route
 *
 * ENGPOS-01 decision: the canonical positions source for an engagement is
 * `position_dossier_links` keyed by `dossier_id = engagementId` — an
 * engagement's `engagementId` IS a `dossiers.id`. The legacy
 * `engagement_positions` table (0 rows, write-deny RLS, no migration
 * provenance) and the `engagements-positions-*` edges are deprecated and are
 * never read or written by this route. The tab body reuses the shipped
 * `DossierPositionsTab` verbatim with `dossierId={engagementId}` (countries
 * route precedent).
 */
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierPositionsTab = lazy(() =>
  import('@/components/positions/DossierPositionsTab').then((m) => ({
    default: m.DossierPositionsTab,
  })),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/positions')({
  component: EngagementPositionsRoute,
})

function EngagementPositionsRoute(): ReactElement {
  const { engagementId } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierPositionsTab dossierId={engagementId} />
    </Suspense>
  )
}
