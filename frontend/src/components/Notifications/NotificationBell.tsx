import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * T191-T199: Notification bell component with dropdown
 * T200-T203: Health score cache refresh visibility
 */
export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
  } = useNotifications(false);

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'health_score_drop':
        return <TrendingDown className="size-4 text-orange-500" />;
      case 'commitment_overdue':
        return <AlertCircle className="size-4 text-red-500" />;
      default:
        return <Bell className="size-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'health_score_drop':
        return 'border-s-4 border-orange-500 bg-orange-50';
      case 'commitment_overdue':
        return 'border-s-4 border-red-500 bg-red-50';
      default:
        return 'border-s-4 border-blue-500 bg-blue-50';
    }
  };

  const handleNotificationClick = (notification: any) => {
    // T197: Mark notification as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // T198: Navigate to relevant dossier page (extract dossier_id from metadata)
    if (notification.metadata?.dossierId) {
      // T199: Invalidate useDossierStats() query cache when navigating to dossier
      queryClient.invalidateQueries({
        queryKey: ['dossierStats', notification.metadata.dossierId],
      });

      // Navigate to dossier detail page
      navigate({
        to: `/dossiers/${notification.metadata.dossierId}`,
      });

      // Close the popover
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="size-5 text-gray-400" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('notifications.bell.ariaLabel')}
        >
          {/* T192: Display notification bell icon with unread count badge */}
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 sm:w-96"
        align={isRTL ? 'start' : 'end'}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-start text-base font-semibold">
            {t('notifications.title')}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAsRead}
              className="text-xs"
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        {/* T195: Show notification dropdown with list of notifications */}
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <CheckCircle className="mb-2 size-12 text-gray-400" />
              <p className="text-sm text-gray-600">
                {t('notifications.noNotifications')}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  } ${getNotificationColor(notification.metadata?.type)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* T196: Color-coded icon based on type */}
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notification.metadata?.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* T196: Display title, message, timestamp */}
                      <p className="mb-1 text-start text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mb-2 text-start text-sm text-gray-700">
                        {notification.message}
                      </p>
                      <p className="text-start text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="shrink-0">
                        <div className="size-2 rounded-full bg-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
