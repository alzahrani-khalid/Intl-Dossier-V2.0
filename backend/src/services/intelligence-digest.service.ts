import { supabaseAdmin } from '../config/supabase'
import {
  renderDailyDigestTemplate,
  renderWeeklyDigestTemplate,
  type DigestContent,
} from './digest-template.service'
import type {
  ChannelAdapter,
  IntelligenceDeliveryPayload,
} from '../adapters/intelligence/ChannelAdapter'
import { logInfo } from '../utils/logger'

export type DigestFrequency = 'daily' | 'weekly' | 'monthly'
export type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
export type IntelligenceChannel = 'in_app' | 'smtp' | 'webhook'

export interface DigestFrequencyConfig {
  channels?: IntelligenceChannel[]
  day_of_month?: number
}

export interface DigestSubscription {
  id: string
  organization_id: string
  subscriber_id: string
  dossier_id: string
  dossier_type: DossierType
  frequency: DigestFrequency
  frequency_config: DigestFrequencyConfig
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface SubscribeToDigestInput {
  organization_id: string
  subscriber_id: string
  dossier_id: string
  dossier_type: DossierType
  frequency: DigestFrequency
  frequency_config?: DigestFrequencyConfig
}

export interface DigestRenderPayload {
  subject: string
  bodyHtml: string
  bodyText: string
  summary: string
}

export interface PublishDigestInput {
  organizationId: string
  subscriberId: string
  dossierId: string
  dossierType: DossierType
  frequency: DigestFrequency
  periodStart: Date
  periodEnd: Date
  period: string
  summary: string
  clearanceLevel: number
}

export interface DigestSubscriber {
  id: string
  email: string
  language: 'en' | 'ar'
}

interface GenerateDigestContentResult {
  signals?: Array<Record<string, unknown>>
  engagements?: Array<Record<string, unknown>>
  commitments_due?: Array<Record<string, unknown>>
  status_changes?: Array<Record<string, unknown>>
}

const channelNames = new Set<IntelligenceChannel>(['in_app', 'smtp', 'webhook'])

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function dateOnly(value: unknown): string {
  const raw = text(value)
  if (raw.length === 0) return ''
  return raw.split('T')[0] ?? raw
}

function toDigestContent(raw: unknown): DigestContent {
  const content = (raw ?? {}) as GenerateDigestContentResult
  const signals = toArray(content.signals)
  const engagements = toArray(content.engagements)
  const commitments = toArray(content.commitments_due)
  const statusChanges = toArray(content.status_changes)

  return {
    watchlist_items: signals.map((signal) => ({
      name: text(signal.title, 'Intelligence signal'),
      type: text(signal.severity, text(signal.category, 'signal')),
    })),
    upcoming_deadlines: commitments.map((commitment) => ({
      title: text(commitment.title, text(commitment.title_ar, 'Commitment due')),
      deadline: dateOnly(commitment.due_date),
    })),
    pending_assignments: engagements.map((engagement) => ({
      title: text(engagement.name_en, text(engagement.name_ar, 'Engagement update')),
      assignee: text(engagement.engagement_status, text(engagement.lifecycle_stage, 'Unassigned')),
    })),
    active_commitments: statusChanges.map((statusChange) => ({
      title: text(statusChange.name_en, text(statusChange.name_ar, 'Dossier status update')),
      status: text(statusChange.status, 'updated'),
    })),
    recent_notifications: signals.map((signal) => ({
      title: text(signal.title, 'Intelligence signal'),
      created_at: dateOnly(signal.occurred_at),
    })),
  }
}

function summarize(content: DigestContent): string {
  const parts = [
    ...content.watchlist_items.map((item) => item.name),
    ...content.upcoming_deadlines.map((item) => item.title),
    ...content.pending_assignments.map((item) => item.title),
    ...content.active_commitments.map((item) => item.title),
  ]

  if (parts.length === 0) return 'No intelligence updates for this period.'
  return parts.join('\n')
}

function periodLabel(frequency: DigestFrequency, since: Date, until: Date): string {
  if (frequency === 'daily') return until.toISOString().split('T')[0] ?? until.toISOString()
  const start = since.toISOString().split('T')[0] ?? since.toISOString()
  const end = until.toISOString().split('T')[0] ?? until.toISOString()
  return `${start} - ${end}`
}

export function renderDigestPayload(
  frequency: DigestFrequency,
  language: 'en' | 'ar',
  since: Date,
  until: Date,
  rawContent: unknown,
): DigestRenderPayload {
  const content = toDigestContent(rawContent)
  const label = periodLabel(frequency, since, until)
  const rendered =
    frequency === 'daily'
      ? renderDailyDigestTemplate(language, label, content)
      : renderWeeklyDigestTemplate(language, label, content)

  return {
    ...rendered,
    summary: summarize(content),
  }
}

export function normalizeChannels(config?: DigestFrequencyConfig): IntelligenceChannel[] {
  const channels = Array.isArray(config?.channels) ? config.channels : ['in_app']
  const valid = channels.filter((channel): channel is IntelligenceChannel =>
    channelNames.has(channel),
  )
  return valid.length > 0 ? valid : ['in_app']
}

async function getChannelAdapters(): Promise<Record<IntelligenceChannel, ChannelAdapter>> {
  const [{ inAppAdapter }, { smtpAdapter }, { webhookAdapter }] = await Promise.all([
    import('../adapters/intelligence/in-app-adapter'),
    import('../adapters/intelligence/smtp-adapter'),
    import('../adapters/intelligence/webhook-adapter'),
  ])

  return {
    in_app: inAppAdapter,
    smtp: smtpAdapter,
    webhook: webhookAdapter,
  }
}

export async function listSubscriptions(subscriberId: string): Promise<DigestSubscription[]> {
  const { data, error } = await supabaseAdmin
    .from('intelligence_digest_subscriptions')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error != null) throw error
  return (data ?? []) as DigestSubscription[]
}

