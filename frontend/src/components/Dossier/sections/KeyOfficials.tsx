/**
 * Key Officials Section (Feature 028 + 029 - User Story 1 + 4 - T025, T061)
 *
 * Displays person dossiers related to country via dossier_relationships.
 * Includes inline political intelligence widget (Feature 029 - User Story 4 - T061)
 * Card grid layout with person details.
 * Mobile-first layout with RTL support.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import { IntelligenceInsight } from '@/components/intelligence/IntelligenceInsight'
import { useIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence'
import { useKeyOfficials } from '@/hooks/useKeyOfficials'
import { PersonCard } from '@/components/Dossier/PersonCard'
import { Skeleton } from '@/components/ui/skeleton'

interface KeyOfficialsProps {
  dossierId: string
}

export function KeyOfficials({ dossierId }: KeyOfficialsProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Fetch political intelligence for inline widget (Feature 029 - User Story 4 - T061)
  const {
    data: politicalIntelligence,
    isLoading: isLoadingPolitical,
    error: politicalError,
  } = useIntelligence({
    entity_id: dossierId,
    intelligence_type: 'political',
  })

  // Refresh mutation for political intelligence
  const { mutate: refreshPolitical, isPending: isRefreshingPolitical } = useRefreshIntelligence()

  const handlePoliticalRefresh = () => {
    refreshPolitical({
      entity_id: dossierId,
      intelligence_types: ['political'],
    })
  }

  // Fetch person dossiers related to this country (T083)
  const {
    data: keyOfficials,
    isLoading: isLoadingOfficials,
    error: officialsError,
  } = useKeyOfficials({ countryId: dossierId })

  // Extract AI profile summary from political intelligence (T086)
  // Memoized to prevent recalculation on every render (T055 - Performance)
  const aiProfileSummary = useMemo(() => {
    if (!politicalIntelligence?.data?.[0]) return null
    return isRTL
      ? politicalIntelligence.data[0].analysis_ar || politicalIntelligence.data[0].analysis_en
      : politicalIntelligence.data[0].analysis_en || politicalIntelligence.data[0].analysis_ar
  }, [politicalIntelligence?.data, isRTL])

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Political Intelligence Widget (Feature 029 - User Story 4 - T061) */}
      <div className="w-full">
        <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">
          {t('intelligence.political_analysis', 'Political Analysis')}
        </h3>
        {isLoadingPolitical ? (
          <Skeleton className="h-48 w-full" />
        ) : politicalIntelligence && politicalIntelligence.data.length > 0 ? (
          <IntelligenceInsight
            intelligence={politicalIntelligence.data[0]}
            onRefresh={handlePoliticalRefresh}
            isRefreshing={isRefreshingPolitical}
            dossierType="countries"
            dossierId={dossierId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8">
            <Users className="mb-2 size-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {politicalError
                ? t('intelligence.error_loading', 'Error loading intelligence')
                : t('intelligence.no_political_data', 'No political intelligence available')}
            </p>
          </div>
        )}
      </div>

      {/* Key Officials Section (T083-T086) */}
      <div className="w-full">
        <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">
          {t('sections.country.keyOfficials', 'Key Officials')}
        </h3>

        {/* Loading State */}
        {isLoadingOfficials && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Error State */}
        {officialsError && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8">
            <Users className="mb-2 size-8 text-destructive" />
            <p className="text-center text-sm text-destructive">
              {t('common.error', 'Error loading data')}: {officialsError.message}
            </p>
          </div>
        )}

        {/* Empty State with AI Suggestions (T089) */}
        {!isLoadingOfficials && !officialsError && (!keyOfficials || keyOfficials.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8 text-center sm:py-12">
            <div className="mb-4 sm:mb-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
                <Users className="size-8 text-primary sm:size-10" />
              </div>
            </div>

            <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
              {t('sections.country.keyOfficialsEmpty', 'No Key Officials')}
            </h3>

            <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground sm:text-base">
              {t(
                'sections.country.keyOfficialsEmptyDescription',
                'No key officials have been linked to this country yet.',
              )}
            </p>

            {aiProfileSummary && (
              <div className="mb-6 max-w-lg px-4">
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="text-lg">✨</span>
                    <h4 className="text-start text-sm font-semibold text-purple-900 dark:text-purple-100">
                      {t('intelligence.political_context', 'Political Context')}
                    </h4>
                  </div>
                  <p className="line-clamp-3 text-start text-xs text-purple-700 dark:text-purple-300 sm:text-sm">
                    {aiProfileSummary}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display Key Officials (T084-T085) */}
        {!isLoadingOfficials && !officialsError && keyOfficials && keyOfficials.length > 0 && (
          <div className="space-y-4">
            {/* AI Context Banner (T086) */}
            {aiProfileSummary && (
              <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-lg">✨</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 text-start text-sm font-semibold text-purple-900 dark:text-purple-100">
                      {t('intelligence.political_context', 'Political Context')}
                    </h4>
                    <p className="line-clamp-4 text-start text-xs text-purple-700 dark:text-purple-300 sm:text-sm">
                      {aiProfileSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Person Cards Grid (T084) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {keyOfficials.map((person) => (
                <PersonCard
                  key={person.id}
                  dossier={{
                    ...person,
                    type: 'person' as const,
                    status: (person.status || 'active') as any,
                    dossier_type: 'person',
                  }}
                  onView={() => {
                    // Navigate to person detail
                    window.location.href = `/dossiers/persons/${person.id}`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
