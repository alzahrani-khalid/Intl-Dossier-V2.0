/**
 * RecentDossierActivity Component
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Displays a timeline of recent activity across all user's dossiers.
 * Aggregates tasks, commitments, and intakes with dossier context badges.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Activity,
  CheckSquare,
  FileCheck,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Globe2,
  Building2,
  Users,
  Folder,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRecentDossierActivitySimple } from '@/hooks/useDossierDashboard'
import type {
  RecentDossierActivityProps,
  DossierActivityItem,
} from '@/types/dossier-dashboard.types'
import type { DossierType } from '@/types/dossier-context.types'
import type { WorkSource } from '@/types/unified-work.types'
import { getDossierDetailPath } from '@/lib/dossier-routes'

// =============================================================================
// Icons
// =============================================================================

const typeIcons: Record<WorkSource, typeof CheckSquare> = {
  task: CheckSquare,
  commitment: FileCheck,
  intake: ClipboardList,
}

const dossierTypeIcons: Record<DossierType, typeof Globe2> = {
  country: Globe2,
  organization: Building2,
  forum: Calendar,
  theme: Folder,
  working_group: Users,
  person: UserCircle,
  engagement: Calendar,
  topic: Folder,
}

// =============================================================================
// Status Colors
// =============================================================================

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

// =============================================================================
// Component
// =============================================================================

export function RecentDossierActivity({
  maxItems = 10,
  maxHeight = '400px',
  showDossierBadges = true,
  filters,
  className,
}: RecentDossierActivityProps) {
  const { t, i18n } = useTranslation('dossier-dashboard')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Fetch recent activity
  const { data, isLoading, isError, error, refetch } = useRecentDossierActivitySimple({
    ...filters,
    limit: maxItems,
  })

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <CardTitle className="text-lg">
            {t('recentActivity.title', 'Recent Dossier Activity')}
          </CardTitle>
          {!isLoading && data && (
            <Badge variant="secondary" className="text-xs">
              {data.total_count}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
          <span className="sr-only">{t('common.refresh', 'Refresh')}</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <ActivityItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive mb-2">
              {error?.message || t('recentActivity.error', 'Failed to load activity')}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="min-h-11">
              {t('common.retry', 'Try Again')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data?.activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="size-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('recentActivity.empty', 'No recent activity across your dossiers')}
            </p>
          </div>
        )}

        {/* Activity List */}
        {!isLoading && !isError && data && data.activities.length > 0 && (
          <ScrollArea className="pe-4" style={{ maxHeight }}>
            <div className="space-y-2">
              {data.activities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  showDossierBadge={showDossierBadges}
                  isFirst={index === 0}
                  isLast={index === data.activities.length - 1}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// ActivityItem Sub-component
// =============================================================================

interface ActivityItemProps {
  activity: DossierActivityItem
  showDossierBadge?: boolean
  isFirst?: boolean
  isLast?: boolean
}

function ActivityItem({ activity, showDossierBadge = true, isFirst, isLast }: ActivityItemProps) {
  const { t, i18n } = useTranslation('dossier-dashboard')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const TypeIcon = typeIcons[activity.work_item_type] || CheckSquare
  const DossierIcon = dossierTypeIcons[activity.dossier.type] || Folder

  // Navigate to work item
  const handleClick = () => {
    switch (activity.work_item_type) {
      case 'task':
        navigate({ to: '/tasks/$id', params: { id: activity.work_item_id } })
        break
      case 'commitment':
        navigate({ to: '/commitments', search: { id: activity.work_item_id } })
        break
      case 'intake':
        navigate({ to: '/intake/tickets/$id', params: { id: activity.work_item_id } })
        break
    }
  }

  // Navigate to dossier
  const handleDossierClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const path = getDossierDetailPath(activity.dossier.id, activity.dossier.type)
    navigate({ to: path })
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return t('time.minutesAgo', '{{count}} min ago', { count: diffMinutes })
    }
    if (diffHours < 24) {
      return t('time.hoursAgo', '{{count}}h ago', { count: diffHours })
    }
    if (diffDays < 7) {
      return t('time.daysAgo', '{{count}}d ago', { count: diffDays })
    }
    return date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
  }

  // Get dossier name
  const dossierName = isRTL
    ? activity.dossier.name_ar || activity.dossier.name_en
    : activity.dossier.name_en

  return (
    <div
      className={cn(
        'relative flex gap-3 p-3 rounded-lg border cursor-pointer',
        'transition-colors hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        activity.is_overdue && 'border-red-200 dark:border-red-900/50',
      )}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      role="button"
      aria-label={`${t(`workItemType.${activity.work_item_type}`, activity.work_item_type)}: ${activity.title}`}
    >
      {/* Timeline connector */}
      {!isFirst && (
        <div className="absolute top-0 start-[25px] w-px h-3 -translate-y-full bg-border" />
      )}

      {/* Type Icon */}
      <div
        className={cn(
          'flex items-center justify-center size-10 rounded-full shrink-0',
          'bg-muted border-2',
          activity.is_overdue ? 'border-red-500' : 'border-transparent',
        )}
      >
        <TypeIcon
          className={cn(
            'size-5',
            activity.work_item_type === 'task' && 'text-blue-500',
            activity.work_item_type === 'commitment' && 'text-purple-500',
            activity.work_item_type === 'intake' && 'text-green-500',
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight truncate">
            {activity.title || t('recentActivity.untitled', 'Untitled')}
          </h4>
          <ChevronRight
            className={cn('size-4 shrink-0 text-muted-foreground', isRTL && 'rotate-180')}
          />
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {t(`workItemType.${activity.work_item_type}`, activity.work_item_type)}
          </Badge>
          <Badge variant="secondary" className={cn('text-xs', statusColors[activity.status] || '')}>
            {t(`status.${activity.status}`, activity.status)}
          </Badge>
          {activity.is_overdue && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle className="size-3" />
              {t('recentActivity.overdue', 'Overdue')}
            </Badge>
          )}
        </div>

        {/* Dossier Badge */}
        {showDossierBadge && (
          <button
            onClick={handleDossierClick}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
              'bg-muted/80 hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
          >
            <DossierIcon className="size-3 text-muted-foreground" />
            <span className="truncate max-w-[150px]">{dossierName}</span>
          </button>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {activity.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(activity.deadline).toLocaleDateString(i18n.language, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          <span className="ms-auto">{formatRelativeTime(activity.activity_timestamp)}</span>
        </div>
      </div>

      {/* Timeline connector below */}
      {!isLast && (
        <div className="absolute bottom-0 start-[25px] w-px h-full translate-y-full bg-border" />
      )}
    </div>
  )
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function ActivityItemSkeleton() {
  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export default RecentDossierActivity
