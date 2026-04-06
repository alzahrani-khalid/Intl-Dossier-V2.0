/**
 * Bilingual email template service for alert notifications.
 *
 * Renders table-based, inline-styled HTML emails in English or Arabic.
 * Arabic templates use dir="rtl" throughout for correct rendering.
 * All template variables are HTML-escaped to prevent injection (T-16-01).
 */

interface AlertEmailData {
  title: string
  message: string
  actionUrl: string
  category?: string
}

interface RenderedEmail {
  subject: string
  bodyHtml: string
  bodyText: string
}

const COLORS = {
  bg: '#f4f4f5',
  content: '#ffffff',
  heading: '#18181b',
  body: '#3f3f46',
  cta: '#166534',
  ctaText: '#ffffff',
  footer: '#71717a',
  border: '#e4e4e7',
} as const

const I18N = {
  en: {
    subjectPrefix: '[Action Required]',
    ctaButton: 'View in Intl Dossier',
    unsubscribe: 'Unsubscribe from these emails',
    footerReason:
      'You received this because email notifications are enabled in your preferences.',
  },
  ar: {
    subjectPrefix: '[\u0627\u062C\u0631\u0627\u0621 \u0645\u0637\u0644\u0648\u0628]',
    ctaButton: '\u0639\u0631\u0636 \u0641\u064A \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062F\u0648\u0644\u064A',
    unsubscribe: '\u0627\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0626\u0644',
    footerReason:
      '\u062A\u0644\u0642\u064A\u062A \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0644\u0627\u0646 \u0627\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0627\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0641\u0639\u0644\u0629 \u0641\u064A \u0627\u0639\u062F\u0627\u062F\u0627\u062A\u0643.',
  },
} as const

/**
 * Escape HTML entities to prevent injection in email templates (T-16-01).
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Render a bilingual alert email template.
 *
 * @param language - 'ar' or 'en'
 * @param data - Title, message, and action URL for the notification
 * @returns Rendered email with subject, HTML body, and plain text body
 */
export function renderAlertEmailTemplate(
  language: 'ar' | 'en',
  data: AlertEmailData,
): RenderedEmail {
  const strings = I18N[language]
  const dir = language === 'ar' ? 'rtl' : 'ltr'
  const safeTitle = escapeHtml(data.title)
  const safeMessage = escapeHtml(data.message)

  const subject = `${strings.subjectPrefix} ${data.title}`

  const bodyHtml = `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body dir="${dir}" style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td dir="${dir}" style="background-color: ${COLORS.content}; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td dir="${dir}" style="padding-bottom: 16px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: ${COLORS.heading};">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td dir="${dir}" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5; color: ${COLORS.body};">${safeMessage}</p>
            </td>
          </tr>
          <tr>
            <td dir="${dir}" style="padding-bottom: 32px;">
              <a href="${data.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${COLORS.cta}; color: ${COLORS.ctaText}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">${strings.ctaButton}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td dir="${dir}" style="padding: 16px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.footer};">${strings.footerReason}</p>
        <a href="/settings?section=notifications" style="font-size: 12px; color: ${COLORS.footer}; text-decoration: underline;">${strings.unsubscribe}</a>
      </td>
    </tr>
  </table>
</body>
</html>`

  const bodyText = `${data.title}

${data.message}

${strings.ctaButton}: ${data.actionUrl}

---
${strings.footerReason}
${strings.unsubscribe}: /settings?section=notifications`

  return { subject, bodyHtml, bodyText }
}

/**
 * Map notification type to email_queue template_type enum value.
 *
 * All alert-style notifications (assignment, deadline, lifecycle) map
 * to the 'notification_alert' template type.
 */
export function mapNotificationTypeToTemplate(type: string): string {
  switch (type) {
    case 'assignment':
    case 'deadline':
    case 'lifecycle':
    default:
      return 'notification_alert'
  }
}
