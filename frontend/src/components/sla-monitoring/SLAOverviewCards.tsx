/**
 * SLA Overview Cards Component
 * Feature: sla-monitoring
 *
 * Displays key SLA metrics in card format with RTL support
 */

import { useTranslation } from 'react-i18next'
import { CheckCircle, AlertTriangle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SLADashboardOverview } from '@/types/sla.types'
import { getComplianceThreshold, formatSLADuration, formatSLADurationAr } from '@/types/sla.types'
import { cn } from '@/lib/utils'

interface SLAOverviewCardsProps {
  data?: SLADashboardOverview
  isLoading?: boolean
  className?: string
}

export function SLAOverviewCards({ data, isLoading, className }: SLAOverviewCardsProps) {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div
        className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  const complianceThreshold = getComplianceThreshold(data.compliance_rate)
  const avgDuration = isRTL
    ? formatSLADurationAr(data.avg_resolution_minutes)
    : formatSLADuration(data.avg_resolution_minutes)

  // Calculate trend (simple comparison)
  const trendData = data.trend_data || []
  const recentCompliance =
    trendData.length > 1 ? trendData[trendData.length - 1]?.compliance_pct : null
  const previousCompliance =
    trendData.length > 1 ? trendData[trendData.length - 2]?.compliance_pct : null
  const complianceTrend =
    recentCompliance !== null && previousCompliance !== null
      ? recentCompliance - previousCompliance
      : null

  const cards = [
    {
      title: t('overview.complianceRate'),
      value: `${data.compliance_rate}%`,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      trend: complianceTrend,
      subtitle: complianceThreshold.label,
      subtitleColor: complianceThreshold.color,
      bgColor: complianceThreshold.bgColor,
    },
    {
      title: t('overview.totalItems'),
      value: data.total_items.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      subtitle: t('overview.processed'),
      subtitleColor: 'text-muted-foreground',
    },
    {
      title: t('overview.atRisk'),
      value: data.at_risk_count.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      subtitle: t('overview.approachingDeadline'),
      subtitleColor: data.at_risk_count > 0 ? 'text-yellow-600' : 'text-muted-foreground',
      bgColor: data.at_risk_count > 0 ? 'bg-yellow-50' : undefined,
    },
    {
      title: t('overview.breached'),
      value: data.breached_count.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      subtitle: t('overview.requiresAttention'),
      subtitleColor: data.breached_count > 0 ? 'text-red-600' : 'text-muted-foreground',
      bgColor: data.breached_count > 0 ? 'bg-red-50' : undefined,
    },
  ]

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {cards.map((card, index) => (
        <Card key={index} className={cn('transition-colors', card.bgColor)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold">{card.value}</div>
              {card.trend !== null && card.trend !== undefined && (
                <div
                  className={cn(
                    'flex items-center text-xs font-medium',
                    card.trend >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {card.trend >= 0 ? (
                    <TrendingUp className={cn('h-3 w-3', isRTL ? 'ms-1' : 'me-1')} />
                  ) : (
                    <TrendingDown className={cn('h-3 w-3', isRTL ? 'ms-1' : 'me-1')} />
                  )}
                  {Math.abs(card.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <p className={cn('text-xs mt-1', card.subtitleColor)}>{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}

      {/* Average Resolution Time Card */}
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('overview.avgResolutionTime')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-2xl font-bold">{avgDuration}</span>
              <span className="text-muted-foreground text-sm ms-2">
                {t('overview.avgResolutionSubtitle')}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">
                  {t('overview.met')}: {data.met_count}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">
                  {t('overview.breachedLabel')}: {data.breached_count}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
