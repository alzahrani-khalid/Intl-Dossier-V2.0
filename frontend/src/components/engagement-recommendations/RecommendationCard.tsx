/**
 * RecommendationCard Component
 * Feature: predictive-engagement-recommendations
 *
 * Displays a single engagement recommendation with actions.
 * Mobile-first, RTL-compatible design.
 */

import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Send,
  Reply,
  Clock,
  RefreshCw,
  Target,
  AlertTriangle,
  Scale,
  Calendar,
  CheckCircle,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  EngagementRecommendationListItem,
  EngagementRecommendationSummary,
  RecommendationType,
  RecommendationUrgency,
} from '@/types/engagement-recommendation.types'
import {
  getUrgencyColor,
  getUrgencyBgColor,
  getRecommendationTypeBgColor,
  getStatusColor,
  formatConfidence,
  isExpiringSoon,
  RECOMMENDATION_TYPE_LABELS,
  URGENCY_LABELS,
  STATUS_LABELS,
} from '@/types/engagement-recommendation.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface RecommendationCardProps {
  recommendation: EngagementRecommendationListItem | EngagementRecommendationSummary
  onAccept?: (id: string) => void
  onDismiss?: (id: string) => void
  onView?: (id: string) => void
  isLoading?: boolean
  variant?: 'default' | 'compact' | 'expanded'
  className?: string
}

// ============================================================================
// Icon Mapping
// ============================================================================

const typeIcons: Record<RecommendationType, React.ComponentType<{ className?: string }>> = {
  proactive_outreach: Send,
  follow_up: Reply,
  commitment_reminder: Clock,
  relationship_maintenance: RefreshCw,
  strategic_opportunity: Target,
  risk_mitigation: AlertTriangle,
  reciprocity_balance: Scale,
}

// ============================================================================
// Sub-Components
// ============================================================================

function UrgencyBadge({ urgency }: { urgency: RecommendationUrgency }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const label = URGENCY_LABELS[urgency]

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium',
        getUrgencyBgColor(urgency),
        getUrgencyColor(urgency),
        'border-0',
      )}
    >
      {isRTL ? label.ar : label.en}
    </Badge>
  )
}

function TypeBadge({ type }: { type: RecommendationType }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const label = RECOMMENDATION_TYPE_LABELS[type]
  const Icon = typeIcons[type]

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium gap-1', getRecommendationTypeBgColor(type), 'border-0')}
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{isRTL ? label.ar : label.en}</span>
    </Badge>
  )
}

function HealthTrendIndicator({ trend, score }: { trend?: string; score?: number }) {
  const { t, i18n } = useTranslation('engagement-recommendations')
  const isRTL = i18n.language === 'ar'

  if (!trend && score === undefined) return null

  const TrendIcon =
    trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  const trendColor =
    trend === 'improving'
      ? 'text-green-600 dark:text-green-400'
      : trend === 'declining'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500'

  return (
    <div className="flex items-center gap-2">
      {score !== undefined && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{t('healthScore')}</span>
          <span className="text-sm font-medium">{score}</span>
        </div>
      )}
      {trend && <TrendIcon className={cn('h-4 w-4', trendColor, isRTL && 'rotate-180')} />}
    </div>
  )
}

function ConfidenceIndicator({ score }: { score: number }) {
  const { t } = useTranslation('engagement-recommendations')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium">{formatConfidence(score)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('confidenceTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function OptimalTimingBadge({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const { t, i18n } = useTranslation('engagement-recommendations')
  const isRTL = i18n.language === 'ar'

  if (!startDate && !endDate) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Calendar className="h-3.5 w-3.5" />
      <span>
        {startDate && endDate
          ? `${formatDate(startDate)} - ${formatDate(endDate)}`
          : startDate
            ? formatDate(startDate)
            : formatDate(endDate!)}
      </span>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  onView,
  isLoading = false,
  variant = 'default',
  className,
}: RecommendationCardProps) {
  const { t, i18n } = useTranslation('engagement-recommendations')
  const isRTL = i18n.language === 'ar'

  const title = isRTL ? recommendation.title_ar : recommendation.title_en
  const targetName =
    'target_dossier_name_en' in recommendation
      ? isRTL
        ? recommendation.target_dossier_name_ar
        : recommendation.target_dossier_name_en
      : undefined
  const healthScore =
    'relationship_health_score' in recommendation
      ? recommendation.relationship_health_score
      : undefined
  const healthTrend =
    'relationship_health_trend' in recommendation
      ? recommendation.relationship_health_trend
      : undefined

  const isActionable = recommendation.status === 'pending' || recommendation.status === 'viewed'
  const expiringSoon = isExpiringSoon(recommendation as any)
  const Icon = typeIcons[recommendation.recommendation_type]

  const handleAccept = () => {
    if (onAccept) {
      onAccept(recommendation.id)
    }
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(recommendation.id)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(recommendation.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'hover:shadow-md',
          recommendation.urgency === 'critical' && 'border-red-300 dark:border-red-800',
          recommendation.urgency === 'high' && 'border-orange-300 dark:border-orange-800',
          !isActionable && 'opacity-70',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Priority Indicator Strip */}
        <div
          className={cn(
            'absolute top-0 start-0 h-full w-1',
            recommendation.priority >= 5 && 'bg-red-500',
            recommendation.priority === 4 && 'bg-orange-500',
            recommendation.priority === 3 && 'bg-yellow-500',
            recommendation.priority === 2 && 'bg-blue-500',
            recommendation.priority === 1 && 'bg-gray-400',
          )}
        />

        <CardHeader className="pb-2 ps-5 sm:ps-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: Icon and Title */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  getRecommendationTypeBgColor(recommendation.recommendation_type),
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-tight line-clamp-2 sm:text-base">
                  {title}
                </h3>
                {targetName && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{targetName}</p>
                )}
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
              <TypeBadge type={recommendation.recommendation_type} />
              <UrgencyBadge urgency={recommendation.urgency} />
              {expiringSoon && (
                <Badge variant="destructive" className="text-xs">
                  {t('expiringSoon')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="ps-5 sm:ps-6">
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <ConfidenceIndicator score={recommendation.confidence_score} />
            <OptimalTimingBadge
              startDate={recommendation.optimal_date_start}
              endDate={recommendation.optimal_date_end}
            />
            <HealthTrendIndicator trend={healthTrend} score={healthScore} />
          </div>

          {/* Expanded content for expanded variant */}
          {variant === 'expanded' && 'description_en' in recommendation && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
              {isRTL
                ? (recommendation as EngagementRecommendationSummary).description_ar
                : (recommendation as EngagementRecommendationSummary).description_en}
            </p>
          )}

          {/* Actions */}
          {isActionable && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="min-h-11 min-w-11 flex-1 sm:flex-none gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('accept')}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  disabled={isLoading}
                  className="min-h-11 min-w-11 flex-1 sm:flex-none gap-1.5"
                >
                  <X className="h-4 w-4" />
                  <span>{t('dismiss')}</span>
                </Button>
              </div>
              {onView && (
                <Button size="sm" variant="ghost" onClick={handleView} className="min-h-11 gap-1.5">
                  <span>{t('viewDetails')}</span>
                  <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                </Button>
              )}
            </div>
          )}

          {/* Status badge for non-actionable */}
          {!isActionable && (
            <div className="mt-4">
              <Badge className={getStatusColor(recommendation.status)}>
                {isRTL
                  ? STATUS_LABELS[recommendation.status].ar
                  : STATUS_LABELS[recommendation.status].en}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default RecommendationCard
