import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Bell, Settings, CheckCheck, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotificationList } from '@/components/Notifications/NotificationList'
import { NotificationBadge } from '@/components/Notifications/NotificationBadge'
import { NotificationPreviewTimeline } from '@/components/empty-states/NotificationPreviewTimeline'
import {
  useNotificationCenter,
  useNotificationRealtime,
  useCategoryPreferences,
  type Notification,
  type NotificationCategory,
  type CategoryPreference,
} from '@/hooks/useNotificationCenter'
import { useToast } from '@/hooks/use-toast'

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

// Local storage key for preview dismissed state
const PREVIEW_DISMISSED_KEY = 'intl-dossier-notification-preview-dismissed'

export function NotificationsPage() {
  const { t, i18n } = useTranslation('notification-center')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { toast } = useToast()

  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Track if user has dismissed the preview
  const [previewDismissed, setPreviewDismissed] = useState(() => {
    return localStorage.getItem(PREVIEW_DISMISSED_KEY) === 'true'
  })

  // Get notifications based on active category and filter
  const filters = {
    ...(activeCategory !== 'all' && { category: activeCategory }),
    ...(filter === 'unread' && { unreadOnly: true }),
  }

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

  // Category preferences
  const { updatePreferences, isUpdating: isUpdatingPreferences } = useCategoryPreferences()

  // Real-time updates
  useNotificationRealtime()

  // Determine if we should show the preview
  const showPreview = !isLoading && notifications.length === 0 && !previewDismissed

  // Handle preview complete - save preferences and dismiss
  const handlePreviewComplete = useCallback(
    (preferences: CategoryPreference[]) => {
      updatePreferences(preferences, {
        onSuccess: () => {
          localStorage.setItem(PREVIEW_DISMISSED_KEY, 'true')
          setPreviewDismissed(true)
          toast({
            title: t('preferences.saved'),
            description: t('preferences.savedDescription'),
          })
        },
        onError: () => {
          toast({
            title: t('preferences.error'),
            description: t('preferences.errorDescription'),
            variant: 'destructive',
          })
        },
      })
    },
    [updatePreferences, toast, t],
  )

  // Handle skip preview
  const handleSkipPreview = useCallback(() => {
    localStorage.setItem(PREVIEW_DISMISSED_KEY, 'true')
    setPreviewDismissed(true)
  }, [])

  const handleMarkAsRead = (id: string) => {
    markAsRead({ notificationIds: [id] })
    toast({
      title: t('toast.markedAsRead'),
    })
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
      if (notification.action_url.startsWith('/')) {
        navigate({ to: notification.action_url })
      } else {
        window.open(notification.action_url, '_blank')
      }
    }
  }

  const handleSettingsClick = () => {
    navigate({ to: '/settings/notifications' })
  }

  // Get category unread count
  const getCategoryCount = (category: NotificationCategory) => {
    return countsByCategory[category]?.unread || 0
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('notificationCenter')}</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} ${t('badge.unread')}` : t('empty.title')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAsRead}
          >
            <CheckCheck className="h-4 w-4 me-2" />
            {t('markAllRead')}
          </Button>
          <Button variant="outline" onClick={handleSettingsClick}>
            <Settings className="h-4 w-4 me-2" />
            {t('preferences.title')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as NotificationCategory | 'all')}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-10 w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="all" className="px-4">
              {t('categories.all')}
              {unreadCount > 0 && (
                <NotificationBadge count={unreadCount} size="sm" className="ms-2" />
              )}
            </TabsTrigger>
            {CATEGORIES.map((category) => {
              const count = getCategoryCount(category)
              return (
                <TabsTrigger key={category} value={category} className="px-3">
                  {t(`categories.${category}`)}
                  {count > 0 && <NotificationBadge count={count} size="sm" className="ms-2" />}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* Filter dropdown */}
        <Select value={filter} onValueChange={(v: 'all' | 'unread') => setFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            <SelectItem value="unread">{t('filters.unread')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show preview timeline for first-time users with no notifications */}
      {showPreview ? (
        <div className="bg-card rounded-lg border p-4 sm:p-6 lg:p-8">
          <NotificationPreviewTimeline
            onComplete={handlePreviewComplete}
            onSkip={handleSkipPreview}
          />
        </div>
      ) : (
        /* Notification list */
        <div className="bg-card rounded-lg border p-4 sm:p-6">
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
        </div>
      )}
    </div>
  )
}
