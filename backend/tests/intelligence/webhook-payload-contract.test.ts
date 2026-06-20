import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
}))

vi.mock('../../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

import type { IntelligenceDeliveryPayload } from '../../src/adapters/intelligence/ChannelAdapter'
import { webhookAdapter } from '../../src/adapters/intelligence/webhook-adapter'

describe('ALERT-04: webhook payload zero-leak contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    process.env.INTELLIGENCE_WEBHOOK_URL = 'https://webhook.example.test/hook'
    process.env.APP_URL = 'https://intl.example.test'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.INTELLIGENCE_WEBHOOK_URL
    delete process.env.APP_URL
  })

  it('sends only generic label and deep-link fields to external webhooks', async () => {
    const payload: IntelligenceDeliveryPayload = {
      recipientId: 'user-1',
      recipientEmail: 'user@example.test',
      recipientLanguage: 'en',
      type: 'alert',
      subject: 'Classified: details',
      bodyHtml: '<p>secret</p>',
      bodyText: 'secret',
      deepLink: '/intelligence?event=event-1',
      genericLabel: 'Intelligence Update',
    }

    await webhookAdapter.send(payload)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string) as Record<string, unknown>

    expect(Object.keys(body).sort()).toEqual(
      ['@context', '@type', 'potentialAction', 'text'].sort(),
    )
    expect(body.text).toBe('Intelligence Update')
    expect(JSON.stringify(body)).not.toContain(payload.subject)
    expect(JSON.stringify(body)).not.toContain(payload.bodyHtml)
    expect(JSON.stringify(body)).not.toContain(payload.bodyText)
    expect(body).not.toHaveProperty('signalCount')
    expect(body).not.toHaveProperty('severity')
    expect(body).not.toHaveProperty('dossierName')
    expect(
      (
        body.potentialAction as Array<{
          targets: Array<{ uri: string }>
        }>
      )[0].targets[0].uri,
    ).toContain(payload.deepLink)
  })
})
