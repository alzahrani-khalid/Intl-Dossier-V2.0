/**
 * RecommendationsPanel Component
 * Feature: predictive-engagement-recommendations
 *
 * A sidebar/dashboard panel showing recommendation stats and high-priority items.
 * Mobile-first, RTL-compatible design.
 */

import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { RecommendationCard } from './RecommendationCard'
import {
  useRecommendationStats,
  useHighPriorityRecommendations,
  useAcceptRecommendation,
  useDismissRecommendation,
  useGenerateRecommendations,
} from '@/hooks/useEngagementRecommendations'
import {
  getUrgencyColor,
  formatConfidence,
  RECOMMENDATION_TYPE_LABELS,
} from '@/types/engagement-recommendation.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface RecommendationsPanelProps {
  onViewAll?: () => void
  onViewDetails?: (id: string) => void
  maxItems?: number
  showStats?: boolean
  className?: string
}

// ============================================================================
// Stat Card Sub-Component
// ============================================================================

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  className?: string
}

function StatCard({ title, value, icon, trend, description, className }: StatCardProps) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-3', className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-lg font-bold">{value}</p>
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
          {trend === 'down' && <TrendingUp className="h-3.5 w-3.5 text-red-500 rotate-180" />}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// Type Distribution Chart
// ============================================================================

interface TypeDistributionProps {
  data: Record<string, number>
}

function TypeDistribution({ data }: TypeDistributionProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const total = Object.values(data).reduce((sum, count) => sum + count, 0)
  if (total === 0) return null

  const sortedTypes = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  const colors = [
    'bg-blue-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
  ]

  return (
    <div className="space-y-2">
      {sortedTypes.map(([type, count], index) => {
        const percentage = Math.round((count / total) * 100)
        const label = RECOMMENDATION_TYPE_LABELS[type as keyof typeof RECOMMENDATION_TYPE_LABELS]

        return (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{isRTL ? label?.ar || type : label?.en || type}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn('h-full rounded-full', colors[index % colors.length])}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RecommendationsPanel({
  onViewAll,
  onViewDetails,
  maxItems = 3,
  showStats = true,
  className,
}: RecommendationsPanelProps) {
  const { t, i18n } = useTranslation('engagement-recommendations')
  const isRTL = i18n.language === 'ar'

  // Queries
  const statsQuery = useRecommendationStats()
  const recommendationsQuery = useHighPriorityRecommendations(maxItems)
  const generateMutation = useGenerateRecommendations()
  const acceptMutation = useAcceptRecommendation()
  const dismissMutation = useDismissRecommendation()

  const stats = statsQuery.data
  const recommendations = recommendationsQuery.data?.data || []
  const isLoading = statsQuery.isLoading || recommendationsQuery.isLoading

  const handleAccept = (id: string) => {
    acceptMutation.mutate(id)
  }

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id)
  }

  const handleGenerate = () => {
    generateMutation.mutate({})
  }

  const handleRefresh = () => {
    statsQuery.refetch()
    recommendationsQuery.refetch()
  }

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base sm:text-lg">{t('panelTitle')}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        {showStats && (
          <div className="grid grid-cols-2 gap-2">
            {isLoading ? (
              <>
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </>
            ) : (
              <>
                <StatCard
                  title={t('pendingRecommendations')}
                  value={stats?.total_pending || 0}
                  icon={<Clock className="h-5 w-5 text-amber-500" />}
                />
                <StatCard
                  title={t('criticalUrgency')}
                  value={stats?.critical_urgency_count || 0}
                  icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                  className={
                    stats?.critical_urgency_count ? 'border-red-200 dark:border-red-900' : ''
                  }
                />
                <StatCard
                  title={t('acceptanceRate')}
                  value={`${Math.round(stats?.acceptance_rate || 0)}%`}
                  icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                />
                <StatCard
                  title={t('avgConfidence')}
                  value={formatConfidence(stats?.average_confidence || 0)}
                  icon={<Sparkles className="h-5 w-5 text-purple-500" />}
                />
              </>
            )}
          </div>
        )}

        {/* Type Distribution */}
        {showStats && stats?.by_type && Object.keys(stats.by_type).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('byType')}</h4>
            <TypeDistribution data={stats.by_type} />
          </div>
        )}

        {/* High Priority Recommendations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t('highPriority')}</h4>
            {stats?.high_priority_count ? (
              <Badge variant="secondary" className="text-xs">
                {stats.high_priority_count}
              </Badge>
            ) : null}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">{t('noHighPriority')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  variant="compact"
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                  onView={onViewDetails}
                  isLoading={acceptMutation.isPending || dismissMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        {onViewAll && (
          <Button variant="outline" className="w-full min-h-11 gap-1.5" onClick={onViewAll}>
            <span>{t('viewAll')}</span>
            <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default RecommendationsPanel
