/**
 * RelationshipHealthCard Component
 * Feature: relationship-health-scoring
 *
 * Displays relationship health score with visual indicators,
 * component breakdown, and trend information.
 *
 * Mobile-first, RTL-compatible design following project conventions.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  CheckCircle2,
  Users,
  Star,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RelationshipHealthScore,
  RelationshipHealthSummary,
  HealthLevel,
  HealthTrend,
  HealthScoreComponents,
} from '@/types/relationship-health.types'
import {
  getHealthLevelColor,
  getHealthLevelBgColor,
  getTrendColor,
  HEALTH_LEVEL_LABELS,
  TREND_LABELS,
  COMPONENT_LABELS,
} from '@/types/relationship-health.types'

// ============================================================================
// Component Props
// ============================================================================

interface RelationshipHealthCardProps {
  /** Health score data (full or summary) */
  health: RelationshipHealthScore | RelationshipHealthSummary
  /** Show detailed breakdown */
  showDetails?: boolean
  /** Compact mode for lists */
  compact?: boolean
  /** Click handler */
  onClick?: () => void
  /** Loading state */
  isLoading?: boolean
  /** Additional class names */
  className?: string
}

interface ScoreCircleProps {
  score: number | null
  level: HealthLevel
  size?: 'sm' | 'md' | 'lg'
}

interface ComponentBarProps {
  label: string
  score: number
  maxScore?: number
}

// ============================================================================
// Sub-components
// ============================================================================

function ScoreCircle({ score, level, size = 'md' }: ScoreCircleProps) {
  const sizeClasses = {
    sm: 'h-12 w-12 text-lg',
    md: 'h-16 w-16 sm:h-20 sm:w-20 text-xl sm:text-2xl',
    lg: 'h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl',
  }

  const borderColors: Record<HealthLevel, string> = {
    excellent: 'border-green-500',
    good: 'border-emerald-500',
    fair: 'border-yellow-500',
    poor: 'border-orange-500',
    critical: 'border-red-500',
    unknown: 'border-gray-400',
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full border-4 font-bold',
        sizeClasses[size],
        borderColors[level],
        getHealthLevelBgColor(level),
      )}
    >
      <span className={getHealthLevelColor(level)}>{score !== null ? score : '—'}</span>
    </div>
  )
}

function TrendIndicator({ trend }: { trend: HealthTrend }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const Icon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus

  return (
    <div className={cn('flex items-center gap-1', getTrendColor(trend))}>
      <Icon className={cn('h-4 w-4', isRTL && trend !== 'stable' && 'rotate-180')} />
      <span className="text-xs sm:text-sm font-medium">
        {TREND_LABELS[trend][i18n.language === 'ar' ? 'ar' : 'en']}
      </span>
    </div>
  )
}

function ComponentBar({ label, score, maxScore = 100 }: ComponentBarProps) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <Progress value={percentage} className="h-1.5 sm:h-2" />
    </div>
  )
}

