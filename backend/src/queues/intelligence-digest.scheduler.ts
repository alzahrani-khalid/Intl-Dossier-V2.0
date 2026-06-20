import { supabaseAdmin } from '../config/supabase'
import {
  dispatchDigestToChannels,
  generateDigestForSubscriber,
  normalizeChannels,
  publishDigestRow,
  renderDigestPayload,
  type DigestFrequency,
  type DigestSubscription,
} from '../services/intelligence-digest.service'
import { logError, logInfo } from '../utils/logger'

const BATCH_SIZE = 100

interface ProfileRow {
  clearance_level: number | null
}

interface UserPreferenceRow {
  language: string | null
}

function periodWindow(frequency: DigestFrequency, now = new Date()) {
  const until = now
  const since = new Date(now)

  if (frequency === 'daily') {
    since.setUTCDate(since.getUTCDate() - 1)
  } else if (frequency === 'weekly') {
    since.setUTCDate(since.getUTCDate() - 7)
  } else {
    since.setUTCMonth(since.getUTCMonth() - 1)
  }

  const start = since.toISOString().split('T')[0] ?? since.toISOString()
  const end = until.toISOString().split('T')[0] ?? until.toISOString()
  return { since, until, period: `${frequency}:${start}:${end}` }
}

function shouldRunMonthly(subscription: DigestSubscription, now = new Date()): boolean {
  const configured = Number(subscription.frequency_config?.day_of_month ?? 1)
  const dayOfMonth = Math.min(Math.max(Number.isFinite(configured) ? configured : 1, 1), 28)
  return now.getUTCDate() === dayOfMonth
}

async function listActiveSubscriptions(frequency: DigestFrequency): Promise<DigestSubscription[]> {
  const { data, error } = await supabaseAdmin
    .from('intelligence_digest_subscriptions')
    .select('*')
    .eq('frequency', frequency)
    .eq('is_active', true)
    .limit(BATCH_SIZE)

  if (error != null) throw error
  return (data ?? []) as DigestSubscription[]
}

async function getSubscriberProfile(subscriberId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('clearance_level')
    .eq('user_id', subscriberId)
    .maybeSingle()

  if (error != null) throw error
  return data as ProfileRow | null
}

async function getSubscriberLanguage(subscriberId: string): Promise<'en' | 'ar'> {
  const { data } = await supabaseAdmin
    .from('user_preferences')
    .select('language')
    .eq('user_id', subscriberId)
    .maybeSingle()

  return ((data as UserPreferenceRow | null)?.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
}

async function getSubscriberEmail(subscriberId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(subscriberId)
  if (error != null) throw error
  return data.user?.email ?? null
}

async function processSubscription(
  subscription: DigestSubscription,
  frequency: DigestFrequency,
): Promise<boolean> {
  const profile = await getSubscriberProfile(subscription.subscriber_id)
  if (profile == null) {
    logInfo('Intelligence digest subscriber deprovisioned, skipping', {
      subscriberId: subscription.subscriber_id,
    })
    return false
  }

  const clearanceLevel = profile.clearance_level ?? 1
  const { since, until, period } = periodWindow(frequency)
  const [content, language, email] = await Promise.all([
    generateDigestForSubscriber(subscription, since, until, clearanceLevel),
    getSubscriberLanguage(subscription.subscriber_id),
    getSubscriberEmail(subscription.subscriber_id),
  ])

  if (email == null) {
    logInfo('Intelligence digest subscriber missing email, skipping', {
      subscriberId: subscription.subscriber_id,
    })
    return false
  }

  const rendered = renderDigestPayload(frequency, language, since, until, content)
  const digestId = await publishDigestRow({
    organizationId: subscription.organization_id,
    subscriberId: subscription.subscriber_id,
    dossierId: subscription.dossier_id,
    dossierType: subscription.dossier_type,
    frequency,
    periodStart: since,
    periodEnd: until,
    period,
    summary: rendered.summary,
    clearanceLevel,
  })

  if (digestId == null) return false

  await dispatchDigestToChannels(
    { id: subscription.subscriber_id, email, language },
    normalizeChannels(subscription.frequency_config),
    { ...rendered, digestId, dossierId: subscription.dossier_id },
  )

  return true
}

export async function processIntelligenceDigests(frequency: DigestFrequency): Promise<void> {
  const subscriptions = await listActiveSubscriptions(frequency)
  let processed = 0

  for (const subscription of subscriptions) {
    if (frequency === 'monthly' && !shouldRunMonthly(subscription)) continue

    try {
      if (await processSubscription(subscription, frequency)) processed++
    } catch (err) {
      logError('Intelligence digest subscriber processing failed', err as Error, {
        subscriberId: subscription.subscriber_id,
        dossierId: subscription.dossier_id,
        frequency,
      })
    }
  }

  logInfo('Intelligence digest run completed', { frequency, processed })
}

export async function processIntelligenceDailyDigests(): Promise<void> {
  await processIntelligenceDigests('daily')
}

export async function processIntelligenceWeeklyDigests(): Promise<void> {
  await processIntelligenceDigests('weekly')
}

export async function processIntelligenceMonthlyDigests(): Promise<void> {
  await processIntelligenceDigests('monthly')
}

export async function processIntelligenceDigestJob(jobName: string): Promise<void> {
  if (jobName === 'process-intelligence-digests-daily') {
    await processIntelligenceDailyDigests()
  } else if (jobName === 'process-intelligence-digests-weekly') {
    await processIntelligenceWeeklyDigests()
  } else if (jobName === 'process-intelligence-digests-monthly') {
    await processIntelligenceMonthlyDigests()
  } else {
    throw new Error(`Unknown intelligence digest job: ${jobName}`)
  }
}

export async function registerIntelligenceDigestScheduler(): Promise<void> {
  const { notificationQueue } = await import('./notification.queue')

  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-daily',
    { every: 60 * 60 * 1000 },
    { name: 'process-intelligence-digests-daily' },
  )

  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-weekly',
    { every: 24 * 60 * 60 * 1000 },
    { name: 'process-intelligence-digests-weekly' },
  )

  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-monthly',
    { every: 24 * 60 * 60 * 1000 },
    { name: 'process-intelligence-digests-monthly' },
  )

  logInfo('Intelligence digest schedulers registered')
}
