/**
 * Arabic Text Normalization Utility
 * Feature: 015-search-retrieval-spec
 * Task: T029
 *
 * Normalizes Arabic text for consistent search matching by:
 * - Removing diacritics (تشكيل)
 * - Normalizing letter variants (alef, taa marbuta, alef maksura)
 * - Preserving semantic meaning while improving search recall
 */

/**
 * Normalize Arabic text for search indexing and querying
 *
 * @param text - Arabic text to normalize
 * @returns Normalized Arabic text
 *
 * @example
 * normalizeArabic('أَهْدَاف') // Returns: 'اهداف'
 * normalizeArabic('التنمية المستدامة') // Returns: 'التنميه المستدامه'
 */
export function normalizeArabic(text: string): string {
  if (!text) return text;

  return text
    // Remove diacritics (U+064B to U+065F)
    // Includes: fatha, damma, kasra, shadda, sukun, tanween, etc.
    .replace(/[\u064B-\u065F]/g, '')

    // Normalize alef variants to plain alef (ا)
    // أ (hamza above), إ (hamza below), آ (madda) → ا
    .replace(/[أإآ]/g, 'ا')

    // Normalize taa marbuta (ة) to haa (ه)
    // Common in feminine nouns and adjectives
    .replace(/ة/g, 'ه')

    // Normalize alef maksura (ى) to yaa (ي)
    // Often used at end of words
    .replace(/ى/g, 'ي')

    // Trim whitespace
    .trim();
}

/**
 * Check if text contains Arabic characters
 *
 * @param text - Text to check
 * @returns True if text contains Arabic characters
 */
export function hasArabicCharacters(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Detect primary language of text
 *
 * @param text - Text to analyze
 * @returns 'ar' for Arabic, 'en' for English, 'mixed' for both
 */
export function detectLanguage(text: string): 'ar' | 'en' | 'mixed' {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

  if (arabicChars > 0 && englishChars > 0) {
    return 'mixed';
  }

  if (arabicChars > 0) {
    return 'ar';
  }

  return 'en';
}

/**
 * Normalize text for search (handles both Arabic and English)
 *
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeSearchText(text: string): string {
  if (!text) return text;

  let normalized = text.toLowerCase().trim();

  // Apply Arabic normalization if text contains Arabic
  if (hasArabicCharacters(normalized)) {
    normalized = normalizeArabic(normalized);
  }

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}
