/**
 * WorkItemsSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays work items (tasks, commitments, intakes) with status breakdown.
 * Mobile-first, RTL-supported.
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  ClipboardList,
  CheckSquare,
  Handshake,
  Inbox,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ChevronRight,
  CheckCircle,
  XCircle,
  Circle,
  Timer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import type {
  WorkItemsSectionProps,
  DossierWorkItem,
  WorkItemSource,
  WorkItemStatus,
  WorkItemPriority,
} from '@/types/dossier-overview.types'

/**
 * Get icon for work item source
 */
function getSourceIcon(source: WorkItemSource) {
  const icons: Record<WorkItemSource, React.ElementType> = {
    task: CheckSquare,
    commitment: Handshake,
    intake: Inbox,
  }
  return icons[source] || CheckSquare
}

/**
 * Get status icon and color
 */
function getStatusConfig(status: WorkItemStatus) {
  const configs: Record<
    WorkItemStatus,
    { icon: React.ElementType; color: string; bgColor: string }
  > = {
    pending: {
      icon: Circle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-900',
    },
    in_progress: {
      icon: Timer,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    review: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    cancelled: {
      icon: XCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900',
    },
    overdue: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  }
  return configs[status] || configs.pending
}

/**
 * Get priority badge variant
 */
function getPriorityVariant(priority: WorkItemPriority) {
  const variants: Record<WorkItemPriority, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    urgent: 'destructive',
  }
  return variants[priority] || 'outline'
}

/**
 * Work item card component
 */
