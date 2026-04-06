import { useState, useEffect, useCallback } from 'react'
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/services/push-subscription'

interface UsePushSubscriptionReturn {
  isSupported: boolean
  permission: NotificationPermission | null
  isSubscribed: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<void>
  isLoading: boolean
}

/**
 * React hook for managing Web Push notification subscriptions.
 * Provides subscription state, permission status, and subscribe/unsubscribe actions.
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supported = isPushSupported()
    setIsSupported(supported)

    if (!supported) {
      return
    }

    // Check current permission
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }

    // Check if already subscribed
    const checkSubscription = async (): Promise<void> => {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(subscription != null)
      } catch {
        setIsSubscribed(false)
      }
    }

    void checkSubscription()
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const subscription = await subscribeToPush()
      const success = subscription != null
      setIsSubscribed(success)
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission)
      }
      return success
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await unsubscribeFromPush()
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
  }
}
