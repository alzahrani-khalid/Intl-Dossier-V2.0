import { createClient } from '@supabase/supabase-js'
import { notificationQueue } from './notification.queue'
import {
  renderDailyDigestTemplate,
  renderWeeklyDigestTemplate,
} from '../services/digest-template.service'
import type { DigestContent } from '../services/digest-template.service'
import { logInfo, logError } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

/** Maximum users processed per scheduler run to avoid overwhelming email_queue (T-16-04). */
const BATCH_SIZE = 50

interface DigestUserRow {
  user_id: string
  daily_digest_time: string | null
  weekly_digest_day: number | null
  quiet_hours_timezone: string | null
}

interface UserPreferenceRow {
  language: string | null
}

/**
 * Convert a local time (HH:MM) in a given timezone to UTC hour.
 * Returns the UTC hour (0-23) that corresponds to the given local time.
 */
function getUtcHourForLocalTime(localTime: string, timezone: string): number {
  try {
    // Parse HH:MM
    const [hoursPart] = localTime.split(':').map(Number)
    const hours = hoursPart ?? 0

    // Create a reference date in the user's timezone
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    // Use Intl.DateTimeFormat to get the timezone offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })

    // Create date assuming UTC, then find what UTC hour maps to the local hour
    const testDate = new Date(`${dateStr}T12:00:00Z`)
    const localHour = Number(formatter.format(testDate))
    const offset = localHour - 12 // offset in hours from UTC

    // Target UTC hour = local hour - offset
    let utcHour = hours - offset
    if (utcHour < 0) utcHour += 24
    if (utcHour >= 24) utcHour -= 24

    return utcHour
  } catch {
    // Fallback: assume UTC if timezone conversion fails
    const [hoursPart] = localTime.split(':').map(Number)
    return hoursPart ?? 0
  }
}

/**
 * Process daily digest jobs.
 *
 * Runs hourly. For each user with daily digest enabled:
 * 1. Check if current UTC hour matches their configured delivery time (in their timezone)
 * 2. Fetch digest content via get_user_digest_content() RPC
 * 3. Render bilingual template
 * 4. Insert into email_queue
 */
async function processDailyDigests(): Promise<void> {
  const currentUtcHour = new Date().getUTCHours()

  // Query users with daily digest enabled
  const { data: users, error: queryError } = await supabase
    .from('email_notification_preferences')
    .select('user_id, daily_digest_time, quiet_hours_timezone')
    .eq('digest_frequency', 'daily')
    .not('daily_digest_time', 'is', null)
    .limit(BATCH_SIZE)

  if (queryError !== null) {
    logError('Daily digest: failed to query users', queryError as unknown as Error)
    return
  }

  if (users === null || users.length === 0) {
    logInfo('Daily digest: no users with daily digest enabled')
    return
  }

  let processed = 0

  for (const user of users as DigestUserRow[]) {
    try {
      // Check if current hour matches user's configured time in their timezone
      const timezone = user.quiet_hours_timezone ?? 'UTC'
      const localTime = user.daily_digest_time ?? '08:00'
      const targetUtcHour = getUtcHourForLocalTime(localTime, timezone)

      if (targetUtcHour !== currentUtcHour) {
        continue
      }

      // Fetch digest content
      const { data: content, error: rpcError } = await supabase.rpc('get_user_digest_content', {
        p_user_id: user.user_id,
      })

      if (rpcError !== null) {
        logError(`Daily digest: RPC failed for user ${user.user_id}`, rpcError as unknown as Error)
        continue
      }

      // Get user language preference
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', user.user_id)
        .single()

      const language = ((prefs as UserPreferenceRow | null)?.language === 'ar' ? 'ar' : 'en') as
        | 'ar'
        | 'en'
      const today = new Date().toISOString().split('T')[0] ?? ''
      const digestContent = content as DigestContent

      // Render template
      const { subject, bodyHtml, bodyText } = renderDailyDigestTemplate(
        language,
        today,
        digestContent,
      )

      // Get user email
      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      const email = authUser?.user?.email

      if (email == null) {
        logError(
          `Daily digest: no email found for user ${user.user_id}`,
          new Error('Missing email'),
        )
        continue
      }

      // Insert into email_queue (do not log digest content per T-16-05)
      const { error: insertError } = await supabase.from('email_queue').insert({
        to_email: email,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        template_type: 'digest_daily',
        template_data: {},
        language,
        user_id: user.user_id,
        priority: 5,
        status: 'pending',
      })

      if (insertError !== null) {
        logError(
          `Daily digest: failed to insert email for user ${user.user_id}`,
          insertError as unknown as Error,
        )
        continue
      }

      processed++
    } catch (err) {
      logError(`Daily digest: error processing user ${user.user_id}`, err as Error)
    }
  }

  logInfo(`Daily digest: processed ${processed} users`)
}