function WorkItemCard({ item, isRTL }: { item: DossierWorkItem; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')
  const SourceIcon = getSourceIcon(item.source)
  const statusConfig = getStatusConfig(item.status)
  const StatusIcon = statusConfig.icon

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${statusConfig.bgColor} shrink-0`}>
            <StatusIcon className={`size-5 ${statusConfig.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h4 className="line-clamp-2 text-sm font-semibold">
                {isRTL && item.title_ar ? item.title_ar : item.title_en}
              </h4>
              <Badge variant={getPriorityVariant(item.priority)} className="shrink-0 text-xs">
                {t(`priority.${item.priority}`)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <SourceIcon className="size-3" />
                {t(`workItemSource.${item.source}`)}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  item.status === 'overdue' ? 'border-red-500 text-red-500' : ''
                }`}
              >
                {t(`workItemStatus.${item.status}`)}
              </Badge>
              {item.inheritance_source !== 'direct' && (
                <Badge variant="secondary" className="text-xs">
                  {t(`inheritanceSource.${item.inheritance_source}`)}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {item.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(item.deadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                </div>
              )}
              {item.assignee_name && (
                <div className="flex items-center gap-1">
                  <User className="size-3" />
                  {item.assignee_name}
                </div>
              )}
            </div>
          </div>
          <ChevronRight
            className={`size-5 shrink-0 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Status breakdown component
 */
function StatusBreakdown({
  breakdown,
  total,
  isRTL,
}: {
  breakdown: Record<WorkItemStatus, number>
  total: number
  isRTL: boolean
}) {
  const { t } = useTranslation('dossier-overview')

  const completedPercent = total > 0 ? Math.round((breakdown.completed / total) * 100) : 0

  const statusItems: { status: WorkItemStatus; count: number }[] = [
    { status: 'pending', count: breakdown.pending },
    { status: 'in_progress', count: breakdown.in_progress },
    { status: 'review', count: breakdown.review },
    { status: 'completed', count: breakdown.completed },
    { status: 'overdue', count: breakdown.overdue },
  ]

  return (
    <div className="space-y-4 rounded-lg bg-muted/50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('workItems.completion')}</span>
        <span className="text-sm text-muted-foreground">{completedPercent}%</span>
      </div>
      <Progress value={completedPercent} className="h-2" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {statusItems.map(({ status, count }) => {
          const config = getStatusConfig(status)
          const Icon = config.icon
          return (
            <div key={status} className="flex items-center gap-2 rounded-md bg-background p-2">
              <Icon className={`size-4 ${config.color}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">
                  {t(`workItemStatus.${status}`)}
                </p>
                <p className="text-sm font-semibold">{count}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ source, isRTL }: { source?: WorkItemSource | 'all'; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="py-6 text-center sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-3 inline-block rounded-full bg-muted p-3">
        <ClipboardList className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {source && source !== 'all' ? t(`workItems.empty.${source}`) : t('workItems.empty.all')}
      </p>
    </div>
  )
}

/**
 * Work item list component
 */
function WorkItemList({
  items,
  isRTL,
  emptySource,
}: {
  items: DossierWorkItem[]
  isRTL: boolean
  emptySource?: WorkItemSource | 'all'
}) {
  if (items.length === 0) {
    return <EmptyState source={emptySource} isRTL={isRTL} />
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <WorkItemCard key={item.id} item={item} isRTL={isRTL} />
      ))}
    </div>
  )
}

/**
 * Main WorkItemsSection component
 */
export function WorkItemsSection({
  data,
  dossierId,
  isLoading,
  isRTL = false,
  className = '',
}: WorkItemsSectionProps) {
  const { t } = useTranslation('dossier-overview')

  // Combine all work items for the "All" tab
  const allWorkItems = useMemo(() => {
    if (!data) return []
    return [...data.by_source.tasks, ...data.by_source.commitments, ...data.by_source.intakes].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
  }, [data])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total_count === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ClipboardList className="size-5" />
            {t('workItems.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          <EmptyState source="all" isRTL={isRTL} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ClipboardList className="size-5" />
          {t('workItems.title')}
          <Badge variant="secondary">{data.total_count}</Badge>
          {data.status_breakdown.overdue > 0 && (
            <Badge variant="destructive">
              {data.status_breakdown.overdue} {t('workItems.overdue')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0 sm:p-6">
        {/* Status Breakdown */}
        <StatusBreakdown breakdown={data.status_breakdown} total={data.total_count} isRTL={isRTL} />

        {/* Urgent Items Alert */}
        {data.urgent_items.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('workItems.urgentItems', { count: data.urgent_items.length })}
              </span>
            </div>
            <div className="space-y-2">
              {data.urgent_items.slice(0, 3).map((item) => (
                <div key={item.id} className="text-sm text-amber-700 dark:text-amber-300">
                  • {isRTL && item.title_ar ? item.title_ar : item.title_en}
                </div>
              ))}
              {data.urgent_items.length > 3 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  +{data.urgent_items.length - 3} {t('workItems.more')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tabs by Source */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 h-auto w-full flex-nowrap justify-start overflow-x-auto p-1">
            <TabsTrigger value="all" className="shrink-0 text-xs sm:text-sm">
              {t('workItems.tabs.all')} ({allWorkItems.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="shrink-0 text-xs sm:text-sm">
              <CheckSquare className="me-1 size-4" />
              {t('workItems.tabs.tasks')} ({data.by_source.tasks.length})
            </TabsTrigger>
            <TabsTrigger value="commitments" className="shrink-0 text-xs sm:text-sm">
              <Handshake className="me-1 size-4" />
              {t('workItems.tabs.commitments')} ({data.by_source.commitments.length})
            </TabsTrigger>
            <TabsTrigger value="intakes" className="shrink-0 text-xs sm:text-sm">
              <Inbox className="me-1 size-4" />
              {t('workItems.tabs.intakes')} ({data.by_source.intakes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <WorkItemList items={allWorkItems} isRTL={isRTL} emptySource="all" />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <WorkItemList items={data.by_source.tasks} isRTL={isRTL} emptySource="task" />
          </TabsContent>

          <TabsContent value="commitments" className="mt-0">
            <WorkItemList
              items={data.by_source.commitments}
              isRTL={isRTL}
              emptySource="commitment"
            />
          </TabsContent>

          <TabsContent value="intakes" className="mt-0">
            <WorkItemList items={data.by_source.intakes} isRTL={isRTL} emptySource="intake" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default WorkItemsSection
