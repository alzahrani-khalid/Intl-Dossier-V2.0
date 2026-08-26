/**
 * InfluenceMetricsPanel Component
 * Feature: stakeholder-influence-visualization
 *
 * Displays detailed influence metrics for a stakeholder including
 * centrality scores, engagement metrics, and network position.
 * Mobile-first, RTL-aware with visual indicators.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Share2,
  GitBranch,
  Shield,
  CircleDot,
  TrendingUp,
  Users,
  Activity,
  Heart,
  Target,
  Zap,
} from 'lucide-react'
import type {
  StakeholderInfluenceDetail,
  StakeholderRole,
} from '@/types/stakeholder-influence.types'
import {
  NODE_COLORS,
  INFLUENCE_TIER_LABELS,
  STAKEHOLDER_ROLE_LABELS,
  METRIC_LABELS,
} from '@/types/stakeholder-influence.types'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'
import { formatDayFirst } from '@/lib/format-date'

// ============================================================================
// Types
// ============================================================================

interface InfluenceMetricsPanelProps {
  /** Stakeholder influence detail data */
  data?: StakeholderInfluenceDetail
  /** Loading state */
  isLoading?: boolean
  /** Compact mode for sidebars */
  compact?: boolean
  /** Additional class name */
  className?: string
}

// ============================================================================
// Role Icons
// ============================================================================

