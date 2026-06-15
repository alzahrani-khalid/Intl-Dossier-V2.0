import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createTransportMock, enqueueNotificationMock, fetchMock, sendMailMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'smtp-1' })
  return {
    createTransportMock: vi.fn(() => ({ sendMail: sendMailMock })),
    enqueueNotificationMock: vi.fn().mockResolvedValue(undefined),
    fetchMock: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    sendMailMock,
  }
})

vi.mock('nodemailer', () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
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

  it('sends SMTP directly through nodemailer when SMTP_HOST is configured', async () => {
    process.env.SMTP_HOST = 'smtp.internal'
    process.env.SMTP_FROM = 'alerts@example.test'

    await smtpAdapter.send(payload)

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'alerts@example.test',
      to: payload.recipientEmail,
      subject: payload.subject,
      html: payload.bodyHtml,
      text: payload.bodyText,
    })
  })

  it('does not reference email queue persistence from intelligence adapters', () => {
    const adapterDir = join(process.cwd(), 'src/adapters/intelligence')
    const sources = ['in-app-adapter.ts', 'smtp-adapter.ts', 'webhook-adapter.ts'].map((file) =>
      readFileSync(join(adapterDir, file), 'utf8'),
    )

    for (const source of sources) {
      expect(source).not.toContain('email_queue')
      expect(source).not.toContain('intelligence_email_queue')
    }
  })

  it('skips SMTP gracefully when SMTP_HOST is undefined', async () => {
    await expect(smtpAdapter.send(payload)).resolves.toBeUndefined()
    expect(sendMailMock).not.toHaveBeenCalled()
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
