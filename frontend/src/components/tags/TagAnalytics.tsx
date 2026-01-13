/**
 * TagAnalytics Component
 *
 * Displays tag usage analytics including:
 * - Total tags and assignments overview
 * - Usage breakdown by entity type
 * - Most used and unused tags
 * - Tag hierarchy distribution
 *
 * @mobile-first - Designed for 320px+ with responsive breakpoints
 * @rtl-ready - Uses logical properties for Arabic support
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Tag,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle,
  Activity,
  Layers,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTagAnalytics, useRefreshTagAnalytics } from '@/hooks/useTagHierarchy'
import { getTagName, TAG_ENTITY_TYPE_LABELS } from '@/types/tag-hierarchy.types'
import type { TagUsageAnalytics } from '@/types/tag-hierarchy.types'

interface TagAnalyticsProps {
  className?: string
}

export function TagAnalytics({ className }: TagAnalyticsProps) {
  const { t, i18n } = useTranslation('tags')
  const isRTL = i18n.language === 'ar'

  const { data: analytics, isLoading, error, refetch } = useTagAnalytics()
  const refreshAnalytics = useRefreshTagAnalytics()

  // Computed stats
  const stats = useMemo(() => {
    if (!analytics?.data) return null

    const tags = analytics.data
    const totalTags = tags.length
    const activeTags = tags.filter((t) => t.is_active).length
    const totalAssignments = tags.reduce((sum, t) => sum + t.total_assignments, 0)
    const autoAssigned = tags.reduce((sum, t) => sum + t.auto_assigned_count, 0)
    const avgConfidence =
      tags.reduce((sum, t) => sum + (t.avg_confidence || 0), 0) / Math.max(tags.length, 1)

    // Entity type breakdown
    const entityBreakdown = {
      dossier: tags.reduce((sum, t) => sum + t.dossier_count, 0),
      document: tags.reduce((sum, t) => sum + t.document_count, 0),
      brief: tags.reduce((sum, t) => sum + t.brief_count, 0),
      engagement: tags.reduce((sum, t) => sum + t.engagement_count, 0),
    }

    // Top tags by usage
    const topTags = [...tags]
      .filter((t) => t.total_assignments > 0)
      .sort((a, b) => b.total_assignments - a.total_assignments)
      .slice(0, 10)

    // Unused tags
    const unusedTags = tags.filter((t) => t.total_assignments === 0 && t.is_active)

    // Hierarchy distribution
    const hierarchyDistribution = tags.reduce(
      (acc, t) => {
        const level = t.hierarchy_level
        acc[level] = (acc[level] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    return {
      totalTags,
      activeTags,
      totalAssignments,
      autoAssigned,
      avgConfidence,
      entityBreakdown,
      topTags,
      unusedTags,
      hierarchyDistribution,
    }
  }, [analytics])

  const handleRefresh = async () => {
    try {
      await refreshAnalytics.mutateAsync()
      await refetch()
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !stats) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <AlertCircle className="size-12 text-destructive mb-4" />
        <p className="text-muted-foreground">{t('errors.loadFailed')}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="size-4 me-2" />
          {t('actions.refresh')}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{t('analytics.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('analytics.overview')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshAnalytics.isPending}
        >
          <RefreshCw className={cn('size-4 me-2', refreshAnalytics.isPending && 'animate-spin')} />
          {t('actions.refresh')}
        </Button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Tag}
          label={t('analytics.totalTags')}
          value={stats.totalTags}
          subValue={`${stats.activeTags} ${t('filters.active')}`}
        />
        <StatCard
          icon={Activity}
          label={t('analytics.totalAssignments')}
          value={stats.totalAssignments}
        />
        <StatCard
          icon={Zap}
          label={t('analytics.autoAssigned')}
          value={stats.autoAssigned}
          subValue={`${((stats.autoAssigned / Math.max(stats.totalAssignments, 1)) * 100).toFixed(0)}%`}
        />
        <StatCard
          icon={TrendingUp}
          label={t('analytics.avgConfidence')}
          value={`${(stats.avgConfidence * 100).toFixed(0)}%`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entity breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="size-4" />
              {t('analytics.usageByEntity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.entityBreakdown).map(([entityType, count]) => {
                const total = Object.values(stats.entityBreakdown).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0

                return (
                  <div key={entityType} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {TAG_ENTITY_TYPE_LABELS[
                          entityType as keyof typeof TAG_ENTITY_TYPE_LABELS
                        ]?.[isRTL ? 'ar' : 'en'] ||
                          t(`analytics.entityBreakdown.${entityType}`) ||
                          entityType}
                      </span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Hierarchy distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="size-4" />
              {t('hierarchy.title')}
            </CardTitle>
            <CardDescription>
              {t('hierarchy.level', { level: Object.keys(stats.hierarchyDistribution).length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.hierarchyDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, count]) => {
                  const total = Object.values(stats.hierarchyDistribution).reduce(
                    (a, b) => a + b,
                    0,
                  )
                  const percentage = total > 0 ? (count / total) * 100 : 0

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {Number(level) === 0
                            ? t('hierarchy.root')
                            : t('hierarchy.level', { level })}
                        </span>
                        <span className="text-muted-foreground">{count} tags</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top and unused tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4" />
              {t('analytics.topTags')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {stats.topTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('assignment.noAssigned')}
                  </p>
                ) : (
                  stats.topTags.map((tag, index) => (
                    <div
                      key={tag.tag_id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                      <div
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-sm truncate">{getTagName(tag, isRTL)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tag.total_assignments}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Unused tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="size-4 text-muted-foreground" />
              {t('analytics.unusedTags')}
            </CardTitle>
            <CardDescription>
              {stats.unusedTags.length} {t('filters.unused').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="flex flex-wrap gap-2">
                {stats.unusedTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 w-full">
                    {t('assignment.noAvailable')}
                  </p>
                ) : (
                  stats.unusedTags.map((tag) => (
                    <Badge
                      key={tag.tag_id}
                      variant="outline"
                      className="gap-1"
                      style={{
                        borderColor: `${tag.color}60`,
                      }}
                    >
                      <div className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {getTagName(tag, isRTL)}
                    </Badge>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for stat cards
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  subValue?: string
}

function StatCard({ icon: Icon, label, value, subValue }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Icon className="size-4" />
          <span className="text-xs sm:text-sm truncate">{label}</span>
        </div>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </CardContent>
    </Card>
  )
}

export default TagAnalytics
