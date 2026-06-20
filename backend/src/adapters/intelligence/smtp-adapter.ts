import { supabaseAdmin } from '../../config/supabase'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

/**
 * On-prem SMTP channel (ALERT-03, research RF-1).
 *
 * The adapter ENQUEUES the alert/digest into `intelligence_email_queue` — it does
 * not send directly. A separate on-prem nodemailer drain worker sends queued rows
 * once an on-prem SMTP relay (`SMTP_HOST`, customer-TBD) is configured. Queuing
 * keeps the path egress-free and verifiable without SMTP infrastructure, and is
 * isolated from the v4.0 `email_queue` (D-08).
 */
export const smtpAdapter: ChannelAdapter = {
  name: 'smtp',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    const { error } = await supabaseAdmin.from('intelligence_email_queue').insert({
      recipient_id: payload.recipientId,
      recipient_email: payload.recipientEmail,
      subject: payload.subject,
      body_html: payload.bodyHtml,
      body_text: payload.bodyText,
      deep_link: payload.deepLink,
    })

    if (error != null) {
      throw new Error(`SMTP adapter: failed to enqueue intelligence email: ${error.message}`)
    }
  },
}