const ROLE_ICONS: Record<StakeholderRole, typeof Share2> = {
  hub: Share2,
  bridge: GitBranch,
  gatekeeper: Shield,
  peripheral: CircleDot,
  isolate: CircleDot,
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricBar({
  label,
  value,
  maxValue = 100,
  color,
}: {
  label: string
  value: number
  maxValue?: number
  color?: string
}) {
  const percentage = (value / maxValue) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        style={color ? ({ '--progress-background': color } as React.CSSProperties) : undefined}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: typeof Activity
  label: string
  value: number | string
  sublabel?: string
  color?: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div
        className="p-2 rounded-lg"
        style={{
          backgroundColor: color
            ? `color-mix(in srgb, ${color} 12.5%, transparent)`
            : 'var(--muted)',
        }}
      >
        <Icon className="h-4 w-4" style={{ color: color || 'currentColor' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold truncate">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function InfluenceMetricsPanel({
  data,
  isLoading = false,
  compact = false,
  className,
}: InfluenceMetricsPanelProps) {
  const { t } = useTranslation('stakeholder-influence')
  const { isRTL } = useDirection()
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!data) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t('no_data')}</p>
        </CardContent>
      </Card>
    )
  }

  const name = isRTL ? data.name_ar : data.name_en
  const tierLabel = isRTL
    ? INFLUENCE_TIER_LABELS[data.influence_tier].ar
    : INFLUENCE_TIER_LABELS[data.influence_tier].en
  const roleLabel = isRTL
    ? STAKEHOLDER_ROLE_LABELS[data.stakeholder_role].ar
    : STAKEHOLDER_ROLE_LABELS[data.stakeholder_role].en
  const clusterName = isRTL ? data.cluster.name_ar : data.cluster.name_en

  const tierColor = NODE_COLORS[data.influence_tier]
  const RoleIcon = ROLE_ICONS[data.stakeholder_role]

  return (
    <Card className={cn('', className)}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl truncate">{name}</CardTitle>
            <CardDescription className="capitalize">{data.dossier_type}</CardDescription>
          </div>
          <div
            className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-lg sm:text-xl text-white flex-shrink-0"
            style={{ backgroundColor: tierColor }}
          >
            {data.influence_score}
          </div>
        </div>

        {/* Tier and Role badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge
            variant="secondary"
            className="gap-1"
            style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
          >
            <TrendingUp className="h-3 w-3" />
            {tierLabel}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <RoleIcon className="h-3 w-3" />
            {roleLabel}
          </Badge>
          {data.cluster.id && (
            <Badge variant="outline">
              <Users className="h-3 w-3 me-1" />
              {clusterName}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Network Position Metrics */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('network_position')}
          </h4>
          <div className="space-y-3">
            <MetricBar
              label={
                isRTL ? METRIC_LABELS.degree_centrality.ar : METRIC_LABELS.degree_centrality.en
              }
              value={data.metrics.degree_centrality}
              color={tierColor}
            />
            <MetricBar
              label={
                isRTL
                  ? METRIC_LABELS.betweenness_centrality.ar
                  : METRIC_LABELS.betweenness_centrality.en
              }
              value={data.metrics.betweenness_centrality}
              color="var(--accent-ink)"
            />
            {!compact && (
              <>
                <MetricBar
                  label={
                    isRTL
                      ? METRIC_LABELS.closeness_centrality.ar
                      : METRIC_LABELS.closeness_centrality.en
                  }
                  value={data.metrics.closeness_centrality}
                  color="var(--chart-7)"
                />
                <MetricBar
                  label={
                    isRTL
                      ? METRIC_LABELS.eigenvector_centrality.ar
                      : METRIC_LABELS.eigenvector_centrality.en
                  }
                  value={data.metrics.eigenvector_centrality}
                  color="var(--chart-6)"
                />
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Engagement Metrics */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('engagement')}
          </h4>
          <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
            <MetricCard
              icon={Zap}
              label={
                isRTL
                  ? METRIC_LABELS.engagement_frequency.ar
                  : METRIC_LABELS.engagement_frequency.en
              }
              value={data.metrics.engagement_frequency}
              sublabel={`/ 100`}
              color="var(--chart-4)"
            />
            <MetricCard
              icon={Users}
              label={isRTL ? METRIC_LABELS.engagement_reach.ar : METRIC_LABELS.engagement_reach.en}
              value={data.metrics.engagement_reach}
              sublabel={`${data.raw_metrics.unique_engagement_partners} ${t('partners')}`}
              color="var(--chart-1)"
            />
          </div>
        </div>

        <Separator />

        {/* Relationship Health */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {t('relationships')}
          </h4>
          <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
            <MetricCard
              icon={Heart}
              label={
                isRTL
                  ? METRIC_LABELS.avg_relationship_health.ar
                  : METRIC_LABELS.avg_relationship_health.en
              }
              value={data.metrics.avg_relationship_health}
              sublabel={`/ 100`}
              color="var(--ok)"
            />
            <div className="flex flex-col gap-2">
              <MetricCard
                icon={TrendingUp}
                label={
                  isRTL
                    ? METRIC_LABELS.strong_relationships.ar
                    : METRIC_LABELS.strong_relationships.en
                }
                value={data.metrics.strong_relationships}
                color="var(--ok)"
              />
              {!compact && (
                <MetricCard
                  icon={CircleDot}
                  label={
                    isRTL
                      ? METRIC_LABELS.weak_relationships.ar
                      : METRIC_LABELS.weak_relationships.en
                  }
                  value={data.metrics.weak_relationships}
                  color="var(--danger)"
                />
              )}
            </div>
          </div>
        </div>

        {/* Raw Metrics (Expanded View) */}
        {!compact && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">{t('raw_metrics')}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('direct_connections')}</span>
                  <span className="font-medium">{data.raw_metrics.direct_connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('two_hop')}</span>
                  <span className="font-medium">{data.raw_metrics.two_hop_connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('total_engagements')}</span>
                  <span className="font-medium">{data.raw_metrics.total_engagements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('unique_partners')}</span>
                  <span className="font-medium">{data.raw_metrics.unique_engagement_partners}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Calculated timestamp */}
        <p className="text-xs text-muted-foreground text-end">
          {t('calculated_at')}: {formatDayFirst(data.calculated_at)}
        </p>
      </CardContent>
    </Card>
  )
}
