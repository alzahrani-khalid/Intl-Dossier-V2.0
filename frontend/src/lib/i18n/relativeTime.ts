/**
 * formatRelativeTimeShort — Wave 0 (Phase 41) bilingual handoff-style relative time.
 *
 * Rules (per 41-RESEARCH §5 Open Question + handoff `app.css` #L444-446 act-row time):
 *   - same calendar day  → 'HH:mm'
 *   - 1 day ago          → 'yday' (en) / 'أمس' (ar)
 *   - 2..7 days ago      → 'Nd' (en) / 'Nي' (ar) using Arabic-Indic digits
 *   - > 7 days           → 'd MMM' localized (date-fns ar / enUS locale)
 *   - invalid input      → '—'
 */

import { format, differenceInCalendarDays } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { toArDigits } from '@/lib/i18n/toArDigits'

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
    return toArDigits(`${hh}:${mm}`, lang)
  }
  if (days === 1) return lang === 'ar' ? 'أمس' : 'yday'
  if (days >= 2 && days <= 7) {
    const suffix = lang === 'ar' ? 'ي' : 'd'
    return `${toArDigits(days, lang)}${suffix}`
  }
  // > 7 days (or future): localized 'd MMM' (e.g. '22 Apr')
  const formatted = format(d, 'd MMM', { locale: lang === 'ar' ? ar : enUS })
  return toArDigits(formatted, lang)
}
