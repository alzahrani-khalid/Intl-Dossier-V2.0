import { createClient } from '@supabase/supabase-js'
import type { Job } from 'bullmq'
import type { NotificationJobData } from './notification.queue'
import { logInfo, logError } from '../utils/logger'

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
}
