import { Client } from 'pg'
import { notificationQueue } from './notification.queue'
import { supabaseAdmin } from '../config/supabase'
import { inAppAdapter } from '../adapters/intelligence/in-app-adapter'
import { smtpAdapter } from '../adapters/intelligence/smtp-adapter'
import { webhookAdapter } from '../adapters/intelligence/webhook-adapter'
import type {
  ChannelAdapter,
  IntelligenceDeliveryPayload,
} from '../adapters/intelligence/ChannelAdapter'
import { logError, logInfo } from '../utils/logger'

export interface IntelligenceAlertPayload {
  event_id: string
  organization_id: string
  sensitivity_level: number
  severity: string
  occurred_at: string
}

interface IntelligenceAlertRuleRow {
  id: string
  owner_id: string
  channels: string[] | null
  condition_config: {
    severity_filter?: string[]
    [key: string]: unknown
  } | null
  last_fired_at: string | null
}

interface DossierLinkRow {
  dossier_id: string
}

interface IntelligenceEventRow {
  id: string
  organization_id: string
  sensitivity_level: number
  severity: string
  occurred_at: string
}

const COALESCING_WINDOW_MS = Number(process.env.INTELLIGENCE_ALERT_COALESCING_WINDOW_MS ?? 300_000)
const FALLBACK_POLL_INTERVAL_MS = 30_000

let pollingTimer: NodeJS.Timeout | null = null

const adapters: Record<ChannelAdapter['name'], ChannelAdapter> = {
  in_app: inAppAdapter,
  smtp: smtpAdapter,
  webhook: webhookAdapter,
}

function toAlertPayload(row: IntelligenceEventRow): IntelligenceAlertPayload {
  return {
    event_id: row.id,
    organization_id: row.organization_id,
    sensitivity_level: row.sensitivity_level,
    severity: row.severity,
    occurred_at: row.occurred_at,
  }
}

async function enqueueAlertCheck(payload: IntelligenceAlertPayload): Promise<void> {
  await notificationQueue.add('intelligence-alert', payload, {
    jobId: `alert-${payload.event_id}-check`,
    removeOnComplete: { count: 500 },
  })
}

async function loadMatchingRules(eventId: string): Promise<IntelligenceAlertRuleRow[]> {
  const { data: links, error: linkError } = await supabaseAdmin
    .from('intelligence_event_dossiers')
    .select('dossier_id')
    .eq('event_id', eventId)

  if (linkError != null) {
    throw new Error(`Failed to load intelligence event dossiers: ${linkError.message}`)
  }

  const dossierIds = ((links ?? []) as DossierLinkRow[]).map((link) => link.dossier_id)
  if (dossierIds.length === 0) {
    return []
  }

  const { data: rules, error: ruleError } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .select('id, owner_id, channels, condition_config, last_fired_at')
    .in('dossier_id', dossierIds)
    .eq('is_active', true)

  if (ruleError != null) {
    throw new Error(`Failed to load intelligence alert rules: ${ruleError.message}`)
  }

  return (rules ?? []) as IntelligenceAlertRuleRow[]
}

async function enqueueMatchingAlertJobs(payload: IntelligenceAlertPayload): Promise<void> {
  const rules = await loadMatchingRules(payload.event_id)
  for (const rule of rules) {
    try {
      await notificationQueue.add('intelligence-alert', payload, {
        jobId: `alert-${payload.event_id}-${rule.id}-check`,
        removeOnComplete: { count: 500 },
      })
    } catch (err) {
      logError('Alert listener: failed to enqueue rule check', err as Error, { ruleId: rule.id })
    }
  }
}

async function scanRecentAlerts(windowMs: number): Promise<void> {
  const since = new Date(Date.now() - windowMs).toISOString()
  const { data: events, error } = await supabaseAdmin
    .from('intelligence_event')
    .select('id, organization_id, sensitivity_level, severity, occurred_at')
    .gt('occurred_at', since)

  if (error != null) {
    throw new Error(`Failed to scan recent intelligence alerts: ${error.message}`)
  }

  for (const event of (events ?? []) as IntelligenceEventRow[]) {
    await enqueueMatchingAlertJobs(toAlertPayload(event))
  }
}

function startPollingFallback(): void {
  if (pollingTimer !== null) {
    return
  }

  void scanRecentAlerts(FALLBACK_POLL_INTERVAL_MS).catch((err) => {
    logError('Alert listener polling fallback scan failed', err as Error)
  })

  pollingTimer = setInterval(() => {
    void scanRecentAlerts(FALLBACK_POLL_INTERVAL_MS).catch((err) => {
      logError('Alert listener polling fallback scan failed', err as Error)
    })
  }, FALLBACK_POLL_INTERVAL_MS)
  pollingTimer.unref?.()
}

