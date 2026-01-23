/**
 * InfluenceReport Component
 * Feature: stakeholder-influence-visualization
 *
 * Displays influence analysis reports for strategic planning.
 * Shows key findings, recommendations, top influencers, and key connectors.
 * Mobile-first, RTL-aware with print-friendly layout.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Download,
  Printer,
  Users,
  TrendingUp,
  GitBranch,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
} from 'lucide-react'
import type {
  InfluenceReport,
  NetworkOverviewStatistics,
} from '@/types/stakeholder-influence.types'
import { NODE_COLORS, REPORT_TYPE_LABELS } from '@/types/stakeholder-influence.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface InfluenceReportProps {
  /** Report data */
  report?: InfluenceReport
  /** Loading state */
  isLoading?: boolean
  /** Handle print */
  onPrint?: () => void
  /** Handle export */
  onExport?: () => void
  /** Additional class name */
  className?: string
}

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: typeof Users
  color?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 sm:p-4">
      <div
        className="rounded-lg p-2 sm:p-2.5"
        style={{ backgroundColor: color ? `${color}20` : 'var(--muted)' }}
      >
        <Icon className="size-4 sm:size-5" style={{ color: color || 'currentColor' }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        <p className="text-lg font-bold sm:text-xl">{value}</p>
      </div>
    </div>
  )
}

function FindingCard({
  finding,
  type = 'info',
}: {
  finding: { en: string; ar: string }
  type?: 'info' | 'warning' | 'success'
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const icons = {
    info: AlertCircle,
    warning: AlertCircle,
    success: CheckCircle,
  }
  const colors = {
    info: 'text-blue-600',
    warning: 'text-amber-600',
    success: 'text-green-600',
  }

  const Icon = icons[type]
  const text = isRTL ? finding.ar : finding.en

  return (
    <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', colors[type])} />
      <p className="text-sm">{text}</p>
    </div>
  )
}

function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation: { en: string; ar: string }
  index: number
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const text = isRTL ? recommendation.ar : recommendation.en

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
        {index + 1}
      </div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function InfluencerRow({
  name,
  type,
  score,
  tier,
}: {
  name: string
  type: string
  score: number
  tier: string
}) {
  const tierColor = NODE_COLORS[tier as keyof typeof NODE_COLORS] || NODE_COLORS.peripheral

  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: tierColor }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs capitalize text-muted-foreground">{type}</p>
        </div>
      </div>
      <Badge variant="secondary" className="ms-2 shrink-0">
        {score}
      </Badge>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function InfluenceReportView({
  report,
  isLoading = false,
  onPrint,
  onExport,
  className,
}: InfluenceReportProps) {
  const { t, i18n } = useTranslation('stakeholder-influence')
  const isRTL = i18n.language === 'ar'

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  // No data state
  if (!report) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto mb-3 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('no_report', 'No report data available')}</p>
        </CardContent>
      </Card>
    )
  }

  const title = isRTL ? report.title_ar : report.title_en
  const description = isRTL ? report.description_ar : report.description_en
  const reportTypeLabel = isRTL
    ? REPORT_TYPE_LABELS[report.report_type].ar
    : REPORT_TYPE_LABELS[report.report_type].en

  const stats = report.report_data.network_statistics
  const topInfluencers = report.report_data.top_influencers || []
  const keyConnectors = report.report_data.key_connectors || []

  return (
    <div className={cn('space-y-6 print:space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Report Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" />
            <Badge variant="outline">{reportTypeLabel}</Badge>
            <Badge variant={report.status === 'final' ? 'default' : 'secondary'}>
              {report.status}
            </Badge>
          </div>
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            {new Date(report.generated_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
              dateStyle: 'medium',
            })}
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="me-2 size-4" />
              {t('print', 'Print')}
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="me-2 size-4" />
              {t('export', 'Export')}
            </Button>
          )}
        </div>
      </div>

      {/* Network Statistics */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="size-5" />
          {t('network_statistics', 'Network Statistics')}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('total_stakeholders', 'Total Stakeholders')}
            value={stats.total_stakeholders}
            icon={Users}
            color="#3b82f6"
          />
          <StatCard
            label={t('total_relationships', 'Relationships')}
            value={stats.total_relationships}
            icon={GitBranch}
            color="#8b5cf6"
          />
          <StatCard
            label={t('key_influencers', 'Key Influencers')}
            value={stats.key_influencers}
            icon={TrendingUp}
            color="#9333ea"
          />
          <StatCard
            label={t('avg_influence', 'Avg Influence')}
            value={stats.avg_influence_score.toFixed(1)}
            icon={BarChart3}
            color="#22c55e"
          />
        </div>
      </section>

      {/* Key Findings */}
      {report.key_findings?.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="size-5" />
            {t('key_findings', 'Key Findings')}
          </h2>
          <div className="space-y-3">
            {report.key_findings.map((finding, index) => (
              <FindingCard key={index} finding={finding} type={index === 0 ? 'success' : 'info'} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle className="size-5" />
            {t('recommendations', 'Recommendations')}
          </h2>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} index={index} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Influencers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              {t('top_influencers', 'Top Influencers')}
            </CardTitle>
            <CardDescription>
              {t('top_influencers_desc', 'Stakeholders with highest influence scores')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topInfluencers.length > 0 ? (
              <div className="space-y-1">
                {topInfluencers.slice(0, 10).map((influencer, index) => (
                  <InfluencerRow
                    key={influencer.dossier_id || index}
                    name={isRTL ? influencer.name_ar : influencer.name_en}
                    type={influencer.dossier_type}
                    score={influencer.influence_score}
                    tier={influencer.influence_tier}
                  />
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('no_influencers', 'No influencers identified')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Key Connectors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4" />
              {t('key_connectors', 'Key Connectors')}
            </CardTitle>
            <CardDescription>
              {t('key_connectors_desc', 'Bridge stakeholders connecting different groups')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keyConnectors.length > 0 ? (
              <div className="space-y-1">
                {keyConnectors.slice(0, 10).map((connector, index) => (
                  <div
                    key={connector.dossier_id || index}
                    className="flex items-center justify-between border-b py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {isRTL ? connector.name_ar : connector.name_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connector.groups_connected} {t('groups_connected', 'groups connected')}
                      </p>
                    </div>
                    <Badge variant="outline" className="ms-2 shrink-0">
                      {connector.bridge_score}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('no_connectors', 'No bridge stakeholders identified')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Period */}
      {(report.period_start || report.period_end) && (
        <div className="text-end text-sm text-muted-foreground">
          {t('analysis_period', 'Analysis Period')}:{' '}
          {report.period_start &&
            new Date(report.period_start).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
          {report.period_start && report.period_end && ' - '}
          {report.period_end &&
            new Date(report.period_end).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
        </div>
      )}
    </div>
  )
}

export default InfluenceReportView
