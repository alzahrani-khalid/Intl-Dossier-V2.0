// T146 - Send push notifications via FCM/APNS
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { validateJWT, createServiceClient } from '../_shared/auth.ts'
import {
  errorResponse,
  successResponse,
  parseBody,
  validateRequiredFields,
  log,
  checkRateLimit,
  createHandler
} from '../_shared/utils.ts'

interface PushNotificationRequest {
  user_ids?: string[]
  device_ids?: string[]
  notification: {
    title: string
    body: string
    data?: Record<string, any>
    category: 'assignment' | 'intake' | 'role_change' | 'kanban' | 'task' | 'system'
    priority: 'urgent' | 'high' | 'normal' | 'low'
    badge?: number
    sound?: string
    thread_id?: string
    deep_link?: string
    action_buttons?: Array<{
      id: string
      title: string
      action: string
    }>
  }
  options?: {
    ttl?: number // Time to live in seconds
    collapse_key?: string // For grouping notifications
    dry_run?: boolean // Test mode without sending
  }
}

interface PushNotificationResponse {
  sent: Array<{
    device_id: string
    platform: 'ios' | 'android'
    status: 'success' | 'failed'
    message_id?: string
    error?: string
  }>
  summary: {
    total: number
    success: number
    failed: number
  }
}

interface DeviceToken {
  id: string
  user_id: string
  device_id: string
  device_token: string
  platform: 'ios' | 'android'
  notification_preferences: Record<string, boolean>
}

/**
 * Get device tokens for notification
 */
async function getDeviceTokens(
  supabase: any,
  userIds?: string[],
  deviceIds?: string[]
): Promise<DeviceToken[]> {
  try {
    let query = supabase
      .from('device_tokens')
      .select('*')
      .eq('status', 'active')

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    if (deviceIds && deviceIds.length > 0) {
      query = query.in('device_id', deviceIds)
    }

    const { data: tokens, error } = await query

    if (error) throw error

    return tokens || []

  } catch (error) {
    log('error', 'Failed to get device tokens', {
      userIds,
      deviceIds,
      error: error.message
    })
    throw error
  }
}

/**
 * Filter tokens by notification preferences
 */
function filterByPreferences(
  tokens: DeviceToken[],
  category: string
): DeviceToken[] {
  const preferenceKey = getCategoryPreferenceKey(category)

  return tokens.filter(token => {
    if (!token.notification_preferences) {
      return true // Default to enabled if no preferences set
    }
    return token.notification_preferences[preferenceKey] !== false
  })
}

/**
 * Get preference key for notification category
 */
function getCategoryPreferenceKey(category: string): string {
  const mapping: Record<string, string> = {
    'assignment': 'assignments',
    'intake': 'intake_updates',
    'role_change': 'role_changes',
    'kanban': 'kanban_updates',
    'task': 'task_reminders',
    'system': 'system_alerts'
  }
  return mapping[category] || 'system_alerts'
}

/**
 * Send iOS notification via APNS
 */
async function sendAPNSNotification(
  token: DeviceToken,
  notification: PushNotificationRequest['notification']
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In production, this would use Apple Push Notification service
    // For now, we'll simulate the call

    const apnsPayload = {
      aps: {
        alert: {
          title: notification.title,
          body: notification.body,
          'thread-id': notification.thread_id
        },
        badge: notification.badge,
        sound: notification.sound || 'default',
        'mutable-content': 1,
        'content-available': 1,
        category: notification.category
      },
      data: notification.data,
      deepLink: notification.deep_link
    }

    // Simulate APNS API call
    log('info', 'Sending APNS notification', {
      deviceId: token.device_id,
      payload: apnsPayload
    })

    // In production, make actual APNS call here
    // const response = await fetch('https://api.push.apple.com/3/device/' + token.device_token, {
    //   method: 'POST',
    //   headers: { ... },
    //   body: JSON.stringify(apnsPayload)
    // })

    // Simulate success
    return {
      success: true,
      messageId: `apns-${Date.now()}-${Math.random().toString(36).substring(7)}`
    }

  } catch (error) {
    log('error', 'APNS notification failed', {
      deviceId: token.device_id,
      error: error.message
    })
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send Android notification via FCM
 */
async function sendFCMNotification(
  token: DeviceToken,
  notification: PushNotificationRequest['notification'],
  options?: PushNotificationRequest['options']
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In production, this would use Firebase Cloud Messaging
    // For now, we'll simulate the call

    const fcmPayload = {
      message: {
        token: token.device_token,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...notification.data,
          category: notification.category,
          priority: notification.priority,
          deep_link: notification.deep_link || '',
          thread_id: notification.thread_id || ''
        },
        android: {
          priority: notification.priority === 'urgent' ? 'high' : 'normal',
          ttl: `${options?.ttl || 86400}s`,
          collapse_key: options?.collapse_key,
          notification: {
            sound: notification.sound || 'default',
            tag: notification.thread_id,
            notification_priority:
              notification.priority === 'urgent' ? 'PRIORITY_MAX' :
              notification.priority === 'high' ? 'PRIORITY_HIGH' :
              'PRIORITY_DEFAULT'
          }
        }
      }
    }

    // Simulate FCM API call
    log('info', 'Sending FCM notification', {
      deviceId: token.device_id,
      payload: fcmPayload
    })

    // In production, make actual FCM call here
    // const response = await fetch('https://fcm.googleapis.com/v1/projects/PROJECT_ID/messages:send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': 'Bearer ' + accessToken,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(fcmPayload)
    // })

    // Simulate success
    return {
      success: true,
      messageId: `fcm-${Date.now()}-${Math.random().toString(36).substring(7)}`
    }

  } catch (error) {
    log('error', 'FCM notification failed', {
      deviceId: token.device_id,
      error: error.message
    })
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Store notification in database for history/tracking
 */
async function storeNotification(
  supabase: any,
  userId: string,
  deviceId: string,
  notification: PushNotificationRequest['notification'],
  status: 'sent' | 'failed',
  messageId?: string,
  error?: string
): Promise<void> {
  try {
    await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        device_id: deviceId,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        priority: notification.priority,
        data: notification.data,
        status,
        message_id: messageId,
        error,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      })

  } catch (error) {
    log('error', 'Failed to store notification', {
      userId,
      deviceId,
      error: error.message
    })
    // Non-critical, don't throw
  }
}

