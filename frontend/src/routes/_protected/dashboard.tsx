/**
 * Dashboard Route
 *
 * Dossier-centric landing page that shows user's dossiers,
 * recent activity, and pending work grouped by dossier.
 *
 * Performance: Lazy-loaded for code splitting.
 */

// Perf (PERF-04): This route is a thin Suspense wrapper around lazy-loaded DashboardPage.
// No memoization needed here — DashboardPage.tsx contains useMemo for trendRange and
// date computations. Dashboard sub-components (DossierQuickStatsCard, RecentDossierActivity,
// PendingWorkByDossier) are wrapped in React.memo per Plan 07-03.

import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const DashboardPage = lazy(() =>
  import('@/pages/Dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
)

export const Route = createFileRoute('/_protected/dashboard')({
  component: DossierDashboardPage,
})

function DossierDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  )
}
