import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { enqueueNotificationMock, fetchMock, insertMock, fromMock } = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null })
  return {
    enqueueNotificationMock: vi.fn().mockResolvedValue(undefined),
    fetchMock: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    insertMock,
    fromMock: vi.fn(() => ({ insert: insertMock })),
  }
})

vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: { from: fromMock },
}))

vi.mock('../../src/services/notification.service', () => ({
  enqueueNotification: enqueueNotificationMock,
}))

vi.mock('../../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

import type { IntelligenceDeliveryPayload } from '../../src/adapters/intelligence/ChannelAdapter'
import { inAppAdapter } from '../../src/adapters/intelligence/in-app-adapter'
import { smtpAdapter } from '../../src/adapters/intelligence/smtp-adapter'
import { webhookAdapter } from '../../src/adapters/intelligence/webhook-adapter'

const payload: IntelligenceDeliveryPayload = {
  recipientId: 'user-1',
  recipientEmail: 'user@example.test',
  recipientLanguage: 'en',
  type: 'alert',
  subject: 'Classified subject',
  bodyHtml: '<p>Classified body</p>',
  bodyText: 'Classified body text',
  deepLink: '/intelligence?event=event-1',
  genericLabel: 'Intelligence Update',
}

describe('ALERT-03: channel adapter isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    delete process.env.SMTP_HOST
    delete process.env.INTELLIGENCE_WEBHOOK_URL
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defines adapter names', () => {
    expect(smtpAdapter.name).toBe('smtp')
    expect(inAppAdapter.name).toBe('in_app')
    expect(webhookAdapter.name).toBe('webhook')
  })

  it('enqueues SMTP alerts into intelligence_email_queue (RF-1 on-prem design)', async () => {
    await smtpAdapter.send(payload)

    expect(fromMock).toHaveBeenCalledWith('intelligence_email_queue')
    expect(insertMock).toHaveBeenCalledWith({
      recipient_id: payload.recipientId,
      recipient_email: payload.recipientEmail,
      subject: payload.subject,
      body_html: payload.bodyHtml,
      body_text: payload.bodyText,
      deep_link: payload.deepLink,
    })
  })

  it('enqueues SMTP even when SMTP_HOST is undefined (queue is egress-free)', async () => {
    delete process.env.SMTP_HOST
    await smtpAdapter.send(payload)

    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledWith('intelligence_email_queue')
  })

  it('throws when the intelligence_email_queue insert fails', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'boom' } })

    await expect(smtpAdapter.send(payload)).rejects.toThrow(/failed to enqueue intelligence email/)
  })

  it('keeps the v4.0 email_queue out of intelligence adapters (D-08); smtp uses the dedicated intelligence_email_queue', () => {
    const adapterDir = join(process.cwd(), 'src/adapters/intelligence')
    const read = (file: string): string => readFileSync(join(adapterDir, file), 'utf8')

    // No intelligence adapter may write the v4.0 email_queue table.
    for (const file of ['in-app-adapter.ts', 'smtp-adapter.ts', 'webhook-adapter.ts']) {
      expect(read(file)).not.toContain("from('email_queue')")
    }
    // in_app + webhook touch no email queue at all.
    for (const file of ['in-app-adapter.ts', 'webhook-adapter.ts']) {
      expect(read(file)).not.toContain('email_queue')
    }
    // smtp routes through the dedicated intelligence queue (RF-1).
    expect(read('smtp-adapter.ts')).toContain('intelligence_email_queue')
  })

  it('maps in-app payloads to enqueueNotification data', async () => {
    await inAppAdapter.send(payload)

    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      {
        userId: payload.recipientId,
        type: 'intelligence_alert',
        title: payload.subject,
        message: payload.bodyText.slice(0, 200),
        category: 'workflow',
        priority: 'high',
        actionUrl: payload.deepLink,
      },
      'send-notification',
    )
  })

  it('skips webhook gracefully when INTELLIGENCE_WEBHOOK_URL is undefined', async () => {
    await expect(webhookAdapter.send(payload)).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
