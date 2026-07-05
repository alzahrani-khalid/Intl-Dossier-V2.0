/**
 * formatRelativeTimeShort — Wave 0 (Phase 41) bilingual handoff-style relative time.
 *
 * Rules (per 41-RESEARCH §5 Open Question + handoff `app.css` #L444-446 act-row time):
 *   - same calendar day  → 'HH:mm'
 *   - 1 day ago          → 'yday' (en) / 'أمس' (ar)
 *   - 2..7 days ago      → 'Nd' (en) / 'Nي' (ar) — Latin digits per policy D (Phase 82)
 *   - > 7 days           → 'd MMM' localized (date-fns ar / enUS locale)
 *   - invalid input      → '—'
 *
 * Digits are Latin in BOTH locales (policy D); only the unit suffix ('ي') and
 * date-fns month name are localized for Arabic.
 */

import { format, differenceInCalendarDays } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export function formatRelativeTimeShort(
  timestamp: string | Date,
  lang: string,
  now: Date = new Date(),
): string {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  if (Number.isNaN(d.getTime())) return '—'
  const days = differenceInCalendarDays(now, d)
  if (days === 0) {
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }
  if (days === 1) return lang === 'ar' ? 'أمس' : 'yday'
  if (days >= 2 && days <= 7) {
    const suffix = lang === 'ar' ? 'ي' : 'd'
    return `${days}${suffix}`
  }
  // > 7 days (or future): localized 'd MMM' (e.g. '22 Apr'), Latin digits.
  return format(d, 'd MMM', { locale: lang === 'ar' ? ar : enUS })
}