export async function subscribeToDigest(
  input: SubscribeToDigestInput,
): Promise<DigestSubscription> {
  const row = {
    organization_id: input.organization_id,
    subscriber_id: input.subscriber_id,
    dossier_id: input.dossier_id,
    dossier_type: input.dossier_type,
    frequency: input.frequency,
    frequency_config: input.frequency_config ?? { channels: ['in_app'] },
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('intelligence_digest_subscriptions')
    .upsert(row, { onConflict: 'subscriber_id,dossier_id,frequency' })
    .select()
    .single()

  if (error != null) throw error
  return data as DigestSubscription
}

export async function unsubscribeFromDigest(
  subscriberId: string,
  dossierId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('intelligence_digest_subscriptions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('subscriber_id', subscriberId)
    .eq('dossier_id', dossierId)

  if (error != null) throw error
}

export async function generateDigestForSubscriber(
  subscription: Pick<DigestSubscription, 'dossier_id'>,
  since: Date,
  until: Date,
  clearanceLevel: number,
): Promise<unknown> {
  const { data, error } = await supabaseAdmin.rpc('generate_digest_content', {
    p_dossier_id: subscription.dossier_id,
    p_since: since.toISOString(),
    p_until: until.toISOString(),
    p_clearance_level: clearanceLevel,
  })

  if (error != null) throw error
  return data
}

export async function publishDigestRow(input: PublishDigestInput): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('intelligence_digest')
    .insert({
      organization_id: input.organizationId,
      dossier_type: input.dossierType,
      dossier_id: input.dossierId,
      period_start: input.periodStart.toISOString(),
      period_end: input.periodEnd.toISOString(),
      summary: input.summary,
      generated_by: input.subscriberId,
      generated_at: new Date().toISOString(),
      subscriber_id: input.subscriberId,
      frequency: input.frequency,
      published_at: new Date().toISOString(),
      clearance_level_at_generation: input.clearanceLevel,
      period: input.period,
    })
    .select('id')
    .single()

  if (error != null) {
    if ((error as { code?: string }).code === '23505') {
      logInfo('Duplicate intelligence digest skipped', {
        subscriberId: input.subscriberId,
        dossierId: input.dossierId,
        frequency: input.frequency,
        period: input.period,
      })
      return null
    }
    throw error
  }

  return (data as { id: string } | null)?.id ?? null
}

export async function dispatchDigestToChannels(
  subscriber: DigestSubscriber,
  channels: IntelligenceChannel[],
  payload: DigestRenderPayload & { digestId: string | null; dossierId: string },
): Promise<void> {
  const adapters = await getChannelAdapters()
  const deliveryPayload: IntelligenceDeliveryPayload = {
    recipientId: subscriber.id,
    recipientEmail: subscriber.email,
    recipientLanguage: subscriber.language,
    type: 'digest',
    subject: payload.subject,
    bodyHtml: payload.bodyHtml,
    bodyText: payload.bodyText,
    deepLink: `/intelligence/digests/${payload.digestId ?? payload.dossierId}`,
    genericLabel: 'New intelligence digest available',
  }

  for (const channel of channels) {
    await adapters[channel].send(deliveryPayload)
  }
}
