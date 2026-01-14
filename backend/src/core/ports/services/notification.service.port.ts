/**
 * Notification Service Port
 *
 * Defines the contract for sending notifications across different channels.
 * Adapters can implement email, push, SMS, or in-app notifications.
 */

/**
 * Notification recipient
 */
export interface NotificationRecipient {
  id: string
  email?: string
  phone?: string
  deviceTokens?: string[]
}

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, unknown>
  imageUrl?: string
  actionUrl?: string
}

/**
 * Notification channel types
 */
export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app'

/**
 * Notification send options
 */
export interface NotificationOptions {
  channels: NotificationChannel[]
  priority?: 'low' | 'normal' | 'high'
  scheduledAt?: Date
  expiresAt?: Date
  templateId?: string
  templateVars?: Record<string, unknown>
}

/**
 * Notification send result
 */
export interface NotificationResult {
  success: boolean
  messageId?: string
  channel: NotificationChannel
  error?: string
}

/**
 * Notification Service Port
 *
 * Contract for notification delivery. Implementations can use
 * various providers (SendGrid, FCM, Twilio, etc.)
 */
export interface INotificationService {
  /**
   * Send notification to a single recipient
   */
  send(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    options: NotificationOptions,
  ): Promise<NotificationResult[]>

  /**
   * Send notification to multiple recipients
   */
  sendBulk(
    recipients: NotificationRecipient[],
    payload: NotificationPayload,
    options: NotificationOptions,
  ): Promise<Map<string, NotificationResult[]>>

  /**
   * Send notification using a template
   */
  sendTemplate(
    recipient: NotificationRecipient,
    templateId: string,
    variables: Record<string, unknown>,
    options: Omit<NotificationOptions, 'templateId' | 'templateVars'>,
  ): Promise<NotificationResult[]>

  /**
   * Schedule a notification for later delivery
   */
  schedule(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    scheduledAt: Date,
    options: Omit<NotificationOptions, 'scheduledAt'>,
  ): Promise<string> // Returns scheduled job ID

  /**
   * Cancel a scheduled notification
   */
  cancelScheduled(jobId: string): Promise<boolean>

  /**
   * Check if a channel is available for a recipient
   */
  isChannelAvailable(recipient: NotificationRecipient, channel: NotificationChannel): boolean
}
