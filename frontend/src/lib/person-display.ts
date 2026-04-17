/**
 * Phase 32 D-11 + D-15: shared display helpers for persons + elected-officials lists.
 *
 * These helpers produce locale-aware primary labels and nationality badge text
 * for persons list rows. Pure functions — no React / Supabase dependencies.
 */

export interface PersonDisplayInput {
  honorific_en?: string | null
  honorific_ar?: string | null
  first_name_en?: string | null
  last_name_en?: string | null
  first_name_ar?: string | null
  last_name_ar?: string | null
  // dossiers.name_en / name_ar legacy fallback (D-15)
  name_en?: string | null
  name_ar?: string | null
}

/**
 * D-15: compose the list-row primary label per locale.
 * - first + last populated → '[honorific ]? first last'
 * - last only (single-word) → '[honorific ]? last'
 * - neither populated        → fall back to dossiers.name_en / name_ar
 */
export const formatPersonLabel = (p: PersonDisplayInput, locale: 'en' | 'ar'): string => {
  const honorific = locale === 'en' ? p.honorific_en : p.honorific_ar
  const first = locale === 'en' ? p.first_name_en : p.first_name_ar
  const last = locale === 'en' ? p.last_name_en : p.last_name_ar
  const fallback = locale === 'en' ? p.name_en : p.name_ar

  const honPrefix = honorific != null && honorific.trim() !== '' ? `${honorific.trim()} ` : ''

  const hasFirst = first != null && first.trim() !== ''
  const hasLast = last != null && last.trim() !== ''

  if (hasFirst && hasLast) {
    return `${honPrefix}${(first as string).trim()} ${(last as string).trim()}`
  }
  if (hasLast) {
    return `${honPrefix}${(last as string).trim()}`
  }
  return fallback ?? ''
}

/**
 * D-11: convert an ISO-2 country code (e.g. 'SA') into the flag emoji
 * via two Unicode Regional Indicator Symbols. No image asset needed.
 * Returns empty string for invalid inputs.
 */
export const isoToFlagEmoji = (iso2: string | null | undefined): string => {
  if (iso2 == null) return ''
  const code = iso2.trim().toUpperCase()
  if (code.length !== 2) return ''
  if (!/^[A-Z]{2}$/.test(code)) return ''
  const A = 0x41
  const REGIONAL_INDICATOR_A = 0x1f1e6
  const first = REGIONAL_INDICATOR_A + (code.charCodeAt(0) - A)
  const second = REGIONAL_INDICATOR_A + (code.charCodeAt(1) - A)
  return String.fromCodePoint(first) + String.fromCodePoint(second)
}

/**
 * D-11 composite: '🇸🇦 SA' badge text. Returns empty string when iso2 is missing
 * or invalid (D-14: render nothing rather than a placeholder).
 */
export const nationalityBadgeText = (iso2: string | null | undefined): string => {
  const flag = isoToFlagEmoji(iso2)
  if (iso2 == null || flag === '') return ''
  return `${flag} ${iso2.trim().toUpperCase()}`
}
