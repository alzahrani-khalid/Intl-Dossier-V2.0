/**
 * NotificationsWidget Component
 *
 * Displays recent notifications with category filtering.
 * Supports marking as read and RTL layout.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  BellOff,
  UserPlus,
  Clock,
  RefreshCw,
  AtSign,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  NotificationsWidgetConfig,
  NotificationData,
  NotificationCategory,
} from '@/types/dashboard-widget.types'

interface NotificationsWidgetProps {
  config: NotificationsWidgetConfig
  data: NotificationData[] | null
  isLoading?: boolean
  onMarkAsRead?: (notificationId: string) => void
}

/**
 * Get icon for notification category
 */
function getCategoryIcon(category: NotificationCategory) {
  switch (category) {
    case 'task-assigned':
      return UserPlus
    case 'deadline-approaching':
      return Clock
    case 'status-change':
      return RefreshCw
    case 'mention':
      return AtSign
    case 'system':
      return Settings
    default:
      return Bell
  }
}

/**
 * Get color classes for notification category
 */
function getCategoryColor(category: NotificationCategory) {
  switch (category) {
    case 'task-assigned':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
      }
    case 'deadline-approaching':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
      }
    case 'status-change':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
      }
    case 'mention':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
      }
    case 'system':
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
      }
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
      }
  }
}

/**
 * Format relative time for notifications
 */
function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffMinutes < 1) {
    return rtf.format(0, 'second')
  } else if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute')
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour')
  } else if (diffDays < 7) {
    return rtf.format(-diffDays, 'day')
  } else {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }
}

/**
 * Single notification item component
 */
function NotificationItem({
  notification,
  locale,
  isRTL,
  onMarkAsRead,
}: {
  notification: NotificationData
  locale: string
  isRTL: boolean
  onMarkAsRead?: () => void
}) {
  const Icon = getCategoryIcon(notification.category)
  const colors = getCategoryColor(notification.category)

  const relativeTime = formatRelativeTime(notification.createdAt, locale)

  return (
    <div
      className={cn(
        'flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors cursor-pointer group',
        notification.isRead ? 'opacity-60 hover:bg-muted/30' : 'bg-muted/30 hover:bg-muted/50',
      )}
      onClick={onMarkAsRead}
    >
      {/* Unread indicator */}
      {!notification.isRead && <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />}

      {/* Icon */}
      <div className={cn('p-1.5 rounded shrink-0', colors.bg)}>
        <Icon className={cn('h-3.5 w-3.5', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn('text-sm truncate', notification.isRead ? 'font-normal' : 'font-medium')}
          >
            {notification.title}
          </h4>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {relativeTime}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
      </div>

      {/* Chevron for actionable notifications */}
      {notification.actionUrl && (
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center',
            isRTL && 'rotate-180',
          )}
        />
      )}
    </div>
  )
}

export function NotificationsWidget({
  config,
  data,
  isLoading,
  onMarkAsRead,
}: NotificationsWidgetProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? 'ar-SA' : 'en-US'

  const { settings } = config

  // Filter and process notifications
  const filteredNotifications = useMemo(() => {
    if (!data) return []

    let notifications = [...data]

    // Filter by categories
    if (!settings.categories.includes('all')) {
      notifications = notifications.filter((n) => settings.categories.includes(n.category))
    }

    // Filter read notifications
    if (!settings.showRead) {
      notifications = notifications.filter((n) => !n.isRead)
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Limit items
    return notifications.slice(0, settings.maxItems)
  }, [data, settings])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-full space-y-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <div className="w-2 h-2 bg-muted rounded-full mt-2" />
            <div className="w-6 h-6 bg-muted rounded" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-muted rounded mb-1" />
              <div className="h-3 w-full bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!filteredNotifications.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('emptyStates.noNotifications')}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            locale={locale}
            isRTL={isRTL}
            onMarkAsRead={() => onMarkAsRead?.(notification.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

export default NotificationsWidget
