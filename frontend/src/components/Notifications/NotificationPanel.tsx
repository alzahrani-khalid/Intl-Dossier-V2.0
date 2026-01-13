import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Bell, Settings, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationBadge } from './NotificationBadge'
import { NotificationList } from './NotificationList'
import {
  useNotificationCenter,
  useNotificationRealtime,
  type Notification,
  type NotificationCategory,
} from '@/hooks/useNotificationCenter'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface NotificationPanelProps {
  className?: string
}

const CATEGORIES: NotificationCategory[] = [
  'assignments',
  'intake',
  'calendar',
  'signals',
  'mentions',
  'deadlines',
  'system',
  'workflow',
]

export function NotificationPanel({ className }: NotificationPanelProps) {
  const { t, i18n } = useTranslation('notification-center')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all')

  // Get notifications based on active category
  const filters = activeCategory !== 'all' ? { category: activeCategory } : {}
  const {
    notifications,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    unreadCount,
    countsByCategory,
    markAsRead,
    isMarkingAsRead,
    deleteNotification,
  } = useNotificationCenter(filters)

  // Real-time updates
  const handleNewNotification = useCallback(
    (notification: Notification) => {
      toast({
        title: notification.title,
        description: notification.message,
      })
    },
    [toast],
  )

  useNotificationRealtime(handleNewNotification)

  const handleMarkAsRead = (id: string) => {
    markAsRead({ notificationIds: [id] })
  }

  const handleMarkAllAsRead = () => {
    if (activeCategory === 'all') {
      markAsRead({ markAll: true })
    } else {
      markAsRead({ markAll: true, category: activeCategory })
    }
    toast({
      title: t('toast.markedAllAsRead'),
    })
  }

  const handleDelete = (id: string) => {
    deleteNotification(id)
    toast({
      title: t('toast.deleted'),
    })
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead({ notificationIds: [notification.id] })
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      setIsOpen(false)
      // Handle internal vs external URLs
      if (notification.action_url.startsWith('/')) {
        navigate({ to: notification.action_url })
      } else {
        window.open(notification.action_url, '_blank')
      }
    }
  }

  const handleSettingsClick = () => {
    setIsOpen(false)
    navigate({ to: '/settings/notifications' })
  }

  const handleViewAll = () => {
    setIsOpen(false)
    navigate({ to: '/notifications' })
  }

  // Get category unread count
  const getCategoryCount = (category: NotificationCategory) => {
    return countsByCategory[category]?.unread || 0
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={t('title')}
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge
            count={unreadCount}
            className="absolute -top-1 -end-1"
            variant={unreadCount > 10 ? 'urgent' : 'default'}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[400px] p-0 sm:w-[440px]"
        align={isRTL ? 'start' : 'end'}
        sideOffset={8}
        data-testid="notification-panel"
      >
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{t('title')}</h2>
              {unreadCount > 0 && <NotificationBadge count={unreadCount} size="sm" />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || isMarkingAsRead}
                title={t('markAllRead')}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSettingsClick}
                title={t('preferences.title')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category tabs */}
          <Tabs
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v as NotificationCategory | 'all')}
            className="w-full"
          >
            <div className="border-b px-2">
              <TabsList className="h-10 w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="relative px-3 py-1.5 text-xs data-[state=active]:bg-muted"
                >
                  {t('categories.all')}
                  {unreadCount > 0 && (
                    <span className="ms-1.5 text-[10px] text-muted-foreground">
                      ({unreadCount})
                    </span>
                  )}
                </TabsTrigger>
                {CATEGORIES.map((category) => {
                  const count = getCategoryCount(category)
                  return (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="relative px-3 py-1.5 text-xs data-[state=active]:bg-muted"
                    >
                      {t(`categories.${category}`)}
                      {count > 0 && (
                        <span className="ms-1.5 text-[10px] text-muted-foreground">({count})</span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* Notification list */}
            <div className="max-h-[60vh] min-h-[200px] overflow-y-auto">
              <TabsContent value={activeCategory} className="m-0 p-2">
                <NotificationList
                  notifications={notifications}
                  isLoading={isLoading}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onFetchNextPage={fetchNextPage}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClick={handleNotificationClick}
                  category={activeCategory !== 'all' ? activeCategory : undefined}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <Button
              variant="ghost"
              className="w-full justify-center text-sm"
              onClick={handleViewAll}
            >
              {t('viewAll')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
