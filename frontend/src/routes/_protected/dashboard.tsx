/**
 * Dashboard Route
 *
 * Dossier-centric landing page that shows user's dossiers,
 * recent activity, and pending work grouped by dossier.
 *
 * Performance: Lazy-loaded for code splitting.
 */

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
