/**
 * Map an i18n language to a BCP-47 locale whose Intl numbering system is
 * ALWAYS Latin (policy D, Phase 82 / DESIGN §7.4). '-u-nu-latn' pins latn
 * explicitly — bare 'ar' happens to resolve latn in Chrome 148 / Node 22,
 * but the Unicode extension is CLDR-drift-proof. Never return the Arabic-Indic
 * ('arab') locale. Arabic month/unit names are preserved for non-digit consumers.
 */
export const toFormatLocale = (language: string): string =>
  language === 'ar' || language.startsWith('ar-') ? 'ar-u-nu-latn' : language