export async function startAlertListener(): Promise<void> {
  if (process.env.DATABASE_URL == null || process.env.DATABASE_URL === '') {
    logInfo('Alert listener: DATABASE_URL not configured; using polling fallback')
    startPollingFallback()
    return
  }

  const pg = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await pg.connect()
    await pg.query('LISTEN intelligence_alert')
    if (pollingTimer !== null) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }

    pg.on('notification', (msg) => {
      if (msg.channel !== 'intelligence_alert') return
      void (async () => {
        try {
          const payload = JSON.parse(msg.payload ?? '{}') as IntelligenceAlertPayload
          await enqueueAlertCheck(payload)
        } catch (err) {
          logError('Alert listener: failed to process pg notification', err as Error)
        }
      })()
    })

    pg.on('error', (err) => {
      logError('Alert listener pg connection failed', err)
      setTimeout(() => {
        void startAlertListener().catch((reconnectErr) => {
          logError('Alert listener reconnect failed', reconnectErr as Error)
        })
      }, 5_000).unref?.()
    })

    await scanRecentAlerts(5 * 60 * 1000)
    logInfo('Alert listener started on intelligence_alert channel')
  } catch (err) {
    logError('Alert listener: failed to establish LISTEN; using polling fallback', err as Error)
    startPollingFallback()
  }
}

async function getOwnerProfile(
  ownerId: string,
): Promise<{ clearanceLevel: number; email: string }> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('clearance_level')
    .eq('user_id', ownerId)
    .single()

  if (error != null) {
    throw new Error(`Failed to load alert owner profile: ${error.message}`)
  }

  const userResult = await supabaseAdmin.auth.admin.getUserById(ownerId)

  return {
    clearanceLevel: Number((profile as { clearance_level?: number } | null)?.clearance_level ?? 1),
    email: userResult.data.user?.email ?? '',
  }
}

function severityAllowed(rule: IntelligenceAlertRuleRow, severity: string): boolean {
  const severityFilter = rule.condition_config?.severity_filter
  return (
    !Array.isArray(severityFilter) ||
    severityFilter.length === 0 ||
    severityFilter.includes(severity)
  )
}

function isInsideCoalescingWindow(lastFiredAt: string | null): boolean {
  if (lastFiredAt == null) {
    return false
  }
  return Date.now() - new Date(lastFiredAt).getTime() < COALESCING_WINDOW_MS
}

function buildDeliveryPayload(
  payload: IntelligenceAlertPayload,
  rule: IntelligenceAlertRuleRow,
  recipientEmail: string,
): IntelligenceDeliveryPayload {
  return {
    recipientId: rule.owner_id,
    recipientEmail,
    recipientLanguage: 'en',
    type: 'alert',
    subject: 'Intelligence Update',
    bodyHtml: '<p>A new intelligence update is available.</p>',
    bodyText: 'A new intelligence update is available.',
    deepLink: `/intelligence?event=${encodeURIComponent(payload.event_id)}`,
    genericLabel: 'Intelligence Update',
  }
}

export async function processIntelligenceAlertJob(
  payload: IntelligenceAlertPayload,
): Promise<void> {
  try {
    const rules = await loadMatchingRules(payload.event_id)

    for (const rule of rules) {
      try {
        const { clearanceLevel, email } = await getOwnerProfile(rule.owner_id)
        if (payload.sensitivity_level > clearanceLevel) {
          continue
        }
        if (!severityAllowed(rule, payload.severity)) {
          continue
        }
        if (isInsideCoalescingWindow(rule.last_fired_at)) {
          continue
        }

        const deliveryPayload = buildDeliveryPayload(payload, rule, email)
        for (const channel of rule.channels ?? ['in_app']) {
          const adapter = adapters[channel as ChannelAdapter['name']]
          if (adapter == null) continue
          await adapter.send(deliveryPayload)
        }

        const { error: updateError } = await supabaseAdmin
          .from('intelligence_alert_rules')
          .update({ last_fired_at: new Date().toISOString() })
          .eq('id', rule.id)

        if (updateError != null) {
          throw new Error(`Failed to update alert coalescing stamp: ${updateError.message}`)
        }
      } catch (err) {
        logError('Intelligence alert rule dispatch failed', err as Error, { ruleId: rule.id })
      }
    }
  } catch (err) {
    logError('Intelligence alert job failed', err as Error)
    throw err
  }
}
