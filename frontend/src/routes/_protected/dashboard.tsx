/**
 * Dashboard Route
 *
 * Operations Hub — role-adaptive dashboard showing attention items,
 * timeline, engagements, stats, and activity feed.
 *
 * Performance: Lazy-loaded for code splitting (D-16).
 *
 * Phase 17 wiring: this route also hosts the FirstRunModal. The first-run
 * detection (`useFirstRunCheck`) is fetched at route mount, gated against a
 * localStorage dismissal flag, and rendered as a sibling of the Suspense
 * boundary so the modal can appear even before OperationsHub finishes
 * lazy-loading.
 */

import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useState } from 'react'
import { FirstRunModal } from '@/components/FirstRun/FirstRunModal'
import { useFirstRunCheck } from '@/hooks/useFirstRunCheck'

const FIRST_RUN_DISMISSED_KEY = 'intl-dossier:first-run-dismissed'

const OperationsHub = lazy(() =>
  import('@/pages/Dashboard/OperationsHub').then((m) => ({
    default: m.OperationsHub,
  })),
)

export const Route = createFileRoute('/_protected/dashboard')({
  component: OperationsHubRoute,
})

function OperationsHubRoute(): React.ReactElement {
  const { data: firstRun } = useFirstRunCheck()

  const [dismissed, setDismissed] = useState<boolean>((): boolean => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.localStorage.getItem(FIRST_RUN_DISMISSED_KEY) === 'true'
  })

  const showFirstRun = firstRun?.isEmpty === true && !dismissed

  const handleFirstRunOpenChange = (open: boolean): void => {
    if (!open) {
      setDismissed(true)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(FIRST_RUN_DISMISSED_KEY, 'true')
      }
    }
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <OperationsHub />
      </Suspense>

      <FirstRunModal
        open={showFirstRun}
        onOpenChange={handleFirstRunOpenChange}
        canSeed={firstRun?.canSeed ?? false}
      />
    </>
  )
}
