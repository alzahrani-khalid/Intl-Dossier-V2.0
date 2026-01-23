/**
 * Dossier Overview Route
 * Feature: Everything about [Dossier] comprehensive view
 *
 * One-click view that aggregates all connections to a dossier:
 * - Related Dossiers (by relationship type)
 * - Documents (positions, MOUs, briefs)
 * - Work Items (tasks, commitments, intakes with status breakdown)
 * - Calendar Events
 * - Key Contacts
 * - Activity Timeline
 *
 * Includes export capability for the complete dossier profile.
 * Mobile-first, RTL-compatible.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Home, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the DossierOverview component for code splitting
const DossierOverview = lazy(() =>
  import('@/components/Dossier/DossierOverview').then((module) => ({
    default: module.DossierOverview,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/$id/overview')({
  component: DossierOverviewRoute,
})

/**
 * Loading skeleton for the overview page
 */
function OverviewLoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:px-8">
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-5 w-48" />

        {/* Header skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Content skeleton */}
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}

/**
 * Error state component
 */
function ErrorState({ message, isRTL }: { message: string; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div
      className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 sm:p-6"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive sm:size-6" />
          <div className="min-w-0 flex-1">
            <h3 className="mb-2 text-base font-semibold text-destructive sm:text-lg">
              {t('error.title')}
            </h3>
            <p className="text-sm text-destructive/90 sm:text-base">
              {message || t('error.description')}
            </p>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to="/dossiers">
                  <Home className="me-2 size-4" />
                  {t('nav.dossiersHub')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main route component
 */
function DossierOverviewRoute() {
  const { t, i18n } = useTranslation('dossier-overview')
  const isRTL = i18n.language === 'ar'
  const { id } = Route.useParams()

  // Validate dossier ID
  if (!id) {
    return (
      <ErrorState
        message={t('error.invalidId', { defaultValue: 'Invalid dossier ID' })}
        isRTL={isRTL}
      />
    )
  }

  return (
    <Suspense fallback={<OverviewLoadingSkeleton />}>
      <DossierOverview dossierId={id} showExportButton />
    </Suspense>
  )
}

export default DossierOverviewRoute
