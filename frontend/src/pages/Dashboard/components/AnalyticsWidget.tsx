/**
 * AnalyticsWidget -- KPI summary grid for dashboard zone
 * Phase 13: Feature Absorption -- Analytics into Dashboard
 *
 * Renders 4 high-level KPI cards: Total Dossiers, Active Engagements,
 * Upcoming Deadlines, Open Work Items. 2-col mobile, 4-col sm+.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalyticsDashboard } from '@/domains/analytics/hooks/useAnalyticsDashboard'
import { KpiCard } from '@/components/analytics/KpiCard'

// ============================================================================
// Types
// ============================================================================

interface AnalyticsDashboardData {
  totalDossiers?: number
  activeEngagements?: number
  upcomingDeadlines?: number
  openWorkItems?: number
}

// ============================================================================
// Component
// ============================================================================

export function AnalyticsWidget(): ReactElement {
  const { t } = useTranslation('operations-hub')
  // P96 DEAD-05: the hook now returns one query per edge-fn section; this widget reads `summary`.
  // The four KPIs below are not fields the summary payload carries, so it settles on its own
  // empty state rather than the 404 error it showed while the repository pointed at Express.
  const { data, isLoading, isError } = useAnalyticsDashboard().summary

  if (isError) {
    return <p className="text-sm text-muted-foreground text-start py-4">{t('analytics.error')}</p>
  }

  const analytics = (data as AnalyticsDashboardData | undefined) ?? {}

  const hasData =
    analytics.totalDossiers != null ||
    analytics.activeEngagements != null ||
    analytics.upcomingDeadlines != null ||
    analytics.openWorkItems != null

  if (!isLoading && !hasData) {
    return <p className="text-sm text-muted-foreground text-start py-4">{t('analytics.empty')}</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard
        label={t('kpi.totalDossiers')}
        value={analytics.totalDossiers}
        isLoading={isLoading}
      />
      <KpiCard
        label={t('kpi.activeEngagements')}
        value={analytics.activeEngagements}
        isLoading={isLoading}
      />
      <KpiCard
        label={t('kpi.upcomingDeadlines')}
        value={analytics.upcomingDeadlines}
        isLoading={isLoading}
      />
      <KpiCard
        label={t('kpi.openWorkItems')}
        value={analytics.openWorkItems}
        isLoading={isLoading}
      />
    </div>
  )
}
