/**
 * Dashboard Route
 *
 * Operations Hub — role-adaptive dashboard showing attention items,
 * timeline, engagements, stats, and activity feed.
 *
 * Performance: Lazy-loaded for code splitting (D-16).
 */

import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const OperationsHub = lazy(() =>
  import('@/pages/Dashboard/OperationsHub').then((m) => ({
    default: m.OperationsHub,
  })),
)

export const Route = createFileRoute('/_protected/dashboard')({
  component: OperationsHubRoute,
})

function OperationsHubRoute(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <OperationsHub />
    </Suspense>
  )
}
