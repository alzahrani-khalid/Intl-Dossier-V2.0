/**
 * Push Subscription Service
 * @module services/push-subscription
 *
 * Manages Web Push subscription lifecycle: subscribe, unsubscribe, and utility functions.
 * Uses the Push API via service worker registration.
 */

import { apiPost } from '@/lib/api-client'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

/**
 * Convert a base64-encoded VAPID public key to a Uint8Array for applicationServerKey.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Check if push notification permission is granted.
 */
export function isPushPermissionGranted(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

/**
 * Fetch the VAPID public key from the backend.
 * This endpoint does not require authentication.
 */
export async function getVapidPublicKey(): Promise<string> {
  const response = await fetch(`${API_BASE}/api/push-subscriptions/vapid-public-key`)
  if (!response.ok) {
    throw new Error('Failed to fetch VAPID public key')
  }
  const data = (await response.json()) as { publicKey: string }
  return data.publicKey
}

/**
 * Subscribe to push notifications.
 * 1. Gets VAPID public key from backend
 * 2. Subscribes via service worker Push API
 * 3. Sends subscription to backend for storage
 * Returns the PushSubscription on success, null on failure.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser')
    return null
  }

  try {
    const vapidPublicKey = await getVapidPublicKey()
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    })

    const subscriptionJson = subscription.toJSON()

    // Send subscription to backend
    await apiPost('/api/push-subscriptions', {
      endpoint: subscriptionJson.endpoint,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
      },
      userAgent: navigator.userAgent,
    })

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications.
 * 1. Gets current subscription from service worker
 * 2. Calls unsubscribe on the subscription
 * 3. Notifies backend to deactivate the subscription
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription != null) {
      const endpoint = subscription.endpoint

      await subscription.unsubscribe()

      // Notify backend to deactivate subscription
      await apiPost('/api/push-subscriptions/unsubscribe', { endpoint })
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
  }
}