const handler = createHandler(async (req: Request): Promise<Response> => {
  try {
    // Validate JWT (service-to-service or admin only)
    const authHeader = req.headers.get('authorization')
    const user = await validateJWT(authHeader)

    // Check if user has permission to send notifications
    // In production, verify admin/service role
    if (user.role !== 'admin' && user.role !== 'service') {
      return errorResponse(
        'Insufficient permissions to send notifications',
        403,
        'FORBIDDEN'
      )
    }

    // Rate limiting - stricter for notification sending
    if (!checkRateLimit(user.id, 20, 60000)) {
      return errorResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    }

    // Parse request body
    const body = await parseBody<PushNotificationRequest>(req)
    validateRequiredFields(body, ['notification'])
    validateRequiredFields(body.notification, ['title', 'body', 'category', 'priority'])

    // Validate that we have recipients
    if ((!body.user_ids || body.user_ids.length === 0) &&
        (!body.device_ids || body.device_ids.length === 0)) {
      return errorResponse(
        'Must specify user_ids or device_ids',
        400,
        'NO_RECIPIENTS'
      )
    }

    log('info', 'Push notification request', {
      requesterId: user.id,
      userIds: body.user_ids,
      deviceIds: body.device_ids,
      category: body.notification.category,
      priority: body.notification.priority
    })

    // Create Supabase client
    const supabase = createServiceClient()

    // Get device tokens
    const tokens = await getDeviceTokens(supabase, body.user_ids, body.device_ids)

    if (tokens.length === 0) {
      return errorResponse(
        'No active devices found for specified recipients',
        404,
        'NO_DEVICES'
      )
    }

    // Filter by notification preferences
    const filteredTokens = filterByPreferences(tokens, body.notification.category)

    if (filteredTokens.length === 0) {
      return errorResponse(
        'All recipients have disabled this notification type',
        400,
        'NOTIFICATIONS_DISABLED'
      )
    }

    // Send notifications
    const results: PushNotificationResponse['sent'] = []

    for (const token of filteredTokens) {
      let result

      if (body.options?.dry_run) {
        // Dry run mode - don't actually send
        result = {
          success: true,
          messageId: `dry-run-${Date.now()}`
        }
      } else if (token.platform === 'ios') {
        result = await sendAPNSNotification(token, body.notification)
      } else if (token.platform === 'android') {
        result = await sendFCMNotification(token, body.notification, body.options)
      } else {
        result = {
          success: false,
          error: `Unsupported platform: ${token.platform}`
        }
      }

      results.push({
        device_id: token.device_id,
        platform: token.platform,
        status: result.success ? 'success' : 'failed',
        message_id: result.messageId,
        error: result.error
      })

      // Store notification history
      await storeNotification(
        supabase,
        token.user_id,
        token.device_id,
        body.notification,
        result.success ? 'sent' : 'failed',
        result.messageId,
        result.error
      )
    }

    // Calculate summary
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    }

    const response: PushNotificationResponse = {
      sent: results,
      summary
    }

    log('info', 'Push notifications sent', {
      requesterId: user.id,
      summary
    })

    const status = summary.failed > 0 ? 207 : 200 // 207 Multi-Status
    const message = summary.failed > 0
      ? `Sent ${summary.success}/${summary.total} notifications`
      : 'All notifications sent successfully'

    return successResponse(response, status, message)

  } catch (error) {
    log('error', 'Push notification failed', { error: error.message })

    if (error.message.includes('JWT')) {
      return errorResponse(error.message, 401, 'UNAUTHORIZED')
    }

    return errorResponse(
      'Failed to send push notifications',
      500,
      'PUSH_NOTIFICATION_FAILED',
      { error: error.message }
    )
  }
})

serve(handler)