/**
 * Process weekly digest jobs.
 *
 * Runs daily. For each user with weekly digest enabled whose configured day matches today:
 * 1. Check if current day of week matches their weekly_digest_day
 * 2. Fetch digest content via get_user_digest_content() RPC
 * 3. Render bilingual template
 * 4. Insert into email_queue
 */
async function processWeeklyDigests(): Promise<void> {
  const currentDay = new Date().getUTCDay() // 0=Sunday

  // Query users with weekly digest enabled on today's day
  const { data: users, error: queryError } = await supabase
    .from('email_notification_preferences')
    .select('user_id, weekly_digest_day, quiet_hours_timezone, daily_digest_time')
    .eq('digest_frequency', 'weekly')
    .eq('weekly_digest_day', currentDay)
    .limit(BATCH_SIZE)

  if (queryError !== null) {
    logError('Weekly digest: failed to query users', queryError as unknown as Error)
    return
  }

  if (users === null || users.length === 0) {
    logInfo('Weekly digest: no users scheduled for today')
    return
  }

  let processed = 0

  for (const user of users as DigestUserRow[]) {
    try {
      // Fetch digest content
      const { data: content, error: rpcError } = await supabase.rpc('get_user_digest_content', {
        p_user_id: user.user_id,
      })

      if (rpcError !== null) {
        logError(`Weekly digest: RPC failed for user ${user.user_id}`, rpcError as unknown as Error)
        continue
      }

      // Get user language preference
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', user.user_id)
        .single()

      const language = ((prefs as UserPreferenceRow | null)?.language === 'ar' ? 'ar' : 'en') as
        | 'ar'
        | 'en'
      const digestContent = content as DigestContent

      // Build date range string
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const formatDate = (d: Date): string => {
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ]
        return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
      }
      const dateRange = `${formatDate(weekAgo)} - ${formatDate(now)}`

      // Render template
      const { subject, bodyHtml, bodyText } = renderWeeklyDigestTemplate(
        language,
        dateRange,
        digestContent,
      )

      // Get user email
      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      const email = authUser?.user?.email

      if (email == null) {
        logError(
          `Weekly digest: no email found for user ${user.user_id}`,
          new Error('Missing email'),
        )
        continue
      }

      // Insert into email_queue (do not log digest content per T-16-05)
      const { error: insertError } = await supabase.from('email_queue').insert({
        to_email: email,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        template_type: 'digest_weekly',
        template_data: {},
        language,
        user_id: user.user_id,
        priority: 5,
        status: 'pending',
      })

      if (insertError !== null) {
        logError(
          `Weekly digest: failed to insert email for user ${user.user_id}`,
          insertError as unknown as Error,
        )
        continue
      }

      processed++
    } catch (err) {
      logError(`Weekly digest: error processing user ${user.user_id}`, err as Error)
    }
  }

  logInfo(`Weekly digest: processed ${processed} users`)
}

/**
 * Process a digest job based on job name.
 */
export async function processDigestJob(jobName: string): Promise<void> {
  if (jobName === 'process-daily-digests') {
    await processDailyDigests()
  } else if (jobName === 'process-weekly-digests') {
    await processWeeklyDigests()
  } else {
    logError(`Unknown digest job: ${jobName}`, new Error(`Unknown job name: ${jobName}`))
  }
}

/**
 * Register the digest schedulers as repeatable BullMQ jobs.
 *
 * - Daily digest processor: runs every hour (checks user timezone match)
 * - Weekly digest processor: runs every 24 hours (checks day-of-week match)
 */
export async function registerDigestScheduler(): Promise<void> {
  await notificationQueue.add('process-daily-digests', {} as never, {
    repeat: { every: 60 * 60 * 1000 },
    jobId: 'daily-digest-processor',
  })

  await notificationQueue.add('process-weekly-digests', {} as never, {
    repeat: { every: 24 * 60 * 60 * 1000 },
    jobId: 'weekly-digest-processor',
  })

  logInfo('Digest schedulers registered')
}
