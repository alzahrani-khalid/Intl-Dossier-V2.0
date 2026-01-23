/**
 * ActivityTimelineSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays the unified activity timeline for the dossier.
 * Mobile-first, RTL-supported.
 */

import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  CheckSquare,
  Handshake,
  Inbox,
  FileText,
  Calendar,
  Link as LinkIcon,
  File,
  MessageSquare,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  CheckCircle,
  Link2,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ActivityTimelineSectionProps } from '@/types/dossier-overview.types'
import type {
  UnifiedActivity,
  UnifiedActivityType,
  UnifiedActivityAction,
} from '@/types/unified-dossier-activity.types'

/**
 * Get icon for activity type
 */
function getActivityTypeIcon(type: UnifiedActivityType) {
  const icons: Record<UnifiedActivityType, React.ElementType> = {
    task: CheckSquare,
    commitment: Handshake,
    intake: Inbox,
    position: FileText,
    event: Calendar,
    relationship: LinkIcon,
    document: File,
    comment: MessageSquare,
  }
  return icons[type] || Activity
}

/**
 * Get icon for activity action
 */
function getActionIcon(action: UnifiedActivityAction) {
  const icons: Record<UnifiedActivityAction, React.ElementType> = {
    created: Plus,
    updated: Pencil,
    completed: CheckCircle,
    linked: Link2,
    commented: MessageSquare,
    status_change: RefreshCw,
    assigned: UserPlus,
  }
  return icons[action] || Activity
}

/**
 * Get activity type color
 */
function getActivityTypeColor(type: UnifiedActivityType) {
  const colors: Record<UnifiedActivityType, string> = {
    task: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    commitment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    intake: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    position: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    event: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    relationship: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    document: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    comment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return colors[type] || colors.task
}

/**
 * Get action color
 */
function getActionColor(action: UnifiedActivityAction) {
  const colors: Record<UnifiedActivityAction, string> = {
    created: 'text-green-600',
    updated: 'text-blue-600',
    completed: 'text-green-600',
    linked: 'text-purple-600',
    commented: 'text-yellow-600',
    status_change: 'text-orange-600',
    assigned: 'text-cyan-600',
  }
  return colors[action] || 'text-gray-600'
}

/**
 * Get initials from name
 */
function getInitials(name: string | null): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: string, locale: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (locale === 'ar-SA') {
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays === 1) return 'أمس'
    if (diffDays < 7) return `منذ ${diffDays} أيام`
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/**
 * Activity item component
 */
function ActivityItem({
  activity,
  isRTL,
  isLast,
}: {
  activity: UnifiedActivity
  isRTL: boolean
  isLast: boolean
}) {
  const { t } = useTranslation('dossier-overview')
  const locale = isRTL ? 'ar-SA' : 'en-US'
  const TypeIcon = getActivityTypeIcon(activity.activity_type)
  const ActionIcon = getActionIcon(activity.action)

  return (
    <div className="flex gap-3 sm:gap-4 relative">
      {/* Timeline line */}
      {!isLast && (
        <div
          className={`absolute top-12 w-0.5 h-[calc(100%-12px)] bg-border ${
            isRTL ? 'end-[19px] sm:end-[23px]' : 'start-[19px] sm:start-[23px]'
          }`}
        />
      )}

      {/* Avatar */}
      <div className="relative z-10 shrink-0">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background">
          <AvatarImage
            src={activity.actor.avatar_url || undefined}
            alt={activity.actor.name || ''}
          />
          <AvatarFallback
            className={`text-xs sm:text-sm ${getActivityTypeColor(activity.activity_type)}`}
          >
            {getInitials(activity.actor.name)}
          </AvatarFallback>
        </Avatar>
        {/* Action icon badge */}
        <div
          className={`absolute -bottom-1 -end-1 p-1 rounded-full bg-background border ${getActionColor(
            activity.action,
          )}`}
        >
          <ActionIcon className="h-3 w-3" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="text-sm font-semibold line-clamp-2">
              {isRTL ? activity.title_ar : activity.title_en}
            </h4>

            {/* Actor and action */}
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.actor.name && <span className="font-medium">{activity.actor.name}</span>}{' '}
              <span>{t(`activityAction.${activity.action}`)}</span>
            </p>
          </div>

          {/* Time */}
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeTime(activity.timestamp, locale)}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge
            variant="outline"
            className={`text-xs ${getActivityTypeColor(activity.activity_type)}`}
          >
            <TypeIcon className="h-3 w-3 me-1" />
            {t(`activityType.${activity.activity_type}`)}
          </Badge>

          {activity.priority !== 'medium' && (
            <Badge
              variant={activity.priority === 'urgent' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {t(`priority.${activity.priority}`)}
            </Badge>
          )}

          {activity.status && activity.status !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {activity.status}
            </Badge>
          )}

          {activity.inheritance_source !== 'direct' && (
            <Badge variant="secondary" className="text-xs">
              {t(`inheritanceSource.${activity.inheritance_source}`)}
            </Badge>
          )}
        </div>

        {/* Description */}
        {(activity.description_en || activity.description_ar) && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {isRTL ? activity.description_ar : activity.description_en}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="text-center py-8 sm:py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-4 rounded-full bg-muted inline-block mb-4">
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-2">{t('activityTimeline.empty.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {t('activityTimeline.empty.description')}
      </p>
    </div>
  )
}

/**
 * Main ActivityTimelineSection component
 */
export function ActivityTimelineSection({
  data,
  dossierId,
  isLoading,
  isRTL = false,
  className = '',
  onLoadMore,
}: ActivityTimelineSectionProps) {
  const { t } = useTranslation('dossier-overview')

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
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
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('activityTimeline.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <EmptyState isRTL={isRTL} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('activityTimeline.title')}
          <Badge variant="secondary">{data.total_count}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-1" dir={isRTL ? 'rtl' : 'ltr'}>
          {data.recent_activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isRTL={isRTL}
              isLast={index === data.recent_activities.length - 1}
            />
          ))}
        </div>

        {/* Load more button */}
        {data.has_more && (
          <div className="mt-4 pt-4 border-t text-center">
            <Button variant="outline" size="sm" onClick={onLoadMore} className="min-h-10">
              <ChevronDown className="h-4 w-4 me-2" />
              {t('activityTimeline.loadMore')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityTimelineSection
