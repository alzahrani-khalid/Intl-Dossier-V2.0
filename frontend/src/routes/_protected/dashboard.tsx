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
 *
 * Phase 17 UAT fix: the project already ships an onboarding tour modal that
 * also opens on /dashboard. Two Radix Dialogs cannot be open at the same time
 * — the second one to mount forces the first to fire `onOpenChange(false)` via
 * the focus trap, which would silently dismiss FirstRunModal forever (it
 * persists dismissal in localStorage). To avoid the conflict the FirstRunModal
 * is gated on the existing tour's completion flag (`intl-dossier-onboarding-seen`).
 * If the tour is not yet seen, FirstRunModal stays closed and a low-frequency
 * poll watches the flag — once the user dismisses the tour, FirstRunModal
 * appears on the next tick.
 */

import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useState } from 'react'
import { FirstRunModal } from '@/components/FirstRun/FirstRunModal'
import { useFirstRunCheck } from '@/hooks/useFirstRunCheck'

const FIRST_RUN_DISMISSED_KEY = 'intl-dossier:first-run-dismissed'
const ONBOARDING_SEEN_KEY = 'intl-dossier-onboarding-seen'
const TOUR_POLL_INTERVAL_MS = 500

const OperationsHub = lazy(() =>
  import('@/pages/Dashboard/OperationsHub').then((m) => ({
    default: m.OperationsHub,
  })),
)

export const Route = createFileRoute('/_protected/dashboard')({
  component: OperationsHubRoute,
})

/**
 * Watches localStorage for the project's existing onboarding-tour completion
 * flag. Returns `true` once the tour has been seen (or skipped). Polls at a
 * low frequency because the tour modal lives in the same tab and `storage`
 * events do not fire same-window in browsers.
 */
function useTourComplete(): boolean {
  const [done, setDone] = useState<boolean>((): boolean => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true'
  })

  useEffect((): (() => void) | undefined => {
    if (done || typeof window === 'undefined') {
      return undefined
    }
    const interval = window.setInterval((): void => {
      if (window.localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true') {
        setDone(true)
      }
    }, TOUR_POLL_INTERVAL_MS)
    return (): void => window.clearInterval(interval)
  }, [done])

  return done
}

function OperationsHubRoute(): React.ReactElement {
  const { data: firstRun } = useFirstRunCheck()
  const tourComplete = useTourComplete()

  const [dismissed, setDismissed] = useState<boolean>((): boolean => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.localStorage.getItem(FIRST_RUN_DISMISSED_KEY) === 'true'
  })

  const showFirstRun = firstRun?.isEmpty === true && !dismissed && tourComplete

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
