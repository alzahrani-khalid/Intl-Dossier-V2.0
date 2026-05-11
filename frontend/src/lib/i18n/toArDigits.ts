const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const

/**
 * Transform Western Arabic numerals (0-9) in a string to Arabic-Indic digits when lang is 'ar'.
 *
 * Used for kcard count, calendar day numbers, overdue chip counters, week-list day numbers.
 *
 * Landmine: never compose with `toLocaleString('ar')` — that already returns Indic digits and
 * passing them through this transform is a no-op for Indic chars but leaves the door open for
 * double-conversion bugs if upstream code changes locale strategy. Always pass raw Western
 * numerals into this function.
 */
export function toArDigits(input: string | number, lang: string): string {
  const s = String(input)
  if (lang !== 'ar') return s
  return s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)] ?? d)
}
