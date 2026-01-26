/**
 * Organization Dossier Detail Route (Feature 028 - User Story 5)
 * Updated for: Phase 2 Tab-Based Layout
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: Tab-based layout following Country dossier pattern
 * - Reason: Consistent UX across dossier types with URL state persistence
 *
 * Responsive Strategy:
 * - Base: Single column with horizontal scrollable tabs
 * - lg: Full-width tabs with fade indicators
 *
 * RTL Support:
 * - Logical properties: Container uses ps-*, pe-*, text-start
 * - Icon flipping: Directional icons rotate-180 in RTL
 * - Text alignment: text-start for all text content
 *
 * Accessibility:
 * - ARIA: Tab role with proper aria-selected and aria-controls
 * - Keyboard: Tab key navigation, Enter/Space to select
 * - Focus: Visible focus ring on active tab
 *
 * Performance:
 * - Lazy loading: Component code-split via React.lazy
 * - Tab content: Lazy-loaded with Suspense
 *
 * @example
 * <Route path="/dossiers/organizations/:id" />
 * <Route path="/dossiers/organizations/:id?tab=mous" />
 */

import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, AlertCircle } from 'lucide-react'
import { useTypedDossier } from '@/hooks/useDossier'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

// Lazy load the OrganizationDossierPage component for code splitting
const OrganizationDossierPage = lazy(() =>
  import('@/pages/dossiers/OrganizationDossierPage').then((module) => ({
    default: module.OrganizationDossierPage,
  })),
)

// Search params for tab navigation
interface OrganizationDossierSearchParams {
  tab?: string
}

export const Route = createFileRoute('/_protected/dossiers/organizations/$id')({
  component: OrganizationDossierDetailRoute,
  validateSearch: (search: Record<string, unknown>): OrganizationDossierSearchParams => {
    return {
      tab: search.tab as string | undefined,
    }
  },
})

function OrganizationDossierDetailRoute() {
  const { id } = Route.useParams()
  const searchParams = Route.useSearch()
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Fetch organization dossier with type validation
  const { data: dossier, isLoading, error } = useTypedDossier(id, 'organization')

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('detail.loading')}</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !dossier) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">
                  {t('detail.error')}
                </h2>
                <p className="text-sm sm:text-base text-destructive/90 mb-4">
                  {error?.message || t('detail.errorGeneric')}
                </p>
                <Button asChild variant="outline">
                  <Link to="/dossiers">{t('action.backToHub')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Type Mismatch Error (should not happen with type guard, but defensive)
  if (dossier.type !== 'organization') {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">{t('detail.wrongType')}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {t('detail.wrongTypeDescription', {
                actualType: t(`type.${dossier.type}`),
                expectedType: t('type.organization'),
              })}
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to={`/dossiers/${dossier.type}s/${id}`}>
                  {t('action.viewCorrectType', { type: t(`type.${dossier.type}`) })}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dossiers">{t('action.backToHub')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success - Render Organization Dossier Page with Suspense for lazy loading
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
            <p className="text-sm sm:text-base text-muted-foreground">{t('detail.loading')}</p>
          </div>
        </div>
      }
    >
      <OrganizationDossierPage dossier={dossier} initialTab={searchParams.tab} />
    </Suspense>
  )
}
