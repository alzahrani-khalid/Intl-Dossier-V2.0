/**
 * Map an i18n language code to a BCP-47 locale safe for Intl number formatting.
 *
 * Bare 'ar' resolves to the `latn` numbering system in Chrome
 * (Intl.NumberFormat('ar').resolvedOptions().numberingSystem === 'latn'),
 * which silently drops Arabic-Indic digits in the Arabic UI. 'ar-SA'
 * resolves to `arab` (verified Chrome 148, round-11 UAT 2026-06-10).
 */
export const toFormatLocale = (language: string): string =>
  language === 'ar' || language.startsWith('ar-') ? 'ar-SA' : language
