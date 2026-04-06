/**
 * Bilingual digest email template rendering service.
 *
 * Renders daily and weekly digest emails in English and Arabic
 * with inline CSS, table-based layout, and RTL support.
 */

export interface DigestContent {
  watchlist_items: Array<{ name: string; type: string }>
  upcoming_deadlines: Array<{ title: string; deadline: string }>
  pending_assignments: Array<{ title: string; assignee: string }>
  active_commitments: Array<{ title: string; status: string }>
  recent_notifications: Array<{ title: string; created_at: string }>
}

interface DigestRenderResult {
  subject: string
  bodyHtml: string
  bodyText: string
}

// Color palette (matches alert templates)
const COLORS = {
  background: '#f4f4f5',
  card: '#ffffff',
  text: '#18181b',
  textSecondary: '#3f3f46',
  success: '#166534',
  muted: '#71717a',
  border: '#e4e4e7',
} as const

const i18n = {
  en: {
    dailySubject: (date: string): string => `Your Daily Briefing -- ${date}`,
    weeklySubject: (range: string): string => `Weekly Summary -- ${range}`,
    dailyHeading: 'Daily Briefing',
    weeklyHeading: 'Weekly Summary',
    watchlistSection: 'Watchlist Updates',
    deadlinesSection: 'Upcoming Deadlines',
    assignmentsSection: 'Pending Assignments',
    commitmentsSection: 'Active Commitments',
    notificationsSection: 'Recent Notifications',
    emptyState: "No pending items this period. You're all caught up!",
    cta: 'View in Intl Dossier',
    unsubscribe: 'Manage notification preferences',
    typeLabel: 'Type',
    deadlineLabel: 'Due',
    statusLabel: 'Status',
    assigneeLabel: 'Assignee',
    dateLabel: 'Date',
  },
  ar: {
    dailySubject: (date: string): string => `ملخصك اليومي -- ${date}`,
    weeklySubject: (range: string): string => `الملخص الاسبوعي -- ${range}`,
    dailyHeading: 'الملخص اليومي',
    weeklyHeading: 'الملخص الاسبوعي',
    watchlistSection: 'تحديثات قائمة المتابعة',
    deadlinesSection: 'المواعيد النهائية القادمة',
    assignmentsSection: 'المهام المعلقة',
    commitmentsSection: 'الالتزامات النشطة',
    notificationsSection: 'الاشعارات الاخيرة',
    emptyState: 'لا توجد عناصر معلقة في هذه الفترة. انت على اطلاع بكل شيء!',
    cta: 'عرض في الملف الدولي',
    unsubscribe: 'ادارة تفضيلات الاشعارات',
    typeLabel: 'النوع',
    deadlineLabel: 'الموعد',
    statusLabel: 'الحالة',
    assigneeLabel: 'المسؤول',
    dateLabel: 'التاريخ',
  },
} as const

