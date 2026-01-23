import { useState, useEffect, useCallback } from 'react'
import { Bell, X, AlertCircle, Info, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast, Toaster } from 'react-hot-toast'
import { realtimeManager } from '../../lib/realtime'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  userId?: string
  metadata?: Record<string, any>
}

interface NotificationCenterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxNotifications?: number
  autoMarkAsRead?: boolean
  showToast?: boolean
}

export function NotificationCenter({
  position = 'top-right',
  maxNotifications = 50,
  autoMarkAsRead = true,
  showToast = true,
}: NotificationCenterProps) {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`notifications-${user?.id}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      const notifications = parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }))
      setNotifications(notifications)
      updateUnreadCount(notifications)
    }
  }, [user?.id])

  // Save notifications to localStorage
  useEffect(() => {
    if (user?.id && notifications.length > 0) {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifications))
    }
  }, [notifications, user?.id])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return

    const channel = `notifications:${user.id}`

    // Store unsubscribe for cleanup
    realtimeManager.subscribe({
      channel,
      onBroadcast: (event: string, payload: any) => {
        if (event === 'new_notification') {
          handleNewNotification(payload)
        }
      },
      onDatabaseChange: (payload: any) => {
        if (payload.table === 'notifications' && payload.new?.user_id === user.id) {
          handleNewNotification({
            id: payload.new.id,
            type: payload.new.type || 'info',
            title: payload.new.title,
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            read: false as boolean,
            actionUrl: payload.new.action_url,
            actionLabel: payload.new.action_label,
            metadata: payload.new.metadata,
          })
        }
      },
    })

    return () => {
      realtimeManager.unsubscribe(channel)
    }
  }, [user?.id])

  const handleNewNotification = useCallback(
    (notification: Partial<Notification>) => {
      const newNotification: Notification = {
        id: notification.id || crypto.randomUUID(),
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        ...notification,
        read: false,
        timestamp: notification.timestamp || new Date(),
      }

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, maxNotifications)
        updateUnreadCount(updated)
        return updated
      })

      // Show toast notification
      if (showToast) {
        showToastNotification(newNotification)
      }

      // Play notification sound
      playNotificationSound()

      // Request browser notification permission and show
      if ('Notification' in window && Notification.permission === 'granted') {
        showBrowserNotification(newNotification)
      }
    },
    [maxNotifications, showToast],
  )

  const showToastNotification = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type)

    toast.custom(
      (t) => (
        <div
          className={cn(
            'max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5',
            t.visible ? 'animate-enter' : 'animate-leave',
          )}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">{icon}</div>
              <div className="ms-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-e-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: position.includes('top') ? 'top-right' : 'bottom-right',
      },
    )
  }

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: notification.id,
        requireInteraction: notification.type === 'error',
      })

      browserNotif.onclick = () => {
        window.focus()
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl
        }
      }
    }
  }

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore autoplay errors
    })
  }

  const updateUnreadCount = (notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.read).length
    setUnreadCount(count)

    // Update document title with unread count
    if (count > 0) {
      document.title = `(${count}) ${document.title.replace(/^\(\d+\) /, '')}`
    } else {
      document.title = document.title.replace(/^\(\d+\) /, '')
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      updateUnreadCount(updated)
      return updated
    })
  }

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      updateUnreadCount(updated)
      return updated
    })
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== notificationId)
      updateUnreadCount(updated)
      return updated
    })
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
    if (user?.id) {
      localStorage.removeItem(`notifications-${user.id}`)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <>
      <Toaster position={position} />

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 end-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute end-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[32rem] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-800">
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                      !notification.read && 'bg-blue-50',
                    )}
                    onClick={() => autoMarkAsRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="ms-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            <Clock className="inline h-3 w-3 me-1" />
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {notification.actionLabel || 'View'}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="ms-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Export helper function to send notifications
export function sendNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'read' | 'timestamp'>,
) {
  const channel = `notifications:${userId}`
  const notificationData = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    timestamp: new Date(),
  }

  return realtimeManager.broadcast(channel, 'new_notification', notificationData)
}
