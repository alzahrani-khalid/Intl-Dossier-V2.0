import React from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationItem } from './NotificationItem'
import type { Notification, NotificationCategory } from '@/hooks/useNotificationCenter'
import { cn } from '@/lib/utils'

interface NotificationListProps {
  notifications: Notification[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onFetchNextPage?: () => void
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (notification: Notification) => void
  emptyMessage?: string
  category?: NotificationCategory
  className?: string
}

export function NotificationList({
  notifications,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onMarkAsRead,
  onDelete,
  onClick,
  emptyMessage,
  category,
  className,
}: NotificationListProps) {
  const { t, i18n } = useTranslation('notification-center')
  const isRTL = i18n.language === 'ar'

  // Get category-specific empty message
  const getEmptyMessage = () => {
    if (emptyMessage) return emptyMessage
    if (category) {
      return t(`empty.${category}Empty`, t('empty.description'))
    }
    return t('empty.description')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">{t('empty.title')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{getEmptyMessage()}</p>
      </div>
    )
  }

  // Group notifications by date
  const groupedNotifications = groupByDate(notifications, i18n.language)

  return (
    <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {dateLabel}
          </h4>
          <div className="space-y-2">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClick={onClick}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onFetchNextPage} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('loading')}
              </>
            ) : (
              t('loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Helper function to group notifications by date
function groupByDate(
  notifications: Notification[],
  language: string,
): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const labels =
    language === 'ar'
      ? { today: 'اليوم', yesterday: 'أمس', thisWeek: 'هذا الأسبوع', older: 'أقدم' }
      : { today: 'Today', yesterday: 'Yesterday', thisWeek: 'This Week', older: 'Older' }

  for (const notification of notifications) {
    const date = new Date(notification.created_at)
    date.setHours(0, 0, 0, 0)

    let label: string
    if (date.getTime() === today.getTime()) {
      label = labels.today
    } else if (date.getTime() === yesterday.getTime()) {
      label = labels.yesterday
    } else if (date >= weekAgo) {
      label = labels.thisWeek
    } else {
      label = labels.older
    }

    if (!groups[label]) {
      groups[label] = []
    }
    groups[label].push(notification)
  }

  return groups
}
