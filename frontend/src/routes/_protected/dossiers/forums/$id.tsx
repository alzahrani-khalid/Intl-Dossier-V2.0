/**
 * Forum Dossier Detail Route (Feature 028 - User Story 6)
 * Updated for: Phase 2 Tab-Based Layout with URL state persistence
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: Tab-based layout with horizontal scroll (mobile)
 * - Reason: Consistent UX with other dossier types, URL state persistence
 *
 * Responsive Strategy:
 * - Base: Horizontal scrollable tabs with fade indicators
 * - lg: Full-width tabs without scroll
 * - Content: Responsive padding (p-4 sm:p-6)
 *
 * RTL Support:
 * - Logical properties: Container uses ps-*, pe-*, text-start
 * - Gradient directions: bg-gradient-to-e, bg-gradient-to-s
 * - Text alignment: text-start for all text content
 *
 * Accessibility:
 * - ARIA: role="tablist", role="tab", aria-selected, aria-controls
 * - Keyboard: Tab navigation through tabs, Enter/Space to select
 * - Focus: Focus management in tab navigation
 *
 * Performance:
 * - Lazy loading: Tab content loaded on demand with Suspense
 * - Memoization: Type guard validation memoized via TanStack Query
 *
 * @example
 * <Route path="/dossiers/forums/:id?tab=overview" />
 */

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Search params schema for tab state
const forumSearchSchema = z.object({
  tab: z
    .enum([
      'overview',
      'members',
      'schedule',
      'deliverables',
      'decisions',
      'relationships',
      'mous',
      'documents',
      'timeline',
      'activity',
      'comments',
    ])
    .optional()
    .default('overview'),
})
import { useTranslation } from 'react-i18next'
import { Loader2, AlertCircle } from 'lucide-react'
import { useTypedDossier } from '@/hooks/useDossier'
import { ForumDossierPage } from '@/pages/dossiers/ForumDossierPage'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/forums/$id')({
  component: ForumDossierDetailRoute,
  validateSearch: forumSearchSchema,
})

function ForumDossierDetailRoute() {
  const { id } = Route.useParams()
  const { tab } = Route.useSearch()
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Fetch forum dossier with type validation
  const { data: dossier, isLoading, error } = useTypedDossier(id, 'forum')

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

  // Type Mismatch Error
  if (dossier.type !== 'forum') {
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
                expectedType: t('type.forum'),
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

  // Success - Render Forum Dossier Page with tab from URL
  return <ForumDossierPage dossier={dossier} initialTab={tab} />
}
