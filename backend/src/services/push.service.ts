import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { logInfo, logError } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
)

/**
 * Known trusted Web Push service domains (T-16-07: endpoint spoofing mitigation).
 */
const TRUSTED_PUSH_DOMAINS = [
  'push.services.mozilla.com',
  'fcm.googleapis.com',
  'notify.windows.com',
  'push.apple.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
]

/**
 * Validate that an endpoint is an HTTPS URL from a known push service.
 * Security: T-16-07 -- prevents storing arbitrary endpoints.
 */
export function isValidPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:') {
      return false
    }
    return TRUSTED_PUSH_DOMAINS.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    )
  } catch {
    return false
  }
}

/**
 * Initialize VAPID details for Web Push.
 * Must be called once at server startup.
 * Security: T-16-08 -- only public key is exposed; private key stays in env.
 */
export function initializeVapid(): void {
  const contactEmail = process.env.VAPID_CONTACT_EMAIL
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (contactEmail == null || publicKey == null || privateKey == null) {
    logError('VAPID keys not configured -- push notifications will not work', new Error('Missing VAPID configuration'))
    return
  }

  webpush.setVapidDetails(contactEmail, publicKey, privateKey)
  logInfo('VAPID details initialized for Web Push')
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  dir?: 'ltr' | 'rtl'
  lang?: string
  tag?: string
}

interface PushSubscriptionData {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/**
 * Send a push notification to a single subscription.
 * Returns true on success, false on failure.
 * Automatically marks expired subscriptions (410 Gone) as inactive.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload,
): Promise<boolean> {
  if (!isValidPushEndpoint(subscription.endpoint)) {
    logError(
      `Rejected push to untrusted endpoint: ${subscription.endpoint}`,
      new Error('Untrusted push endpoint'),
    )
    return false
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
    )
    return true
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or no longer valid
      logInfo(`Push subscription expired (${statusCode}): ${subscription.endpoint}`)
      await deleteExpiredSubscription(subscription.endpoint)
      return false
    }

    logError(
      `Push notification failed for endpoint: ${subscription.endpoint}`,
      error instanceof Error ? error : new Error(String(error)),
    )
    return false
  }
}

/**
 * Mark a push subscription as inactive when it expires (410 Gone).
 */
export async function deleteExpiredSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('endpoint', endpoint)
    .eq('is_active', true)

  if (error != null) {
    logError('Failed to deactivate expired push subscription', error as unknown as Error)
  } else {
    logInfo(`Deactivated expired push subscription: ${endpoint}`)
  }
}

/**
 * Get all active push subscriptions for a user.
 */
export async function getUserPushSubscriptions(
  userId: string,
): Promise<Array<{ endpoint: string; keys_p256dh: string; keys_auth: string }>> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error != null) {
    logError(`Failed to fetch push subscriptions for user ${userId}`, error as unknown as Error)
    return []
  }

  return data ?? []
}