/**
 * Escape HTML entities to prevent XSS in email templates (T-16-06).
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isContentEmpty(content: DigestContent): boolean {
  return (
    content.watchlist_items.length === 0 &&
    content.upcoming_deadlines.length === 0 &&
    content.pending_assignments.length === 0 &&
    content.active_commitments.length === 0 &&
    content.recent_notifications.length === 0
  )
}

function renderSection(title: string, rows: string, dir: string): string {
  if (rows.length === 0) return ''
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;" dir="${dir}">
      <tr>
        <td style="padding:8px 16px;background:${COLORS.background};border-radius:4px;">
          <strong style="color:${COLORS.text};font-size:14px;">${escapeHtml(title)}</strong>
        </td>
      </tr>
      ${rows}
    </table>`
}

function renderRow(cells: string, dir: string): string {
  return `
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid ${COLORS.border};" dir="${dir}">
          ${cells}
        </td>
      </tr>`
}

function buildWatchlistRows(items: DigestContent['watchlist_items'], lang: 'ar' | 'en', dir: string): string {
  const t = i18n[lang]
  return items
    .map((item) =>
      renderRow(
        `<span style="color:${COLORS.text};font-size:13px;">${escapeHtml(item.name)}</span>
         <span style="color:${COLORS.muted};font-size:12px;margin-${dir === 'rtl' ? 'right' : 'left'}:8px;">(${t.typeLabel}: ${escapeHtml(item.type)})</span>`,
        dir,
      ),
    )
    .join('')
}

function buildDeadlineRows(items: DigestContent['upcoming_deadlines'], lang: 'ar' | 'en', dir: string): string {
  const t = i18n[lang]
  return items
    .map((item) =>
      renderRow(
        `<span style="color:${COLORS.text};font-size:13px;">${escapeHtml(item.title)}</span>
         <span style="color:${COLORS.muted};font-size:12px;margin-${dir === 'rtl' ? 'right' : 'left'}:8px;">(${t.deadlineLabel}: ${escapeHtml(item.deadline)})</span>`,
        dir,
      ),
    )
    .join('')
}

function buildAssignmentRows(items: DigestContent['pending_assignments'], lang: 'ar' | 'en', dir: string): string {
  const t = i18n[lang]
  return items
    .map((item) =>
      renderRow(
        `<span style="color:${COLORS.text};font-size:13px;">${escapeHtml(item.title)}</span>
         <span style="color:${COLORS.muted};font-size:12px;margin-${dir === 'rtl' ? 'right' : 'left'}:8px;">(${t.assigneeLabel}: ${escapeHtml(item.assignee)})</span>`,
        dir,
      ),
    )
    .join('')
}

function buildCommitmentRows(items: DigestContent['active_commitments'], lang: 'ar' | 'en', dir: string): string {
  const t = i18n[lang]
  return items
    .map((item) =>
      renderRow(
        `<span style="color:${COLORS.text};font-size:13px;">${escapeHtml(item.title)}</span>
         <span style="color:${COLORS.muted};font-size:12px;margin-${dir === 'rtl' ? 'right' : 'left'}:8px;">(${t.statusLabel}: ${escapeHtml(item.status)})</span>`,
        dir,
      ),
    )
    .join('')
}

function buildNotificationRows(items: DigestContent['recent_notifications'], lang: 'ar' | 'en', dir: string): string {
  const t = i18n[lang]
  return items
    .map((item) =>
      renderRow(
        `<span style="color:${COLORS.text};font-size:13px;">${escapeHtml(item.title)}</span>
         <span style="color:${COLORS.muted};font-size:12px;margin-${dir === 'rtl' ? 'right' : 'left'}:8px;">(${t.dateLabel}: ${escapeHtml(item.created_at)})</span>`,
        dir,
      ),
    )
    .join('')
}

function renderDigestHtml(
  heading: string,
  periodLabel: string,
  content: DigestContent,
  lang: 'ar' | 'en',
  ctaText: string,
  unsubText: string,
): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const t = i18n[lang]

  if (isContentEmpty(content)) {
    return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.background};font-family:Arial,Helvetica,sans-serif;" dir="${dir}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.background};padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.card};border-radius:8px;overflow:hidden;">
      <tr><td style="padding:24px 32px;background:${COLORS.success};">
        <h1 style="margin:0;color:#ffffff;font-size:20px;" dir="${dir}">${escapeHtml(heading)}</h1>
        <p style="margin:4px 0 0;color:#dcfce7;font-size:13px;" dir="${dir}">${escapeHtml(periodLabel)}</p>
      </td></tr>
      <tr><td style="padding:32px;text-align:center;" dir="${dir}">
        <p style="color:${COLORS.textSecondary};font-size:15px;margin:0;">${escapeHtml(t.emptyState)}</p>
      </td></tr>
      <tr><td style="padding:16px 32px;text-align:center;">
        <a href="/dashboard" style="display:inline-block;padding:10px 24px;background:${COLORS.success};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">${escapeHtml(ctaText)}</a>
      </td></tr>
      <tr><td style="padding:16px 32px;text-align:center;border-top:1px solid ${COLORS.border};">
        <a href="/settings?section=notifications" style="color:${COLORS.muted};font-size:12px;text-decoration:underline;">${escapeHtml(unsubText)}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
  }

  const sections = [
    content.watchlist_items.length > 0
      ? renderSection(t.watchlistSection, buildWatchlistRows(content.watchlist_items, lang, dir), dir)
      : '',
    content.upcoming_deadlines.length > 0
      ? renderSection(t.deadlinesSection, buildDeadlineRows(content.upcoming_deadlines, lang, dir), dir)
      : '',
    content.pending_assignments.length > 0
      ? renderSection(t.assignmentsSection, buildAssignmentRows(content.pending_assignments, lang, dir), dir)
      : '',
    content.active_commitments.length > 0
      ? renderSection(t.commitmentsSection, buildCommitmentRows(content.active_commitments, lang, dir), dir)
      : '',
    content.recent_notifications.length > 0
      ? renderSection(t.notificationsSection, buildNotificationRows(content.recent_notifications, lang, dir), dir)
      : '',
  ]
    .filter((s) => s.length > 0)
    .join('')

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.background};font-family:Arial,Helvetica,sans-serif;" dir="${dir}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.background};padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.card};border-radius:8px;overflow:hidden;">
      <tr><td style="padding:24px 32px;background:${COLORS.success};">
        <h1 style="margin:0;color:#ffffff;font-size:20px;" dir="${dir}">${escapeHtml(heading)}</h1>
        <p style="margin:4px 0 0;color:#dcfce7;font-size:13px;" dir="${dir}">${escapeHtml(periodLabel)}</p>
      </td></tr>
      <tr><td style="padding:24px 32px;" dir="${dir}">
        ${sections}
      </td></tr>
      <tr><td style="padding:16px 32px;text-align:center;">
        <a href="/dashboard" style="display:inline-block;padding:10px 24px;background:${COLORS.success};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">${escapeHtml(ctaText)}</a>
      </td></tr>
      <tr><td style="padding:16px 32px;text-align:center;border-top:1px solid ${COLORS.border};">
        <a href="/settings?section=notifications" style="color:${COLORS.muted};font-size:12px;text-decoration:underline;">${escapeHtml(unsubText)}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function renderDigestText(
  heading: string,
  periodLabel: string,
  content: DigestContent,
  lang: 'ar' | 'en',
): string {
  const t = i18n[lang]

  if (isContentEmpty(content)) {
    return `${heading}\n${periodLabel}\n\n${t.emptyState}\n`
  }

  const lines: string[] = [`${heading}`, `${periodLabel}`, '']

  if (content.watchlist_items.length > 0) {
    lines.push(`--- ${t.watchlistSection} ---`)
    content.watchlist_items.forEach((item) => {
      lines.push(`- ${item.name} (${t.typeLabel}: ${item.type})`)
    })
    lines.push('')
  }

  if (content.upcoming_deadlines.length > 0) {
    lines.push(`--- ${t.deadlinesSection} ---`)
    content.upcoming_deadlines.forEach((item) => {
      lines.push(`- ${item.title} (${t.deadlineLabel}: ${item.deadline})`)
    })
    lines.push('')
  }

  if (content.pending_assignments.length > 0) {
    lines.push(`--- ${t.assignmentsSection} ---`)
    content.pending_assignments.forEach((item) => {
      lines.push(`- ${item.title} (${t.assigneeLabel}: ${item.assignee})`)
    })
    lines.push('')
  }

  if (content.active_commitments.length > 0) {
    lines.push(`--- ${t.commitmentsSection} ---`)
    content.active_commitments.forEach((item) => {
      lines.push(`- ${item.title} (${t.statusLabel}: ${item.status})`)
    })
    lines.push('')
  }

  if (content.recent_notifications.length > 0) {
    lines.push(`--- ${t.notificationsSection} ---`)
    content.recent_notifications.forEach((item) => {
      lines.push(`- ${item.title} (${t.dateLabel}: ${item.created_at})`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Render a daily digest email template.
 */
export function renderDailyDigestTemplate(
  language: 'ar' | 'en',
  date: string,
  content: DigestContent,
): DigestRenderResult {
  const t = i18n[language]
  const subject = t.dailySubject(date)

  return {
    subject,
    bodyHtml: renderDigestHtml(t.dailyHeading, date, content, language, t.cta, t.unsubscribe),
    bodyText: renderDigestText(t.dailyHeading, date, content, language),
  }
}

/**
 * Render a weekly digest email template.
 */
export function renderWeeklyDigestTemplate(
  language: 'ar' | 'en',
  dateRange: string,
  content: DigestContent,
): DigestRenderResult {
  const t = i18n[language]
  const subject = t.weeklySubject(dateRange)

  return {
    subject,
    bodyHtml: renderDigestHtml(t.weeklyHeading, dateRange, content, language, t.cta, t.unsubscribe),
    bodyText: renderDigestText(t.weeklyHeading, dateRange, content, language),
  }
}
