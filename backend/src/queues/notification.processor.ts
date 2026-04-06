import { createClient } from '@supabase/supabase-js'
import type { Job } from 'bullmq'
import type { NotificationJobData } from './notification.queue'
import { logInfo, logError } from '../utils/logger'
import { renderAlertEmailTemplate, mapNotificationTypeToTemplate } from '../services/email-template.service'
import { sendPushNotification, getUserPushSubscriptions } from '../services/push.service'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

/**
 * Process a notification job from the BullMQ queue.
 *
 * 1. Checks user category preferences (in_app_enabled)
 * 2. If enabled (or no preference row exists), calls create_categorized_notification RPC
 * 3. Throws on RPC error to trigger BullMQ retry with exponential backoff
 */
export async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  const { userId, category, type, title, message, priority, actionUrl, sourceType, sourceId, data } =
    job.data

  // Check user preference for this category
  const { data: preference, error: prefError } = await supabase
    .from('notification_category_preferences')
    .select('in_app_enabled')
    .eq('user_id', userId)
    .eq('category', category)
    .single()

  if (prefError !== null && prefError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (no preference set, default to enabled)
    logError(`Failed to check notification preferences for user ${userId}`, prefError as unknown as Error)
  }

  // Skip if user explicitly disabled in-app for this category
  if (preference !== null && preference.in_app_enabled === false) {
    logInfo(`Notification skipped: user ${userId} has in_app_enabled=false for category ${category}`)
    return
  }

  // Call Supabase RPC to create the notification
  const { error: rpcError } = await supabase.rpc('create_categorized_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_category: category,
    p_data: data ?? {},
    p_priority: priority,
    p_action_url: actionUrl ?? null,
    p_source_type: sourceType ?? null,
    p_source_id: sourceId ?? null,
  })

  if (rpcError !== null) {
    logError(`Notification RPC failed for job ${job.id}`, rpcError as unknown as Error)
    throw new Error(`Failed to create notification: ${rpcError.message}`)
  }

  logInfo(`Notification created for user ${userId}: ${title} [job=${job.id}]`)

  // --- Email channel dispatch ---
  // Fire-and-forget: email failure must not block in-app notification
  try {
    // Check if user has email_enabled for this category
    const { data: emailPref, error: emailPrefError } = await supabase
      .from('notification_category_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .eq('category', category)
      .single()

    if (emailPrefError !== null && emailPrefError.code !== 'PGRST116') {
      logError(
        `Failed to check email preferences for user ${userId}`,
        emailPrefError as unknown as Error,
      )
    }

    // Default to enabled if no preference row exists
    if (emailPref !== null && emailPref.email_enabled === false) {
      logInfo(`Email skipped: user ${userId} has email_enabled=false for category ${category}`)
      return
    }

    const { email: userEmail, language } = await getUserEmailAndLanguage(userId)

    const { subject, bodyHtml, bodyText } = renderAlertEmailTemplate(language, {
      title,
      message,
      actionUrl: actionUrl ?? '',
    })

    const emailPriority = priority === 'urgent' ? 1 : priority === 'high' ? 2 : 3

    const { error: insertError } = await supabase.from('email_queue').insert({
      to_email: userEmail,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      template_type: mapNotificationTypeToTemplate(type),
      template_data: { title, message, actionUrl: actionUrl ?? '' },
      language,
      user_id: userId,
      priority: emailPriority,
    })

    if (insertError !== null) {
      logError(
        `Failed to insert email_queue for user ${userId} [job=${job.id}]`,
        insertError as unknown as Error,
      )
    } else {
      logInfo(`Email queued for user ${userId}: ${title} [job=${job.id}]`)
    }
  } catch (emailError) {
    logError(
      `Email dispatch failed for user ${userId} [job=${job.id}]`,
      emailError instanceof Error ? emailError : new Error(String(emailError)),
    )
  }

  // --- Push notification channel dispatch ---
  // Fire-and-forget: push failure must not block in-app or email notifications
  try {
    // Check if user has push_enabled for this category
    const { data: pushPref, error: pushPrefError } = await supabase
      .from('notification_category_preferences')
      .select('push_enabled')
      .eq('user_id', userId)
      .eq('category', category)
      .single()

    if (pushPrefError !== null && pushPrefError.code !== 'PGRST116') {
      logError(
        `Failed to check push preferences for user ${userId}`,
        pushPrefError as unknown as Error,
      )
    }

    // Default to enabled if no preference row exists
    if (pushPref !== null && pushPref.push_enabled === false) {
      logInfo(`Push skipped: user ${userId} has push_enabled=false for category ${category}`)
      return
    }

    // Get user language for RTL-aware push payloads (reuse from email or fetch fresh)
    let userLanguage: 'ar' | 'en' = 'en'
    try {
      const result = await getUserEmailAndLanguage(userId)
      userLanguage = result.language
    } catch {
      // Language fetch failure is non-fatal for push; default to 'en'
    }

    const subscriptions = await getUserPushSubscriptions(userId)

    if (subscriptions.length > 0) {
      const pushPayload = {
        title,
        body: message,
        url: actionUrl ?? '/',
        dir: userLanguage === 'ar' ? 'rtl' as const : 'ltr' as const,
        lang: userLanguage,
      }

      await Promise.allSettled(
        subscriptions.map((sub) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
            pushPayload,
          ),
        ),
      )

      logInfo(`Push notifications sent to ${subscriptions.length} subscription(s) for user ${userId} [job=${job.id}]`)
    }
  } catch (pushError) {
    logError(
      `Push dispatch failed for user ${userId} [job=${job.id}]`,
      pushError instanceof Error ? pushError : new Error(String(pushError)),
    )
  }
}

/**
 * Get user email and language preference.
 * Queries only needed fields to avoid information disclosure (T-16-02).
 */
async function getUserEmailAndLanguage(
  userId: string,
): Promise<{ email: string; language: 'ar' | 'en' }> {
  // Get email from auth.users via admin API
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

  if (userError !== null || userData?.user?.email == null) {
    throw new Error(`Cannot retrieve email for user ${userId}`)
  }

  // Get language preference (default to 'en')
  const { data: prefData } = await supabase
    .from('user_preferences')
    .select('language')
    .eq('user_id', userId)
    .single()

  const language: 'ar' | 'en' =
    prefData?.language === 'ar' ? 'ar' : 'en'

  return { email: userData.user.email, language }
}
