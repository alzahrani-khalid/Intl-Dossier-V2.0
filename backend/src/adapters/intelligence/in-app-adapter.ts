import { enqueueNotification } from '../../services/notification.service'
import type { NotificationJobData } from '../../queues/notification.queue'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

export const inAppAdapter: ChannelAdapter = {
  name: 'in_app',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    const data: NotificationJobData = {
      userId: payload.recipientId,
      type: payload.type === 'digest' ? 'intelligence_digest' : 'intelligence_alert',
      title: payload.subject,
      message: payload.bodyText.slice(0, 200),
      category: 'workflow',
      priority: payload.type === 'alert' ? 'high' : 'normal',
      actionUrl: payload.deepLink,
    }

    await enqueueNotification(data, 'send-notification')
  },
}
