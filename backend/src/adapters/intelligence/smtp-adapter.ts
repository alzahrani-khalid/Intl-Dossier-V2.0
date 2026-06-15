import nodemailer from 'nodemailer'
import { logInfo } from '../../utils/logger'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth:
    process.env.SMTP_USER != null || process.env.SMTP_PASS != null
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
})

export const smtpAdapter: ChannelAdapter = {
  name: 'smtp',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    if (process.env.SMTP_HOST == null) {
      logInfo('SMTP adapter: SMTP_HOST not configured; skipping')
      return
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@stats.gov.sa',
      to: payload.recipientEmail,
      subject: payload.subject,
      html: payload.bodyHtml,
      text: payload.bodyText,
    })
  },
}
