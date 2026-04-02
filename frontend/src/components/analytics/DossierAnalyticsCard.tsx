/**
 * DossierAnalyticsCard -- Per-type analytics card for dossier overview tabs
 * Phase 13: Feature Absorption -- Analytics into Dossier Overview
 *
 * Renders type-specific analytics metrics for a dossier.
 * Follows SharedSummaryStatsCard pattern: border card, stat rows.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalyticsForDossier } from '@/domains/analytics/hooks/useAnalyticsForDossier'

// ============================================================================
// Types
// ============================================================================

type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'

interface DossierAnalyticsCardProps {
  dossierId: string
  dossierType: DossierType
}

// ============================================================================
// Component
// ============================================================================

export function DossierAnalyticsCard({
  dossierId,
  dossierType,
}: DossierAnalyticsCardProps): ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { metrics, isLoading, isError } = useAnalyticsForDossier(dossierId, dossierType)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-base font-semibold leading-tight text-start mb-4">
          {t('overview.analytics', { defaultValue: 'Analytics' })}
        </h3>
        <p className="text-sm text-muted-foreground text-start">
          {t('overview.analyticsError', { defaultValue: 'Unable to load analytics' })}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {t('overview.analytics', { defaultValue: 'Analytics' })}
      </h3>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div
            key={metric.i18nKey}
            className="flex items-center justify-between rounded-md bg-muted/50 p-3"
          >
            <span className="text-sm text-muted-foreground">
              {t(metric.i18nKey, { defaultValue: metric.label })}
            </span>
            <span className="text-base font-semibold">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
