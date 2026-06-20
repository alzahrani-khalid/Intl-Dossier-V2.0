import { logInfo } from '../../utils/logger'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

export const webhookAdapter: ChannelAdapter = {
  name: 'webhook',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    const webhookUrl = process.env.INTELLIGENCE_WEBHOOK_URL
    if (webhookUrl == null) {
      logInfo('Webhook adapter: INTELLIGENCE_WEBHOOK_URL not configured; skipping')
      return
    }

    const appUrl = process.env.APP_URL ?? ''
    const body = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      text: payload.genericLabel,
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Open in Dossier',
          targets: [{ os: 'default', uri: `${appUrl}${payload.deepLink}` }],
        },
      ],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  },
}
