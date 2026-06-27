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

/** Bounded concurrency for per-user digest rendering (content RPC + auth email lookup). */
const DIGEST_RENDER_CONCURRENCY = 8

interface DigestUserRow {
  user_id: string
  daily_digest_time: string | null
  weekly_digest_day: number | null
  quiet_hours_timezone: string | null
}

interface EmailQueueInsertRow {
  to_email: string
  subject: string
  body_html: string
  body_text: string
  template_type: 'digest_daily' | 'digest_weekly'
  template_data: Record<string, unknown>
  language: 'ar' | 'en'
  user_id: string
  priority: number
  status: 'pending'
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
    const dateStr = now.toISOString().split('T')[0] ?? '1970-01-01'

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
 * Map over items with bounded concurrency, preserving input order in the results.
 * Parallelizes the per-user content RPC + auth email lookup + render that previously
 * ran in a serial loop (PERF-03).
 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  const runWorker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index] as T)
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))

  return results
}

/**
 * Batch the per-user language preference lookups into a single query keyed by user id
 * (PERF-03). Users without a preference row default to 'en' at the call site.
 */
async function fetchLanguageByUser(userIds: string[]): Promise<Map<string, 'ar' | 'en'>> {
  const languageByUser = new Map<string, 'ar' | 'en'>()

  if (userIds.length === 0) {
    return languageByUser
  }

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_id, language')
    .in('user_id', userIds)

  const prefRows = (prefs as Array<{ user_id: string; language: string | null }> | null) ?? []
  for (const pref of prefRows) {
    languageByUser.set(pref.user_id, pref.language === 'ar' ? 'ar' : 'en')
  }

  return languageByUser
}

/**
 * Bulk-insert the rendered digest rows in a single round trip (PERF-03). Returns the
 * number of rows queued. Digest content is never logged (T-16-05).
 */
async function insertDigestEmails(label: string, rows: EmailQueueInsertRow[]): Promise<number> {
  if (rows.length === 0) {
    return 0
  }

  const { error: insertError } = await supabase.from('email_queue').insert(rows)

  if (insertError !== null) {
    logError(`${label}: failed to insert ${rows.length} emails`, insertError as unknown as Error)
    return 0
  }

  return rows.length
}

/**
 * Build the "MMM D - MMM D" range string covering the trailing week.
 */
function buildWeeklyDateRange(): string {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
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
  const formatDate = (d: Date): string => `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
  return `${formatDate(weekAgo)} - ${formatDate(now)}`
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
    .eq('daily_digest_enabled', true)
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

  // Only users whose configured local delivery time maps to the current UTC hour.
  const dueUsers = (users as DigestUserRow[]).filter((user) => {
    const timezone = user.quiet_hours_timezone ?? 'UTC'
    const localTime = user.daily_digest_time ?? '08:00'
    return getUtcHourForLocalTime(localTime, timezone) === currentUtcHour
  })

  if (dueUsers.length === 0) {
    logInfo('Daily digest: no users scheduled for the current hour')
    return
  }

  // Batch the language lookups, then render each due user's digest with bounded
  // concurrency (content RPC + auth email lookup) and bulk-insert the queued rows.
  const languageByUser = await fetchLanguageByUser(dueUsers.map((user) => user.user_id))
  const today = new Date().toISOString().split('T')[0] ?? ''

  const rows = (
    await mapWithConcurrency(
      dueUsers,
      DIGEST_RENDER_CONCURRENCY,
      async (user): Promise<EmailQueueInsertRow | null> => {
        const { data: content, error: rpcError } = await supabase.rpc('get_user_digest_content', {
          p_user_id: user.user_id,
        })

        if (rpcError !== null) {
          logError(
            `Daily digest: RPC failed for user ${user.user_id}`,
            rpcError as unknown as Error,
          )
          return null
        }

        const language = languageByUser.get(user.user_id) ?? 'en'
        const digestContent = content as DigestContent

        const { subject, bodyHtml, bodyText } = renderDailyDigestTemplate(
          language,
          today,
          digestContent,
        )

        const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
        const email = authUser?.user?.email

        if (email == null) {
          logError(
            `Daily digest: no email found for user ${user.user_id}`,
            new Error('Missing email'),
          )
          return null
        }

        // do not log digest content per T-16-05
        return {
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
        }
      },
    )
  ).filter((row): row is EmailQueueInsertRow => row !== null)

  const processed = await insertDigestEmails('Daily digest', rows)
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
    .eq('weekly_digest_enabled', true)
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

  const weeklyUsers = users as DigestUserRow[]

  // Batch the language lookups, then render each user's digest with bounded concurrency
  // (content RPC + auth email lookup) and bulk-insert the queued rows.
  const languageByUser = await fetchLanguageByUser(weeklyUsers.map((user) => user.user_id))
  const dateRange = buildWeeklyDateRange()

  const rows = (
    await mapWithConcurrency(
      weeklyUsers,
      DIGEST_RENDER_CONCURRENCY,
      async (user): Promise<EmailQueueInsertRow | null> => {
        const { data: content, error: rpcError } = await supabase.rpc('get_user_digest_content', {
          p_user_id: user.user_id,
        })

        if (rpcError !== null) {
          logError(
            `Weekly digest: RPC failed for user ${user.user_id}`,
            rpcError as unknown as Error,
          )
          return null
        }

        const language = languageByUser.get(user.user_id) ?? 'en'
        const digestContent = content as DigestContent

        const { subject, bodyHtml, bodyText } = renderWeeklyDigestTemplate(
          language,
          dateRange,
          digestContent,
        )

        const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
        const email = authUser?.user?.email

        if (email == null) {
          logError(
            `Weekly digest: no email found for user ${user.user_id}`,
            new Error('Missing email'),
          )
          return null
        }

        // do not log digest content per T-16-05
        return {
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
        }
      },
    )
  ).filter((row): row is EmailQueueInsertRow => row !== null)

  const processed = await insertDigestEmails('Weekly digest', rows)
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
  // Idempotent by scheduler id (see registerDeadlineChecker) — avoids duplicate
  // repeatable jobs across tsx-watch reloads.
  await notificationQueue.upsertJobScheduler(
    'daily-digest-processor',
    { every: 60 * 60 * 1000 },
    { name: 'process-daily-digests' },
  )

  await notificationQueue.upsertJobScheduler(
    'weekly-digest-processor',
    { every: 24 * 60 * 60 * 1000 },
    { name: 'process-weekly-digests' },
  )

  logInfo('Digest schedulers registered')
}