function ComponentIcon({ component }: { component: keyof HealthScoreComponents }) {
  const icons: Record<keyof HealthScoreComponents, React.ComponentType<{ className?: string }>> = {
    engagement_frequency: Activity,
    commitment_compliance: CheckCircle2,
    reciprocity: Users,
    interaction_quality: Star,
    recency: Clock,
  }

  const Icon = icons[component]
  return <Icon className="h-4 w-4 text-muted-foreground" />
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function RelationshipHealthCardSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RelationshipHealthCard({
  health,
  showDetails = false,
  compact = false,
  onClick,
  isLoading = false,
  className,
}: RelationshipHealthCardProps) {
  const { t, i18n } = useTranslation('relationship-health')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return <RelationshipHealthCardSkeleton compact={compact} />
  }

  const sourceName = isRTL
    ? health.source_dossier.name_ar || health.source_dossier.name_en
    : health.source_dossier.name_en
  const targetName = isRTL
    ? health.target_dossier.name_ar || health.target_dossier.name_en
    : health.target_dossier.name_en

  // Compact mode for lists
  if (compact) {
    return (
      <Card
        className={cn('p-3 sm:p-4 transition-colors cursor-pointer hover:bg-accent/50', className)}
        onClick={onClick}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <ScoreCircle score={health.overall_score} level={health.health_level} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm sm:text-base truncate">{sourceName}</span>
              <ChevronRight
                className={cn('h-4 w-4 text-muted-foreground flex-shrink-0', isRTL && 'rotate-180')}
              />
              <span className="font-medium text-sm sm:text-base truncate">{targetName}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn('text-xs', getHealthLevelColor(health.health_level))}
              >
                {HEALTH_LEVEL_LABELS[health.health_level][isRTL ? 'ar' : 'en']}
              </Badge>
              <TrendIndicator trend={health.trend} />
            </div>
          </div>
          {onClick && (
            <ChevronRight
              className={cn('h-5 w-5 text-muted-foreground flex-shrink-0', isRTL && 'rotate-180')}
            />
          )}
        </div>
      </Card>
    )
  }

  // Full card mode
  return (
    <Card
      className={cn(onClick && 'cursor-pointer hover:bg-accent/50 transition-colors', className)}
      onClick={onClick}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <ScoreCircle score={health.overall_score} level={health.health_level} size="md" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate">{sourceName}</span>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-muted-foreground flex-shrink-0',
                    isRTL && 'rotate-180',
                  )}
                />
                <span className="truncate">{targetName}</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn(getHealthLevelColor(health.health_level))}>
                {HEALTH_LEVEL_LABELS[health.health_level][isRTL ? 'ar' : 'en']}
              </Badge>
              <TrendIndicator trend={health.trend} />
              {'previous_score' in health &&
                health.previous_score !== null &&
                health.overall_score !== null &&
                health.previous_score !== health.overall_score && (
                  <span className="text-xs text-muted-foreground">
                    ({health.previous_score} → {health.overall_score})
                  </span>
                )}
            </div>

            {/* Quick stats for summary view */}
            {'overdue_commitments' in health && health.overdue_commitments > 0 && (
              <div className="flex items-center gap-1 mt-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs sm:text-sm">
                  {t('alerts.overdueCommitments', { count: health.overdue_commitments })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            {/* Component scores */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-start">{t('components.title')}</h4>
              <div className="space-y-3">
                {(Object.entries(health.components) as [keyof HealthScoreComponents, number][]).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <ComponentIcon component={key} />
                      <div className="flex-1">
                        <ComponentBar
                          label={COMPONENT_LABELS[key][isRTL ? 'ar' : 'en']}
                          score={value}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Detailed breakdown (only for full health score) */}
            {'breakdown' in health && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 text-start">{t('breakdown.title')}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground text-start">
                    {t('breakdown.engagements365d')}
                  </div>
                  <div className="font-medium text-end">{health.breakdown.engagements_365d}</div>

                  <div className="text-muted-foreground text-start">
                    {t('breakdown.engagements90d')}
                  </div>
                  <div className="font-medium text-end">{health.breakdown.engagements_90d}</div>

                  <div className="text-muted-foreground text-start">
                    {t('breakdown.daysSinceEngagement')}
                  </div>
                  <div className="font-medium text-end">
                    {health.breakdown.days_since_engagement}
                  </div>

                  <div className="text-muted-foreground text-start">
                    {t('breakdown.commitments')}
                  </div>
                  <div className="font-medium text-end">
                    {health.breakdown.commitments_completed} / {health.breakdown.commitments_total}
                  </div>

                  {health.breakdown.commitments_overdue > 0 && (
                    <>
                      <div className="text-orange-600 dark:text-orange-400 text-start">
                        {t('breakdown.overdue')}
                      </div>
                      <div className="font-medium text-orange-600 dark:text-orange-400 text-end">
                        {health.breakdown.commitments_overdue}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// Exports
// ============================================================================

export { ScoreCircle, TrendIndicator, ComponentBar, RelationshipHealthCardSkeleton }
