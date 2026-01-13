import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  ClipboardList,
  Inbox,
  Calendar,
  AlertTriangle,
  AtSign,
  Clock,
  Bell,
  GitBranch,
  MoreHorizontal,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
} from '@/hooks/useNotificationCenter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (notification: Notification) => void
}

const categoryIcons: Record<NotificationCategory, React.ElementType> = {
  assignments: ClipboardList,
  intake: Inbox,
  calendar: Calendar,
  signals: AlertTriangle,
  mentions: AtSign,
  deadlines: Clock,
  system: Bell,
  workflow: GitBranch,
}

const priorityColors: Record<NotificationPriority, string> = {
  urgent: 'border-s-red-600 bg-red-50 dark:bg-red-950/20',
  high: 'border-s-orange-500 bg-orange-50 dark:bg-orange-950/20',
  normal: 'border-s-blue-500 bg-card',
  low: 'border-s-gray-400 bg-card',
}

const categoryColors: Record<NotificationCategory, string> = {
  assignments: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  intake: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  calendar: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  signals: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  mentions: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  deadlines: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  system: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
  workflow: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const { t, i18n } = useTranslation('notification-center')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  const Icon = categoryIcons[notification.category] || Bell

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale,
  })

  const handleClick = () => {
    if (onClick) {
      onClick(notification)
    }
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      className={cn(
        'relative flex gap-3 p-4 border-s-4 rounded-lg transition-colors cursor-pointer',
        'hover:bg-accent/50',
        priorityColors[notification.priority],
        !notification.read && 'ring-1 ring-primary/20',
      )}
      onClick={handleClick}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
          categoryColors[notification.category],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium truncate',
                !notification.read ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              {!notification.read && onMarkAsRead && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                >
                  <Check className="h-4 w-4 me-2" />
                  {t('actions.markRead')}
                </DropdownMenuItem>
              )}
              {notification.action_url && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(notification.action_url!, '_blank')
                  }}
                >
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t('actions.viewDetails')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(notification.id)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {t('actions.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {notification.priority === 'urgent' && (
            <span className="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
              {t('priority.urgent')}
            </span>
          )}
          {notification.priority === 'high' && (
            <span className="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
              {t('priority.high')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
